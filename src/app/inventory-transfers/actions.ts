
'use server';

import { connectToTenantDb } from '@/db';
import { inventoryTransfers, products, journalEntries, journalEntryLines } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const transferSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().min(1),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "قيد النقل", "مكتملة", "ملغى"]),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
export type Product = typeof products.$inferSelect;
export type Warehouse = { id: string; name: string };

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}

export async function addTransfer(values: TransferFormValues) {
  const db = await getDb();
  const product = await db.query.products.findFirst({ where: eq(products.id, values.productId) });
  if (!product || product.quantity < values.quantity) {
    throw new Error("الكمية المطلوبة للتحويل غير متوفرة في المخزون.");
  }
  
  const newId = `TRN${Date.now()}`;
  await db.insert(inventoryTransfers).values({ ...values, id: newId });
  revalidatePath('/inventory-transfers');
}

export async function updateTransferStatus(id: string, status: TransferFormValues['status']) {
  const db = await getDb();
  const transfer = await db.query.inventoryTransfers.findFirst({ where: eq(inventoryTransfers.id, id) });
  if (!transfer) throw new Error("لم يتم العثور على طلب التحويل.");

  await db.transaction(async (tx) => {
    if (status === 'مكتملة' && transfer.status === 'قيد النقل') {
        const product = await tx.query.products.findFirst({ where: eq(products.id, transfer.productId) });
        if (!product) throw new Error("لم يتم العثور على المنتج للتحويل.");
        
        // This is where you would handle multi-warehouse inventory.
        // For now, it's a logical no-op as total inventory doesn't change.
        // But we can create a journal entry to reflect the movement of value.
        const transferValue = (parseFloat(product.costPrice) || 0) * transfer.quantity;
        const fromWarehouseAccount = '1301'; // Placeholder for 'From' warehouse inventory account
        const toWarehouseAccount = '1302'; // Placeholder for 'To' warehouse inventory account
        const newEntryId = `JV-TRN-${id}`;
        
        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: transfer.date,
            description: `تحويل مخزون: ${transfer.quantity} من ${product.name} من ${transfer.fromWarehouseId} إلى ${transfer.toWarehouseId}`,
            totalAmount: String(transferValue),
            status: "مرحل",
            sourceModule: "InventoryTransfer",
            sourceDocumentId: transfer.id,
        });

        await tx.insert(journalEntryLines).values([
            // Debit the 'To' warehouse account (asset increases)
            { journalEntryId: newEntryId, accountId: toWarehouseAccount, debit: String(transferValue), credit: '0', description: `استلام ${product.name}` },
            // Credit the 'From' warehouse account (asset decreases)
            { journalEntryId: newEntryId, accountId: fromWarehouseAccount, debit: '0', credit: String(transferValue), description: `إرسال ${product.name}` },
        ]);
    }
     if (status === 'قيد النقل' && transfer.status === 'مسودة') {
        const product = await tx.query.products.findFirst({ where: eq(products.id, transfer.productId) });
        if (!product || product.quantity < transfer.quantity) {
            throw new Error(`الكمية المطلوبة (${transfer.quantity}) غير متوفرة في المخزون للمنتج ${product?.name}. الكمية الحالية: ${product?.quantity || 0}.`);
        }
        // This is a simplification. With multi-warehouse stock, you'd deduct from the 'from' warehouse.
        await tx.update(products)
            .set({ quantity: sql`${products.quantity} - ${transfer.quantity}`})
            .where(eq(products.id, transfer.productId));
    }
     if (status === 'مسودة' && transfer.status === 'قيد النقل') {
        // Reverse the deduction if moved back to draft
        await tx.update(products)
            .set({ quantity: sql`${products.quantity} + ${transfer.quantity}`})
            .where(eq(products.id, transfer.productId));
    }
    
    await tx.update(inventoryTransfers).set({ status }).where(eq(inventoryTransfers.id, id));
  });

  revalidatePath('/inventory-transfers');
  revalidatePath('/inventory');
  revalidatePath('/general-ledger');
}

export async function deleteTransfer(id: string) {
  const db = await getDb();
  const transfer = await db.query.inventoryTransfers.findFirst({ where: eq(inventoryTransfers.id, id) });
  if (transfer && transfer.status !== 'مسودة') {
      throw new Error("لا يمكن حذف طلب تحويل ليس في حالة 'مسودة'.");
  }
  await db.delete(inventoryTransfers).where(eq(inventoryTransfers.id, id));
  revalidatePath('/inventory-transfers');
}

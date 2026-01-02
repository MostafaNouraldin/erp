

'use server';

import { connectToTenantDb } from '@/db';
import { inventoryTransfers, products, journalEntries, journalEntryLines, inventoryMovementLog } from '@/db/schema';
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
        
        await tx.insert(inventoryMovementLog).values({
            productId: transfer.productId,
            quantity: transfer.quantity,
            type: 'IN', // 'IN' for the receiving warehouse, the 'OUT' was already logged
            sourceType: 'تحويل مخزون',
            sourceId: id,
        });

        // In a real multi-warehouse system, you'd add to the 'to' warehouse.
        // Here we add it back to the main quantity to simulate completion.
         await tx.update(products)
            .set({ quantity: sql`${products.quantity} + ${transfer.quantity}`})
            .where(eq(products.id, transfer.productId));
    }
     if (status === 'قيد النقل' && transfer.status === 'مسودة') {
        const product = await tx.query.products.findFirst({ where: eq(products.id, transfer.productId) });
        if (!product || product.quantity < transfer.quantity) {
            throw new Error(`الكمية المطلوبة (${transfer.quantity}) غير متوفرة في المخزون للمنتج ${product?.name || ''}. الكمية الحالية: ${product?.quantity || 0}.`);
        }
        await tx.update(products)
            .set({ quantity: sql`${products.quantity} - ${transfer.quantity}`})
            .where(eq(products.id, transfer.productId));
        
        await tx.insert(inventoryMovementLog).values({
            productId: transfer.productId,
            quantity: transfer.quantity,
            type: 'OUT',
            sourceType: 'تحويل مخزون',
            sourceId: id,
        });
    }
     if (status === 'مسودة' && transfer.status === 'قيد النقل') {
        // Reverse the deduction if moved back to draft
        await tx.update(products)
            .set({ quantity: sql`${products.quantity} + ${transfer.quantity}`})
            .where(eq(products.id, transfer.productId));
        // You might want to delete the movement log entry as well
        // await tx.delete(inventoryMovementLog).where(...)
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

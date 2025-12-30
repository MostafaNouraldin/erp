
'use server';

import { db } from '@/db';
import { inventoryTransfers, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

export async function addTransfer(values: TransferFormValues) {
  const product = await db.query.products.findFirst({ where: eq(products.id, values.productId) });
  if (!product || product.quantity < values.quantity) {
    throw new Error("الكمية المطلوبة للتحويل غير متوفرة في المخزون.");
  }
  
  const newId = `TRN${Date.now()}`;
  await db.insert(inventoryTransfers).values({ ...values, id: newId });
  revalidatePath('/inventory-transfers');
}

export async function updateTransferStatus(id: string, status: TransferFormValues['status']) {
  const transfer = await db.query.inventoryTransfers.findFirst({ where: eq(inventoryTransfers.id, id) });
  if (!transfer) throw new Error("لم يتم العثور على طلب التحويل.");

  if (status === 'مكتملة' && transfer.status === 'قيد النقل') {
    // This is where you would update inventory quantities in a real scenario
    // For now, we just update the status.
    // Example logic:
    // await db.update(products).set({ quantity: sql`${products.quantity} - ${transfer.quantity}` }).where(eq(products.id, transfer.productId));
    // A separate logic would be needed to add quantity to the receiving warehouse/location.
  }
  
  await db.update(inventoryTransfers).set({ status }).where(eq(inventoryTransfers.id, id));
  revalidatePath('/inventory-transfers');
}

export async function deleteTransfer(id: string) {
  const transfer = await db.query.inventoryTransfers.findFirst({ where: eq(inventoryTransfers.id, id) });
  if (transfer && transfer.status !== 'مسودة') {
      throw new Error("لا يمكن حذف طلب تحويل ليس في حالة 'مسودة'.");
  }
  await db.delete(inventoryTransfers).where(eq(inventoryTransfers.id, id));
  revalidatePath('/inventory-transfers');
}


'use server';

import { db } from '@/db';
import { inventoryAdjustments, products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const adjustmentSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  productId: z.string().min(1),
  type: z.enum(["زيادة", "نقص"]),
  quantity: z.coerce.number().min(1),
  reason: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "معتمدة"]),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;
export type Product = typeof products.$inferSelect;

export async function addAdjustment(values: AdjustmentFormValues) {
  const newId = `ADJ${Date.now()}`;
  await db.insert(inventoryAdjustments).values({ ...values, id: newId });
  revalidatePath('/inventory-adjustments');
}

export async function updateAdjustment(values: AdjustmentFormValues) {
  if (!values.id) throw new Error("ID is required for update.");
  const existing = await db.query.inventoryAdjustments.findFirst({ where: eq(inventoryAdjustments.id, values.id) });
  if (existing?.status === 'معتمدة') {
    throw new Error("لا يمكن تعديل تسوية معتمدة.");
  }
  await db.update(inventoryAdjustments).set(values).where(eq(inventoryAdjustments.id, values.id));
  revalidatePath('/inventory-adjustments');
}

export async function deleteAdjustment(id: string) {
  const existing = await db.query.inventoryAdjustments.findFirst({ where: eq(inventoryAdjustments.id, id) });
  if (existing?.status === 'معتمدة') {
    throw new Error("لا يمكن حذف تسوية معتمدة.");
  }
  await db.delete(inventoryAdjustments).where(eq(inventoryAdjustments.id, id));
  revalidatePath('/inventory-adjustments');
}

export async function approveAdjustment(id: string) {
  await db.transaction(async (tx) => {
    const adjustment = await tx.query.inventoryAdjustments.findFirst({ where: eq(inventoryAdjustments.id, id) });
    if (!adjustment) throw new Error("لم يتم العثور على التسوية.");
    if (adjustment.status === 'معتمدة') throw new Error("هذه التسوية معتمدة بالفعل.");

    const product = await tx.query.products.findFirst({ where: eq(products.id, adjustment.productId) });
    if (!product) throw new Error("لم يتم العثور على المنتج المرتبط.");

    let newQuantity;
    if (adjustment.type === 'زيادة') {
      newQuantity = product.quantity + adjustment.quantity;
    } else {
      newQuantity = product.quantity - adjustment.quantity;
      if (newQuantity < 0) {
        throw new Error("لا يمكن أن تكون كمية المنتج سالبة بعد التسوية.");
      }
    }

    await tx.update(products).set({ quantity: newQuantity }).where(eq(products.id, adjustment.productId));
    await tx.update(inventoryAdjustments).set({ status: 'معتمدة' }).where(eq(inventoryAdjustments.id, id));
  });

  revalidatePath('/inventory-adjustments');
  revalidatePath('/inventory');
}

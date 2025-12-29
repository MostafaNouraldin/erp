
'use server';

import { db } from '@/db';
import { suppliers, purchaseOrders, purchaseOrderItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المورد مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const purchaseOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});
const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  date: z.date({ required_error: "تاريخ الأمر مطلوب" }),
  expectedDeliveryDate: z.date({ required_error: "تاريخ التسليم المتوقع مطلوب" }),
  items: z.array(purchaseOrderItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "مستلم جزئياً", "مستلم بالكامل", "ملغي"]).default("مسودة"),
});
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;


export async function addSupplier(supplierData: SupplierFormValues) {
  const newSupplier = {
    ...supplierData,
    id: `SUP${Date.now()}`,
  };
  await db.insert(suppliers).values(newSupplier);
  revalidatePath('/purchases');
}

export async function updateSupplier(supplierData: SupplierFormValues) {
  if (!supplierData.id) {
    throw new Error("Supplier ID is required for updating.");
  }
  await db.update(suppliers).set(supplierData).where(eq(suppliers.id, supplierData.id));
  revalidatePath('/purchases');
}

export async function deleteSupplier(supplierId: string) {
  // You might want to add a check here to ensure the supplier isn't linked to any purchase orders.
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));
  revalidatePath('/purchases');
}

export async function addPurchaseOrder(poData: PurchaseOrderFormValues) {
  const newPoId = `PO${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(purchaseOrders).values({
      id: newPoId,
      supplierId: poData.supplierId,
      date: poData.date,
      expectedDeliveryDate: poData.expectedDeliveryDate,
      notes: poData.notes,
      totalAmount: String(poData.totalAmount),
      status: poData.status,
    });
    if (poData.items.length > 0) {
      await tx.insert(purchaseOrderItems).values(
        poData.items.map(item => ({
          poId: newPoId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/purchases');
}

export async function updatePurchaseOrder(poData: PurchaseOrderFormValues) {
    if (!poData.id) {
        throw new Error("PO ID is required for updating.");
    }
    await db.transaction(async (tx) => {
        await tx.update(purchaseOrders).set({
            supplierId: poData.supplierId,
            date: poData.date,
            expectedDeliveryDate: poData.expectedDeliveryDate,
            notes: poData.notes,
            totalAmount: String(poData.totalAmount),
            status: poData.status,
        }).where(eq(purchaseOrders.id, poData.id!));

        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poData.id!));

        if (poData.items.length > 0) {
            await tx.insert(purchaseOrderItems).values(
                poData.items.map(item => ({
                    poId: poData.id!,
                    itemId: item.itemId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: String(item.unitPrice),
                    total: String(item.total),
                }))
            );
        }
    });
    revalidatePath('/purchases');
}

export async function deletePurchaseOrder(poId: string) {
    await db.transaction(async (tx) => {
        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId));
        await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, poId));
    });
    revalidatePath('/purchases');
}

export async function updatePurchaseOrderStatus(poId: string, status: PurchaseOrderFormValues['status']) {
    await db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, poId));
    revalidatePath('/purchases');
}

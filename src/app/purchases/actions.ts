
'use server';

import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

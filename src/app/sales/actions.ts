
// src/app/sales/actions.ts
'use server';

import { db } from '@/db';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  balance: z.coerce.number().default(0),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

export async function addCustomer(customerData: CustomerFormValues) {
  const newCustomer = {
    ...customerData,
    id: `CUST${Date.now()}`,
    balance: String(customerData.balance),
  };
  await db.insert(customers).values(newCustomer);
  revalidatePath('/sales');
}

export async function updateCustomer(customerData: CustomerFormValues) {
    if (!customerData.id) {
        throw new Error("Customer ID is required for updating.");
    }
    const updatedCustomer = {
        ...customerData,
        balance: String(customerData.balance),
    };
  await db.update(customers).set(updatedCustomer).where(eq(customers.id, customerData.id));
  revalidatePath('/sales');
}

export async function deleteCustomer(customerId: string) {
  // In a real app, you might want to check if the customer has invoices before deleting.
  await db.delete(customers).where(eq(customers.id, customerId));
  revalidatePath('/sales');
}

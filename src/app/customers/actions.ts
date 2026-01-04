
'use server';

import { connectToTenantDb } from '@/db';
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
  openingBalance: z.coerce.number().default(0),
  balance: z.coerce.number().default(0),
  creditLimit: z.coerce.number().default(0),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

async function getDb() {
  // This would come from session in a real app
  const tenantId = 'T001';
  const { db } = await connectToTenantDb(tenantId);
  return db;
}


export async function addCustomer(customerData: CustomerFormValues) {
  const db = await getDb();
  const newCustomer = {
    ...customerData,
    id: `CUST${Date.now()}`,
    balance: String(customerData.openingBalance), // Initial balance is the opening balance
    openingBalance: String(customerData.openingBalance),
    creditLimit: String(customerData.creditLimit),
  };
  await db.insert(customers).values(newCustomer);
  revalidatePath('/sales');
  revalidatePath('/pos');
  revalidatePath('/customers');
}

export async function updateCustomer(customerData: CustomerFormValues) {
  const db = await getDb();
    if (!customerData.id) {
        throw new Error("Customer ID is required for updating.");
    }
    const { openingBalance, creditLimit, ...rest } = customerData;
    const updatedCustomer = {
        ...rest,
        openingBalance: String(openingBalance),
        creditLimit: String(creditLimit),
    };
  await db.update(customers).set(updatedCustomer).where(eq(customers.id, customerData.id));
  revalidatePath('/sales');
  revalidatePath('/pos');
  revalidatePath('/customers');
}

export async function deleteCustomer(customerId: string) {
  const db = await getDb();
  // In a real app, you might want to check if the customer has invoices before deleting.
  await db.delete(customers).where(eq(customers.id, customerId));
  revalidatePath('/sales');
  revalidatePath('/pos');
  revalidatePath('/customers');
}

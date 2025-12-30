
'use server';

import { db } from '@/db';
import { bankReceipts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const bankReceiptSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  bankAccountId: z.string().min(1),
  revenueAccountId: z.string().min(1),
  payerName: z.string().min(1),
  customerId: z.string().optional(),
  description: z.string().min(1),
  amount: z.number().min(0.01),
  referenceNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]),
});

export type BankReceiptFormValues = z.infer<typeof bankReceiptSchema>;

// For passing data to client component
export type BankAccount = { id: string; bankName: string };
export type RevenueAccount = { id: string; name: string };
export type Customer = { id: string; name: string };

export async function addBankReceipt(values: BankReceiptFormValues) {
    const newId = `BREC${Date.now()}`;
    await db.insert(bankReceipts).values({
        ...values,
        id: newId,
        amount: String(values.amount),
    });
    revalidatePath('/bank-receipts');
}

export async function updateBankReceipt(values: BankReceiptFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(bankReceipts).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(bankReceipts.id, values.id));
    revalidatePath('/bank-receipts');
}

export async function deleteBankReceipt(id: string) {
    const receipt = await db.query.bankReceipts.findFirst({ where: eq(bankReceipts.id, id) });
    if (receipt?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مقبوضات مرحّلة. يجب إلغاء ترحيلها أولاً.");
    }
    await db.delete(bankReceipts).where(eq(bankReceipts.id, id));
    revalidatePath('/bank-receipts');
}

export async function updateBankReceiptStatus(id: string, status: 'مسودة' | 'مرحل') {
    await db.update(bankReceipts).set({ status }).where(eq(bankReceipts.id, id));
    // Here you would also create a Journal Entry if status is 'مرحل'
    revalidatePath('/bank-receipts');
}

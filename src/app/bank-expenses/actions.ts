
'use server';

import { db } from '@/db';
import { bankExpenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const bankExpenseSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  bankAccountId: z.string().min(1),
  expenseAccountId: z.string().min(1),
  beneficiary: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  referenceNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]),
});

export type BankExpenseFormValues = z.infer<typeof bankExpenseSchema>;

// For passing data to client component
export type BankAccount = { id: string; bankName: string };
export type ExpenseAccount = { id: string; name: string };

export async function addBankExpense(values: BankExpenseFormValues) {
    const newId = `BEXP${Date.now()}`;
    await db.insert(bankExpenses).values({
        ...values,
        id: newId,
        amount: String(values.amount),
    });
    revalidatePath('/bank-expenses');
}

export async function updateBankExpense(values: BankExpenseFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(bankExpenses).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(bankExpenses.id, values.id));
    revalidatePath('/bank-expenses');
}

export async function deleteBankExpense(id: string) {
    const expense = await db.query.bankExpenses.findFirst({ where: eq(bankExpenses.id, id) });
    if (expense?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مصروف مرحّل. يجب إلغاء ترحيله أولاً.");
    }
    await db.delete(bankExpenses).where(eq(bankExpenses.id, id));
    revalidatePath('/bank-expenses');
}

export async function updateBankExpenseStatus(id: string, status: 'مسودة' | 'مرحل') {
    await db.update(bankExpenses).set({ status }).where(eq(bankExpenses.id, id));
    // Here you would also create a Journal Entry if status is 'مرحل'
    revalidatePath('/bank-expenses');
}

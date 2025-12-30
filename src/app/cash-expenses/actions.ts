
'use server';

import { connectToTenantDb } from '@/db';
import { cashExpenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const cashExpenseSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  cashAccountId: z.string().min(1),
  expenseAccountId: z.string().min(1),
  beneficiary: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().min(0.01),
  voucherNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]),
});

export type CashExpenseFormValues = z.infer<typeof cashExpenseSchema>;

export type CashAccount = { id: string; name: string };
export type ExpenseAccount = { id: string; name: string };

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


export async function addCashExpense(values: CashExpenseFormValues) {
    const db = await getDb();
    const newId = `CEXP${Date.now()}`;
    await db.insert(cashExpenses).values({
        ...values,
        id: newId,
        voucherNumber: values.voucherNumber || `VN-${Date.now().toString().slice(-5)}`,
        amount: String(values.amount),
    });
    revalidatePath('/cash-expenses');
}

export async function updateCashExpense(values: CashExpenseFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(cashExpenses).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(cashExpenses.id, values.id));
    revalidatePath('/cash-expenses');
}

export async function deleteCashExpense(id: string) {
    const db = await getDb();
    const expense = await db.query.cashExpenses.findFirst({ where: eq(cashExpenses.id, id) });
    if (expense?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مصروف مرحّل. يجب إلغاء ترحيله أولاً.");
    }
    await db.delete(cashExpenses).where(eq(cashExpenses.id, id));
    revalidatePath('/cash-expenses');
}

export async function updateCashExpenseStatus(id: string, status: 'مسودة' | 'مرحل') {
    const db = await getDb();
    await db.update(cashExpenses).set({ status }).where(eq(cashExpenses.id, id));
    // Here you would also create a Journal Entry if status is 'مرحل'
    revalidatePath('/cash-expenses');
}

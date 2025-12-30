
'use server';

import { connectToTenantDb } from '@/db';
import { cashExpenses, journalEntries, journalEntryLines } from '@/db/schema';
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
    
    if (status === 'مرحل') {
        const expense = await db.query.cashExpenses.findFirst({ where: eq(cashExpenses.id, id) });
        if (!expense) {
            throw new Error("لم يتم العثور على المصروف.");
        }
        if (expense.status === 'مرحل') {
            throw new Error("هذا المصروف مرحّل بالفعل.");
        }

        const newEntryId = `JV-CEXP-${id}`;
        await db.transaction(async (tx) => {
            await tx.insert(journalEntries).values({
                id: newEntryId,
                date: expense.date,
                description: `ترحيل مصروف نقدي: ${expense.description} (المستفيد: ${expense.beneficiary})`,
                totalAmount: String(expense.amount),
                status: "مرحل",
                sourceModule: "PaymentVoucher",
                sourceDocumentId: expense.id,
            });

            await tx.insert(journalEntryLines).values([
                { journalEntryId: newEntryId, accountId: expense.expenseAccountId, debit: String(expense.amount), credit: '0', description: `مصروف لـ ${expense.beneficiary}` },
                { journalEntryId: newEntryId, accountId: expense.cashAccountId, debit: '0', credit: String(expense.amount), description: `دفع نقداً لـ ${expense.beneficiary}` },
            ]);

            await tx.update(cashExpenses).set({ status }).where(eq(cashExpenses.id, id));
        });

    } else {
        // Logic for un-posting if needed
        await db.update(cashExpenses).set({ status }).where(eq(cashExpenses.id, id));
    }

    revalidatePath('/cash-expenses');
    revalidatePath('/general-ledger');
}

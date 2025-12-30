
'use server';

import { connectToTenantDb } from '@/db';
import { bankExpenses, journalEntries, journalEntryLines } from '@/db/schema';
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

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}

export async function addBankExpense(values: BankExpenseFormValues) {
    const db = await getDb();
    const newId = `BEXP${Date.now()}`;
    await db.insert(bankExpenses).values({
        ...values,
        id: newId,
        amount: String(values.amount),
    });
    revalidatePath('/bank-expenses');
}

export async function updateBankExpense(values: BankExpenseFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(bankExpenses).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(bankExpenses.id, values.id));
    revalidatePath('/bank-expenses');
}

export async function deleteBankExpense(id: string) {
    const db = await getDb();
    const expense = await db.query.bankExpenses.findFirst({ where: eq(bankExpenses.id, id) });
    if (expense?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مصروف مرحّل. يجب إلغاء ترحيله أولاً.");
    }
    await db.delete(bankExpenses).where(eq(bankExpenses.id, id));
    revalidatePath('/bank-expenses');
}

export async function updateBankExpenseStatus(id: string, status: 'مسودة' | 'مرحل') {
    const db = await getDb();
    
    if (status === 'مرحل') {
        const expense = await db.query.bankExpenses.findFirst({ where: eq(bankExpenses.id, id) });
        if (!expense) {
            throw new Error("لم يتم العثور على المصروف.");
        }
        if (expense.status === 'مرحل') {
            throw new Error("هذا المصروف مرحّل بالفعل.");
        }

        const newEntryId = `JV-BEXP-${id}`;
        await db.transaction(async (tx) => {
            await tx.insert(journalEntries).values({
                id: newEntryId,
                date: expense.date,
                description: `ترحيل مصروف بنكي: ${expense.description} (المستفيد: ${expense.beneficiary})`,
                totalAmount: String(expense.amount),
                status: "مرحل",
                sourceModule: "PaymentVoucher",
                sourceDocumentId: expense.id,
            });

            await tx.insert(journalEntryLines).values([
                { journalEntryId: newEntryId, accountId: expense.expenseAccountId, debit: String(expense.amount), credit: '0', description: `مصروف لـ ${expense.beneficiary}` },
                { journalEntryId: newEntryId, accountId: expense.bankAccountId, debit: '0', credit: String(expense.amount), description: `دفع من حساب بنكي لـ ${expense.beneficiary}` },
            ]);
            
            await tx.update(bankExpenses).set({ status }).where(eq(bankExpenses.id, id));
        });

    } else {
        // Logic for un-posting if needed (would require creating reversing journal entries)
        await db.update(bankExpenses).set({ status }).where(eq(bankExpenses.id, id));
    }

    revalidatePath('/bank-expenses');
    revalidatePath('/general-ledger');
}

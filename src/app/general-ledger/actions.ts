
'use server';

import { connectToTenantDb } from '@/db';
import { chartOfAccounts, journalEntries, journalEntryLines } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const accountSchema = z.object({
  id: z.string().min(1, "رقم الحساب مطلوب").regex(/^\d+$/, "رقم الحساب يجب أن يحتوي على أرقام فقط"),
  name: z.string().min(1, "اسم الحساب مطلوب"),
  type: z.enum(["رئيسي", "فرعي", "تحليلي", "صندوق", "بنك"]),
  parentId: z.string().nullable().optional(),
  balance: z.number().default(0),
});
type AccountFormValues = z.infer<typeof accountSchema>;

const journalEntryLineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  description: z.string().optional(),
});

const journalEntrySchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  description: z.string().min(1),
  lines: z.array(journalEntryLineSchema).min(2),
  status: z.enum(["مسودة", "مرحل"]),
  totalAmount: z.number().optional(),
  sourceModule: z.enum(["General", "POS", "EmployeeSettlements", "ReceiptVoucher", "PaymentVoucher"]).optional(),
  sourceDocumentId: z.string().optional(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


// Account Actions
export async function addAccount(values: AccountFormValues) {
    const db = await getDb();
    await db.insert(chartOfAccounts).values({
        ...values,
        balance: String(values.balance || 0),
    });
    revalidatePath('/general-ledger');
}

export async function updateAccount(values: AccountFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("Account ID is required for update.");
    await db.update(chartOfAccounts).set({
        name: values.name,
        type: values.type,
        parentId: values.parentId,
    }).where(eq(chartOfAccounts.id, values.id));
    revalidatePath('/general-ledger');
}

export async function deleteAccount(accountId: string) {
    const db = await getDb();
    const hasChildren = await db.query.chartOfAccounts.findFirst({
        where: eq(chartOfAccounts.parentId, accountId),
    });
    if (hasChildren) {
        throw new Error("لا يمكن حذف حساب رئيسي أو فرعي لديه حسابات تابعة.");
    }
    // You might want to check if the account has any journal entries before deleting
    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, accountId));
    revalidatePath('/general-ledger');
}

// Journal Entry Actions
export async function addJournalEntry(values: JournalEntry) {
    const db = await getDb();
    const newEntryId = `JV${Date.now()}`;
    await db.transaction(async (tx) => {
        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: values.date,
            description: values.description,
            totalAmount: String(values.totalAmount),
            status: values.status,
            sourceModule: values.sourceModule,
            sourceDocumentId: values.sourceDocumentId,
        });
        await tx.insert(journalEntryLines).values(values.lines.map(line => ({
            journalEntryId: newEntryId,
            accountId: line.accountId,
            debit: String(line.debit),
            credit: String(line.credit),
            description: line.description,
        })));
        
        // If the entry is already posted, update balances
        if (values.status === 'مرحل') {
             for (const line of values.lines) {
                if (line.debit > 0) {
                    await tx.update(chartOfAccounts)
                      .set({ balance: sql`${chartOfAccounts.balance} + ${line.debit}` })
                      .where(eq(chartOfAccounts.id, line.accountId));
                }
                if (line.credit > 0) {
                    await tx.update(chartOfAccounts)
                      .set({ balance: sql`${chartOfAccounts.balance} - ${line.credit}` }) // Simplified logic
                      .where(eq(chartOfAccounts.id, line.accountId));
                }
            }
        }
    });
    revalidatePath('/general-ledger');
}

export async function updateJournalEntry(values: JournalEntry) {
    const db = await getDb();
    if (!values.id) throw new Error("Journal Entry ID is required for update.");
    const entryId = values.id;

    await db.transaction(async (tx) => {
        await tx.update(journalEntries).set({
            date: values.date,
            description: values.description,
            totalAmount: String(values.totalAmount),
            status: values.status,
        }).where(eq(journalEntries.id, entryId));

        await tx.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, entryId));

        await tx.insert(journalEntryLines).values(values.lines.map(line => ({
            journalEntryId: entryId,
            accountId: line.accountId,
            debit: String(line.debit),
            credit: String(line.credit),
            description: line.description,
        })));
    });
    revalidatePath('/general-ledger');
}

export async function deleteJournalEntry(entryId: string) {
    const db = await getDb();
    const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, entryId) });
    if (entry?.status === 'مرحل') {
        throw new Error("لا يمكن حذف قيد مرحّل. يجب إلغاء ترحيله أولاً.");
    }
    await db.transaction(async (tx) => {
        await tx.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, entryId));
        await tx.delete(journalEntries).where(eq(journalEntries.id, entryId));
    });
    revalidatePath('/general-ledger');
}

export async function updateJournalEntryStatus(entryId: string, status: 'مسودة' | 'مرحل') {
    const db = await getDb();
    // In a real app, posting ('مرحل') would also update account balances.
    // This is a simplified version.
    const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, entryId) });
     if (status === 'مسودة' && entry?.sourceModule !== 'General') {
        throw new Error(`لا يمكن إلغاء ترحيل هذا القيد لأنه ناتج عن وحدة ${entry?.sourceModule}.`);
    }

    await db.update(journalEntries).set({ status }).where(eq(journalEntries.id, entryId));
    revalidatePath('/general-ledger');
}

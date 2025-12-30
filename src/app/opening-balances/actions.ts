
'use server';

import { connectToTenantDb } from '@/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const openingBalanceSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().min(1, "الحساب مطلوب"),
  date: z.date({ required_error: "تاريخ الرصيد الافتتاحي مطلوب" }),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>;
export type Account = { id: string; name: string; type: string };

const SOURCE_MODULE = "OpeningBalance";

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}

// We model opening balances as a special type of Journal Entry
export async function addOpeningBalance(values: OpeningBalanceFormValues) {
    const db = await getDb();
  const newEntryId = `OB-${values.accountId}-${Date.now()}`;
  const totalAmount = Math.max(values.debit, values.credit);
  
  await db.transaction(async (tx) => {
    await tx.insert(journalEntries).values({
      id: newEntryId,
      date: values.date,
      description: values.notes || `رصيد افتتاحي لحساب ${values.accountId}`,
      totalAmount: String(totalAmount),
      status: "مرحل", // Opening balances are always posted
      sourceModule: SOURCE_MODULE,
      sourceDocumentId: values.accountId,
    });
    await tx.insert(journalEntryLines).values({
      journalEntryId: newEntryId,
      accountId: values.accountId,
      debit: String(values.debit),
      credit: String(values.credit),
      description: values.notes,
    });
  });
  revalidatePath('/opening-balances');
}

export async function updateOpeningBalance(values: OpeningBalanceFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    const totalAmount = Math.max(values.debit, values.credit);

    await db.transaction(async (tx) => {
        await tx.update(journalEntries).set({
            date: values.date,
            description: values.notes || `رصيد افتتاحي لحساب ${values.accountId}`,
            totalAmount: String(totalAmount),
        }).where(eq(journalEntries.id, values.id));

        await tx.update(journalEntryLines).set({
            accountId: values.accountId,
            debit: String(values.debit),
            credit: String(values.credit),
            description: values.notes,
        }).where(eq(journalEntryLines.journalEntryId, values.id));
    });
    revalidatePath('/opening-balances');
}

export async function deleteOpeningBalance(id: string) {
    const db = await getDb();
    await db.transaction(async (tx) => {
        await tx.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));
        await tx.delete(journalEntries).where(eq(journalEntries.id, id));
    });
    revalidatePath('/opening-balances');
}

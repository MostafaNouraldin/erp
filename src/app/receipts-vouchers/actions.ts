
'use server';

import { connectToTenantDb } from '@/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const voucherSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  type: z.enum(["سند قبض", "سند صرف"]),
  method: z.enum(["نقدي", "بنكي", "شيك"]),
  partyId: z.string().min(1),
  partyName: z.string().optional(),
  accountId: z.string().min(1), // Cash/Bank account
  amount: z.coerce.number().min(0.01),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
  branch: z.string().min(1),
});

export type VoucherFormValues = z.infer<typeof voucherSchema>;
export type Party = { id: string; name: string; type: 'customer' | 'supplier' | 'employee' | 'expense' };
export type Account = { id: string; name: string; type: string };


async function getDb() {
  const { db } = await connectToTenantDb('T001');
  return db;
}


async function getContraAccountId(partyId: string, partyType: 'customer' | 'supplier' | 'expense'): Promise<string> {
    const db = await getDb();
    if (partyType === 'customer') {
        return '1200'; // Accounts Receivable
    }
    if (partyType === 'supplier') {
        return '2010'; // Accounts Payable
    }
    // For 'expense', the partyId might represent a specific expense account itself.
    // This part may need more complex logic based on your chart of accounts.
    // For now, we'll assume a general expense account if not found.
    const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, partyId) });
    return account ? partyId : '5100'; // Default general expenses
}

export async function addVoucher(values: VoucherFormValues) {
    const db = await getDb();
    const newEntryId = `JV-${values.type === 'سند قبض' ? 'RC' : 'PV'}-${Date.now()}`;
    const party = { id: values.partyId, name: values.partyName, type: 'customer' }; // Simplified, needs logic to determine party type

    const contraAccountId = await getContraAccountId(values.partyId, party.type as any);

    let debitAccountId: string;
    let creditAccountId: string;

    if (values.type === "سند قبض") { // Money is coming IN
        debitAccountId = values.accountId; // Cash/Bank is debited
        creditAccountId = contraAccountId; // Customer/Revenue is credited
    } else { // Money is going OUT (سند صرف)
        debitAccountId = contraAccountId; // Expense/Supplier is debited
        creditAccountId = values.accountId; // Cash/Bank is credited
    }

    const journalData = {
        id: newEntryId,
        date: values.date,
        description: values.notes || `${values.type} لـ ${values.partyName}`,
        totalAmount: String(values.amount),
        status: values.status,
        sourceModule: values.type === 'سند قبض' ? 'ReceiptVoucher' : 'PaymentVoucher' as "ReceiptVoucher" | "PaymentVoucher",
        sourceDocumentId: newEntryId,
    };

    const linesData = [
        { journalEntryId: newEntryId, accountId: debitAccountId, debit: String(values.amount), credit: '0', description: values.notes },
        { journalEntryId: newEntryId, accountId: creditAccountId, debit: '0', credit: String(values.amount), description: values.notes },
    ];
    
    await db.transaction(async (tx) => {
        await tx.insert(journalEntries).values(journalData);
        await tx.insert(journalEntryLines).values(linesData);
    });

    revalidatePath('/receipts-vouchers');
}

export async function updateVoucher(values: VoucherFormValues) {
    if (!values.id) throw new Error("ID required for update.");
    // Similar logic to addVoucher but with updates
    revalidatePath('/receipts-vouchers');
}

export async function deleteVoucher(id: string) {
    const db = await getDb();
    const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id) });
    if (entry?.status === 'مرحل') {
        throw new Error("لا يمكن حذف سند مرحّل.");
    }
    await db.transaction(async (tx) => {
        await tx.delete(journalEntryLines).where(eq(journalEntryLines.journalEntryId, id));
        await tx.delete(journalEntries).where(eq(journalEntries.id, id));
    });
    revalidatePath('/receipts-vouchers');
}

export async function postVoucher(id: string) {
    const db = await getDb();
    await db.transaction(async (tx) => {
        const entry = await tx.query.journalEntries.findFirst({ where: eq(journalEntries.id, id), with: { lines: true }});
        if (!entry) throw new Error("لم يتم العثور على السند.");
        if (entry.status === 'مرحل') throw new Error("السند مرحّل بالفعل.");

        for (const line of entry.lines) {
            const debit = parseFloat(line.debit);
            const credit = parseFloat(line.credit);
            
            // Debit increases asset/expense, decreases liability/equity/revenue
            if (debit > 0) {
                await tx.update(chartOfAccounts)
                  .set({ balance: sql`${chartOfAccounts.balance} + ${debit}` })
                  .where(eq(chartOfAccounts.id, line.accountId));
            }
            // Credit decreases asset/expense, increases liability/equity/revenue
            if (credit > 0) {
                await tx.update(chartOfAccounts)
                  .set({ balance: sql`${chartOfAccounts.balance} - ${credit}` }) // This logic depends on account type, simplified for now
                  .where(eq(chartOfAccounts.id, line.accountId));
            }
        }
        await tx.update(journalEntries).set({ status: 'مرحل' }).where(eq(journalEntries.id, id));
    });
    revalidatePath('/receipts-vouchers');
    revalidatePath('/general-ledger');
}

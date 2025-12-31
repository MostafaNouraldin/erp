
'use server';

import { connectToTenantDb } from '@/db';
import { bankReceipts, journalEntries, journalEntryLines, chartOfAccounts } from '@/db/schema';
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
  amount: z.coerce.number().min(0.01),
  referenceNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]),
});

export type BankReceiptFormValues = z.infer<typeof bankReceiptSchema>;

// For passing data to client component
export type BankAccount = { id: string; bankName: string };
export type RevenueAccount = { id: string; name: string };
export type Customer = { id: string; name: string };

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


export async function addBankReceipt(values: BankReceiptFormValues) {
    const db = await getDb();
    const newId = `BREC${Date.now()}`;
    await db.insert(bankReceipts).values({
        ...values,
        id: newId,
        amount: String(values.amount),
    });
    revalidatePath('/bank-receipts');
}

export async function updateBankReceipt(values: BankReceiptFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(bankReceipts).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(bankReceipts.id, values.id));
    revalidatePath('/bank-receipts');
}

export async function deleteBankReceipt(id: string) {
    const db = await getDb();
    const receipt = await db.query.bankReceipts.findFirst({ where: eq(bankReceipts.id, id) });
    if (receipt?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مقبوضات مرحّلة. يجب إلغاء ترحيلها أولاً.");
    }
    await db.delete(bankReceipts).where(eq(bankReceipts.id, id));
    revalidatePath('/bank-receipts');
}

export async function updateBankReceiptStatus(id: string, status: 'مسودة' | 'مرحل') {
    const db = await getDb();
    const receipt = await db.query.bankReceipts.findFirst({ where: eq(bankReceipts.id, id) });
    if (!receipt) {
        throw new Error("لم يتم العثور على المقبوضات.");
    }
     if (receipt.status === status) {
        throw new Error(`هذا السند بالفعل في حالة '${status}'.`);
    }

    if (status === 'مرحل') {
        const newEntryId = `JV-BREC-${id}`;
        // The contra-account for a bank receipt is either the revenue account or the customer's AR account.
        const contraAccountId = receipt.revenueAccountId; // Simplified: always use the specified revenue account.

        await db.transaction(async (tx) => {
             await tx.insert(journalEntries).values({
                id: newEntryId,
                date: receipt.date,
                description: `ترحيل مقبوضات بنكية: ${receipt.description} (الدافع: ${receipt.payerName})`,
                totalAmount: String(receipt.amount),
                status: "مرحل",
                sourceModule: "ReceiptVoucher",
                sourceDocumentId: receipt.id,
            });

            await tx.insert(journalEntryLines).values([
                // Debit the bank account (asset increases)
                { journalEntryId: newEntryId, accountId: receipt.bankAccountId, debit: String(receipt.amount), credit: '0', description: `إيداع من ${receipt.payerName}` },
                // Credit the revenue/customer account (revenue increases/AR decreases)
                { journalEntryId: newEntryId, accountId: contraAccountId, debit: '0', credit: String(receipt.amount), description: `إيراد من ${receipt.payerName}` },
            ]);
            
            await tx.update(bankReceipts).set({ status }).where(eq(bankReceipts.id, id));
        });
    } else { // Un-posting logic
        await db.update(bankReceipts).set({ status }).where(eq(bankReceipts.id, id));
    }
    
    revalidatePath('/bank-receipts');
    revalidatePath('/general-ledger');
}


'use server';

import { connectToTenantDb } from '@/db';
import { cashReceipts, journalEntries, journalEntryLines } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const cashReceiptSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  cashAccountId: z.string().min(1),
  revenueAccountId: z.string().min(1),
  payerName: z.string().min(1),
  customerId: z.string().optional(),
  description: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  referenceNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]),
});

export type CashReceiptFormValues = z.infer<typeof cashReceiptSchema>;

// For passing data to client component
export type CashAccount = { id: string; name: string };
export type RevenueAccount = { id: string; name: string };
export type Customer = { id: string; name: string };

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


export async function addCashReceipt(values: CashReceiptFormValues) {
    const db = await getDb();
    const newId = `CREC${Date.now()}`;
    await db.insert(cashReceipts).values({
        ...values,
        id: newId,
        amount: String(values.amount),
    });
    revalidatePath('/cash-receipts');
}

export async function updateCashReceipt(values: CashReceiptFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(cashReceipts).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(cashReceipts.id, values.id));
    revalidatePath('/cash-receipts');
}

export async function deleteCashReceipt(id: string) {
    const db = await getDb();
    const receipt = await db.query.cashReceipts.findFirst({ where: eq(cashReceipts.id, id) });
    if (receipt?.status === 'مرحل') {
        throw new Error("لا يمكن حذف مقبوضات مرحّلة. يجب إلغاء ترحيلها أولاً.");
    }
    await db.delete(cashReceipts).where(eq(cashReceipts.id, id));
    revalidatePath('/cash-receipts');
}

export async function updateCashReceiptStatus(id: string, status: 'مسودة' | 'مرحل') {
    const db = await getDb();
    const receipt = await db.query.cashReceipts.findFirst({ where: eq(cashReceipts.id, id) });
    if (!receipt) {
        throw new Error("لم يتم العثور على المقبوضات.");
    }
     if (receipt.status === status) {
        throw new Error(`هذا السند بالفعل في حالة '${status}'.`);
    }

    if (status === 'مرحل') {
        const newEntryId = `JV-CREC-${id}`;
        await db.transaction(async (tx) => {
             await tx.insert(journalEntries).values({
                id: newEntryId,
                date: receipt.date,
                description: `ترحيل مقبوضات نقدية: ${receipt.description} (الدافع: ${receipt.payerName})`,
                totalAmount: String(receipt.amount),
                status: "مرحل",
                sourceModule: "CashReceiptVoucher",
                sourceDocumentId: receipt.id,
            });

            await tx.insert(journalEntryLines).values([
                { journalEntryId: newEntryId, accountId: receipt.cashAccountId, debit: String(receipt.amount), credit: '0', description: `إيداع نقدي من ${receipt.payerName}` },
                { journalEntryId: newEntryId, accountId: receipt.revenueAccountId, debit: '0', credit: String(receipt.amount), description: `إيراد من ${receipt.payerName}` },
            ]);
            
            await tx.update(cashReceipts).set({ status }).where(eq(cashReceipts.id, id));
        });
    } else { // Un-posting logic
        await db.update(cashReceipts).set({ status }).where(eq(cashReceipts.id, id));
        // Note: Reversing the journal entry should be implemented for a complete feature.
    }
    
    revalidatePath('/cash-receipts');
    revalidatePath('/general-ledger');
}

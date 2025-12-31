
'use server';

import { connectToTenantDb } from '@/db';
import { journalEntries, journalEntryLines } from '@/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const posSettlementSchema = z.object({
  settlementDate: z.date(),
  cashSales: z.number().min(0),
  cardSales: z.number().min(0),
  bankTransferSales: z.number().min(0),
  deferredSales: z.number().min(0),
});

type PosSettlementData = z.infer<typeof posSettlementSchema>;

const VAT_RATE = 0.15;
const CASH_ACCOUNT = "1011"; // حساب الصندوق
const BANK_ACCOUNT = "1012"; // حساب البنك
const SALES_REVENUE_ACCOUNT = "4000"; // حساب إيرادات المبيعات
const VAT_PAYABLE_ACCOUNT = "2200"; // حساب ضريبة القيمة المضافة المستحقة
const ACCOUNTS_RECEIVABLE_ACCOUNT = "1200"; // حساب الذمم المدينة (للآجل)


export async function settlePosTransactions(data: PosSettlementData) {
  const db = await getDb();

  const totalSettledSales = data.cashSales + data.cardSales + data.bankTransferSales;
  const totalDeferredSales = data.deferredSales;
  const totalSales = totalSettledSales + totalDeferredSales;

  if (totalSales <= 0) {
    throw new Error("لا توجد مبيعات للترحيل.");
  }

  const totalBeforeTax = totalSales / (1 + VAT_RATE);
  const vatAmount = totalSales - totalBeforeTax;

  const newEntryId = `JV-POS-${Date.now()}`;

  await db.transaction(async (tx) => {
    // 1. Create the main Journal Entry
    await tx.insert(journalEntries).values({
      id: newEntryId,
      date: data.settlementDate,
      description: `ترحيل إجمالي مبيعات نقاط البيع ليوم ${data.settlementDate.toLocaleDateString('ar-SA')}`,
      totalAmount: String(totalSales),
      status: "مرحل",
      sourceModule: "POS",
      sourceDocumentId: `POS-SETTLE-${data.settlementDate.toISOString().split('T')[0]}`,
    });

    const lines = [];

    // 2. Add debit entries for cash, bank, and deferred payments
    if (data.cashSales > 0) {
      lines.push({
        journalEntryId: newEntryId,
        accountId: CASH_ACCOUNT,
        debit: String(data.cashSales),
        credit: '0',
        description: 'إجمالي المبيعات النقدية',
      });
    }
    if (data.cardSales + data.bankTransferSales > 0) {
      lines.push({
        journalEntryId: newEntryId,
        accountId: BANK_ACCOUNT,
        debit: String(data.cardSales + data.bankTransferSales),
        credit: '0',
        description: 'إجمالي مبيعات البطاقات والتحويلات',
      });
    }
    if (data.deferredSales > 0) {
        lines.push({
            journalEntryId: newEntryId,
            accountId: ACCOUNTS_RECEIVABLE_ACCOUNT,
            debit: String(data.deferredSales),
            credit: '0',
            description: 'إجمالي المبيعات الآجلة',
        });
    }

    // 3. Add credit entries for revenue and VAT
    lines.push({
      journalEntryId: newEntryId,
      accountId: SALES_REVENUE_ACCOUNT,
      debit: '0',
      credit: String(totalBeforeTax),
      description: 'إجمالي إيرادات المبيعات قبل الضريبة',
    });
    lines.push({
      journalEntryId: newEntryId,
      accountId: VAT_PAYABLE_ACCOUNT,
      debit: '0',
      credit: String(vatAmount),
      description: 'إجمالي ضريبة القيمة المضافة',
    });

    // 4. Insert all journal entry lines
    if (lines.length > 0) {
      await tx.insert(journalEntryLines).values(lines);
    }
  });

  revalidatePath('/pos');
  revalidatePath('/general-ledger');
}

async function getDb() {
  const tenantId = 'T001'; // This would come from session in a real app
  const { db } = await connectToTenantDb(tenantId);
  return db;
}

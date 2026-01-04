

'use server';

import { connectToTenantDb } from '@/db';
import { journalEntries, journalEntryLines, posSessions, companySettings, salesInvoices } from '@/db/schema';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

const posSessionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  openingBalance: z.number().min(0, "الرصيد الافتتاحي لا يمكن أن يكون سالبًا"),
});
export type PosSessionStartValues = z.infer<typeof posSessionSchema>;


const posCloseSessionSchema = z.object({
    closingBalance: z.coerce.number().min(0, "المبلغ الفعلي لا يمكن أن يكون سالبًا"),
});
export type PosCloseSessionValues = z.infer<typeof posCloseSessionSchema>;


async function getDb() {
  const tenantId = 'T001'; 
  const { db } = await connectToTenantDb(tenantId);
  return db;
}


export async function startPosSession(values: PosSessionStartValues) {
    const db = await getDb();
    const existingSession = await db.query.posSessions.findFirst({
        where: eq(posSessions.status, "open"),
    });

    if (existingSession) {
        throw new Error("يوجد جلسة مفتوحة بالفعل. يرجى إغلاقها أولاً.");
    }
    
    const newSessionId = `SESS${Date.now()}`;
    await db.insert(posSessions).values({
        id: newSessionId,
        userId: values.userId,
        openingTime: new Date(),
        openingBalance: String(values.openingBalance),
        status: 'open',
    });

    revalidatePath('/pos');
    const newSession = await db.query.posSessions.findFirst({ where: eq(posSessions.id, newSessionId), with: { user: true } });
    return newSession;
}


export async function closePosSession(sessionId: string, values: PosCloseSessionValues) {
    const db = await getDb();
    const session = await db.query.posSessions.findFirst({
        where: eq(posSessions.id, sessionId),
    });

    if (!session || session.status !== 'open') {
        throw new Error("لا توجد جلسة مفتوحة لإغلاقها أو أن الجلسة غير صالحة.");
    }

    const sessionInvoices = await db.select().from(salesInvoices).where(eq(salesInvoices.sessionId, sessionId));

    const cashSales = sessionInvoices
        .filter(inv => inv.paymentMethod === 'cash')
        .reduce((sum, inv) => sum + parseFloat(inv.numericTotalAmount), 0);
        
    const cardSales = sessionInvoices
        .filter(inv => inv.paymentMethod === 'card' || inv.paymentMethod === 'bank')
        .reduce((sum, inv) => sum + parseFloat(inv.numericTotalAmount), 0);
    
    const deferredSales = sessionInvoices
        .filter(inv => inv.paymentMethod === 'deferred')
        .reduce((sum, inv) => sum + parseFloat(inv.numericTotalAmount), 0);


    const expectedBalance = (parseFloat(session.openingBalance) || 0) + cashSales;
    const difference = values.closingBalance - expectedBalance;

    await db.update(posSessions).set({
        closingTime: new Date(),
        closingBalance: String(values.closingBalance),
        expectedBalance: String(expectedBalance),
        cashSales: String(cashSales),
        cardSales: String(cardSales),
        difference: String(difference),
        status: 'closed',
    }).where(eq(posSessions.id, sessionId));

    // Post to General Ledger
    await settlePosSession(sessionId, {
        openingBalance: parseFloat(session.openingBalance),
        cashSales,
        cardSales,
        deferredSales,
        closingBalance: values.closingBalance,
        difference,
        userId: session.userId,
    });


    revalidatePath('/pos');
}


// This function will post the financial impact of the closed session to the GL
async function settlePosSession(sessionId: string, data: {
    openingBalance: number;
    cashSales: number;
    cardSales: number;
    deferredSales: number;
    closingBalance: number;
    difference: number;
    userId: string;
}) {
  const db = await getDb();
  
  const settingsResult = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, 'T001'), // Assuming single tenant for now
  });
  const settings = settingsResult?.settings as any || {};
  const accountMappings = settings.accountMappings || {};

  const totalSales = data.cashSales + data.cardSales + data.deferredSales;
  const VAT_RATE = (settings.vatRate || 15) / 100;
  const totalBeforeTax = totalSales / (1 + VAT_RATE);
  const vatAmount = totalSales - totalBeforeTax;

  const newEntryId = `JV-POSS-${sessionId}`;

  // Account IDs from settings, with fallbacks
  const POS_CASH_ACCOUNT = accountMappings?.posCashAccount || '1111';
  const BANK_ACCOUNT = accountMappings?.bankAccount || '1121'; 
  const ACCOUNTS_RECEIVABLE = accountMappings?.accountsReceivable || '1200';
  const SALES_REVENUE = accountMappings?.salesRevenue || '4000';
  const VAT_PAYABLE = accountMappings?.vatPayable || '2200';
  const CASH_OVER_SHORT = accountMappings?.cashOverShort || '5303'; 

  await db.transaction(async (tx) => {
    await tx.insert(journalEntries).values({
      id: newEntryId,
      date: new Date(),
      description: `ترحيل جلسة نقاط البيع رقم ${sessionId} للموظف ${data.userId}`,
      totalAmount: String(totalSales + data.openingBalance), // Total debits might not be this simple
      status: "مرحل",
      sourceModule: "POSSession",
      sourceDocumentId: sessionId,
    });

    const lines = [];

    // --- Debit Side ---
    // 1. Debit POS cash account with closing balance
    if (data.closingBalance > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: POS_CASH_ACCOUNT, debit: String(data.closingBalance), credit: '0', description: 'إثبات المبلغ المقفول في الصندوق' });
    }
    // 2. Debit Bank account for card sales
    if (data.cardSales > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: BANK_ACCOUNT, debit: String(data.cardSales), credit: '0', description: 'إثبات مبيعات البطاقات' });
    }
    // 3. Debit Accounts Receivable for deferred sales
    if (data.deferredSales > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: ACCOUNTS_RECEIVABLE, debit: String(data.deferredSales), credit: '0', description: 'إثبات المبيعات الآجلة' });
    }
    // 4. Debit Cash Over/Short if there was a shortage (difference is negative)
    if (data.difference < 0) {
        lines.push({ journalEntryId: newEntryId, accountId: CASH_OVER_SHORT, debit: String(Math.abs(data.difference)), credit: '0', description: 'تسجيل عجز في الصندوق' });
    }

    // --- Credit Side ---
    // 1. Credit POS cash account with opening balance (as it's now part of the closing balance)
    if(data.openingBalance > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: POS_CASH_ACCOUNT, debit: '0', credit: String(data.openingBalance), description: 'عكس الرصيد الافتتاحي' });
    }
    // 2. Credit Sales Revenue
    if (totalBeforeTax > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: SALES_REVENUE, debit: '0', credit: String(totalBeforeTax), description: 'إثبات إيرادات المبيعات' });
    }
    // 3. Credit VAT Payable
    if (vatAmount > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: VAT_PAYABLE, debit: '0', credit: String(vatAmount), description: 'إثبات ضريبة القيمة المضافة' });
    }
    // 4. Credit Cash Over/Short if there was an overage (difference is positive)
    if (data.difference > 0) {
        lines.push({ journalEntryId: newEntryId, accountId: CASH_OVER_SHORT, debit: '0', credit: String(data.difference), description: 'تسجيل زيادة في الصندوق' });
    }

    if (lines.length > 0) {
      await tx.insert(journalEntryLines).values(lines);
    }
  });

  revalidatePath('/general-ledger');
}

    

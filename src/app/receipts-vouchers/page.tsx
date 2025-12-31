
import React from 'react';
import { connectToTenantDb } from '@/db';
import { journalEntries, journalEntryLines, chartOfAccounts, customers, suppliers } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import ReceiptsVouchersClient from './ReceiptsVouchersClient';
import type { Party, Account } from './actions';

export default async function ReceiptsVouchersPage() {
    const { db } = await connectToTenantDb();
    try {
        const voucherEntries = await db.select().from(journalEntries).where(
            or(
                eq(journalEntries.sourceModule, "ReceiptVoucher"),
                eq(journalEntries.sourceModule, "PaymentVoucher")
            )
        );

        const vouchersData = await Promise.all(
            voucherEntries.map(async (entry) => {
                const line = await db.query.journalEntryLines.findFirst({
                    where: eq(journalEntryLines.journalEntryId, entry.id),
                });
                return {
                    id: entry.id,
                    date: new Date(entry.date),
                    type: entry.sourceModule === 'ReceiptVoucher' ? 'سند قبض' as const : 'سند صرف' as const,
                    method: 'نقدي', // This would need to be stored or inferred
                    partyId: line?.description || '', // Simplified, needs better modeling
                    partyName: line?.description || '',
                    accountId: line?.accountId || '',
                    amount: parseFloat(entry.totalAmount),
                    status: entry.status as "مسودة" | "مرحل",
                    branch: "الرئيسي", // This needs to be modeled
                    notes: entry.description,
                };
            })
        );
        
        const accountsData = await db.select({ id: chartOfAccounts.id, name: chartOfAccounts.name, type: chartOfAccounts.type }).from(chartOfAccounts).where(
            or(
                eq(chartOfAccounts.type, "صندوق"),
                eq(chartOfAccounts.type, "بنك")
            )
        );
        
        const customersData = await db.select({ id: customers.id, name: customers.name }).from(customers);
        const suppliersData = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);

        const partiesData: Party[] = [
            ...customersData.map(c => ({ id: c.id, name: c.name, type: 'customer' as const })),
            ...suppliersData.map(s => ({ id: s.id, name: s.name, type: 'supplier' as const })),
            { id: "EXP001", name: "مصروفات عامة", type: "expense" as const }, // Example for expense
        ];

        const initialData = {
            vouchers: vouchersData,
            accounts: accountsData,
            parties: partiesData,
        };

        return <ReceiptsVouchersClient initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Receipts & Vouchers page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة السندات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب البيانات. يرجى التأكد من أن جداول الحسابات (`journal_entries`, etc.) موجودة.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

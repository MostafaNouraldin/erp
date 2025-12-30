
import React from 'react';
import { db } from '@/db';
import { journalEntries, journalEntryLines, chartOfAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import OpeningBalancesClient from './OpeningBalancesClient';

export default async function OpeningBalancesPage() {
    try {
        const openingBalanceEntries = await db.select().from(journalEntries).where(eq(journalEntries.sourceModule, "OpeningBalance"));
        
        const openingBalancesData = await Promise.all(
            openingBalanceEntries.map(async (entry) => {
                const line = await db.query.journalEntryLines.findFirst({
                    where: eq(journalEntryLines.journalEntryId, entry.id),
                });
                return {
                    id: entry.id,
                    accountId: line?.accountId || '',
                    date: new Date(entry.date),
                    debit: line ? parseFloat(line.debit) : 0,
                    credit: line ? parseFloat(line.credit) : 0,
                    notes: entry.description,
                };
            })
        );
        
        const accountsData = await db.select({
            id: chartOfAccounts.id,
            name: chartOfAccounts.name,
            type: chartOfAccounts.type,
        }).from(chartOfAccounts);

        const initialData = {
            openingBalances: openingBalancesData,
            accounts: accountsData,
        };

        return <OpeningBalancesClient initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Opening Balances page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة الأرصدة الافتتاحية</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات. قد تكون جداول الحسابات غير موجودة.
                </p>
                 <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

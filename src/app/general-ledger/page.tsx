
import React from 'react';
import { connectToTenantDb } from '@/db';
import { chartOfAccounts, journalEntries, journalEntryLines } from '@/db/schema';
import { eq } from 'drizzle-orm';
import GeneralLedgerClientComponent from './GeneralLedgerClientComponent';

export default async function GeneralLedgerPage() {
    const tenantId = 'T001'; // In a real app, this would come from the user's session
    const { db } = await connectToTenantDb(tenantId);
    try {
        const chartOfAccountsData = await db.select().from(chartOfAccounts);
        const journalEntriesData = await db.select().from(journalEntries);
        
        const journalEntriesWithLines = await Promise.all(
            journalEntriesData.map(async (entry) => {
                const lines = await db.select().from(journalEntryLines).where(eq(journalEntryLines.journalEntryId, entry.id));
                return {
                    ...entry,
                    date: new Date(entry.date),
                    totalAmount: parseFloat(entry.totalAmount),
                    lines: lines.map(line => ({
                        ...line,
                        debit: parseFloat(line.debit),
                        credit: parseFloat(line.credit),
                    })),
                };
            })
        );

        const initialData = {
            chartOfAccounts: chartOfAccountsData.map(acc => ({...acc, balance: parseFloat(acc.balance || '0')})),
            journalEntries: journalEntriesWithLines,
        };

        return <GeneralLedgerClientComponent initialData={initialData} />;
        
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for General Ledger page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في الحسابات العامة</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول الحسابات (`chart_of_accounts`, `journal_entries`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

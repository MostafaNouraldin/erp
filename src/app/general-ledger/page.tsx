
import React from 'react';
import { db } from '@/db';
import { chartOfAccounts, journalEntries, journalEntryLines } from '@/db/schema';
import { eq } from 'drizzle-orm';
import GeneralLedgerClientComponent from './GeneralLedgerClientComponent';

export default async function GeneralLedgerPage() {
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
}

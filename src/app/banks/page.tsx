
import React from 'react';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import BanksPageClient from './page.tsx';

export default async function BanksPage() {
    try {
        const bankAccountsData = await db.select().from(bankAccounts);
        const initialData = bankAccountsData.map(acc => ({
            ...acc,
            balance: parseFloat(acc.balance),
            isActive: acc.isActive ?? true,
        }));
        
        return <BanksPageClient initialBankAccounts={initialData} />;

    } catch (error) {
        // Handle error as before
        const errorMessage = (error as Error).message;
        return <div>Error loading data: {errorMessage}</div>
    }
}

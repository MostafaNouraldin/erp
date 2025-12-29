
import React from 'react';
import { db } from '@/db';
import { checks, bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CheckbookRegisterClientComponent from './CheckbookRegisterClientComponent';


export default async function CheckbookRegisterPage() {
    const checksData = await db.select().from(checks);
    const bankAccountsData = await db.select().from(bankAccounts);

    const initialData = {
        checks: checksData.map(c => ({ 
            ...c, 
            amount: parseFloat(c.amount),
            issueDate: new Date(c.issueDate),
            dueDate: new Date(c.dueDate),
            status: c.status as "صادر" | "مسدد" | "ملغي" | "مرتجع",
        })),
        bankAccounts: bankAccountsData.map(b => ({ id: b.id, name: b.bankName })),
    };

    return <CheckbookRegisterClientComponent initialData={initialData} />;
}

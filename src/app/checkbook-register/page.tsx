
import React from 'react';
import { db } from '@/db';
import { checks, bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CheckbookRegisterClientComponent from './CheckbookRegisterClientComponent';


export default async function CheckbookRegisterPage() {
    try {
        const checksData = await db.select().from(checks);
        const bankAccountsData = await db.select({ id: bankAccounts.id, name: bankAccounts.bankName }).from(bankAccounts);

        const initialData = {
            checks: checksData.map(c => ({ 
                ...c, 
                amount: parseFloat(c.amount),
                issueDate: new Date(c.issueDate),
                dueDate: new Date(c.dueDate),
                status: c.status as "صادر" | "مسدد" | "ملغي" | "مرتجع",
            })),
            bankAccounts: bankAccountsData,
        };

        return <CheckbookRegisterClientComponent initialData={initialData} />;
    } catch (error) {
        const errorMessage = (error as Error).message;
         return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة دفتر الشيكات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب البيانات. يرجى التأكد من أن جدول `checks` موجود.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

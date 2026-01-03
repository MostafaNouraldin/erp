
import React from 'react';
import { connectToTenantDb } from '@/db';
import { bankAccounts } from '@/db/schema';
import BanksPageClient from './BanksPageClient';

export default async function BanksPage() {
    const { db } = await connectToTenantDb();
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
        console.error("Database query failed for Banks page:", errorMessage);
        return (
             <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة البنوك</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد يكون جدول `bank_accounts` غير موجود.
                </p>
                 <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

    
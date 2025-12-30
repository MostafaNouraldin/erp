import React from 'react';
import { connectToTenantDb } from '@/db';
import { chartOfAccounts } from '@/db/schema';
import ReportsClient from './ReportsClient';

async function getReportsData() {
    const tenantId = 'T001'; // In a real app, this would come from the user's session
    const { db } = await connectToTenantDb(tenantId);

    try {
        const accounts = await db.select().from(chartOfAccounts);
        return {
            success: true,
            data: {
                accounts: accounts.map(acc => ({...acc, balance: parseFloat(acc.balance || '0')})),
            }
        };

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Reports page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}


export default async function ReportsPage() {
    const result = await getReportsData();

    if (!result.success) {
         return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة التقارير</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {result.error}</p>
            </div>
        );
    }
  
    return <ReportsClient initialData={result.data} />;
}

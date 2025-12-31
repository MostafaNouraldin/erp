
import React from 'react';
import { connectToTenantDb } from '@/db';
import { cashExpenses, chartOfAccounts } from '@/db/schema';
import { like, or } from 'drizzle-orm';
import CashExpensesClient from './CashExpensesClient';

export default async function CashExpensesPage() {
  const { db } = await connectToTenantDb();
  try {
    const expensesData = await db.select().from(cashExpenses);
    // Assuming cash accounts are like '101%' and expense accounts are '5%'
    const accountsData = await db.select().from(chartOfAccounts).where(or(like(chartOfAccounts.id, '101%'), like(chartOfAccounts.id, '5%')));

    const initialData = {
      cashExpenses: expensesData.map(e => ({
        ...e,
        date: new Date(e.date),
        amount: parseFloat(e.amount),
      })),
      cashAccounts: accountsData.filter(a => a.id.startsWith('101')),
      expenseAccounts: accountsData.filter(a => a.id.startsWith('5')),
    };

    return <CashExpensesClient initialData={initialData} />;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Database query failed for Cash Expenses page:", errorMessage);
    return (
        <div className="container mx-auto py-6 text-center" dir="rtl">
            <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة المصروفات النقدية</h1>
            <p className="text-muted-foreground mb-4">
                تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول المصروفات (`cash_expenses`, `chart_of_accounts`) غير موجودة.
            </p>
            <p className="mb-2">
                يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
            </p>
            <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
        </div>
    );
  }
}

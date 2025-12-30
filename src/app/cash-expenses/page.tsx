
import React from 'react';
import { db } from '@/db';
import { cashExpenses, chartOfAccounts } from '@/db/schema';
import { like, or } from 'drizzle-orm';
import CashExpensesClient from './CashExpensesClient';

export default async function CashExpensesPage() {
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
    return <div>Error loading data: {errorMessage}</div>;
  }
}

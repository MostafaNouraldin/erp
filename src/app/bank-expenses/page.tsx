
import React from 'react';
import { db } from '@/db';
import { bankExpenses, bankAccounts, chartOfAccounts } from '@/db/schema';
import { like } from 'drizzle-orm';
import BankExpensesClient from './BankExpensesClient';

export default async function BankExpensesPage() {
  try {
    const expensesData = await db.select().from(bankExpenses);
    const bankAccountsData = await db.select().from(bankAccounts);
    const expenseAccountsData = await db.select().from(chartOfAccounts).where(like(chartOfAccounts.id, '5%'));

    const initialData = {
      bankExpenses: expensesData.map(e => ({
        ...e,
        date: new Date(e.date),
        amount: parseFloat(e.amount),
      })),
      bankAccounts: bankAccountsData,
      expenseAccounts: expenseAccountsData,
    };

    return <BankExpensesClient initialData={initialData} />;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Database query failed for Bank Expenses page:", errorMessage);
    return <div>Error loading data: {errorMessage}</div>;
  }
}


import React from 'react';
import { connectToTenantDb } from '@/db';
import { cashReceipts, chartOfAccounts, customers } from '@/db/schema';
import { like, or } from 'drizzle-orm';
import CashReceiptsClient from './CashReceiptsClient';

export default async function CashReceiptsPage() {
  const { db } = await connectToTenantDb();

  try {
    const receiptsData = await db.select().from(cashReceipts);
    const cashAccountsData = await db.select().from(chartOfAccounts).where(like(chartOfAccounts.id, '101%'));
    const revenueAccountsData = await db.select().from(chartOfAccounts).where(like(chartOfAccounts.id, '4%'));
    const customersData = await db.select().from(customers);

    const initialData = {
      cashReceipts: receiptsData.map(r => ({
        ...r,
        date: new Date(r.date),
        amount: parseFloat(r.amount),
        status: r.status as "مسودة" | "مرحل",
      })),
      cashAccounts: cashAccountsData,
      revenueAccounts: revenueAccountsData,
      customers: customersData,
    };

    return <CashReceiptsClient initialData={initialData} />;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Database query failed for Cash Receipts page:", errorMessage);
    return <div>Error loading data: {errorMessage}</div>;
  }
}


import React from 'react';
import { connectToTenantDb } from '@/db';
import { bankReceipts, bankAccounts, chartOfAccounts, customers } from '@/db/schema';
import { like } from 'drizzle-orm';
import BankReceiptsClient from './BankReceiptsClient';

export default async function BankReceiptsPage() {
  const tenantId = 'T001'; // In a real app, this comes from the user session
  const { db } = await connectToTenantDb(tenantId);

  try {
    const receiptsData = await db.select().from(bankReceipts);
    const bankAccountsData = await db.select().from(bankAccounts);
    const revenueAccountsData = await db.select().from(chartOfAccounts).where(like(chartOfAccounts.id, '4%'));
    const customersData = await db.select().from(customers);

    const initialData = {
      bankReceipts: receiptsData.map(r => ({
        ...r,
        date: new Date(r.date),
        amount: parseFloat(r.amount),
        status: r.status as "مسودة" | "مرحل",
      })),
      bankAccounts: bankAccountsData,
      revenueAccounts: revenueAccountsData,
      customers: customersData,
    };

    return <BankReceiptsClient initialData={initialData} />;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("Database query failed for Bank Receipts page:", errorMessage);
    return <div>Error loading data: {errorMessage}</div>;
  }
}

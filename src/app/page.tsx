
import React from 'react';
import { db } from "@/db";
import { salesInvoices, customers, products, journalEntries, journalEntryLines, chartOfAccounts } from "@/db/schema";
import { sql, and, eq, like, between } from 'drizzle-orm';
import { CurrencyProvider } from "@/contexts/currency-context";
import DashboardClient from "./DashboardClient";

async function getDashboardData() {
  try {
    // Total Revenue (from paid invoices)
    const totalRevenueResult = await db
      .select({
        total: sql<number>`sum(CAST(${salesInvoices.numericTotalAmount} AS numeric))`,
      })
      .from(salesInvoices)
      .where(eq(salesInvoices.status, 'مدفوع'));
    const totalRevenue = totalRevenueResult[0].total || 0;

    // Active Customers
    const activeCustomersCount = await db.select({
        count: sql<number>`count(*)`,
      }).from(customers);
    const totalCustomers = activeCustomersCount[0].count;

    // Total Sales
    const salesCountResult = await db.select({
      count: sql<number>`count(*)`,
    }).from(salesInvoices);
    const totalSales = salesCountResult[0].count;

    // Active Rate (represented by total journal entries for now)
    const activityCountResult = await db.select({
        count: sql<number>`count(*)`,
      }).from(journalEntries);
    const totalActivity = activityCountResult[0].count;

    // Inventory Summary
    const inventoryStats = await db.select({
        totalProducts: sql<number>`count(*)`,
        inventoryValue: sql<number>`sum(CAST(${products.costPrice} AS numeric) * ${products.quantity})`,
        lowStockItems: sql<number>`count(*) filter (where ${products.quantity} <= ${products.reorderLevel} and ${products.reorderLevel} > 0)`,
    }).from(products);
    
    const inventorySummary = {
        totalItems: inventoryStats[0].totalProducts || 0,
        totalValue: inventoryStats[0].inventoryValue || 0,
        lowStockCount: inventoryStats[0].lowStockItems || 0,
    };

    // Sales Overview Chart Data
    const salesByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${salesInvoices.date}, 'YYYY-MM')`,
        total: sql<number>`sum(CAST(${salesInvoices.numericTotalAmount} AS numeric))`,
      })
      .from(salesInvoices)
      .groupBy(sql`TO_CHAR(${salesInvoices.date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${salesInvoices.date}, 'YYYY-MM')`)
      .limit(6);

    const salesChartData = salesByMonth.map(row => ({
      month: new Date(row.month + '-01').toLocaleString('ar-SA', { month: 'long' }),
      total: Number(row.total),
    }));
    
    // Expense Distribution Chart Data
     const expenseAccountsResult = await db.select({
        accountId: journalEntryLines.accountId,
        accountName: chartOfAccounts.name,
        total: sql<number>`sum(CAST(${journalEntryLines.debit} AS numeric))`
      })
      .from(journalEntryLines)
      .leftJoin(chartOfAccounts, eq(journalEntryLines.accountId, chartOfAccounts.id))
      .where(like(journalEntryLines.accountId, '5%')) // Assuming expense accounts start with '5'
      .groupBy(journalEntryLines.accountId, chartOfAccounts.name)
      .orderBy(sql`sum(CAST(${journalEntryLines.debit} AS numeric)) DESC`)
      .limit(4);

      const expenseChartData = expenseAccountsResult.map(row => ({
          name: row.accountName || row.accountId,
          value: Number(row.total),
      }));

    return {
      success: true,
      data: {
        totalRevenue,
        totalCustomers,
        totalSales,
        totalActivity,
        inventorySummary,
        salesChartData,
        expenseChartData
      }
    };
  } catch (error) {
    console.error("Database query failed for Dashboard page:", error);
    return { success: false, error: (error as Error).message };
  }
}


export default async function DashboardPage() {
  const result = await getDashboardData();
  
  if (!result.success) {
    return (
        <div className="container mx-auto py-6 text-center" dir="rtl">
            <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في لوحة التحكم</h1>
            <p className="text-muted-foreground mb-4">
                تعذر جلب البيانات من قاعدة البيانات. قد تكون الجداول الأساسية غير موجودة.
            </p>
            <p className="mb-2">
                يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
            </p>
            <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {result.error}</p>
        </div>
    );
  }

  return (
     <CurrencyProvider>
      <DashboardClient
        totalRevenue={result.data.totalRevenue}
        totalCustomers={result.data.totalCustomers}
        totalSales={result.data.totalSales}
        totalActivity={result.data.totalActivity}
        inventorySummary={result.data.inventorySummary}
        salesChartData={result.data.salesChartData}
        expenseChartData={result.data.expenseChartData}
      />
     </CurrencyProvider>
  );
}


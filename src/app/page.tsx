
import React from 'react';
import { connectToTenantDb } from "@/db";
import { salesInvoices, customers, products, journalEntries, journalEntryLines, chartOfAccounts } from "@/db/schema";
import { sql, and, eq, like, between } from 'drizzle-orm';
import { CurrencyProvider } from "@/contexts/currency-context";
import DashboardClient from "./DashboardClient";

async function getDashboardData() {
  const { db } = await connectToTenantDb();
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
    const errorMessage = (error as Error).message;
    // This is the most likely error when the database is not set up.
    if (errorMessage.includes("does not exist") || errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
        return { success: false, error: "Database tables not found. Please set up your database schema." };
    }
    console.error("Database query failed for Dashboard page:", error);
    return { success: false, error: errorMessage };
  }
}


export default async function DashboardPage() {
  const result = await getDashboardData();
  
  if (!result.success) {
    return (
        <div className="container mx-auto py-10 px-4 text-center" dir="rtl">
            <div className="max-w-2xl mx-auto bg-card border border-destructive/50 rounded-lg p-8 shadow-lg">
                <h1 className="text-3xl font-bold mb-4 text-destructive">خطأ حرج: قاعدة البيانات غير مهيأة</h1>
                <p className="text-muted-foreground mb-6 text-lg">
                    يبدو أن جداول قاعدة البيانات الأساسية غير موجودة. هذا يمنع التطبيق من العمل بشكل صحيح.
                </p>
                <div className="bg-muted/50 p-6 rounded-md text-right space-y-4">
                    <h2 className="text-xl font-semibold text-primary">الحل المطلوب:</h2>
                    <ol className="list-decimal list-inside space-y-3 text-card-foreground">
                        <li>
                            افتح ملف <code className="font-mono bg-muted p-1 rounded-md text-sm">db_schema.sql</code> الموجود في جذر المشروع.
                        </li>
                        <li>
                            انسخ **جميع** محتويات هذا الملف.
                        </li>
                        <li>
                            اذهب إلى لوحة تحكم مشروعك في <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">Supabase</a>.
                        </li>
                        <li>
                            من القائمة الجانبية، اختر <span className="font-semibold">SQL Editor</span>.
                        </li>
                        <li>
                            ألصق المحتوى الذي نسخته في محرر SQL ثم اضغط على زر **RUN**.
                        </li>
                    </ol>
                    <p className="pt-4 text-muted-foreground">
                        بعد تنفيذ هذه الخطوات بنجاح، قم بإعادة تحميل هذه الصفحة. إذا استمرت المشكلة، يرجى مراجعة سجلات قاعدة البيانات في Supabase.
                    </p>
                </div>
                 <p className="text-sm text-muted-foreground mt-6">
                    رسالة الخطأ الأصلية (للمطورين): <span className="font-mono text-xs">{result.error}</span>
                </p>
            </div>
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

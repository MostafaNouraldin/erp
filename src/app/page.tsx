
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, ShoppingCart, Activity, ArrowUpRight, FilePlus, FileCheck, FileClock, Package } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { db } from "@/db";
import { salesInvoices, customers, products, journalEntries, journalEntryLines, chartOfAccounts } from "@/db/schema";
import { sql, and, eq, like, between } from 'drizzle-orm';
import { CurrencyProvider, availableCurrencies } from "@/contexts/currency-context";
import DashboardClient from "./DashboardClient";

async function getDashboardData() {
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
    totalRevenue,
    totalCustomers,
    totalSales,
    totalActivity,
    inventorySummary,
    salesChartData,
    expenseChartData
  };
}


export default async function DashboardPage() {
  const data = await getDashboardData();
  
  // To avoid passing a server-only object to the client component,
  // we can either pass primitive values or wrap it in a provider.
  // For simplicity, we'll pass primitive values.

  return (
     <CurrencyProvider>
      <DashboardClient
        totalRevenue={data.totalRevenue}
        totalCustomers={data.totalCustomers}
        totalSales={data.totalSales}
        totalActivity={data.totalActivity}
        inventorySummary={data.inventorySummary}
        salesChartData={data.salesChartData}
        expenseChartData={data.expenseChartData}
      />
     </CurrencyProvider>
  );
}


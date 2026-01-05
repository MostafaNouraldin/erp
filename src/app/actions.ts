
'use server';

import { connectToTenantDb } from '@/db';
import { salesInvoices, customers, journalEntries, products, employees, leaveRequests, purchaseOrders, companySettings } from '@/db/schema';
import { sql, and, eq }from 'drizzle-orm';

export async function getDashboardData() {
    const { db } = await connectToTenantDb();

    try {
        const totalRevenueResult = await db.select({ total: sql`sum(cast(numeric_total_amount as numeric))` }).from(salesInvoices).where(eq(salesInvoices.status, 'مدفوع'));
        const totalCustomersResult = await db.select({ count: sql`count(*)` }).from(customers);
        const totalSalesResult = await db.select({ count: sql`count(*)` }).from(salesInvoices);
        const totalActivityResult = await db.select({ count: sql`count(*)` }).from(journalEntries);
        const totalItemsResult = await db.select({ count: sql`count(*)` }).from(products);
        const totalValueResult = await db.select({ total: sql`sum(cast(cost_price as numeric) * quantity)` }).from(products);
        const lowStockCountResult = await db.select({ count: sql`count(*)` }).from(products).where(sql`quantity <= reorder_level AND reorder_level > 0`);
        const totalEmployeesResult = await db.select({ count: sql`count(*)` }).from(employees);
        const pendingLeavesResult = await db.select({ count: sql`count(*)` }).from(leaveRequests).where(eq(leaveRequests.status, 'مقدمة'));

        const salesByMonth = await db.execute(sql`
            SELECT
                to_char(date, 'YYYY-MM') as month,
                sum(cast(numeric_total_amount as numeric)) as total
            FROM sales_invoices
            WHERE date > current_date - interval '6 months'
            GROUP BY 1
            ORDER BY 1;
        `);
        
        const expenseByCategory = await db.execute(sql`
            SELECT
                ca.name,
                sum(cast(jel.debit as numeric)) as value
            FROM journal_entry_lines jel
            JOIN chart_of_accounts ca ON ca.id = jel.account_id
            WHERE jel.account_id LIKE '5%'
            GROUP BY ca.name
            ORDER BY value DESC
            LIMIT 4;
        `);

        const latestActivitiesResult = await db.execute(sql`
            (SELECT 'فاتورة مبيعات جديدة' as description, id, date as activity_date FROM sales_invoices ORDER BY date DESC LIMIT 1)
            UNION ALL
            (SELECT 'أمر شراء جديد' as description, id, date as activity_date FROM purchase_orders ORDER BY date DESC LIMIT 1)
            UNION ALL
            (SELECT 'طلب إجازة جديد' as description, id, start_date as activity_date FROM leave_requests ORDER BY start_date DESC LIMIT 1)
            ORDER BY activity_date DESC;
        `);

        const iconMap: { [key: string]: string } = {
            'فاتورة مبيعات جديدة': 'FilePlus',
            'أمر شراء جديد': 'FileCheck',
            'طلب إجازة جديد': 'FileClock',
        };

        const latestActivities = (latestActivitiesResult as any[]).map(act => ({
            description: `${act.description} #${act.id}`,
            time: new Date(act.activity_date).toISOString(),
            icon: iconMap[act.description] || 'FileClock'
        }));


        const data = {
            totalRevenue: Number(totalRevenueResult[0]?.total) || 0,
            totalCustomers: Number(totalCustomersResult[0]?.count) || 0,
            totalSales: Number(totalSalesResult[0]?.count) || 0,
            totalActivity: Number(totalActivityResult[0]?.count) || 0,
            inventorySummary: {
                totalItems: Number(totalItemsResult[0]?.count) || 0,
                totalValue: Number(totalValueResult[0]?.total) || 0,
                lowStockCount: Number(lowStockCountResult[0]?.count) || 0,
            },
            salesChartData: (salesByMonth as any[]).map(row => ({ month: row.month, total: Number(row.total) })),
            expenseChartData: (expenseByCategory as any[]).map(row => ({ name: row.name, value: Number(row.value) })),
            hrSummary: {
                totalEmployees: Number(totalEmployeesResult[0]?.count) || 0,
                attendancePercentage: 98.5, // This remains static as we don't have attendance data model yet
                pendingLeaves: Number(pendingLeavesResult[0]?.count) || 0,
            },
            latestActivities: latestActivities,
        };
        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return { success: false, error: (error as Error).message, data: null };
    }
}

export async function getCompanySettingsForLayout(tenantId?: string | null) {
  if (!tenantId) return null;
  const { db } = await connectToTenantDb(tenantId);
  const result = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, tenantId),
  });
  return result?.settings as { companyName?: string; companyLogo?: string } | undefined;
}

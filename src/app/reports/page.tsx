
import React from 'react';
import { connectToTenantDb } from '@/db';
import { chartOfAccounts, salesInvoices, salesInvoiceItems, products, customers, payrolls, attendanceRecords } from '@/db/schema';
import ReportsClient from './ReportsClient';
import { eq, desc } from 'drizzle-orm';

async function getReportsData() {
    const { db } = await connectToTenantDb();

    try {
        const accounts = await db.select().from(chartOfAccounts);
        const invoices = await db.select().from(salesInvoices);
        const invoiceItems = await db.select().from(salesInvoiceItems);
        const productsData = await db.select().from(products);
        const customersData = await db.select().from(customers);
        const payrollsData = await db.select().from(payrolls);
        const attendanceData = await db.select().from(attendanceRecords);

        // Process sales by product
        const salesByProductData = invoiceItems.reduce((acc, item) => {
            if (!acc[item.itemId]) {
                acc[item.itemId] = { quantity: 0, total: 0, name: productsData.find(p => p.id === item.itemId)?.name || item.itemId };
            }
            acc[item.itemId].quantity += item.quantity;
            acc[item.itemId].total += parseFloat(item.total);
            return acc;
        }, {} as Record<string, { quantity: number; total: number, name: string }>);

        // Process sales by customer
        const salesByCustomerData = invoices.reduce((acc, invoice) => {
            if (!acc[invoice.customerId]) {
                acc[invoice.customerId] = { total: 0, name: customersData.find(c => c.id === invoice.customerId)?.name || invoice.customerId };
            }
            acc[invoice.customerId].total += parseFloat(invoice.numericTotalAmount);
            return acc;
        }, {} as Record<string, { total: number, name: string }>);

        const inventoryValuationData = productsData.map(p => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            costPrice: parseFloat(p.costPrice),
            totalValue: p.quantity * parseFloat(p.costPrice),
        }));


        return {
            success: true,
            data: {
                accounts: accounts.map(acc => ({...acc, balance: parseFloat(acc.balance || '0')})),
                salesByProduct: Object.values(salesByProductData).sort((a, b) => b.total - a.total),
                salesByCustomer: Object.values(salesByCustomerData).sort((a, b) => b.total - a.total),
                inventoryValuation: inventoryValuationData,
                payrolls: payrollsData.map(p => ({...p, basicSalary: parseFloat(p.basicSalary), netSalary: p.netSalary ? parseFloat(p.netSalary) : 0 })),
                attendances: attendanceData.map(a => ({...a, date: new Date(a.date)})),
                products: productsData,
                customers: customersData,
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

    
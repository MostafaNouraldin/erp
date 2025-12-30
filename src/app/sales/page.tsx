
// This is now a true Server Component that fetches data and passes it to the client.
import React from 'react';
import { db } from '@/db';
import { customers as customersSchema, salesInvoices as salesInvoicesSchema, salesInvoiceItems as salesInvoiceItemsSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';
import SalesClientComponent from './SalesClientComponent'; // We will create this component

// This is now a true Server Component that fetches data and passes it to the client component.
export default async function SalesPage() {
    try {
        const customersResult = await db.select().from(customersSchema);
        const invoicesResult = await db.select().from(salesInvoicesSchema);

        // In a real app, you would fetch items for each invoice more efficiently
        // This is simplified for demonstration
        const invoicesWithItems = await Promise.all(invoicesResult.map(async (invoice) => {
            const items = await db.select().from(salesInvoiceItemsSchema).where(eq(salesInvoiceItemsSchema.invoiceId, invoice.id));
            return {
                ...invoice,
                date: new Date(invoice.date),
                dueDate: new Date(invoice.dueDate),
                numericTotalAmount: parseFloat(invoice.numericTotalAmount),
                status: invoice.status as "مدفوع" | "غير مدفوع" | "متأخر",
                source: invoice.source as "POS" | "Manual" | null,
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                })),
            };
        }));
        
        const initialData = {
            customers: customersResult.map(c => ({
                ...c,
                balance: parseFloat(c.balance ?? '0'),
            })),
            invoices: invoicesWithItems,
        };

        return <SalesClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Sales page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة المبيعات</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول المبيعات (`sales_invoices`, `customers`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

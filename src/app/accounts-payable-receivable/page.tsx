
import React from 'react';
import { connectToTenantDb } from '@/db';
import { customers, salesInvoices, salesInvoiceItems, suppliers, supplierInvoices, supplierInvoiceItems as dbSupplierInvoiceItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import AccountsPayableReceivableClientComponent from './AccountsPayableReceivableClientComponent';


// This is now a true Server Component that fetches data and passes it to the client component.
export default async function AccountsPayableReceivablePage() {
    const { db } = await connectToTenantDb();
    
    const customersResult = await db.select().from(customers);
    const suppliersResult = await db.select().from(suppliers);
    const customerInvoicesResult = await db.select().from(salesInvoices);
    const supplierInvoicesResult = await db.select().from(supplierInvoices);

    const customerInvoicesWithItems = await Promise.all(
        customerInvoicesResult.map(async (invoice) => {
            const items = await db.select().from(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoice.id));
            return {
                ...invoice,
                date: new Date(invoice.date),
                dueDate: new Date(invoice.dueDate),
                numericTotalAmount: parseFloat(invoice.numericTotalAmount),
                status: invoice.status as "مدفوع" | "غير مدفوع" | "متأخر",
                isDeferredPayment: invoice.isDeferredPayment,
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                })),
            };
        })
    );

    const supplierInvoicesWithItems = await Promise.all(
        supplierInvoicesResult.map(async (invoice) => {
            const items = await db.select().from(dbSupplierInvoiceItems).where(eq(dbSupplierInvoiceItems.invoiceId, invoice.id));
            return {
                ...invoice,
                invoiceDate: new Date(invoice.invoiceDate),
                dueDate: new Date(invoice.dueDate),
                totalAmount: parseFloat(invoice.totalAmount),
                paidAmount: parseFloat(invoice.paidAmount),
                status: invoice.status as "غير مدفوع" | "مدفوع جزئياً" | "مدفوع" | "متأخر",
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                })),
            };
        })
    );

    const initialData = {
        customerInvoices: customerInvoicesWithItems,
        supplierInvoices: supplierInvoicesWithItems,
        customers: customersResult,
        suppliers: suppliersResult,
    };

    return <AccountsPayableReceivableClientComponent initialData={initialData} />;
}

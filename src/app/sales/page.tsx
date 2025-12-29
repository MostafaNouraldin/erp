
import React from 'react';
import { db } from '@/db';
import { customers as customersSchema, salesInvoices as salesInvoicesSchema, salesInvoiceItems as salesInvoiceItemsSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';
import SalesClientComponent from './SalesClientComponent'; // We will create this component

// This is now a true Server Component that fetches data and passes it to the client.
export default async function SalesPage() {
    const customersResult = await db.select().from(customersSchema);
    const invoicesResult = await db.select().from(salesInvoicesSchema);

    // In a real app, you would fetch items for each invoice more efficiently
    // This is simplified for demonstration
    const invoicesWithItems = await Promise.all(invoicesResult.map(async (invoice) => {
        const items = await db.select().from(salesInvoiceItemsSchema).where(eq(salesInvoiceItemsSchema.invoiceId, invoice.id));
        return {
            ...invoice,
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
            balance: (c.balance ?? '0').toString(),
        })),
        invoices: invoicesWithItems,
    };

    return <SalesClientComponent initialData={initialData} />;
}

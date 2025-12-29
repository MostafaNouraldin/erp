
// This is now a true Server Component that fetches data and passes it to the client.
import { db } from '@/db';
import { suppliers, purchaseOrders, purchaseOrderItems, supplierInvoices, supplierInvoiceItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import React from 'react';
import PurchasesClientComponent from './PurchasesClientComponent';


// This is now a true Server Component that fetches data and passes it to the client component.
export default async function PurchasesPage() {
    const suppliersResult = await db.select().from(suppliers);
    const purchaseOrdersResult = await db.select().from(purchaseOrders);
    const supplierInvoicesResult = await db.select().from(supplierInvoices);

    const purchaseOrdersWithItems = await Promise.all(
        purchaseOrdersResult.map(async (po) => {
            const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, po.id));
            return {
                ...po,
                date: new Date(po.date),
                expectedDeliveryDate: new Date(po.expectedDeliveryDate),
                totalAmount: parseFloat(po.totalAmount),
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                }))
            };
        })
    );

    const supplierInvoicesWithItems = await Promise.all(
        supplierInvoicesResult.map(async (inv) => {
            const items = await db.select().from(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, inv.id));
            return {
                ...inv,
                invoiceDate: new Date(inv.invoiceDate),
                dueDate: new Date(inv.dueDate),
                totalAmount: parseFloat(inv.totalAmount),
                paidAmount: parseFloat(inv.paidAmount),
                status: inv.status as "غير مدفوع" | "مدفوع جزئياً" | "مدفوع" | "متأخر",
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice),
                    total: parseFloat(item.total),
                }))
            };
        })
    );
    
    const initialData = {
        suppliers: suppliersResult,
        purchaseOrders: purchaseOrdersWithItems,
        supplierInvoices: supplierInvoicesWithItems,
    };

    return <PurchasesClientComponent initialData={initialData} />;
}

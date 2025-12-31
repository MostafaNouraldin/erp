

// This is now a true Server Component that fetches data and passes it to the client.
import { connectToTenantDb } from '@/db';
import { suppliers, purchaseOrders, purchaseOrderItems, supplierInvoices, supplierInvoiceItems, goodsReceivedNotes, goodsReceivedNoteItems, purchaseReturns, purchaseReturnItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import React from 'react';
import PurchasesClientComponent from './PurchasesClientComponent';


// This is now a true Server Component that fetches data and passes it to the client component.
export default async function PurchasesPage() {
    const tenantId = 'T001';
    const { db } = await connectToTenantDb(tenantId);
    try {
        const suppliersResult = await db.select().from(suppliers);
        const purchaseOrdersResult = await db.select().from(purchaseOrders);
        const supplierInvoicesResult = await db.select().from(supplierInvoices);
        const goodsReceivedNotesResult = await db.select().from(goodsReceivedNotes);
        const purchaseReturnsResult = await db.select().from(purchaseReturns);
        const productsResult = await db.select().from(products);

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

        const goodsReceivedNotesWithItems = await Promise.all(
            goodsReceivedNotesResult.map(async (grn) => {
                const items = await db.select().from(goodsReceivedNoteItems).where(eq(goodsReceivedNoteItems.grnId, grn.id));
                return {
                    ...grn,
                    grnDate: new Date(grn.grnDate),
                    items: items.map(item => ({
                        ...item,
                    }))
                };
            })
        );

        const purchaseReturnsWithItems = await Promise.all(
            purchaseReturnsResult.map(async (pr) => {
                const items = await db.select().from(purchaseReturnItems).where(eq(purchaseReturnItems.returnId, pr.id));
                return {
                    ...pr,
                    date: new Date(pr.date),
                    totalAmount: parseFloat(pr.totalAmount),
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
            goodsReceivedNotes: goodsReceivedNotesWithItems,
            purchaseReturns: purchaseReturnsWithItems,
            products: productsResult.map(p => ({ ...p, costPrice: parseFloat(p.costPrice), sellingPrice: parseFloat(p.sellingPrice) })),
        };

        return <PurchasesClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Purchases page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة المشتريات</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول المشتريات (`purchase_orders`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

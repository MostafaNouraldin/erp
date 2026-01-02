

// This is now a true Server Component that fetches data and passes it to the client.
import { connectToTenantDb } from '@/db';
import { products, categories, suppliers, warehouses, stockRequisitions, stockRequisitionItems, stockIssueVouchers, stockIssueVoucherItems, goodsReceivedNotes, goodsReceivedNoteItems } from '@/db/schema';
import React from 'react';
import InventoryClientComponent from './InventoryClientComponent';
import { eq } from 'drizzle-orm';


// This is now a true Server Component that fetches data and passes it to the client component.
export default async function InventoryPage() {
    const { db } = await connectToTenantDb();
    try {
        const productsResult = await db.select().from(products);
        const categoriesResult = await db.select().from(categories);
        const suppliersResult = await db.select().from(suppliers);
        const warehousesResult = await db.select().from(warehouses);
        const stockRequisitionsResult = await db.select().from(stockRequisitions);
        const stockIssueVouchersResult = await db.select().from(stockIssueVouchers);
        const goodsReceivedNotesResult = await db.select().from(goodsReceivedNotes);

        const requisitionsWithItems = await Promise.all(
            stockRequisitionsResult.map(async (req) => {
                const items = await db.select().from(stockRequisitionItems).where(eq(stockRequisitionItems.requisitionId, req.id));
                return { ...req, items };
            })
        );
        
        const issueVouchersWithItems = await Promise.all(
            stockIssueVouchersResult.map(async (voucher) => {
                const items = await db.select().from(stockIssueVoucherItems).where(eq(stockIssueVoucherItems.voucherId, voucher.id));
                return { ...voucher, items };
            })
        );

        const goodsReceivedNotesWithItems = await Promise.all(
            goodsReceivedNotesResult.map(async (grn) => {
                const items = await db.select().from(goodsReceivedNoteItems).where(eq(goodsReceivedNoteItems.grnId, grn.id));
                return { 
                    ...grn,
                    grnDate: new Date(grn.grnDate),
                    items: items.map(item => ({...item, receivedQuantity: item.receivedQuantity || 0, orderedQuantity: item.orderedQuantity || 0 })) 
                };
            })
        );

        const initialData = {
            products: productsResult.map(p => ({ ...p, costPrice: Number(p.costPrice), sellingPrice: Number(p.sellingPrice) })),
            categories: categoriesResult,
            suppliers: suppliersResult,
            warehouses: warehousesResult,
            stockRequisitions: requisitionsWithItems,
            stockIssueVouchers: issueVouchersWithItems,
            goodsReceivedNotes: goodsReceivedNotesWithItems,
        };

        return <InventoryClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Inventory page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة المخزون</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول المخزون (`products`, `categories`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

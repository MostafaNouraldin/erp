
import React from 'react';
import { connectToTenantDb } from '@/db';
import { inventoryAdjustments, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import InventoryAdjustmentsClient from './InventoryAdjustmentsClient';

export default async function InventoryAdjustmentsPage() {
    const tenantId = 'T001'; // In a real app, this comes from the user session
    const { db } = await connectToTenantDb(tenantId);
    try {
        const adjustmentsData = await db.select().from(inventoryAdjustments);
        const productsData = await db.select({ id: products.id, name: products.name, quantity: products.quantity }).from(products);
        
        const initialData = {
            adjustments: adjustmentsData.map(adj => ({
                ...adj,
                date: new Date(adj.date),
            })),
            products: productsData,
        };
        
        return <InventoryAdjustmentsClient initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Inventory Adjustments page:", errorMessage);
        // Fallback UI
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة التسويات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب البيانات. يرجى التأكد من أن جدول `inventory_adjustments` موجود في قاعدة البيانات.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}


import React from 'react';
import { connectToTenantDb } from '@/db';
import { inventoryTransfers, products } from '@/db/schema';
import InventoryTransfersClient from './InventoryTransfersClient';

// Mock warehouses as it's not in the schema yet.
const mockWarehouses = [
  { id: "WH001", name: "المستودع الرئيسي - الرياض" },
  { id: "WH002", name: "مستودع فرع جدة" },
  { id: "WH003", name: "مستودع الدمام" },
];

export default async function InventoryTransfersPage() {
    const tenantId = 'T001'; // In a real app, this comes from the user session
    const { db } = await connectToTenantDb(tenantId);
    try {
        const transfersData = await db.select().from(inventoryTransfers);
        const productsData = await db.select({ id: products.id, name: products.name, quantity: products.quantity }).from(products);

        const initialData = {
            transfers: transfersData.map(t => ({
                ...t,
                date: new Date(t.date),
            })),
            products: productsData,
            warehouses: mockWarehouses, // Using mock data for now
        };
        
        return <InventoryTransfersClient initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Inventory Transfers page:", errorMessage);
        // Fallback UI
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة التحويلات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب البيانات. يرجى التأكد من أن جدول `inventory_transfers` موجود في قاعدة البيانات.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}


import React from 'react';
import { connectToTenantDb } from '@/db';
import { products, workOrders, billsOfMaterial, billOfMaterialItems, productionPlans, qualityChecks, workOrderProductionLogs, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProductionClientComponent from './ProductionClientComponent';

export default async function ProductionPage() {
    const { db } = await connectToTenantDb();
    try {
        const productsData = await db.select().from(products);
        const workOrdersData = await db.select().from(workOrders);
        const bomsData = await db.select().from(billsOfMaterial);
        const productionPlansData = await db.select().from(productionPlans);
        const qualityChecksData = await db.select().from(qualityChecks);
        const usersData = await db.select({id: employees.id, name: employees.name}).from(employees);

        const workOrdersWithLogs = await Promise.all(workOrdersData.map(async (wo) => {
            const logs = await db.select().from(workOrderProductionLogs).where(eq(workOrderProductionLogs.workOrderId, wo.id));
            return {
                ...wo,
                productionLog: logs.map(l => ({ ...l, date: new Date(l.date), quantityProduced: l.quantityProduced })),
            };
        }));

        const bomsWithItems = await Promise.all(bomsData.map(async (bom) => {
            const items = await db.select().from(billOfMaterialItems).where(eq(billOfMaterialItems.bomId, bom.id));
            return {
                ...bom,
                lastUpdated: bom.lastUpdated ? new Date(bom.lastUpdated) : undefined,
                items: items.map(i => ({ ...i, quantity: parseFloat(i.quantity) })),
            };
        }));
        
        const initialData = {
            products: productsData,
            workOrders: workOrdersWithLogs.map(wo => ({...wo, startDate: new Date(wo.startDate), endDate: new Date(wo.endDate), progress: wo.progress || 0})),
            boms: bomsWithItems,
            productionPlans: productionPlansData.map(p => ({...p, startDate: new Date(p.startDate), endDate: new Date(p.endDate)})),
            qualityChecks: qualityChecksData.map(qc => ({...qc, date: new Date(qc.date)})),
            users: usersData,
        };
    
        return <ProductionClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Production page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة الإنتاج</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول الإنتاج (`work_orders`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

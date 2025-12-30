
import React from 'react';
import { db } from '@/db';
import { products, workOrders, billsOfMaterial, billOfMaterialItems, productionPlans, qualityChecks, workOrderProductionLogs, employees } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProductionClientComponent from './ProductionClientComponent';
import type { WorkOrderFormValues, BomFormValues, ProductionPlanFormValues, QualityCheckFormValues } from './actions';

interface ProductionLogEntry {
  date: Date;
  quantityProduced: number;
  notes?: string;
}

export default async function ProductionPage() {
    let productsData = [];
    let workOrdersData = [];
    let bomsData = [];
    let productionPlansData = [];
    let qualityChecksData = [];
    let usersData = [];

    try {
        productsData = await db.select().from(products);
        workOrdersData = await db.select().from(workOrders);
        bomsData = await db.select().from(billsOfMaterial);
        productionPlansData = await db.select().from(productionPlans);
        qualityChecksData = await db.select().from(qualityChecks);
        usersData = await db.select({id: employees.id, name: employees.name}).from(employees);
    } catch (error) {
        console.error("Database query failed for Production page:", error);
    }


    const workOrdersWithLogs = await Promise.all(workOrdersData.map(async (wo) => {
        const logs = await db.select().from(workOrderProductionLogs).where(eq(workOrderProductionLogs.workOrderId, wo.id));
        return {
            ...wo,
            productionLog: logs.map(l => ({ ...l, date: new Date(l.date) })),
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
    
    if (workOrdersData.length === 0) {
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4">وحدة الإنتاج</h1>
                <p className="text-muted-foreground">
                    لا يمكن عرض البيانات. قد تكون جداول قاعدة البيانات (مثل `work_orders`) غير موجودة.
                </p>
                <p className="mt-2">
                    يرجى التأكد من تنفيذ ملف `db_schema.sql` في قاعدة بياناتك.
                </p>
            </div>
        );
    }

    return <ProductionClientComponent initialData={initialData} />;
}

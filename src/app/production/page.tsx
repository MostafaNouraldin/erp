
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

    return <ProductionClientComponent initialData={initialData} />;
}

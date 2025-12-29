
'use server';

import { db } from '@/db';
import { workOrders, billsOfMaterial, billOfMaterialItems, productionPlans, qualityChecks, workOrderProductionLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const workOrderSchema = z.object({
    id: z.string().optional(),
    productId: z.string().min(1, "المنتج مطلوب"),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
    producedQuantity: z.coerce.number().min(0).default(0),
    startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
    endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
    notes: z.string().optional(),
    status: z.enum(["مجدول", "قيد التنفيذ", "متوقف مؤقتاً", "مكتمل", "ملغي"]).default("مجدول"),
    progress: z.coerce.number().min(0).max(100).default(0),
});
export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

const bomItemSchema = z.object({
    materialId: z.string().min(1, "المادة الخام مطلوبة"),
    quantity: z.coerce.number().min(0.01, "الكمية يجب أن تكون أكبر من صفر"),
});
const bomSchema = z.object({
    id: z.string().optional(),
    productId: z.string().min(1, "المنتج النهائي مطلوب"),
    version: z.string().min(1, "الإصدار مطلوب"),
    items: z.array(bomItemSchema).min(1, "يجب إضافة مادة خام واحدة على الأقل"),
    lastUpdated: z.date().optional(),
});
export type BomFormValues = z.infer<typeof bomSchema>;

const productionPlanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الخطة مطلوب"),
    startDate: z.date({ required_error: "تاريخ بدء الخطة مطلوب" }),
    endDate: z.date({ required_error: "تاريخ انتهاء الخطة مطلوب" }),
    status: z.enum(["مسودة", "نشطة", "مكتملة", "ملغاة"]).default("مسودة"),
    notes: z.string().optional(),
});
export type ProductionPlanFormValues = z.infer<typeof productionPlanSchema>;

const qualityCheckSchema = z.object({
    id: z.string().optional(),
    workOrderId: z.string().min(1, "أمر العمل مطلوب"),
    checkPoint: z.string().min(1, "نقطة الفحص مطلوبة"),
    result: z.enum(["ناجح", "فاشل", "ناجح مع ملاحظات"], { required_error: "نتيجة الفحص مطلوبة" }),
    date: z.date({ required_error: "تاريخ الفحص مطلوب" }),
    inspectorId: z.string().min(1, "المفتش مطلوب"),
    notes: z.string().optional(),
});
export type QualityCheckFormValues = z.infer<typeof qualityCheckSchema>;

const productionLogSchema = z.object({
  date: z.date(),
  quantityProduced: z.coerce.number().min(0),
  notes: z.string().optional(),
});

// --- Work Order Actions ---
export async function addWorkOrder(values: WorkOrderFormValues) {
  const newId = `WO${Date.now()}`;
  await db.insert(workOrders).values({ ...values, id: newId });
  revalidatePath('/production');
}

export async function updateWorkOrder(values: WorkOrderFormValues) {
  if (!values.id) throw new Error("ID is required for update.");
  await db.update(workOrders).set(values).where(eq(workOrders.id, values.id));
  revalidatePath('/production');
}

export async function deleteWorkOrder(id: string) {
  await db.delete(workOrders).where(eq(workOrders.id, id));
  revalidatePath('/production');
}

export async function addProductionLog(workOrderId: string, log: z.infer<typeof productionLogSchema>) {
    await db.insert(workOrderProductionLogs).values({ workOrderId, ...log, quantityProduced: log.quantityProduced });
    const wo = await db.query.workOrders.findFirst({ where: eq(workOrders.id, workOrderId) });
    if(wo){
        const logs = await db.query.workOrderProductionLogs.findMany({ where: eq(workOrderProductionLogs.workOrderId, workOrderId) });
        const totalProduced = logs.reduce((sum, current) => sum + current.quantityProduced, 0);
        const newProgress = Math.min(100, Math.round((totalProduced / wo.quantity) * 100));
        const newStatus = totalProduced >= wo.quantity ? "مكتمل" as const : wo.status;
        await db.update(workOrders).set({ producedQuantity: totalProduced, progress: newProgress, status: newStatus }).where(eq(workOrders.id, workOrderId));
    }
    revalidatePath('/production');
}


// --- BOM Actions ---
export async function addBom(values: BomFormValues) {
  const newId = `BOM${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(billsOfMaterial).values({ id: newId, productId: values.productId, version: values.version, lastUpdated: new Date() });
    await tx.insert(billOfMaterialItems).values(values.items.map(item => ({ bomId: newId, ...item, quantity: String(item.quantity) })));
  });
  revalidatePath('/production');
}

export async function updateBom(values: BomFormValues) {
  if (!values.id) throw new Error("ID is required for update.");
  await db.transaction(async (tx) => {
    await tx.update(billsOfMaterial).set({ productId: values.productId, version: values.version, lastUpdated: new Date() }).where(eq(billsOfMaterial.id, values.id!));
    await tx.delete(billOfMaterialItems).where(eq(billOfMaterialItems.bomId, values.id!));
    await tx.insert(billOfMaterialItems).values(values.items.map(item => ({ bomId: values.id!, ...item, quantity: String(item.quantity) })));
  });
  revalidatePath('/production');
}

export async function deleteBom(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(billOfMaterialItems).where(eq(billOfMaterialItems.bomId, id));
    await tx.delete(billsOfMaterial).where(eq(billsOfMaterial.id, id));
  });
  revalidatePath('/production');
}

// --- Production Plan Actions ---
export async function addProductionPlan(values: ProductionPlanFormValues) {
  const newId = `PLAN${Date.now()}`;
  await db.insert(productionPlans).values({ ...values, id: newId });
  revalidatePath('/production');
}

export async function updateProductionPlan(values: ProductionPlanFormValues) {
  if (!values.id) throw new Error("ID is required for update.");
  await db.update(productionPlans).set(values).where(eq(productionPlans.id, values.id));
  revalidatePath('/production');
}

export async function deleteProductionPlan(id: string) {
  await db.delete(productionPlans).where(eq(productionPlans.id, id));
  revalidatePath('/production');
}

// --- Quality Check Actions ---
export async function addQualityCheck(values: QualityCheckFormValues) {
  const newId = `QC${Date.now()}`;
  await db.insert(qualityChecks).values({ ...values, id: newId });
  revalidatePath('/production');
}

export async function updateQualityCheck(values: QualityCheckFormValues) {
  if (!values.id) throw new Error("ID is required for update.");
  await db.update(qualityChecks).set(values).where(eq(qualityChecks.id, values.id));
  revalidatePath('/production');
}

export async function deleteQualityCheck(id: string) {
  await db.delete(qualityChecks).where(eq(qualityChecks.id, id));
  revalidatePath('/production');
}


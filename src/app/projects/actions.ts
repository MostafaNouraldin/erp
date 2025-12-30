
'use server';

import { connectToTenantDb } from '@/db';
import { projects, projectTasks, projectResources, projectBudgetItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schemas for data validation
const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المشروع مطلوب"),
  clientId: z.string().min(1, "العميل مطلوب"),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  budget: z.coerce.number().min(0, "الميزانية يجب أن تكون رقماً موجباً"),
  status: z.enum(["مخطط له", "قيد التنفيذ", "متوقف", "مكتمل", "ملغي"]).default("مخطط له"),
  progress: z.coerce.number().min(0).max(100).default(0),
  managerId: z.string().min(1, "مدير المشروع مطلوب"),
  notes: z.string().optional(),
});

const taskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  name: z.string().min(1, "اسم المهمة مطلوب"),
  assigneeId: z.string().min(1, "المسؤول مطلوب"),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  status: z.enum(["مخطط لها", "قيد التنفيذ", "مكتملة", "متأخرة", "ملغاة"]).default("مخطط لها"),
  priority: z.enum(["مرتفعة", "متوسطة", "منخفضة"]).default("متوسطة"),
  notes: z.string().optional(),
});

const resourceSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  employeeId: z.string().min(1, "الموظف/المورد مطلوب"),
  role: z.string().min(1, "الدور مطلوب"),
  allocation: z.coerce.number().min(0).max(100).default(100),
  notes: z.string().optional(),
});

const budgetItemSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  item: z.string().min(1, "وصف البند مطلوب"),
  allocated: z.coerce.number().min(0, "المبلغ المخصص يجب أن يكون موجباً"),
  spent: z.coerce.number().min(0, "المبلغ المصروف يجب أن يكون موجباً").default(0),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type TaskFormValues = z.infer<typeof taskSchema>;
export type ResourceFormValues = z.infer<typeof resourceSchema>;
export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;

// For passing to client component
export type Client = { id: string; name: string };
export type Employee = { id: string; name: string };

async function getDb() {
  // In a real multi-tenant app, the tenantId would come from the user's session
  const { db } = await connectToTenantDb('T001');
  return db;
}


// --- Project Actions ---
export async function addProject(values: ProjectFormValues) {
  const db = await getDb();
  const newProjectId = `PROJ${Date.now()}`;
  await db.insert(projects).values({
    ...values,
    id: newProjectId,
    budget: String(values.budget),
  });
  revalidatePath('/projects');
}

export async function updateProject(values: ProjectFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID is required for update.");
  await db.update(projects).set({
    ...values,
    budget: String(values.budget),
  }).where(eq(projects.id, values.id));
  revalidatePath('/projects');
}

export async function deleteProject(id: string) {
    const db = await getDb();
    // In a real app with cascading deletes or proper foreign keys, this would be simpler.
    // For now, we delete from each related table manually.
    await db.transaction(async (tx) => {
        await tx.delete(projectTasks).where(eq(projectTasks.projectId, id));
        await tx.delete(projectResources).where(eq(projectResources.projectId, id));
        await tx.delete(projectBudgetItems).where(eq(projectBudgetItems.projectId, id));
        await tx.delete(projects).where(eq(projects.id, id));
    });
    revalidatePath('/projects');
}


// --- Task Actions ---
export async function addTask(values: TaskFormValues) {
    const db = await getDb();
    const newTaskId = `TASK${Date.now()}`;
    await db.insert(projectTasks).values({ ...values, id: newTaskId });
    revalidatePath('/projects');
}

export async function updateTask(values: TaskFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(projectTasks).set(values).where(eq(projectTasks.id, values.id));
    revalidatePath('/projects');
}

export async function deleteTask(id: string) {
    const db = await getDb();
    await db.delete(projectTasks).where(eq(projectTasks.id, id));
    revalidatePath('/projects');
}

// --- Resource Actions ---
export async function addResource(values: ResourceFormValues) {
    const db = await getDb();
    const newResourceId = `RES${Date.now()}`;
    await db.insert(projectResources).values({ ...values, id: newResourceId });
    revalidatePath('/projects');
}

export async function updateResource(values: ResourceFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(projectResources).set(values).where(eq(projectResources.id, values.id));
    revalidatePath('/projects');
}

export async function deleteResource(id: string) {
    const db = await getDb();
    await db.delete(projectResources).where(eq(projectResources.id, id));
    revalidatePath('/projects');
}

// --- Budget Item Actions ---
export async function addBudgetItem(values: BudgetItemFormValues) {
    const db = await getDb();
    const newBudgetItemId = `BUD${Date.now()}`;
    await db.insert(projectBudgetItems).values({ 
        ...values, 
        id: newBudgetItemId,
        allocated: String(values.allocated),
        spent: String(values.spent),
    });
    revalidatePath('/projects');
}

export async function updateBudgetItem(values: BudgetItemFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(projectBudgetItems).set({
        ...values,
        allocated: String(values.allocated),
        spent: String(values.spent),
    }).where(eq(projectBudgetItems.id, values.id));
    revalidatePath('/projects');
}

export async function deleteBudgetItem(id: string) {
    const db = await getDb();
    await db.delete(projectBudgetItems).where(eq(projectBudgetItems.id, id));
    revalidatePath('/projects');
}

export async function updateBudgetItemSpent(id: string, newSpentAmount: number) {
    const db = await getDb();
    await db.update(projectBudgetItems).set({
        spent: String(newSpentAmount),
    }).where(eq(projectBudgetItems.id, id));
    revalidatePath('/projects');
}

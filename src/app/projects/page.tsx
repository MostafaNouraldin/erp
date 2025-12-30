
import React from 'react';
import { connectToTenantDb } from '@/db';
import { projects, projectTasks, projectResources, projectBudgetItems, customers, employees } from '@/db/schema';
import ProjectsClientComponent from './ProjectsClientComponent';

export default async function ProjectsPage() {
    const tenantId = 'T001'; // In a real app, this comes from the user session
    const { db } = await connectToTenantDb(tenantId);
    try {
        const projectsData = await db.select().from(projects);
        const tasksData = await db.select().from(projectTasks);
        const resourcesData = await db.select().from(projectResources);
        const budgetItemsData = await db.select().from(projectBudgetItems);
        const clientsData = await db.select().from(customers);
        const employeesData = await db.select().from(employees);

        const initialData = {
            projects: projectsData.map(p => ({ ...p, startDate: new Date(p.startDate), endDate: new Date(p.endDate), budget: parseFloat(p.budget), progress: p.progress || 0 })),
            tasks: tasksData.map(t => ({ ...t, dueDate: new Date(t.dueDate) })),
            resources: resourcesData,
            budgetItems: budgetItemsData.map(b => ({ ...b, allocated: parseFloat(b.allocated), spent: parseFloat(b.spent) })),
            clients: clientsData,
            employees: employeesData,
        };

        return <ProjectsClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Projects page:", errorMessage);
        
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة المشاريع</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول المشاريع (`projects`, `project_tasks`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

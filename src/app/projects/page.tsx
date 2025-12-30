
import React from 'react';
import { db } from '@/db';
import { projects, projectTasks, projectResources, projectBudgetItems, customers, employees } from '@/db/schema';
import ProjectsClientComponent from './ProjectsClientComponent';

export default async function ProjectsPage() {
    let projectsData = [];
    let tasksData = [];
    let resourcesData = [];
    let budgetItemsData = [];
    let clientsData = [];
    let employeesData = [];

    try {
        projectsData = await db.select().from(projects);
        tasksData = await db.select().from(projectTasks);
        resourcesData = await db.select().from(projectResources);
        budgetItemsData = await db.select().from(projectBudgetItems);
        clientsData = await db.select().from(customers);
        employeesData = await db.select().from(employees);
    } catch (error) {
        console.error("Database query failed for Projects page:", error);
        // Data will remain as empty arrays, preventing a crash.
        // The client component will show an empty state.
    }


    const initialData = {
        projects: projectsData.map(p => ({ ...p, startDate: new Date(p.startDate), endDate: new Date(p.endDate), budget: parseFloat(p.budget), progress: p.progress || 0 })),
        tasks: tasksData.map(t => ({ ...t, dueDate: new Date(t.dueDate) })),
        resources: resourcesData,
        budgetItems: budgetItemsData.map(b => ({ ...b, allocated: parseFloat(b.allocated), spent: parseFloat(b.spent) })),
        clients: clientsData,
        employees: employeesData,
    };

    if (projectsData.length === 0 && tasksData.length === 0) {
        // A simple way to indicate to the user that the tables might be missing.
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4">وحدة المشاريع</h1>
                <p className="text-muted-foreground">
                    لا يمكن عرض البيانات. يبدو أن جداول قاعدة البيانات (مثل `projects`) غير موجودة.
                </p>
                <p className="mt-2">
                    يرجى تنفيذ محتوى ملف `db_schema.sql` في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
            </div>
        );
    }

    return <ProjectsClientComponent initialData={initialData} />;
}

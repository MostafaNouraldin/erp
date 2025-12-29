
import React from 'react';
import { db } from '@/db';
import { projects, projectTasks, projectResources, projectBudgetItems, customers, employees } from '@/db/schema';
import ProjectsClientComponent from './ProjectsClientComponent';

export default async function ProjectsPage() {
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
}

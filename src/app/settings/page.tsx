

import React from 'react';
import { connectToTenantDb } from '@/db';
import { users, roles, companySettings, departments, jobTitles, leaveTypes } from '@/db/schema';
import SettingsPage from './SettingsPageClient';
import type { Role } from '@/types/saas';
import type { UserFormValues, SettingsFormValues, Department, JobTitle, LeaveType } from './actions';
import { eq } from 'drizzle-orm';

async function getSettingsData(tenantId: string) {
    const { db } = await connectToTenantDb();
    try {
        const usersData = await db.select().from(users);
        const rolesData = await db.select().from(roles);
        const settingsData = await db.query.companySettings.findFirst({
            where: eq(companySettings.id, tenantId)
        });
        const departmentsData = await db.select().from(departments);
        const jobTitlesData = await db.select().from(jobTitles);
        const leaveTypesData = await db.select().from(leaveTypes);
        
        return {
            success: true,
            data: {
                users: usersData.map(u => ({ ...u, password: '' })), // Don't send password hash to client
                roles: rolesData,
                settings: settingsData?.settings as SettingsFormValues || {},
                departments: departmentsData,
                jobTitles: jobTitlesData,
                leaveTypes: leaveTypesData,
            }
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Settings page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

export default async function SettingsServerPage() {
    // In a real app, tenant ID would come from the user's session
    const tenantId = 'T001';
    const result = await getSettingsData(tenantId);
    
    if (!result.success) {
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في الإعدادات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب بيانات المستخدمين والأدوار.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {result.error}</p>
            </div>
        );
    }

    return <SettingsPage initialData={result.data as { users: UserFormValues[], roles: Role[], settings: SettingsFormValues, departments: Department[], jobTitles: JobTitle[], leaveTypes: LeaveType[] }} />;
}

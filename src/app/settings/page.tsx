

import React from 'react';
import { connectToTenantDb } from '@/db';
import { users, roles } from '@/db/schema';
import SettingsPage from './SettingsPageClient';
import type { Role } from '@/types/saas';
import type { UserFormValues } from './actions';

async function getSettingsData() {
    // For settings, we might need data from both main and tenant DBs
    // For now, let's assume users and roles are tenant-specific for management
    const { db } = await connectToTenantDb('T001'); // Assuming tenant 'T001' for this context
    try {
        const usersData = await db.select().from(users);
        const rolesData = await db.select().from(roles);
        
        return {
            success: true,
            data: {
                users: usersData.map(u => ({ ...u, password: '' })), // Don't send password hash to client
                roles: rolesData,
            }
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Settings page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

export default async function SettingsServerPage() {
    const result = await getSettingsData();
    
    if (!result.success) {
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في الإعدادات</h1>
                <p className="text-muted-foreground mb-4">تعذر جلب بيانات المستخدمين والأدوار.</p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {result.error}</p>
            </div>
        );
    }

    return <SettingsPage initialData={result.data as { users: UserFormValues[], roles: Role[] }} />;
}

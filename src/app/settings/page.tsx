
import React from 'react';
import { connectToTenantDb } from '@/db';
import { users, roles, companySettings, departments, jobTitles, leaveTypes, allowanceTypes, deductionTypes, chartOfAccounts } from '@/db/schema';
import SettingsPage from './SettingsPageClient';
import type { Role } from '@/types/saas';
import type { UserFormValues, SettingsFormValues, Department, JobTitle, LeaveType, AllowanceType, DeductionType, Account } from './actions';
import { eq, or, like } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

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
        const allowanceTypesData = await db.select().from(allowanceTypes);
        const deductionTypesData = await db.select().from(deductionTypes);
        // Fetch accounts for expense and liability mapping
        const accountsData = await db.select().from(chartOfAccounts).where(or(like(chartOfAccounts.id, '5%'), like(chartOfAccounts.id, '2%'), like(chartOfAccounts.id, '12%')));

        return {
            success: true,
            data: {
                users: usersData.map(u => ({ ...u, password: '' })), // Don't send password hash to client
                roles: rolesData,
                settings: (settingsData?.settings as SettingsFormValues) || {},
                departments: departmentsData,
                jobTitles: jobTitlesData,
                leaveTypes: leaveTypesData,
                allowanceTypes: allowanceTypesData,
                deductionTypes: deductionTypesData,
                accounts: accountsData.map(acc => ({...acc, balance: parseFloat(acc.balance || '0')})),
            }
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Settings page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

// A helper function to check if the logged-in user is a super admin
// In a real app, this would be more robust, likely involving decoding a JWT or session cookie
function isSuperAdminRequest(): boolean {
    const headersList = headers();
    // This is a placeholder. In a real scenario, you'd inspect a session or token.
    // We'll check for a hypothetical cookie or header that indicates super admin status.
    const userCookie = headersList.get('cookie') || '';
    return userCookie.includes('"roleId":"ROLE_SUPER_ADMIN"');
}

export default async function SettingsServerPage() {
    // If the user is a super admin, redirect them to the system administration page
    // because the regular settings page is for tenant-specific configuration.
    if (isSuperAdminRequest()) {
        redirect('/system-administration/tenants');
    }

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

    return <SettingsPage initialData={result.data as { users: UserFormValues[], roles: Role[], settings: SettingsFormValues, departments: Department[], jobTitles: JobTitle[], leaveTypes: LeaveType[], allowanceTypes: AllowanceType[], deductionTypes: DeductionType[], accounts: Account[] }} />;
}

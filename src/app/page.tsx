

import React, { Suspense } from 'react';
import DashboardClient from "./DashboardClient";
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardData } from './actions';
import { getCompanySettingsForLayout } from './actions';

export default async function DashboardPage() {
    const dashboardDataPromise = getDashboardData();
    const companySettingsPromise = getCompanySettingsForLayout('T001'); // Assuming tenant 'T001'

    // We can use Promise.all to fetch in parallel, though Next.js does this automatically.
    const [dashboardResult, companySettings] = await Promise.all([dashboardDataPromise, companySettingsPromise]);

    if (!dashboardResult.success || !dashboardResult.data) {
        return (
            <div className="container mx-auto py-10 px-4 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في تحميل لوحة التحكم</h1>
                <p>{dashboardResult.error}</p>
            </div>
        );
    }

    return (
        <DashboardClient 
            initialData={dashboardResult.data} 
            defaultCurrency={companySettings?.defaultCurrency || 'SAR'}
        />
    );
}

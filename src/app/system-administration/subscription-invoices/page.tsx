

import React from 'react';
import { connectToTenantDb } from '@/db';
import { tenants } from '@/db/schema';
import SubscriptionInvoicesPage from './SubscriptionInvoicesClient'; // Corrected import name

export default async function SubscriptionInvoicesServerPage() {
    const { db } = await connectToTenantDb('main');
    try {
        const tenantsData = await db.select({ id: tenants.id, name: tenants.name }).from(tenants);
        
        // In a real app, you would fetch actual invoice data here.
        // For now, we are using mock data inside the client component.

        return <SubscriptionInvoicesPage initialData={{ tenants: tenantsData }} />;
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Subscription Invoices page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة فواتير الاشتراكات</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات الرئيسية.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

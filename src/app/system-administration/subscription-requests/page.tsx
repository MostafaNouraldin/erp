
import React from 'react';
import { connectToTenantDb } from '@/db';
import { subscriptionRequests } from '@/db/schema';
import { desc } from 'drizzle-orm';
import SubscriptionRequestsClient from './SubscriptionRequestsClient';

async function getSubscriptionRequestsData() {
    const { db } = await connectToTenantDb();
    try {
        // Fetch requests without the large paymentProof field to improve performance
        const requests = await db.select({
            id: subscriptionRequests.id,
            companyName: subscriptionRequests.companyName,
            email: subscriptionRequests.email,
            phone: subscriptionRequests.phone,
            address: subscriptionRequests.address,
            vatNumber: subscriptionRequests.vatNumber,
            selectedModules: subscriptionRequests.selectedModules,
            billingCycle: subscriptionRequests.billingCycle,
            totalAmount: subscriptionRequests.totalAmount,
            paymentMethod: subscriptionRequests.paymentMethod,
            status: subscriptionRequests.status,
            createdAt: subscriptionRequests.createdAt,
        }).from(subscriptionRequests).orderBy(desc(subscriptionRequests.createdAt));
        
        // Fetch full data for a single request if needed, but not for the whole list.
        const requestsWithLazyProof = requests.map(req => ({
            ...req,
            paymentProof: '', // Initially empty
        }));
        
        return {
            success: true,
            data: {
                requests: requestsWithLazyProof.map(req => ({
                    ...req,
                    createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
                })),
            }
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Subscription Requests page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}

export default async function SubscriptionRequestsServerPage() {
    const result = await getSubscriptionRequestsData();

    if (!result.success) {
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة طلبات الاشتراك</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات الرئيسية.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {result.error}</p>
            </div>
        );
    }

    return <SubscriptionRequestsClient initialData={result.data as any} />;
}

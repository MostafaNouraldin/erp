
import React from 'react';
import { connectToTenantDb } from '@/db';
import { tenants, tenantModuleSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import SubscriptionClient from './SubscriptionClient';
import type { Module, TenantSubscribedModule } from '@/types/saas';

// This data should ideally come from a central configuration or its own table in the MAIN database.
const allAvailableModules: Module[] = [
    { id: "MOD001", key: "Dashboard", name: "لوحة التحكم", description: "عرض ملخصات وأداء النظام", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, prices: { SAR: { monthly: 100, yearly: 1000 }, EGP: { monthly: 800, yearly: 8000 }, USD: { monthly: 27, yearly: 270 } } },
    { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, prices: { SAR: { monthly: 80, yearly: 800 }, EGP: { monthly: 650, yearly: 6500 }, USD: { monthly: 22, yearly: 220 } } },
    { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, prices: { SAR: { monthly: 90, yearly: 900 }, EGP: { monthly: 720, yearly: 7200 }, USD: { monthly: 24, yearly: 240 } } },
    { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, prices: { SAR: { monthly: 70, yearly: 700 }, EGP: { monthly: 560, yearly: 5600 }, USD: { monthly: 19, yearly: 190 } } },
    { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, prices: { SAR: { monthly: 120, yearly: 1200 }, EGP: { monthly: 960, yearly: 9600 }, USD: { monthly: 32, yearly: 320 } } },
    { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, prices: { SAR: { monthly: 150, yearly: 1500 }, EGP: { monthly: 1200, yearly: 12000 }, USD: { monthly: 40, yearly: 400 } } },
    { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, prices: { SAR: { monthly: 110, yearly: 1100 }, EGP: { monthly: 880, yearly: 8800 }, USD: { monthly: 29, yearly: 290 } } },
    { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, prices: { SAR: { monthly: 50, yearly: 500 }, EGP: { monthly: 400, yearly: 4000 }, USD: { monthly: 14, yearly: 140 } } },
    { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, prices: { SAR: { monthly: 60, yearly: 600 }, EGP: { monthly: 480, yearly: 4800 }, USD: { monthly: 16, yearly: 160 } } },
    { id: "MOD011", key: "Settings", name: "الإعدادات العامة", description: "إعدادات النظام الأساسية", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD012", key: "Help", name: "المساعدة", description: "مركز المساعدة والدعم", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
    { id: "MOD013", key: "SystemAdministration", name: "إدارة النظام", description: "إدارة الشركات والاشتراكات", isRentable: false, prices: { SAR: { monthly: 0, yearly: 0 }, EGP: { monthly: 0, yearly: 0 }, USD: { monthly: 0, yearly: 0 } } },
];

async function getSubscriptionData(tenantId: string) {
    const { db } = await connectToTenantDb(); // Now connects to the single DB
    try {
        const tenantData = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
        });

        if (!tenantData) {
            return { success: false, error: `Tenant with ID ${tenantId} not found.` };
        }

        const subscriptionsData = await db.query.tenantModuleSubscriptions.findMany({
            where: eq(tenantModuleSubscriptions.tenantId, tenantId),
        });

        const subscribedModuleKeys = subscriptionsData.map(s => s.moduleKey);

        const subscribedModules = allAvailableModules.filter(m => subscribedModuleKeys.includes(m.key));
        const availableForSubscription = allAvailableModules.filter(m => m.isRentable && !subscribedModuleKeys.includes(m.key));

        return {
            success: true,
            data: {
                tenant: {
                    ...tenantData,
                    subscriptionEndDate: tenantData.subscriptionEndDate ? new Date(tenantData.subscriptionEndDate) : undefined,
                },
                subscribedModules,
                availableForSubscription
            }
        };

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Subscription page:", errorMessage);
        return { success: false, error: errorMessage };
    }
}


export default async function SubscriptionPage() {
    const tenantId = 'T001'; // In a real app, this would come from the user's session
    const result = await getSubscriptionData(tenantId);
    
    if (!result.success) {
        return (
            <div className="container mx-auto py-10 px-4 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ</h1>
                <p className="text-muted-foreground mb-6">
                    تعذر جلب بيانات الاشتراك الخاصة بشركتك.
                </p>
                <p className="text-sm text-muted-foreground mt-6">
                    رسالة الخطأ: {result.error}
                </p>
            </div>
        );
    }

    return <SubscriptionClient initialData={result.data} />;
}

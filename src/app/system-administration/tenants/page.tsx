
import React from 'react';
import { connectToTenantDb } from '@/db';
import { tenants, tenantModuleSubscriptions } from '@/db/schema';
import TenantsPageClient from './TenantsPageClient';
import type { Tenant, TenantSubscribedModule, Module } from '@/types/saas';

// This data should ideally come from a central configuration or its own table in the MAIN database.
const allAvailableModules: Module[] = [
  { id: "MOD001", key: "Dashboard", name: "لوحة التحكم", description: "عرض ملخصات وأداء النظام", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, priceMonthly: 100, priceYearly: 1000 },
  { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, priceMonthly: 80, priceYearly: 800 },
  { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, priceMonthly: 90, priceYearly: 900 },
  { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, priceMonthly: 70, priceYearly: 700 },
  { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, priceMonthly: 120, priceYearly: 1200 },
  { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, priceMonthly: 150, priceYearly: 1500 },
  { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, priceMonthly: 110, priceYearly: 1100 },
  { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, priceMonthly: 50, priceYearly: 500 },
  { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, priceMonthly: 60, priceYearly: 600 },
  { id: "MOD011", key: "Settings", name: "الإعدادات العامة", description: "إعدادات النظام الأساسية", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD012", key: "Help", name: "المساعدة", description: "مركز المساعدة والدعم", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD013", key: "SystemAdministration", name: "إدارة النظام", description: "إدارة الشركات والاشتراكات", isRentable: false, priceMonthly: 0, priceYearly: 0 },
];


export default async function TenantsPage() {
    const { db } = await connectToTenantDb(); 
    try {
        const tenantsData = await db.query.tenants.findMany({
            with: {
                subscriptions: true,
            },
        });

        const subscriptionsMap: Record<string, TenantSubscribedModule[]> = {};
        tenantsData.forEach(tenant => {
            subscriptionsMap[tenant.id] = tenant.subscriptions.map(sub => ({
                moduleId: sub.moduleKey,
                subscribed: sub.subscribed,
            }));
        });

        const initialData = {
            tenants: tenantsData.map(t => ({
                ...t,
                subscriptionEndDate: t.subscriptionEndDate ? new Date(t.subscriptionEndDate) : undefined,
                createdAt: new Date(t.createdAt!),
            })),
            tenantModuleSubscriptions: subscriptionsMap,
            allAvailableModules: allAvailableModules,
        };

        return <TenantsPageClient initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Tenants page:", errorMessage);
        
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة إدارة الشركات</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول الشركات (`tenants`) غير موجودة في قاعدة البيانات الرئيسية.
                </p>
                <p className="mb-2">
                    يرجى التأكد من أن قاعدة بيانات الإدارة الرئيسية تحتوي على الجداول المطلوبة.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}


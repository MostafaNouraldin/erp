
'use server';

import { db } from '@/db';
import { tenants, tenantModuleSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const tenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  isActive: z.boolean().default(true),
  subscriptionEndDate: z.date().optional(),
  subscribedModules: z.array(z.object({
    moduleId: z.string(),
    subscribed: z.boolean(),
  })).default([]),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

export async function addTenant(values: TenantFormValues) {
    const newTenantId = `TEN${Date.now()}`;
    
    let effectiveSubscriptionEndDate = values.subscriptionEndDate;
    if (!effectiveSubscriptionEndDate) {
        effectiveSubscriptionEndDate = new Date();
        if (values.billingCycle === 'monthly') {
            effectiveSubscriptionEndDate.setMonth(effectiveSubscriptionEndDate.getMonth() + 1);
        } else {
            effectiveSubscriptionEndDate.setFullYear(effectiveSubscriptionEndDate.getFullYear() + 1);
        }
    }

    await db.transaction(async (tx) => {
        await tx.insert(tenants).values({
            id: newTenantId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: values.address,
            vatNumber: values.vatNumber,
            isActive: values.isActive,
            subscriptionEndDate: effectiveSubscriptionEndDate,
        });

        const subscriptions = values.subscribedModules
            .filter(mod => mod.subscribed)
            .map(mod => ({
                tenantId: newTenantId,
                moduleKey: mod.moduleId,
                subscribed: true,
            }));
        
        if (subscriptions.length > 0) {
            await tx.insert(tenantModuleSubscriptions).values(subscriptions);
        }
    });

    revalidatePath('/system-administration/tenants');
}

export async function updateTenant(values: TenantFormValues) {
    if (!values.id) {
        throw new Error("Tenant ID is required for update.");
    }
    const tenantId = values.id;

    await db.transaction(async (tx) => {
        await tx.update(tenants).set({
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: values.address,
            vatNumber: values.vatNumber,
            isActive: values.isActive,
            subscriptionEndDate: values.subscriptionEndDate,
        }).where(eq(tenants.id, tenantId));

        // Delete old subscriptions and insert new ones
        await tx.delete(tenantModuleSubscriptions).where(eq(tenantModuleSubscriptions.tenantId, tenantId));

        const subscriptions = values.subscribedModules
            .filter(mod => mod.subscribed)
            .map(mod => ({
                tenantId: tenantId,
                moduleKey: mod.moduleId,
                subscribed: true,
            }));
        
        if (subscriptions.length > 0) {
            await tx.insert(tenantModuleSubscriptions).values(subscriptions);
        }
    });

    revalidatePath('/system-administration/tenants');
}


export async function deleteTenant(tenantId: string) {
    await db.transaction(async (tx) => {
        await tx.delete(tenantModuleSubscriptions).where(eq(tenantModuleSubscriptions.tenantId, tenantId));
        await tx.delete(tenants).where(eq(tenants.id, tenantId));
    });
    revalidatePath('/system-administration/tenants');
}

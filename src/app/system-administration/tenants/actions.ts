
'use server';

import { connectToTenantDb } from '@/db';
import { tenants, tenantModuleSubscriptions, users, subscriptionRenewalRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const tenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
  isConfigured: z.boolean().default(false),
  subscriptionEndDate: z.date().optional().nullable(),
  subscribedModules: z.array(z.object({
    moduleId: z.string(),
    subscribed: z.boolean(),
  })).default([]),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
  // New fields for admin creation
  adminName: z.string().optional(),
  adminEmail: z.string().email("بريد إلكتروني غير صالح للمدير").optional().or(z.literal('')),
  adminPassword: z.string().optional(),
});

type TenantFormValues = z.infer<typeof tenantSchema>;

async function getMainDb() {
    const { db } = await connectToTenantDb();
    return db;
}


export async function addTenant(values: TenantFormValues) {
    const db = await getMainDb();
    
    // Use provided ID or generate a new one
    const newTenantId = values.id || `T${String(Date.now()).slice(-4)}${String(Math.floor(Math.random() * 90) + 10)}`;

    if (!values.adminName || !values.adminEmail || !values.adminPassword) {
        throw new Error("Admin user details are required for new tenant creation.");
    }
    
    let effectiveSubscriptionEndDate = values.subscriptionEndDate;
    if (!effectiveSubscriptionEndDate) {
        effectiveSubscriptionEndDate = new Date();
        if (values.billingCycle === 'monthly') {
            effectiveSubscriptionEndDate.setMonth(effectiveSubscriptionEndDate.getMonth() + 1);
        } else {
            effectiveSubscriptionEndDate.setFullYear(effectiveSubscriptionEndDate.getFullYear() + 1);
        }
    }

    const passwordHash = `hashed_${values.adminPassword}`; // Unsafe placeholder, use bcrypt in production
    const TENANT_ADMIN_ROLE_ID = "ROLE001";
    const newUserId = `USER-${newTenantId}-${Date.now()}`;

    await db.transaction(async (tx) => {
        // 1. Create the tenant
        await tx.insert(tenants).values({
            id: newTenantId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            address: values.address,
            vatNumber: values.vatNumber,
            isActive: values.isActive,
            isConfigured: false, // Always false on creation
            subscriptionEndDate: effectiveSubscriptionEndDate,
            country: values.country,
        });

        // 2. Create the primary admin user for the tenant
        await tx.insert(users).values({
            id: newUserId,
            name: values.adminName!,
            email: values.adminEmail!,
            roleId: TENANT_ADMIN_ROLE_ID,
            status: 'نشط',
            passwordHash: passwordHash,
            tenantId: newTenantId,
        });

        // 3. Subscribe the tenant to the selected modules
        const subscriptions = values.subscribedModules
            .filter(mod => mod.subscribed)
            .map(mod => ({
                tenantId: newTenantId,
                moduleKey: mod.moduleId,
                subscribed: true,
            }));
        
        // Ensure basic modules are always added for new tenants
        const basicModules = ['Dashboard', 'Settings', 'Help', 'Subscription'];
        for (const modKey of basicModules) {
            if (!subscriptions.some(s => s.moduleKey === modKey)) {
                subscriptions.push({
                    tenantId: newTenantId,
                    moduleKey: modKey,
                    subscribed: true,
                });
            }
        }
        
        if (subscriptions.length > 0) {
            await tx.insert(tenantModuleSubscriptions).values(subscriptions);
        }
    });

    revalidatePath('/system-administration/tenants');
}

export async function updateTenant(values: TenantFormValues) {
    const db = await getMainDb();
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
            country: values.country,
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
    const db = await getMainDb();
    await db.transaction(async (tx) => {
        // This is a simplified deletion. In a real-world scenario, you might want to soft delete
        // or archive data instead. Also, deleting users associated with the tenant might be needed.
        await tx.delete(users).where(eq(users.tenantId, tenantId));
        await tx.delete(tenantModuleSubscriptions).where(eq(tenantModuleSubscriptions.tenantId, tenantId));
        await tx.delete(tenants).where(eq(tenants.id, tenantId));
    });
    revalidatePath('/system-administration/tenants');
}

export async function getTenantRenewalRequests(tenantId: string) {
    const db = await getMainDb();
    const requests = await db.query.subscriptionRenewalRequests.findMany({
        where: eq(subscriptionRenewalRequests.tenantId, tenantId),
        orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });
    return requests;
}

export async function manuallyRenewSubscription(tenantId: string, duration: 'monthly' | 'yearly') {
    const db = await getMainDb();
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
        throw new Error("لم يتم العثور على الشركة.");
    }
    
    // Start from today if subscription is expired, otherwise from the end date
    const today = new Date();
    let currentEndDate = tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate) : today;
    if (currentEndDate < today) {
        currentEndDate = today;
    }

    let newEndDate = new Date(currentEndDate);
    if (duration === 'monthly') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    await db.update(tenants).set({ subscriptionEndDate: newEndDate }).where(eq(tenants.id, tenantId));
    
    // Find the admin user for this tenant to send notification
    const tenantAdmin = await db.query.users.findFirst({
        where: eq(users.tenantId, tenantId)
        // In a more complex system, you'd find the user with the admin role for this tenant
    });

    if (tenantAdmin) {
        await createNotification(tenantAdmin.id, `تم تمديد اشتراك شركتكم بنجاح حتى تاريخ ${newEndDate.toLocaleDateString('ar-SA')}.`, '/subscription');
    }

    revalidatePath('/system-administration/tenants');
    revalidatePath('/subscription'); // Revalidate the tenant's own subscription page
}

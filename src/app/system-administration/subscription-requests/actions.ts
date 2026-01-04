
'use server';

import { connectToTenantDb } from '@/db';
import { subscriptionRequests, tenants, users, tenantModuleSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { createNotification } from '@/lib/notifications';
import { sendActivationEmail } from '@/lib/email';

async function getMainDb() {
  const { db } = await connectToTenantDb();
  return db;
}

export async function getSubscriptionRequestDetails(requestId: number) {
    const db = await getMainDb();
    const request = await db.query.subscriptionRequests.findFirst({
        where: eq(subscriptionRequests.id, requestId),
    });
    if (!request) {
        throw new Error("لم يتم العثور على طلب الاشتراك.");
    }
    return request;
}


export async function approveSubscriptionRequest(requestId: number) {
  const db = await getMainDb();
  const request = await db.query.subscriptionRequests.findFirst({
    where: eq(subscriptionRequests.id, requestId),
  });

  if (!request) {
    throw new Error("لم يتم العثور على طلب الاشتراك.");
  }
  if (request.status === 'approved') {
    throw new Error("هذا الطلب تمت الموافقة عليه مسبقاً.");
  }

  const newTenantId = `T${String(Date.now()).slice(-4)}${String(Math.floor(Math.random() * 90) + 10)}`;
  const adminPassword = randomBytes(8).toString('hex');
  const passwordHash = `hashed_${adminPassword}`; 
  const TENANT_ADMIN_ROLE_ID = "ROLE001";

  let subscriptionEndDate = new Date();
  if (request.billingCycle === 'monthly') {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
  } else {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
  }
  const newUserId = `USER-${newTenantId}-${Date.now()}`;
  const adminUserName = `مدير ${request.companyName}`;

  await db.transaction(async (tx) => {
    // 1. Create the tenant
    await tx.insert(tenants).values({
      id: newTenantId,
      name: request.companyName,
      email: request.email,
      phone: request.phone,
      address: request.address,
      vatNumber: request.vatNumber,
      isActive: true,
      subscriptionEndDate: subscriptionEndDate,
    });

    // 2. Create the primary admin user for the tenant
    await tx.insert(users).values({
      id: newUserId,
      name: adminUserName,
      email: request.email,
      roleId: TENANT_ADMIN_ROLE_ID,
      status: 'نشط',
      passwordHash: passwordHash,
    });

    // 3. Subscribe the tenant to the selected modules
    const selectedModules = request.selectedModules as string[] || [];
    const subscriptions = selectedModules.map(moduleKey => ({
      tenantId: newTenantId,
      moduleKey: moduleKey,
      subscribed: true,
    }));
    subscriptions.push({ tenantId: newTenantId, moduleKey: 'Dashboard', subscribed: true });
    subscriptions.push({ tenantId: newTenantId, moduleKey: 'Settings', subscribed: true });
    subscriptions.push({ tenantId: newTenantId, moduleKey: 'Help', subscribed: true });

    if (subscriptions.length > 0) {
      await tx.insert(tenantModuleSubscriptions).values(subscriptions);
    }

    // 4. Update the request status
    await tx.update(subscriptionRequests).set({ status: 'approved' }).where(eq(subscriptionRequests.id, requestId));
  });

  // 5. Send activation email to the new user
  try {
    await sendActivationEmail({
        companyName: request.companyName,
        name: adminUserName,
        email: request.email,
        password: adminPassword,
    });
  } catch (error) {
    console.error("CRITICAL: Failed to send activation email:", error);
    // In a real app, you might want to have a retry mechanism or log this failure for manual intervention.
    // For now, we will still return success for the user creation part.
    return {
        success: true,
        message: `تم إنشاء الشركة والمستخدم، لكن فشل إرسال بريد التفعيل. يرجى إرسال البيانات يدوياً.`,
        adminEmail: request.email,
        generatedPassword: adminPassword, // Provide password manually since email failed
    };
  }

  revalidatePath('/system-administration/subscription-requests');
  revalidatePath('/system-administration/tenants');

  return {
    success: true,
    message: `تم إنشاء الشركة وتفعيلها بنجاح. تم إرسال بريد إلكتروني للعميل يحتوي على بيانات الدخول.`,
    adminEmail: request.email,
    generatedPassword: null, // Don't return password if email is successful
  };
}

export async function rejectSubscriptionRequest(requestId: number) {
    const db = await getMainDb();
    await db.update(subscriptionRequests).set({ status: 'rejected' }).where(eq(subscriptionRequests.id, requestId));
    revalidatePath('/system-administration/subscription-requests');
}

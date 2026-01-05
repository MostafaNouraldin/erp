
'use server';

import { connectToTenantDb } from '@/db';
import { subscriptionRenewalRequests } from '@/db/schema';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';

const renewalRequestSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  selectedModules: z.array(z.string()),
  billingCycle: z.enum(["monthly", "yearly"]),
  totalAmount: z.coerce.number(),
  paymentProof: z.string().min(1, "إثبات الدفع مطلوب"),
});

export type RenewalRequestFormValues = z.infer<typeof renewalRequestSchema>;

async function getMainDb() {
  const { db } = await connectToTenantDb();
  return db;
}

export async function createRenewalRequest(values: RenewalRequestFormValues) {
  const db = await getMainDb();

  await db.insert(subscriptionRenewalRequests).values({
    tenantId: values.tenantId,
    userId: values.userId,
    selectedModules: values.selectedModules,
    billingCycle: values.billingCycle,
    totalAmount: String(values.totalAmount),
    paymentProof: values.paymentProof,
    status: 'pending',
  });

  // Notify Super Admins about the new request
  // This requires a way to find super admins. Let's assume there's a known role or a lookup mechanism.
  // For now, we'll skip the notification part as it requires more complex user queries.

  return { success: true, message: "تم إرسال طلب التجديد/الترقية بنجاح." };
}

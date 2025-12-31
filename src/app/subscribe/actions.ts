
'use server';

import { connectToTenantDb } from '@/db';
import { subscriptionRequests } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const subscriptionRequestSchema = z.object({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  selectedModules: z.array(z.string()).min(1, "يجب اختيار وحدة واحدة على الأقل"),
  billingCycle: z.enum(["monthly", "yearly"]),
  totalAmount: z.coerce.number(),
  paymentMethod: z.string().min(1, "طريقة الدفع مطلوبة"),
  paymentProof: z.string().min(1, "إثبات الدفع مطلوب"),
});

export type SubscriptionRequestFormValues = z.infer<typeof subscriptionRequestSchema>;

async function getMainDb() {
  const { db } = await connectToTenantDb('main');
  return db;
}

export async function submitSubscriptionRequest(values: SubscriptionRequestFormValues) {
  const db = await getMainDb();

  await db.insert(subscriptionRequests).values({
    companyName: values.companyName,
    email: values.email,
    phone: values.phone,
    address: values.address,
    vatNumber: values.vatNumber,
    selectedModules: values.selectedModules,
    billingCycle: values.billingCycle,
    totalAmount: String(values.totalAmount),
    paymentMethod: values.paymentMethod,
    paymentProof: values.paymentProof,
    status: 'pending',
  });

  // No revalidation needed as this doesn't directly affect a visible page for the user submitting
  // The admin page will fetch this data on its own.
  return { success: true, message: "تم إرسال طلب الاشتراك بنجاح." };
}

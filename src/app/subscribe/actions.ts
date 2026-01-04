
'use server';

import { connectToTenantDb } from '@/db';
import { subscriptionRequests } from '@/db/schema';
// import { revalidatePath } from 'next/cache'; // Removed to prevent blocking
import { z } from 'zod';

const subscriptionRequestSchema = z.object({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  country: z.string().optional(),
  selectedModules: z.array(z.string()).min(1, "يجب اختيار وحدة واحدة على الأقل"),
  billingCycle: z.enum(["monthly", "yearly"]),
  totalAmount: z.coerce.number(),
  paymentMethod: z.string().min(1, "طريقة الدفع مطلوبة"),
  paymentProof: z.string().min(1, "إثبات الدفع مطلوب"),
});

export type SubscriptionRequestFormValues = z.infer<typeof subscriptionRequestSchema>;

async function getMainDb() {
  const { db } = await connectToTenantDb();
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
    country: values.country,
  });

  // Revalidating the path here can be slow if the target page has heavy data fetching.
  // The user expects an immediate response after form submission.
  // The data will be fresh when the admin next visits the requests page anyway.
  // revalidatePath('/system-administration/subscription-requests');

  return { success: true, message: "تم إرسال طلب الاشتراك بنجاح." };
}

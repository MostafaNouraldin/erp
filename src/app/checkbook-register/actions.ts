
'use server';

import { db } from '@/db';
import { checks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const checkSchema = z.object({
  id: z.string().optional(),
  checkNumber: z.string().min(1, "رقم الشيك مطلوب"),
  issueDate: z.date({ required_error: "تاريخ إصدار الشيك مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ استحقاق الشيك مطلوب" }),
  bankAccountId: z.string().min(1, "الحساب البنكي مطلوب"),
  beneficiaryName: z.string().min(1, "اسم المستفيد مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  currency: z.enum(["SAR", "USD", "EUR"]).default("SAR"),
  purpose: z.string().min(1, "الغرض من الشيك مطلوب"),
  notes: z.string().optional(),
  status: z.enum(["صادر", "مسدد", "ملغي", "مرتجع"]).default("صادر"),
});

export type CheckFormValues = z.infer<typeof checkSchema>;

export async function addCheck(values: CheckFormValues) {
    const newCheckId = `CHK${Date.now()}`;
    await db.insert(checks).values({
        ...values,
        id: newCheckId,
        amount: String(values.amount),
    });
    revalidatePath('/checkbook-register');
}

export async function updateCheck(values: CheckFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(checks).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(checks.id, values.id));
    revalidatePath('/checkbook-register');
}

export async function deleteCheck(id: string) {
    const check = await db.query.checks.findFirst({ where: eq(checks.id, id) });
    if (check && check.status !== 'صادر' && check.status !== 'ملغي') {
        throw new Error("لا يمكن حذف شيك تم تسديده أو إرجاعه.");
    }
    await db.delete(checks).where(eq(checks.id, id));
    revalidatePath('/checkbook-register');
}

export async function updateCheckStatus(id: string, status: CheckFormValues['status']) {
    const check = await db.query.checks.findFirst({ where: eq(checks.id, id) });
    if (!check) {
        throw new Error("لم يتم العثور على الشيك.");
    }
    // Add logic here if certain status transitions are not allowed
    await db.update(checks).set({ status }).where(eq(checks.id, id));
    revalidatePath('/checkbook-register');
}


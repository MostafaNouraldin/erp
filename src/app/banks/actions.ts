
'use server';

import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const bankAccountSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(1, "اسم البنك مطلوب"),
  accountNumber: z.string().min(1, "رقم الحساب مطلوب").regex(/^\d+$/, "رقم الحساب يجب أن يحتوي على أرقام فقط"),
  iban: z.string().optional(),
  accountType: z.enum(["جارى", "توفير", "وديعة"]),
  currency: z.enum(["SAR", "USD", "EUR"]),
  balance: z.coerce.number().default(0),
  branchName: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

export async function addBankAccount(values: BankAccountFormValues) {
    const newId = `BANK${Date.now()}`;
    await db.insert(bankAccounts).values({
        ...values,
        id: newId,
        balance: String(values.balance),
    });
    revalidatePath('/banks');
}

export async function updateBankAccount(values: BankAccountFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(bankAccounts).set({
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        iban: values.iban,
        accountType: values.accountType,
        currency: values.currency,
        branchName: values.branchName,
        isActive: values.isActive,
    }).where(eq(bankAccounts.id, values.id));
    revalidatePath('/banks');
}

export async function deleteBankAccount(id: string) {
    // Note: In a real-world app, you should check for dependencies (e.g., transactions) before deleting.
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
    revalidatePath('/banks');
}

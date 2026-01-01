
'use server';

import { connectToTenantDb } from '@/db';
import { users, roles, companySettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
// Note: In a real app, you'd use a library like 'bcrypt' for password hashing
// For this environment, we'll store it as plain text which is NOT secure.
// const bcrypt = require('bcrypt');


const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المستخدم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  roleId: z.string().min(1, "الدور مطلوب"),
  status: z.enum(["نشط", "غير نشط"]).default("نشط"),
  password: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userSchema>;

const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الدور مطلوب"),
    description: z.string().min(1, "وصف الدور مطلوب"),
    permissions: z.array(z.string()).default([]),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

const settingsSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email().optional(),
  companyPhone: z.string().optional(),
  companyVatNumber: z.string().optional(),
  defaultCurrency: z.string().optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  themePrimaryColor: z.string().optional(),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;


async function getDb() {
    const { db } = await connectToTenantDb();
    return db;
}


// --- User Actions ---
export async function addUser(values: UserFormValues) {
    const db = await getDb();
    if (!values.password) {
        throw new Error("Password is required for a new user.");
    }
    const newId = `USER${Date.now()}`;
    // const passwordHash = await bcrypt.hash(values.password, 10); // Real implementation
    const passwordHash = `hashed_${values.password}`; // Unsafe placeholder

    await db.insert(users).values({
        id: newId,
        name: values.name,
        email: values.email,
        roleId: values.roleId,
        status: values.status,
        avatarUrl: values.avatarUrl,
        passwordHash: passwordHash,
    });
    revalidatePath('/settings');
}

export async function updateUser(values: UserFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    
    // Do not update password if it's not provided
    const updateData: any = {
        name: values.name,
        email: values.email,
        roleId: values.roleId,
        status: values.status,
        avatarUrl: values.avatarUrl,
    };

    if (values.password) {
        // const passwordHash = await bcrypt.hash(values.password, 10);
        updateData.passwordHash = `hashed_${values.password}`; // Unsafe placeholder
    }

    await db.update(users).set(updateData).where(eq(users.id, values.id));
    revalidatePath('/settings');
}


// --- Role Actions ---
export async function addRole(values: RoleFormValues) {
    const db = await getDb();
    const newId = `ROLE${Date.now()}`;
    await db.insert(roles).values({
        id: newId,
        name: values.name,
        description: values.description,
        permissions: values.permissions,
    });
    revalidatePath('/settings');
}

export async function updateRole(values: RoleFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(roles).set({
        name: values.name,
        description: values.description,
        permissions: values.permissions,
    }).where(eq(roles.id, values.id));
    revalidatePath('/settings');
}

export async function deleteRole(id: string) {
    const db = await getDb();
    // Check if any user is assigned this role
    const userWithRole = await db.query.users.findFirst({
        where: eq(users.roleId, id),
    });
    if (userWithRole) {
        throw new Error("لا يمكن حذف الدور لأنه معين لواحد أو أكثر من المستخدمين.");
    }
    await db.delete(roles).where(eq(roles.id, id));
    revalidatePath('/settings');
}

// --- General Settings Actions ---
export async function getCompanySettings(tenantId: string) {
  const db = await getDb();
  const result = await db.query.companySettings.findFirst({
    where: eq(companySettings.id, tenantId),
  });
  return result?.settings as SettingsFormValues | undefined;
}

export async function saveCompanySettings(tenantId: string, settings: SettingsFormValues) {
  const db = await getDb();
  await db.insert(companySettings)
    .values({ id: tenantId, settings })
    .onConflictDoUpdate({
      target: companySettings.id,
      set: { settings },
    });
  revalidatePath('/settings');
  return { success: true };
}

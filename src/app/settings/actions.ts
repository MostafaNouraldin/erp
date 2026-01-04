
'use server';

import { connectToTenantDb } from '@/db';
import { users, roles, companySettings, departments, jobTitles, leaveTypes, allowanceTypes, deductionTypes, chartOfAccounts } from '@/db/schema';
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
  avatar_url: z.string().url().optional().or(z.literal('')),
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
  companyName: z.string().optional().default(''),
  companyAddress: z.string().optional().default(''),
  companyEmail: z.string().email({ message: "بريد إلكتروني غير صالح" }).optional().or(z.literal('')),
  companyPhone: z.string().optional().default(''),
  companyVatNumber: z.string().optional().default(''),
  defaultCurrency: z.string().optional().default('SAR'),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  themePrimaryColor: z.string().optional().default(''),
  smtpHost: z.string().optional().default(''),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional().default(''),
  smtpPass: z.string().optional().default(''),
  smtpSecure: z.boolean().optional().default(true),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;

const departmentSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم القسم مطلوب"),
});
export type Department = z.infer<typeof departmentSchema>;

const jobTitleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم المسمى الوظيفي مطلوب"),
});
export type JobTitle = z.infer<typeof jobTitleSchema>;

const leaveTypeSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم نوع الإجازة مطلوب"),
});
export type LeaveType = z.infer<typeof leaveTypeSchema>;

const allowanceTypeSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم البدل مطلوب"),
    expenseAccountId: z.string().min(1, "حساب المصروف مطلوب"),
});
export type AllowanceType = z.infer<typeof allowanceTypeSchema>;

const deductionTypeSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الخصم مطلوب"),
    liabilityAccountId: z.string().min(1, "حساب الالتزام مطلوب"),
});
export type DeductionType = z.infer<typeof deductionTypeSchema>;

export type Account = {
    id: string;
    name: string;
    type: string;
    balance: number;
    parentId: string | null;
};


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
        avatar_url: values.avatar_url,
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
        avatar_url: values.avatar_url,
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

// --- HR Settings Actions ---
export async function addDepartment(values: Department) {
    const db = await getDb();
    await db.insert(departments).values({ ...values, id: `DEP${Date.now()}` });
    revalidatePath('/settings');
}
export async function updateDepartment(values: Department) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required.");
    await db.update(departments).set({ name: values.name }).where(eq(departments.id, values.id));
    revalidatePath('/settings');
}
export async function deleteDepartment(id: string) {
    const db = await getDb();
    await db.delete(departments).where(eq(departments.id, id));
    revalidatePath('/settings');
}

export async function addJobTitle(values: JobTitle) {
    const db = await getDb();
    await db.insert(jobTitles).values({ ...values, id: `JT${Date.now()}` });
    revalidatePath('/settings');
}
export async function updateJobTitle(values: JobTitle) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required.");
    await db.update(jobTitles).set({ name: values.name }).where(eq(jobTitles.id, values.id));
    revalidatePath('/settings');
}
export async function deleteJobTitle(id: string) {
    const db = await getDb();
    await db.delete(jobTitles).where(eq(jobTitles.id, id));
    revalidatePath('/settings');
}

export async function addLeaveType(values: LeaveType) {
    const db = await getDb();
    await db.insert(leaveTypes).values({ ...values, id: `LT${Date.now()}` });
    revalidatePath('/settings');
}
export async function updateLeaveType(values: LeaveType) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required.");
    await db.update(leaveTypes).set({ name: values.name }).where(eq(leaveTypes.id, values.id));
    revalidatePath('/settings');
}
export async function deleteLeaveType(id: string) {
    const db = await getDb();
    await db.delete(leaveTypes).where(eq(leaveTypes.id, id));
    revalidatePath('/settings');
}

export async function addAllowanceType(values: AllowanceType) {
    const db = await getDb();
    await db.insert(allowanceTypes).values({ ...values, id: `ALW${Date.now()}` });
    revalidatePath('/settings');
}
export async function updateAllowanceType(values: AllowanceType) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required.");
    await db.update(allowanceTypes).set({ name: values.name, expenseAccountId: values.expenseAccountId }).where(eq(allowanceTypes.id, values.id));
    revalidatePath('/settings');
}
export async function deleteAllowanceType(id: string) {
    const db = await getDb();
    await db.delete(allowanceTypes).where(eq(allowanceTypes.id, id));
    revalidatePath('/settings');
}

export async function addDeductionType(values: DeductionType) {
    const db = await getDb();
    await db.insert(deductionTypes).values({ ...values, id: `DED${Date.now()}` });
    revalidatePath('/settings');
}
export async function updateDeductionType(values: DeductionType) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required.");
    await db.update(deductionTypes).set({ name: values.name, liabilityAccountId: values.liabilityAccountId }).where(eq(deductionTypes.id, values.id));
    revalidatePath('/settings');
}
export async function deleteDeductionType(id: string) {
    const db = await getDb();
    await db.delete(deductionTypes).where(eq(deductionTypes.id, id));
    revalidatePath('/settings');
}

    

    
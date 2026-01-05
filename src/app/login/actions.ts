
'use server';

import { connectToTenantDb } from '@/db';
import { users, tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  isSuperAdmin: z.boolean().optional(),
  tenantId: z.string().optional(),
  email: z.string().email(),
  password: z.string(),
});

// A function to verify password. In a real app, use bcrypt.
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    // This is an UNSAFE password check. In a real app, use a library like bcrypt.
    // e.g., return await bcrypt.compare(password, hash);
    return `hashed_${password}` === hash;
}

export async function login(values: z.infer<typeof loginSchema>): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { db } = await connectToTenantDb();
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, values.email.toLowerCase()),
       with: {
            role: true,
        }
    });

    if (!user) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }

    const isMatch = await verifyPassword(values.password, user.passwordHash);

    if (!isMatch) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }
    
    const isSuperAdmin = user.roleId === 'ROLE_SUPER_ADMIN';

    // If the login form indicates super admin, but the user role doesn't match, deny access.
    if(values.isSuperAdmin && !isSuperAdmin) {
        return { success: false, error: "هذا الحساب لا يمتلك صلاحيات مدير النظام."};
    }
    
    // If the login form is for a regular user, but they have a super admin role, deny tenant-specific access.
    if(!values.isSuperAdmin && isSuperAdmin) {
        return { success: false, error: "حساب مدير النظام يجب أن يسجل الدخول من وضع مدير النظام."};
    }

    // Exclude password hash from the user object returned to the client
    const { passwordHash, ...userToReturn } = user;

    // Use tenantId from user record first, fallback to form value (for initial login maybe)
    const tenantId = user.tenantId; // Always rely on the user's assigned tenantId

    let isConfigured = true;
    let subscriptionEndDate = null;
    let isActive = true;

    if (!isSuperAdmin && tenantId) {
        const tenantInfo = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { isConfigured: true, subscriptionEndDate: true, isActive: true }
        });
        isConfigured = tenantInfo?.isConfigured ?? false;
        subscriptionEndDate = tenantInfo?.subscriptionEndDate;
        isActive = tenantInfo?.isActive ?? false;
    } else if (!isSuperAdmin && !tenantId) {
        // This is a user without a tenant, which is an invalid state for a non-superadmin
        return { success: false, error: "هذا الحساب غير مرتبط بأي شركة." };
    }


    return { success: true, user: {...userToReturn, tenantId, isConfigured, subscriptionEndDate, isActive } };

  } catch (error: any) {
    console.error("Login action error:", error);
    return { success: false, error: "حدث خطأ في الخادم أثناء محاولة تسجيل الدخول." };
  }
}

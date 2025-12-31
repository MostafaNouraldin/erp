
"use server";

import { connectToTenantDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
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
    // Since we now have a single DB, we don't need complex tenant switching logic here.
    // The connectToTenantDb function will always return the main connection.
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

    // Exclude password hash from the user object returned to the client
    const { passwordHash, ...userToReturn } = user;

    // Use a default tenantId for non-super-admins if none is provided, or 'main' for super-admins.
    const tenantId = isSuperAdmin ? 'main' : values.tenantId || 'T001';

    return { success: true, user: {...userToReturn, tenantId } };

  } catch (error: any) {
    console.error("Login action error:", error);
    return { success: false, error: "حدث خطأ في الخادم أثناء محاولة تسجيل الدخول." };
  }
}

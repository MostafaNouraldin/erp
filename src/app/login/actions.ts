"use server";

import { connectToTenantDb, mainDb } from '@/db';
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
    // 1. First, try to log in as a Super Admin from the main database
    const superAdmin = await mainDb.query.users.findFirst({
        where: eq(users.email, values.email.toLowerCase()),
        with: {
            role: true,
        }
    });

    if (superAdmin && (superAdmin.role.name === 'Super Admin' || superAdmin.role.id === 'ROLE_SUPER_ADMIN')) {
        const isMatch = await verifyPassword(values.password, superAdmin.passwordHash);
        if (isMatch) {
            const { passwordHash, ...userToReturn } = superAdmin;
            return { success: true, user: {...userToReturn, tenantId: 'main'} }; // Return with a special tenantId
        }
    }

    // 2. If not a super admin or password incorrect for super admin, try tenant login
    if (!values.tenantId) {
        return { success: false, error: "معرف الشركة مطلوب للمستخدمين العاديين." };
    }

    const { db } = await connectToTenantDb(values.tenantId);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, values.email.toLowerCase()),
    });

    if (!user) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }

    const isMatch = await verifyPassword(values.password, user.passwordHash);

    if (!isMatch) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }

    // Exclude password hash from the user object returned to the client
    const { passwordHash, ...userToReturn } = user;

    return { success: true, user: {...userToReturn, tenantId: values.tenantId} };

  } catch (error: any) {
    if (error.message.includes('Could not establish database connection')) {
         return { success: false, error: `لا يمكن الاتصال بقاعدة بيانات الشركة: ${values.tenantId}. تأكد من صحة المعرف.` };
    }
    console.error("Login action error:", error);
    return { success: false, error: "حدث خطأ في الخادم أثناء محاولة تسجيل الدخول." };
  }
}

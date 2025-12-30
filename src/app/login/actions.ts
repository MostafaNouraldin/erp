"use server";

import { connectToTenantDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  tenantId: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function login(values: z.infer<typeof loginSchema>): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const { db } = await connectToTenantDb(values.tenantId);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, values.email.toLowerCase()),
    });

    if (!user) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }

    // This is an UNSAFE password check. In a real app, use a library like bcrypt.
    // e.g., const isMatch = await bcrypt.compare(values.password, user.passwordHash);
    const isMatch = user.passwordHash === `hashed_${values.password}`;

    if (!isMatch) {
      return { success: false, error: "المستخدم غير موجود أو كلمة المرور غير صحيحة." };
    }

    // Exclude password hash from the user object returned to the client
    const { passwordHash, ...userToReturn } = user;

    return { success: true, user: userToReturn };

  } catch (error: any) {
    // Catch specific DB connection errors
    if (error.message.includes('Could not establish database connection')) {
         return { success: false, error: `لا يمكن الاتصال بقاعدة بيانات الشركة: ${values.tenantId}. تأكد من صحة المعرف.` };
    }
    console.error("Login action error:", error);
    return { success: false, error: "حدث خطأ في الخادم أثناء محاولة تسجيل الدخول." };
  }
}

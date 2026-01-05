
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Shield } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { useToast } from "@/hooks/use-toast";
import { login } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  isSuperAdmin: z.boolean().default(false),
  tenantId: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type CompanySettings = { companyName?: string, companyLogo?: string };

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  
  // Login page should use default system branding, not tenant-specific branding
  const companySettings: CompanySettings = {
      companyName: "نسيج للحلول المتكاملة",
      companyLogo: "" // Or a default system logo path
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { isSuperAdmin: false, tenantId: "T001", email: "manager@example.com", password: "password" },
  });

  const isSuperAdminLogin = form.watch("isSuperAdmin");

  useEffect(() => {
    if (isSuperAdminLogin) {
        form.setValue("tenantId", ""); // Clear tenantId when switching to super admin
        form.setValue("email", "super@admin.com");
        form.setValue("password", "superadmin_password");
    } else {
        form.setValue("tenantId", "T001");
        form.setValue("email", "manager@example.com");
        form.setValue("password", "password");
    }
  }, [isSuperAdminLogin, form]);


  const handleLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await login(values);
      if (result.success && result.user) {
        auth.login(result.user);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك، ${result.user.name}!`,
        });
        // The layout client will handle redirection
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: result.error || "البيانات التي أدخلتها غير صحيحة.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
             <AppLogo logoUrl={companySettings.companyLogo} companyName={companySettings.companyName} />
          </div>
          <CardTitle className="text-2xl">تسجيل الدخول إلى النظام</CardTitle>
          <CardDescription>أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="isSuperAdmin"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-center gap-3 space-y-0 rounded-md border p-3 shadow-sm bg-muted/50">
                            <FormControl>
                                <Switch id="superadmin-switch" checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel htmlFor="superadmin-switch" className="flex items-center gap-2 cursor-pointer">
                                <Shield className="h-5 w-5 text-primary"/>
                                <span>تسجيل دخول كمدير نظام</span>
                            </FormLabel>
                        </FormItem>
                    )}
                />
              {!isSuperAdminLogin && (
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معرف الشركة</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: T001" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={isSuperAdminLogin ? "super@admin.com" : "admin@company.com"} {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full shadow-lg" disabled={isLoading}>
                <LogIn className="me-2 h-4 w-4" />
                {isLoading ? 'جارِ التحقق...' : 'تسجيل الدخول'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            ليس لديك حساب بعد؟{" "}
            <Link href="/subscribe" className="underline text-primary">
              اطلب اشتراكاً جديداً
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

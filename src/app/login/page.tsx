"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { useToast } from "@/hooks/use-toast";
import { login } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const loginSchema = z.object({
  tenantId: z.string().min(1, "معرف الشركة مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantId: "T001", email: "", password: "" },
  });

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
        router.push('/'); // Redirect to dashboard
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
             <AppLogo />
          </div>
          <CardTitle className="text-2xl">تسجيل الدخول إلى النظام</CardTitle>
          <CardDescription>أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>معرف الشركة (Tenant ID)</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: T001" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@company.com" {...field} className="bg-background" />
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

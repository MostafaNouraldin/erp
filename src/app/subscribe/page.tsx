
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLogo from '@/components/app-logo';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShoppingBag, Upload, AlertTriangle } from 'lucide-react';
import type { Module } from '@/types/saas';
import { useCurrency } from '@/hooks/use-currency';
import { submitSubscriptionRequest } from './actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// This data would be fetched from the backend in a real app
const allAvailableModules: Module[] = [
  { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, priceMonthly: 100, priceYearly: 1000 },
  { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, priceMonthly: 80, priceYearly: 800 },
  { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, priceMonthly: 90, priceYearly: 900 },
  { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, priceMonthly: 70, priceYearly: 700 },
  { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, priceMonthly: 120, priceYearly: 1200 },
  { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, priceMonthly: 150, priceYearly: 1500 },
  { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, priceMonthly: 110, priceYearly: 1100 },
  { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, priceMonthly: 50, priceYearly: 500 },
  { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, priceMonthly: 60, priceYearly: 600 },
];

const subscriptionRequestSchema = z.object({
  companyName: z.string().min(3, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  selectedModules: z.array(z.string()).min(1, "يجب اختيار وحدة واحدة على الأقل"),
  billingCycle: z.enum(["monthly", "yearly"]),
  totalAmount: z.coerce.number(),
  paymentMethod: z.string().min(1, "طريقة الدفع مطلوبة"),
  paymentProof: z.string().min(1, "إثبات الدفع مطلوب (ارفع صورة)"),
});

type SubscriptionRequestFormValues = z.infer<typeof subscriptionRequestSchema>;

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);


  const form = useForm<SubscriptionRequestFormValues>({
    resolver: zodResolver(subscriptionRequestSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phone: "",
      address: "",
      vatNumber: "",
      selectedModules: [],
      billingCycle: "yearly",
      totalAmount: 0,
      paymentMethod: "Bank Transfer",
    },
  });

  const selectedModules = form.watch("selectedModules");
  const billingCycle = form.watch("billingCycle");

  useEffect(() => {
    const total = selectedModules.reduce((acc, moduleKey) => {
      const module = allAvailableModules.find(m => m.key === moduleKey);
      if (!module) return acc;
      return acc + (billingCycle === 'monthly' ? module.priceMonthly : module.priceYearly);
    }, 0);
    form.setValue("totalAmount", total);
  }, [selectedModules, billingCycle, form]);

  const handlePaymentProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        try {
            const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            setPaymentProofPreview(dataUri);
            form.setValue('paymentProof', dataUri);
            form.clearErrors('paymentProof');
        } catch (error) {
            console.error("Error converting file to data URI:", error);
            toast({ title: "خطأ في رفع الصورة", description: "لم يتمكن النظام من معالجة ملف الصورة.", variant: "destructive" });
        }
    }
  };


  const handleSubscriptionSubmit = async (values: SubscriptionRequestFormValues) => {
    setIsLoading(true);
    try {
        const result = await submitSubscriptionRequest(values);
        if (result.success) {
             toast({
                title: "تم إرسال طلبك بنجاح!",
                description: "سيقوم فريقنا بمراجعة الطلب وتفعيل حسابك خلال 24 ساعة.",
            });
            router.push('/login');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary/50 p-4" dir="rtl">
        <div className="mx-auto my-4">
            <AppLogo />
        </div>
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">طلب اشتراك جديد في نظام المستقبل ERP</CardTitle>
          <CardDescription>املأ النموذج أدناه لبدء استخدام النظام وتخصيص اشتراكك.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubscriptionSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side - Company Info & Payment */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">1. معلومات الشركة</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>اسم الشركة</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني للتواصل</FormLabel><FormControl><Input type="email" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي (اختياري)</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان (اختياري)</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-lg">3. الدفع</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                                <FormItem><FormLabel>طريقة الدفع</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر طريقة الدفع"/></SelectTrigger></FormControl>
                                        <SelectContent><SelectItem value="Bank Transfer">تحويل بنكي</SelectItem></SelectContent>
                                    </Select><FormMessage/>
                                </FormItem>
                            )}/>
                            <div className="p-4 border rounded-md bg-muted/50 text-sm">
                                <p className="font-semibold">بيانات التحويل البنكي:</p>
                                <p>اسم البنك: بنك المستقبل</p>
                                <p>صاحب الحساب: شركة المستقبل لتقنية المعلومات</p>
                                <p>رقم الحساب: 1234567890</p>
                                <p>الآيبان: SA03 8000 0000 6080 1016 7519</p>
                            </div>
                            <FormField control={form.control} name="paymentProof" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">إثبات الدفع <Upload className="h-4 w-4 text-muted-foreground"/></FormLabel>
                                    <FormControl><Input type="file" accept="image/*" onChange={handlePaymentProofUpload} className="bg-background"/></FormControl>
                                    {paymentProofPreview && <img src={paymentProofPreview} alt="معاينة إثبات الدفع" className="mt-2 rounded-md border object-contain max-h-40"/>}
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                </div>
                {/* Right Side - Modules & Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">2. اختر الوحدات ودورة الفوترة</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="billingCycle" render={({ field }) => (
                                <FormItem className="space-y-3"><FormLabel>دورة الفوترة</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.defaultValue} className="flex gap-4">
                                        <FormItem className="flex-1"><FormControl><RadioGroupItem value="monthly" id="monthly" className="peer sr-only" /></FormControl><Label htmlFor="monthly" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">شهري</Label></FormItem>
                                        <FormItem className="flex-1"><FormControl><RadioGroupItem value="yearly" id="yearly" className="peer sr-only"/></FormControl><Label htmlFor="yearly" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">سنوي <Badge variant="secondary" className="mt-1">خصم 15%</Badge></Label></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="selectedModules" render={() => (
                                <FormItem><FormLabel>الوحدات المتاحة</FormLabel>
                                    <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                                        {allAvailableModules.map((module) => (
                                            <FormField key={module.id} control={form.control} name="selectedModules" render={({ field }) => (
                                                <FormItem key={module.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-sm font-medium">{module.name}</FormLabel>
                                                        <p className="text-xs text-muted-foreground">{module.description}</p>
                                                        <p className="text-xs font-semibold text-primary" dangerouslySetInnerHTML={{ __html: `${formatCurrency(billingCycle === 'monthly' ? module.priceMonthly : module.priceYearly)}/${billingCycle === 'monthly' ? 'شهر' : 'سنة'}` }}></p>
                                                    </div>
                                                    <FormControl><Checkbox checked={field.value?.includes(module.key)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value, module.key]) : field.onChange(field.value?.filter((value) => value !== module.key)); }} /></FormControl>
                                                </FormItem>
                                            )} />
                                        ))}
                                    </div>
                                <FormMessage /></FormItem>
                            )} />
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/30">
                        <CardHeader><CardTitle className="text-lg">ملخص الطلب</CardTitle></CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(form.getValues("totalAmount")) }}></div>
                            <p className="text-center text-muted-foreground">/{billingCycle === "monthly" ? "شهرياً" : "سنوياً"}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardContent className="p-4 flex items-start gap-3">
                             <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-1"/>
                             <p className="text-xs text-destructive">بعد تقديم الطلب، سيقوم فريقنا بمراجعة إثبات الدفع وتفعيل حسابك خلال 24 ساعة عمل. ستصلك رسالة على بريدك الإلكتروني تحتوي على تفاصيل الدخول.</p>
                        </CardContent>
                    </Card>
                </div>
              </div>
              <CardFooter className="flex-col gap-4 pt-6">
                <Button type="submit" size="lg" className="w-full max-w-md shadow-lg" disabled={isLoading}>
                  <ShieldCheck className="me-2 h-5 w-5" />
                  {isLoading ? 'جارِ إرسال الطلب...' : 'إرسال طلب الاشتراك'}
                </Button>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                    لديك حساب بالفعل؟ تسجيل الدخول
                </Link>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

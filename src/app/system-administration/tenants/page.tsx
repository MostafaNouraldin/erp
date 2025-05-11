
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Building2, SlidersHorizontal, CheckCircle, XCircle, CalendarDays, BadgeCent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, TenantSubscribedModule, Module, TenantSubscription } from '@/types/saas';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data (replace with actual data fetching in a real app)
const initialTenantsData: Tenant[] = [
  { id: "TEN001", name: "شركة الأوائل للتجارة", email: "contact@awael.com", isActive: true, subscriptionEndDate: new Date(2025, 5, 15), createdAt: new Date(2023, 0, 1), phone: "0112345678", address: "الرياض, السعودية", vatNumber: "300123456700003" },
  { id: "TEN002", name: "مؤسسة النجوم الذهبية", email: "info@stars.sa", isActive: false, subscriptionEndDate: new Date(2024, 2, 1), createdAt: new Date(2023, 2, 10), phone: "0123456789" },
  { id: "TEN003", name: "مجموعة الريادة", email: "admin@riyada.group", isActive: true, subscriptionEndDate: new Date(2024, 11, 31), createdAt: new Date(2022, 8, 20), phone: "0134567890", address: "جدة, السعودية" },
];

const allAvailableModules: Module[] = [
  { id: "MOD001", key: "Dashboard", name: "لوحة التحكم", description: "عرض ملخصات وأداء النظام", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD002", key: "Accounting", name: "الحسابات", description: "إدارة الحسابات العامة والقيود", isRentable: true, priceMonthly: 100, priceYearly: 1000 },
  { id: "MOD003", key: "Inventory", name: "المخزون", description: "إدارة المنتجات والمستودعات", isRentable: true, priceMonthly: 80, priceYearly: 800 },
  { id: "MOD004", key: "Sales", name: "المبيعات", description: "إدارة عروض الأسعار والفواتير", isRentable: true, priceMonthly: 90, priceYearly: 900 },
  { id: "MOD005", key: "Purchases", name: "المشتريات", description: "إدارة أوامر الشراء والموردين", isRentable: true, priceMonthly: 70, priceYearly: 700 },
  { id: "MOD006", key: "HR", name: "الموارد البشرية", description: "إدارة الموظفين والرواتب", isRentable: true, priceMonthly: 120, priceYearly: 1200 },
  { id: "MOD007", key: "Production", name: "الإنتاج", description: "إدارة عمليات التصنيع", isRentable: true, priceMonthly: 150, priceYearly: 1500 },
  { id: "MOD008", key: "Projects", name: "المشاريع", description: "إدارة المشاريع والمهام", isRentable: true, priceMonthly: 110, priceYearly: 1100 },
  { id: "MOD009", key: "POS", name: "نقاط البيع", description: "نظام نقاط البيع بالتجزئة", isRentable: true, priceMonthly: 50, priceYearly: 500 },
  { id: "MOD010", key: "BI", name: "التقارير والتحليل", description: "تقارير مجمعة وتحليلات", isRentable: true, priceMonthly: 60, priceYearly: 600 },
  { id: "MOD011", key: "Settings", name: "الإعدادات العامة", description: "إعدادات النظام الأساسية", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD012", key: "Help", name: "المساعدة", description: "مركز المساعدة والدعم", isRentable: false, priceMonthly: 0, priceYearly: 0 },
  { id: "MOD013", key: "SystemAdministration", name: "إدارة النظام", description: "إدارة الشركات والاشتراكات", isRentable: false, priceMonthly: 0, priceYearly: 0 },
];


const initialTenantSubscriptions: Record<string, TenantSubscribedModule[]> = {
  "TEN001": [
    { moduleId: "Accounting", subscribed: true }, { moduleId: "Inventory", subscribed: true }, { moduleId: "Sales", subscribed: false }, { moduleId: "Purchases", subscribed: true}
  ],
  "TEN002": [
    { moduleId: "Accounting", subscribed: true }
  ],
  "TEN003": [
    { moduleId: "Accounting", subscribed: true }, { moduleId: "Inventory", subscribed: true }, { moduleId: "Sales", subscribed: true }, { moduleId: "HR", subscribed: true }, { moduleId: "POS", subscribed: true }
  ],
};

const tenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  isActive: z.boolean().default(true),
  subscriptionEndDate: z.date().optional(),
  subscribedModules: z.array(z.object({
    moduleId: z.string(), // This will store the module.key
    subscribed: z.boolean(),
  })).default([]),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
});
type TenantFormValues = z.infer<typeof tenantSchema>;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenantsData);
  const [tenantModuleSubscriptions, setTenantModuleSubscriptions] = useState<Record<string, TenantSubscribedModule[]>>(initialTenantSubscriptions);

  const [showManageTenantDialog, setShowManageTenantDialog] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<TenantFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    // defaultValues will be set in useEffect based on tenantToEdit
  });

  const { fields: subscribedModulesFields, replace: replaceSubscribedModules } = useFieldArray({
    control: form.control,
    name: "subscribedModules",
  });


  useEffect(() => {
    if (showManageTenantDialog) {
      if (tenantToEdit && tenantToEdit.id) {
        const currentTenantSubs = tenantModuleSubscriptions[tenantToEdit.id] || [];
        const initialFormModules = allAvailableModules.map(mod => {
          const sub = currentTenantSubs.find(s => s.moduleId === mod.key);
          return { moduleId: mod.key, subscribed: sub ? sub.subscribed : false };
        });
        form.reset({
          ...tenantToEdit,
          subscribedModules: initialFormModules,
        });
      } else {
        const initialFormModules = allAvailableModules.map(mod => ({
          moduleId: mod.key,
          subscribed: false,
        }));
        form.reset({
          name: "", email: "", isActive: true, phone: "", address: "", vatNumber: "",
          subscribedModules: initialFormModules,
          billingCycle: "yearly",
          subscriptionEndDate: undefined,
        });
      }
    }
  }, [tenantToEdit, showManageTenantDialog, tenantModuleSubscriptions, form]);


  const handleTenantSubmit = (values: TenantFormValues) => {
    let effectiveSubscriptionEndDate = values.subscriptionEndDate;
    if (!effectiveSubscriptionEndDate && (values.billingCycle === 'monthly' || values.billingCycle === 'yearly')) {
        effectiveSubscriptionEndDate = new Date();
        if (values.billingCycle === 'monthly') {
            effectiveSubscriptionEndDate.setMonth(effectiveSubscriptionEndDate.getMonth() + 1);
        } else {
            effectiveSubscriptionEndDate.setFullYear(effectiveSubscriptionEndDate.getFullYear() + 1);
        }
    }


    if (tenantToEdit && tenantToEdit.id) {
      setTenants(prev => prev.map(t => t.id === tenantToEdit.id ? { ...t, ...values, createdAt: t.createdAt, id: t.id, subscriptionEndDate: effectiveSubscriptionEndDate } : t));
      setTenantModuleSubscriptions(prev => ({...prev, [tenantToEdit.id!]: values.subscribedModules}));
      toast({ title: "تم التعديل", description: `تم تعديل بيانات الشركة: ${values.name}` });
    } else {
      const newTenantId = `TEN${Date.now()}`;
      const newTenant: Tenant = {
        id: newTenantId,
        ...values,
        createdAt: new Date(),
        subscriptionEndDate: effectiveSubscriptionEndDate,
      };
      setTenants(prev => [...prev, newTenant]);
      setTenantModuleSubscriptions(prev => ({...prev, [newTenantId]: values.subscribedModules}));
      toast({ title: "تم الإنشاء", description: `تم إنشاء شركة جديدة: ${values.name}` });
    }
    setShowManageTenantDialog(false);
    setTenantToEdit(null);
  };

  const handleDeleteTenant = (tenantId: string) => {
    setTenants(prev => prev.filter(t => t.id !== tenantId));
    setTenantModuleSubscriptions(prev => {
        const newSubs = {...prev};
        delete newSubs[tenantId];
        return newSubs;
    });
    toast({ title: "تم الحذف", description: `تم حذف الشركة ${tenantId}.`, variant: "destructive" });
  };

  const getModuleSubscribedStatus = (tenantId: string, moduleKey: string) => {
    const subs = tenantModuleSubscriptions[tenantId];
    if (!subs) return false;
    const moduleSub = subs.find(s => s.moduleId === moduleKey);
    return moduleSub ? moduleSub.subscribed : false;
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Building2 className="me-2 h-8 w-8 text-primary" />
            إدارة الشركات (العملاء المستأجرين)
          </CardTitle>
          <CardDescription>
            إدارة حسابات الشركات المشتركة في النظام، اشتراكاتهم، والصلاحيات الممنوحة لهم.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">قائمة الشركات</h2>
        <Dialog open={showManageTenantDialog} onOpenChange={(isOpen) => { setShowManageTenantDialog(isOpen); if (!isOpen) setTenantToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setTenantToEdit(null); setShowManageTenantDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إضافة شركة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>{tenantToEdit ? 'تعديل بيانات شركة' : 'إضافة شركة جديدة'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleTenantSubmit)} className="space-y-4 py-4">
                <ScrollArea className="max-h-[70vh] p-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-2">
                    <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم الشركة</FormLabel><FormControl><Input placeholder="اسم الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني (للإدارة)</FormLabel><FormControl><Input type="email" placeholder="admin@company.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input placeholder="رقم الهاتف" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                    <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عنوان الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                     <FormField control={form.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input placeholder="الرقم الضريبي للشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                  </div>
                  <Card className="mb-4">
                    <CardHeader><CardTitle className="text-base">إعدادات الاشتراك</CardTitle></CardHeader>
                    <CardContent className="space-y-3 p-4">
                        <FormField control={form.control} name="billingCycle" render={({ field }) => (
                            <FormItem><FormLabel>دورة الفوترة</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر دورة الفوترة"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="monthly">شهري</SelectItem>
                                        <SelectItem value="yearly">سنوي</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="subscriptionEndDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>تاريخ انتهاء الاشتراك (اختياري)</FormLabel>
                            <DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} />
                            <DialogDescriptionComponent className="text-xs text-muted-foreground">
                                إذا ترك فارغاً، سيتم حسابه بناءً على دورة الفوترة من تاريخ الإنشاء/التجديد.
                            </DialogDescriptionComponent>
                            <FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="isActive" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>الحساب نشط؟</FormLabel>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                    </CardContent>
                  </Card>
                   <Card>
                        <CardHeader><CardTitle className="text-base">الوحدات المشترك بها</CardTitle></CardHeader>
                        <CardContent className="space-y-2 p-4">
                            {subscribedModulesFields.map((formFieldItem, index) => {
                                const moduleDetails = allAvailableModules.find(m => m.key === form.getValues(`subscribedModules.${index}.moduleId`));
                                if (!moduleDetails || !moduleDetails.isRentable) {
                                    return null;
                                }
                                return (
                                    <FormField
                                        key={formFieldItem.id}
                                        control={form.control}
                                        name={`subscribedModules.${index}.subscribed`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel htmlFor={`subscribedModules.${index}.subscribed`}>{moduleDetails.name}</FormLabel>
                                                    <DialogDescriptionComponent className="text-xs">
                                                        شهري: {moduleDetails.priceMonthly} SAR / سنوي: {moduleDetails.priceYearly} SAR
                                                    </DialogDescriptionComponent>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        id={`subscribedModules.${index}.subscribed`}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                );
                            })}
                        </CardContent>
                    </Card>
                </ScrollArea>
                <DialogFooter>
                  <Button type="submit">{tenantToEdit ? 'حفظ التعديلات' : 'إضافة الشركة'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="mb-4">
            <Input placeholder="بحث باسم الشركة أو البريد الإلكتروني..." className="max-w-sm bg-background" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الشركة</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>تاريخ انتهاء الاشتراك</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الوحدات المشتركة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.email}</TableCell>
                    <TableCell>{tenant.phone || '-'}</TableCell>
                    <TableCell>{tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate).toLocaleDateString('ar-SA') : 'غير محدد'}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.isActive ? "default" : "outline"}>
                        {tenant.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {tenantModuleSubscriptions[tenant.id!]?.filter(s => s.subscribed).map(s => allAvailableModules.find(m=>m.key === s.moduleId)?.name).join(', ') || 'لا يوجد'}
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setTenantToEdit(tenant as TenantFormValues); setShowManageTenantDialog(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف الشركة "{tenant.name}" وجميع بياناتها المرتبطة.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTenant(tenant.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

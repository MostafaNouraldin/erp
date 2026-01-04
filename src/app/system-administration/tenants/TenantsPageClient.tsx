
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, TenantSubscribedModule, Module } from '@/types/saas';
import { ScrollArea } from "@/components/ui/scroll-area";
import { addTenant, updateTenant, deleteTenant } from './actions';
import { Textarea } from '@/components/ui/textarea';

const tenantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الشركة مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean().default(true),
  subscriptionEndDate: z.date().optional(),
  subscribedModules: z.array(z.object({
    key: z.string().optional(),
    moduleId: z.string(),
    subscribed: z.boolean(),
  })).default([]),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
  // New fields for admin user creation
  adminName: z.string().optional(),
  adminEmail: z.string().email("بريد إلكتروني غير صالح للمدير").optional().or(z.literal('')),
  adminPassword: z.string().optional(),
}).refine(data => {
    // Make admin fields required only when creating a new tenant (id is not present)
    if (!data.id) {
        return !!data.adminName && !!data.adminEmail && !!data.adminPassword;
    }
    return true;
}, {
    message: "بيانات المدير (الاسم، البريد الإلكتروني، كلمة المرور) مطلوبة عند إنشاء شركة جديدة.",
    path: ["adminName"], // Show error message under one of the fields
});

type TenantFormValues = z.infer<typeof tenantSchema>;

interface ClientProps {
  initialData: {
    tenants: Tenant[];
    tenantModuleSubscriptions: Record<string, TenantSubscribedModule[]>;
    allAvailableModules: Module[];
  }
}

export default function TenantsPageClient({ initialData }: ClientProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialData.tenants);
  const [tenantModuleSubscriptions, setTenantModuleSubscriptions] = useState<Record<string, TenantSubscribedModule[]>>(initialData.tenantModuleSubscriptions);
  const [allAvailableModules] = useState<Module[]>(initialData.allAvailableModules);

  const [showManageTenantDialog, setShowManageTenantDialog] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<TenantFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      email: "",
      isActive: true,
      phone: "",
      address: "",
      vatNumber: "",
      country: "SA",
      subscribedModules: [],
      billingCycle: "yearly",
      subscriptionEndDate: undefined,
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    }
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "subscribedModules",
    keyName: "fieldId",
  });

  useEffect(() => {
    setTenants(initialData.tenants);
    setTenantModuleSubscriptions(initialData.tenantModuleSubscriptions);
  }, [initialData]);

  const openAddDialog = () => {
    setTenantToEdit(null);
    const initialFormModules = allAvailableModules.map(mod => ({
      key: mod.key,
      moduleId: mod.key,
      subscribed: !mod.isRentable, // Default non-rentable modules to subscribed
    }));
    form.reset({
      name: "",
      email: "",
      isActive: true,
      phone: "",
      address: "",
      vatNumber: "",
      country: "SA",
      subscribedModules: initialFormModules,
      billingCycle: "yearly",
      subscriptionEndDate: undefined,
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setShowManageTenantDialog(true);
  };
  
  const openEditDialog = (tenant: Tenant) => {
    const currentTenantSubs = tenantModuleSubscriptions[tenant.id] || [];
    const initialFormModules = allAvailableModules.map(mod => {
        const sub = currentTenantSubs.find(s => s.moduleId === mod.key);
        return { key: mod.key, moduleId: mod.key, subscribed: sub ? sub.subscribed : !mod.isRentable };
    });

    setTenantToEdit(tenant as TenantFormValues);
    form.reset({
      ...tenant,
      subscriptionEndDate: tenant.subscriptionEndDate ? new Date(tenant.subscriptionEndDate) : undefined,
      subscribedModules: initialFormModules,
      // Admin fields are not for editing, so clear them
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    });
    setShowManageTenantDialog(true);
  };


  const handleTenantSubmit = async (values: TenantFormValues) => {
    try {
      if (tenantToEdit && tenantToEdit.id) {
        await updateTenant({ ...values, id: tenantToEdit.id });
        toast({ title: "تم التعديل", description: `تم تعديل بيانات الشركة: ${values.name}` });
      } else {
        await addTenant(values);
        toast({ title: "تم الإنشاء", description: `تم إنشاء شركة جديدة: ${values.name}` });
      }
      setShowManageTenantDialog(false);
      setTenantToEdit(null);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTenantAction = async (tenantId: string) => {
    try {
      await deleteTenant(tenantId);
      toast({ title: "تم الحذف", description: `تم حذف الشركة ${tenantId}.`, variant: "destructive" });
    } catch (e) {
       toast({ title: "خطأ", description: "لم يتم حذف الشركة.", variant: "destructive" });
    }
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
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={openAddDialog}>
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
                  <Card className="mb-4">
                    <CardHeader><CardTitle className="text-base">معلومات الشركة</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="id" render={({ field }) => ( <FormItem><FormLabel>معرف الشركة (Tenant ID)</FormLabel><FormControl><Input placeholder="مثال: T002" {...field} className="bg-background" disabled={!!tenantToEdit}/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم الشركة</FormLabel><FormControl><Input placeholder="اسم الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني (للفواتير)</FormLabel><FormControl><Input type="email" placeholder="billing@company.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input placeholder="رقم الهاتف" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input placeholder="الرقم الضريبي للشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                             <FormField control={form.control} name="country" render={({ field }) => ( <FormItem><FormLabel>الدولة</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الدولة"/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="SA">المملكة العربية السعودية</SelectItem>
                                            <SelectItem value="EG">مصر</SelectItem>
                                            <SelectItem value="Other">دولة أخرى (بالدولار الأمريكي)</SelectItem>
                                        </SelectContent>
                                    </Select><FormMessage/></FormItem> )}/>
                            <div className="md:col-span-2">
                                <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عنوان الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            </div>
                        </div>
                    </CardContent>
                  </Card>

                  {!tenantToEdit && (
                    <Card className="mb-4">
                        <CardHeader><CardTitle className="text-base">حساب المدير الأساسي</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="adminName" render={({ field }) => ( <FormItem><FormLabel>اسم المدير</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={form.control} name="adminEmail" render={({ field }) => ( <FormItem><FormLabel>بريد المدير الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                <div className="md:col-span-2">
                                <FormField control={form.control} name="adminPassword" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                </div>
                             </div>
                        </CardContent>
                    </Card>
                  )}

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
                            {fields.map((formFieldItem, index) => {
                                const moduleDetails = allAvailableModules.find(m => m.key === formFieldItem.moduleId);
                                if (!moduleDetails) return null;
                                
                                return (
                                    <FormField
                                        key={formFieldItem.fieldId}
                                        control={form.control}
                                        name={`subscribedModules.${index}.subscribed`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                <div className="space-y-0.5">
                                                    <FormLabel htmlFor={`subscribedModules.${index}.subscribed`} className="cursor-pointer">{moduleDetails.name}</FormLabel>
                                                    <DialogDescriptionComponent className="text-xs">
                                                        {moduleDetails.isRentable 
                                                            ? `(وحدة اختيارية)`
                                                            : 'وحدة أساسية'
                                                        }
                                                    </DialogDescriptionComponent>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        id={`subscribedModules.${index}.subscribed`}
                                                        disabled={!moduleDetails.isRentable}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => openEditDialog(tenant)}>
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
                          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTenantAction(tenant.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
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

    

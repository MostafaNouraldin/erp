
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter, Printer, Download, Banknote, PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionInvoice, SubscriptionInvoiceItem, Module } from '@/types/saas';
import { useCurrency } from '@/hooks/use-currency';

// Mock data for tenants (ID and Name)
const mockTenantsData = [
  { id: "TEN001", name: "شركة الأوائل للتجارة" },
  { id: "TEN002", name: "مؤسسة النجوم الذهبية" },
  { id: "TEN003", name: "مجموعة الريادة" },
];

// Simplified module data for selection in the form
const availableModulesForSubscription: Pick<Module, 'key' | 'name' | 'priceMonthly' | 'priceYearly'>[] = [
  { key: "Accounting", name: "الحسابات", priceMonthly: 100, priceYearly: 1000 },
  { key: "Inventory", name: "المخزون", priceMonthly: 80, priceYearly: 800 },
  { key: "Sales", name: "المبيعات", priceMonthly: 90, priceYearly: 900 },
  { key: "Purchases", name: "المشتريات", priceMonthly: 70, priceYearly: 700 },
  { key: "HR", name: "الموارد البشرية", priceMonthly: 120, priceYearly: 1200 },
  { key: "Production", name: "الإنتاج", priceMonthly: 150, priceYearly: 1500 },
  { key: "Projects", name: "المشاريع", priceMonthly: 110, priceYearly: 1100 },
  { key: "POS", name: "نقاط البيع", priceMonthly: 50, priceYearly: 500 },
  { key: "BI", name: "التقارير والتحليل", priceMonthly: 60, priceYearly: 600 },
];


const initialSubscriptionInvoicesData: SubscriptionInvoice[] = [
  { id: "INV-SUB-001", tenantId: "TEN001", issueDate: new Date(2024, 0, 15), dueDate: new Date(2024, 1, 15), totalAmount: 1000, status: "paid", items: [{ moduleId: "Accounting", moduleName: "الحسابات", price: 1000, period: "سنة 2024" }], paymentMethod: "تحويل بنكي", transactionId: "TRN123" },
  { id: "INV-SUB-002", tenantId: "TEN003", issueDate: new Date(2024, 4, 1), dueDate: new Date(2024, 5, 1), totalAmount: 2800, status: "unpaid", items: [{ moduleId: "Sales", moduleName: "المبيعات", price: 900, period: "سنة 2024" }, {moduleId: "HR", moduleName: "الموارد البشرية", price: 1200, period: "سنة 2024"}, {moduleId: "POS", moduleName: "نقاط البيع", price: 500, period: "سنة 2024"}], },
  { id: "INV-SUB-003", tenantId: "TEN001", issueDate: new Date(2025, 0, 15), dueDate: new Date(2025, 1, 15), totalAmount: 1000, status: "unpaid", items: [{ moduleId: "Accounting", moduleName: "الحسابات", price: 1000, period: "سنة 2025" }], },
];

const subscriptionInvoiceItemSchema = z.object({
  moduleId: z.string().min(1, "الوحدة مطلوبة"),
  moduleName: z.string().optional(), // Will be auto-filled
  price: z.coerce.number().min(0, "السعر يجب أن يكون إيجابياً"),
  period: z.string().min(1, "فترة الاشتراك مطلوبة (مثال: سنة 2024 أو يوليو 2024)"),
});

const subscriptionInvoiceFormSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().min(1, "الشركة مطلوبة"),
  issueDate: z.date({ required_error: "تاريخ الإصدار مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(subscriptionInvoiceItemSchema).min(1, "يجب إضافة وحدة واحدة على الأقل"),
  status: z.enum(["paid", "unpaid", "overdue", "cancelled"]).default("unpaid"),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

type SubscriptionInvoiceFormValues = z.infer<typeof subscriptionInvoiceFormSchema>;


export default function SubscriptionInvoicesPage() {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(initialSubscriptionInvoicesData);
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<SubscriptionInvoiceFormValues | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const form = useForm<SubscriptionInvoiceFormValues>({
    resolver: zodResolver(subscriptionInvoiceFormSchema),
    defaultValues: {
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default due date 30 days from now
      status: "unpaid",
      billingCycle: "yearly",
      items: [{ moduleId: "", price: 0, period: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (showCreateInvoiceDialog) {
      if (invoiceToEdit) {
        // Map existing invoice items to form values
        const formItems = invoiceToEdit.items.map(item => ({
            moduleId: availableModulesForSubscription.find(m => m.name === item.moduleName)?.key || "",
            moduleName: item.moduleName, // Keep original name for display if key not found
            price: item.price,
            period: item.period
        }));
        form.reset({
            ...invoiceToEdit,
            issueDate: new Date(invoiceToEdit.issueDate),
            dueDate: new Date(invoiceToEdit.dueDate),
            items: formItems.length > 0 ? formItems : [{ moduleId: "", price: 0, period: "" }]
        });
      } else {
        form.reset({
          tenantId: "",
          issueDate: new Date(),
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          status: "unpaid",
          billingCycle: "yearly",
          items: [{ moduleId: "", price: 0, period: `سنة ${new Date().getFullYear()}` }],
          paymentMethod: "",
          transactionId: ""
        });
      }
    }
  }, [invoiceToEdit, showCreateInvoiceDialog, form]);

  const handleInvoiceSubmit = (values: SubscriptionInvoiceFormValues) => {
    const totalAmount = values.items.reduce((sum, item) => sum + item.price, 0);
    const itemsWithModuleNames = values.items.map(item => ({
      ...item,
      moduleName: availableModulesForSubscription.find(mod => mod.key === item.moduleId)?.name || item.moduleId,
    }));

    const newInvoice: SubscriptionInvoice = {
      ...values,
      id: invoiceToEdit?.id || `INV-SUB-${Date.now()}`,
      totalAmount,
      items: itemsWithModuleNames,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
    };

    if (invoiceToEdit) {
      setInvoices(prev => prev.map(inv => inv.id === invoiceToEdit.id ? newInvoice : inv));
      toast({ title: "تم التعديل", description: `تم تعديل فاتورة الاشتراك رقم ${newInvoice.id}.` });
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
      toast({ title: "تم الإنشاء", description: `تم إنشاء فاتورة اشتراك جديدة رقم ${newInvoice.id}.` });
    }
    setShowCreateInvoiceDialog(false);
    setInvoiceToEdit(null);
  };

  const handleModuleChange = (index: number, moduleId: string) => {
    const selectedModule = availableModulesForSubscription.find(m => m.key === moduleId);
    if (selectedModule) {
      const billingCycle = form.getValues("billingCycle");
      const price = billingCycle === "monthly" ? selectedModule.priceMonthly : selectedModule.priceYearly;
      form.setValue(`items.${index}.price`, price);
      form.setValue(`items.${index}.moduleName`, selectedModule.name);
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <FileText className="me-2 h-8 w-8 text-primary" />
            فواتير الاشتراكات
          </CardTitle>
          <CardDescription>
            إدارة وعرض فواتير الاشتراكات الصادرة للشركات (العملاء المستأجرين).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
         <h2 className="text-xl font-semibold">قائمة فواتير الاشتراكات</h2>
        <Dialog open={showCreateInvoiceDialog} onOpenChange={(isOpen) => { setShowCreateInvoiceDialog(isOpen); if (!isOpen) setInvoiceToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setInvoiceToEdit(null); setShowCreateInvoiceDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إنشاء فاتورة اشتراك
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>{invoiceToEdit ? 'تعديل فاتورة اشتراك' : 'إنشاء فاتورة اشتراك جديدة'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInvoiceSubmit)} className="space-y-4 py-4">
                <ScrollArea className="max-h-[70vh] p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-2">
                        <FormField control={form.control} name="tenantId" render={({ field }) => (
                            <FormItem><FormLabel>الشركة (العميل)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الشركة" /></SelectTrigger></FormControl>
                                <SelectContent>{mockTenantsData.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="billingCycle" render={({ field }) => (
                            <FormItem><FormLabel>دورة الفوترة</FormLabel>
                                <Select onValueChange={(value) => {
                                    field.onChange(value);
                                    // Optionally, re-calculate prices for items when cycle changes
                                    form.getValues("items").forEach((_, index) => {
                                        const currentModuleId = form.getValues(`items.${index}.moduleId`);
                                        if (currentModuleId) handleModuleChange(index, currentModuleId);
                                    });
                                }} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر دورة الفوترة"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="monthly">شهري</SelectItem>
                                    <SelectItem value="yearly">سنوي</SelectItem>
                                </SelectContent>
                                </Select><FormMessage/>
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="issueDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>تاريخ الإصدار</FormLabel>
                                <DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="dueDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                                <DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} />
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <Card className="mb-4">
                        <CardHeader><CardTitle className="text-base">بنود الفاتورة (الوحدات المشترك بها)</CardTitle></CardHeader>
                        <CardContent className="space-y-3 p-4">
                            {fields.map((fieldItem, index) => (
                                <div key={fieldItem.id} className="grid grid-cols-12 gap-x-3 gap-y-2 items-end p-2 border rounded-md">
                                    <FormField control={form.control} name={`items.${index}.moduleId`} render={({ field }) => (
                                        <FormItem className="col-span-12 sm:col-span-5"><FormLabel className="text-xs">الوحدة</FormLabel>
                                            <Select onValueChange={(value) => { field.onChange(value); handleModuleChange(index, value); }} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الوحدة" /></SelectTrigger></FormControl>
                                            <SelectContent>{availableModulesForSubscription.filter(m => m.key !== 'Dashboard' && m.key !== 'Settings' && m.key !== 'Help' && m.key !== 'SystemAdministration').map(m => <SelectItem key={m.key} value={m.key}>{m.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage className="text-xs"/>
                                        </FormItem>
                                    )} />
                                     <FormField control={form.control} name={`items.${index}.price`} render={({ field }) => (
                                        <FormItem className="col-span-6 sm:col-span-3"><FormLabel className="text-xs">السعر</FormLabel>
                                            <FormControl><Input type="number" {...field} className="bg-background h-9 text-xs" placeholder="0.00" /></FormControl>
                                            <FormMessage className="text-xs"/>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`items.${index}.period`} render={({ field }) => (
                                        <FormItem className="col-span-6 sm:col-span-3"><FormLabel className="text-xs">الفترة</FormLabel>
                                            <FormControl><Input {...field} className="bg-background h-9 text-xs" placeholder="مثال: سنة 2024" /></FormControl>
                                            <FormMessage className="text-xs"/>
                                        </FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="col-span-12 sm:col-span-1 h-9 w-full sm:w-9 text-destructive hover:bg-destructive/10">
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => append({ moduleId: "", price: 0, period: `سنة ${new Date().getFullYear()}` })} className="text-xs py-1 px-2 h-auto mt-2">
                                <PlusCircle className="me-1 h-3 w-3" /> إضافة بند
                            </Button>
                        </CardContent>
                    </Card>
                     <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>حالة الفاتورة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة"/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="unpaid">غير مدفوعة</SelectItem>
                                <SelectItem value="paid">مدفوعة</SelectItem>
                                <SelectItem value="overdue">متأخرة</SelectItem>
                                <SelectItem value="cancelled">ملغاة</SelectItem>
                            </SelectContent>
                            </Select><FormMessage/>
                        </FormItem>
                    )}/>
                </ScrollArea>
                <DialogFooter>
                  <Button type="submit">{invoiceToEdit ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>


      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
              <div className="relative w-full sm:w-auto grow sm:grow-0">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="بحث برقم الفاتورة أو اسم الشركة..." className="pr-10 w-full sm:w-72 bg-background" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب حالة الفاتورة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مدفوعة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>غير مدفوعة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متأخرة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DatePickerWithPresets mode="range" />
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    <Download className="me-2 h-4 w-4" /> تصدير
                  </Button>
              </div>
            </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>اسم الشركة</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{mockTenantsData.find(t => t.id === invoice.tenantId)?.name || invoice.tenantId}</TableCell>
                    <TableCell>{new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.totalAmount) }}></TableCell>
                    <TableCell>
                      <Badge 
                          variant={
                              invoice.status === "paid" ? "default" :
                              invoice.status === "unpaid" ? "outline" :
                              "destructive" // for overdue or cancelled
                          }
                      >
                        {invoice.status === "paid" ? "مدفوعة" : invoice.status === "unpaid" ? "غير مدفوعة" : invoice.status === "overdue" ? "متأخرة" : "ملغاة"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الفاتورة">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {invoice.status === "unpaid" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة">
                              <Banknote className="h-4 w-4 text-green-600" />
                          </Button>
                      )}
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

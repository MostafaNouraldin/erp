
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, PlusCircle, Edit, Trash2, FileText, CheckCircle, Search, Filter, Printer, DollarSign, MinusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AppLogo from '@/components/app-logo';
import { useCurrency } from '@/hooks/use-currency';
import { addSalesInvoice, updateSalesInvoice, deleteSalesInvoice } from '@/app/sales/actions';
import { addSupplierInvoice, updateSupplierInvoice, deleteSupplierInvoice, updateSupplierInvoicePayment } from '@/app/purchases/actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';


const customerInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const customerInvoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(customerInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
  isDeferredPayment: z.boolean().default(false),
  numericTotalAmount: z.number().optional(), // Added for calculation
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
});
type CustomerInvoiceFormValues = z.infer<typeof customerInvoiceSchema>;

const supplierInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const supplierInvoiceSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  invoiceDate: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(supplierInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  totalAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  status: z.enum(["غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"]).default("غير مدفوع"),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

const paymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, "مبلغ الدفع يجب أن يكون أكبر من صفر."),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

const mockItems = [
    {id: "ITEM001", name: "لابتوب Dell XPS 15", price: 6500},
    {id: "ITEM002", name: "طابعة HP LaserJet", price: 1200},
    {id: "SERV001", name: "خدمة استشارية A", price: 15000},
];


export default function AccountsPayableReceivableClientComponent({ initialData }: { initialData: any }) {
  const [customerInvoices, setCustomerInvoices] = useState(initialData.customerInvoices);
  const [supplierInvoices, setSupplierInvoices] = useState(initialData.supplierInvoices);
  const [customers, setCustomers] = useState(initialData.customers);
  const [suppliers, setSuppliers] = useState(initialData.suppliers);

  const [showManageCustomerInvoiceDialog, setShowManageCustomerInvoiceDialog] = useState(false);
  const [customerInvoiceToEdit, setCustomerInvoiceToEdit] = useState<CustomerInvoiceFormValues | null>(null);

  const [showManageSupplierInvoiceDialog, setShowManageSupplierInvoiceDialog] = useState(false);
  const [supplierInvoiceToEdit, setSupplierInvoiceToEdit] = useState<SupplierInvoiceFormValues | null>(null);

  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<any | null>(null);

  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const customerInvoiceForm = useForm<CustomerInvoiceFormValues>({
    resolver: zodResolver(customerInvoiceSchema),
    defaultValues: { date: new Date(), dueDate: new Date(), status: "غير مدفوع" },
  });
  const { fields: customerItemsFields, append: appendCustomerItem, remove: removeCustomerItem } = useFieldArray({
    control: customerInvoiceForm.control, name: "items",
  });

  const supplierInvoiceForm = useForm<SupplierInvoiceFormValues>({
    resolver: zodResolver(supplierInvoiceSchema),
    defaultValues: { invoiceDate: new Date(), dueDate: new Date(), status: "غير مدفوع" },
  });
  const { fields: supplierItemsFields, append: appendSupplierItem, remove: removeSupplierItem } = useFieldArray({
    control: supplierInvoiceForm.control, name: "items",
  });

  const paymentForm = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema) });
  
  useEffect(() => {
    setCustomerInvoices(initialData.customerInvoices);
    setSupplierInvoices(initialData.supplierInvoices);
    setCustomers(initialData.customers);
    setSuppliers(initialData.suppliers);
  }, [initialData]);

  const calculateItemTotalForForm = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };

  const calculateTotalAmount = (items: any[]) => items.reduce((sum, item) => sum + item.total, 0);

  
useEffect(() => {
    if (showManageCustomerInvoiceDialog) {
        if (customerInvoiceToEdit) {
            customerInvoiceForm.reset({
                ...customerInvoiceToEdit,
                date: new Date(customerInvoiceToEdit.date),
                dueDate: new Date(customerInvoiceToEdit.dueDate),
            });
        } else {
            customerInvoiceForm.reset({ customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", isDeferredPayment: false });
        }
    }
}, [customerInvoiceToEdit, customerInvoiceForm, showManageCustomerInvoiceDialog]);

useEffect(() => {
    if (showManageSupplierInvoiceDialog) {
        if (supplierInvoiceToEdit) {
            supplierInvoiceForm.reset({
                ...supplierInvoiceToEdit,
                invoiceDate: new Date(supplierInvoiceToEdit.invoiceDate),
                dueDate: new Date(supplierInvoiceToEdit.dueDate),
            });
        } else {
            supplierInvoiceForm.reset({ supplierId: '', invoiceDate: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 });
        }
    }
}, [supplierInvoiceToEdit, supplierInvoiceForm, showManageSupplierInvoiceDialog]);


useEffect(() => {
    if (invoiceToPay) {
      paymentForm.reset({ paymentAmount: invoiceToPay.totalAmount - (invoiceToPay.paidAmount || 0) });
    }
}, [invoiceToPay, paymentForm]);


const handleCustomerInvoiceSubmit = async (values: any) => {
    const totalAmount = calculateTotalAmount(values.items);
    const finalValues = { ...values, numericTotalAmount: totalAmount };
    try {
        if (customerInvoiceToEdit) {
            await updateSalesInvoice({ ...finalValues, id: customerInvoiceToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل فاتورة العميل." });
        } else {
            await addSalesInvoice(finalValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء فاتورة العميل." });
        }
        setShowManageCustomerInvoiceDialog(false);
        setCustomerInvoiceToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ الفاتورة.", variant: "destructive" });
    }
};

const handleSupplierInvoiceSubmit = async (values: any) => {
    const totalAmount = calculateTotalAmount(values.items);
    const finalValues = { ...values, totalAmount };
    try {
        if (supplierInvoiceToEdit) {
            await updateSupplierInvoice({ ...finalValues, id: supplierInvoiceToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل فاتورة المورد." });
        } else {
            await addSupplierInvoice(finalValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء فاتورة المورد." });
        }
        setShowManageSupplierInvoiceDialog(false);
        setSupplierInvoiceToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ الفاتورة.", variant: "destructive" });
    }
};

const handleDeleteInvoice = async (type: 'customer' | 'supplier', invoiceId: string) => {
    try {
        if (type === 'customer') {
            await deleteSalesInvoice(invoiceId);
        } else {
            await deleteSupplierInvoice(invoiceId);
        }
        toast({ title: "تم الحذف", description: "تم حذف الفاتورة بنجاح.", variant: "destructive" });
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حذف الفاتورة.", variant: "destructive" });
    }
};


  const handleRecordPaymentSubmit = async (paymentValues: PaymentFormValues) => {
    if (!invoiceToPay) return;
    try {
        const newPaidAmount = (invoiceToPay.paidAmount || 0) + paymentValues.paymentAmount;
        const newStatus = newPaidAmount >= invoiceToPay.totalAmount ? "مدفوع" as const : "مدفوع جزئياً" as const;
        await updateSupplierInvoicePayment(invoiceToPay.id, newPaidAmount, newStatus);
        toast({ title: "تم تسجيل الدفعة", description: "تم تسجيل دفعة لفاتورة المورد بنجاح." });
        setShowRecordPaymentDialog(false);
        setInvoiceToPay(null);
    } catch(error) {
        toast({ title: "خطأ", description: "لم يتم تسجيل الدفعة.", variant: "destructive" });
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Users className="me-2 h-8 w-8 text-primary" />
            الحسابات المدينة والدائنة
          </CardTitle>
          <CardDescription>
            إدارة فواتير العملاء (المستحقات) وفواتير الموردين (الالتزامات) وتتبع حالة السداد.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="receivable" className="w-full mt-6">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="receivable" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> الذمم المدينة (العملاء)
          </TabsTrigger>
          <TabsTrigger value="payable" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Briefcase className="inline-block me-2 h-4 w-4" /> الذمم الدائنة (الموردون)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="receivable">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>فواتير العملاء المستحقة</CardTitle>
                 <Dialog open={showManageCustomerInvoiceDialog} onOpenChange={(isOpen) => {setShowManageCustomerInvoiceDialog(isOpen); if(!isOpen) setCustomerInvoiceToEdit(null);}}>
                    <DialogTrigger asChild>
                         <Button className="shadow-sm" onClick={() => { setCustomerInvoiceToEdit(null); setShowManageCustomerInvoiceDialog(true); }}>
                           <PlusCircle className="me-2 h-4 w-4" /> فاتورة جديدة
                         </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{customerInvoiceToEdit ? 'تعديل فاتورة عميل' : 'إنشاء فاتورة عميل جديدة'}</DialogTitle>
                        </DialogHeader>
                        <Form {...customerInvoiceForm}>
                            <form onSubmit={customerInvoiceForm.handleSubmit(handleCustomerInvoiceSubmit)} className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={customerInvoiceForm.control} name="customerId" render={({ field }) => (
                                        <FormItem><FormLabel>اسم العميل</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                                            <SelectContent>{customers.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem> )} />
                                    <FormField control={customerInvoiceForm.control} name="date" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={customerInvoiceForm.control} name="dueDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={customerInvoiceForm.control} name="isDeferredPayment" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm md:col-span-2 rtl:space-x-reverse">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isDeferredPayment" /></FormControl>
                                        <FormLabel htmlFor="isDeferredPayment" className="font-normal">فاتورة بيع آجل</FormLabel>
                                        </FormItem> )} />
                                </div>
                                <ScrollArea className="h-[200px] border rounded-md p-2">
                                    {customerItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                        <FormField control={customerInvoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                            <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                            <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { customerInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); customerInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(customerInvoiceForm, index); }} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={customerInvoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(customerInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={customerInvoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(customerInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={customerInvoiceForm.control} name={`items.${index}.total`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                            <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomerItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                    </div> ))}
                                </ScrollArea>
                                <Button type="button" variant="outline" onClick={() => appendCustomerItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>

                                <DialogFooter>
                                    <Button type="submit" >{customerInvoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{customers.find((c:any) => c.id === invoice.customerId)?.name}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.numericTotalAmount) }}></TableCell>
                        <TableCell><Badge variant={invoice.status === 'مدفوع' ? 'default' : 'destructive'}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Printing ${invoice.id}`)}><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setCustomerInvoiceToEdit(invoice); setShowManageCustomerInvoiceDialog(true);}}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف الفاتورة رقم "{invoice.id}"؟</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteInvoice('customer', invoice.id)}>تأكيد الحذف</AlertDialogAction>
                                  </AlertDialogFooter>
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
        </TabsContent>

        <TabsContent value="payable">
           <Card className="shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>فواتير الموردين المستحقة</CardTitle>
                <Dialog open={showManageSupplierInvoiceDialog} onOpenChange={(isOpen) => {setShowManageSupplierInvoiceDialog(isOpen); if(!isOpen) setSupplierInvoiceToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button className="shadow-sm" onClick={() => { setSupplierInvoiceToEdit(null); setShowManageSupplierInvoiceDialog(true); }}>
                           <PlusCircle className="me-2 h-4 w-4" /> فاتورة جديدة
                        </Button>
                    </DialogTrigger>
                     <DialogContent className="sm:max-w-3xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{supplierInvoiceToEdit ? 'تعديل فاتورة مورد' : 'إنشاء فاتورة مورد جديدة'}</DialogTitle>
                        </DialogHeader>
                        <Form {...supplierInvoiceForm}>
                            <form onSubmit={supplierInvoiceForm.handleSubmit(handleSupplierInvoiceSubmit)} className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <FormField control={supplierInvoiceForm.control} name="supplierId" render={({ field }) => (
                                        <FormItem><FormLabel>اسم المورد</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                            <SelectContent>{suppliers.map((s:any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem> )} />
                                    <FormField control={supplierInvoiceForm.control} name="invoiceDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={supplierInvoiceForm.control} name="dueDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <ScrollArea className="h-[200px] border rounded-md p-2">
                                    {supplierItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                        <FormField control={supplierInvoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                            <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                            <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { supplierInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); supplierInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(supplierInvoiceForm, index); }} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={supplierInvoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(supplierInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={supplierInvoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(supplierInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={supplierInvoiceForm.control} name={`items.${index}.total`} render={({ field }) => (
                                            <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                            <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSupplierItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                    </div> ))}
                                </ScrollArea>
                                 <Button type="button" variant="outline" onClick={() => appendSupplierItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>

                                <DialogFooter>
                                    <Button type="submit">{supplierInvoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>المبلغ المدفوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.id}</TableCell>
                        <TableCell>{suppliers.find((s:any) => s.id === invoice.supplierId)?.name}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.totalAmount) }}></TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.paidAmount) }}></TableCell>
                        <TableCell><Badge variant={invoice.status === 'مدفوع' ? 'default' : 'destructive'}>{invoice.status}</Badge></TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => alert(`Printing ${invoice.id}`)}><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {setSupplierInvoiceToEdit(invoice); setShowManageSupplierInvoiceDialog(true);}}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setInvoiceToPay(invoice); setShowRecordPaymentDialog(true); }}><DollarSign className="h-4 w-4 text-green-600" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                 <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف الفاتورة رقم "{invoice.id}"؟</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteInvoice('supplier', invoice.id)}>تأكيد الحذف</AlertDialogAction>
                                  </AlertDialogFooter>
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
        </TabsContent>
      </Tabs>
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                  <DialogTitle>تسجيل دفعة لفاتورة مورد</DialogTitle>
                  <DialogDescriptionComponent>
                      فاتورة رقم: {invoiceToPay?.id} | المبلغ الإجمالي: {formatCurrency(invoiceToPay?.totalAmount || 0)} | المدفوع: {formatCurrency(invoiceToPay?.paidAmount || 0)}
                  </DialogDescriptionComponent>
              </DialogHeader>
              <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(handleRecordPaymentSubmit)} className="space-y-4 py-4">
                      <FormField control={paymentForm.control} name="paymentAmount" render={({ field }) => (
                          <FormItem><FormLabel>مبلغ الدفعة</FormLabel>
                          <FormControl><Input type="number" {...field} className="bg-background" /></FormControl>
                          <FormMessage /></FormItem>
                      )} />
                      <DialogFooter>
                          <Button type="submit">تسجيل الدفعة</Button>
                          <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    

    
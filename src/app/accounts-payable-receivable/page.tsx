
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Search, Filter, Users, Briefcase, TrendingUp, TrendingDown, FileWarning, Mail, MinusCircle, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';


// Mock data initial state
const initialCustomerInvoicesData = [
  { id: "INV-C001", customerId: "CUST001", date: new Date("2024-07-01"), dueDate: new Date("2024-07-31"), totalAmount: 15000, paidAmount: 10000, remainingAmount: 5000, status: "جزئي" as const, notes: "دفعة مقدمة لخدمات استشارية", items: [{itemId: 'SERV001', description: 'خدمة استشارية A', quantity: 1, unitPrice: 15000, total: 15000}] },
  { id: "INV-C002", customerId: "CUST002", date: new Date("2024-06-15"), dueDate: new Date("2024-07-15"), totalAmount: 8200, paidAmount: 8200, remainingAmount: 0, status: "مدفوع" as const, notes: "", items: [{itemId: 'ITEM001', description: 'لابتوب', quantity:1, unitPrice: 8200, total: 8200}] },
  { id: "INV-C003", customerId: "CUST003", date: new Date("2024-07-10"), dueDate: new Date("2024-08-10"), totalAmount: 22500, paidAmount: 0, remainingAmount: 22500, status: "غير مدفوع" as const, notes: "", items: [{itemId: 'ITEM002', description: 'طابعة', quantity:3, unitPrice: 7500, total: 22500}] },
  { id: "INV-C004", customerId: "CUST004", date: new Date("2024-05-20"), dueDate: new Date("2024-06-20"), totalAmount: 12000, paidAmount: 0, remainingAmount: 12000, status: "متأخر" as const, notes: "", items: [{itemId: 'SERV001', description: 'خدمة استشارية B', quantity:1, unitPrice: 12000, total: 12000}] },
];

const initialSupplierInvoicesData = [
  { id: "INV-S001", supplierId: "SUP001", date: new Date("2024-07-05"), dueDate: new Date("2024-08-05"), totalAmount: 30000, paidAmount: 15000, remainingAmount: 15000, status: "جزئي" as const, notes: "", items: [{itemId: 'ITEM001', description: 'لابتوبات', quantity:4, unitPrice: 7500, total: 30000}] },
  { id: "INV-S002", supplierId: "SUP002", date: new Date("2024-06-20"), dueDate: new Date("2024-07-20"), totalAmount: 7500, paidAmount: 7500, remainingAmount: 0, status: "مدفوع" as const, notes: "", items: [] },
  { id: "INV-S003", supplierId: "SUP003", date: new Date("2024-07-12"), dueDate: new Date("2024-08-12"), totalAmount: 18000, paidAmount: 0, remainingAmount: 18000, status: "غير مدفوع" as const, notes: "", items: [] },
];

const agingReportData = {
  receivables: [
    { range: "0-30 يوم", amount: 25000, percent: 40 },
    { range: "31-60 يوم", amount: 15000, percent: 25 },
    { range: "61-90 يوم", amount: 10000, percent: 15 },
    { range: ">90 يوم", amount: 12500, percent: 20 },
  ],
  payables: [
    { range: "0-30 يوم", amount: 20000, percent: 50 },
    { range: "31-60 يوم", amount: 12000, percent: 30 },
    { range: "61-90 يوم", amount: 5000, percent: 12.5 },
    { range: ">90 يوم", amount: 3000, percent: 7.5 },
  ],
};

const mockCustomers = [
    {id: "CUST001", name: "شركة الأمل"}, {id: "CUST002", name: "مؤسسة النجاح"},
    {id: "CUST003", name: "شركة التطور"}, {id: "CUST004", name: "مؤسسة الإبداع"},
];
const mockSuppliers = [
    {id: "SUP001", name: "مورد التقنية الحديثة"}, {id: "SUP002", name: "مورد الخدمات اللوجستية"},
    {id: "SUP003", name: "مورد المواد الخام"},
];
const mockItems = [
    {id: "ITEM001", name: "لابتوب Dell XPS 15", price: 6500}, {id: "SERV001", name: "خدمة استشارية A", price: 15000},
    {id: "ITEM002", name: "طابعة HP LaserJet", price: 1200},
];

// Schemas
const invoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const baseInvoiceSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  totalAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  remainingAmount: z.coerce.number().default(0),
});

const customerInvoiceSchema = baseInvoiceSchema.extend({
  customerId: z.string().min(1, "العميل مطلوب"),
  status: z.enum(["جزئي", "مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
});
type CustomerInvoiceFormValues = z.infer<typeof customerInvoiceSchema>;

const supplierInvoiceSchema = baseInvoiceSchema.extend({
  supplierId: z.string().min(1, "المورد مطلوب"),
  status: z.enum(["جزئي", "مدفوع", "غير مدفوع"]).default("غير مدفوع"),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

const paymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, "مبلغ الدفع يجب أن يكون أكبر من صفر."),
  paymentDate: z.date({ required_error: "تاريخ الدفع مطلوب." }),
  paymentMethod: z.enum(["نقدي", "بنكي", "شيك"], { required_error: "طريقة الدفع مطلوبة." }),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

type AnyInvoice = CustomerInvoiceFormValues | SupplierInvoiceFormValues;


export default function AccountsPayableReceivablePage() {
  const [customerInvoices, setCustomerInvoices] = useState(initialCustomerInvoicesData);
  const [supplierInvoices, setSupplierInvoices] = useState(initialSupplierInvoicesData);

  const [showAddCustomerInvoiceDialog, setShowAddCustomerInvoiceDialog] = useState(false);
  const [customerInvoiceToEdit, setCustomerInvoiceToEdit] = useState<CustomerInvoiceFormValues | null>(null);
  
  const [showAddSupplierInvoiceDialog, setShowAddSupplierInvoiceDialog] = useState(false);
  const [supplierInvoiceToEdit, setSupplierInvoiceToEdit] = useState<SupplierInvoiceFormValues | null>(null);

  const [showViewInvoiceDialog, setShowViewInvoiceDialog] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null); 

  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<AnyInvoice | null>(null);
  const [invoiceTypeForPayment, setInvoiceTypeForPayment] = useState<'customer' | 'supplier' | null>(null);


  const customerInvoiceForm = useForm<CustomerInvoiceFormValues>({
    resolver: zodResolver(customerInvoiceSchema),
    defaultValues: { customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 },
  });
  const { fields: custInvoiceItemsFields, append: appendCustInvoiceItem, remove: removeCustInvoiceItem } = useFieldArray({
    control: customerInvoiceForm.control, name: "items",
  });

  const supplierInvoiceForm = useForm<SupplierInvoiceFormValues>({
    resolver: zodResolver(supplierInvoiceSchema),
    defaultValues: { supplierId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 },
  });
  const { fields: suppInvoiceItemsFields, append: appendSuppInvoiceItem, remove: removeSuppInvoiceItem } = useFieldArray({
    control: supplierInvoiceForm.control, name: "items",
  });
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentDate: new Date(), paymentMethod: "نقدي" },
  });

  useEffect(() => {
    if (customerInvoiceToEdit) customerInvoiceForm.reset(customerInvoiceToEdit);
    else customerInvoiceForm.reset({ customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 });
  }, [customerInvoiceToEdit, customerInvoiceForm, showAddCustomerInvoiceDialog]);
  
  useEffect(() => {
    if (supplierInvoiceToEdit) supplierInvoiceForm.reset(supplierInvoiceToEdit);
    else supplierInvoiceForm.reset({ supplierId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 });
  }, [supplierInvoiceToEdit, supplierInvoiceForm, showAddSupplierInvoiceDialog]);

  const calculateInvoiceTotals = (items: any[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    return totalAmount;
  };

  const updateInvoiceStatus = (invoice: AnyInvoice): AnyInvoice['status'] => {
    if (invoice.paidAmount >= invoice.totalAmount) return "مدفوع";
    if (invoice.paidAmount > 0) return "جزئي";
    if ('dueDate' in invoice && invoice.dueDate && invoice.dueDate < new Date() && invoice.paidAmount === 0) return "متأخر";
    return "غير مدفوع";
  };

  const handleCustomerInvoiceSubmit = (values: CustomerInvoiceFormValues) => {
    const totalAmount = calculateInvoiceTotals(values.items);
    const remainingAmount = totalAmount - (values.paidAmount || 0);
    const status = updateInvoiceStatus({...values, totalAmount, remainingAmount});
    const finalValues = {...values, totalAmount, remainingAmount, status};

    if (customerInvoiceToEdit) {
      setCustomerInvoices(prev => prev.map(inv => inv.id === customerInvoiceToEdit.id ? { ...finalValues, id: customerInvoiceToEdit.id } : inv));
    } else {
      setCustomerInvoices(prev => [...prev, { ...finalValues, id: `INV-C${Date.now()}` }]);
    }
    setShowAddCustomerInvoiceDialog(false);
    setCustomerInvoiceToEdit(null);
  };

  const handleSupplierInvoiceSubmit = (values: SupplierInvoiceFormValues) => {
    const totalAmount = calculateInvoiceTotals(values.items);
    const remainingAmount = totalAmount - (values.paidAmount || 0);
    const status = updateInvoiceStatus({...values, totalAmount, remainingAmount});
    const finalValues = {...values, totalAmount, remainingAmount, status};
    
    if (supplierInvoiceToEdit) {
      setSupplierInvoices(prev => prev.map(inv => inv.id === supplierInvoiceToEdit.id ? { ...finalValues, id: supplierInvoiceToEdit.id } : inv));
    } else {
      setSupplierInvoices(prev => [...prev, { ...finalValues, id: `INV-S${Date.now()}` }]);
    }
    setShowAddSupplierInvoiceDialog(false);
    setSupplierInvoiceToEdit(null);
  };
  
  const handleViewInvoice = (invoice: any, type: 'customer' | 'supplier') => {
    setSelectedInvoiceForView({...invoice, type, customer: mockCustomers.find(c=>c.id === invoice.customerId)?.name, supplier: mockSuppliers.find(s=>s.id === invoice.supplierId)?.name});
    setShowViewInvoiceDialog(true);
  }

  const calculateItemTotal = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };
  
  const handleDeleteInvoice = (invoiceId: string, type: 'customer' | 'supplier') => {
    if (type === 'customer') {
      setCustomerInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } else {
      setSupplierInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    }
  }

  const openRecordPaymentDialog = (invoice: AnyInvoice, type: 'customer' | 'supplier') => {
    setInvoiceToPay(invoice);
    setInvoiceTypeForPayment(type);
    paymentForm.reset({ paymentDate: new Date(), paymentMethod: "نقدي", paymentAmount: invoice.remainingAmount });
    setShowRecordPaymentDialog(true);
  };

  const handleRecordPaymentSubmit = (paymentValues: PaymentFormValues) => {
    if (!invoiceToPay || !invoiceTypeForPayment) return;

    const newPaidAmount = invoiceToPay.paidAmount + paymentValues.paymentAmount;
    const newRemainingAmount = Math.max(0, invoiceToPay.totalAmount - newPaidAmount);
    
    const updatedInvoiceBase = {
        ...invoiceToPay,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
    };
    const newStatus = updateInvoiceStatus(updatedInvoiceBase);

    const updatedInvoice = { ...updatedInvoiceBase, status: newStatus };

    if (invoiceTypeForPayment === 'customer') {
        setCustomerInvoices(prev => prev.map(inv => inv.id === invoiceToPay.id ? updatedInvoice as CustomerInvoiceFormValues : inv));
    } else {
        setSupplierInvoices(prev => prev.map(inv => inv.id === invoiceToPay.id ? updatedInvoice as SupplierInvoiceFormValues : inv));
    }
    setShowRecordPaymentDialog(false);
    setInvoiceToPay(null);
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات المدينة والدائنة</h1>
        <div className="flex gap-2">
          <Dialog open={showAddCustomerInvoiceDialog} onOpenChange={(isOpen) => { setShowAddCustomerInvoiceDialog(isOpen); if(!isOpen) setCustomerInvoiceToEdit(null);}}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setCustomerInvoiceToEdit(null); customerInvoiceForm.reset(); setShowAddCustomerInvoiceDialog(true);}}>
                <PlusCircle className="me-2 h-4 w-4" /> إضافة فاتورة عميل
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>{customerInvoiceToEdit ? 'تعديل فاتورة عميل' : 'إضافة فاتورة عميل جديدة'}</DialogTitle>
              </DialogHeader>
              <Form {...customerInvoiceForm}>
                <form onSubmit={customerInvoiceForm.handleSubmit(handleCustomerInvoiceSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={customerInvoiceForm.control} name="customerId" render={({ field }) => (
                        <FormItem><FormLabel>اسم العميل</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                            <SelectContent>{mockCustomers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem> )} />
                    <FormField control={customerInvoiceForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    <FormField control={customerInvoiceForm.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                  </div>
                   <ScrollArea className="h-[200px] border rounded-md p-2">
                        {custInvoiceItemsFields.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                            <FormField control={customerInvoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { customerInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); customerInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotal(customerInvoiceForm, index); }} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={customerInvoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotal(customerInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={customerInvoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotal(customerInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={customerInvoiceForm.control} name={`items.${index}.total`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeCustInvoiceItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                        </div> ))}
                    </ScrollArea>
                    <Button type="button" variant="outline" onClick={() => appendCustInvoiceItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                    <FormField control={customerInvoiceForm.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>ملاحظات</FormLabel>
                          <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter>
                    <Button type="submit">{customerInvoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddSupplierInvoiceDialog} onOpenChange={(isOpen) => { setShowAddSupplierInvoiceDialog(isOpen); if(!isOpen) setSupplierInvoiceToEdit(null);}}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSupplierInvoiceToEdit(null); supplierInvoiceForm.reset(); setShowAddSupplierInvoiceDialog(true);}}>
                <PlusCircle className="me-2 h-4 w-4" /> إضافة فاتورة مورد
              </Button>
            </DialogTrigger>
             <DialogContent className="sm:max-w-xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>{supplierInvoiceToEdit ? 'تعديل فاتورة مورد' : 'إضافة فاتورة مورد جديدة'}</DialogTitle>
              </DialogHeader>
              <Form {...supplierInvoiceForm}>
                <form onSubmit={supplierInvoiceForm.handleSubmit(handleSupplierInvoiceSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={supplierInvoiceForm.control} name="supplierId" render={({ field }) => (
                        <FormItem><FormLabel>اسم المورد</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                            <SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem> )} />
                     <FormField control={supplierInvoiceForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    <FormField control={supplierInvoiceForm.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                  </div>
                  <ScrollArea className="h-[200px] border rounded-md p-2">
                        {suppInvoiceItemsFields.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                            <FormField control={supplierInvoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { supplierInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); supplierInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotal(supplierInvoiceForm, index); }} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={supplierInvoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotal(supplierInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={supplierInvoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotal(supplierInvoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <FormField control={supplierInvoiceForm.control} name={`items.${index}.total`} render={({ field }) => (
                                <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                <FormMessage className="text-xs"/></FormItem> )} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSuppInvoiceItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                        </div> ))}
                    </ScrollArea>
                    <Button type="button" variant="outline" onClick={() => appendSuppInvoiceItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                     <FormField control={supplierInvoiceForm.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>ملاحظات</FormLabel>
                          <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter>
                    <Button type="submit">{supplierInvoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="receivables" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="receivables" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> الذمم المدينة (العملاء)
          </TabsTrigger>
          <TabsTrigger value="payables" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Briefcase className="inline-block me-2 h-4 w-4" /> الذمم الدائنة (الموردين)
          </TabsTrigger>
          <TabsTrigger value="agingReport" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileWarning className="inline-block me-2 h-4 w-4" /> أعمار الذمم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير العملاء</CardTitle>
              <CardDescription>متابعة فواتير العملاء، الذمم المستحقة، وحدود الائتمان.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في فواتير العملاء..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>جزئي</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>غير مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>متأخر</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead><TableHead>العميل</TableHead><TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead><TableHead>المبلغ الإجمالي</TableHead><TableHead>المدفوع</TableHead>
                      <TableHead>المتبقي</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{mockCustomers.find(c=>c.id === invoice.customerId)?.name}</TableCell>
                        <TableCell>{invoice.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{invoice.dueDate.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{invoice.totalAmount.toFixed(2)} SAR</TableCell>
                        <TableCell>{invoice.paidAmount.toFixed(2)} SAR</TableCell>
                        <TableCell className="font-semibold">{invoice.remainingAmount.toFixed(2)} SAR</TableCell>
                        <TableCell>
                          <Badge variant={ invoice.status === "مدفوع" ? "default" : invoice.status === "جزئي" ? "secondary" : invoice.status === "متأخر" ? "destructive" : "outline" } className="whitespace-nowrap">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'customer')}><FileText className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة" onClick={() => openRecordPaymentDialog(invoice, 'customer')}><Banknote className="h-4 w-4 text-green-600" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال كشف حساب" onClick={() => alert(`إرسال كشف حساب للعميل: ${invoice.customerId}`)}><Mail className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setCustomerInvoiceToEdit(invoice); setShowAddCustomerInvoiceDialog(true);}}><Edit className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && invoice.paidAmount === 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف الفاتورة "{invoice.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id, 'customer')}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير الموردين</CardTitle>
              <CardDescription>متابعة فواتير الموردين والذمم المستحقة لهم.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في فواتير الموردين..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                 <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>جزئي</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>غير مدفوع</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead><TableHead>المبلغ الإجمالي</TableHead><TableHead>المدفوع</TableHead>
                      <TableHead>المتبقي</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{mockSuppliers.find(s=>s.id === invoice.supplierId)?.name}</TableCell>
                        <TableCell>{invoice.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{invoice.dueDate.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{invoice.totalAmount.toFixed(2)} SAR</TableCell>
                        <TableCell>{invoice.paidAmount.toFixed(2)} SAR</TableCell>
                        <TableCell className="font-semibold">{invoice.remainingAmount.toFixed(2)} SAR</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "مدفوع" ? "default" : invoice.status === "جزئي" ? "secondary" : "outline"} className="whitespace-nowrap">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'supplier')}><FileText className="h-4 w-4" /></Button>
                           {invoice.status !== "مدفوع" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة" onClick={() => openRecordPaymentDialog(invoice, 'supplier')}><Banknote className="h-4 w-4 text-green-600" /></Button>
                           )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setSupplierInvoiceToEdit(invoice); setShowAddSupplierInvoiceDialog(true);}}><Edit className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && invoice.paidAmount === 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف الفاتورة "{invoice.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id, 'supplier')}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agingReport">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><TrendingUp className="me-2 h-6 w-6 text-primary" /> أعمار الذمم المدينة (العملاء)</CardTitle>
                <CardDescription>تحليل لأعمار المبالغ المستحقة من العملاء.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agingReportData.receivables.map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                      <span className="font-semibold">{item.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })} ({item.percent}%)</span>
                    </div>
                    <Progress value={item.percent} aria-label={`${item.percent}% للعملاء في نطاق ${item.range}`} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center"><TrendingDown className="me-2 h-6 w-6 text-destructive" /> أعمار الذمم الدائنة (الموردين)</CardTitle>
                <CardDescription>تحليل لأعمار المبالغ المستحقة للموردين.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agingReportData.payables.map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                       <span className="font-semibold">{item.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })} ({item.percent}%)</span>
                    </div>
                    <Progress value={item.percent} aria-label={`${item.percent}% للموردين في نطاق ${item.range}`} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for Viewing Invoice */}
       <Dialog open={showViewInvoiceDialog} onOpenChange={setShowViewInvoiceDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الفاتورة: {selectedInvoiceForView?.id} ({selectedInvoiceForView?.type === 'customer' ? 'عميل' : 'مورد'})</DialogTitle>
          </DialogHeader>
          {selectedInvoiceForView && (
            <div className="py-4 space-y-2">
              <p><strong>{selectedInvoiceForView.type === 'customer' ? 'العميل' : 'المورد'}:</strong> {selectedInvoiceForView.type === 'customer' ? selectedInvoiceForView.customer : selectedInvoiceForView.supplier}</p>
              <p><strong>تاريخ الفاتورة:</strong> {selectedInvoiceForView.date?.toLocaleDateString('ar-SA')}</p>
              <p><strong>تاريخ الاستحقاق:</strong> {selectedInvoiceForView.dueDate?.toLocaleDateString('ar-SA')}</p>
              <p><strong>المبلغ الإجمالي:</strong> {selectedInvoiceForView.totalAmount?.toFixed(2)} SAR</p>
              <p><strong>المبلغ المدفوع:</strong> {selectedInvoiceForView.paidAmount?.toFixed(2)} SAR</p>
              <p><strong>المبلغ المتبقي:</strong> {selectedInvoiceForView.remainingAmount?.toFixed(2)} SAR</p>
              <p><strong>الحالة:</strong> <Badge variant={selectedInvoiceForView.status === "مدفوع" ? "default" : selectedInvoiceForView.status === "جزئي" ? "secondary" : selectedInvoiceForView.status === "متأخر" ? "destructive" : "outline"}>{selectedInvoiceForView.status}</Badge></p>
              <p><strong>ملاحظات:</strong> {selectedInvoiceForView.notes || 'لا يوجد'}</p>
               <h4 className="font-semibold pt-2 border-t mt-3">الأصناف:</h4>
                {selectedInvoiceForView.items && selectedInvoiceForView.items.length > 0 ? (
                    <Table size="sm">
                        <TableHeader>
                            <TableRow><TableHead>الصنف</TableHead><TableHead>الكمية</TableHead><TableHead>السعر</TableHead><TableHead>الإجمالي</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedInvoiceForView.items.map((it: any, idx: number) => (
                                <TableRow key={idx}>
                                    <TableCell>{mockItems.find(i => i.id === it.itemId)?.name || it.description || it.itemId}</TableCell>
                                    <TableCell>{it.quantity}</TableCell>
                                    <TableCell>{it.unitPrice.toFixed(2)}</TableCell>
                                    <TableCell>{it.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground">لا توجد أصناف في هذه الفاتورة.</p>}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Recording Payment */}
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة لـ {invoiceTypeForPayment === 'customer' ? 'فاتورة عميل' : 'فاتورة مورد'} رقم: {invoiceToPay?.id}</DialogTitle>
            <DialogDescription>الفاتورة بمبلغ إجمالي {invoiceToPay?.totalAmount.toFixed(2)} SAR، متبقي منها {invoiceToPay?.remainingAmount.toFixed(2)} SAR.</DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleRecordPaymentSubmit)} className="space-y-4 py-4">
              <FormField control={paymentForm.control} name="paymentAmount" render={({ field }) => (
                <FormItem><FormLabel>مبلغ الدفعة</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-background" max={invoiceToPay?.remainingAmount} /></FormControl>
                  <FormMessage /></FormItem>)} />
              <FormField control={paymentForm.control} name="paymentDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>تاريخ الدفعة</FormLabel>
                  <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
              <FormField control={paymentForm.control} name="paymentMethod" render={({ field }) => (
                <FormItem><FormLabel>طريقة الدفع</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر طريقة الدفع" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="نقدي">نقدي</SelectItem><SelectItem value="بنكي">بنكي</SelectItem><SelectItem value="شيك">شيك</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>)} />
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

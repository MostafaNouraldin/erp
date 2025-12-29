
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from '@/hooks/use-currency';


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
  isDeferredPayment: z.boolean().optional().default(false),
});
type CustomerInvoiceFormValues = z.infer<typeof customerInvoiceSchema>;

const supplierInvoiceSchema = baseInvoiceSchema.extend({
  supplierId: z.string().min(1, "المورد مطلوب"),
  status: z.enum(["جزئي", "مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
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
    // This component will be updated later to fetch real data.
    // For now, we'll use placeholder empty arrays.
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const { formatCurrency } = useCurrency();

  const [showAddCustomerInvoiceDialog, setShowAddCustomerInvoiceDialog] = useState(false);
  const [customerInvoiceToEdit, setCustomerInvoiceToEdit] = useState<CustomerInvoiceFormValues | null>(null);
  
  const [showAddSupplierInvoiceDialog, setShowAddSupplierInvoiceDialog] = useState(false);
  const [supplierInvoiceToEdit, setSupplierInvoiceToEdit] = useState<SupplierInvoiceFormValues | null>(null);

  const [showViewInvoiceDialog, setShowViewInvoiceDialog] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null); 

  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<AnyInvoice | null>(null);
  const [invoiceTypeForPayment, setInvoiceTypeForPayment] = useState<'customer' | 'supplier' | null>(null);
  
  const agingReportData = {
    receivables: [],
    payables: [],
  };
  const mockItems: any[] = [];


  const customerInvoiceForm = useForm<CustomerInvoiceFormValues>({
    resolver: zodResolver(customerInvoiceSchema),
    defaultValues: { customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0, isDeferredPayment: false },
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

  const handleCustomerInvoiceSubmit = (values: CustomerInvoiceFormValues) => {
    // This will be implemented later with server actions
    console.log("Submitting customer invoice (disabled)", values);
  };

  const handleSupplierInvoiceSubmit = (values: SupplierInvoiceFormValues) => {
     // This will be implemented later with server actions
    console.log("Submitting supplier invoice (disabled)", values);
  };
  
  const handleViewInvoice = (invoice: any, type: 'customer' | 'supplier') => {
    // This will be updated later
  }

  const calculateItemTotal = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };
  
  const handleDeleteInvoice = (invoiceId: string, type: 'customer' | 'supplier') => {
    // This will be implemented later with server actions
  }

  const openRecordPaymentDialog = (invoice: AnyInvoice, type: 'customer' | 'supplier') => {
    // This will be implemented later
  };

  const handleRecordPaymentSubmit = (paymentValues: PaymentFormValues) => {
    // This will be implemented later
  };

  const getCustomerInvoiceStatusText = (invoice: CustomerInvoiceFormValues) => {
    if (invoice.isDeferredPayment) {
        if (invoice.status === "غير مدفوع") return "غير مدفوع (آجل)";
        if (invoice.status === "متأخر") return "متأخر (آجل)";
    }
    return invoice.status;
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات المدينة والدائنة</h1>
        <div className="flex gap-2">
          <Dialog open={showAddCustomerInvoiceDialog} onOpenChange={(isOpen) => { setShowAddCustomerInvoiceDialog(isOpen); if(!isOpen) setCustomerInvoiceToEdit(null);}}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setCustomerInvoiceToEdit(null); customerInvoiceForm.reset(); setShowAddCustomerInvoiceDialog(true);}} disabled>
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
                            <SelectContent>{customers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                          </Select><FormMessage /></FormItem> )} />
                    <FormField control={customerInvoiceForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    <FormField control={customerInvoiceForm.control} name="dueDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                          <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    <FormField control={customerInvoiceForm.control} name="isDeferredPayment" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm md:col-span-2 rtl:space-x-reverse">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isDeferredPaymentCust"/>
                          </FormControl>
                          <FormLabel htmlFor="isDeferredPaymentCust" className="font-normal">فاتورة بيع آجل</FormLabel>
                        </FormItem>
                        )} />
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
              <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSupplierInvoiceToEdit(null); supplierInvoiceForm.reset(); setShowAddSupplierInvoiceDialog(true);}} disabled>
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
                            <SelectContent>{suppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
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
                      <DropdownMenuCheckboxItem>غير مدفوع (آجل)</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>متأخر</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>متأخر (آجل)</DropdownMenuCheckboxItem>
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
                        <TableCell>{invoice.customer?.name}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.numericTotalAmount) }}></TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(0) }}></TableCell> 
                        <TableCell className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.numericTotalAmount) }}></TableCell>
                        <TableCell>
                          <Badge 
                            variant={ 
                                invoice.status === "مدفوع" ? "default" : 
                                invoice.status === "متأخر" ? "destructive" : 
                                "outline" 
                            } 
                            className="whitespace-nowrap"
                          >
                           {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'customer')} disabled><FileText className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة" onClick={() => openRecordPaymentDialog(invoice, 'customer')} disabled><Banknote className="h-4 w-4 text-green-600" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال كشف حساب" onClick={() => alert(`إرسال كشف حساب للعميل: ${invoice.customerId}`)} disabled><Mail className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setCustomerInvoiceToEdit(invoice); setShowAddCustomerInvoiceDialog(true);}} disabled><Edit className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف" disabled><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescriptionComponent>سيتم حذف الفاتورة "{invoice.id}" نهائياً.</AlertDialogDescriptionComponent></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id!, 'customer')}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
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
                      <DropdownMenuCheckboxItem>مدفوع جزئياً</DropdownMenuCheckboxItem>
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
                        <TableCell>{invoice.supplier?.name}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.totalAmount) }}></TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.paidAmount) }}></TableCell>
                        <TableCell className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.totalAmount - invoice.paidAmount) }}></TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "مدفوع" ? "default" : invoice.status === "مدفوع جزئياً" ? "secondary" : "outline"} className="whitespace-nowrap">
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'supplier')} disabled><FileText className="h-4 w-4" /></Button>
                           {invoice.status !== "مدفوع" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة" onClick={() => openRecordPaymentDialog(invoice, 'supplier')} disabled><Banknote className="h-4 w-4 text-green-600" /></Button>
                           )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setSupplierInvoiceToEdit(invoice); setShowAddSupplierInvoiceDialog(true);}} disabled><Edit className="h-4 w-4" /></Button>
                          {invoice.status !== "مدفوع" && invoice.paidAmount === 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف" disabled><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescriptionComponent>سيتم حذف الفاتورة "{invoice.id}" نهائياً.</AlertDialogDescriptionComponent></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id!, 'supplier')}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
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
                {agingReportData.receivables.map((item: any) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                      <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(item.amount) + ` (${item.percent}%)` }}></span>
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
                {agingReportData.payables.map((item: any) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                       <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(item.amount) + ` (${item.percent}%)` }}></span>
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
              <div><strong>{selectedInvoiceForView.type === 'customer' ? 'العميل' : 'المورد'}:</strong> {selectedInvoiceForView.type === 'customer' ? selectedInvoiceForView.customer : selectedInvoiceForView.supplier}</div>
              <div><strong>تاريخ الفاتورة:</strong> {selectedInvoiceForView.date?.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>تاريخ الاستحقاق:</strong> {selectedInvoiceForView.dueDate?.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div dangerouslySetInnerHTML={{ __html: `<strong>المبلغ الإجمالي:</strong> ${formatCurrency(selectedInvoiceForView.totalAmount)}` }}></div>
              <div dangerouslySetInnerHTML={{ __html: `<strong>المبلغ المدفوع:</strong> ${formatCurrency(selectedInvoiceForView.paidAmount)}` }}></div>
              <div dangerouslySetInnerHTML={{ __html: `<strong>المبلغ المتبقي:</strong> ${formatCurrency(selectedInvoiceForView.remainingAmount)}` }}></div>
              <div className="flex items-center gap-2">
                <strong>الحالة:</strong>{' '}
                <Badge
                    variant={
                        selectedInvoiceForView.status === "مدفوع" ? "default" :
                        selectedInvoiceForView.status === "جزئي" ? "secondary" :
                        (selectedInvoiceForView.status === "متأخر" || (selectedInvoiceForView.isDeferredPayment && selectedInvoiceForView.status !== "مدفوع" ))? "destructive" :
                        "outline"
                    }
                >
                   {selectedInvoiceForView.status}
                </Badge>
              </div>
              {selectedInvoiceForView.type === 'customer' && selectedInvoiceForView.isDeferredPayment && (
                <div className="text-primary font-semibold">ملاحظة: هذه فاتورة بيع آجل.</div>
              )}
              <div><strong>ملاحظات:</strong> {selectedInvoiceForView.notes || 'لا يوجد'}</div>
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
                                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(it.unitPrice) }}></TableCell>
                                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(it.total) }}></TableCell>
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
            <DialogDescription>الفاتورة بمبلغ إجمالي <span dangerouslySetInnerHTML={{ __html: formatCurrency(invoiceToPay?.totalAmount || 0) }}></span>، متبقي منها <span dangerouslySetInnerHTML={{ __html: formatCurrency(invoiceToPay?.remainingAmount || 0) }}></span>.</DialogDescription>
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

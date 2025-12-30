
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { ShoppingCart, FileSignature, FilePlus, UsersIcon, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Send, Printer, MinusCircle, Tag, Eye } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { addCustomer, updateCustomer, deleteCustomer, addSalesInvoice, updateSalesInvoice, deleteSalesInvoice } from './actions';

// Mock data
const initialQuotationsData = [
  { id: "QT001", customerId: "CUST001", date: new Date("2024-07-01"), expiryDate: new Date("2024-07-15"), numericTotalAmount: 15500, status: "مرسل" as const, items: [{itemId: "ITEM001", description: "لابتوب", quantity:1, unitPrice:15500, total:15500}] },
  { id: "QT002", customerId: "CUST002", date: new Date("2024-07-05"), expiryDate: new Date("2024-07-20"), numericTotalAmount: 8200, status: "مقبول" as const, items: [] },
  { id: "QT003", customerId: "CUST003", date: new Date("2024-07-10"), expiryDate: new Date("2024-07-25"), numericTotalAmount: 22000, status: "مسودة" as const, items: [] },
];

export interface SalesOrderItem {
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
export interface SalesOrder {
  id: string;
  quoteId?: string;
  customerId: string;
  date: Date;
  deliveryDate: Date;
  numericTotalAmount: number;
  status: "مؤكد" | "قيد التنفيذ" | "ملغي" | "مكتمل";
  items: SalesOrderItem[];
  notes?: string;
}

const initialSalesOrdersData: SalesOrder[] = [
  { id: "SO001", quoteId: "QT002", customerId: "CUST002", date: new Date("2024-07-06"), deliveryDate: new Date("2024-07-20"), numericTotalAmount: 8200, status: "قيد التنفيذ" as const, items: [{itemId: "SERV001", description: "خدمة استشارية", quantity: 1, unitPrice: 8200, total: 8200}] },
  { id: "SO002", customerId: "CUST004", date: new Date("2024-07-12"), deliveryDate: new Date("2024-07-28"), numericTotalAmount: 12000, status: "مؤكد" as const, items: [{itemId: "ITEM001", description: "لابتوب", quantity: 1, unitPrice: 12000, total: 12000}], notes: "تسليم عاجل" },
];

export interface InvoiceItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number; 
  total: number;    
}
export interface Invoice {
  id: string;
  orderId?: string | null;
  customerId: string;
  date: Date;
  dueDate: Date;
  numericTotalAmount: number; 
  status: "مدفوع" | "غير مدفوع" | "متأخر";
  items: InvoiceItem[];
  notes?: string | null;
  isDeferredPayment?: boolean | null;
  source?: "POS" | "Manual" | null;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
  balance: number; // Changed from string to number
  address?: string | null;
  vatNumber?: string | null;
}

const mockItems = [
    {id: "ITEM001", name: "لابتوب Dell XPS 15", price: 6500}, {id: "SERV001", name: "خدمة استشارية A", price: 15000},
    {id: "ITEM002", name: "طابعة HP LaserJet", price: 1200},
];

interface PrintableInvoice extends Invoice {
    customerName: string;
    customerAddress?: string | null;
    customerVatNumber?: string | null;
    subTotalForPrint: number;
    vatAmountForPrint: number;
}

interface StatementEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

const quotationItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const quotationSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ العرض مطلوب" }),
  expiryDate: z.date({ required_error: "تاريخ انتهاء العرض مطلوب" }),
  items: z.array(quotationItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "مرسل", "مقبول", "مرفوض", "منتهي الصلاحية"]).default("مسودة"),
});
type QuotationFormValues = z.infer<typeof quotationSchema>;


const salesOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const salesOrderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الأمر مطلوب" }),
  deliveryDate: z.date({ required_error: "تاريخ التسليم المتوقع مطلوب" }),
  items: z.array(salesOrderItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مؤكد", "قيد التنفيذ", "ملغي", "مكتمل"]).default("مؤكد"),
  quoteId: z.string().optional(),
});
type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;


const invoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(invoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
  orderId: z.string().optional(),
  isDeferredPayment: z.boolean().optional().default(false),
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
});
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  balance: z.coerce.number().default(0),
});
type CustomerFormValues = z.infer<typeof customerSchema>;


// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 })} لا غير`;
};

interface SalesClientComponentProps {
  initialData: {
    customers: Customer[];
    invoices: Invoice[];
  };
}

export default function SalesClientComponent({ initialData }: SalesClientComponentProps) {
  const [quotations, setQuotationsData] = useState<QuotationFormValues[]>(initialQuotationsData);
  const [invoices, setInvoicesData] = useState<Invoice[]>(initialData.invoices);
  const [salesOrders, setSalesOrdersData] = useState<SalesOrder[]>(initialSalesOrdersData);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  
  const [showPrintInvoiceDialog, setShowPrintInvoiceDialog] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<PrintableInvoice | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [showCreateQuotationDialog, setShowCreateQuotationDialog] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<QuotationFormValues | null>(null);
  
  const [showCreateSalesOrderDialog, setShowCreateSalesOrderDialog] = useState(false);
  const [salesOrderToEdit, setSalesOrderToEdit] = useState<SalesOrderFormValues | null>(null);

  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceFormValues | null>(null);

  const [showCustomerDetailsDialog, setShowCustomerDetailsDialog] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [customerInvoicesForDetails, setCustomerInvoicesForDetails] = useState<Invoice[]>([]);
  const [customerStatement, setCustomerStatement] = useState<StatementEntry[]>([]);
  
  const [showManageCustomerDialog, setShowManageCustomerDialog] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerFormValues | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const handleAddInvoice = (event: Event) => {
        const customEvent = event as CustomEvent<Invoice>;
        const newInvoice = customEvent.detail;
        setInvoicesData(prev => [newInvoice, ...prev]);
        toast({
            title: "فاتورة جديدة من نقاط البيع",
            description: `تم استلام الفاتورة رقم ${newInvoice.id}.`,
        });
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('addExternalSalesInvoice', handleAddInvoice);
    }

    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('addExternalSalesInvoice', handleAddInvoice);
        }
    };
}, [toast]);


  useEffect(() => {
    setCustomers(initialData.customers);
    setInvoicesData(initialData.invoices);
  }, [initialData]);

  const quotationForm = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { customerId: '', date: new Date(), expiryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة", numericTotalAmount: 0 },
  });
  const { fields: quotationItemsFields, append: appendQuotationItem, remove: removeQuotationItem } = useFieldArray({
    control: quotationForm.control, name: "items",
  });

  const salesOrderForm = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { customerId: '', date: new Date(), deliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مؤكد", numericTotalAmount: 0 },
  });
  const { fields: salesOrderItemsFields, append: appendSalesOrderItem, remove: removeSalesOrderItem } = useFieldArray({
    control: salesOrderForm.control, name: "items",
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual" },
  });
  const { fields: invoiceItemsFields, append: appendInvoiceItem, remove: removeInvoiceItem } = useFieldArray({
    control: invoiceForm.control, name: "items",
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", type: "فرد", balance: 0, address: "", vatNumber: ""},
  });


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (quotationToEdit) quotationForm.reset(quotationToEdit);
    else quotationForm.reset({ customerId: '', date: new Date(), expiryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة", numericTotalAmount: 0 });
  }, [quotationToEdit, quotationForm, showCreateQuotationDialog]);

  useEffect(() => {
    if (salesOrderToEdit) salesOrderForm.reset(salesOrderToEdit);
    else salesOrderForm.reset({ customerId: '', date: new Date(), deliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مؤكد", numericTotalAmount: 0 });
  }, [salesOrderToEdit, salesOrderForm, showCreateSalesOrderDialog]);

  useEffect(() => {
    if (invoiceToEdit) invoiceForm.reset(invoiceToEdit);
    else invoiceForm.reset({ customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual" });
  }, [invoiceToEdit, invoiceForm, showCreateInvoiceDialog]);

  useEffect(() => {
    if (customerToEdit) {
      customerForm.reset(customerToEdit);
    } else {
      customerForm.reset({ name: "", email: "", phone: "", type: "فرد", balance: 0, address: "", vatNumber: "" });
    }
  }, [customerToEdit, customerForm, showManageCustomerDialog]);


  const handlePrintInvoice = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const subTotal = invoice.numericTotalAmount / 1.15; 
    const vatAmount = invoice.numericTotalAmount - subTotal;

    setSelectedInvoiceForPrint({
        ...invoice,
        customerName: customer?.name || (invoice.customerId === "__cash_customer__" ? "عميل نقدي" : "عميل غير محدد"),
        customerAddress: customer?.address,
        customerVatNumber: customer?.vatNumber,
        subTotalForPrint: subTotal,
        vatAmountForPrint: vatAmount,
    });
    setShowPrintInvoiceDialog(true);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!isClient || !date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' }).format(d);
  };

  const calculateItemTotals = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };
  
  const calculateItemTotalForForm = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };

  const handleCustomerSubmit = async (values: CustomerFormValues) => {
    try {
      if (customerToEdit) {
        await updateCustomer({ ...values, id: customerToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل بيانات العميل." });
      } else {
        await addCustomer(values);
        toast({ title: "تمت الإضافة", description: "تمت إضافة العميل بنجاح." });
      }
      setShowManageCustomerDialog(false);
      setCustomerToEdit(null);
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم حفظ بيانات العميل.", variant: "destructive" });
    }
  };


  const handleQuotationSubmit = (values: QuotationFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};

    if (quotationToEdit) {
      setQuotationsData(prev => prev.map(q => q.id === quotationToEdit.id ? { ...finalValues, id: quotationToEdit.id! } : q));
      toast({ title: "تم التعديل", description: "تم تعديل عرض السعر بنجاح." });
    } else {
      setQuotationsData(prev => [...prev, { ...finalValues, id: `QT${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء عرض السعر بنجاح." });
    }
    setShowCreateQuotationDialog(false);
    setQuotationToEdit(null);
  };

  const handleSalesOrderSubmit = (values: SalesOrderFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};

    if (salesOrderToEdit) {
      setSalesOrdersData(prev => prev.map(so => so.id === salesOrderToEdit.id ? { ...finalValues, id: salesOrderToEdit.id! } : so));
      toast({ title: "تم التعديل", description: "تم تعديل أمر البيع بنجاح." });
    } else {
      setSalesOrdersData(prev => [...prev, { ...finalValues, id: `SO${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء أمر البيع بنجاح." });
    }
    setShowCreateSalesOrderDialog(false);
    setSalesOrderToEdit(null);
  };

  const handleInvoiceSubmit = async (values: InvoiceFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};

    try {
        if (invoiceToEdit) {
            await updateSalesInvoice({ ...finalValues, id: invoiceToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل الفاتورة بنجاح." });
        } else {
            await addSalesInvoice(finalValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء الفاتورة بنجاح." });
        }
        setShowCreateInvoiceDialog(false);
        setInvoiceToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ الفاتورة.", variant: "destructive" });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
        await deleteSalesInvoice(invoiceId);
        toast({ title: "تم الحذف", description: "تم حذف الفاتورة بنجاح.", variant: "destructive" });
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حذف الفاتورة.", variant: "destructive" });
    }
  };

  const getInvoiceStatusText = (invoice: Invoice) => {
    if (invoice.isDeferredPayment) {
      if (invoice.status === "غير مدفوع") return "غير مدفوع (آجل)";
      if (invoice.status === "متأخر") return "متأخر (آجل)";
    }
    return invoice.status;
  };
  
  const generateCustomerStatement = (customer: Customer, allInvoices: Invoice[]): StatementEntry[] => {
    const statement: StatementEntry[] = [];
    let runningBalance = 0; // Start with a zero balance for the statement period
  
    const customerInvoices = allInvoices.filter(inv => inv.customerId === customer.id);
  
    const transactions: Array<{ date: Date, description: string, debit: number, credit: number }> = [];
  
    customerInvoices.forEach(invoice => {
      transactions.push({
        date: new Date(invoice.date),
        description: `فاتورة رقم: ${invoice.id}`,
        debit: invoice.numericTotalAmount,
        credit: 0,
      });
      if (invoice.status === "مدفوع") {
        transactions.push({
          date: new Date(invoice.dueDate), // Or invoice.date, or a separate payment date if available
          description: `سداد فاتورة رقم: ${invoice.id}`,
          debit: 0,
          credit: invoice.numericTotalAmount,
        });
      }
    });
  
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
    transactions.forEach(transaction => {
      runningBalance += transaction.debit;
      runningBalance -= transaction.credit;
      statement.push({
        date: transaction.date.toLocaleDateString('ar-SA', { calendar: 'gregory' }),
        description: transaction.description,
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
      });
    });
  
    return statement;
  };


  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomerForDetails(customer);
    const relatedInvoices = invoices.filter(inv => inv.customerId === customer.id);
    setCustomerInvoicesForDetails(relatedInvoices);
    setCustomerStatement(generateCustomerStatement(customer, relatedInvoices));
    setShowCustomerDetailsDialog(true);
  };

  const handlePrintCustomerStatement = () => {
    // Logic to trigger print for the customer statement
    // This will likely involve using window.print() and CSS for print styling
    // For now, we can simulate it with an alert or by opening the print dialog.
    const printableContent = document.getElementById('printable-customer-statement');
    if (printableContent) {
        window.print();
    } else {
        toast({ title: "خطأ", description: "لا يمكن طباعة كشف الحساب حالياً.", variant: "destructive" });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
        await deleteCustomer(customerId);
        toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح.", variant: "destructive" });
    } catch(error) {
        toast({ title: "خطأ", description: "لم يتم حذف العميل.", variant: "destructive" });
    }
  }


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المبيعات</h1>
        <div className="flex gap-2">
            <Dialog open={showCreateQuotationDialog} onOpenChange={(isOpen) => { setShowCreateQuotationDialog(isOpen); if(!isOpen) setQuotationToEdit(null); }}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setQuotationToEdit(null); quotationForm.reset(); setShowCreateQuotationDialog(true);}}>
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء عرض سعر جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>{quotationToEdit ? 'تعديل عرض سعر' : 'إنشاء عرض سعر جديد'}</DialogTitle>
                </DialogHeader>
                <Form {...quotationForm}>
                  <form onSubmit={quotationForm.handleSubmit(handleQuotationSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={quotationForm.control} name="customerId" render={({ field }) => (
                          <FormItem><FormLabel>اسم العميل</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                              <SelectContent>{customers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem> )} />
                      <FormField control={quotationForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ العرض</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                      <FormField control={quotationForm.control} name="expiryDate" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ انتهاء العرض</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    </div>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                          {quotationItemsFields.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                              <FormField control={quotationForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                  <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                  <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { quotationForm.setValue(`items.${index}.unitPrice`, selectedItem.price); quotationForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(quotationForm, index); }} value={field.value} dir="rtl">
                                      <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                      <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                  </Select><FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={quotationForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(quotationForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={quotationForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(quotationForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={quotationForm.control} name={`items.${index}.total`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                  <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeQuotationItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                          </div> ))}
                      </ScrollArea>
                      <Button type="button" variant="outline" onClick={() => appendQuotationItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                      <FormField control={quotationForm.control} name="notes" render={({ field }) => (
                          <FormItem><FormLabel>ملاحظات</FormLabel>
                            <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter>
                      <Button type="submit">{quotationToEdit ? 'حفظ التعديلات' : 'حفظ عرض السعر'}</Button>
                      <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateSalesOrderDialog} onOpenChange={(isOpen) => { setShowCreateSalesOrderDialog(isOpen); if(!isOpen) setSalesOrderToEdit(null); }}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSalesOrderToEdit(null); salesOrderForm.reset(); setShowCreateSalesOrderDialog(true);}}>
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر بيع مباشر
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>{salesOrderToEdit ? 'تعديل أمر بيع' : 'إنشاء أمر بيع مباشر'}</DialogTitle>
                </DialogHeader>
                <Form {...salesOrderForm}>
                  <form onSubmit={salesOrderForm.handleSubmit(handleSalesOrderSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={salesOrderForm.control} name="customerId" render={({ field }) => (
                          <FormItem><FormLabel>اسم العميل</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                              <SelectContent>{customers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem> )} />
                      <FormField control={salesOrderForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ الأمر</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                      <FormField control={salesOrderForm.control} name="deliveryDate" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ التسليم المتوقع</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    </div>
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                          {salesOrderItemsFields.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                              <FormField control={salesOrderForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                  <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                  <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { salesOrderForm.setValue(`items.${index}.unitPrice`, selectedItem.price); salesOrderForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(salesOrderForm, index); }} value={field.value} dir="rtl">
                                      <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                      <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                  </Select><FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={salesOrderForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(salesOrderForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={salesOrderForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(salesOrderForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={salesOrderForm.control} name={`items.${index}.total`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                  <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeSalesOrderItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                          </div> ))}
                      </ScrollArea>
                      <Button type="button" variant="outline" onClick={() => appendSalesOrderItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                      <FormField control={salesOrderForm.control} name="notes" render={({ field }) => (
                          <FormItem><FormLabel>ملاحظات</FormLabel>
                            <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter>
                      <Button type="submit">{salesOrderToEdit ? 'حفظ التعديلات' : 'حفظ أمر البيع'}</Button>
                      <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md" dir="rtl">
          <TabsTrigger value="quotations" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileSignature className="inline-block me-2 h-4 w-4" /> عروض الأسعار
          </TabsTrigger>
          <TabsTrigger value="salesOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShoppingCart className="inline-block me-2 h-4 w-4" /> أوامر البيع
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> فواتير المبيعات
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <UsersIcon className="inline-block me-2 h-4 w-4" /> العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة عروض الأسعار</CardTitle>
              <CardDescription>إنشاء، إرسال، وتتبع حالة عروض الأسعار المقدمة للعملاء.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في عروض الأسعار..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرسل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مقبول</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرفوض</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>منتهي الصلاحية</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العرض</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ العرض</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((qt) => (
                      <TableRow key={qt.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{qt.id}</TableCell>
                        <TableCell>{customers.find(c => c.id === qt.customerId)?.name || qt.customerId}</TableCell>
                        <TableCell>{formatDate(qt.date)}</TableCell>
                        <TableCell>{formatDate(qt.expiryDate)}</TableCell>
                        <TableCell>{qt.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              qt.status === "مقبول" ? "default" :
                              qt.status === "مرسل" ? "secondary" :
                              "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {qt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {qt.status === "مسودة" && (
                            <>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setQuotationToEdit(qt); setShowCreateQuotationDialog(true);}}>
                                <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال للعميل">
                                <Send className="h-4 w-4 text-primary" />
                               </Button>
                            </>
                          )}
                           {qt.status === "مرسل" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحويل إلى أمر بيع">
                                <CheckCircle className="h-4 w-4 text-green-600" />
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
        </TabsContent>

        <TabsContent value="salesOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>أوامر البيع</CardTitle>
              <CardDescription>إدارة أوامر البيع المؤكدة، وتتبع حالة تنفيذها وتسليمها.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في أوامر البيع..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>عرض السعر (إن وجد)</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الأمر</TableHead>
                      <TableHead>تاريخ التسليم</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((so) => (
                      <TableRow key={so.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{so.id}</TableCell>
                        <TableCell>{so.quoteId || "-"}</TableCell>
                        <TableCell>{customers.find(c => c.id === so.customerId)?.name || so.customerId}</TableCell>
                        <TableCell>{formatDate(so.date)}</TableCell>
                        <TableCell>{formatDate(so.deliveryDate)}</TableCell>
                        <TableCell>{so.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                            <Badge variant={so.status === "مؤكد" ? "default" : "secondary"} className="whitespace-nowrap">{so.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الأمر">
                                <FileText className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إنشاء فاتورة">
                                <FilePlus className="h-4 w-4 text-primary" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل أمر البيع" onClick={() => {setSalesOrderToEdit(so); setShowCreateSalesOrderDialog(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير المبيعات</CardTitle>
              <CardDescription>إصدار ومتابعة فواتير المبيعات، وحالة الدفع من العملاء.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showCreateInvoiceDialog} onOpenChange={(isOpen) => { setShowCreateInvoiceDialog(isOpen); if(!isOpen) setInvoiceToEdit(null); }}>
                      <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setInvoiceToEdit(null); invoiceForm.reset(); setShowCreateInvoiceDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> إنشاء فاتورة مبيعات جديدة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xl" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{invoiceToEdit ? 'تعديل فاتورة مبيعات' : 'إنشاء فاتورة مبيعات جديدة'}</DialogTitle>
                        </DialogHeader>
                        <Form {...invoiceForm}>
                          <form onSubmit={invoiceForm.handleSubmit(handleInvoiceSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField control={invoiceForm.control} name="customerId" render={({ field }) => (
                                  <FormItem><FormLabel>اسم العميل</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                      <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                                      <SelectContent>{customers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                                    </Select><FormMessage /></FormItem> )} />
                              <FormField control={invoiceForm.control} name="date" render={({ field }) => (
                                  <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                              <FormField control={invoiceForm.control} name="dueDate" render={({ field }) => (
                                  <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                              <FormField control={invoiceForm.control} name="isDeferredPayment" render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm md:col-span-2 rtl:space-x-reverse">
                                  <FormControl>
                                    <Checkbox checked={field.value || false} onCheckedChange={field.onChange} id="isDeferredPayment"/>
                                  </FormControl>
                                  <FormLabel htmlFor="isDeferredPayment" className="font-normal">فاتورة بيع آجل</FormLabel>
                                </FormItem>
                                )} />
                            </div>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                  {invoiceItemsFields.map((item, index) => (
                                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                      <FormField control={invoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                          <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                          <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { invoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); invoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(invoiceForm, index); }} value={field.value} dir="rtl">
                                              <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                              <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                          </Select><FormMessage className="text-xs"/></FormItem> )} />
                                      <FormField control={invoiceForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                          <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                          <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(invoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                          <FormMessage className="text-xs"/></FormItem> )} />
                                      <FormField control={invoiceForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                          <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                          <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(invoiceForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                          <FormMessage className="text-xs"/></FormItem> )} />
                                      <FormField control={invoiceForm.control} name={`items.${index}.total`} render={({ field }) => (
                                          <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                          <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                          <FormMessage className="text-xs"/></FormItem> )} />
                                      <Button type="button" variant="ghost" size="icon" onClick={() => removeInvoiceItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                  </div> ))}
                              </ScrollArea>
                              <Button type="button" variant="outline" onClick={() => appendInvoiceItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                              <FormField control={invoiceForm.control} name="notes" render={({ field }) => (
                                  <FormItem><FormLabel>ملاحظات</FormLabel>
                                    <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                            <DialogFooter>
                              <Button type="submit">{invoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button>
                              <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في الفواتير..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                    <DatePickerWithPresets mode="range" />
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>أمر البيع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell>{inv.orderId || "-"}</TableCell>
                        <TableCell>{inv.customerId === "__cash_customer__" ? "عميل نقدي" : (customers.find(c => c.id === inv.customerId)?.name || inv.customerId)}</TableCell>
                        <TableCell>
                            {inv.source === "POS" ? (
                                <Badge variant="secondary" className="whitespace-nowrap"><Tag className="h-3 w-3 me-1"/> نقاط البيع</Badge>
                            ) : (
                                <Badge variant="outline" className="whitespace-nowrap">يدوي</Badge>
                            )}
                        </TableCell>
                        <TableCell>{formatDate(inv.date)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>{inv.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                            <Badge 
                                variant={inv.status === "مدفوع" ? "default" : (inv.status === "متأخر" || (inv.isDeferredPayment && inv.status !== "مدفوع")) ? "destructive" : "outline"} 
                                className="whitespace-nowrap"
                            >
                                {getInvoiceStatusText(inv)}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الفاتورة" onClick={() => handlePrintInvoice(inv)}>
                                <Printer className="h-4 w-4" />
                            </Button>
                             {inv.status === "غير مدفوع" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                             )}
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الفاتورة" onClick={() => {setInvoiceToEdit(inv as InvoiceFormValues); setShowCreateInvoiceDialog(true);}}>
                                <Edit className="h-4 w-4" />
                             </Button>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف الفاتورة">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>سيتم حذف الفاتورة "{inv.id}" نهائياً.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteInvoice(inv.id!)}>تأكيد الحذف</AlertDialogAction>
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

        <TabsContent value="customers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة العملاء</CardTitle>
              <CardDescription>سجل بيانات العملاء، تاريخ معاملاتهم، وأرصدتهم.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showManageCustomerDialog} onOpenChange={(isOpen) => { setShowManageCustomerDialog(isOpen); if(!isOpen) setCustomerToEdit(null); }}>
                      <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setCustomerToEdit(null); customerForm.reset(); setShowManageCustomerDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> إضافة عميل جديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>{customerToEdit ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</DialogTitle>
                        </DialogHeader>
                        <Form {...customerForm}>
                          <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4 py-4">
                            <FormField control={customerForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم العميل</FormLabel><FormControl><Input placeholder="اسم العميل أو الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={customerForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="example@customer.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={customerForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>الهاتف</FormLabel><FormControl><Input placeholder="رقم الهاتف" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={customerForm.control} name="type" render={({ field }) => ( <FormItem><FormLabel>نوع العميل</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "فرد"} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="فرد">فرد</SelectItem><SelectItem value="شركة">شركة</SelectItem></SelectContent>
                                </Select>
                                <FormMessage/></FormItem> )}/>
                            <FormField control={customerForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عنوان العميل" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={customerForm.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input placeholder="الرقم الضريبي للعميل" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <DialogFooter>
                              <Button type="submit">{customerToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}</Button>
                              <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث باسم العميل أو الرقم..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العميل</TableHead>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((cust) => (
                      <TableRow key={cust.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{cust.id}</TableCell>
                        <TableCell>{cust.name}</TableCell>
                        <TableCell>{cust.email}</TableCell>
                        <TableCell>{cust.phone}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="whitespace-nowrap">{cust.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{cust.balance.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض ملف العميل" onClick={() => handleViewCustomerDetails(cust)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل بيانات العميل" onClick={() => {setCustomerToEdit(cust as CustomerFormValues); setShowManageCustomerDialog(true);}}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف العميل">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>سيتم حذف العميل "{cust.name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCustomer(cust.id!)}>تأكيد الحذف</AlertDialogAction>
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

      {/* Print Invoice Dialog */}
      <Dialog open={showPrintInvoiceDialog} onOpenChange={setShowPrintInvoiceDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة فاتورة مبيعات: {selectedInvoiceForPrint?.id}</DialogTitle>
            <DialogDescriptionComponent>معاينة الفاتورة قبل الطباعة.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedInvoiceForPrint && isClient && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="sales invoice layout">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b">
                <div className="flex items-center gap-2">
                  <AppLogo />
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض، المملكة العربية السعودية</p>
                    <p className="text-xs">الرقم الضريبي: 300012345600003</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-semibold text-primary">فاتورة مبيعات {selectedInvoiceForPrint.isDeferredPayment && '(آجلة)'}</h3>
                  <p className="text-xs">Sales Invoice {selectedInvoiceForPrint.isDeferredPayment && '(Deferred)'}</p>
                  <p className="text-sm mt-1"><strong>رقم الفاتورة:</strong> {selectedInvoiceForPrint.id}</p>
                  <p className="text-sm"><strong>تاريخ الفاتورة:</strong> {formatDate(selectedInvoiceForPrint.date)}</p>
                  <p className="text-sm"><strong>تاريخ الاستحقاق:</strong> {formatDate(selectedInvoiceForPrint.dueDate)}</p>
                  {selectedInvoiceForPrint.orderId && <p className="text-sm"><strong>أمر البيع:</strong> {selectedInvoiceForPrint.orderId}</p>}
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6 text-xs">
                <h4 className="font-semibold mb-1 text-sm">فاتورة إلى:</h4>
                <p><strong>{selectedInvoiceForPrint.customerName}</strong></p>
                {selectedInvoiceForPrint.customerAddress && <p>{selectedInvoiceForPrint.customerAddress}</p>}
                {selectedInvoiceForPrint.customerVatNumber && <p>الرقم الضريبي للعميل: {selectedInvoiceForPrint.customerVatNumber}</p>}
              </div>

              {/* Items Table */}
              <Table size="sm" className="mb-6">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">سعر الوحدة</TableHead>
                    <TableHead className="text-left">الإجمالي (قبل الضريبة)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoiceForPrint.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">{item.unitPrice.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-left">{item.total.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals Section */}
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي (قبل الضريبة):</span>
                    <span>{selectedInvoiceForPrint.subTotalForPrint.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span>{selectedInvoiceForPrint.vatAmountForPrint.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1 text-primary">
                    <span>المبلغ الإجمالي المستحق:</span>
                    <span>{selectedInvoiceForPrint.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="mb-6 text-xs p-2 border rounded-md bg-muted/30">
                <p data-ai-hint="amount to words"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedInvoiceForPrint.numericTotalAmount)}</p>
              </div>
              
              {/* Terms and Conditions / Notes */}
              <div className="text-xs text-muted-foreground mb-6">
                  <h5 className="font-semibold text-foreground mb-1">الشروط والأحكام:</h5>
                  <p>- يجب دفع الفاتورة خلال 30 يوماً من تاريخ الاستحقاق.</p>
                  <p>- جميع الأسعار بالريال السعودي شاملة ضريبة القيمة المضافة.</p>
                  {selectedInvoiceForPrint.isDeferredPayment && <p className="font-semibold text-primary">- هذه الفاتورة آجلة الدفع.</p>}
                  {selectedInvoiceForPrint.notes && <p className="mt-2"><strong>ملاحظات إضافية:</strong> {selectedInvoiceForPrint.notes}</p>}
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t text-xs">
                <div className="text-center">
                    <p className="mb-10">.........................</p>
                    <p className="font-semibold">ختم وتوقيع الشركة</p>
                </div>
                <div className="text-center">
                    <p className="mb-10">.........................</p>
                    <p className="font-semibold">استلمت بواسطة (العميل)</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print-block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()} disabled={!selectedInvoiceForPrint || !isClient}>
              <Printer className="me-2 h-4 w-4" /> طباعة
            </Button>
            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetailsDialog} onOpenChange={setShowCustomerDetailsDialog}>
        <DialogContent className="sm:max-w-4xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>تفاصيل العميل: {selectedCustomerForDetails?.name}</DialogTitle>
            <DialogDescriptionComponent>عرض بيانات العميل، فواتيره، وكشف حسابه.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedCustomerForDetails && isClient && (
            <div id="printable-customer-statement" className="printable-area bg-background text-foreground font-cairo text-sm p-4 max-h-[80vh] overflow-y-auto" dir="rtl">
              {/* Print Header */}
              <div className="print-only flex justify-between items-start pb-4 mb-6 border-b">
                <div className="flex items-center gap-2"> <AppLogo />
                  <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> <p className="text-xs">الرياض، المملكة العربية السعودية</p> <p className="text-xs">الرقم الضريبي: 300012345600003</p> </div>
                </div>
                <div className="text-left"> <h3 className="text-xl font-semibold text-primary">كشف حساب عميل</h3> <p className="text-xs">Customer Statement</p> <p className="text-sm mt-1"><strong>العميل:</strong> {selectedCustomerForDetails.name}</p> <p className="text-sm"><strong>التاريخ:</strong> {new Date().toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p> </div>
              </div>

              <Tabs defaultValue="info" className="w-full" dir="rtl">
                <TabsList className="w-full mb-4 print-hidden" dir="rtl">
                  <TabsTrigger value="info">بيانات العميل</TabsTrigger>
                  <TabsTrigger value="invoicesList">قائمة الفواتير</TabsTrigger>
                  <TabsTrigger value="statement">كشف الحساب</TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                  <Card>
                    <CardHeader><CardTitle className="text-base">بيانات العميل</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <p><strong>الاسم:</strong> {selectedCustomerForDetails.name}</p>
                      <p><strong>البريد الإلكتروني:</strong> {selectedCustomerForDetails.email}</p>
                      <p><strong>الهاتف:</strong> {selectedCustomerForDetails.phone}</p>
                      <p><strong>النوع:</strong> {selectedCustomerForDetails.type}</p>
                      <p><strong>الرصيد الحالي:</strong> {selectedCustomerForDetails.balance.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
                      <p><strong>العنوان:</strong> {selectedCustomerForDetails.address || "غير متوفر"}</p>
                      <p><strong>الرقم الضريبي:</strong> {selectedCustomerForDetails.vatNumber || "غير متوفر"}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="invoicesList">
                  <Card>
                    <CardHeader><CardTitle className="text-base">فواتير العميل ({customerInvoicesForDetails.length})</CardTitle></CardHeader>
                    <CardContent>
                      {customerInvoicesForDetails.length > 0 ? (
                        <Table size="sm">
                          <TableHeader><TableRow><TableHead>رقم الفاتورة</TableHead><TableHead>التاريخ</TableHead><TableHead>الاستحقاق</TableHead><TableHead>المبلغ</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {customerInvoicesForDetails.map(inv => (
                              <TableRow key={inv.id}>
                                <TableCell>{inv.id}</TableCell>
                                <TableCell>{formatDate(inv.date)}</TableCell>
                                <TableCell>{formatDate(inv.dueDate)}</TableCell>
                                <TableCell>{inv.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                                <TableCell><Badge variant={inv.status === "مدفوع" ? "default" : "outline"}>{getInvoiceStatusText(inv)}</Badge></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-muted-foreground text-center py-4">لا توجد فواتير لهذا العميل.</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="statement">
                  <Card>
                    <CardHeader><CardTitle className="text-base">كشف حساب العميل</CardTitle></CardHeader>
                    <CardContent>
                      {customerStatement.length > 0 ? (
                        <Table size="sm">
                          <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>البيان</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الرصيد</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {customerStatement.map((entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell>{entry.debit > 0 ? entry.debit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) : '-'}</TableCell>
                                <TableCell>{entry.credit > 0 ? entry.credit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) : '-'}</TableCell>
                                <TableCell className="font-semibold">{entry.balance.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : <p className="text-muted-foreground text-center py-4">لا توجد حركات في كشف الحساب.</p>}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <p className="text-center text-xs text-muted-foreground mt-10 print-only">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={handlePrintCustomerStatement} disabled={!selectedCustomerForDetails || !isClient || customerStatement.length === 0}>
              <Printer className="me-2 h-4 w-4" /> طباعة كشف الحساب
            </Button>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

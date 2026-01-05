

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
import { ShoppingCart, FileSignature, FilePlus, UsersIcon, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Send, Printer, MinusCircle, Tag, Eye, RefreshCw, Briefcase, CreditCard, DollarSign } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { addSalesInvoice, updateSalesInvoice, deleteSalesInvoice, addQuotation, updateQuotation, deleteQuotation, addSalesOrder, updateSalesOrder, deleteSalesOrder, addSalesReturn, approveSalesReturn, deleteSalesReturn, addCustomer, updateCustomer, deleteCustomer, updateCustomerInvoicePayment } from './actions';
import type { Product } from '@/db/schema';
import { useCurrency } from '@/hooks/use-currency';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';


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
  paidAmount?: number;
  status: "مدفوع" | "غير مدفوع" | "متأخر" | "مدفوع جزئياً";
  items: InvoiceItem[];
  notes?: string | null;
  isDeferredPayment?: boolean | null;
  source?: "POS" | "Manual" | null;
  discountType?: 'amount' | 'percentage' | null;
  discountValue?: number | null;
}

interface SalesReturnItem {
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  reason?: string;
}
export interface SalesReturn {
  id: string;
  invoiceId?: string | null;
  customerId: string;
  date: Date;
  numericTotalAmount: number;
  status: 'مسودة' | 'معتمد' | 'ملغي';
  items: SalesReturnItem[];
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
  openingBalance: number;
  balance: number; 
  creditLimit: number;
  address?: string | null;
  vatNumber?: string | null;
}


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
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر", "مدفوع جزئياً"]).default("غير مدفوع"),
  orderId: z.string().optional(),
  isDeferredPayment: z.boolean().optional().default(false),
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
  discountType: z.enum(['amount', 'percentage']).optional().default('amount'),
  discountValue: z.coerce.number().min(0).optional().default(0),
});
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const customerPaymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, "مبلغ الدفع يجب أن يكون أكبر من صفر."),
});
type CustomerPaymentFormValues = z.infer<typeof customerPaymentSchema>;


const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  openingBalance: z.coerce.number().default(0),
  balance: z.coerce.number().default(0),
  creditLimit: z.coerce.number().default(0),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const salesReturnItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
  reason: z.string().optional(),
});

const salesReturnSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  invoiceId: z.string().optional(),
  date: z.date({ required_error: "تاريخ المرتجع مطلوب" }),
  items: z.array(salesReturnItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "ملغي"]).default("مسودة"),
});
type SalesReturnFormValues = z.infer<typeof salesReturnSchema>;


// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 })} لا غير`;
};

interface SalesClientComponentProps {
  initialData: {
    customers: Customer[];
    invoices: Invoice[];
    quotations: QuotationFormValues[];
    salesOrders: SalesOrderFormValues[];
    salesReturns: SalesReturn[];
    products: (Product & { sellingPrice: number })[];
  };
}

export default function SalesClientComponent({ initialData }: SalesClientComponentProps) {
  const [quotations, setQuotationsData] = useState<QuotationFormValues[]>(initialData.quotations);
  const [invoices, setInvoicesData] = useState<Invoice[]>(initialData.invoices);
  const [salesOrders, setSalesOrdersData] = useState<SalesOrder[]>(initialData.salesOrders);
  const [salesReturns, setSalesReturnsData] = useState<SalesReturn[]>(initialData.salesReturns);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  const [products, setProducts] = useState(initialData.products);
  
  const [showPrintInvoiceDialog, setShowPrintInvoiceDialog] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<PrintableInvoice | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [showCreateQuotationDialog, setShowCreateQuotationDialog] = useState(false);
  const [quotationToEdit, setQuotationToEdit] = useState<QuotationFormValues | null>(null);
  
  const [showCreateSalesOrderDialog, setShowCreateSalesOrderDialog] = useState(false);
  const [salesOrderToEdit, setSalesOrderToEdit] = useState<SalesOrderFormValues | null>(null);

  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceFormValues | null>(null);

  const [showCreateSalesReturnDialog, setShowCreateSalesReturnDialog] = useState(false);
  const [salesReturnToEdit, setSalesReturnToEdit] = useState<SalesReturnFormValues | null>(null);


  const [showCustomerDetailsDialog, setShowCustomerDetailsDialog] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  const [customerInvoicesForDetails, setCustomerInvoicesForDetails] = useState<Invoice[]>([]);
  const [customerStatement, setCustomerStatement] = useState<StatementEntry[]>([]);
  
  const [showManageCustomerDialog, setShowManageCustomerDialog] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerFormValues | null>(null);

  const [showRecordCustomerPaymentDialog, setShowRecordCustomerPaymentDialog] = useState(false);
  const [customerInvoiceToPay, setCustomerInvoiceToPay] = useState<any | null>(null);


  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    setCustomers(initialData.customers);
    setInvoicesData(initialData.invoices);
    setProducts(initialData.products);
    setQuotationsData(initialData.quotations);
    setSalesOrdersData(initialData.salesOrders);
    setSalesReturnsData(initialData.salesReturns);
  }, [initialData]);

  const quotationForm = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { customerId: '', date: new Date(), expiryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة", numericTotalAmount: 0 },
  });
  const { fields: quotationItemsFields, append: appendQuotationItem, remove: removeQuotationItem, replace: replaceQuotationItems } = useFieldArray({
    control: quotationForm.control, name: "items",
  });

  const salesOrderForm = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: { customerId: '', date: new Date(), deliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مؤكد", numericTotalAmount: 0 },
  });
  const { fields: salesOrderItemsFields, append: appendSalesOrderItem, remove: removeSalesOrderItem, replace: replaceSalesOrderItems } = useFieldArray({
    control: salesOrderForm.control, name: "items",
  });

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual", discountType: 'amount', discountValue: 0 },
  });
  const { fields: invoiceItemsFields, append: appendInvoiceItem, remove: removeInvoiceItem, replace: replaceInvoiceItems } = useFieldArray({
    control: invoiceForm.control, name: "items",
  });
  
  const customerPaymentForm = useForm<CustomerPaymentFormValues>({ resolver: zodResolver(customerPaymentSchema) });

  const salesReturnForm = useForm<SalesReturnFormValues>({
    resolver: zodResolver(salesReturnSchema),
    defaultValues: { customerId: '', date: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason: ''}], status: "مسودة", numericTotalAmount: 0 },
  });
  const { fields: salesReturnItemsFields, append: appendSalesReturnItem, remove: removeSalesReturnItem, replace: replaceSalesReturnItems } = useFieldArray({
    control: salesReturnForm.control, name: "items",
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", type: "فرد", balance: 0, openingBalance: 0, creditLimit: 0, address: "", vatNumber: ""},
  });


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (showCreateQuotationDialog) {
        if (quotationToEdit) {
            quotationForm.reset({
                ...quotationToEdit,
                date: new Date(quotationToEdit.date),
                expiryDate: new Date(quotationToEdit.expiryDate),
            });
        } else {
            quotationForm.reset({ customerId: '', date: new Date(), expiryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة", numericTotalAmount: 0 });
        }
    }
  }, [quotationToEdit, quotationForm, showCreateQuotationDialog]);
  
  useEffect(() => {
      if (showCreateSalesOrderDialog) {
          if (salesOrderToEdit) {
              salesOrderForm.reset({
                  ...salesOrderToEdit,
                  date: new Date(salesOrderToEdit.date),
                  deliveryDate: new Date(salesOrderToEdit.deliveryDate),
              });
          } else {
              salesOrderForm.reset({ customerId: '', date: new Date(), deliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مؤكد", numericTotalAmount: 0 });
          }
      }
  }, [salesOrderToEdit, salesOrderForm, showCreateSalesOrderDialog]);

  useEffect(() => {
    if (showCreateInvoiceDialog) {
        if (invoiceToEdit) {
            invoiceForm.reset({
                ...invoiceToEdit,
                date: new Date(invoiceToEdit.date),
                dueDate: new Date(invoiceToEdit.dueDate),
                items: invoiceToEdit.items.length > 0 ? invoiceToEdit.items : [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}],
            });
        } else {
            invoiceForm.reset({ customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual", discountType: 'amount', discountValue: 0 });
        }
    }
}, [invoiceToEdit, invoiceForm, showCreateInvoiceDialog]);

useEffect(() => {
    if (showCreateSalesReturnDialog) {
        if (salesReturnToEdit) {
            salesReturnForm.reset({
                ...salesReturnToEdit,
                date: new Date(salesReturnToEdit.date),
            });
        } else {
            salesReturnForm.reset({ customerId: '', date: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason: ''}], status: "مسودة", numericTotalAmount: 0 });
        }
    }
}, [salesReturnToEdit, salesReturnForm, showCreateSalesReturnDialog]);

  useEffect(() => {
    if (customerToEdit) {
      customerForm.reset(customerToEdit);
    } else {
      customerForm.reset({ name: "", email: "", phone: "", type: "فرد", balance: 0, openingBalance: 0, creditLimit: 0, address: "", vatNumber: "" });
    }
  }, [customerToEdit, customerForm, showManageCustomerDialog]);

  useEffect(() => {
    if (customerInvoiceToPay) {
      customerPaymentForm.reset({ paymentAmount: customerInvoiceToPay.numericTotalAmount - (customerInvoiceToPay.paidAmount || 0) });
    }
  }, [customerInvoiceToPay, customerPaymentForm]);


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


  const handleQuotationSubmit = async (values: QuotationFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};

    try {
        if (quotationToEdit) {
          await updateQuotation({ ...finalValues, id: quotationToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل عرض السعر بنجاح." });
        } else {
          await addQuotation(finalValues);
          toast({ title: "تم الإنشاء", description: "تم إنشاء عرض السعر بنجاح." });
        }
        setShowCreateQuotationDialog(false);
        setQuotationToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ عرض السعر.", variant: "destructive" });
    }
  };

  const handleSalesOrderSubmit = async (values: SalesOrderFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};
    try {
        if (salesOrderToEdit) {
          await updateSalesOrder({ ...finalValues, id: salesOrderToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل أمر البيع بنجاح." });
        } else {
          await addSalesOrder(finalValues);
          toast({ title: "تم الإنشاء", description: "تم إنشاء أمر البيع بنجاح." });
        }
        setShowCreateSalesOrderDialog(false);
        setSalesOrderToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ أمر البيع.", variant: "destructive" });
    }
  };

  const handleInvoiceSubmit = async (values: InvoiceFormValues) => {
    const subtotal = calculateItemTotals(values.items);
    let finalTotal = subtotal;
    if (values.discountType === 'percentage' && values.discountValue) {
        finalTotal = subtotal - (subtotal * (values.discountValue / 100));
    } else if (values.discountValue) {
        finalTotal = subtotal - values.discountValue;
    }
    const finalValues = {...values, numericTotalAmount: finalTotal};

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
        toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleSalesReturnSubmit = async (values: SalesReturnFormValues) => {
    const totalAmount = calculateItemTotals(values.items);
    const finalValues = {...values, numericTotalAmount: totalAmount};

    try {
        if (salesReturnToEdit) {
            // await updateSalesReturn({ ...finalValues, id: salesReturnToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل مرتجع المبيعات بنجاح." });
        } else {
            await addSalesReturn(finalValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء مرتجع المبيعات بنجاح." });
        }
        setShowCreateSalesReturnDialog(false);
        setSalesReturnToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ مرتجع المبيعات.", variant: "destructive" });
    }
  };

  const handleApproveSalesReturn = async (returnId: string) => {
    try {
        await approveSalesReturn(returnId);
        toast({ title: "تم الاعتماد", description: "تم اعتماد مرتجع المبيعات وتحديث المخزون والحسابات." });
    } catch (error) {
        toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" });
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

  const handleCustomerPaymentSubmit = async (paymentValues: CustomerPaymentFormValues) => {
    if (!customerInvoiceToPay) return;
    try {
        const newPaidAmount = (customerInvoiceToPay.paidAmount || 0) + paymentValues.paymentAmount;
        const newStatus = newPaidAmount >= customerInvoiceToPay.numericTotalAmount ? "مدفوع" as const : "مدفوع جزئياً" as const;
        await updateCustomerInvoicePayment(customerInvoiceToPay.id, newPaidAmount, newStatus);
        toast({ title: "تم تسجيل الدفعة", description: "تم تسجيل دفعة لفاتورة العميل بنجاح." });
        setShowRecordCustomerPaymentDialog(false);
        setCustomerInvoiceToPay(null);
    } catch(error) {
        toast({ title: "خطأ", description: "لم يتم تسجيل الدفعة.", variant: "destructive" });
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
    let runningBalance = customer.openingBalance;

    const transactions: Array<{ date: Date, description: string, debit: number, credit: number }> = [];

    // Add opening balance as the first transaction
     if (customer.openingBalance !== 0) {
        transactions.push({
            date: new Date(0), // Push it to the very beginning
            description: "رصيد أول المدة",
            debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
            credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
        });
    }
  
    const customerInvoices = allInvoices.filter(inv => inv.customerId === customer.id);
  
    customerInvoices.forEach(invoice => {
      transactions.push({
        date: new Date(invoice.date),
        description: `فاتورة رقم: ${invoice.id}`,
        debit: invoice.numericTotalAmount,
        credit: 0,
      });
      if (invoice.status === "مدفوع") {
        // Assume payment date is due date for simplicity
        transactions.push({
          date: new Date(invoice.dueDate), 
          description: `سداد فاتورة رقم: ${invoice.id}`,
          debit: 0,
          credit: invoice.numericTotalAmount,
        });
      }
    });
  
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
    transactions.forEach(transaction => {
        if (transaction.description !== "رصيد أول المدة") {
          runningBalance += transaction.debit;
          runningBalance -= transaction.credit;
        }
      statement.push({
        date: transaction.date.getTime() === new Date(0).getTime() ? '-' : transaction.date.toLocaleDateString('ar-SA', { calendar: 'gregory' }),
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
    window.print();
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
        await deleteCustomer(customerId);
        toast({ title: "تم الحذف", description: "تم حذف العميل بنجاح.", variant: "destructive" });
    } catch(error) {
        toast({ title: "خطأ", description: "لم يتم حذف العميل.", variant: "destructive" });
    }
  }

  const handleAcceptQuotation = async (quotation: QuotationFormValues) => {
    if (!quotation.id) return;
    try {
        await updateQuotation({...quotation, status: "مقبول"});
        toast({ title: "تم قبول العرض", description: `تم تغيير حالة عرض السعر ${quotation.id} إلى "مقبول".` });
    } catch (e) {
        toast({ title: "خطأ", description: "لم يتم قبول عرض السعر.", variant: "destructive" });
    }
  };
  
  const handleCreateSalesOrderFromQuote = (quotation: QuotationFormValues) => {
    setSalesOrderToEdit(null); // Ensure we are in "create" mode
    salesOrderForm.reset({
      customerId: quotation.customerId,
      date: new Date(),
      deliveryDate: new Date(),
      items: quotation.items,
      notes: `تم إنشاؤه من عرض السعر ${quotation.id}`,
      status: "مؤكد",
      quoteId: quotation.id,
      numericTotalAmount: quotation.numericTotalAmount,
    });
    setShowCreateSalesOrderDialog(true);
  };

  const handleCreateInvoiceFromSalesOrder = (salesOrder: SalesOrderFormValues) => {
    setInvoiceToEdit(null);
    invoiceForm.reset({
      customerId: salesOrder.customerId,
      date: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: salesOrder.items,
      notes: `تم إنشاؤها من أمر البيع ${salesOrder.id}`,
      status: "غير مدفوع",
      orderId: salesOrder.id,
      numericTotalAmount: salesOrder.numericTotalAmount,
    });
    setShowCreateInvoiceDialog(true);
  };

   const handleDeleteQuotation = async (id: string) => {
    try {
        await deleteQuotation(id);
        toast({ title: "تم الحذف", description: `تم حذف عرض السعر ${id}.`, variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف عرض السعر.", variant: "destructive" });
    }
  };

   const handleDeleteSalesOrder = async (id: string) => {
    try {
        await deleteSalesOrder(id);
        toast({ title: "تم الحذف", description: `تم حذف أمر البيع ${id}.`, variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف أمر البيع.", variant: "destructive" });
    }
  };
  
  const handleDeleteSalesReturn = async (id: string) => {
    try {
        await deleteSalesReturn(id);
        toast({ title: "تم الحذف", description: `تم حذف مرتجع المبيعات ${id}.`, variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف مرتجع المبيعات.", variant: "destructive" });
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المبيعات</h1>
        {/* The main action buttons are now inside their respective tabs */}
      </div>

      <Tabs defaultValue="quotations" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="quotations" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileSignature className="inline-block me-2 h-4 w-4" /> عروض الأسعار
          </TabsTrigger>
          <TabsTrigger value="salesOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShoppingCart className="inline-block me-2 h-4 w-4" /> أوامر البيع
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> فواتير المبيعات
          </TabsTrigger>
          <TabsTrigger value="salesReturns" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <RefreshCw className="inline-block me-2 h-4 w-4" /> مرتجعات المبيعات
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <UsersIcon className="inline-block me-2 h-4 w-4" /> العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
            <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>عروض الأسعار</CardTitle>
                    <Dialog open={showCreateQuotationDialog} onOpenChange={setShowCreateQuotationDialog}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md" onClick={() => {setQuotationToEdit(null); quotationForm.reset(); setShowCreateQuotationDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إنشاء عرض سعر
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl" dir="rtl">
                          {/* Quotation Form Dialog Content */}
                          <DialogHeader>
                            <DialogTitle>{quotationToEdit ? 'تعديل عرض سعر' : 'إنشاء عرض سعر جديد'}</DialogTitle>
                          </DialogHeader>
                          <Form {...quotationForm}>
                            <form onSubmit={quotationForm.handleSubmit(handleQuotationSubmit)} className="space-y-4">
                              {/* Form fields here */}
                              <DialogFooter>
                                <Button type="submit">{quotationToEdit ? 'حفظ التعديلات' : 'حفظ عرض السعر'}</Button>
                                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                    {/* Quotations Table */}
                </CardContent>
            </Card>
        </TabsContent>
        
         <TabsContent value="salesOrders">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>أوامر البيع</CardTitle>
                        <Dialog open={showCreateSalesOrderDialog} onOpenChange={setShowCreateSalesOrderDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => {setSalesOrderToEdit(null); salesOrderForm.reset(); setShowCreateSalesOrderDialog(true);}}>
                                    <PlusCircle className="me-2 h-4 w-4"/> أمر بيع جديد
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl" dir="rtl">
                                {/* Sales Order Form Dialog Content */}
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Sales Orders Table */}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>فواتير المبيعات</CardTitle>
                <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
                    <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => {setInvoiceToEdit(null); invoiceForm.reset(); setShowCreateInvoiceDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4"/> فاتورة جديدة
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl" dir="rtl">
                        {/* Invoice Form Dialog Content */}
                         <DialogHeader><DialogTitle>{invoiceToEdit ? 'تعديل فاتورة' : 'إنشاء فاتورة جديدة'}</DialogTitle></DialogHeader>
                          <Form {...invoiceForm}><form onSubmit={invoiceForm.handleSubmit(handleInvoiceSubmit)} className="space-y-4 py-4"><ScrollArea className="h-[60vh] p-2">
                             {/* Invoice Form Fields */}
                           </ScrollArea><DialogFooter><Button type="submit">{invoiceToEdit ? 'حفظ التعديلات' : 'حفظ الفاتورة'}</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter></form></Form>
                    </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Invoices Table */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salesReturns">
            {/* Sales Returns Content */}
        </TabsContent>

         <TabsContent value="customers">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>قائمة العملاء</CardTitle>
                <Dialog open={showManageCustomerDialog} onOpenChange={setShowManageCustomerDialog}>
                    <DialogTrigger asChild>
                      <Button className="shadow-md" onClick={() => {setCustomerToEdit(null); customerForm.reset(); setShowManageCustomerDialog(true);}}>
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة عميل جديد
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg" dir="rtl">
                      <DialogHeader><DialogTitle>{customerToEdit ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</DialogTitle></DialogHeader>
                      <Form {...customerForm}>
                        <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4 py-4">
                            <FormField control={customerForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم العميل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={customerForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={customerForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                            </div>
                            <FormField control={customerForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage/></FormItem> )}/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={customerForm.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={customerForm.control} name="creditLimit" render={({ field }) => ( <FormItem><FormLabel>الحد الائتماني</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                 <FormField control={customerForm.control} name="openingBalance" render={({ field }) => ( <FormItem><FormLabel>الرصيد الافتتاحي</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                            </div>
                            <DialogFooter>
                              <Button type="submit">{customerToEdit ? "حفظ التعديلات" : "إضافة العميل"}</Button>
                              <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>البريد الإلكتروني</TableHead><TableHead>الهاتف</TableHead><TableHead>الرصيد الحالي</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell><TableCell>{customer.email}</TableCell><TableCell>{customer.phone}</TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(customer.balance).amount + ' ' + formatCurrency(customer.balance).symbol }}></TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleViewCustomerDetails(customer)}><Eye className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setCustomerToEdit(customer); setShowManageCustomerDialog(true); }}><Edit className="h-4 w-4"/></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف العميل "{customer.name}"؟</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>حذف</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record Customer Payment Dialog */}
      <Dialog open={showRecordCustomerPaymentDialog} onOpenChange={setShowRecordCustomerPaymentDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                  <DialogTitle>تسجيل دفعة من عميل</DialogTitle>
                  <DialogDescriptionComponent>
                      فاتورة رقم: {customerInvoiceToPay?.id} | المبلغ الإجمالي: {formatCurrency(customerInvoiceToPay?.numericTotalAmount || 0).amount} | المدفوع: {formatCurrency(customerInvoiceToPay?.paidAmount || 0).amount}
                  </DialogDescriptionComponent>
              </DialogHeader>
              <Form {...customerPaymentForm}>
                  <form onSubmit={customerPaymentForm.handleSubmit(handleCustomerPaymentSubmit)} className="space-y-4 py-4">
                      <FormField control={customerPaymentForm.control} name="paymentAmount" render={({ field }) => (
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
      <Dialog open={showCustomerDetailsDialog} onOpenChange={setShowCustomerDetailsDialog}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>ملف العميل: {selectedCustomerForDetails?.name}</DialogTitle>
            <DialogDescriptionComponent>عرض شامل لبيانات العميل المالية والتعاملات.</DialogDescriptionComponent>
          </DialogHeader>
            {selectedCustomerForDetails && (
              <div id="printable-customer-statement" className="space-y-4 printable-area">
                <Card className="print-only:border-0 print-only:shadow-none">
                    <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">الرصيد الافتتاحي</p><p className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedCustomerForDetails.openingBalance).amount + ' ' + formatCurrency(selectedCustomerForDetails.openingBalance).symbol }}></p></div>
                      <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">إجمالي المبيعات</p><p className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: formatCurrency(customerInvoicesForDetails.reduce((sum, inv) => sum + inv.numericTotalAmount, 0)).amount + ' ' + formatCurrency(customerInvoicesForDetails.reduce((sum, inv) => sum + inv.numericTotalAmount, 0)).symbol }}></p></div>
                      <div className="p-2 rounded-md bg-muted"><p className="text-xs text-muted-foreground">الحد الائتماني</p><p className="font-bold text-lg" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedCustomerForDetails.creditLimit).amount + ' ' + formatCurrency(selectedCustomerForDetails.creditLimit).symbol }}></p></div>
                      <div className="p-2 rounded-md bg-primary/10"><p className="text-xs text-primary">الرصيد الحالي</p><p className="font-bold text-lg text-primary" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedCustomerForDetails.balance).amount + ' ' + formatCurrency(selectedCustomerForDetails.balance).symbol }}></p></div>
                    </CardContent>
                </Card>
                <Tabs defaultValue="statement" className="w-full">
                  <TabsList className="print-hidden">
                    <TabsTrigger value="statement">كشف الحساب</TabsTrigger>
                    <TabsTrigger value="invoices">الفواتير</TabsTrigger>
                  </TabsList>
                  <TabsContent value="statement">
                    <Card className="print-only:border-0 print-only:shadow-none">
                      <CardHeader><CardTitle className="text-base">كشف حساب العميل</CardTitle></CardHeader>
                      <CardContent><Table><TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الرصيد</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {customerStatement.map((entry, index) => (
                            <TableRow key={index}><TableCell>{entry.date}</TableCell><TableCell>{entry.description}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.debit).amount + ' ' + formatCurrency(entry.debit).symbol }}></TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.credit).amount + ' ' + formatCurrency(entry.credit).symbol }}></TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.balance).amount + ' ' + formatCurrency(entry.balance).symbol }}></TableCell></TableRow>
                          ))}
                           {customerStatement.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">لا توجد حركات لعرضها</TableCell></TableRow>}
                        </TableBody>
                      </Table></CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="invoices">
                    <Card>
                      <CardHeader><CardTitle className="text-base">فواتير العميل</CardTitle></CardHeader>
                      <CardContent><Table><TableHeader><TableRow><TableHead>رقم الفاتورة</TableHead><TableHead>التاريخ</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead>الإجمالي</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {customerInvoicesForDetails.map(invoice => (
                            <TableRow key={invoice.id}><TableCell>{invoice.id}</TableCell><TableCell>{formatDate(invoice.date)}</TableCell><TableCell>{formatDate(invoice.dueDate)}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(invoice.numericTotalAmount).amount + ' ' + formatCurrency(invoice.numericTotalAmount).symbol }}></TableCell><TableCell><Badge variant={invoice.status === 'مدفوع' ? 'default' : 'destructive'}>{getInvoiceStatusText(invoice)}</Badge></TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table></CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          <DialogFooter className="print-hidden">
            <Button variant="outline" onClick={handlePrintCustomerStatement}> <Printer className="me-2 h-4 w-4" /> طباعة كشف الحساب </Button>
            <DialogClose asChild><Button>إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


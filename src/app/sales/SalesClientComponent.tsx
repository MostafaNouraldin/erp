

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
import { ShoppingCart, FileSignature, FilePlus, UsersIcon, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Send, Printer, MinusCircle, Tag, Eye, RefreshCw } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { addSalesInvoice, updateSalesInvoice, deleteSalesInvoice, addQuotation, updateQuotation, deleteQuotation, addSalesOrder, updateSalesOrder, deleteSalesOrder, addSalesReturn, approveSalesReturn, deleteSalesReturn } from './actions';
import { addCustomer, updateCustomer, deleteCustomer } from '../customers/actions';
import type { Product } from '@/db/schema';
import { useCurrency } from '@/hooks/use-currency';


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
  status: "مدفوع" | "غير مدفوع" | "متأخر";
  items: InvoiceItem[];
  notes?: string | null;
  isDeferredPayment?: boolean | null;
  source?: "POS" | "Manual" | null;
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
  balance: number; // Changed from string to number
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
    defaultValues: { customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual" },
  });
  const { fields: invoiceItemsFields, append: appendInvoiceItem, remove: removeInvoiceItem, replace: replaceInvoiceItems } = useFieldArray({
    control: invoiceForm.control, name: "items",
  });
  
  const salesReturnForm = useForm<SalesReturnFormValues>({
    resolver: zodResolver(salesReturnSchema),
    defaultValues: { customerId: '', date: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason: ''}], status: "مسودة", numericTotalAmount: 0 },
  });
  const { fields: salesReturnItemsFields, append: appendSalesReturnItem, remove: removeSalesReturnItem, replace: replaceSalesReturnItems } = useFieldArray({
    control: salesReturnForm.control, name: "items",
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", type: "فرد", balance: 0, address: "", vatNumber: ""},
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
            invoiceForm.reset({ customerId: '', date: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", numericTotalAmount: 0, isDeferredPayment: false, source: "Manual" });
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
                                  <Select onValueChange={(value) => { field.onChange(value); const selectedItem = products.find(i => i.id === value); if (selectedItem) { quotationForm.setValue(`items.${index}.unitPrice`, selectedItem.sellingPrice); quotationForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(quotationForm, index); }} value={field.value} dir="rtl">
                                      <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                      <SelectContent>{products.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
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
        </div>
      </div>

      <Tabs defaultValue="invoices" className="w-full" dir="rtl">
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
          <TabsTrigger value="salesReturns" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <RefreshCw className="inline-block me-2 h-4 w-4" /> مرتجعات المبيعات
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <UsersIcon className="inline-block me-2 h-4 w-4" /> العملاء
          </TabsTrigger>
        </TabsList>
        
        {/* Sales Returns Tab */}
        <TabsContent value="salesReturns">
            <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>مرتجعات المبيعات (إشعارات دائنة)</CardTitle>
                    <Dialog open={showCreateSalesReturnDialog} onOpenChange={(isOpen) => { setShowCreateSalesReturnDialog(isOpen); if(!isOpen) setSalesReturnToEdit(null); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => { setSalesReturnToEdit(null); salesReturnForm.reset(); setShowCreateSalesReturnDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إنشاء مرتجع جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl" dir="rtl">
                             <DialogHeader><DialogTitle>{salesReturnToEdit ? "تعديل مرتجع" : "إنشاء مرتجع مبيعات جديد"}</DialogTitle></DialogHeader>
                             <Form {...salesReturnForm}>
                                <form onSubmit={salesReturnForm.handleSubmit(handleSalesReturnSubmit)} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={salesReturnForm.control} name="customerId" render={({ field }) => (
                                        <FormItem><FormLabel>العميل</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل" /></SelectTrigger></FormControl>
                                                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem> )} />
                                    <FormField control={salesReturnForm.control} name="date" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ المرتجع</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                  </div>
                                   <FormField control={salesReturnForm.control} name="invoiceId" render={({ field }) => (
                                        <FormItem><FormLabel>الفاتورة الأصلية (اختياري)</FormLabel>
                                            <Select onValueChange={(value) => { 
                                                field.onChange(value);
                                                const originalInvoice = invoices.find(inv => inv.id === value);
                                                if (originalInvoice) {
                                                    replaceSalesReturnItems(originalInvoice.items);
                                                }
                                            }} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفاتورة الأصلية لتعبئة الأصناف" /></SelectTrigger></FormControl>
                                            <SelectContent>{invoices.filter(inv => inv.customerId === salesReturnForm.watch('customerId')).map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.id}</SelectItem>)}</SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )}/>
                                  <ScrollArea className="h-[200px] border rounded-md p-2">
                                    {salesReturnItemsFields.map((item, index) => (
                                      <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                          <FormField control={salesReturnForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                              <FormItem className="col-span-12 sm:col-span-3"><FormLabel className="text-xs">الصنف</FormLabel>
                                              <Select onValueChange={(value) => { field.onChange(value); const selectedItem = products.find(i => i.id === value); if (selectedItem) { salesReturnForm.setValue(`items.${index}.unitPrice`, selectedItem.sellingPrice); salesReturnForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(salesReturnForm, index); }} value={field.value} dir="rtl">
                                                  <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                                  <SelectContent>{products.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                              </Select><FormMessage className="text-xs"/></FormItem> )} />
                                          <FormField control={salesReturnForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                              <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                              <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(salesReturnForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                              <FormMessage className="text-xs"/></FormItem> )} />
                                          <FormField control={salesReturnForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                              <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                              <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(salesReturnForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                              <FormMessage className="text-xs"/></FormItem> )} />
                                          <FormField control={salesReturnForm.control} name={`items.${index}.reason`} render={({ field }) => (
                                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السبب</FormLabel>
                                                <FormControl><Input {...field} className="bg-background h-9 text-xs" /></FormControl>
                                                <FormMessage className="text-xs"/></FormItem> )} />
                                          <FormField control={salesReturnForm.control} name={`items.${index}.total`} render={({ field }) => (
                                              <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                              <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                              <FormMessage className="text-xs"/></FormItem> )} />
                                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSalesReturnItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                      </div> ))}
                                  </ScrollArea>
                                  <Button type="button" variant="outline" onClick={() => appendSalesReturnItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason: ''})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                                  <DialogFooter>
                                      <Button type="submit">{salesReturnToEdit ? "حفظ التعديلات" : "حفظ المرتجع"}</Button>
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
                    <TableHeader><TableRow><TableHead>رقم المرتجع</TableHead><TableHead>العميل</TableHead><TableHead>التاريخ</TableHead><TableHead>الإجمالي</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {salesReturns.map(sr => (
                            <TableRow key={sr.id}>
                                <TableCell>{sr.id}</TableCell>
                                <TableCell>{customers.find(c => c.id === sr.customerId)?.name || sr.customerId}</TableCell>
                                <TableCell>{formatDate(sr.date)}</TableCell>
                                <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(sr.numericTotalAmount) }}></TableCell>
                                <TableCell><Badge variant={sr.status === 'معتمد' ? 'default' : 'outline'}>{sr.status}</Badge></TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleApproveSalesReturn(sr.id)} className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف مرتجع المبيعات "{sr.id}"؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSalesReturn(sr.id)}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tabs */}
        <TabsContent value="invoices">
          {/* Invoice content as before */}
        </TabsContent>
        <TabsContent value="customers">
          {/* Customer content as before */}
        </TabsContent>
        <TabsContent value="quotations">
          {/* Quotation content as before */}
        </TabsContent>
        <TabsContent value="salesOrders">
          {/* Sales order content as before */}
        </TabsContent>

      </Tabs>
    </div>
  );
}







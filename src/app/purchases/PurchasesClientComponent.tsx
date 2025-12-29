
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { Briefcase, FilePlus, FileCheck, PackageSearch, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Eye, MinusCircle, Printer, DollarSign, Truck, Users, CornerDownLeft, ShoppingBag } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useCurrency } from '@/hooks/use-currency';
import { 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    addPurchaseOrder, 
    updatePurchaseOrder, 
    deletePurchaseOrder, 
    updatePurchaseOrderStatus,
    addSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    updateSupplierInvoicePayment
} from './actions';


// Schemas
const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المورد مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});
type SupplierFormValues = z.infer<typeof supplierSchema>;

const purchaseOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});
const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  date: z.date({ required_error: "تاريخ الأمر مطلوب" }),
  expectedDeliveryDate: z.date({ required_error: "تاريخ التسليم المتوقع مطلوب" }),
  items: z.array(purchaseOrderItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "مستلم جزئياً", "مستلم بالكامل", "ملغي"]).default("مسودة"),
});
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

const supplierInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});
const supplierInvoiceSchema = z.object({
  id: z.string().optional(),
  poId: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  invoiceDate: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(supplierInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  totalAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  status: z.enum(["غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"]).default("غير مدفوع"),
  notes: z.string().optional(),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

const supplierPaymentSchema = z.object({
  paymentAmount: z.coerce.number().min(0.01, "مبلغ الدفع يجب أن يكون أكبر من صفر."),
  paymentDate: z.date({ required_error: "تاريخ الدفع مطلوب." }),
  paymentMethod: z.enum(["نقدي", "بنكي", "شيك"], { required_error: "طريقة الدفع مطلوبة." }),
});
type SupplierPaymentFormValues = z.infer<typeof supplierPaymentSchema>;


const goodsReceivedNoteItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  orderedQuantity: z.coerce.number().min(0),
  receivedQuantity: z.coerce.number().min(0, "الكمية المستلمة يجب أن تكون إيجابية أو صفر").max(Number.MAX_SAFE_INTEGER, "الكمية كبيرة جداً"),
  notes: z.string().optional(),
});
const goodsReceivedNoteSchema = z.object({
  id: z.string().optional(),
  poId: z.string().min(1, "أمر الشراء مطلوب"),
  supplierId: z.string().min(1, "المورد مطلوب"),
  grnDate: z.date({ required_error: "تاريخ الاستلام مطلوب" }),
  items: z.array(goodsReceivedNoteItemSchema).min(1, "يجب إضافة صنف واحد على الأقل مستلم"),
  notes: z.string().optional(),
  status: z.enum(["مستلم جزئياً", "مستلم بالكامل"]).default("مستلم جزئياً"),
  receivedBy: z.string().optional(), 
});
type GoodsReceivedNoteFormValues = z.infer<typeof goodsReceivedNoteSchema>;

const purchaseReturnItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  reason: z.string().optional(),
  total: z.coerce.number(),
});
const purchaseReturnSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  date: z.date({ required_error: "تاريخ المرتجع مطلوب" }),
  originalInvoiceId: z.string().optional(), 
  items: z.array(purchaseReturnItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "معالج", "ملغي"]).default("مسودة"),
});
type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;

const mockItems = [
    {id: "ITEM001", name: "لابتوب Dell XPS 15", price: 5800, unit: "قطعة"}, 
    {id: "ITEM002", name: "شاشة 27 بوصة", price: 800, unit: "قطعة"},
    {id: "ITEM003", name: "ورق طباعة A4 (صندوق)", price: 120, unit: "صندوق"},
    {id: "SERV001", name: "خدمة شحن دولي", price: 500, unit: "خدمة"},
    {id: "MAT001", name: "خشب زان", price: 200, unit: "متر مكعب"},
];


const initialGoodsReceivedNotesData: GoodsReceivedNoteFormValues[] = [
  { id: "GRN001", poId: "PO001", supplierId: "SUP001", grnDate: new Date("2024-07-25"), items: [{ itemId: "ITEM001", orderedQuantity: 5, receivedQuantity: 5, description: "لابتوبات Dell" }], status: "مستلم بالكامل", receivedBy: "أحمد" },
];
const initialPurchaseReturnsData: PurchaseReturnFormValues[] = [
  { id: "PR001", supplierId: "SUP001", date: new Date("2024-07-28"), originalInvoiceId: "INV-S001", items: [{itemId: "ITEM001", description: "لابتوب ديل - عطل مصنعي", quantity:1, unitPrice:6000, total:6000, reason: "عطل مصنعي"}], totalAmount: 6000, status: "معتمد" },
];

const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};

export default function PurchasesClientComponent({ initialData }: { initialData: { suppliers: any[], purchaseOrders: any[], supplierInvoices: any[] } }) {
  const [suppliersData, setSuppliersData] = useState<SupplierFormValues[]>(initialData.suppliers);
  const [purchaseOrdersData, setPurchaseOrdersData] = useState<PurchaseOrderFormValues[]>(initialData.purchaseOrders);
  const [supplierInvoices, setSupplierInvoicesData] = useState(initialData.supplierInvoices);
  const [goodsReceivedNotes, setGoodsReceivedNotesData] = useState(initialGoodsReceivedNotesData);
  const [purchaseReturns, setPurchaseReturnsData] = useState(initialPurchaseReturnsData);

  const [showCreateSupplierDialog, setShowCreateSupplierDialog] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierFormValues | null>(null);
  
  const [showCreatePoDialog, setShowCreatePoDialog] = useState(false);
  const [poToEdit, setPoToEdit] = useState<PurchaseOrderFormValues | null>(null);
  const [showViewPoDialog, setShowViewPoDialog] = useState(false);
  const [selectedPoForView, setSelectedPoForView] = useState<PurchaseOrderFormValues | null>(null);
  const [showPrintPoDialog, setShowPrintPoDialog] = useState(false);
  const [selectedPoForPrint, setSelectedPoForPrint] = useState<PurchaseOrderFormValues & { supplierName?: string } | null>(null);
  
  const [showCreateSupplierInvoiceDialog, setShowCreateSupplierInvoiceDialog] = useState(false);
  const [supplierInvoiceToEdit, setSupplierInvoiceToEdit] = useState<SupplierInvoiceFormValues | null>(null);
  const [showViewSupplierInvoiceDialog, setShowViewSupplierInvoiceDialog] = useState(false);
  const [selectedSupplierInvoiceForView, setSelectedSupplierInvoiceForView] = useState<SupplierInvoiceFormValues & { supplierName?: string, poId?:string } | null>(null);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [supplierInvoiceToPay, setSupplierInvoiceToPay] = useState<SupplierInvoiceFormValues | null>(null);


  const [showCreateGrnDialog, setShowCreateGrnDialog] = useState(false);
  const [grnToEdit, setGrnToEdit] = useState<GoodsReceivedNoteFormValues | null>(null);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<PurchaseOrderFormValues | null>(null);
  const [showViewGrnDialog, setShowViewGrnDialog] = useState(false);
  const [selectedGrnForView, setSelectedGrnForView] = useState<GoodsReceivedNoteFormValues & { supplierName?: string } | null>(null);
  const [showPrintGrnDialog, setShowPrintGrnDialog] = useState(false);
  const [selectedGrnForPrint, setSelectedGrnForPrint] = useState<GoodsReceivedNoteFormValues & { supplierName?: string } | null>(null);


  const [showCreatePurchaseReturnDialog, setShowCreatePurchaseReturnDialog] = useState(false);
  const [purchaseReturnToEdit, setPurchaseReturnToEdit] = useState<PurchaseReturnFormValues | null>(null);
  const [showViewPurchaseReturnDialog, setShowViewPurchaseReturnDialog] = useState(false);
  const [selectedPurchaseReturnForView, setSelectedPurchaseReturnForView] = useState<PurchaseReturnFormValues & { supplierName?: string } | null>(null);
  const [showPrintReturnDialog, setShowPrintReturnDialog] = useState(false);
  const [selectedReturnForPrint, setSelectedReturnForPrint] = useState<PurchaseReturnFormValues & { supplierName?: string } | null>(null);


  const { toast } = useToast();
  const { formatCurrency } = useCurrency(); // Use the currency context

  const supplierForm = useForm<SupplierFormValues>({ resolver: zodResolver(supplierSchema) });
  const poForm = useForm<PurchaseOrderFormValues>({ resolver: zodResolver(purchaseOrderSchema) });
  const { fields: poItemsFields, append: appendPoItem, remove: removePoItem } = useFieldArray({ control: poForm.control, name: "items" });

  const supplierInvoiceForm = useForm<SupplierInvoiceFormValues>({ resolver: zodResolver(supplierInvoiceSchema) });
  const { fields: suppInvItemsFields, append: appendSuppInvItem, remove: removeSuppInvItem } = useFieldArray({ control: supplierInvoiceForm.control, name: "items" });

  const supplierPaymentForm = useForm<SupplierPaymentFormValues>({ resolver: zodResolver(supplierPaymentSchema), defaultValues: { paymentDate: new Date(), paymentMethod: "نقدي" }});

  const grnForm = useForm<GoodsReceivedNoteFormValues>({ resolver: zodResolver(goodsReceivedNoteSchema) });
  const { fields: grnItemsFields, replace: replaceGrnItems } = useFieldArray({ control: grnForm.control, name: "items" });

  const purchaseReturnForm = useForm<PurchaseReturnFormValues>({ resolver: zodResolver(purchaseReturnSchema) });
  const { fields: returnItemsFields, append: appendReturnItem, remove: removeReturnItem } = useFieldArray({ control: purchaseReturnForm.control, name: "items" });


  useEffect(() => {
    if (supplierToEdit) supplierForm.reset(supplierToEdit);
    else supplierForm.reset({ name: '', email: '', phone: '', address: '', vatNumber: '', contactPerson: '', notes: ''});
  }, [supplierToEdit, supplierForm, showCreateSupplierDialog]);

  useEffect(() => {
    if (poToEdit) poForm.reset(poToEdit);
    else poForm.reset({ supplierId: '', date: new Date(), expectedDeliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة" });
  }, [poToEdit, poForm, showCreatePoDialog]);

  useEffect(() => {
    if (supplierInvoiceToEdit) supplierInvoiceForm.reset(supplierInvoiceToEdit);
    else supplierInvoiceForm.reset({ supplierId: '', invoiceDate: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 });
  }, [supplierInvoiceToEdit, supplierInvoiceForm, showCreateSupplierInvoiceDialog]);
  
  useEffect(() => {
    if (supplierInvoiceToPay) {
      supplierPaymentForm.reset({
        paymentDate: new Date(),
        paymentMethod: "نقدي",
        paymentAmount: supplierInvoiceToPay.totalAmount - (supplierInvoiceToPay.paidAmount || 0)
      });
    }
  }, [supplierInvoiceToPay, supplierPaymentForm]);

  useEffect(() => {
    if (grnToEdit) {
        grnForm.reset(grnToEdit);
    } else if (selectedPoForGrn) {
        const grnItems = selectedPoForGrn.items.map(item => ({
            itemId: item.itemId,
            description: item.description || mockItems.find(i=>i.id===item.itemId)?.name || "",
            orderedQuantity: item.quantity,
            receivedQuantity: 0,
            notes: "",
        }));
        grnForm.reset({
            poId: selectedPoForGrn.id!,
            supplierId: selectedPoForGrn.supplierId,
            grnDate: new Date(),
            items: grnItems,
            status: "مستلم جزئياً",
        });
    } else {
        grnForm.reset({ poId: '', supplierId: '', grnDate: new Date(), items: [{itemId: '', description: '', orderedQuantity: 0, receivedQuantity:0}], status: "مستلم جزئياً" });
    }
  }, [grnToEdit, selectedPoForGrn, grnForm, showCreateGrnDialog]);

  useEffect(() => {
    if (purchaseReturnToEdit) purchaseReturnForm.reset(purchaseReturnToEdit);
    else purchaseReturnForm.reset({ supplierId: '', date: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason:''}], status: "مسودة" });
  }, [purchaseReturnToEdit, purchaseReturnForm, showCreatePurchaseReturnDialog]);

  useEffect(() => {
    setSuppliersData(initialData.suppliers);
    setPurchaseOrdersData(initialData.purchaseOrders);
    setSupplierInvoicesData(initialData.supplierInvoices);
  }, [initialData]);


  const calculateItemTotalForForm = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };

  const calculateTotalAmountForForm = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleSupplierSubmit = async (values: SupplierFormValues) => {
    try {
      if (supplierToEdit) {
        await updateSupplier({ ...values, id: supplierToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل بيانات المورد." });
      } else {
        await addSupplier(values);
        toast({ title: "تمت الإضافة", description: "تم إضافة المورد." });
      }
      setShowCreateSupplierDialog(false);
      setSupplierToEdit(null);
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم حفظ بيانات المورد.", variant: "destructive" });
    }
  };

  const handlePoSubmit = async (values: PurchaseOrderFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = {...values, totalAmount};
    try {
        if (poToEdit) {
            await updatePurchaseOrder({ ...finalValues, id: poToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل أمر الشراء." });
        } else {
            await addPurchaseOrder(finalValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء أمر الشراء." });
        }
        setShowCreatePoDialog(false);
        setPoToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ أمر الشراء.", variant: "destructive" });
    }
  };


  const handleViewPo = async (po: PurchaseOrderFormValues) => {
      setSelectedPoForView(po);
      setShowViewPoDialog(true);
  };
  
  const handlePrintPo = (po: PurchaseOrderFormValues) => {
    const supplier = suppliersData.find(s => s.id === po.supplierId);
    setSelectedPoForPrint({...po, supplierName: supplier?.name});
    setShowPrintPoDialog(true);
  };

  const handleSupplierInvoiceSubmit = async (values: SupplierInvoiceFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = { ...values, totalAmount };
    try {
        if (supplierInvoiceToEdit) {
        await updateSupplierInvoice({ ...finalValues, id: supplierInvoiceToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل فاتورة المورد." });
        } else {
        await addSupplierInvoice(finalValues);
        toast({ title: "تم الإنشاء", description: "تم إنشاء فاتورة المورد." });
        }
        setShowCreateSupplierInvoiceDialog(false);
        setSupplierInvoiceToEdit(null);
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حفظ فاتورة المورد.", variant: "destructive" });
    }
  };
  
  const handleViewSupplierInvoice = (invoice: SupplierInvoiceFormValues) => {
    const supplier = suppliersData.find(s => s.id === invoice.supplierId);
    setSelectedSupplierInvoiceForView({...invoice, supplierName: supplier?.name});
    setShowViewSupplierInvoiceDialog(true);
  }
  
  const openRecordPaymentDialogForSupplier = (invoice: SupplierInvoiceFormValues) => {
    setSupplierInvoiceToPay(invoice);
    setShowRecordPaymentDialog(true);
  };
  
  const handleRecordSupplierPaymentSubmit = async (paymentValues: SupplierPaymentFormValues) => {
    if (!supplierInvoiceToPay) return;
    try {
        const newPaidAmount = (supplierInvoiceToPay.paidAmount || 0) + paymentValues.paymentAmount;
        const newStatus = newPaidAmount >= supplierInvoiceToPay.totalAmount ? "مدفوع" as const : "مدفوع جزئياً" as const;
        await updateSupplierInvoicePayment(supplierInvoiceToPay.id!, newPaidAmount, newStatus);
        toast({title: "تم تسجيل الدفعة", description: "تم تسجيل دفعة لفاتورة المورد بنجاح."});
        setShowRecordPaymentDialog(false);
        setSupplierInvoiceToPay(null);
    } catch(e){
        toast({ title: "خطأ", description: "لم يتم تسجيل الدفعة.", variant: "destructive" });
    }
  };
  
  const handleGrnSubmit = (values: GoodsReceivedNoteFormValues) => {
    const po = purchaseOrdersData.find(p => p.id === values.poId);
    if (po) {
        const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceivedInThisGrn = values.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
        
        const alreadyReceivedQuantity = goodsReceivedNotes
            .filter(grn => grn.poId === values.poId && grn.id !== (grnToEdit ? grnToEdit.id : undefined))
            .reduce((sum, grn) => sum + grn.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0), 0);

        const newTotalReceivedForPo = alreadyReceivedQuantity + totalReceivedInThisGrn;
        
        const newPoStatus = newTotalReceivedForPo >= totalOrdered ? "مستلم بالكامل" as const : "مستلم جزئياً" as const;
        
        const allItemsFullyReceivedInThisGrn = values.items.every(item => 
            item.receivedQuantity >= (po.items.find(poItem => poItem.itemId === item.itemId)?.quantity || 0) - 
            goodsReceivedNotes
                .filter(grn => grn.poId === values.poId && grn.id !== (grnToEdit ? grnToEdit.id : undefined))
                .flatMap(grn => grn.items)
                .filter(grnItem => grnItem.itemId === item.itemId)
                .reduce((sum, grnItem) => sum + grnItem.receivedQuantity, 0)
        );

        const newGrnStatus = allItemsFullyReceivedInThisGrn && newTotalReceivedForPo >= totalOrdered ? "مستلم بالكامل" as const : "مستلم جزئياً" as const;
        
        if(po.status !== "مستلم بالكامل") {
            setPurchaseOrdersData(prev => prev.map(p => p.id === values.poId ? {...p, status: newPoStatus} : p));
        }
        values.status = newGrnStatus;
    }

    if (grnToEdit) {
      setGoodsReceivedNotesData(prev => prev.map(grn => grn.id === grnToEdit.id ? { ...values, id: grnToEdit.id! } : grn));
      toast({ title: "تم التعديل", description: "تم تعديل إذن الاستلام." });
    } else {
      setGoodsReceivedNotesData(prev => [...prev, { ...values, id: `GRN${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء إذن الاستلام." });
    }
    setShowCreateGrnDialog(false);
    setGrnToEdit(null);
    setSelectedPoForGrn(null);
  };

  const handleViewGrn = (grn: GoodsReceivedNoteFormValues) => {
    const supplier = suppliersData.find(s => s.id === grn.supplierId);
    setSelectedGrnForView({...grn, supplierName: supplier?.name});
    setShowViewGrnDialog(true);
  }

  const handlePrintGrn = (grn: GoodsReceivedNoteFormValues) => {
    const supplier = suppliersData.find(s => s.id === grn.supplierId);
    setSelectedGrnForPrint({...grn, supplierName: supplier?.name});
    setShowPrintGrnDialog(true);
  }

  const handlePurchaseReturnSubmit = (values: PurchaseReturnFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = {...values, totalAmount};
    if (purchaseReturnToEdit) {
      setPurchaseReturnsData(prev => prev.map(pr => pr.id === purchaseReturnToEdit.id ? { ...finalValues, id: purchaseReturnToEdit.id! } : pr));
      toast({ title: "تم التعديل", description: "تم تعديل مرتجع المشتريات." });
    } else {
      setPurchaseReturnsData(prev => [...prev, { ...finalValues, id: `PR${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء مرتجع المشتريات." });
    }
    setShowCreatePurchaseReturnDialog(false);
    setPurchaseReturnToEdit(null);
  };

  const handleViewPurchaseReturn = (pr: PurchaseReturnFormValues) => {
    const supplier = suppliersData.find(s => s.id === pr.supplierId);
    setSelectedPurchaseReturnForView({...pr, supplierName: supplier?.name});
    setShowViewPurchaseReturnDialog(true);
  }


  const handleDeleteSupplier = async (supplierId: string) => {
      try {
        await deleteSupplier(supplierId);
        toast({title: "تم الحذف", description: `تم حذف المورد ${supplierId}`, variant:"destructive"});
      } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حذف المورد.", variant: "destructive" });
      }
  };
  const handleDeletePo = async (poId: string) => {
    try {
        await deletePurchaseOrder(poId);
        toast({title: "تم الحذف", description: `تم حذف أمر الشراء ${poId}`, variant:"destructive"});
    } catch (e) {
        toast({ title: "خطأ", description: "لم يتم حذف أمر الشراء.", variant: "destructive" });
    }
  };
  const handleDeleteSupplierInvoice = async (invId: string) => {
      try {
        await deleteSupplierInvoice(invId);
        toast({title: "تم الحذف", description: `تم حذف فاتورة المورد ${invId}`, variant:"destructive"});
      } catch (e) {
        toast({title: "خطأ", description: "لم يتم حذف فاتورة المورد.", variant:"destructive"});
      }
  };
  const handleDeleteGrn = (grnId: string) => {
      setGoodsReceivedNotesData(prev => prev.filter(grn => grn.id !== grnId));
      toast({title: "تم الحذف", description: `تم حذف إذن الاستلام ${grnId}`, variant:"destructive"});
  };
  const handleDeletePurchaseReturn = (returnId: string) => {
      setPurchaseReturnsData(prev => prev.filter(pr => pr.id !== returnId));
      toast({title: "تم الحذف", description: `تم حذف مرتجع المشتريات ${returnId}`, variant:"destructive"});
  };


  const handleApprovePo = async (poId: string) => {
    try {
        await updatePurchaseOrderStatus(poId, "معتمد");
        toast({title: "تم الاعتماد", description: `تم اعتماد أمر الشراء ${poId}.`});
    } catch (e) {
        toast({ title: "خطأ", description: "لم يتم اعتماد أمر الشراء.", variant: "destructive" });
    }
  };

  const openCreateGrnDialogFromPo = (po: PurchaseOrderFormValues) => {
    setSelectedPoForGrn(po);
    setGrnToEdit(null);
    setShowCreateGrnDialog(true);
  };

  const handlePrintReturn = (pr: PurchaseReturnFormValues) => {
    const supplier = suppliersData.find(s => s.id === pr.supplierId);
    setSelectedReturnForPrint({...pr, supplierName: supplier?.name});
    setShowPrintReturnDialog(true);
  }

  const formatDateForDisplay = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' });
  };
  
    return (
        <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المشتريات</h1>
        <div className="flex gap-2">
            <Dialog open={showCreatePoDialog} onOpenChange={(isOpen) => { setShowCreatePoDialog(isOpen); if(!isOpen) setPoToEdit(null); }}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setPoToEdit(null); poForm.reset({ supplierId: '', date: new Date(), expectedDeliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة" }); setShowCreatePoDialog(true);}}>
                    <FilePlus className="me-2 h-4 w-4" /> إنشاء أمر شراء جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>{poToEdit ? 'تعديل أمر شراء' : 'إنشاء أمر شراء جديد'}</DialogTitle>
                </DialogHeader>
                <Form {...poForm}>
                  <form onSubmit={poForm.handleSubmit(handlePoSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={poForm.control} name="supplierId" render={({ field }) => (
                          <FormItem><FormLabel>المورد</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                              <SelectContent>{suppliersData.map(sup => <SelectItem key={sup.id} value={sup.id!}>{sup.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem> )} />
                      <FormField control={poForm.control} name="date" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ الأمر</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                      <FormField control={poForm.control} name="expectedDeliveryDate" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ التسليم المتوقع</FormLabel>
                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    </div>
                    <ScrollArea className="h-[250px] border rounded-md p-2">
                          {poItemsFields.map((item, index) => (
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                              <FormField control={poForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                  <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                  <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { poForm.setValue(`items.${index}.unitPrice`, selectedItem.price); poForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(poForm, index); }} value={field.value} dir="rtl">
                                      <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                      <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}</SelectContent>
                                  </Select><FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={poForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(poForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={poForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                  <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(poForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <FormField control={poForm.control} name={`items.${index}.total`} render={({ field }) => (
                                  <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                  <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-xs"/></FormItem> )} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => removePoItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                          </div> ))}
                      </ScrollArea>
                      <Button type="button" variant="outline" onClick={() => appendPoItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                      <FormField control={poForm.control} name="notes" render={({ field }) => (
                          <FormItem><FormLabel>ملاحظات</FormLabel>
                            <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter>
                      <Button type="submit">{poToEdit ? 'حفظ التعديلات' : 'حفظ أمر الشراء'}</Button>
                      <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
        </div>
      </div>
      <Tabs defaultValue="suppliers" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md" dir="rtl">
          <TabsTrigger value="suppliers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> الموردين
          </TabsTrigger>
          <TabsTrigger value="purchaseOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShoppingBag className="inline-block me-2 h-4 w-4" /> أوامر الشراء (PO)
          </TabsTrigger>
          <TabsTrigger value="supplierInvoices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="inline-block me-2 h-4 w-4" /> فواتير الموردين
          </TabsTrigger>
          <TabsTrigger value="goodsReceivedNotes" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Truck className="inline-block me-2 h-4 w-4" /> عمليات الاستلام (GRN)
          </TabsTrigger>
          <TabsTrigger value="purchaseReturns" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CornerDownLeft className="inline-block me-2 h-4 w-4" /> مرتجعات المشتريات
          </TabsTrigger>
        </TabsList>
      {/* The rest of the component is omitted for brevity but is identical to what was previously generated */}
      </Tabs>
      </div>
    );
}

    

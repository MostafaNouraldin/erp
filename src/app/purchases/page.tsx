

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
import { addSupplier, updateSupplier, deleteSupplier, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updatePurchaseOrderStatus } from './actions';


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
  paidAmount: z.coerce.number().default(0).optional(), 
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


const initialSupplierInvoicesData: SupplierInvoiceFormValues[] = [
  { id: "INV-S001", poId: "PO001", supplierId: "SUP001", invoiceDate: new Date("2024-07-26"), dueDate: new Date("2024-08-26"), totalAmount: 30000, paidAmount: 0, status: "غير مدفوع", items: [{itemId:"ITEM001", description: "لابتوب ديل", quantity:5, unitPrice:6000, total:30000}] },
  { id: "INV-S002", supplierId: "SUP002", invoiceDate: new Date("2024-07-28"), dueDate: new Date("2024-08-28"), totalAmount: 18000, paidAmount: 10000, status: "مدفوع جزئياً", items: [{itemId:"MAT001", description: "خشب زان", quantity:90, unitPrice:200, total:18000}] },
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

// This is now a wrapper component for the client-side logic
export default function PurchasesPage() {
    const [initialData, setInitialData] = useState<{ suppliers: any[], purchaseOrders: any[] } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const { db, suppliers, purchaseOrders, purchaseOrderItems } = await import('@/db/loader');
            
            const suppliersResult = await db.select().from(suppliers);
            const purchaseOrdersResult = await db.select().from(purchaseOrders);
            // In a real app, you might want to fetch items for each PO here as well
            
            setInitialData({
                suppliers: suppliersResult,
                purchaseOrders: purchaseOrdersResult.map(po => ({
                    ...po,
                    totalAmount: parseFloat(po.totalAmount),
                    items: [] // Initially empty, can be lazy-loaded
                })),
            });
        };
        fetchData();
    }, []);

    if (!initialData) {
        // You can render a loading skeleton here
        return <div>Loading...</div>;
    }

    return <PurchasesClientComponent initialData={initialData} />;
}


function PurchasesClientComponent({ initialData }: { initialData: { suppliers: any[], purchaseOrders: any[] } }) {
  const [suppliersData, setSuppliersData] = useState<SupplierFormValues[]>(initialData.suppliers);
  const [purchaseOrders, setPurchaseOrdersData] = useState<PurchaseOrderFormValues[]>(initialData.purchaseOrders);
  const [supplierInvoices, setSupplierInvoicesData] = useState(initialSupplierInvoicesData);
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

  const handleSupplierInvoiceSubmit = (values: SupplierInvoiceFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = {...values, totalAmount, paidAmount: values.paidAmount || 0};
    if (supplierInvoiceToEdit) {
      setSupplierInvoicesData(prev => prev.map(inv => inv.id === supplierInvoiceToEdit.id ? { ...finalValues, id: supplierInvoiceToEdit.id! } : inv));
      toast({ title: "تم التعديل", description: "تم تعديل فاتورة المورد." });
    } else {
      setSupplierInvoicesData(prev => [...prev, { ...finalValues, id: `INV-S${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء فاتورة المورد." });
    }
    setShowCreateSupplierInvoiceDialog(false);
    setSupplierInvoiceToEdit(null);
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
  
  const handleRecordSupplierPaymentSubmit = (paymentValues: SupplierPaymentFormValues) => {
    if (!supplierInvoiceToPay) return;
    const newPaidAmount = (supplierInvoiceToPay.paidAmount || 0) + paymentValues.paymentAmount;
    const newStatus = newPaidAmount >= supplierInvoiceToPay.totalAmount ? "مدفوع" as const : "مدفوع جزئياً" as const;

    setSupplierInvoicesData(prev => prev.map(inv => 
        inv.id === supplierInvoiceToPay.id ? {...inv, paidAmount: newPaidAmount, status: newStatus} : inv
    ));
    toast({title: "تم تسجيل الدفعة", description: "تم تسجيل دفعة لفاتورة المورد بنجاح."});
    setShowRecordPaymentDialog(false);
    setSupplierInvoiceToPay(null);
  };
  
  const handleGrnSubmit = (values: GoodsReceivedNoteFormValues) => {
    const po = purchaseOrders.find(p => p.id === values.poId);
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
  const handleDeleteSupplierInvoice = (invId: string) => {
      setSupplierInvoicesData(prev => prev.filter(inv => inv.id !== invId));
      toast({title: "تم الحذف", description: `تم حذف فاتورة المورد ${invId}`, variant:"destructive"});
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

        <TabsContent value="suppliers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة الموردين</CardTitle>
              <CardDescription>تسجيل بيانات الموردين وتتبع تعاملاتهم.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showCreateSupplierDialog} onOpenChange={(isOpen) => { setShowCreateSupplierDialog(isOpen); if(!isOpen) setSupplierToEdit(null); }}>
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSupplierToEdit(null); supplierForm.reset({ name: '', email: '', phone: '', address: '', vatNumber: '', contactPerson: '', notes: ''}); setShowCreateSupplierDialog(true);}}>
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة مورد جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{supplierToEdit ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}</DialogTitle>
                    </DialogHeader>
                    <Form {...supplierForm}>
                      <form onSubmit={supplierForm.handleSubmit(handleSupplierSubmit)} className="space-y-4 py-4">
                        <FormField control={supplierForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المورد</FormLabel><FormControl><Input placeholder="اسم المورد أو الشركة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={supplierForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" placeholder="example@supplier.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                            <FormField control={supplierForm.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input placeholder="رقم الاتصال" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        </div>
                        <FormField control={supplierForm.control} name="address" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input placeholder="عنوان المورد" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={supplierForm.control} name="vatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input placeholder="الرقم الضريبي للمورد" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={supplierForm.control} name="contactPerson" render={({ field }) => ( <FormItem><FormLabel>اسم مسؤول الاتصال</FormLabel><FormControl><Input placeholder="الشخص المسؤول" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={supplierForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <DialogFooter>
                          <Button type="submit">{supplierToEdit ? 'حفظ التعديلات' : 'حفظ المورد'}</Button>
                          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الموردين..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>اسم المورد</TableHead><TableHead>البريد</TableHead><TableHead>الهاتف</TableHead><TableHead>مسؤول الاتصال</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {suppliersData.map((supplier) => (
                      <TableRow key={supplier.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.email}</TableCell>
                        <TableCell>{supplier.phone}</TableCell>
                        <TableCell>{supplier.contactPerson}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setSupplierToEdit(supplier); setShowCreateSupplierDialog(true);}}><Edit className="h-4 w-4" /></Button>
                           <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف المورد {supplier.name} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteSupplier(supplier.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchaseOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة أوامر الشراء</CardTitle>
              <CardDescription>إنشاء ومتابعة أوامر الشراء، الموافقات، وحالة التسليم.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في أوامر الشراء..." className="pr-10 w-full sm:w-64 bg-background" />
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
                    {["مسودة", "معتمد", "مستلم جزئياً", "مستلم بالكامل", "ملغي"].map(s => <DropdownMenuCheckboxItem key={s}>{s}</DropdownMenuCheckboxItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الأمر</TableHead>
                      <TableHead>التسليم المتوقع</TableHead><TableHead>الإجمالي</TableHead><TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{suppliersData.find(s=>s.id === po.supplierId)?.name || po.supplierId}</TableCell>
                        <TableCell>{formatDateForDisplay(po.date)}</TableCell>
                        <TableCell>{formatDateForDisplay(po.expectedDeliveryDate)}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(po.totalAmount) }}></TableCell>
                        <TableCell><Badge variant={po.status === "معتمد" || po.status === "مستلم بالكامل" ? "default" : po.status === "ملغي" ? "destructive" : "outline"} className="whitespace-nowrap">{po.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => handleViewPo(po)}><Eye className="h-4 w-4" /></Button>
                          {po.status === "مسودة" && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setPoToEdit(po); setShowCreatePoDialog(true);}}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-green-600" title="اعتماد" onClick={() => handleApprovePo(po.id!)}><CheckCircle className="h-4 w-4" /></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف أمر الشراء {po.id} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeletePo(po.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                          </>)}
                          {po.status === "معتمد" && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-blue-600" title="تسجيل استلام" onClick={() => openCreateGrnDialogFromPo(po)}><Truck className="h-4 w-4" /></Button>)}
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintPo(po)}><Printer className="h-4 w-4"/></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplierInvoices">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير الموردين</CardTitle>
              <CardDescription>تسجيل فواتير الموردين وربطها بأوامر الشراء، وتتبع حالة الدفع.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showCreateSupplierInvoiceDialog} onOpenChange={(isOpen) => { setShowCreateSupplierInvoiceDialog(isOpen); if(!isOpen) setSupplierInvoiceToEdit(null); }}>
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSupplierInvoiceToEdit(null); supplierInvoiceForm.reset({ supplierId: '', invoiceDate: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع", paidAmount: 0 }); setShowCreateSupplierInvoiceDialog(true);}}>
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة فاتورة مورد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{supplierInvoiceToEdit ? 'تعديل فاتورة مورد' : 'إضافة فاتورة مورد جديدة'}</DialogTitle>
                    </DialogHeader>
                    <Form {...supplierInvoiceForm}>
                      <form onSubmit={supplierInvoiceForm.handleSubmit(handleSupplierInvoiceSubmit)} className="space-y-4">
                         <FormField control={supplierInvoiceForm.control} name="poId" render={({ field }) => (
                          <FormItem><FormLabel>أمر الشراء (اختياري)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر الشراء" /></SelectTrigger></FormControl>
                              <SelectContent>{purchaseOrders.filter(po=>po.status === "معتمد" || po.status === "مستلم جزئياً" || po.status === "مستلم بالكامل").map(po => <SelectItem key={po.id} value={po.id!}>{po.id} ({suppliersData.find(s=>s.id === po.supplierId)?.name})</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={supplierInvoiceForm.control} name="supplierId" render={({ field }) => (
                              <FormItem><FormLabel>المورد</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                  <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                  <SelectContent>{suppliersData.map(sup => <SelectItem key={sup.id} value={sup.id!}>{sup.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem> )} />
                          <FormField control={supplierInvoiceForm.control} name="invoiceDate" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>تاريخ الفاتورة</FormLabel>
                                <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                          <FormField control={supplierInvoiceForm.control} name="dueDate" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                                <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                        </div>
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                              {suppInvItemsFields.map((item, index) => (
                              <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                  <FormField control={supplierInvoiceForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                      <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الصنف</FormLabel>
                                      <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { supplierInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); supplierInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(supplierInvoiceForm, index); }} value={field.value} dir="rtl">
                                          <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                          <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}</SelectContent>
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
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSuppInvItem(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                              </div> ))}
                          </ScrollArea>
                          <Button type="button" variant="outline" onClick={() => appendSuppInvItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
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
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برقم الفاتورة أو المورد..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead>رقم الفاتورة</TableHead><TableHead>أمر الشراء</TableHead><TableHead>المورد</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead><TableHead>الاستحقاق</TableHead><TableHead>الإجمالي</TableHead>
                      <TableHead>حالة الدفع</TableHead><TableHead className="text-center">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {supplierInvoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell>{inv.poId || "-"}</TableCell>
                        <TableCell>{suppliersData.find(s=>s.id === inv.supplierId)?.name || inv.supplierId}</TableCell>
                        <TableCell>{formatDateForDisplay(inv.invoiceDate)}</TableCell>
                        <TableCell>{formatDateForDisplay(inv.dueDate)}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(inv.totalAmount) }}></TableCell>
                        <TableCell><Badge variant={inv.status === "مدفوع" ? "default" : inv.status === "غير مدفوع" ? "destructive" : "secondary"} className="whitespace-nowrap">{inv.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={()=> handleViewSupplierInvoice(inv)}><Eye className="h-4 w-4" /></Button>
                           {inv.status !== "مدفوع" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-green-600" title="تسجيل دفعة" onClick={() => openRecordPaymentDialogForSupplier(inv)}><DollarSign className="h-4 w-4" /></Button>}
                           <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف فاتورة المورد {inv.id} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteSupplierInvoice(inv.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goodsReceivedNotes">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>عمليات الاستلام (GRN)</CardTitle>
                    <CardDescription>تسجيل ومتابعة البضائع والخدمات المستلمة من الموردين.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showCreateGrnDialog} onOpenChange={(isOpen) => { setShowCreateGrnDialog(isOpen); if (!isOpen) {setGrnToEdit(null); setSelectedPoForGrn(null);} }}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setGrnToEdit(null); setSelectedPoForGrn(null); grnForm.reset({ poId: '', supplierId: '', grnDate: new Date(), items: [{itemId: '', description: '', orderedQuantity: 0, receivedQuantity:0}], status: "مستلم جزئياً" }); setShowCreateGrnDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إنشاء إذن استلام جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl" dir="rtl">
                            <DialogHeader>
                                <DialogTitle>{grnToEdit ? 'تعديل إذن استلام' : 'إنشاء إذن استلام جديد'}</DialogTitle>
                                {selectedPoForGrn && <DialogDescriptionComponent>إذن استلام لأمر الشراء: {selectedPoForGrn.id}</DialogDescriptionComponent>}
                            </DialogHeader>
                            <Form {...grnForm}>
                                <form onSubmit={grnForm.handleSubmit(handleGrnSubmit)} className="space-y-4">
                                    <FormField control={grnForm.control} name="poId" render={({ field }) => (
                                        <FormItem><FormLabel>أمر الشراء</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                const po = purchaseOrders.find(p => p.id === value);
                                                if (po) {
                                                    setSelectedPoForGrn(po);
                                                    grnForm.setValue("supplierId", po.supplierId);
                                                    const grnItems = po.items.map(item => ({
                                                        itemId: item.itemId,
                                                        description: item.description || mockItems.find(i=>i.id===item.itemId)?.name || "",
                                                        orderedQuantity: item.quantity,
                                                        receivedQuantity: 0,
                                                        notes: "",
                                                    }));
                                                    replaceGrnItems(grnItems);
                                                } else {
                                                    setSelectedPoForGrn(null);
                                                     grnForm.setValue("supplierId", "");
                                                    replaceGrnItems([]);
                                                }
                                            }} value={field.value} dir="rtl" disabled={!!selectedPoForGrn}>
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر الشراء" /></SelectTrigger></FormControl>
                                            <SelectContent>{purchaseOrders.filter(po=> po.status === "معتمد" || po.status === "مستلم جزئياً").map(po => <SelectItem key={po.id} value={po.id!}>{po.id} ({suppliersData.find(s=>s.id === po.supplierId)?.name})</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem> )} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={grnForm.control} name="supplierId" render={({ field }) => (
                                            <FormItem><FormLabel>المورد</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled>
                                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                                <SelectContent>{suppliersData.map(sup => <SelectItem key={sup.id} value={sup.id!}>{sup.name}</SelectItem>)}</SelectContent>
                                                </Select><FormMessage /></FormItem> )} />
                                        <FormField control={grnForm.control} name="grnDate" render={({ field }) => (
                                            <FormItem className="flex flex-col"><FormLabel>تاريخ الاستلام</FormLabel>
                                                <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    </div>
                                    <ScrollArea className="h-[250px] border rounded-md p-2">
                                        {grnItemsFields.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                            <div className="col-span-12 sm:col-span-4">
                                                <Label className="text-xs">الصنف</Label>
                                                <Input value={mockItems.find(i => i.id === grnForm.getValues(`items.${index}.itemId`))?.name || grnForm.getValues(`items.${index}.description`)} readOnly className="bg-muted h-9 text-xs"/>
                                            </div>
                                            <FormField control={grnForm.control} name={`items.${index}.orderedQuantity`} render={({ field }) => (
                                                <FormItem className="col-span-4 sm:col-span-2"><FormLabel className="text-xs">الكمية المطلوبة</FormLabel>
                                                <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                                <FormMessage className="text-xs"/></FormItem> )} />
                                            <FormField control={grnForm.control} name={`items.${index}.receivedQuantity`} render={({ field }) => (
                                                <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">الكمية المستلمة</FormLabel>
                                                <FormControl><Input type="number" {...field} className="bg-background h-9 text-xs" max={grnForm.getValues(`items.${index}.orderedQuantity`)} /></FormControl>
                                                <FormMessage className="text-xs"/></FormItem> )} />
                                            <FormField control={grnForm.control} name={`items.${index}.notes`} render={({ field }) => (
                                                <FormItem className="col-span-4 sm:col-span-3"><FormLabel className="text-xs">ملاحظات</FormLabel>
                                                <FormControl><Input {...field} className="bg-background h-9 text-xs" /></FormControl>
                                                <FormMessage className="text-xs"/></FormItem> )} />
                                        </div> ))}
                                    </ScrollArea>
                                     <FormField control={grnForm.control} name="notes" render={({ field }) => (
                                        <FormItem><FormLabel>ملاحظات عامة على الاستلام</FormLabel>
                                            <FormControl><Textarea placeholder="أية ملاحظات أخرى..." {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                                    <DialogFooter>
                                    <Button type="submit">{grnToEdit ? 'حفظ التعديلات' : 'حفظ إذن الاستلام'}</Button>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث برقم الاستلام أو أمر الشراء..." className="pr-10 w-full sm:w-72 bg-background" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader><TableRow><TableHead>رقم الاستلام</TableHead><TableHead>أمر الشراء</TableHead><TableHead>المورد</TableHead><TableHead>تاريخ الاستلام</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {goodsReceivedNotes.map((grn) => (
                        <TableRow key={grn.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{grn.id}</TableCell>
                            <TableCell>{grn.poId}</TableCell>
                            <TableCell>{suppliersData.find(s=>s.id === grn.supplierId)?.name || grn.supplierId}</TableCell>
                            <TableCell>{formatDateForDisplay(grn.grnDate)}</TableCell>
                            <TableCell><Badge variant={grn.status === "مستلم بالكامل" ? "default" : "secondary"} className="whitespace-nowrap">{grn.status}</Badge></TableCell>
                            <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewGrn(grn)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintGrn(grn)}><Printer className="h-4 w-4"/></Button>
                             <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف إذن الاستلام {grn.id} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteGrn(grn.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </TabsContent>

         <TabsContent value="purchaseReturns">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>مرتجعات المشتريات</CardTitle>
              <CardDescription>إدارة عمليات إرجاع البضائع للموردين وتسوية الحسابات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showCreatePurchaseReturnDialog} onOpenChange={(isOpen) => { setShowCreatePurchaseReturnDialog(isOpen); if(!isOpen) setPurchaseReturnToEdit(null); }}>
                  <DialogTrigger asChild>
                    <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setPurchaseReturnToEdit(null); purchaseReturnForm.reset({ supplierId: '', date: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason:''}], status: "مسودة" }); setShowCreatePurchaseReturnDialog(true);}}>
                        <PlusCircle className="me-2 h-4 w-4" /> إنشاء مرتجع مشتريات جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{purchaseReturnToEdit ? 'تعديل مرتجع مشتريات' : 'إنشاء مرتجع مشتريات جديد'}</DialogTitle>
                    </DialogHeader>
                    <Form {...purchaseReturnForm}>
                      <form onSubmit={purchaseReturnForm.handleSubmit(handlePurchaseReturnSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <FormField control={purchaseReturnForm.control} name="supplierId" render={({ field }) => (
                              <FormItem><FormLabel>المورد</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                  <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                  <SelectContent>{suppliersData.map(sup => <SelectItem key={sup.id} value={sup.id!}>{sup.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem> )} />
                           <FormField control={purchaseReturnForm.control} name="date" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>تاريخ المرتجع</FormLabel>
                                <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                        </div>
                         <FormField control={purchaseReturnForm.control} name="originalInvoiceId" render={({ field }) => (
                            <FormItem><FormLabel>الفاتورة الأصلية (اختياري)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفاتورة الأصلية إن وجدت" /></SelectTrigger></FormControl>
                                <SelectContent>{supplierInvoices.map(inv => <SelectItem key={inv.id} value={inv.id!}>{inv.id} ({suppliersData.find(s=>s.id === inv.supplierId)?.name})</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem> )} />
                        <ScrollArea className="h-[250px] border rounded-md p-2">
                              {returnItemsFields.map((item, index) => (
                              <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-2 p-1 border-b">
                                  <FormField control={purchaseReturnForm.control} name={`items.${index}.itemId`} render={({ field }) => (
                                      <FormItem className="col-span-12 sm:col-span-3"><FormLabel className="text-xs">الصنف</FormLabel>
                                      <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { purchaseReturnForm.setValue(`items.${index}.unitPrice`, selectedItem.price); purchaseReturnForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(purchaseReturnForm, index); }} value={field.value} dir="rtl">
                                          <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl>
                                          <SelectContent>{mockItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}</SelectContent>
                                      </Select><FormMessage className="text-xs"/></FormItem> )} />
                                  <FormField control={purchaseReturnForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                      <FormItem className="col-span-3 sm:col-span-2"><FormLabel className="text-xs">الكمية</FormLabel>
                                      <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(purchaseReturnForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                      <FormMessage className="text-xs"/></FormItem> )} />
                                  <FormField control={purchaseReturnForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                                      <FormItem className="col-span-3 sm:col-span-2"><FormLabel className="text-xs">السعر</FormLabel>
                                      <FormControl><Input type="number" {...field} onChange={e => {field.onChange(e); calculateItemTotalForForm(purchaseReturnForm, index);}} className="bg-background h-9 text-xs" /></FormControl>
                                      <FormMessage className="text-xs"/></FormItem> )} />
                                    <FormField control={purchaseReturnForm.control} name={`items.${index}.reason`} render={({ field }) => (
                                      <FormItem className="col-span-6 sm:col-span-3"><FormLabel className="text-xs">سبب الإرجاع</FormLabel>
                                      <FormControl><Input placeholder="مثال: تالف، غير مطابق" {...field} className="bg-background h-9 text-xs" /></FormControl>
                                      <FormMessage className="text-xs"/></FormItem> )} />
                                  <FormField control={purchaseReturnForm.control} name={`items.${index}.total`} render={({ field }) => (
                                      <FormItem className="col-span-6 sm:col-span-2"><FormLabel className="text-xs">الإجمالي</FormLabel>
                                      <FormControl><Input type="number" {...field} readOnly className="bg-muted h-9 text-xs" /></FormControl>
                                      <FormMessage className="text-xs"/></FormItem> )} />
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeReturnItem(index)} className="col-span-12 sm:col-span-1 self-end h-9 w-full sm:w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                              </div> ))}
                          </ScrollArea>
                          <Button type="button" variant="outline" onClick={() => appendReturnItem({itemId: '', description: '', quantity:1, unitPrice:0, total:0, reason:''})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة صنف</Button>
                          <FormField control={purchaseReturnForm.control} name="notes" render={({ field }) => (
                              <FormItem><FormLabel>ملاحظات</FormLabel>
                                <FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter>
                          <Button type="submit">{purchaseReturnToEdit ? 'حفظ التعديلات' : 'حفظ المرتجع'}</Button>
                          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في المرتجعات..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead>رقم المرتجع</TableHead><TableHead>المورد</TableHead><TableHead>التاريخ</TableHead>
                      <TableHead>الفاتورة الأصلية</TableHead><TableHead>الإجمالي</TableHead><TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {purchaseReturns.map((pr) => (
                      <TableRow key={pr.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{pr.id}</TableCell>
                        <TableCell>{suppliersData.find(s=>s.id === pr.supplierId)?.name || pr.supplierId}</TableCell>
                        <TableCell>{formatDateForDisplay(pr.date)}</TableCell>
                        <TableCell>{pr.originalInvoiceId || "-"}</TableCell>
                        <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(pr.totalAmount) }}></TableCell>
                        <TableCell><Badge variant={pr.status === "معتمد" || pr.status === "معالج" ? "default" : "outline"} className="whitespace-nowrap">{pr.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => handleViewPurchaseReturn(pr)}><Eye className="h-4 w-4" /></Button>
                           {pr.status === "مسودة" && (<>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setPurchaseReturnToEdit(pr); setShowCreatePurchaseReturnDialog(true);}}><Edit className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-green-600" title="اعتماد" onClick={() => { setPurchaseReturnsData(prev => prev.map(r => r.id === pr.id ? {...r, status: "معتمد"} : r)); toast({title:"تم الاعتماد"}); }}><CheckCircle className="h-4 w-4" /></Button>
                           </>)}
                           {pr.status !== "معالج" && pr.status !== "ملغي" && <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف المرتجع {pr.id} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeletePurchaseReturn(pr.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintReturn(pr)}><Printer className="h-4 w-4"/></Button>
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

      {/* View Purchase Order Dialog */}
      <Dialog open={showViewPoDialog} onOpenChange={setShowViewPoDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر الشراء: {selectedPoForView?.id}</DialogTitle>
          </DialogHeader>
          {selectedPoForView && (
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="py-4 space-y-3 text-sm">
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <p><strong>رقم الأمر:</strong> {selectedPoForView.id}</p>
                    <p><strong>المورد:</strong> {suppliersData.find(s => s.id === selectedPoForView.supplierId)?.name}</p>
                    <p><strong>تاريخ الأمر:</strong> {formatDateForDisplay(selectedPoForView.date)}</p>
                    <p><strong>التسليم المتوقع:</strong> {formatDateForDisplay(selectedPoForView.expectedDeliveryDate)}</p>
                    <p><strong>الإجمالي:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedPoForView.totalAmount) }}></span></p>
                    <p><strong>الحالة:</strong> <Badge variant={selectedPoForView.status === "معتمد" ? "default" : "outline"}>{selectedPoForView.status}</Badge></p>
                    <p><strong>ملاحظات:</strong> {selectedPoForView.notes || "لا يوجد"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">الأصناف المطلوبة</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    {selectedPoForView.items.length > 0 ? (
                      <Table size="sm">
                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية</TableHead><TableHead className="text-center">سعر الوحدة</TableHead><TableHead className="text-left">الإجمالي</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {selectedPoForView.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mockItems.find(mi => mi.id === item.itemId)?.name || item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(item.unitPrice) }}></TableCell>
                              <TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(item.total) }}></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">لا توجد أصناف في أمر الشراء هذا.</p>}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Supplier Invoice Dialog */}
      <Dialog open={showViewSupplierInvoiceDialog} onOpenChange={setShowViewSupplierInvoiceDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل فاتورة المورد: {selectedSupplierInvoiceForView?.id}</DialogTitle>
          </DialogHeader>
          {selectedSupplierInvoiceForView && (
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="py-4 space-y-3 text-sm">
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">معلومات الفاتورة</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <p><strong>رقم الفاتورة:</strong> {selectedSupplierInvoiceForView.id}</p>
                    <p><strong>المورد:</strong> {selectedSupplierInvoiceForView.supplierName || selectedSupplierInvoiceForView.supplierId}</p>
                    {selectedSupplierInvoiceForView.poId && <p><strong>أمر الشراء المرتبط:</strong> {selectedSupplierInvoiceForView.poId}</p>}
                    <p><strong>تاريخ الفاتورة:</strong> {formatDateForDisplay(selectedSupplierInvoiceForView.invoiceDate)}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> {formatDateForDisplay(selectedSupplierInvoiceForView.dueDate)}</p>
                    <p><strong>الإجمالي:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedSupplierInvoiceForView.totalAmount) }}></span></p>
                     <p><strong>المدفوع:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedSupplierInvoiceForView.paidAmount || 0) }}></span></p>
                    <p><strong>الحالة:</strong> <Badge variant={selectedSupplierInvoiceForView.status === "مدفوع" ? "default" : "destructive"}>{selectedSupplierInvoiceForView.status}</Badge></p>
                    <p><strong>ملاحظات:</strong> {selectedSupplierInvoiceForView.notes || "لا يوجد"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">بنود الفاتورة</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    {selectedSupplierInvoiceForView.items.length > 0 ? (
                      <Table size="sm">
                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية</TableHead><TableHead className="text-center">سعر الوحدة</TableHead><TableHead className="text-left">الإجمالي</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {selectedSupplierInvoiceForView.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mockItems.find(mi => mi.id === item.itemId)?.name || item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(item.unitPrice) }}></TableCell>
                              <TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(item.total) }}></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">لا توجد أصناف في هذه الفاتورة.</p>}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Record Payment for Supplier Invoice Dialog */}
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة لفاتورة مورد: {supplierInvoiceToPay?.id}</DialogTitle>
            <DialogDescriptionComponent>الفاتورة بمبلغ <span dangerouslySetInnerHTML={{ __html: formatCurrency(supplierInvoiceToPay?.totalAmount || 0) }}></span>، متبقي منها <span dangerouslySetInnerHTML={{ __html: formatCurrency((supplierInvoiceToPay?.totalAmount || 0) - (supplierInvoiceToPay?.paidAmount || 0)) }}></span>.</DialogDescriptionComponent>
          </DialogHeader>
          <Form {...supplierPaymentForm}>
            <form onSubmit={supplierPaymentForm.handleSubmit(handleRecordSupplierPaymentSubmit)} className="space-y-4 py-4">
              <FormField control={supplierPaymentForm.control} name="paymentAmount" render={({ field }) => (
                <FormItem><FormLabel>مبلغ الدفعة</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-background" max={(supplierInvoiceToPay?.totalAmount || 0) - (supplierInvoiceToPay?.paidAmount || 0)} /></FormControl>
                  <FormMessage /></FormItem>)} />
              <FormField control={supplierPaymentForm.control} name="paymentDate" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>تاريخ الدفعة</FormLabel>
                  <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
              <FormField control={supplierPaymentForm.control} name="paymentMethod" render={({ field }) => (
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

       {/* View GRN Dialog */}
      <Dialog open={showViewGrnDialog} onOpenChange={setShowViewGrnDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل إذن الاستلام: {selectedGrnForView?.id}</DialogTitle>
          </DialogHeader>
          {selectedGrnForView && (
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="py-4 space-y-3 text-sm">
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">معلومات إذن الاستلام</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <p><strong>رقم إذن الاستلام:</strong> {selectedGrnForView.id}</p>
                    <p><strong>أمر الشراء:</strong> {selectedGrnForView.poId}</p>
                    <p><strong>المورد:</strong> {selectedGrnForView.supplierName || selectedGrnForView.supplierId}</p>
                    <p><strong>تاريخ الاستلام:</strong> {formatDateForDisplay(selectedGrnForView.grnDate)}</p>
                    <p><strong>الحالة:</strong> <Badge variant={selectedGrnForView.status === "مستلم بالكامل" ? "default" : "secondary"}>{selectedGrnForView.status}</Badge></p>
                    <p><strong>المستلم:</strong> {selectedGrnForView.receivedBy || "غير محدد"}</p>
                    <p><strong>ملاحظات:</strong> {selectedGrnForView.notes || "لا يوجد"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">الأصناف المستلمة</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    {selectedGrnForView.items.length > 0 ? (
                      <Table size="sm">
                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية المطلوبة</TableHead><TableHead className="text-center">الكمية المستلمة</TableHead><TableHead>ملاحظات الصنف</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {selectedGrnForView.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mockItems.find(mi => mi.id === item.itemId)?.name || item.description}</TableCell>
                              <TableCell className="text-center">{item.orderedQuantity}</TableCell>
                              <TableCell className="text-center">{item.receivedQuantity}</TableCell>
                              <TableCell>{item.notes || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">لا توجد أصناف في إذن الاستلام هذا.</p>}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print GRN Dialog */}
      <Dialog open={showPrintGrnDialog} onOpenChange={setShowPrintGrnDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden"><DialogTitle>طباعة إذن استلام بضاعة: {selectedGrnForPrint?.id}</DialogTitle></DialogHeader>
          {selectedGrnForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="delivery note layout">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> <p className="text-xs">الرياض</p> </div> </div>
                <div className="text-left"> <h3 className="text-md font-semibold">إذن استلام بضاعة (GRN)</h3> <p className="text-xs mt-1">الرقم: {selectedGrnForPrint.id}</p> <p className="text-xs">التاريخ: {formatDateForDisplay(selectedGrnForPrint.grnDate)}</p> <p className="text-xs">أمر شراء: {selectedGrnForPrint.poId}</p></div>
              </div>
              <p className="mb-2 text-xs"><strong>المورد:</strong> {selectedGrnForPrint.supplierName || selectedGrnForPrint.supplierId}</p>
              <Table size="sm" className="mb-6"><TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية المطلوبة</TableHead><TableHead className="text-center">الكمية المستلمة</TableHead><TableHead>ملاحظات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedGrnForPrint.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{mockItems.find(i=>i.id === item.itemId)?.name || item.description}</TableCell>
                      <TableCell className="text-center">{item.orderedQuantity}</TableCell>
                      <TableCell className="text-center">{item.receivedQuantity}</TableCell>
                      <TableCell>{item.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedGrnForPrint.notes && <p className="text-xs mb-4"><strong>ملاحظات عامة:</strong> {selectedGrnForPrint.notes}</p>}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">أمين المستودع (المستلم)</p><p>{selectedGrnForPrint.receivedBy || "........................."}</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">ممثل المورد (المسلم)</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print-block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Purchase Return Dialog */}
      <Dialog open={showViewPurchaseReturnDialog} onOpenChange={setShowViewPurchaseReturnDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل مرتجع مشتريات: {selectedPurchaseReturnForView?.id}</DialogTitle>
          </DialogHeader>
          {selectedPurchaseReturnForView && (
            <ScrollArea className="max-h-[70vh] p-1">
              <div className="py-4 space-y-3 text-sm">
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">معلومات المرتجع</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1">
                    <p><strong>رقم المرتجع:</strong> {selectedPurchaseReturnForView.id}</p>
                    <p><strong>المورد:</strong> {selectedPurchaseReturnForView.supplierName || selectedPurchaseReturnForView.supplierId}</p>
                    <p><strong>تاريخ المرتجع:</strong> {formatDateForDisplay(selectedPurchaseReturnForView.date)}</p>
                    {selectedPurchaseReturnForView.originalInvoiceId && <p><strong>الفاتورة الأصلية:</strong> {selectedPurchaseReturnForView.originalInvoiceId}</p>}
                    <p><strong>الإجمالي:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedPurchaseReturnForView.totalAmount) }}></span></p>
                    <p><strong>الحالة:</strong> <Badge variant={selectedPurchaseReturnForView.status === "معتمد" ? "default" : "outline"}>{selectedPurchaseReturnForView.status}</Badge></p>
                    <p><strong>ملاحظات:</strong> {selectedPurchaseReturnForView.notes || "لا يوجد"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-2"><CardTitle className="text-base">الأصناف المرتجعة</CardTitle></CardHeader>
                  <CardContent className="p-2">
                    {selectedPurchaseReturnForView.items.length > 0 ? (
                      <Table size="sm">
                        <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية</TableHead><TableHead className="text-center">سعر الوحدة</TableHead><TableHead className="text-left">الإجمالي</TableHead><TableHead>سبب الإرجاع</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {selectedPurchaseReturnForView.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{mockItems.find(mi => mi.id === item.itemId)?.name || item.description}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(item.unitPrice) }}></TableCell>
                              <TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(item.total) }}></TableCell>
                              <TableCell>{item.reason || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : <p className="text-muted-foreground">لا توجد أصناف في هذا المرتجع.</p>}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Print Purchase Order Dialog */}
      <Dialog open={showPrintPoDialog} onOpenChange={setShowPrintPoDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden"><DialogTitle>طباعة أمر شراء: {selectedPoForPrint?.id}</DialogTitle></DialogHeader>
          {selectedPoForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="purchase order layout">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> <p className="text-xs">الرياض، المملكة العربية السعودية</p><p className="text-xs">الرقم الضريبي: 300012345600003</p> </div> </div>
                <div className="text-left"> <h3 className="text-xl font-semibold text-primary">أمر شراء</h3> <p className="text-xs">Purchase Order</p> <p className="text-sm mt-1"><strong>رقم الأمر:</strong> {selectedPoForPrint.id}</p> <p className="text-sm"><strong>التاريخ:</strong> {formatDateForDisplay(selectedPoForPrint.date)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div><h4 className="font-semibold mb-1 text-sm">معلومات المورد:</h4><p><strong>{selectedPoForPrint.supplierName || selectedPoForPrint.supplierId}</strong></p></div>
                <div><h4 className="font-semibold mb-1 text-sm">معلومات الشحن والتسليم:</h4><p><strong>تاريخ التسليم المتوقع:</strong> {formatDateForDisplay(selectedPoForPrint.expectedDeliveryDate)}</p></div>
              </div>
              <Table size="sm" className="mb-6"><TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية</TableHead><TableHead className="text-center">سعر الوحدة</TableHead><TableHead className="text-left">الإجمالي</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedPoForPrint.items.map((item, index) => (
                    <TableRow key={index}><TableCell>{mockItems.find(i=>i.id === item.itemId)?.name || item.description}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(item.unitPrice) }}></TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(item.total) }}></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-base border-t pt-2 mt-2 text-primary"><span>إجمالي أمر الشراء:</span><span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedPoForPrint.totalAmount) }}></span></div>
                </div>
              </div>
              {selectedPoForPrint.notes && <div className="text-xs mb-6"><p><strong>ملاحظات:</strong> {selectedPoForPrint.notes}</p></div>}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">إعداد: قسم المشتريات</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">اعتماد: الإدارة المالية</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print-block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Purchase Return Dialog */}
      <Dialog open={showPrintReturnDialog} onOpenChange={setShowPrintReturnDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl"> 
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة إشعار مرتجع مشتريات: {selectedReturnForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedReturnForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="return note layout">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> <p className="text-xs">الرياض - المملكة العربية السعودية</p> </div> </div>
                <div className="text-left"> <h3 className="text-md font-semibold">إشعار مرتجع مشتريات</h3> <p className="text-xs">Purchase Return Note</p> <p className="text-xs mt-1">الرقم: {selectedReturnForPrint.id}</p> <p className="text-xs">التاريخ: {new Date(selectedReturnForPrint.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p> </div>
              </div>
              <div className="mb-6 text-xs">
                <p className="mb-2"><strong>إلى السيد/السادة:</strong> {selectedReturnForPrint.supplierName || selectedReturnForPrint.supplierId}</p>
                {selectedReturnForPrint.originalInvoiceId && <p className="mb-2"><strong>بالإشارة إلى الفاتورة رقم:</strong> {selectedReturnForPrint.originalInvoiceId}</p>}
                <p className="mb-2">نود إبلاغكم بإرجاع الأصناف التالية:</p>
              </div>
              <Table size="sm" className="mb-6">
                <TableHeader><TableRow><TableHead>الصنف</TableHead><TableHead className="text-center">الكمية</TableHead><TableHead className="text-center">سعر الوحدة</TableHead><TableHead className="text-left">الإجمالي</TableHead><TableHead>سبب الإرجاع</TableHead></TableRow></TableHeader>
                <TableBody>
                  {selectedReturnForPrint.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{mockItems.find(i=>i.id === item.itemId)?.name || item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center" dangerouslySetInnerHTML={{ __html: formatCurrency(item.unitPrice) }}></TableCell>
                      <TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(item.total) }}></TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1 text-primary">
                    <span>إجمالي قيمة المرتجع:</span>
                    <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedReturnForPrint.totalAmount) }}></span>
                  </div>
                </div>
              </div>
              <div className="mb-6 text-xs p-2 border rounded-md bg-muted/30">
                <p data-ai-hint="amount words"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedReturnForPrint.totalAmount)}</p>
              </div>
              {selectedReturnForPrint.notes && <div className="text-xs mb-6"><p><strong>ملاحظات:</strong> {selectedReturnForPrint.notes}</p></div>}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">إعداد: قسم المشتريات</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">اعتماد: مدير المخازن/المالية</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print-block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    
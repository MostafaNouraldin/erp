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
import { Briefcase, FilePlus, FileCheck, PackageSearch, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Eye, MinusCircle, Printer, DollarSign, Truck } from "lucide-react";
import AppLogo from '@/components/app-logo';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// Mock data (can be replaced with API calls)
const mockSuppliers = [
  { id: "SUP001", name: "مورد التقنية الحديثة" },
  { id: "SUP002", name: "مورد المواد الخام" },
  { id: "SUP003", name: "مورد الخدمات اللوجستية" },
  { id: "SUP004", name: "مورد الأثاث المكتبي" },
];

const mockItems = [
    {id: "ITEM001", name: "لابتوب Dell XPS 15", price: 5800, unit: "قطعة"}, 
    {id: "ITEM002", name: "شاشة 27 بوصة", price: 800, unit: "قطعة"},
    {id: "ITEM003", name: "ورق طباعة A4 (صندوق)", price: 120, unit: "صندوق"},
    {id: "SERV001", name: "خدمة شحن دولي", price: 500, unit: "خدمة"},
    {id: "MAT001", name: "خشب زان", price: 200, unit: "متر مكعب"},
];


// Schemas
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
  status: z.enum(["غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"]).default("غير مدفوع"),
  notes: z.string().optional(),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

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
  receivedBy: z.string().optional(), // User who received
});
type GoodsReceivedNoteFormValues = z.infer<typeof goodsReceivedNoteSchema>;

// Initial Data
const initialPurchaseOrdersData: PurchaseOrderFormValues[] = [
  { id: "PO001", supplierId: "SUP001", date: new Date("2024-07-10"), expectedDeliveryDate: new Date("2024-07-25"), totalAmount: 30000, status: "معتمد", items: [{itemId: "ITEM001", quantity:5, unitPrice:6000, total:30000}]},
  { id: "PO002", supplierId: "SUP002", date: new Date("2024-07-15"), expectedDeliveryDate: new Date("2024-08-01"), totalAmount: 18000, status: "مسودة", items: [] },
];
const initialSupplierInvoicesData: SupplierInvoiceFormValues[] = [
  { id: "INV-S001", poId: "PO001", supplierId: "SUP001", invoiceDate: new Date("2024-07-26"), dueDate: new Date("2024-08-26"), totalAmount: 30000, status: "غير مدفوع", items: [{itemId:"ITEM001", quantity:5, unitPrice:6000, total:30000}] },
];
const initialGoodsReceivedNotesData: GoodsReceivedNoteFormValues[] = [
  { id: "GRN001", poId: "PO001", supplierId: "SUP001", grnDate: new Date("2024-07-25"), items: [{ itemId: "ITEM001", orderedQuantity: 5, receivedQuantity: 5, description: "لابتوبات Dell" }], status: "مستلم بالكامل", receivedBy: "أحمد" },
];


export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrdersData] = useState(initialPurchaseOrdersData);
  const [supplierInvoices, setSupplierInvoicesData] = useState(initialSupplierInvoicesData);
  const [goodsReceivedNotes, setGoodsReceivedNotesData] = useState(initialGoodsReceivedNotesData);

  const [showCreatePoDialog, setShowCreatePoDialog] = useState(false);
  const [poToEdit, setPoToEdit] = useState<PurchaseOrderFormValues | null>(null);
  
  const [showCreateSupplierInvoiceDialog, setShowCreateSupplierInvoiceDialog] = useState(false);
  const [supplierInvoiceToEdit, setSupplierInvoiceToEdit] = useState<SupplierInvoiceFormValues | null>(null);

  const [showCreateGrnDialog, setShowCreateGrnDialog] = useState(false);
  const [grnToEdit, setGrnToEdit] = useState<GoodsReceivedNoteFormValues | null>(null);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<PurchaseOrderFormValues | null>(null);


  const { toast } = useToast();

  const poForm = useForm<PurchaseOrderFormValues>({ resolver: zodResolver(purchaseOrderSchema) });
  const { fields: poItemsFields, append: appendPoItem, remove: removePoItem } = useFieldArray({ control: poForm.control, name: "items" });

  const supplierInvoiceForm = useForm<SupplierInvoiceFormValues>({ resolver: zodResolver(supplierInvoiceSchema) });
  const { fields: suppInvItemsFields, append: appendSuppInvItem, remove: removeSuppInvItem } = useFieldArray({ control: supplierInvoiceForm.control, name: "items" });


  const grnForm = useForm<GoodsReceivedNoteFormValues>({ resolver: zodResolver(goodsReceivedNoteSchema) });
  const { fields: grnItemsFields, append: appendGrnItem, remove: removeGrnItem, replace: replaceGrnItems } = useFieldArray({ control: grnForm.control, name: "items" });


  useEffect(() => {
    if (poToEdit) poForm.reset(poToEdit);
    else poForm.reset({ supplierId: '', date: new Date(), expectedDeliveryDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "مسودة" });
  }, [poToEdit, poForm, showCreatePoDialog]);

  useEffect(() => {
    if (supplierInvoiceToEdit) supplierInvoiceForm.reset(supplierInvoiceToEdit);
    else supplierInvoiceForm.reset({ supplierId: '', invoiceDate: new Date(), dueDate: new Date(), items: [{itemId: '', description: '', quantity:1, unitPrice:0, total:0}], status: "غير مدفوع" });
  }, [supplierInvoiceToEdit, supplierInvoiceForm, showCreateSupplierInvoiceDialog]);

  useEffect(() => {
    if (grnToEdit) {
        grnForm.reset(grnToEdit);
    } else if (selectedPoForGrn) {
        const grnItems = selectedPoForGrn.items.map(item => ({
            itemId: item.itemId,
            description: item.description || mockItems.find(i=>i.id===item.itemId)?.name || "",
            orderedQuantity: item.quantity,
            receivedQuantity: 0, // Default to 0, user will fill this
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


  const calculateItemTotalForForm = (form: any, index: number) => {
    const quantity = form.getValues(`items.${index}.quantity`);
    const unitPrice = form.getValues(`items.${index}.unitPrice`);
    form.setValue(`items.${index}.total`, quantity * unitPrice);
  };

  const calculateTotalAmountForForm = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handlePoSubmit = (values: PurchaseOrderFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = {...values, totalAmount};
    if (poToEdit) {
      setPurchaseOrdersData(prev => prev.map(p => p.id === poToEdit.id ? { ...finalValues, id: poToEdit.id! } : p));
      toast({ title: "تم التعديل", description: "تم تعديل أمر الشراء." });
    } else {
      setPurchaseOrdersData(prev => [...prev, { ...finalValues, id: `PO${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء أمر الشراء." });
    }
    setShowCreatePoDialog(false);
    setPoToEdit(null);
  };

  const handleSupplierInvoiceSubmit = (values: SupplierInvoiceFormValues) => {
    const totalAmount = calculateTotalAmountForForm(values.items);
    const finalValues = {...values, totalAmount};
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
  
  const handleGrnSubmit = (values: GoodsReceivedNoteFormValues) => {
    // Logic to update PO status based on GRN can be added here
    const po = purchaseOrders.find(p => p.id === values.poId);
    if (po) {
        const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalReceivedInThisGrn = values.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
        // This is a simplified check; a more robust check would sum up all GRNs for this PO
        const newPoStatus = totalReceivedInThisGrn >= totalOrdered ? "مستلم بالكامل" as const : "مستلم جزئياً" as const;
        const newGrnStatus = values.items.every(item => item.receivedQuantity >= (po.items.find(poItem => poItem.itemId === item.itemId)?.quantity || 0)) ? "مستلم بالكامل" as const : "مستلم جزئياً" as const;
        
        if(po.status !== "مستلم بالكامل") { // Only update PO if not already fully received
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


  const handleDeletePo = (poId: string) => {
      setPurchaseOrdersData(prev => prev.filter(p => p.id !== poId));
      toast({title: "تم الحذف", description: `تم حذف أمر الشراء ${poId}`, variant:"destructive"});
  }
  const handleDeleteSupplierInvoice = (invId: string) => {
      setSupplierInvoicesData(prev => prev.filter(inv => inv.id !== invId));
      toast({title: "تم الحذف", description: `تم حذف فاتورة المورد ${invId}`, variant:"destructive"});
  }
   const handleDeleteGrn = (grnId: string) => {
      setGoodsReceivedNotesData(prev => prev.filter(grn => grn.id !== grnId));
      toast({title: "تم الحذف", description: `تم حذف إذن الاستلام ${grnId}`, variant:"destructive"});
  }


  const handleApprovePo = (poId: string) => {
      setPurchaseOrdersData(prev => prev.map(p => p.id === poId ? {...p, status: "معتمد"} : p));
      toast({title: "تم الاعتماد", description: `تم اعتماد أمر الشراء ${poId}.`});
  }

  const openCreateGrnDialogFromPo = (po: PurchaseOrderFormValues) => {
    setSelectedPoForGrn(po);
    setGrnToEdit(null); // Ensure we are not editing
    setShowCreateGrnDialog(true);
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المشتريات</h1>
        <div className="flex gap-2">
            <Dialog open={showCreatePoDialog} onOpenChange={(isOpen) => { setShowCreatePoDialog(isOpen); if(!isOpen) setPoToEdit(null); }}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setPoToEdit(null); poForm.reset(); setShowCreatePoDialog(true);}}>
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر شراء جديد
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                              <SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
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
                                  <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { poForm.setValue(`items.${index}.unitPrice`, selectedItem.price); poForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(poForm, index); }} defaultValue={field.value} dir="rtl">
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

      <Tabs defaultValue="purchaseOrders" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md" dir="rtl">
          <TabsTrigger value="purchaseOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> أوامر الشراء (PO)
          </TabsTrigger>
          <TabsTrigger value="supplierInvoices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileCheck className="inline-block me-2 h-4 w-4" /> فواتير الموردين
          </TabsTrigger>
          <TabsTrigger value="goodsReceivedNotes" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <PackageSearch className="inline-block me-2 h-4 w-4" /> عمليات الاستلام (GRN)
          </TabsTrigger>
        </TabsList>

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
                        <TableCell>{mockSuppliers.find(s=>s.id === po.supplierId)?.name || po.supplierId}</TableCell>
                        <TableCell>{po.date.toLocaleDateString('ar-SA', {calendar:'gregory'})}</TableCell>
                        <TableCell>{po.expectedDeliveryDate.toLocaleDateString('ar-SA', {calendar:'gregory'})}</TableCell>
                        <TableCell>{po.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell><Badge variant={po.status === "معتمد" || po.status === "مستلم بالكامل" ? "default" : po.status === "ملغي" ? "destructive" : "outline"} className="whitespace-nowrap">{po.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => toast({title: `عرض أمر ${po.id}`})}><Eye className="h-4 w-4" /></Button>
                          {po.status === "مسودة" && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setPoToEdit(po); setShowCreatePoDialog(true);}}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-green-600" title="اعتماد" onClick={() => handleApprovePo(po.id!)}><CheckCircle className="h-4 w-4" /></Button>
                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>سيتم حذف أمر الشراء {po.id} نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeletePo(po.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                          </>)}
                          {po.status === "معتمد" && (<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-blue-600" title="تسجيل استلام" onClick={() => openCreateGrnDialogFromPo(po)}><Truck className="h-4 w-4" /></Button>)}
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة"><Printer className="h-4 w-4"/></Button>
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
                    <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setSupplierInvoiceToEdit(null); supplierInvoiceForm.reset(); setShowCreateSupplierInvoiceDialog(true);}}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                              <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر الشراء" /></SelectTrigger></FormControl>
                              <SelectContent>{purchaseOrders.filter(po=>po.status === "معتمد" || po.status === "مستلم جزئياً" || po.status === "مستلم بالكامل").map(po => <SelectItem key={po.id} value={po.id!}>{po.id} ({mockSuppliers.find(s=>s.id === po.supplierId)?.name})</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={supplierInvoiceForm.control} name="supplierId" render={({ field }) => (
                              <FormItem><FormLabel>المورد</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                  <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                  <SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
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
                                      <Select onValueChange={(value) => { field.onChange(value); const selectedItem = mockItems.find(i => i.id === value); if (selectedItem) { supplierInvoiceForm.setValue(`items.${index}.unitPrice`, selectedItem.price); supplierInvoiceForm.setValue(`items.${index}.description`, selectedItem.name); } calculateItemTotalForForm(supplierInvoiceForm, index); }} defaultValue={field.value} dir="rtl">
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
                        <TableCell>{mockSuppliers.find(s=>s.id === inv.supplierId)?.name || inv.supplierId}</TableCell>
                        <TableCell>{inv.invoiceDate.toLocaleDateString('ar-SA', {calendar:'gregory'})}</TableCell>
                        <TableCell>{inv.dueDate.toLocaleDateString('ar-SA', {calendar:'gregory'})}</TableCell>
                        <TableCell>{inv.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell><Badge variant={inv.status === "مدفوع" ? "default" : "destructive"} className="whitespace-nowrap">{inv.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض"><Eye className="h-4 w-4" /></Button>
                           {inv.status === "غير مدفوع" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-green-600" title="تسجيل دفعة"><DollarSign className="h-4 w-4" /></Button>}
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
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setGrnToEdit(null); setSelectedPoForGrn(null); grnForm.reset(); setShowCreateGrnDialog(true);}}>
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
                                                    replaceGrnItems(grnItems); // use replace from useFieldArray
                                                } else {
                                                    setSelectedPoForGrn(null);
                                                     grnForm.setValue("supplierId", "");
                                                    replaceGrnItems([]);
                                                }
                                            }} value={field.value} dir="rtl" disabled={!!selectedPoForGrn}>
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر الشراء" /></SelectTrigger></FormControl>
                                            <SelectContent>{purchaseOrders.filter(po=> po.status === "معتمد" || po.status === "مستلم جزئياً").map(po => <SelectItem key={po.id} value={po.id!}>{po.id} ({mockSuppliers.find(s=>s.id === po.supplierId)?.name})</SelectItem>)}</SelectContent>
                                            </Select><FormMessage /></FormItem> )} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={grnForm.control} name="supplierId" render={({ field }) => (
                                            <FormItem><FormLabel>المورد</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled>
                                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
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
                            <TableCell>{mockSuppliers.find(s=>s.id === grn.supplierId)?.name || grn.supplierId}</TableCell>
                            <TableCell>{grn.grnDate.toLocaleDateString('ar-SA', {calendar:'gregory'})}</TableCell>
                            <TableCell><Badge variant={grn.status === "مستلم بالكامل" ? "default" : "secondary"} className="whitespace-nowrap">{grn.status}</Badge></TableCell>
                            <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => toast({title:`عرض تفاصيل ${grn.id}`})}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة"><Printer className="h-4 w-4"/></Button>
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
    </div>
  );
}

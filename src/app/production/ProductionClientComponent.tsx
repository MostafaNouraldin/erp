
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cog, ListChecks, CalendarClock, ShieldCheck, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, Settings2, Eye, MinusCircle, XCircle, Factory, PauseCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { WorkOrderFormValues, BomFormValues, ProductionPlanFormValues, QualityCheckFormValues } from './actions';
import { addWorkOrder, updateWorkOrder, deleteWorkOrder, addProductionLog, addBom, updateBom, deleteBom, addProductionPlan, updateProductionPlan, deleteProductionPlan, addQualityCheck, updateQualityCheck, deleteQualityCheck } from './actions';


interface ProductionLogEntry {
  date: Date;
  quantityProduced: number;
  notes?: string;
}

interface Product {
    id: string;
    name: string;
    isRawMaterial?: boolean;
    unit?: string;
}

interface User {
    id: string;
    name: string;
}

interface ProductionClientComponentProps {
    initialData: {
        products: Product[],
        workOrders: (WorkOrderFormValues & { productionLog: ProductionLogEntry[] })[],
        boms: BomFormValues[],
        productionPlans: ProductionPlanFormValues[],
        qualityChecks: QualityCheckFormValues[],
        users: User[],
    }
}


const recordProductionOutputSchema = z.object({
    quantityProducedThisBatch: z.coerce.number().min(0.01, "الكمية المنتجة يجب أن تكون أكبر من صفر"),
    productionDate: z.date({required_error: "تاريخ الإنتاج مطلوب"}),
    notes: z.string().optional(),
});
type RecordProductionOutputFormValues = z.infer<typeof recordProductionOutputSchema>;


export default function ProductionClientComponent({initialData}: ProductionClientComponentProps) {
  const [workOrders, setWorkOrders] = useState(initialData.workOrders);
  const [boms, setBoms] = useState(initialData.boms);
  const [productionPlans, setProductionPlans] = useState(initialData.productionPlans);
  const [qualityChecks, setQualityChecks] = useState(initialData.qualityChecks);
  const [products, setProducts] = useState(initialData.products);
  const [users, setUsers] = useState(initialData.users);
  
  const [showManageWorkOrderDialog, setShowManageWorkOrderDialog] = useState(false);
  const [workOrderToEdit, setWorkOrderToEdit] = useState<WorkOrderFormValues | null>(null);
  const [showViewWorkOrderDialog, setShowViewWorkOrderDialog] = useState(false);
  const [selectedWorkOrderForView, setSelectedWorkOrderForView] = useState<(WorkOrderFormValues & { productionLog: ProductionLogEntry[] }) | null>(null);
  const [showRecordProductionDialog, setShowRecordProductionDialog] = useState(false);
  const [workOrderToRecordProductionFor, setWorkOrderToRecordProductionFor] = useState<WorkOrderFormValues | null>(null);


  const [showManageBomDialog, setShowManageBomDialog] = useState(false);
  const [bomToEdit, setBomToEdit] = useState<BomFormValues | null>(null);
  const [showViewBomDialog, setShowViewBomDialog] = useState(false);
  const [selectedBomForView, setSelectedBomForView] = useState<BomFormValues | null>(null);

  const [showManageProductionPlanDialog, setShowManageProductionPlanDialog] = useState(false);
  const [productionPlanToEdit, setProductionPlanToEdit] = useState<ProductionPlanFormValues | null>(null);
  const [showViewProductionPlanDialog, setShowViewProductionPlanDialog] = useState(false);
  const [selectedProductionPlanForView, setSelectedProductionPlanForView] = useState<ProductionPlanFormValues | null>(null);
  
  const [showManageQualityCheckDialog, setShowManageQualityCheckDialog] = useState(false);
  const [qualityCheckToEdit, setQualityCheckToEdit] = useState<QualityCheckFormValues | null>(null);
  const [showViewQualityCheckDialog, setShowViewQualityCheckDialog] = useState(false);
  const [selectedQualityCheckForView, setSelectedQualityCheckForView] = useState<QualityCheckFormValues | null>(null);

  const { toast } = useToast();

  const workOrderSchema = z.object({
    id: z.string().optional(),
    productId: z.string().min(1, "المنتج مطلوب"),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
    producedQuantity: z.coerce.number().min(0).default(0),
    startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
    endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
    notes: z.string().optional(),
    status: z.enum(["مجدول", "قيد التنفيذ", "متوقف مؤقتاً", "مكتمل", "ملغي"]).default("مجدول"),
    progress: z.coerce.number().min(0).max(100).default(0),
  });

  const bomItemSchema = z.object({
      materialId: z.string().min(1, "المادة الخام مطلوبة"),
      quantity: z.coerce.number().min(0.01, "الكمية يجب أن تكون أكبر من صفر"),
  });
  const bomSchema = z.object({
      id: z.string().optional(),
      productId: z.string().min(1, "المنتج النهائي مطلوب"),
      version: z.string().min(1, "الإصدار مطلوب"),
      items: z.array(bomItemSchema).min(1, "يجب إضافة مادة خام واحدة على الأقل"),
      lastUpdated: z.date().optional(),
  });

  const productionPlanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الخطة مطلوب"),
    startDate: z.date({ required_error: "تاريخ بدء الخطة مطلوب" }),
    endDate: z.date({ required_error: "تاريخ انتهاء الخطة مطلوب" }),
    status: z.enum(["مسودة", "نشطة", "مكتملة", "ملغاة"]).default("مسودة"),
    notes: z.string().optional(),
  });
  
  const qualityCheckSchema = z.object({
    id: z.string().optional(),
    workOrderId: z.string().min(1, "أمر العمل مطلوب"),
    checkPoint: z.string().min(1, "نقطة الفحص مطلوبة"),
    result: z.enum(["ناجح", "فاشل", "ناجح مع ملاحظات"], { required_error: "نتيجة الفحص مطلوبة" }),
    date: z.date({ required_error: "تاريخ الفحص مطلوب" }),
    inspectorId: z.string().min(1, "المفتش مطلوب"),
    notes: z.string().optional(),
  });


  const workOrderForm = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { startDate: new Date(), endDate: new Date(), quantity: 1, status: "مجدول", progress: 0, producedQuantity: 0 },
  });
  const recordProductionOutputForm = useForm<RecordProductionOutputFormValues>({
    resolver: zodResolver(recordProductionOutputSchema),
    defaultValues: { productionDate: new Date(), quantityProducedThisBatch: 0 }
  });

  const bomForm = useForm<BomFormValues>({
    resolver: zodResolver(bomSchema),
    defaultValues: { items: [{materialId: '', quantity: 1}] },
  });
  const { fields: bomItemsFields, append: appendBomItem, remove: removeBomItem } = useFieldArray({
    control: bomForm.control, name: "items",
  });

  const productionPlanForm = useForm<ProductionPlanFormValues>({
    resolver: zodResolver(productionPlanSchema),
    defaultValues: { startDate: new Date(), endDate: new Date(), status: "مسودة" },
  });

  const qualityCheckForm = useForm<QualityCheckFormValues>({
    resolver: zodResolver(qualityCheckSchema),
    defaultValues: { date: new Date() },
  });

  const selectedProductForWOBOM = workOrderForm.watch("productId");
  const bomForSelectedProductInWOForm = boms.find(b => b.productId === selectedProductForWOBOM);


  useEffect(() => {
    setWorkOrders(initialData.workOrders);
    setBoms(initialData.boms);
    setProductionPlans(initialData.productionPlans);
    setQualityChecks(initialData.qualityChecks);
    setProducts(initialData.products);
    setUsers(initialData.users);
  }, [initialData]);

  useEffect(() => {
    if (workOrderToEdit) workOrderForm.reset({...workOrderToEdit, startDate: new Date(workOrderToEdit.startDate), endDate: new Date(workOrderToEdit.endDate)});
    else workOrderForm.reset({ productId: '', quantity: 1, startDate: new Date(), endDate: new Date(), status: "مجدول", progress: 0, producedQuantity:0, notes: '' });
  }, [workOrderToEdit, workOrderForm, showManageWorkOrderDialog]);

  useEffect(() => {
    if (bomToEdit) bomForm.reset({...bomToEdit, lastUpdated: bomToEdit.lastUpdated ? new Date(bomToEdit.lastUpdated) : undefined});
    else bomForm.reset({ productId: '', version: '1.0', items: [{materialId: '', quantity: 1}] });
  }, [bomToEdit, bomForm, showManageBomDialog]);
  
  useEffect(() => {
    if (productionPlanToEdit) productionPlanForm.reset({...productionPlanToEdit, startDate: new Date(productionPlanToEdit.startDate), endDate: new Date(productionPlanToEdit.endDate)});
    else productionPlanForm.reset({ name: '', startDate: new Date(), endDate: new Date(), status: "مسودة", notes: '' });
  }, [productionPlanToEdit, productionPlanForm, showManageProductionPlanDialog]);

  useEffect(() => {
    if (qualityCheckToEdit) qualityCheckForm.reset({...qualityCheckToEdit, date: new Date(qualityCheckToEdit.date)});
    else qualityCheckForm.reset({ workOrderId: '', checkPoint: '', result: undefined, date: new Date(), inspectorId: '', notes: '' });
  }, [qualityCheckToEdit, qualityCheckForm, showManageQualityCheckDialog]);

  useEffect(() => {
    if (workOrderToRecordProductionFor) {
        recordProductionOutputForm.reset({ productionDate: new Date(), quantityProducedThisBatch: 0, notes: '' });
    }
  }, [workOrderToRecordProductionFor, recordProductionOutputForm, showRecordProductionDialog]);


  const handleWorkOrderSubmit = async (values: WorkOrderFormValues) => {
    try {
      if (workOrderToEdit) {
        await updateWorkOrder({ ...values, id: workOrderToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل أمر العمل." });
      } else {
        await addWorkOrder(values);
        toast({ title: "تم الإنشاء", description: "تم إنشاء أمر العمل." });
      }
      setShowManageWorkOrderDialog(false);
      setWorkOrderToEdit(null);
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم حفظ أمر العمل.", variant: "destructive" });
    }
  };

  const handleRecordProductionOutputSubmit = async (values: RecordProductionOutputFormValues) => {
    if (!workOrderToRecordProductionFor || !workOrderToRecordProductionFor.id) return;
    try {
        await addProductionLog(workOrderToRecordProductionFor.id, {
            date: values.productionDate,
            quantityProduced: values.quantityProducedThisBatch,
            notes: values.notes,
        });
        toast({ title: "تم التسجيل", description: "تم تسجيل الإنتاج بنجاح." });
        setShowRecordProductionDialog(false);
        setWorkOrderToRecordProductionFor(null);
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم تسجيل الإنتاج.", variant: "destructive" });
    }
  };
  
  const handleWorkOrderStatusUpdate = async (workOrderId: string, newStatus: WorkOrderFormValues["status"]) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) return;
    try {
      await updateWorkOrder({ ...workOrder, status: newStatus });
      toast({ title: "تم تحديث الحالة", description: `تم تحديث حالة أمر العمل إلى "${newStatus}".` });
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم تحديث الحالة.", variant: "destructive" });
    }
  };


  const handleCancelWorkOrder = async (workOrderId: string) => {
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    if (!workOrder) return;
    try {
      await updateWorkOrder({ ...workOrder, status: "ملغي" });
      toast({ title: "تم الإلغاء", description: "تم إلغاء أمر العمل.", variant: "destructive" });
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم إلغاء أمر العمل.", variant: "destructive" });
    }
  };
  
  const handleViewWorkOrder = (wo: WorkOrderFormValues & { productionLog: ProductionLogEntry[] }) => {
    setSelectedWorkOrderForView(wo);
    setShowViewWorkOrderDialog(true);
  };


  const handleBomSubmit = async (values: BomFormValues) => {
    try {
      if (bomToEdit) {
        await updateBom({ ...values, id: bomToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل قائمة المواد." });
      } else {
        await addBom(values);
        toast({ title: "تم الإنشاء", description: "تم إنشاء قائمة المواد." });
      }
      setShowManageBomDialog(false);
      setBomToEdit(null);
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم حفظ قائمة المواد.", variant: "destructive" });
    }
  };

  const handleDeleteBom = async (bomId: string) => {
    try {
      await deleteBom(bomId);
      toast({ title: "تم الحذف", description: "تم حذف قائمة المواد.", variant: "destructive" });
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم حذف قائمة المواد.", variant: "destructive" });
    }
  };

  const handleViewBom = (bom: BomFormValues) => {
    setSelectedBomForView(bom);
    setShowViewBomDialog(true);
  };
  
  const handleProductionPlanSubmit = async (values: ProductionPlanFormValues) => {
    try {
      if (productionPlanToEdit) {
        await updateProductionPlan({ ...values, id: productionPlanToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل خطة الإنتاج." });
      } else {
        await addProductionPlan(values);
        toast({ title: "تم الإنشاء", description: "تم إنشاء خطة الإنتاج." });
      }
      setShowManageProductionPlanDialog(false);
      setProductionPlanToEdit(null);
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم حفظ خطة الإنتاج.", variant: "destructive" });
    }
  };
  
  const handleViewProductionPlan = (plan: ProductionPlanFormValues) => {
    setSelectedProductionPlanForView(plan);
    setShowViewProductionPlanDialog(true);
  };

  const handleQualityCheckSubmit = async (values: QualityCheckFormValues) => {
    try {
      if (qualityCheckToEdit) {
        await updateQualityCheck({ ...values, id: qualityCheckToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل فحص الجودة." });
      } else {
        await addQualityCheck(values);
        toast({ title: "تم التسجيل", description: "تم تسجيل فحص الجودة." });
      }
      setShowManageQualityCheckDialog(false);
      setQualityCheckToEdit(null);
    } catch(e) {
      toast({ title: "خطأ", description: "لم يتم حفظ فحص الجودة.", variant: "destructive" });
    }
  };
  
  const handleViewQualityCheck = (qc: QualityCheckFormValues) => {
    setSelectedQualityCheckForView(qc);
    setShowViewQualityCheckDialog(true);
  };

  const handleDeleteWorkOrderAction = async (id: string) => {
    try {
        await deleteWorkOrder(id);
        toast({ title: "تم الحذف", description: "تم حذف أمر العمل.", variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف أمر العمل.", variant: "destructive" });
    }
  }

  const handleDeletePlanAction = async (id: string) => {
    try {
        await deleteProductionPlan(id);
        toast({ title: "تم الحذف", description: "تم حذف خطة الإنتاج.", variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف خطة الإنتاج.", variant: "destructive" });
    }
  }

  const handleDeleteQualityCheckAction = async (id: string) => {
    try {
        await deleteQualityCheck(id);
        toast({ title: "تم الحذف", description: "تم حذف فحص الجودة.", variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف فحص الجودة.", variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الإنتاج والتصنيع</h1>
        <Dialog open={showManageWorkOrderDialog} onOpenChange={(isOpen) => { setShowManageWorkOrderDialog(isOpen); if(!isOpen) setWorkOrderToEdit(null);}}>
            <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setWorkOrderToEdit(null); workOrderForm.reset({ productId: '', quantity: 1, startDate: new Date(), endDate: new Date(), status: "مجدول", progress: 0, producedQuantity:0, notes: '' }); setShowManageWorkOrderDialog(true); }}>
                  <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر عمل جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{workOrderToEdit ? "تعديل أمر عمل" : "إنشاء أمر عمل جديد"}</DialogTitle>
                </DialogHeader>
                <Form {...workOrderForm}>
                    <form onSubmit={workOrderForm.handleSubmit(handleWorkOrderSubmit)} className="space-y-4 py-4">
                       <ScrollArea className="max-h-[70vh] p-1">
                        <FormField control={workOrderForm.control} name="productId" render={({ field }) => (
                            <FormItem><FormLabel>المنتج</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المنتج" /></SelectTrigger></FormControl>
                                    <SelectContent>{products.filter(p => !p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                </Select><FormMessage /></FormItem> )} />
                        <FormField control={workOrderForm.control} name="quantity" render={({ field }) => (
                            <FormItem><FormLabel>الكمية المطلوبة</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={workOrderForm.control} name="startDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel>
                                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                            <FormField control={workOrderForm.control} name="endDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء المتوقع</FormLabel>
                                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                        </div>
                         <FormField control={workOrderForm.control} name="notes" render={({ field }) => (
                            <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية..." {...field} className="bg-background text-right" /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={workOrderForm.control} name="status" render={({ field }) => (
                            <FormItem><FormLabel>الحالة</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="مجدول">مجدول</SelectItem>
                                        <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                                        <SelectItem value="متوقف مؤقتاً">متوقف مؤقتاً</SelectItem>
                                        <SelectItem value="مكتمل">مكتمل</SelectItem>
                                        <SelectItem value="ملغي">ملغي</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem> )} />
                        
                        {selectedProductForWOBOM && (
                            <Card className="mt-4 bg-muted/50">
                                <CardHeader className="p-3"><CardTitle className="text-sm">قائمة المواد للمنتج: {products.find(p=>p.id === selectedProductForWOBOM)?.name}</CardTitle></CardHeader>
                                <CardContent className="p-3 text-xs">
                                    {bomForSelectedProductInWOForm ? (
                                        <ul className="list-disc ps-5">
                                            {bomForSelectedProductInWOForm.items.map(item => {
                                                const material = products.find(m => m.id === item.materialId);
                                                return <li key={item.materialId}>{material?.name || item.materialId}: {item.quantity} {material?.unit || ""}</li>
                                            })}
                                        </ul>
                                    ) : <p className="text-muted-foreground">لا توجد قائمة مواد معرفة لهذا المنتج.</p>}
                                </CardContent>
                            </Card>
                        )}
                        </ScrollArea>
                        <DialogFooter>
                            <Button type="submit">{workOrderToEdit ? "حفظ التعديلات" : "حفظ أمر العمل"}</Button>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="workOrders" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="workOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Cog className="inline-block me-2 h-4 w-4" /> أوامر العمل
          </TabsTrigger>
          <TabsTrigger value="boms" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListChecks className="inline-block me-2 h-4 w-4" /> قائمة المواد (BOM)
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CalendarClock className="inline-block me-2 h-4 w-4" /> تخطيط الإنتاج
          </TabsTrigger>
          <TabsTrigger value="qualityControl" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShieldCheck className="inline-block me-2 h-4 w-4" /> مراقبة الجودة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة أوامر العمل</CardTitle>
              <CardDescription>تتبع أوامر العمل، حالة الإنتاج، والكميات المطلوبة والمنتجة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في أوامر العمل..." className="pr-10 w-full sm:w-64 bg-background" />
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
                    <DropdownMenuCheckboxItem>مجدول</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد التنفيذ</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متوقف مؤقتاً</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مكتمل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية (المطلوبة/المنتجة)</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => (
                      <TableRow key={wo.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{wo.id}</TableCell>
                        <TableCell>{products.find(p => p.id === wo.productId)?.name || wo.productId}</TableCell>
                        <TableCell>{wo.quantity} / {wo.producedQuantity}</TableCell>
                        <TableCell>{new Date(wo.startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{new Date(wo.endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              wo.status === "مكتمل" ? "default" :
                              wo.status === "قيد التنفيذ" ? "secondary" :
                              wo.status === "ملغي" ? "destructive" :
                              "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {wo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Progress value={wo.progress} aria-label={`${wo.progress}%`} className="h-2 w-24" />
                                <span className="text-xs text-muted-foreground">{wo.progress}%</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewWorkOrder(wo as any)}> <Eye className="h-4 w-4" /> </Button>
                          {wo.status !== "مكتمل" && wo.status !== "ملغي" && ( <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setWorkOrderToEdit(wo); setShowManageWorkOrderDialog(true); }}> <Edit className="h-4 w-4" /> </Button>
                            {wo.status === "مجدول" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="بدء التنفيذ" onClick={() => handleWorkOrderStatusUpdate(wo.id!, "قيد التنفيذ")}> <PlayCircle className="h-4 w-4 text-green-600" /> </Button>}
                            {wo.status === "قيد التنفيذ" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إيقاف مؤقت" onClick={() => handleWorkOrderStatusUpdate(wo.id!, "متوقف مؤقتاً")}> <PauseCircle className="h-4 w-4 text-yellow-600" /> </Button>}
                            {wo.status === "متوقف مؤقتاً" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="استئناف التنفيذ" onClick={() => handleWorkOrderStatusUpdate(wo.id!, "قيد التنفيذ")}> <PlayCircle className="h-4 w-4 text-green-600" /> </Button>}
                            {(wo.status === "قيد التنفيذ" || wo.status === "متوقف مؤقتاً" || wo.status === "مجدول") && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل إنتاج" onClick={() => {setWorkOrderToRecordProductionFor(wo); setShowRecordProductionDialog(true);}}> <Factory className="h-4 w-4 text-blue-600" /> </Button>}
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إلغاء الأمر"><XCircle className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الإلغاء</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من إلغاء أمر العمل "{wo.id}"؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>تراجع</AlertDialogCancel><AlertDialogAction onClick={() => handleCancelWorkOrder(wo.id!)} className={buttonVariants({variant:"destructive"})}>تأكيد الإلغاء</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                          </>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boms">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المواد (Bill of Materials)</CardTitle>
              <CardDescription>إدارة مكونات المنتجات وتكاليفها وتحديثات الإصدارات.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showManageBomDialog} onOpenChange={(isOpen) => { setShowManageBomDialog(isOpen); if(!isOpen) setBomToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setBomToEdit(null); bomForm.reset({ productId: '', version: '1.0', items: [{materialId: '', quantity: 1}] }); setShowManageBomDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> إنشاء قائمة مواد جديدة
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl" dir="rtl">
                        <DialogHeader><DialogTitle>{bomToEdit ? "تعديل قائمة المواد" : "إنشاء قائمة مواد جديدة"}</DialogTitle></DialogHeader>
                        <Form {...bomForm}>
                            <form onSubmit={bomForm.handleSubmit(handleBomSubmit)} className="space-y-4 py-4">
                              <ScrollArea className="max-h-[60vh] p-1">
                                <FormField control={bomForm.control} name="productId" render={({ field }) => (
                                    <FormItem><FormLabel>المنتج النهائي</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المنتج" /></SelectTrigger></FormControl>
                                            <SelectContent>{products.filter(p => !p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={bomForm.control} name="version" render={({ field }) => (
                                    <FormItem><FormLabel>إصدار القائمة</FormLabel><FormControl><Input placeholder="مثال: 1.0 أو 2.1" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                
                                <FormLabel className="block pt-2">المواد الخام المكونة</FormLabel>
                                {bomItemsFields.map((item, index) => (
                                <Card key={item.id} className="p-3 space-y-2 bg-muted/20">
                                    <div className="grid grid-cols-12 gap-2 items-end">
                                        <FormField control={bomForm.control} name={`items.${index}.materialId`} render={({ field }) => (
                                            <FormItem className="col-span-6"><FormLabel className="text-xs">المادة الخام</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                                                <SelectContent>{products.filter(p => p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={bomForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                            <FormItem className="col-span-4"><FormLabel className="text-xs">الكمية</FormLabel>
                                            <FormControl><Input type="number" {...field} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeBomItem(index)} className="col-span-2 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                    </div>
                                </Card>))}
                                <Button type="button" variant="outline" onClick={() => appendBomItem({materialId: '', quantity:1})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة مادة</Button>
                                </ScrollArea>
                                <DialogFooter>
                                    <Button type="submit">{bomToEdit ? "حفظ التعديلات" : "حفظ القائمة"}</Button>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث باسم المنتج أو المادة..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف القائمة</TableHead>
                      <TableHead>المنتج النهائي</TableHead>
                      <TableHead>الإصدار</TableHead>
                      <TableHead>عدد المواد</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{bom.id}</TableCell>
                        <TableCell>{products.find(p=>p.id === bom.productId)?.name || bom.productId}</TableCell>
                        <TableCell>{bom.version}</TableCell>
                        <TableCell>{bom.items.length}</TableCell>
                        <TableCell>{bom.lastUpdated?.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewBom(bom)}> <Eye className="h-4 w-4" /> </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل القائمة" onClick={() => {setBomToEdit(bom); setShowManageBomDialog(true);}}> <Edit className="h-4 w-4" /> </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف القائمة"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف قائمة المواد للمنتج "{products.find(p=>p.id === bom.productId)?.name || bom.productId}" (إصدار {bom.version})؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>تراجع</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteBom(bom.id!)} className={buttonVariants({variant:"destructive"})}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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
        
        <TabsContent value="planning">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>تخطيط موارد الإنتاج (MRP)</CardTitle>
              <CardDescription>جدولة الإنتاج، إدارة الطلب على المواد، وتخطيط السعة الإنتاجية.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showManageProductionPlanDialog} onOpenChange={(isOpen) => { setShowManageProductionPlanDialog(isOpen); if(!isOpen) setProductionPlanToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setProductionPlanToEdit(null); productionPlanForm.reset({ name: '', startDate: new Date(), endDate: new Date(), status: "مسودة", notes: '' }); setShowManageProductionPlanDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> إنشاء خطة إنتاج جديدة
                        </Button>
                    </DialogTrigger>
                     <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader><DialogTitle>{productionPlanToEdit ? "تعديل خطة الإنتاج" : "إنشاء خطة إنتاج جديدة"}</DialogTitle></DialogHeader>
                        <Form {...productionPlanForm}>
                            <form onSubmit={productionPlanForm.handleSubmit(handleProductionPlanSubmit)} className="space-y-4 py-4">
                                <FormField control={productionPlanForm.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>اسم الخطة</FormLabel><FormControl><Input placeholder="مثال: خطة إنتاج شهر سبتمبر" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={productionPlanForm.control} name="startDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={productionPlanForm.control} name="endDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء</FormLabel>
                                            <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={productionPlanForm.control} name="status" render={({ field }) => (
                                    <FormItem><FormLabel>حالة الخطة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="مسودة">مسودة</SelectItem><SelectItem value="نشطة">نشطة</SelectItem>
                                                <SelectItem value="مكتملة">مكتملة</SelectItem><SelectItem value="ملغاة">ملغاة</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={productionPlanForm.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea placeholder="وصف أو تفاصيل الخطة" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                <DialogFooter>
                                    <Button type="submit">{productionPlanToEdit ? "حفظ التعديلات" : "حفظ الخطة"}</Button>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <DatePickerWithPresets mode="range" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف الخطة</TableHead>
                      <TableHead>اسم الخطة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{plan.id}</TableCell>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>{new Date(plan.startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{new Date(plan.endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>
                            <Badge variant={plan.status === "نشطة" ? "default" : plan.status === "مكتملة" ? "secondary" : "outline"}>{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الخطة" onClick={() => handleViewProductionPlan(plan)}> <Eye className="h-4 w-4" /> </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الخطة" onClick={() => {setProductionPlanToEdit(plan); setShowManageProductionPlanDialog(true);}}> <Edit className="h-4 w-4" /> </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" title="حذف الخطة"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف خطة الإنتاج "{plan.name}"؟</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>تراجع</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePlanAction(plan.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter>
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

        <TabsContent value="qualityControl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>مراقبة الجودة</CardTitle>
              <CardDescription>إدارة عمليات فحص الجودة، تسجيل النتائج، وتتبع معايير الجودة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showManageQualityCheckDialog} onOpenChange={(isOpen) => { setShowManageQualityCheckDialog(isOpen); if(!isOpen) setQualityCheckToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setQualityCheckToEdit(null); qualityCheckForm.reset({ workOrderId: '', checkPoint: '', result: undefined, date: new Date(), inspectorId: '', notes: '' }); setShowManageQualityCheckDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> تسجيل فحص جودة جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>{qualityCheckToEdit ? "تعديل فحص جودة" : "تسجيل فحص جودة جديد"}</DialogTitle>
                        </DialogHeader>
                        <Form {...qualityCheckForm}>
                            <form onSubmit={qualityCheckForm.handleSubmit(handleQualityCheckSubmit)} className="space-y-4 py-4">
                                <FormField control={qualityCheckForm.control} name="workOrderId" render={({ field }) => (
                                    <FormItem><FormLabel>أمر العمل</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر العمل" /></SelectTrigger></FormControl>
                                            <SelectContent>{workOrders.map(wo => <SelectItem key={wo.id} value={wo.id!}>{wo.id} ({products.find(p=>p.id === wo.productId)?.name})</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={qualityCheckForm.control} name="checkPoint" render={({ field }) => (
                                    <FormItem><FormLabel>نقطة الفحص</FormLabel><FormControl><Input placeholder="مثال: فحص نهائي للمنتج" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={qualityCheckForm.control} name="result" render={({ field }) => (
                                    <FormItem><FormLabel>نتيجة الفحص</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النتيجة" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="ناجح">ناجح</SelectItem>
                                                <SelectItem value="فاشل">فاشل</SelectItem>
                                                <SelectItem value="ناجح مع ملاحظات">ناجح مع ملاحظات</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={qualityCheckForm.control} name="date" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>تاريخ الفحص</FormLabel>
                                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                <FormField control={qualityCheckForm.control} name="inspectorId" render={({ field }) => (
                                    <FormItem><FormLabel>المفتش</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المفتش" /></SelectTrigger></FormControl>
                                            <SelectContent>{users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                 <FormField control={qualityCheckForm.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea placeholder="أية ملاحظات حول الفحص..." {...field} className="bg-background text-right" /></FormControl><FormMessage /></FormItem> )} />
                                <DialogFooter>
                                    <Button type="submit">{qualityCheckToEdit ? "حفظ التعديلات" : "حفظ الفحص"}</Button>
                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية بنتيجة الفحص
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب النتيجة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>ناجح</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>فاشل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ناجح مع ملاحظات</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف الفحص</TableHead>
                      <TableHead>أمر العمل</TableHead>
                      <TableHead>نقطة الفحص</TableHead>
                       <TableHead>النتيجة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المفتش</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityChecks.map((qc) => (
                      <TableRow key={qc.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{qc.id}</TableCell>
                        <TableCell>{qc.workOrderId}</TableCell>
                        <TableCell>{qc.checkPoint}</TableCell>
                        <TableCell>
                           <Badge
                            variant={qc.result === "ناجح" ? "default" : qc.result === "فاشل" ? "destructive" : "secondary"}
                            className="whitespace-nowrap"
                           >
                            {qc.result}
                           </Badge>
                        </TableCell>
                        <TableCell>{new Date(qc.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{users.find(u => u.id === qc.inspectorId)?.name || qc.inspectorId}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الفحص" onClick={() => handleViewQualityCheck(qc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" title="حذف الفحص"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف فحص الجودة "{qc.id}"؟</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>تراجع</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteQualityCheckAction(qc.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter>
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

      {/* View Work Order Details Dialog */}
      <Dialog open={showViewWorkOrderDialog} onOpenChange={setShowViewWorkOrderDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر العمل: {selectedWorkOrderForView?.id}</DialogTitle>
            <DialogDescriptionComponent>عرض تفاصيل أمر العمل المسجل.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedWorkOrderForView && (
            <ScrollArea className="max-h-[70vh] p-1">
            <div className="py-4 space-y-3 text-sm">
              <Card><CardHeader className="p-2"><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader><CardContent className="p-2 space-y-1">
                <p><strong>رقم الأمر:</strong> {selectedWorkOrderForView.id}</p>
                <p><strong>المنتج:</strong> {products.find(p => p.id === selectedWorkOrderForView.productId)?.name} ({selectedWorkOrderForView.productId})</p>
                <p><strong>الكمية المطلوبة:</strong> {selectedWorkOrderForView.quantity}</p>
                <p><strong>الكمية المنتجة:</strong> {selectedWorkOrderForView.producedQuantity}</p>
                <p><strong>تاريخ البدء:</strong> {new Date(selectedWorkOrderForView.startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                <p><strong>تاريخ الانتهاء المتوقع:</strong> {new Date(selectedWorkOrderForView.endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                <p><strong>الحالة:</strong> <Badge variant={selectedWorkOrderForView.status === "مكتمل" ? "default" : "secondary"}>{selectedWorkOrderForView.status}</Badge></p>
                <p><strong>التقدم:</strong> <Progress value={selectedWorkOrderForView.progress} className="h-2 inline-block w-32 me-2"/> {selectedWorkOrderForView.progress}%</p>
                <p><strong>ملاحظات:</strong> {selectedWorkOrderForView.notes || "لا يوجد"}</p>
              </CardContent></Card>
              
              <Card><CardHeader className="p-2"><CardTitle className="text-base">قائمة المواد (BOM)</CardTitle></CardHeader><CardContent className="p-2">
                {(() => {
                    const bom = boms.find(b => b.productId === selectedWorkOrderForView.productId);
                    if (!bom) return <p className="text-muted-foreground">لا توجد قائمة مواد معرفة لهذا المنتج.</p>;
                    return (
                        <ul className="list-disc ps-5 text-xs space-y-0.5">
                            {bom.items.map(item => {
                                const material = products.find(m => m.id === item.materialId);
                                return <li key={item.materialId}>{material?.name || item.materialId}: {item.quantity} {material?.unit || ""}</li>;
                            })}
                        </ul>
                    );
                })()}
              </CardContent></Card>

              <Card><CardHeader className="p-2"><CardTitle className="text-base">سجل الإنتاج</CardTitle></CardHeader><CardContent className="p-2">
                {selectedWorkOrderForView.productionLog && selectedWorkOrderForView.productionLog.length > 0 ? (
                    <Table size="sm">
                        <TableHeader><TableRow><TableHead className="text-xs p-1">التاريخ</TableHead><TableHead className="text-xs p-1">الكمية المنتجة</TableHead><TableHead className="text-xs p-1">ملاحظات</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {selectedWorkOrderForView.productionLog.map((log, idx) => (
                                <TableRow key={idx}><TableCell className="text-xs p-1">{new Date(log.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell><TableCell className="text-xs p-1">{log.quantityProduced}</TableCell><TableCell className="text-xs p-1">{log.notes || "-"}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : <p className="text-muted-foreground text-xs">لا يوجد سجل إنتاج لهذا الأمر.</p>}
              </CardContent></Card>

              <Card><CardHeader className="p-2"><CardTitle className="text-base">فحوصات الجودة المرتبطة</CardTitle></CardHeader><CardContent className="p-2">
                {qualityChecks.filter(qc => qc.workOrderId === selectedWorkOrderForView.id).length > 0 ? (
                    <ul className="list-disc ps-5 text-xs space-y-0.5">
                        {qualityChecks.filter(qc => qc.workOrderId === selectedWorkOrderForView.id).map(qc => (
                            <li key={qc.id}>{qc.checkPoint} - <Badge variant={qc.result === "ناجح" ? "default" : "destructive"} className="text-xs">{qc.result}</Badge> ({new Date(qc.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })})</li>
                        ))}
                    </ul>
                ) : <p className="text-muted-foreground text-xs">لا توجد فحوصات جودة مسجلة لهذا الأمر.</p>}
              </CardContent></Card>
            </div>
            </ScrollArea>
          )}
          <DialogFooter> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Production Output Dialog */}
      <Dialog open={showRecordProductionDialog} onOpenChange={(isOpen) => {setShowRecordProductionDialog(isOpen); if(!isOpen) setWorkOrderToRecordProductionFor(null);}}>
          <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                  <DialogTitle>تسجيل إنتاج لأمر العمل: {workOrderToRecordProductionFor?.id}</DialogTitle>
                  <DialogDescriptionComponent>الكمية المطلوبة: {workOrderToRecordProductionFor?.quantity}, المنتجة حتى الآن: {workOrderToRecordProductionFor?.producedQuantity}</DialogDescriptionComponent>
              </DialogHeader>
              <Form {...recordProductionOutputForm}>
                  <form onSubmit={recordProductionOutputForm.handleSubmit(handleRecordProductionOutputSubmit)} className="space-y-4 py-4">
                      <FormField control={recordProductionOutputForm.control} name="productionDate" render={({ field }) => (
                          <FormItem className="flex flex-col"><FormLabel>تاريخ الإنتاج</FormLabel>
                              <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                      <FormField control={recordProductionOutputForm.control} name="quantityProducedThisBatch" render={({ field }) => (
                          <FormItem>
                              <FormLabel>الكمية المنتجة في هذه الدفعة</FormLabel>
                              <FormControl><Input type="number" min="0" {...field} className="bg-background"/></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField control={recordProductionOutputForm.control} name="notes" render={({ field }) => (
                          <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage /></FormItem> )} />
                      <DialogFooter>
                          <Button type="submit">تسجيل الإنتاج</Button>
                          <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

       {/* View BOM Details Dialog */}
      <Dialog open={showViewBomDialog} onOpenChange={setShowViewBomDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل قائمة المواد: {products.find(p=>p.id === selectedBomForView?.productId)?.name} (إصدار {selectedBomForView?.version})</DialogTitle>
          </DialogHeader>
          {selectedBomForView && (
            <div className="py-4 space-y-3 text-sm">
              <div><strong>معرف القائمة:</strong> {selectedBomForView.id}</div>
              <div><strong>المنتج النهائي:</strong> {products.find(p=>p.id === selectedBomForView.productId)?.name}</div>
              <div><strong>الإصدار:</strong> {selectedBomForView.version}</div>
              <div><strong>آخر تحديث:</strong> {selectedBomForView.lastUpdated?.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <h4 className="font-semibold pt-2 border-t mt-3">المواد الخام:</h4>
              {selectedBomForView.items.length > 0 ? (
                <Table size="sm">
                  <TableHeader><TableRow><TableHead>المادة</TableHead><TableHead>الكمية</TableHead><TableHead>الوحدة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedBomForView.items.map((item, idx) => {
                        const material = products.find(m => m.id === item.materialId);
                        return (
                        <TableRow key={idx}>
                            <TableCell>{material?.name || item.materialId}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{material?.unit || "-"}</TableCell>
                        </TableRow>
                        );
                    })}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground">لا توجد مواد خام في هذه القائمة.</p>}
            </div>
          )}
          <DialogFooter> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Production Plan Details Dialog */}
      <Dialog open={showViewProductionPlanDialog} onOpenChange={setShowViewProductionPlanDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل خطة الإنتاج: {selectedProductionPlanForView?.name}</DialogTitle>
          </DialogHeader>
          {selectedProductionPlanForView && (
            <div className="py-4 space-y-3 text-sm">
              <div><strong>معرف الخطة:</strong> {selectedProductionPlanForView.id}</div>
              <div><strong>اسم الخطة:</strong> {selectedProductionPlanForView.name}</div>
              <div><strong>تاريخ البدء:</strong> {new Date(selectedProductionPlanForView.startDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>تاريخ الانتهاء:</strong> {new Date(selectedProductionPlanForView.endDate).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>الحالة:</strong> <Badge variant={selectedProductionPlanForView.status === "نشطة" ? "default" : "outline"}>{selectedProductionPlanForView.status}</Badge></div>
              <div><strong>ملاحظات:</strong> {selectedProductionPlanForView.notes || "لا يوجد"}</div>
            </div>
          )}
          <DialogFooter> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* View Quality Check Details Dialog */}
      <Dialog open={showViewQualityCheckDialog} onOpenChange={setShowViewQualityCheckDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل فحص الجودة: {selectedQualityCheckForView?.id}</DialogTitle>
            <DialogDescriptionComponent>عرض تفاصيل الفحص المسجل.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedQualityCheckForView && (
            <div className="py-4 space-y-3 text-sm">
              <div><strong>رقم الفحص:</strong> {selectedQualityCheckForView.id}</div>
              <div><strong>أمر العمل:</strong> {selectedQualityCheckForView.workOrderId} ({products.find(p => p.id === workOrders.find(wo => wo.id === selectedQualityCheckForView.workOrderId)?.productId)?.name})</div>
              <div><strong>نقطة الفحص:</strong> {selectedQualityCheckForView.checkPoint}</div>
              <div><strong>النتيجة:</strong> <Badge variant={selectedQualityCheckForView.result === "ناجح" ? "default" : selectedQualityCheckForView.result === "فاشل" ? "destructive" : "secondary"}>{selectedQualityCheckForView.result}</Badge></div>
              <div><strong>تاريخ الفحص:</strong> {new Date(selectedQualityCheckForView.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>المفتش:</strong> {users.find(u => u.id === selectedQualityCheckForView.inspectorId)?.name}</div>
              <div><strong>ملاحظات:</strong> {selectedQualityCheckForView.notes || "لا يوجد"}</div>
            </div>
          )}
          <DialogFooter> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

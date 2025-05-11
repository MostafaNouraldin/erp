
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
import { Progress } from "@/components/ui/progress";
import { Cog, ListChecks, CalendarClock, ShieldCheck, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, Settings2, Eye, MinusCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockProducts = [
    { id: "PROD-A", name: "منتج ألف (نهائي)", isRawMaterial: false },
    { id: "PROD-B", name: "منتج باء (نهائي)", isRawMaterial: false },
    { id: "PROD-C", name: "منتج جيم (نهائي)", isRawMaterial: false },
    { id: "MAT-X", name: "مادة خام X", isRawMaterial: true, unit: "كجم" },
    { id: "MAT-Y", name: "مادة خام Y", isRawMaterial: true, unit: "لتر" },
    { id: "MAT-Z", name: "مادة خام Z", isRawMaterial: true, unit: "قطعة" },
    { id: "MAT-A", name: "مادة خام A", isRawMaterial: true, unit: "متر" },
];

const mockUsers = [
    { id: "USER-001", name: "أحمد علي" },
    { id: "USER-002", name: "فاطمة محمد" },
];


const initialWorkOrdersData = [
  { id: "WO001", productId: "PROD-A", quantity: 100, startDate: new Date("2024-08-01"), endDate: new Date("2024-08-05"), status: "قيد التنفيذ" as const, progress: 60, notes: "الدفعة الأولى من الطلبية الكبرى" },
  { id: "WO002", productId: "PROD-B", quantity: 250, startDate: new Date("2024-07-20"), endDate: new Date("2024-07-30"), status: "مكتمل" as const, progress: 100, notes: "" },
  { id: "WO003", productId: "PROD-C", quantity: 50, startDate: new Date("2024-08-10"), endDate: new Date("2024-08-15"), status: "مجدول" as const, progress: 0, notes: "إنتاج تجريبي" },
];

const initialBomsData = [
  { id: "BOM001", productId: "PROD-A", version: "1.2", items: [{ materialId: "MAT-X", quantity: 5 }, { materialId: "MAT-Y", quantity: 2 }], lastUpdated: new Date("2024-06-15") },
  { id: "BOM002", productId: "PROD-B", version: "2.0", items: [{ materialId: "MAT-Z", quantity: 10 }, { materialId: "MAT-A", quantity: 3 }], lastUpdated: new Date("2024-05-01") },
];

const initialProductionPlansData = [
  { id: "PLAN001", name: "خطة إنتاج أغسطس", startDate: new Date("2024-08-01"), endDate: new Date("2024-08-31"), status: "نشطة", notes: "خطة شهرية شاملة لجميع المنتجات المطلوبة." },
  { id: "PLAN002", name: "خطة إنتاج الربع الثالث", startDate: new Date("2024-07-01"), endDate: new Date("2024-09-30"), status: "مكتملة", notes: "تم الانتهاء من الخطة بنجاح." },
];

const initialQualityChecksData = [
    { id: "QC001", workOrderId: "WO001", checkPoint: "فحص أولي للمواد", result: "ناجح" as const, date: new Date("2024-08-01"), inspectorId: "USER-001", notes: "جميع المواد مطابقة للمواصفات." },
    { id: "QC002", workOrderId: "WO001", checkPoint: "فحص أثناء العملية (50%)", result: "ناجح" as const, date: new Date("2024-08-03"), inspectorId: "USER-001", notes: "لا توجد عيوب حتى الآن." },
    { id: "QC003", workOrderId: "WO002", checkPoint: "فحص نهائي للمنتج", result: "ناجح مع ملاحظات" as const, date: new Date("2024-07-30"), inspectorId: "USER-002", notes: "خدوش بسيطة على السطح، مقبولة." },
];

// Schemas
const workOrderSchema = z.object({
    id: z.string().optional(),
    productId: z.string().min(1, "المنتج مطلوب"),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
    startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
    endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
    notes: z.string().optional(),
    status: z.enum(["مجدول", "قيد التنفيذ", "متوقف مؤقتاً", "مكتمل", "ملغي"]).default("مجدول"),
    progress: z.coerce.number().min(0).max(100).default(0),
});
type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

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
type BomFormValues = z.infer<typeof bomSchema>;

const productionPlanSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الخطة مطلوب"),
    startDate: z.date({ required_error: "تاريخ بدء الخطة مطلوب" }),
    endDate: z.date({ required_error: "تاريخ انتهاء الخطة مطلوب" }),
    status: z.enum(["مسودة", "نشطة", "مكتملة", "ملغاة"]).default("مسودة"),
    notes: z.string().optional(),
});
type ProductionPlanFormValues = z.infer<typeof productionPlanSchema>;

const qualityCheckSchema = z.object({
    id: z.string().optional(),
    workOrderId: z.string().min(1, "أمر العمل مطلوب"),
    checkPoint: z.string().min(1, "نقطة الفحص مطلوبة"),
    result: z.enum(["ناجح", "فاشل", "ناجح مع ملاحظات"], { required_error: "نتيجة الفحص مطلوبة" }),
    date: z.date({ required_error: "تاريخ الفحص مطلوب" }),
    inspectorId: z.string().min(1, "المفتش مطلوب"),
    notes: z.string().optional(),
});
type QualityCheckFormValues = z.infer<typeof qualityCheckSchema>;

const updateProgressSchema = z.object({
    progress: z.coerce.number().min(0).max(100, "التقدم يجب أن يكون بين 0 و 100"),
});
type UpdateProgressFormValues = z.infer<typeof updateProgressSchema>;


export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState(initialWorkOrdersData);
  const [boms, setBoms] = useState(initialBomsData);
  const [productionPlans, setProductionPlans] = useState(initialProductionPlansData);
  const [qualityChecks, setQualityChecks] = useState(initialQualityChecksData);
  
  const [showManageWorkOrderDialog, setShowManageWorkOrderDialog] = useState(false);
  const [workOrderToEdit, setWorkOrderToEdit] = useState<WorkOrderFormValues | null>(null);
  const [showViewWorkOrderDialog, setShowViewWorkOrderDialog] = useState(false);
  const [selectedWorkOrderForView, setSelectedWorkOrderForView] = useState<WorkOrderFormValues | null>(null);
  const [showUpdateProgressDialog, setShowUpdateProgressDialog] = useState(false);
  const [workOrderToUpdateProgress, setWorkOrderToUpdateProgress] = useState<WorkOrderFormValues | null>(null);


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

  const workOrderForm = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { startDate: new Date(), endDate: new Date(), quantity: 1, status: "مجدول", progress: 0 },
  });
  const updateProgressForm = useForm<UpdateProgressFormValues>({
    resolver: zodResolver(updateProgressSchema),
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

  useEffect(() => {
    if (workOrderToEdit) workOrderForm.reset(workOrderToEdit);
    else workOrderForm.reset({ productId: '', quantity: 1, startDate: new Date(), endDate: new Date(), status: "مجدول", progress: 0, notes: '' });
  }, [workOrderToEdit, workOrderForm, showManageWorkOrderDialog]);

  useEffect(() => {
    if (bomToEdit) bomForm.reset(bomToEdit);
    else bomForm.reset({ productId: '', version: '1.0', items: [{materialId: '', quantity: 1}] });
  }, [bomToEdit, bomForm, showManageBomDialog]);
  
  useEffect(() => {
    if (productionPlanToEdit) productionPlanForm.reset(productionPlanToEdit);
    else productionPlanForm.reset({ name: '', startDate: new Date(), endDate: new Date(), status: "مسودة", notes: '' });
  }, [productionPlanToEdit, productionPlanForm, showManageProductionPlanDialog]);

  useEffect(() => {
    if (qualityCheckToEdit) qualityCheckForm.reset(qualityCheckToEdit);
    else qualityCheckForm.reset({ workOrderId: '', checkPoint: '', result: undefined, date: new Date(), inspectorId: '', notes: '' });
  }, [qualityCheckToEdit, qualityCheckForm, showManageQualityCheckDialog]);

  useEffect(() => {
    if (workOrderToUpdateProgress) updateProgressForm.reset({ progress: workOrderToUpdateProgress.progress });
  }, [workOrderToUpdateProgress, updateProgressForm, showUpdateProgressDialog]);


  const handleWorkOrderSubmit = (values: WorkOrderFormValues) => {
    if (workOrderToEdit) {
      setWorkOrders(prev => prev.map(wo => wo.id === workOrderToEdit.id ? { ...values, id: workOrderToEdit.id } : wo));
      toast({ title: "تم التعديل", description: "تم تعديل أمر العمل بنجاح." });
    } else {
      setWorkOrders(prev => [...prev, { ...values, id: `WO${Date.now().toString().slice(-4)}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء أمر العمل بنجاح." });
    }
    setShowManageWorkOrderDialog(false);
    setWorkOrderToEdit(null);
  };

  const handleUpdateProgressSubmit = (values: UpdateProgressFormValues) => {
    if (workOrderToUpdateProgress) {
        setWorkOrders(prev => prev.map(wo => wo.id === workOrderToUpdateProgress.id ? { ...wo, progress: values.progress } : wo));
        toast({ title: "تم التحديث", description: `تم تحديث تقدم أمر العمل ${workOrderToUpdateProgress.id} إلى ${values.progress}%.` });
    }
    setShowUpdateProgressDialog(false);
    setWorkOrderToUpdateProgress(null);
  };

  const handleCancelWorkOrder = (workOrderId: string) => {
    setWorkOrders(prev => prev.map(wo => wo.id === workOrderId ? { ...wo, status: "ملغي", progress: 0 } : wo));
    toast({ title: "تم الإلغاء", description: `تم إلغاء أمر العمل ${workOrderId}.`, variant: "destructive" });
  };
  
  const handleViewWorkOrder = (wo: WorkOrderFormValues) => {
    setSelectedWorkOrderForView(wo);
    setShowViewWorkOrderDialog(true);
  };


  const handleBomSubmit = (values: BomFormValues) => {
    const finalValues = { ...values, lastUpdated: new Date() };
    if (bomToEdit) {
      setBoms(prev => prev.map(bom => bom.id === bomToEdit.id ? { ...finalValues, id: bomToEdit.id } : bom));
      toast({ title: "تم التعديل", description: "تم تعديل قائمة المواد بنجاح." });
    } else {
      setBoms(prev => [...prev, { ...finalValues, id: `BOM${Date.now().toString().slice(-4)}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء قائمة المواد بنجاح." });
    }
    setShowManageBomDialog(false);
    setBomToEdit(null);
  };

  const handleDeleteBom = (bomId: string) => {
    setBoms(prev => prev.filter(bom => bom.id !== bomId));
    toast({ title: "تم الحذف", description: `تم حذف قائمة المواد ${bomId}.`, variant: "destructive" });
  };

  const handleViewBom = (bom: BomFormValues) => {
    setSelectedBomForView(bom);
    setShowViewBomDialog(true);
  };
  
  const handleProductionPlanSubmit = (values: ProductionPlanFormValues) => {
    if (productionPlanToEdit) {
      setProductionPlans(prev => prev.map(plan => plan.id === productionPlanToEdit.id ? { ...values, id: productionPlanToEdit.id } : plan));
      toast({ title: "تم التعديل", description: "تم تعديل خطة الإنتاج بنجاح." });
    } else {
      setProductionPlans(prev => [...prev, { ...values, id: `PLAN${Date.now().toString().slice(-4)}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء خطة الإنتاج بنجاح." });
    }
    setShowManageProductionPlanDialog(false);
    setProductionPlanToEdit(null);
  };
  
  const handleViewProductionPlan = (plan: ProductionPlanFormValues) => {
    setSelectedProductionPlanForView(plan);
    setShowViewProductionPlanDialog(true);
  };

  const handleQualityCheckSubmit = (values: QualityCheckFormValues) => {
    if (qualityCheckToEdit) {
      setQualityChecks(prev => prev.map(qc => qc.id === qualityCheckToEdit.id ? { ...values, id: qualityCheckToEdit.id } : qc));
      toast({ title: "تم التعديل", description: "تم تعديل فحص الجودة بنجاح." });
    } else {
      setQualityChecks(prev => [...prev, { ...values, id: `QC${Date.now().toString().slice(-4)}` }]);
      toast({ title: "تم التسجيل", description: "تم تسجيل فحص الجودة بنجاح." });
    }
    setShowManageQualityCheckDialog(false);
    setQualityCheckToEdit(null);
  };
  
  const handleViewQualityCheck = (qc: QualityCheckFormValues) => {
    setSelectedQualityCheckForView(qc);
    setShowViewQualityCheckDialog(true);
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الإنتاج والتصنيع</h1>
        <Dialog open={showManageWorkOrderDialog} onOpenChange={(isOpen) => { setShowManageWorkOrderDialog(isOpen); if(!isOpen) setWorkOrderToEdit(null);}}>
            <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setWorkOrderToEdit(null); workOrderForm.reset({ productId: '', quantity: 1, startDate: new Date(), endDate: new Date(), status: "مجدول", progress: 0, notes: '' }); setShowManageWorkOrderDialog(true); }}>
                  <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر عمل جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{workOrderToEdit ? "تعديل أمر عمل" : "إنشاء أمر عمل جديد"}</DialogTitle>
                </DialogHeader>
                <Form {...workOrderForm}>
                    <form onSubmit={workOrderForm.handleSubmit(handleWorkOrderSubmit)} className="space-y-4 py-4">
                        <FormField control={workOrderForm.control} name="productId" render={({ field }) => (
                            <FormItem><FormLabel>المنتج</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المنتج" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockProducts.filter(p => !p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
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
                        <FormField control={workOrderForm.control} name="progress" render={({ field }) => (
                            <FormItem><FormLabel>التقدم (%)</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
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
                      <TableHead>الكمية المطلوبة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء المتوقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => (
                      <TableRow key={wo.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{wo.id}</TableCell>
                        <TableCell>{mockProducts.find(p => p.id === wo.productId)?.name || wo.productId}</TableCell>
                        <TableCell>{wo.quantity}</TableCell>
                        <TableCell>{wo.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{wo.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewWorkOrder(wo)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {wo.status !== "مكتمل" && wo.status !== "ملغي" && (
                            <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setWorkOrderToEdit(wo); setShowManageWorkOrderDialog(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحديث التقدم" onClick={() => {setWorkOrderToUpdateProgress(wo); setShowUpdateProgressDialog(true);}}>
                                <PlayCircle className="h-4 w-4 text-green-600" />
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إلغاء الأمر">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>تأكيد الإلغاء</AlertDialogTitle>
                                        <AlertDialogDescription>هل أنت متأكد من إلغاء أمر العمل "{wo.id}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleCancelWorkOrder(wo.id!)} className={Button({variant:"destructive"})}>تأكيد الإلغاء</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            </>
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
                                <FormField control={bomForm.control} name="productId" render={({ field }) => (
                                    <FormItem><FormLabel>المنتج النهائي</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المنتج" /></SelectTrigger></FormControl>
                                            <SelectContent>{mockProducts.filter(p => !p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={bomForm.control} name="version" render={({ field }) => (
                                    <FormItem><FormLabel>إصدار القائمة</FormLabel><FormControl><Input placeholder="مثال: 1.0 أو 2.1" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                <ScrollArea className="h-[250px] border rounded-md p-2">
                                    {bomItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-2 p-1 border-b">
                                        <FormField control={bomForm.control} name={`items.${index}.materialId`} render={({ field }) => (
                                            <FormItem className="col-span-6"><FormLabel className="text-xs">المادة الخام</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر المادة" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockProducts.filter(p => p.isRawMaterial).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                            </Select><FormMessage className="text-xs"/></FormItem> )} />
                                        <FormField control={bomForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                                            <FormItem className="col-span-4"><FormLabel className="text-xs">الكمية</FormLabel>
                                            <FormControl><Input type="number" {...field} className="bg-background h-9 text-xs" /></FormControl>
                                            <FormMessage className="text-xs"/></FormItem> )} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeBomItem(index)} className="col-span-2 self-end h-9 w-9 text-destructive hover:bg-destructive/10"><MinusCircle className="h-4 w-4" /></Button>
                                    </div>))}
                                </ScrollArea>
                                <Button type="button" variant="outline" onClick={() => appendBomItem({materialId: '', quantity:1})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة مادة</Button>
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
                        <TableCell>{mockProducts.find(p=>p.id === bom.productId)?.name || bom.productId}</TableCell>
                        <TableCell>{bom.version}</TableCell>
                        <TableCell>{bom.items.length}</TableCell>
                        <TableCell>{bom.lastUpdated.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewBom(bom)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل القائمة" onClick={() => {setBomToEdit(bom); setShowManageBomDialog(true);}}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف القائمة">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                        <AlertDialogDescription>هل أنت متأكد من حذف قائمة المواد للمنتج "{mockProducts.find(p=>p.id === bom.productId)?.name || bom.productId}" (إصدار {bom.version})؟</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteBom(bom.id!)} className={Button({variant:"destructive"})}>تأكيد الحذف</AlertDialogAction>
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
                        <TableCell>{plan.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{plan.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>
                            <Badge variant={plan.status === "نشطة" ? "default" : plan.status === "مكتملة" ? "secondary" : "outline"}>{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الخطة" onClick={() => handleViewProductionPlan(plan)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الخطة" onClick={() => {setProductionPlanToEdit(plan); setShowManageProductionPlanDialog(true);}}>
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
                                            <SelectContent>{workOrders.map(wo => <SelectItem key={wo.id} value={wo.id}>{wo.id} ({mockProducts.find(p=>p.id === wo.productId)?.name})</SelectItem>)}</SelectContent>
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
                                            <SelectContent>{mockUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}</SelectContent>
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
                        <TableCell>{qc.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{mockUsers.find(u => u.id === qc.inspectorId)?.name || qc.inspectorId}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الفحص" onClick={() => handleViewQualityCheck(qc)}>
                            <Eye className="h-4 w-4" />
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
      </Tabs>

      {/* View Work Order Details Dialog */}
      <Dialog open={showViewWorkOrderDialog} onOpenChange={setShowViewWorkOrderDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر العمل: {selectedWorkOrderForView?.id}</DialogTitle>
            <DialogDescriptionComponent>عرض تفاصيل أمر العمل المسجل.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedWorkOrderForView && (
            <div className="py-4 space-y-3 text-sm">
              <div><strong>رقم الأمر:</strong> {selectedWorkOrderForView.id}</div>
              <div><strong>المنتج:</strong> {mockProducts.find(p => p.id === selectedWorkOrderForView.productId)?.name} ({selectedWorkOrderForView.productId})</div>
              <div><strong>الكمية المطلوبة:</strong> {selectedWorkOrderForView.quantity}</div>
              <div><strong>تاريخ البدء:</strong> {selectedWorkOrderForView.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>تاريخ الانتهاء المتوقع:</strong> {selectedWorkOrderForView.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>الحالة:</strong> <Badge variant={selectedWorkOrderForView.status === "مكتمل" ? "default" : "secondary"}>{selectedWorkOrderForView.status}</Badge></div>
              <div><strong>التقدم:</strong> <Progress value={selectedWorkOrderForView.progress} className="h-2 w-full inline-block" /> {selectedWorkOrderForView.progress}%</div>
              <div><strong>ملاحظات:</strong> {selectedWorkOrderForView.notes || "لا يوجد"}</div>
              <h4 className="font-semibold pt-2 border-t mt-3">فحوصات الجودة المرتبطة:</h4>
              {qualityChecks.filter(qc => qc.workOrderId === selectedWorkOrderForView.id).length > 0 ? (
                <ul className="list-disc ps-5">
                    {qualityChecks.filter(qc => qc.workOrderId === selectedWorkOrderForView.id).map(qc => (
                        <li key={qc.id}>{qc.checkPoint} - <Badge variant={qc.result === "ناجح" ? "default" : "destructive"} className="text-xs">{qc.result}</Badge> ({qc.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })})</li>
                    ))}
                </ul>
              ) : <p className="text-muted-foreground">لا توجد فحوصات جودة مسجلة لهذا الأمر.</p>}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={showUpdateProgressDialog} onOpenChange={(isOpen) => {setShowUpdateProgressDialog(isOpen); if(!isOpen) setWorkOrderToUpdateProgress(null);}}>
          <DialogContent className="sm:max-w-xs" dir="rtl">
              <DialogHeader>
                  <DialogTitle>تحديث تقدم أمر العمل: {workOrderToUpdateProgress?.id}</DialogTitle>
              </DialogHeader>
              <Form {...updateProgressForm}>
                  <form onSubmit={updateProgressForm.handleSubmit(handleUpdateProgressSubmit)} className="space-y-4 py-4">
                      <FormField control={updateProgressForm.control} name="progress" render={({ field }) => (
                          <FormItem>
                              <FormLabel>نسبة التقدم الجديدة (%)</FormLabel>
                              <FormControl><Input type="number" min="0" max="100" {...field} className="bg-background"/></FormControl>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <DialogFooter>
                          <Button type="submit">حفظ التقدم</Button>
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
            <DialogTitle>تفاصيل قائمة المواد: {mockProducts.find(p=>p.id === selectedBomForView?.productId)?.name} (إصدار {selectedBomForView?.version})</DialogTitle>
          </DialogHeader>
          {selectedBomForView && (
            <div className="py-4 space-y-3 text-sm">
              <div><strong>معرف القائمة:</strong> {selectedBomForView.id}</div>
              <div><strong>المنتج النهائي:</strong> {mockProducts.find(p=>p.id === selectedBomForView.productId)?.name}</div>
              <div><strong>الإصدار:</strong> {selectedBomForView.version}</div>
              <div><strong>آخر تحديث:</strong> {selectedBomForView.lastUpdated?.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <h4 className="font-semibold pt-2 border-t mt-3">المواد الخام:</h4>
              {selectedBomForView.items.length > 0 ? (
                <Table size="sm">
                  <TableHeader><TableRow><TableHead>المادة</TableHead><TableHead>الكمية</TableHead><TableHead>الوحدة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {selectedBomForView.items.map((item, idx) => {
                        const material = mockProducts.find(m => m.id === item.materialId);
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
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
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
              <div><strong>تاريخ البدء:</strong> {selectedProductionPlanForView.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>تاريخ الانتهاء:</strong> {selectedProductionPlanForView.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>الحالة:</strong> <Badge variant={selectedProductionPlanForView.status === "نشطة" ? "default" : "outline"}>{selectedProductionPlanForView.status}</Badge></div>
              <div><strong>ملاحظات:</strong> {selectedProductionPlanForView.notes || "لا يوجد"}</div>
              {/* Here you could list associated Work Orders if that link is established */}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
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
              <div><strong>أمر العمل:</strong> {selectedQualityCheckForView.workOrderId} ({mockProducts.find(p => p.id === workOrders.find(wo => wo.id === selectedQualityCheckForView.workOrderId)?.productId)?.name})</div>
              <div><strong>نقطة الفحص:</strong> {selectedQualityCheckForView.checkPoint}</div>
              <div><strong>النتيجة:</strong> <Badge variant={selectedQualityCheckForView.result === "ناجح" ? "default" : selectedQualityCheckForView.result === "فاشل" ? "destructive" : "secondary"}>{selectedQualityCheckForView.result}</Badge></div>
              <div><strong>تاريخ الفحص:</strong> {selectedQualityCheckForView.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>المفتش:</strong> {mockUsers.find(u => u.id === selectedQualityCheckForView.inspectorId)?.name}</div>
              <div><strong>ملاحظات:</strong> {selectedQualityCheckForView.notes || "لا يوجد"}</div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


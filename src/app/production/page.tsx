
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
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
import { Cog, ListChecks, CalendarClock, ShieldCheck, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock data
const mockProducts = [
    { id: "PROD-A", name: "منتج ألف" },
    { id: "PROD-B", name: "منتج باء" },
    { id: "PROD-C", name: "منتج جيم" },
];

const mockUsers = [
    { id: "USER-001", name: "أحمد علي" },
    { id: "USER-002", name: "فاطمة محمد" },
];


const initialWorkOrders = [
  { id: "WO001", productId: "PROD-A", quantity: 100, startDate: new Date("2024-08-01"), endDate: new Date("2024-08-05"), status: "قيد التنفيذ" as const, progress: 60, notes: "الدفعة الأولى من الطلبية الكبرى" },
  { id: "WO002", productId: "PROD-B", quantity: 250, startDate: new Date("2024-07-20"), endDate: new Date("2024-07-30"), status: "مكتمل" as const, progress: 100, notes: "" },
  { id: "WO003", productId: "PROD-C", quantity: 50, startDate: new Date("2024-08-10"), endDate: new Date("2024-08-15"), status: "مجدول" as const, progress: 0, notes: "إنتاج تجريبي" },
];

const initialBoms = [
  { id: "BOM001", productName: "منتج ألف", version: "1.2", items: [{ material: "مادة خام X", quantity: 5 }, { material: "مادة خام Y", quantity: 2 }], lastUpdated: "2024-06-15" },
  { id: "BOM002", productName: "منتج باء", version: "2.0", items: [{ material: "مادة خام Z", quantity: 10 }, { material: "مادة خام A", quantity: 3 }], lastUpdated: "2024-05-01" },
];

const initialProductionPlans = [
  { id: "PLAN001", name: "خطة إنتاج أغسطس", startDate: "2024-08-01", endDate: "2024-08-31", totalOrders: 5, status: "نشطة" },
  { id: "PLAN002", name: "خطة إنتاج الربع الثالث", startDate: "2024-07-01", endDate: "2024-09-30", totalOrders: 12, status: "مكتملة" },
];

const initialQualityChecks = [
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


export default function ProductionPage() {
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [boms, setBoms] = useState(initialBoms);
  const [productionPlans, setProductionPlans] = useState(initialProductionPlans);
  const [qualityChecks, setQualityChecks] = useState(initialQualityChecks);
  
  const [showManageWorkOrderDialog, setShowManageWorkOrderDialog] = useState(false);
  const [workOrderToEdit, setWorkOrderToEdit] = useState<WorkOrderFormValues | null>(null);

  const [showManageQualityCheckDialog, setShowManageQualityCheckDialog] = useState(false);
  const [qualityCheckToEdit, setQualityCheckToEdit] = useState<QualityCheckFormValues | null>(null);
  
  const [showViewQualityCheckDialog, setShowViewQualityCheckDialog] = useState(false);
  const [selectedQualityCheckForView, setSelectedQualityCheckForView] = useState<QualityCheckFormValues | null>(null);

  const { toast } = useToast();

  const workOrderForm = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: { startDate: new Date(), endDate: new Date(), quantity: 1, status: "مجدول", progress: 0 },
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
    if (qualityCheckToEdit) qualityCheckForm.reset(qualityCheckToEdit);
    else qualityCheckForm.reset({ workOrderId: '', checkPoint: '', result: undefined, date: new Date(), inspectorId: '', notes: '' });
  }, [qualityCheckToEdit, qualityCheckForm, showManageQualityCheckDialog]);

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
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المنتج" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {wo.status !== "مكتمل" && wo.status !== "ملغي" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setWorkOrderToEdit(wo); setShowManageWorkOrderDialog(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                          )}
                           {wo.status === "قيد التنفيذ" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحديث التقدم">
                                <PlayCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {wo.status === "مجدول" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إلغاء الأمر">
                                <Trash2 className="h-4 w-4" />
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

        <TabsContent value="boms">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المواد (Bill of Materials)</CardTitle>
              <CardDescription>إدارة مكونات المنتجات وتكاليفها وتحديثات الإصدارات.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء قائمة مواد جديدة
                </Button>
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
                      <TableHead>اسم المنتج</TableHead>
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
                        <TableCell>{bom.productName}</TableCell>
                        <TableCell>{bom.version}</TableCell>
                        <TableCell>{bom.items.length}</TableCell>
                        <TableCell>{bom.lastUpdated}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل القائمة">
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إنشاء نسخة جديدة">
                            <Settings2 className="h-4 w-4" />
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
        
        <TabsContent value="planning">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>تخطيط موارد الإنتاج (MRP)</CardTitle>
              <CardDescription>جدولة الإنتاج، إدارة الطلب على المواد، وتخطيط السعة الإنتاجية.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء خطة إنتاج جديدة
                </Button>
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
                      <TableHead>إجمالي أوامر العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{plan.id}</TableCell>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>{plan.startDate}</TableCell>
                        <TableCell>{plan.endDate}</TableCell>
                        <TableCell>{plan.totalOrders}</TableCell>
                        <TableCell>
                            <Badge variant={plan.status === "نشطة" ? "default" : "outline"}>{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الخطة">
                            <FileText className="h-4 w-4" />
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر أمر العمل" /></SelectTrigger></FormControl>
                                            <SelectContent>{workOrders.map(wo => <SelectItem key={wo.id} value={wo.id}>{wo.id} ({mockProducts.find(p=>p.id === wo.productId)?.name})</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )} />
                                <FormField control={qualityCheckForm.control} name="checkPoint" render={({ field }) => (
                                    <FormItem><FormLabel>نقطة الفحص</FormLabel><FormControl><Input placeholder="مثال: فحص نهائي للمنتج" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={qualityCheckForm.control} name="result" render={({ field }) => (
                                    <FormItem><FormLabel>نتيجة الفحص</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
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
                            <FileText className="h-4 w-4" />
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


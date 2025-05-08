
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, Package, Warehouse, ArrowRightLeft, Layers, AlertTriangle, Truck, Repeat, History, BarChart3, Settings2, Eye, Download, BarChartBig, PieChart, LineChart, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Product Schema
const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU مطلوب"),
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  category: z.string().min(1, "الفئة مطلوبة"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  costPrice: z.coerce.number().min(0, "سعر التكلفة يجب أن يكون إيجابياً"),
  sellingPrice: z.coerce.number().min(0, "سعر البيع يجب أن يكون إيجابياً"),
  quantity: z.coerce.number().min(0, "الكمية لا يمكن أن تكون سالبة").default(0),
  reorderLevel: z.coerce.number().min(0, "حد إعادة الطلب لا يمكن أن يكون سالباً").default(0),
  location: z.string().optional(),
  barcode: z.string().optional(),
  supplierId: z.string().optional(), // Mock supplier ID
});
type ProductFormValues = z.infer<typeof productSchema>;

// Mock data for products (enhanced inventoryItems)
const initialProductsData: ProductFormValues[] = [
  { id: "ITEM001", sku: "DELL-XPS15-LAP", name: "لابتوب Dell XPS 15", description: "لابتوب عالي الأداء بشاشة 15 بوصة", category: "إلكترونيات", unit: "قطعة", costPrice: 5800, sellingPrice: 6500, quantity: 50, reorderLevel: 10, location: "مستودع A - رف 3", barcode: "1234567890123", supplierId: "SUP001" },
  { id: "ITEM002", sku: "HP-LASER-PRO", name: "طابعة HP LaserJet Pro", description: "طابعة ليزر أحادية اللون", category: "إلكترونيات", unit: "قطعة", costPrice: 1000, sellingPrice: 1200, quantity: 5, reorderLevel: 5, location: "مستودع A - رف 1", barcode: "2345678901234", supplierId: "SUP001" },
  { id: "ITEM003", sku: "A4-PAPER-BOX", name: "ورق طباعة A4 (صندوق)", description: "صندوق ورق طباعة A4 عالي الجودة", category: "قرطاسية", unit: "صندوق", costPrice: 120, sellingPrice: 150, quantity: 200, reorderLevel: 50, location: "مستودع B - قسم 2", barcode: "3456789012345", supplierId: "SUP002" },
  { id: "ITEM004", sku: "WOOD-DESK", name: "مكاتب خشبية", description: "مكتب خشبي أنيق للمكاتب", category: "أثاث مكتبي", unit: "قطعة", costPrice: 650, sellingPrice: 800, quantity: 15, reorderLevel: 5, location: "مستودع C - منطقة 1", barcode: "4567890123456", supplierId: "SUP003" },
  { id: "ITEM005", sku: "BLUE-PEN-BOX", name: "أقلام حبر أزرق (علبة)", description: "علبة أقلام حبر زرقاء، 12 قلم", category: "قرطاسية", unit: "علبة", costPrice: 20, sellingPrice: 25, quantity: 500, reorderLevel: 100, location: "مستودع B - قسم 1", barcode: "5678901234567", supplierId: "SUP002" },
];

// Mock suppliers for dropdown
const mockSuppliers = [
    { id: "SUP001", name: "مورد الإلكترونيات الحديثة" },
    { id: "SUP002", name: "شركة القرطاسية المتحدة" },
    { id: "SUP003", name: "مصنع الأثاث العصري" },
];

// Mock categories for dropdown
const mockCategories = ["إلكترونيات", "قرطاسية", "أثاث مكتبي", "مواد خام", "أخرى"];
const mockUnits = ["قطعة", "صندوق", "علبة", "كيلوجرام", "متر", "لتر"];


const stockMovements = [
  { id: "MV001", date: "2024-07-20", type: "دخول (شراء)", item: "ITEM001", quantity: 20, fromTo: "مورد X", reference: "PO-123" },
  { id: "MV002", date: "2024-07-21", type: "خروج (بيع)", item: "ITEM003", quantity: 10, fromTo: "عميل Y", reference: "SO-456" },
  { id: "MV003", date: "2024-07-22", type: "تحويل داخلي", item: "ITEM002", quantity: 2, fromTo: "مستودع A -> مستودع B", reference: "TRN-001" },
  { id: "MV004", date: "2024-07-23", type: "تعديل جرد (زيادة)", item: "ITEM005", quantity: 5, fromTo: "جرد سنوي", reference: "ADJ-001" },
];

const inventoryReportTypes = [
    { name: "تقرير حركة صنف", icon: Package, description: "تتبع حركة صنف معين خلال فترة." },
    { name: "تقرير تقييم المخزون", icon: Layers, description: "عرض قيمة المخزون الحالي بالتكلفة والسعر." },
    { name: "تقرير الجرد والفروقات", icon: Repeat, description: "مقارنة الكميات الفعلية بالمسجلة وكشف الفروقات." },
    { name: "تقرير الأصناف الراكدة", icon: AlertTriangle, description: "تحديد الأصناف التي لم تشهد حركة لفترة." },
    { name: "تقرير مواقع التخزين", icon: Warehouse, description: "عرض الأصناف وكمياتها في كل موقع تخزين." },
    { name: "تقرير الأصناف حسب المورد", icon: Truck, description: "عرض الأصناف المرتبطة بكل مورد." },
];

const sampleChartData = [
  { month: "يناير", "ITEM001": 100, "ITEM002": 50 },
  { month: "فبراير", "ITEM001": 120, "ITEM002": 60 },
  { month: "مارس", "ITEM001": 80, "ITEM002": 40 },
  { month: "ابريل", "ITEM001": 150, "ITEM002": 70 },
  { month: "مايو", "ITEM001": 110, "ITEM002": 55 },
  { month: "يونيو", "ITEM001": 130, "ITEM002": 65 },
];

const chartConfig = {
  "ITEM001": { label: "لابتوب Dell XPS 15", color: "hsl(var(--chart-1))" },
  "ITEM002": { label: "طابعة HP LaserJet Pro", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;


export default function InventoryPage() {
  const [productsData, setProductsData] = useState(initialProductsData);
  const [showManageProductDialog, setShowManageProductDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductFormValues | null>(null);
  
  const [currentReport, setCurrentReport] = useState<{name: string, description: string, icon: React.ElementType} | null>(null);

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "", name: "", description: "", category: "", unit: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 0, location: "", barcode: "", supplierId: ""
    },
  });

  useEffect(() => {
    if (productToEdit) {
      productForm.reset(productToEdit);
    } else {
      productForm.reset({ sku: "", name: "", description: "", category: "", unit: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 0, location: "", barcode: "", supplierId: "" });
    }
  }, [productToEdit, productForm, showManageProductDialog]);

  const handleProductSubmit = (values: ProductFormValues) => {
    if (productToEdit) {
      setProductsData(prev => prev.map(p => p.id === productToEdit.id ? { ...values, id: productToEdit.id } : p));
    } else {
      setProductsData(prev => [...prev, { ...values, id: `ITEM${Date.now()}` }]);
    }
    setShowManageProductDialog(false);
    setProductToEdit(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProductsData(prev => prev.filter(p => p.id !== productId));
  };


  if (currentReport) {
    return (
         <div className="container mx-auto py-6 space-y-6" dir="rtl">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl flex items-center">
                                <currentReport.icon className="me-2 h-7 w-7 text-primary" /> {currentReport.name}
                            </CardTitle>
                            <CardDescription>{currentReport.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setCurrentReport(null)}>العودة لقائمة التقارير</Button>
                    </div>
                </CardHeader>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">خيارات التقرير</CardTitle>
                    <div className="mt-4 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-1 block">النطاق الزمني</label>
                            <DatePickerWithPresets mode="range" />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-1 block">الصنف/المستودع</label>
                            <Select dir="rtl">
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    {productsData.map(item => <SelectItem key={item.id} value={item.id!}>{item.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="shadow-sm hover:shadow-md">
                            <Filter className="me-2 h-4 w-4" /> تطبيق الفلاتر
                        </Button>
                        <Button variant="secondary" className="shadow-sm hover:shadow-md">
                            <Download className="me-2 h-4 w-4" /> تصدير (Excel/PDF)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg mb-4">عرض التقرير: {currentReport.name}</CardTitle>
                    {currentReport.name === "تقرير حركة صنف" ? (
                         <div className="h-[400px] p-4 border rounded-md bg-muted/30 flex items-center justify-center">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={sampleChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    <Bar dataKey="ITEM001" fill="var(--color-ITEM001)" radius={4} />
                                    <Bar dataKey="ITEM002" fill="var(--color-ITEM002)" radius={4} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    ) : (
                         <div className="overflow-x-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>البيان</TableHead>
                                        <TableHead>القيمة</TableHead>
                                        <TableHead>تفاصيل إضافية</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow><TableCell>إجمالي قيمة المخزون</TableCell><TableCell>550,000 SAR</TableCell><TableCell>حسب سعر التكلفة</TableCell></TableRow>
                                    <TableRow><TableCell>عدد الأصناف تحت حد الطلب</TableCell><TableCell>2</TableCell><TableCell>ITEM002, ITEM004</TableCell></TableRow>
                                    <TableRow><TableCell>أكثر الأصناف حركة</TableCell><TableCell>ITEM005</TableCell><TableCell>500 حركة الشهر الماضي</TableCell></TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                     <div className="mt-6">
                        <h3 className="text-md font-semibold mb-2">ملاحظات/ملخص التقرير:</h3>
                        <p className="text-sm text-muted-foreground">
                            هنا يتم عرض ملخص للبيانات المعروضة في تقرير "{currentReport.name}".
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">إدارة المخزون والمستودعات</h1>
        <Dialog open={showManageProductDialog} onOpenChange={(isOpen) => { setShowManageProductDialog(isOpen); if (!isOpen) setProductToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setProductToEdit(null); productForm.reset(); setShowManageProductDialog(true); }}>
              <PackagePlus className="me-2 h-4 w-4" /> إضافة منتج/صنف
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>{productToEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج/صنف جديد'}</DialogTitle>
              <CardDescription>أدخل تفاصيل المنتج أو الصنف.</CardDescription>
            </DialogHeader>
            <Form {...productForm}>
              <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="sku" render={({ field }) => ( <FormItem><FormLabel>SKU / كود المنتج</FormLabel><FormControl><Input placeholder="أدخل SKU" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={productForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المنتج/الصنف</FormLabel><FormControl><Input placeholder="اسم المنتج" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={productForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="وصف تفصيلي للمنتج (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="category" render={({ field }) => ( <FormItem><FormLabel>الفئة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl>
                            <SelectContent>{mockCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem> )} />
                    <FormField control={productForm.control} name="unit" render={({ field }) => ( <FormItem><FormLabel>الوحدة</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الوحدة" /></SelectTrigger></FormControl>
                            <SelectContent>{mockUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={productForm.control} name="costPrice" render={({ field }) => ( <FormItem><FormLabel>سعر التكلفة</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={productForm.control} name="sellingPrice" render={({ field }) => ( <FormItem><FormLabel>سعر البيع</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={productForm.control} name="quantity" render={({ field }) => ( <FormItem><FormLabel>الكمية الحالية</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={productForm.control} name="reorderLevel" render={({ field }) => ( <FormItem><FormLabel>حد إعادة الطلب</FormLabel><FormControl><Input type="number" placeholder="0" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={productForm.control} name="location" render={({ field }) => ( <FormItem><FormLabel>موقع التخزين</FormLabel><FormControl><Input placeholder="مثال: مستودع أ - رف 5" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={productForm.control} name="barcode" render={({ field }) => ( <FormItem><FormLabel>الباركود</FormLabel><FormControl><Input placeholder="أدخل الباركود (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={productForm.control} name="supplierId" render={({ field }) => ( <FormItem><FormLabel>المورد الأساسي (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl>
                            <SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem> )} />
                </div>
                <DialogFooter>
                  <Button type="submit">{productToEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="itemsList" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="itemsList" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Package className="inline-block me-2 h-4 w-4" /> قائمة المنتجات/الأصناف
          </TabsTrigger>
          <TabsTrigger value="stockMovement" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <History className="inline-block me-2 h-4 w-4" /> حركة المخزون
          </TabsTrigger>
          <TabsTrigger value="stocktaking" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Repeat className="inline-block me-2 h-4 w-4" /> الجرد والتسويات
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BarChart3 className="inline-block me-2 h-4 w-4" /> تقارير المخزون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itemsList">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المنتجات والأصناف</CardTitle>
              <CardDescription>إدارة بيانات المنتجات، الفئات، الأسعار، الكميات، ومواقع التخزين.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث بالاسم، SKU، أو الباركود..." className="pr-10 w-full sm:w-72 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الفئة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الفئة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {mockCategories.map(cat => <DropdownMenuCheckboxItem key={cat}>{cat}</DropdownMenuCheckboxItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                     <AlertTriangle className="me-2 h-4 w-4 text-destructive" /> عرض أصناف تحت حد الطلب
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الوحدة</TableHead>
                      <TableHead>سعر التكلفة</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>حد الطلب</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData.map((product) => (
                      <TableRow key={product.id} className={`hover:bg-muted/50 ${product.quantity <= product.reorderLevel ? 'bg-destructive/10' : ''}`}>
                        <TableCell className="font-medium">{product.sku}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                        <TableCell>{product.costPrice.toFixed(2)} SAR</TableCell>
                        <TableCell>{product.sellingPrice.toFixed(2)} SAR</TableCell>
                        <TableCell className="font-semibold">
                          {product.quantity}
                          {product.quantity <= product.reorderLevel && <AlertTriangle className="inline me-2 h-4 w-4 text-destructive" />}
                        </TableCell>
                        <TableCell>{product.reorderLevel}</TableCell>
                        <TableCell>{product.location || "-"}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المنتج" onClick={() => { setProductToEdit(product); setShowManageProductDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف المنتج">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                <AlertDialogDescription>سيتم حذف المنتج "{product.name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id!)}>تأكيد الحذف</AlertDialogAction>
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

        <TabsContent value="stockMovement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>حركة المخزون</CardTitle>
              <CardDescription>تتبع جميع حركات الدخول والخروج والتحويلات بين المخازن.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في حركات المخزون..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                 <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <ArrowRightLeft className="me-2 h-4 w-4" /> إنشاء تحويل مخزني
                    </Button>
                    <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الحركة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع الحركة</TableHead>
                      <TableHead>الصنف</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>من/إلى</TableHead>
                      <TableHead>المرجع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{movement.id}</TableCell>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>
                           <Badge variant={movement.type.includes("دخول") || movement.type.includes("زيادة") ? "default" : movement.type.includes("خروج") ? "destructive" : "secondary" } className="whitespace-nowrap bg-opacity-80">
                                {movement.type}
                           </Badge>
                        </TableCell>
                        <TableCell>{productsData.find(p => p.id === movement.item)?.name || movement.item}</TableCell>
                        <TableCell className="font-semibold">{movement.quantity}</TableCell>
                        <TableCell>{movement.fromTo}</TableCell>
                        <TableCell>{movement.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stocktaking">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>الجرد والتسويات المخزنية</CardTitle>
                    <CardDescription>تنفيذ عمليات الجرد الدورية وتسجيل التسويات لضمان دقة بيانات المخزون.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <Button className="shadow-md hover:shadow-lg transition-shadow">
                            <PlusCircle className="me-2 h-4 w-4" /> بدء جرد جديد
                        </Button>
                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Layers className="me-2 h-4 w-4" /> عرض عمليات الجرد السابقة
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">آخر عملية جرد</CardTitle>
                            <CardDescription>تاريخ: 2024-06-30 - المستودع: مستودع A - الحالة: مكتمل</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>تم جرد 500 صنف، تم العثور على فروقات في 15 صنفًا.</p>
                            <Button variant="link" className="px-0">عرض تفاصيل الجرد</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">إنشاء تسوية مخزنية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">يمكنك هنا إدخال تسويات يدوية لزيادة أو خفض كميات الأصناف بناءً على نتائج الجرد أو لأسباب أخرى (تلف، فقدان، إلخ).</p>
                            <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                               <Settings2 className="me-2 h-4 w-4" /> إنشاء تسوية
                            </Button>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="reports">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>تقارير المخزون</CardTitle>
                    <CardDescription>تقارير متنوعة لتحليل أداء المخزون وقيمته وحركته.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {inventoryReportTypes.map((report) => (
                        <Card key={report.name} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
                          <CardHeader className="flex-row items-start gap-3 space-y-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <report.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">{report.name}</CardTitle>
                                <CardDescription className="text-xs mt-1">{report.description}</CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="mt-auto flex justify-end gap-2 p-4 pt-0">
                             <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setCurrentReport(report)}>
                              <Eye className="me-1.5 h-3.5 w-3.5" /> عرض التقرير
                            </Button>
                          </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

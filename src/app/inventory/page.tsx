
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, Package, Warehouse, History, BarChart3, SlidersHorizontal, Eye, Download, PackagePlus, Upload, Printer, MinusCircle, PackageMinus, ArchiveRestore, ClipboardList, CheckCircle, AlertTriangle, Truck, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponentClass, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import AppLogo from '@/components/app-logo';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  supplierId: z.string().optional(),
  itemsPerParentUnit: z.coerce.number().positive("العدد يجب أن يكون أكبر من صفر").optional(),
  subUnit: z.enum(["قطعة", "حبة", "متر", "سنتيمتر"]).optional(),
  subUnitSellingPrice: z.coerce.number().min(0, "سعر الوحدة الفرعية يجب أن يكون إيجابياً").optional(),
  image: z.string().optional(),
  dataAiHint: z.string().max(30, "الكلمات المفتاحية يجب ألا تتجاوز 30 حرفًا").optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

// Stocktake Initiation Schema
const stocktakeInitiationSchema = z.object({
  stocktakeDate: z.date({ required_error: "تاريخ الجرد مطلوب" }),
  warehouseId: z.string().min(1, "المستودع مطلوب"),
  responsiblePerson: z.string().min(1, "المسؤول عن الجرد مطلوب"),
  notes: z.string().optional(),
});
type StocktakeInitiationFormValues = z.infer<typeof stocktakeInitiationSchema>;

interface StocktakeItemDetail {
  productId: string;
  productName: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
}
interface StocktakeDetails {
  id: string;
  date: string;
  warehouse: string;
  status: string;
  responsible: string;
  itemsCounted: number;
  discrepanciesFound: number;
  notes?: string;
  items: StocktakeItemDetail[];
}

// Stock Issue Voucher Schema
const stockIssueItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantityIssued: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  notes: z.string().optional(),
});
const stockIssueVoucherSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  warehouseId: z.string().min(1, "المستودع المصدر مطلوب"),
  recipient: z.string().min(1, "الجهة المستلمة مطلوبة"),
  reason: z.string().min(1, "سبب الصرف مطلوب"),
  items: z.array(stockIssueItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "معتمد", "ملغي"]).default("مسودة"),
  issuedBy: z.string().optional(),
});
type StockIssueVoucherFormValues = z.infer<typeof stockIssueVoucherSchema>;

// Stock Receipt Voucher Schema
const stockReceiptItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantityReceived: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  costPricePerUnit: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});
const stockReceiptVoucherSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  warehouseId: z.string().min(1, "المستودع المستلم مطلوب"),
  source: z.string().min(1, "مصدر البضاعة مطلوب (مورد/أمر إنتاج)"),
  reference: z.string().optional(),
  items: z.array(stockReceiptItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "مرحل للمخزون", "ملغي"]).default("مسودة"),
  receivedBy: z.string().optional(),
});
type StockReceiptVoucherFormValues = z.infer<typeof stockReceiptVoucherSchema>;

// Stock Requisition Schema
const stockRequisitionItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantityRequested: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  justification: z.string().optional(),
});
const stockRequisitionSchema = z.object({
  id: z.string().optional(),
  requestDate: z.date({ required_error: "تاريخ الطلب مطلوب" }),
  requestingDepartmentOrPerson: z.string().min(1, "الجهة الطالبة مطلوبة"),
  requiredByDate: z.date({ required_error: "تاريخ الحاجة مطلوب" }),
  items: z.array(stockRequisitionItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  overallJustification: z.string().optional(),
  status: z.enum(["جديد", "قيد المراجعة", "موافق عليه", "مرفوض", "تم الصرف جزئياً", "تم الصرف بالكامل", "ملغي"]).default("جديد"),
  approvedBy: z.string().optional(),
  approvalDate: z.date().optional(),
});
type StockRequisitionFormValues = z.infer<typeof stockRequisitionSchema>;

// Mock data
const initialProductsData: ProductFormValues[] = [
  { id: "ITEM001", sku: "DELL-XPS15-LAP", name: "لابتوب Dell XPS 15", description: "لابتوب عالي الأداء بشاشة 15 بوصة", category: "إلكترونيات", unit: "قطعة", costPrice: 5800, sellingPrice: 6500, quantity: 50, reorderLevel: 10, location: "مستودع A - رف 3", barcode: "1234567890123", supplierId: "SUP001", image: "https://picsum.photos/200/200?random=1", dataAiHint: "laptop computer" },
  { id: "ITEM002", sku: "HP-LASER-PRO", name: "طابعة HP LaserJet Pro", description: "طابعة ليزر أحادية اللون", category: "إلكترونيات", unit: "قطعة", costPrice: 1000, sellingPrice: 1200, quantity: 5, reorderLevel: 5, location: "مستودع A - رف 1", barcode: "2345678901234", supplierId: "SUP001", image: "https://picsum.photos/200/200?random=2", dataAiHint: "printer office" },
  { id: "ITEM003", sku: "A4-PAPER-BOX", name: "ورق طباعة A4 (صندوق)", description: "صندوق ورق طباعة A4 عالي الجودة", category: "قرطاسية", unit: "صندوق", costPrice: 120, sellingPrice: 150, quantity: 200, reorderLevel: 50, location: "مستودع B - قسم 2", barcode: "3456789012345", supplierId: "SUP002", itemsPerParentUnit: 500, subUnit: "قطعة", subUnitSellingPrice: 0.30, image: "https://picsum.photos/200/200?random=3", dataAiHint: "paper stationery" },
  { id: "ITEM004", sku: "WOOD-DESK", name: "مكاتب خشبية", description: "مكتب خشبي أنيق للمكاتب", category: "أثاث مكتبي", unit: "قطعة", costPrice: 650, sellingPrice: 800, quantity: 15, reorderLevel: 5, location: "مستودع C - منطقة 1", barcode: "4567890123456", supplierId: "SUP003", image: "https://picsum.photos/200/200?random=4", dataAiHint: "desk furniture" },
  { id: "ITEM005", sku: "BLUE-PEN-BOX", name: "أقلام حبر أزرق (علبة)", description: "علبة أقلام حبر زرقاء، 12 قلم", category: "قرطاسية", unit: "علبة", costPrice: 20, sellingPrice: 25, quantity: 500, reorderLevel: 100, location: "مستودع B - قسم 1", barcode: "5678901234567", supplierId: "SUP002", image: "https://picsum.photos/200/200?random=5", dataAiHint: "pens stationery" },
];
const mockSuppliers = [ { id: "SUP001", name: "مورد الإلكترونيات الحديثة" }, { id: "SUP002", name: "شركة القرطاسية المتحدة" }, { id: "SUP003", name: "مصنع الأثاث العصري" },];
const mockCategories = ["إلكترونيات", "قرطاسية", "أثاث مكتبي", "مواد خام", "أخرى"];
const mockUnits = ["قطعة", "صندوق", "كرتون", "علبة", "كيلوجرام", "متر", "لتر", "حبة", "سنتيمتر"];
const mockSubUnits = ["قطعة", "حبة", "متر", "سنتيمتر"];
const mockWarehouses = [{ id: "WH001", name: "المستودع الرئيسي" }, { id: "WH002", name: "مستودع فرعي أ" }];
const mockUsers = [{ id: "USR001", name: "فريق الجرد أ" }, { id: "USR002", name: "أحمد المسؤول" }, { id: "USR003", name: "مدير المخازن" }];
const mockDepartments = [{id: "DEP001", name: "قسم المبيعات"}, {id: "DEP002", name: "قسم الصيانة"}];
const mockRecipients = [...mockDepartments, {id: "CUST001", name: "عميل X"}, {id: "WH002", name: "مستودع فرعي أ (تحويل)"}];
const mockReceiptSources = [...mockSuppliers, {id: "PROD001", name: "أمر إنتاج #P123"}, {id: "WH001", name: "مستودع رئيسي (تحويل)"}];

const initialStockIssueVouchers: StockIssueVoucherFormValues[] = [
    {id: "SIV001", date: new Date("2024-07-28"), warehouseId: "WH001", recipient: "DEP001", reason: "استخدام داخلي لقسم المبيعات", items: [{productId: "ITEM003", quantityIssued: 2}, {productId: "ITEM005", quantityIssued: 5}], status: "معتمد", issuedBy: "USR003"},
];
const initialStockReceiptVouchers: StockReceiptVoucherFormValues[] = [
    {id: "SRV001", date: new Date("2024-07-29"), warehouseId: "WH001", source: "SUP001", reference: "PO-123", items: [{productId: "ITEM001", quantityReceived: 10, costPricePerUnit: 5750}], status: "مرحل للمخزون", receivedBy: "USR003"},
];
const initialStockRequisitions: StockRequisitionFormValues[] = [
    {id: "SRQ001", requestDate: new Date("2024-07-25"), requestingDepartmentOrPerson: "DEP002", requiredByDate: new Date("2024-07-30"), items: [{productId: "ITEM002", quantityRequested: 1, justification: "طابعة بديلة"}], status: "موافق عليه"},
];

const stockMovements = [ { id: "MV001", date: "2024-07-20", type: "دخول (شراء)", item: "ITEM001", quantity: 20, fromTo: "مورد X", reference: "PO-123" }, { id: "MV002", date: "2024-07-21", type: "خروج (بيع)", item: "ITEM003", quantity: 10, fromTo: "عميل Y", reference: "SO-456" }, { id: "MV003", date: "2024-07-22", type: "تحويل داخلي", item: "ITEM002", quantity: 2, fromTo: "مستودع A -> مستودع B", reference: "TRN-001" }, { id: "MV004", date: "2024-07-23", type: "تعديل جرد (زيادة)", item: "ITEM005", quantity: 5, fromTo: "جرد سنوي", reference: "ADJ-001" },];
const inventoryReportTypes = [ { name: "تقرير حركة صنف", icon: History, description: "تتبع حركة صنف معين خلال فترة." }, { name: "تقرير تقييم المخزون", icon: Layers, description: "عرض قيمة المخزون الحالي بالتكلفة والسعر." }, { name: "تقرير الجرد والفروقات", icon: SlidersHorizontal, description: "مقارنة الكميات الفعلية بالمسجلة وكشف الفروقات." }, { name: "تقرير الأصناف الراكدة", icon: AlertTriangle, description: "تحديد الأصناف التي لم تشهد حركة لفترة." }, { name: "تقرير مواقع التخزين", icon: Warehouse, description: "عرض الأصناف وكمياتها في كل موقع تخزين." }, { name: "تقرير الأصناف حسب المورد", icon: Truck, description: "عرض الأصناف المرتبطة بكل مورد." },];
const sampleChartData = [ { month: "يناير", "ITEM001": 100, "ITEM002": 50 }, { month: "فبراير", "ITEM001": 120, "ITEM002": 60 }, { month: "مارس", "ITEM001": 80, "ITEM002": 40 }, { month: "ابريل", "ITEM001": 150, "ITEM002": 70 }, { month: "مايو", "ITEM001": 110, "ITEM002": 55 }, { month: "يونيو", "ITEM001": 130, "ITEM002": 65 },];
const chartConfig = { "ITEM001": { label: "لابتوب Dell XPS 15", color: "hsl(var(--chart-1))" }, "ITEM002": { label: "طابعة HP LaserJet Pro", color: "hsl(var(--chart-2))" },} satisfies ChartConfig;
const mockStocktakeDetail: StocktakeDetails = { id: "STK-2024-06-30-A", date: "2024-06-30", warehouse: "مستودع A", status: "مكتمل", responsible: "فريق الجرد ألف", itemsCounted: 3, discrepanciesFound: 2, notes: "تم الجرد الدوري للمستودع أ. بعض الفروقات الطفيفة تم تسجيلها.", items: [ { productId: "ITEM001", productName: "لابتوب Dell XPS 15", expectedQuantity: 48, countedQuantity: 48, difference: 0 }, { productId: "ITEM002", productName: "طابعة HP LaserJet Pro", expectedQuantity: 7, countedQuantity: 6, difference: -1 }, { productId: "ITEM003", productName: "ورق طباعة A4 (صندوق)", expectedQuantity: 195, countedQuantity: 198, difference: 3 },],};


export default function InventoryPage() {
  const [productsData, setProductsData] = useState(initialProductsData);
  const [showManageProductDialog, setShowManageProductDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductFormValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [currentReport, setCurrentReport] = useState<{name: string, description: string, icon: React.ElementType} | null>(null);

  const [showStartStocktakeDialog, setShowStartStocktakeDialog] = useState(false);
  const [showViewStocktakeDetailsDialog, setShowViewStocktakeDetailsDialog] = useState(false);
  const [selectedStocktakeForView, setSelectedStocktakeForView] = useState<StocktakeDetails | null>(null);
  const { toast } = useToast();

  const [stockIssueVouchers, setStockIssueVouchers] = useState(initialStockIssueVouchers);
  const [showManageStockIssueDialog, setShowManageStockIssueDialog] = useState(false);
  const [stockIssueToEdit, setStockIssueToEdit] = useState<StockIssueVoucherFormValues | null>(null);

  const [stockReceiptVouchers, setStockReceiptVouchers] = useState(initialStockReceiptVouchers);
  const [showManageStockReceiptDialog, setShowManageStockReceiptDialog] = useState(false);
  const [stockReceiptToEdit, setStockReceiptToEdit] = useState<StockReceiptVoucherFormValues | null>(null);

  const [stockRequisitions, setStockRequisitions] = useState(initialStockRequisitions);
  const [showManageStockRequisitionDialog, setShowManageStockRequisitionDialog] = useState(false);
  const [stockRequisitionToEdit, setStockRequisitionToEdit] = useState<StockRequisitionFormValues | null>(null);

  const productForm = useForm<ProductFormValues>({ resolver: zodResolver(productSchema), defaultValues: { sku: "", name: "", description: "", category: "", unit: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 0, location: "", barcode: "", supplierId: "", itemsPerParentUnit: undefined, subUnit: undefined, subUnitSellingPrice: undefined, image: "", dataAiHint: "" }});
  const stocktakeInitiationForm = useForm<StocktakeInitiationFormValues>({ resolver: zodResolver(stocktakeInitiationSchema), defaultValues: { stocktakeDate: new Date(), warehouseId: "", responsiblePerson: "", notes: "" }});

  const stockIssueVoucherForm = useForm<StockIssueVoucherFormValues>({ resolver: zodResolver(stockIssueVoucherSchema), defaultValues: { date: new Date(), warehouseId: "", recipient: "", reason: "", items: [{ productId: "", quantityIssued: 1}], status: "مسودة", notes: ""}});
  const { fields: stockIssueItemsFields, append: appendStockIssueItem, remove: removeStockIssueItem } = useFieldArray({ control: stockIssueVoucherForm.control, name: "items" });

  const stockReceiptVoucherForm = useForm<StockReceiptVoucherFormValues>({ resolver: zodResolver(stockReceiptVoucherSchema), defaultValues: { date: new Date(), warehouseId: "", source: "", items: [{ productId: "", quantityReceived: 1, costPricePerUnit:0 }], status: "مسودة", notes: ""}});
  const { fields: stockReceiptItemsFields, append: appendStockReceiptItem, remove: removeStockReceiptItem } = useFieldArray({ control: stockReceiptVoucherForm.control, name: "items" });

  const stockRequisitionForm = useForm<StockRequisitionFormValues>({ resolver: zodResolver(stockRequisitionSchema), defaultValues: { requestDate: new Date(), requestingDepartmentOrPerson: "", requiredByDate: new Date(), items: [{ productId: "", quantityRequested: 1}], status: "جديد", overallJustification: ""}});
  const { fields: stockRequisitionItemsFields, append: appendStockRequisitionItem, remove: removeStockRequisitionItem } = useFieldArray({ control: stockRequisitionForm.control, name: "items" });

  useEffect(() => { if (productToEdit) { productForm.reset(productToEdit); setImagePreview(productToEdit.image || null); } else { productForm.reset({ sku: "", name: "", description: "", category: "", unit: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 0, location: "", barcode: "", supplierId: "", itemsPerParentUnit: undefined, subUnit: undefined, subUnitSellingPrice: undefined, image: "", dataAiHint: "" }); setImagePreview(null); }}, [productToEdit, productForm, showManageProductDialog]);
  useEffect(() => { if (stockIssueToEdit) stockIssueVoucherForm.reset(stockIssueToEdit); else stockIssueVoucherForm.reset({ date: new Date(), warehouseId: "", recipient: "", reason: "", items: [{ productId: "", quantityIssued: 1}], status: "مسودة", notes: ""});}, [stockIssueToEdit, stockIssueVoucherForm, showManageStockIssueDialog]);
  useEffect(() => { if (stockReceiptToEdit) stockReceiptVoucherForm.reset(stockReceiptToEdit); else stockReceiptVoucherForm.reset({ date: new Date(), warehouseId: "", source: "", items: [{ productId: "", quantityReceived: 1, costPricePerUnit:0 }], status: "مسودة", notes: ""});}, [stockReceiptToEdit, stockReceiptVoucherForm, showManageStockReceiptDialog]);
  useEffect(() => { if (stockRequisitionToEdit) stockRequisitionForm.reset(stockRequisitionToEdit); else stockRequisitionForm.reset({ requestDate: new Date(), requestingDepartmentOrPerson: "", requiredByDate: new Date(), items: [{ productId: "", quantityRequested: 1}], status: "جديد", overallJustification: ""});}, [stockRequisitionToEdit, stockRequisitionForm, showManageStockRequisitionDialog]);

  const handleProductSubmit = (values: ProductFormValues) => {
    if (productToEdit) {
      setProductsData(prev => prev.map(p => p.id === productToEdit.id ? { ...values, id: productToEdit.id! } : p));
      toast({ title: "تم التعديل", description: "تم تعديل بيانات المنتج بنجاح." });
    } else {
      setProductsData(prev => [...prev, { ...values, id: `ITEM${Date.now()}` }]);
      toast({ title: "تمت الإضافة", description: "تم إضافة المنتج بنجاح." });
    }
    setShowManageProductDialog(false);
    setProductToEdit(null);
    setImagePreview(null);
  };
  const handleDeleteProduct = (productId: string) => {
    setProductsData(prev => prev.filter(p => p.id !== productId));
    toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح.", variant: "destructive" });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setImagePreview(dataUri);
        productForm.setValue('image', dataUri);
      } catch (error) {
        console.error("Error converting file to data URI:", error);
        toast({ title: "خطأ في رفع الصورة", description: "لم يتمكن النظام من معالجة ملف الصورة.", variant: "destructive" });
      }
    }
  };

  const handleStartStocktakeSubmit = (values: StocktakeInitiationFormValues) => {
    console.log("Starting new stocktake with values:", values);
    toast({ title: "تم بدء عملية جرد جديدة", description: `سيتم جرد المستودع: ${mockWarehouses.find(w => w.id === values.warehouseId)?.name || values.warehouseId} بتاريخ ${values.stocktakeDate.toLocaleDateString('ar-SA')}.`, });
    setShowStartStocktakeDialog(false);
    stocktakeInitiationForm.reset();
  };
  const handleViewStocktakeDetails = () => {
    setSelectedStocktakeForView(mockStocktakeDetail);
    setShowViewStocktakeDetailsDialog(true);
  };

  const handleStockIssueSubmit = (values: StockIssueVoucherFormValues) => {
    if (stockIssueToEdit) {
        setStockIssueVouchers(prev => prev.map(v => v.id === stockIssueToEdit.id ? {...values, id: stockIssueToEdit.id!} : v));
        toast({ title: "تم التعديل", description: "تم تعديل إذن الصرف بنجاح." });
    } else {
        setStockIssueVouchers(prev => [...prev, {...values, id: `SIV${Date.now()}`}]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء إذن الصرف بنجاح." });
    }
    setShowManageStockIssueDialog(false);
    setStockIssueToEdit(null);
  };

  const handleStockReceiptSubmit = (values: StockReceiptVoucherFormValues) => {
    if (stockReceiptToEdit) {
        setStockReceiptVouchers(prev => prev.map(v => v.id === stockReceiptToEdit.id ? {...values, id: stockReceiptToEdit.id!} : v));
        toast({ title: "تم التعديل", description: "تم تعديل إذن الإضافة بنجاح." });
    } else {
        setStockReceiptVouchers(prev => [...prev, {...values, id: `SRV${Date.now()}`}]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء إذن الإضافة بنجاح." });
    }
    setShowManageStockReceiptDialog(false);
    setStockReceiptToEdit(null);
  };

  const handleStockRequisitionSubmit = (values: StockRequisitionFormValues) => {
    if (stockRequisitionToEdit) {
        setStockRequisitions(prev => prev.map(r => r.id === stockRequisitionToEdit!.id ? {...values, id: stockRequisitionToEdit!.id} : r));
        toast({ title: "تم التعديل", description: "تم تعديل طلب الصرف بنجاح." });
    } else {
        setStockRequisitions(prev => [...prev, {...values, id: `SRQ${Date.now()}`}]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء طلب الصرف بنجاح." });
    }
    setShowManageStockRequisitionDialog(false);
    setStockRequisitionToEdit(null);
  };

  const selectedUnit = productForm.watch("unit");
  
  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">إدارة المخزون والمستودعات</h1>
        <Dialog open={showManageProductDialog} onOpenChange={(isOpen) => { setShowManageProductDialog(isOpen); if (!isOpen) {setProductToEdit(null); setImagePreview(null);} }}>
          <DialogTrigger asChild><Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setProductToEdit(null); productForm.reset(); setImagePreview(null); setShowManageProductDialog(true); }}><PackagePlus className="me-2 h-4 w-4" /> إضافة منتج/صنف</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader><DialogTitle>{productToEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج/صنف جديد'}</DialogTitle><DialogDescriptionComponent>أدخل تفاصيل المنتج أو الصنف.</DialogDescriptionComponent></DialogHeader>
            <Form {...productForm}><form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
              {/* Product Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={productForm.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU / الرمز</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم المنتج</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={productForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={productForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>الفئة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl><SelectContent>{mockCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="unit" render={({ field }) => (<FormItem><FormLabel>الوحدة الأساسية</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الوحدة" /></SelectTrigger></FormControl><SelectContent>{mockUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              </div>
                {(selectedUnit === "صندوق" || selectedUnit === "كرتون" || selectedUnit === "علبة") && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-muted/30">
                      <FormField control={productForm.control} name="itemsPerParentUnit" render={({ field }) => (<FormItem><FormLabel>عدد الوحدات الفرعية بالوحدة الأساسية</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={productForm.control} name="subUnit" render={({ field }) => (<FormItem><FormLabel>نوع الوحدة الفرعية</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الوحدة الفرعية" /></SelectTrigger></FormControl><SelectContent>{mockSubUnits.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={productForm.control} name="subUnitSellingPrice" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>سعر بيع الوحدة الفرعية (اختياري)</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={productForm.control} name="costPrice" render={({ field }) => (<FormItem><FormLabel>سعر التكلفة</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="sellingPrice" render={({ field }) => (<FormItem><FormLabel>سعر البيع</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={productForm.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>الكمية الحالية</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="reorderLevel" render={({ field }) => (<FormItem><FormLabel>حد إعادة الطلب</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={productForm.control} name="location" render={({ field }) => (<FormItem><FormLabel>الموقع بالمستودع</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={productForm.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>الباركود</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={productForm.control} name="supplierId" render={({ field }) => (<FormItem><FormLabel>المورد الافتراضي (اختياري)</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl><SelectContent>{mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={productForm.control} name="image" render={({ field }) => (
                    <FormItem>
                        <FormLabel>صورة المنتج</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="bg-background"/>
                        </FormControl>
                        {imagePreview && <Image src={imagePreview} alt="معاينة المنتج" width={100} height={100} className="mt-2 rounded-md border object-cover" data-ai-hint={productForm.getValues("dataAiHint") || "product"} />}
                        <FormMessage />
                    </FormItem>
                )}
                <FormField control={productForm.control} name="dataAiHint" render={({ field }) => (
                    <FormItem>
                        <FormLabel>وصف الصورة (AI Hint)</FormLabel>
                        <FormControl><Input placeholder="مثال: مكتب خشبي (كلمتين كحد أقصى)" {...field} className="bg-background" /></FormControl>
                        <DialogDescriptionComponent className="text-xs text-muted-foreground">
                            كلمة أو كلمتين للبحث عن صور مشابهة في حالة عدم رفع صورة.
                        </DialogDescriptionComponent>
                        <FormMessage />
                    </FormItem>
                )}

              <DialogFooter><Button type="submit">{productToEdit ? 'حفظ التعديلات' : 'حفظ المنتج'}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="itemsList" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="itemsList" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Package className="inline-block me-2 h-4 w-4" /> قائمة المنتجات</TabsTrigger>
          <TabsTrigger value="stockIssue" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><PackageMinus className="inline-block me-2 h-4 w-4" /> أذونات الصرف</TabsTrigger>
          <TabsTrigger value="stockReceipt" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ArchiveRestore className="inline-block me-2 h-4 w-4" /> أذونات الإضافة</TabsTrigger>
          <TabsTrigger value="stockRequisition" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ClipboardList className="inline-block me-2 h-4 w-4" /> طلبات الصرف</TabsTrigger>
          <TabsTrigger value="stockMovement" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><History className="inline-block me-2 h-4 w-4" /> حركة المخزون</TabsTrigger>
          <TabsTrigger value="stocktaking" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><SlidersHorizontal className="inline-block me-2 h-4 w-4" /> الجرد والتسويات</TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BarChart3 className="inline-block me-2 h-4 w-4" /> تقارير المخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="itemsList">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>قائمة الأصناف</CardTitle>
                <CardDescription>
                    تعريف الأصناف، الوحدات، الأسعار، وإدارة مواقع التخزين. تنبيهات الحد الأدنى لإعادة الطلب.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث في الأصناف..." className="pr-10 w-full sm:w-64 bg-background" />
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
                        <TableHead>كود الصنف</TableHead>
                        <TableHead>اسم الصنف</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>الوحدة</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الكمية الحالية</TableHead>
                        <TableHead>حد إعادة الطلب</TableHead>
                        <TableHead>الموقع</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {productsData.map((product) => (
                        <TableRow key={product.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{product.sku}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {product.image ? (
                                        <Image src={product.image} alt={product.name} width={32} height={32} className="rounded-sm object-cover" data-ai-hint={product.dataAiHint || 'product image'}/>
                                    ) : (
                                        <div className="w-8 h-8 bg-muted rounded-sm flex items-center justify-center text-muted-foreground text-xs" data-ai-hint={product.dataAiHint || 'product'}>ERP</div>
                                    )}
                                    {product.name}
                                </div>
                            </TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.unit}</TableCell>
                            <TableCell>{product.sellingPrice.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                            <TableCell className={product.quantity < product.reorderLevel ? 'text-destructive font-semibold' : ''}>{product.quantity}</TableCell>
                            <TableCell>{product.reorderLevel}</TableCell>
                            <TableCell>{product.location}</TableCell>
                            <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setProductToEdit(product); setShowManageProductDialog(true); }}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                    <AlertDialogDescriptionComponentClass>
                                    لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج "{product.name}" نهائياً.
                                    </AlertDialogDescriptionComponentClass>
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

        <TabsContent value="stockIssue">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>أذونات صرف المخزون</CardTitle><CardDescription>إدارة وتسجيل أذونات صرف الأصناف من المستودعات.</CardDescription></CardHeader>
            <CardContent>
                <div className="mb-4"><Button onClick={() => {setStockIssueToEdit(null); stockIssueVoucherForm.reset({ date: new Date(), warehouseId: "", recipient: "", reason: "", items: [{productId: "", quantityIssued: 1}], status: "مسودة", notes: "" }); setShowManageStockIssueDialog(true);}}><PlusCircle className="me-2 h-4 w-4"/> إنشاء إذن صرف جديد</Button></div>
                <Dialog open={showManageStockIssueDialog} onOpenChange={(isOpen) => { setShowManageStockIssueDialog(isOpen); if (!isOpen) setStockIssueToEdit(null);}}>
                    <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader><DialogTitle>{stockIssueToEdit ? "تعديل إذن صرف" : "إنشاء إذن صرف جديد"}</DialogTitle></DialogHeader>
                        <Form {...stockIssueVoucherForm}><form onSubmit={stockIssueVoucherForm.handleSubmit(handleStockIssueSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                            <FormField control={stockIssueVoucherForm.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange}/><FormMessage/></FormItem>)}/>
                            <FormField control={stockIssueVoucherForm.control} name="warehouseId" render={({ field }) => ( <FormItem><FormLabel>المستودع المصدر</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المستودع"/></SelectTrigger></FormControl><SelectContent>{mockWarehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <FormField control={stockIssueVoucherForm.control} name="recipient" render={({ field }) => ( <FormItem><FormLabel>الجهة المستلمة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الجهة"/></SelectTrigger></FormControl><SelectContent>{mockRecipients.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <FormField control={stockIssueVoucherForm.control} name="reason" render={({ field }) => ( <FormItem><FormLabel>سبب الصرف</FormLabel><FormControl><Input placeholder="مثال: أمر بيع #123" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem>)}/>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                {stockIssueItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-2 p-1 border-b">
                                        <FormField control={stockIssueVoucherForm.control} name={`items.${index}.productId`} render={({ field }) => (<FormItem className="col-span-6"><FormLabel className="text-xs">الصنف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف"/></SelectTrigger></FormControl><SelectContent>{productsData.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)}/>
                                        <FormField control={stockIssueVoucherForm.control} name={`items.${index}.quantityIssued`} render={({ field }) => (<FormItem className="col-span-4"><FormLabel className="text-xs">الكمية</FormLabel><FormControl><Input type="number" {...field} className="bg-background h-9 text-xs"/></FormControl><FormMessage className="text-xs"/></FormItem>)}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStockIssueItem(index)} className="col-span-2 self-end h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                            </ScrollArea>
                            <Button type="button" variant="outline" onClick={() => appendStockIssueItem({ productId: "", quantityIssued: 1})} className="text-xs h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة صنف</Button>
                            <FormField control={stockIssueVoucherForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage/></FormItem>)}/>
                            <DialogFooter><Button type="submit">{stockIssueToEdit ? "حفظ التعديلات" : "حفظ إذن الصرف"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                        </form></Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader><TableRow><TableHead>رقم الإذن</TableHead><TableHead>التاريخ</TableHead><TableHead>المستودع</TableHead><TableHead>المستلم</TableHead><TableHead>السبب</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>{stockIssueVouchers.map(v => (<TableRow key={v.id}><TableCell>{v.id}</TableCell><TableCell>{v.date.toLocaleDateString('ar-SA')}</TableCell><TableCell>{mockWarehouses.find(w=>w.id === v.warehouseId)?.name}</TableCell><TableCell>{mockRecipients.find(r=>r.id === v.recipient)?.name}</TableCell><TableCell>{v.reason}</TableCell><TableCell><Badge variant={v.status === "معتمد" ? "default" : "outline"}>{v.status}</Badge></TableCell><TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => {setStockIssueToEdit(v);setShowManageStockIssueDialog(true);}}><Edit className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stockReceipt">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>أذونات إضافة للمخزون</CardTitle><CardDescription>تسجيل الأصناف الواردة إلى المستودعات من الموردين أو الإنتاج.</CardDescription></CardHeader>
            <CardContent>
                <div className="mb-4"><Button onClick={() => {setStockReceiptToEdit(null); stockReceiptVoucherForm.reset({date: new Date(), warehouseId: "", source: "", items: [{productId: "", quantityReceived: 1, costPricePerUnit:0}], status: "مسودة", notes: "" }); setShowManageStockReceiptDialog(true);}}><PlusCircle className="me-2 h-4 w-4"/> إنشاء إذن إضافة جديد</Button></div>
                <Dialog open={showManageStockReceiptDialog} onOpenChange={(isOpen) => { setShowManageStockReceiptDialog(isOpen); if (!isOpen) setStockReceiptToEdit(null);}}>
                     <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader><DialogTitle>{stockReceiptToEdit ? "تعديل إذن إضافة" : "إنشاء إذن إضافة جديد"}</DialogTitle></DialogHeader>
                        <Form {...stockReceiptVoucherForm}><form onSubmit={stockReceiptVoucherForm.handleSubmit(handleStockReceiptSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                            <FormField control={stockReceiptVoucherForm.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange}/><FormMessage/></FormItem>)}/>
                            <FormField control={stockReceiptVoucherForm.control} name="warehouseId" render={({ field }) => ( <FormItem><FormLabel>المستودع المستلم</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المستودع"/></SelectTrigger></FormControl><SelectContent>{mockWarehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <FormField control={stockReceiptVoucherForm.control} name="source" render={({ field }) => ( <FormItem><FormLabel>المصدر</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المصدر"/></SelectTrigger></FormControl><SelectContent>{mockReceiptSources.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <FormField control={stockReceiptVoucherForm.control} name="reference" render={({ field }) => ( <FormItem><FormLabel>المرجع (PO/فاتورة مورد)</FormLabel><FormControl><Input placeholder="رقم أمر الشراء أو فاتورة المورد" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem>)}/>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                {stockReceiptItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-2 p-1 border-b">
                                        <FormField control={stockReceiptVoucherForm.control} name={`items.${index}.productId`} render={({ field }) => (<FormItem className="col-span-5"><FormLabel className="text-xs">الصنف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف"/></SelectTrigger></FormControl><SelectContent>{productsData.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)}/>
                                        <FormField control={stockReceiptVoucherForm.control} name={`items.${index}.quantityReceived`} render={({ field }) => (<FormItem className="col-span-3"><FormLabel className="text-xs">الكمية</FormLabel><FormControl><Input type="number" {...field} className="bg-background h-9 text-xs"/></FormControl><FormMessage className="text-xs"/></FormItem>)}/>
                                        <FormField control={stockReceiptVoucherForm.control} name={`items.${index}.costPricePerUnit`} render={({ field }) => (<FormItem className="col-span-3"><FormLabel className="text-xs">التكلفة</FormLabel><FormControl><Input type="number" {...field} className="bg-background h-9 text-xs"/></FormControl><FormMessage className="text-xs"/></FormItem>)}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStockReceiptItem(index)} className="col-span-1 self-end h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                            </ScrollArea>
                            <Button type="button" variant="outline" onClick={() => appendStockReceiptItem({ productId: "", quantityReceived: 1, costPricePerUnit:0})} className="text-xs h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة صنف</Button>
                            <FormField control={stockReceiptVoucherForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage/></FormItem>)}/>
                             <FormField control={stockReceiptVoucherForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة"/></SelectTrigger></FormControl><SelectContent><SelectItem value="مسودة">مسودة</SelectItem><SelectItem value="مرحل للمخزون">مرحل للمخزون</SelectItem><SelectItem value="ملغي">ملغي</SelectItem></SelectContent></Select><FormMessage/></FormItem>)}/>
                            <DialogFooter><Button type="submit">{stockReceiptToEdit ? "حفظ التعديلات" : "حفظ إذن الإضافة"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                        </form></Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader><TableRow><TableHead>رقم الإذن</TableHead><TableHead>التاريخ</TableHead><TableHead>المستودع</TableHead><TableHead>المصدر</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>{stockReceiptVouchers.map(v => (<TableRow key={v.id}><TableCell>{v.id}</TableCell><TableCell>{v.date.toLocaleDateString('ar-SA')}</TableCell><TableCell>{mockWarehouses.find(w=>w.id === v.warehouseId)?.name}</TableCell><TableCell>{mockReceiptSources.find(s=>s.id === v.source)?.name || v.source}</TableCell><TableCell><Badge variant={v.status === "مرحل للمخزون" ? "default" : "outline"}>{v.status}</Badge></TableCell><TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => {setStockReceiptToEdit(v);setShowManageStockReceiptDialog(true);}}><Edit className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stockRequisition">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>طلبات صرف المواد</CardTitle><CardDescription>إدارة طلبات صرف المواد من الأقسام أو للمشاريع.</CardDescription></CardHeader>
            <CardContent>
                <div className="mb-4"><Button onClick={() => {setStockRequisitionToEdit(null); stockRequisitionForm.reset({requestDate: new Date(), requestingDepartmentOrPerson: "", requiredByDate: new Date(), items: [{productId: "", quantityRequested: 1}], status: "جديد", overallJustification: "" }); setShowManageStockRequisitionDialog(true);}}><PlusCircle className="me-2 h-4 w-4"/> إنشاء طلب صرف جديد</Button></div>
                <Dialog open={showManageStockRequisitionDialog} onOpenChange={(isOpen) => { setShowManageStockRequisitionDialog(isOpen); if (!isOpen) setStockRequisitionToEdit(null);}}>
                    <DialogContent className="sm:max-w-lg" dir="rtl">
                        <DialogHeader><DialogTitle>{stockRequisitionToEdit ? "تعديل طلب صرف" : "إنشاء طلب صرف جديد"}</DialogTitle></DialogHeader>
                        <Form {...stockRequisitionForm}><form onSubmit={stockRequisitionForm.handleSubmit(handleStockRequisitionSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                            <FormField control={stockRequisitionForm.control} name="requestDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>تاريخ الطلب</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange}/><FormMessage/></FormItem>)}/>
                            <FormField control={stockRequisitionForm.control} name="requestingDepartmentOrPerson" render={({ field }) => ( <FormItem><FormLabel>الجهة الطالبة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الجهة الطالبة"/></SelectTrigger></FormControl><SelectContent>{mockDepartments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}{mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <FormField control={stockRequisitionForm.control} name="requiredByDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>تاريخ الحاجة</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange}/><FormMessage/></FormItem>)}/>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                {stockRequisitionItemsFields.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end mb-2 p-1 border-b">
                                        <FormField control={stockRequisitionForm.control} name={`items.${index}.productId`} render={({ field }) => (<FormItem className="col-span-7"><FormLabel className="text-xs">الصنف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الصنف"/></SelectTrigger></FormControl><SelectContent>{productsData.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)}/>
                                        <FormField control={stockRequisitionForm.control} name={`items.${index}.quantityRequested`} render={({ field }) => (<FormItem className="col-span-4"><FormLabel className="text-xs">الكمية</FormLabel><FormControl><Input type="number" {...field} className="bg-background h-9 text-xs"/></FormControl><FormMessage className="text-xs"/></FormItem>)}/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStockRequisitionItem(index)} className="col-span-1 self-end h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4"/></Button>
                                    </div>
                                ))}
                            </ScrollArea>
                            <Button type="button" variant="outline" onClick={() => appendStockRequisitionItem({ productId: "", quantityRequested: 1})} className="text-xs h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة صنف</Button>
                            <FormField control={stockRequisitionForm.control} name="overallJustification" render={({ field }) => (<FormItem><FormLabel>المبرر العام للطلب</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage/></FormItem>)}/>
                            <FormField control={stockRequisitionForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة"/></SelectTrigger></FormControl><SelectContent>{["جديد", "قيد المراجعة", "موافق عليه", "مرفوض", "تم الصرف جزئياً", "تم الصرف بالكامل", "ملغي"].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                            <DialogFooter><Button type="submit">{stockRequisitionToEdit ? "حفظ التعديلات" : "إرسال الطلب"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                        </form></Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader><TableRow><TableHead>رقم الطلب</TableHead><TableHead>التاريخ</TableHead><TableHead>الجهة الطالبة</TableHead><TableHead>تاريخ الحاجة</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>{stockRequisitions.map(r => (<TableRow key={r.id}><TableCell>{r.id}</TableCell><TableCell>{r.requestDate.toLocaleDateString('ar-SA')}</TableCell><TableCell>{mockDepartments.find(d=>d.id===r.requestingDepartmentOrPerson)?.name || mockUsers.find(u=>u.id===r.requestingDepartmentOrPerson)?.name}</TableCell><TableCell>{r.requiredByDate.toLocaleDateString('ar-SA')}</TableCell><TableCell><Badge variant={r.status === "موافق عليه" ? "default" : r.status === "مرفوض" ? "destructive" : "outline"}>{r.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1">
                            {r.status === "جديد" || r.status === "قيد المراجعة" ? (<Button variant="ghost" size="icon" onClick={() => alert("موافقة على الطلب")}><CheckCircle className="h-4 w-4 text-green-600"/></Button>) : null}
                            <Button variant="ghost" size="icon" onClick={() => {setStockRequisitionToEdit(r);setShowManageStockRequisitionDialog(true);}}><Edit className="h-4 w-4"/></Button>
                        </TableCell>
                    </TableRow>))}</TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stockMovement">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>حركة المخزون</CardTitle>
                <CardDescription>
                عرض سجل مفصل لجميع حركات الأصناف، بما في ذلك الدخول والخروج والتحويلات والتسويات.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث برقم الصنف أو المرجع..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DatePickerWithPresets mode="range" />
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
                            <Badge
                            variant={
                                movement.type.includes("دخول") || movement.type.includes("زيادة") ? "default" :
                                movement.type.includes("خروج") || movement.type.includes("نقص") ? "destructive" :
                                "secondary"
                            }
                            className="whitespace-nowrap"
                            >
                            {movement.type}
                            </Badge>
                        </TableCell>
                        <TableCell>{productsData.find(p => p.id === movement.item)?.name || movement.item}</TableCell>
                        <TableCell>{movement.quantity}</TableCell>
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
                    <CardDescription>
                    إدارة عمليات الجرد الدوري والمستمر، وتسجيل الفروقات والتسويات اللازمة.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2 items-center">
                    <Dialog open={showStartStocktakeDialog} onOpenChange={setShowStartStocktakeDialog}>
                        <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow">
                            <PlusCircle className="me-2 h-4 w-4" /> بدء عملية جرد جديدة
                        </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>بدء عملية جرد جديدة</DialogTitle>
                            <DialogDescriptionComponent>
                            أدخل تفاصيل عملية الجرد الجديدة.
                            </DialogDescriptionComponent>
                        </DialogHeader>
                        <Form {...stocktakeInitiationForm}>
                        <form onSubmit={stocktakeInitiationForm.handleSubmit(handleStartStocktakeSubmit)} className="space-y-4 py-4">
                            <FormField control={stocktakeInitiationForm.control} name="stocktakeDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ الجرد</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem>)}/>
                            <FormField control={stocktakeInitiationForm.control} name="warehouseId" render={({ field }) => (<FormItem><FormLabel>المستودع</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المستودع" /></SelectTrigger></FormControl><SelectContent>{mockWarehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={stocktakeInitiationForm.control} name="responsiblePerson" render={({ field }) => (<FormItem><FormLabel>المسؤول عن الجرد</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المسؤول" /></SelectTrigger></FormControl><SelectContent>{mockUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                            <FormField control={stocktakeInitiationForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)}/>
                            <DialogFooter><Button type="submit">بدء الجرد</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                        </form>
                        </Form>
                        </DialogContent>
                    </Dialog>
                    <Button variant="secondary" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => alert("سيتم فتح شاشة إدخال نتائج الجرد.")}>
                        <Upload className="me-2 h-4 w-4" /> إدخال نتائج الجرد
                    </Button>
                    </div>
                    <CardDescription className="mb-2">سجل عمليات الجرد السابقة:</CardDescription>
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>رقم الجرد</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>المستودع</TableHead>
                            <TableHead>المسؤول</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        <TableRow className="hover:bg-muted/50">
                            <TableCell>STK-2024-06-30-A</TableCell>
                            <TableCell>2024-06-30</TableCell>
                            <TableCell>مستودع A</TableCell>
                            <TableCell>فريق الجرد ألف</TableCell>
                            <TableCell><Badge>مكتمل</Badge></TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={handleViewStocktakeDetails}><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                        {/* Add more rows for other stocktakes */}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="reports">
            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>تقارير المخزون</CardTitle>
                <CardDescription>
                عرض تحليلات ورسوم بيانية لأداء المخزون، مستويات الكميات، والتكاليف.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventoryReportTypes.map(report => (
                    <Card key={report.name} className="flex flex-col items-center justify-center p-4 hover:shadow-xl transition-shadow duration-300 shadow-md rounded-lg">
                    <report.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-base mb-1 text-center">{report.name}</CardTitle>
                    <CardDescription className="text-xs text-center mb-3">{report.description}</CardDescription>
                    <Button variant="outline" size="sm" className="w-full shadow-sm hover:shadow-md transition-shadow" onClick={() => {setCurrentReport(report); alert(`عرض تقرير: ${report.name}`)}}><Eye className="me-2 h-4 w-4" /> عرض/تحميل</Button>
                    </Card>
                ))}
                </div>
                 {/* Example Chart */}
                <Card>
                    <CardHeader><CardTitle>مبيعات الأصناف (آخر 6 أشهر)</CardTitle></CardHeader>
                    <CardContent className="h-[300px] pe-2">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={sampleChartData} layout="vertical" barCategoryGap="20%">
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="month" type="category" tickLine={false} axisLine={false} width={60} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="ITEM001" fill="var(--color-ITEM001)" radius={4} />
                            <Bar dataKey="ITEM002" fill="var(--color-ITEM002)" radius={4} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showViewStocktakeDetailsDialog} onOpenChange={setShowViewStocktakeDetailsDialog}>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تفاصيل الجرد: {selectedStocktakeForView?.id}</DialogTitle>
                </DialogHeader>
                {selectedStocktakeForView && (
                    <div className="printable-area" id="printable-stocktake-report">
                        <div className="print-only mb-6 flex justify-between items-center border-b pb-2">
                            <div className="flex items-center gap-2">
                                <AppLogo />
                                <div>
                                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                                </div>
                            </div>
                            <div className="text-left">
                                <h3 className="text-md font-semibold">تقرير تفاصيل الجرد</h3>
                                <p className="text-xs">رقم الجرد: {selectedStocktakeForView.id}</p>
                            </div>
                        </div>

                        <div className="space-y-3 py-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <p><strong>رقم الجرد:</strong> {selectedStocktakeForView.id}</p>
                                <p><strong>تاريخ الجرد:</strong> {selectedStocktakeForView.date}</p>
                                <p><strong>المستودع:</strong> {selectedStocktakeForView.warehouse}</p>
                                <p><strong>المسؤول:</strong> {selectedStocktakeForView.responsible}</p>
                                <p><strong>الحالة:</strong> <Badge>{selectedStocktakeForView.status}</Badge></p>
                                <p><strong>عدد الأصناف:</strong> {selectedStocktakeForView.itemsCounted}</p>
                                <p><strong>الفروقات:</strong> {selectedStocktakeForView.discrepanciesFound}</p>
                            </div>
                            {selectedStocktakeForView.notes && <p className="text-sm"><strong>ملاحظات:</strong> {selectedStocktakeForView.notes}</p>}

                            <h4 className="font-semibold mt-3 text-md">تفاصيل الأصناف:</h4>
                            {selectedStocktakeForView.items && selectedStocktakeForView.items.length > 0 ? (
                                <Table size="sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>المنتج</TableHead>
                                            <TableHead className="text-center">الكمية المتوقعة</TableHead>
                                            <TableHead className="text-center">الكمية المعدودة</TableHead>
                                            <TableHead className="text-center">الفرق</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedStocktakeForView.items.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{item.productName} ({item.productId})</TableCell>
                                                <TableCell className="text-center">{item.expectedQuantity}</TableCell>
                                                <TableCell className="text-center">{item.countedQuantity}</TableCell>
                                                <TableCell className={`text-center font-semibold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-destructive' : ''}`}>
                                                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : <p className="text-muted-foreground text-sm">لا توجد تفاصيل أصناف لهذا الجرد.</p>}
                        </div>
                         <div className="print-only mt-8 pt-4 border-t text-xs text-muted-foreground text-center">
                            <p>هذا التقرير تم إنشاؤه بواسطة نظام المستقبل ERP في {new Date().toLocaleString('ar-SA')}</p>
                        </div>
                    </div>
                )}
                <DialogFooter className="print-hidden">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="me-2 h-4 w-4"/> طباعة التقرير
                  </Button>
                  <DialogClose asChild><Button type="button">إغلاق</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    
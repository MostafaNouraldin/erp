
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, Package, Warehouse, History, BarChart3, SlidersHorizontal, Eye, Download, PackagePlus, Upload, Printer, MinusCircle, PackageMinus, ArchiveRestore, ClipboardList, CheckCircle, AlertTriangle, Truck, Layers, FileSpreadsheet, ListTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import Label instead of FormLabel for non-form contexts
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponentClass, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // Keep FormLabel for RHF instances
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import AppLogo from '@/components/app-logo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/use-currency';
// TODO: Re-enable when actions are properly connected
// import { addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory } from './actions';


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

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الفئة مطلوب"),
  description: z.string().optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;


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
  differenceValue?: number; // Added
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

// Mock data (some are kept for selection inputs)
const mockUnits = ["قطعة", "صندوق", "كرتون", "علبة", "كيلوجرام", "متر", "لتر", "حبة", "سنتيمتر"];
const mockSubUnits = ["قطعة", "حبة", "متر", "سنتيمتر"];
const mockWarehouses = [{ id: "WH001", name: "المستودع الرئيسي" }, { id: "WH002", name: "مستودع فرعي أ" }];
const mockUsers = [{ id: "USR001", name: "فريق الجرد أ" }, { id: "USR002", name: "أحمد المسؤول" }, { id: "USR003", name: "مدير المخازن" }];
const mockDepartments = [{id: "DEP001", name: "قسم المبيعات"}, {id: "DEP002", name: "قسم الصيانة"}];
const mockRecipients = [...mockDepartments, {id: "CUST001", name: "عميل X"}, {id: "WH002", name: "مستودع فرعي أ (تحويل)"}];

const initialStockIssueVouchers: StockIssueVoucherFormValues[] = [
    {id: "SIV001", date: new Date("2024-07-28"), warehouseId: "WH001", recipient: "DEP001", reason: "استخدام داخلي لقسم المبيعات", items: [{productId: "ITEM003", quantityIssued: 2}, {productId: "ITEM005", quantityIssued: 5}], status: "معتمد", issuedBy: "USR003"},
];
const initialStockReceiptVouchers: StockReceiptVoucherFormValues[] = [
    {id: "SRV001", date: new Date("2024-07-29"), warehouseId: "WH001", source: "SUP001", reference: "PO-123", items: [{productId: "ITEM001", quantityReceived: 10, costPricePerUnit: 5750}], status: "مرحل للمخزون", receivedBy: "USR003"},
];
const initialStockRequisitions: StockRequisitionFormValues[] = [
    {id: "SRQ001", requestDate: new Date("2024-07-25"), requestingDepartmentOrPerson: "DEP002", requiredByDate: new Date("2024-07-30"), items: [{productId: "ITEM002", quantityRequested: 1, justification: "طابعة بديلة"}], status: "موافق عليه"},
];

const stockMovements = [ { id: "MV001", date: new Date("2024-07-20"), type: "دخول (شراء)", item: "ITEM001", quantity: 20, fromTo: "مورد X", reference: "PO-123" }, { id: "MV002", date: new Date("2024-07-21"), type: "خروج (بيع)", item: "ITEM003", quantity: 10, fromTo: "عميل Y", reference: "SO-456" }, { id: "MV003", date: new Date("2024-07-22"), type: "تحويل داخلي", item: "ITEM002", quantity: 2, fromTo: "مستودع A -> مستودع B", reference: "TRN-001" }, { id: "MV004", date: new Date("2024-07-23"), type: "تعديل جرد (زيادة)", item: "ITEM005", quantity: 5, fromTo: "جرد سنوي", reference: "ADJ-001" },];
const inventoryReportTypes = [ 
    { key: "itemMovement", name: "تقرير حركة صنف", icon: History, description: "تتبع حركة صنف معين خلال فترة." }, 
    { key: "valuation", name: "تقرير تقييم المخزون", icon: Layers, description: "عرض قيمة المخزون الحالي بالتكلفة والسعر." }, 
    { key: "stocktakeDiscrepancy", name: "تقرير الجرد والفروقات", icon: SlidersHorizontal, description: "مقارنة الكميات الفعلية بالمسجلة وكشف الفروقات." }, 
    { key: "obsoleteStock", name: "تقرير الأصناف الراكدة", icon: AlertTriangle, description: "تحديد الأصناف التي لم تشهد حركة لفترة." }, 
    { key: "locationReport", name: "تقرير مواقع التخزين", icon: Warehouse, description: "عرض الأصناف وكمياتها في كل موقع تخزين." }, 
    { key: "supplierItems", name: "تقرير الأصناف حسب المورد", icon: Truck, description: "عرض الأصناف المرتبطة بكل مورد." },
];
const sampleChartData = [ { month: "يناير", "ITEM001": 100, "ITEM002": 50 }, { month: "فبراير", "ITEM001": 120, "ITEM002": 60 }, { month: "مارس", "ITEM001": 80, "ITEM002": 40 }, { month: "ابريل", "ITEM001": 150, "ITEM002": 70 }, { month: "مايو", "ITEM001": 110, "ITEM002": 55 }, { month: "يونيو", "ITEM001": 130, "ITEM002": 65 },];
const chartConfig = { "ITEM001": { label: "لابتوب Dell XPS 15", color: "hsl(var(--chart-1))" }, "ITEM002": { label: "طابعة HP LaserJet Pro", color: "hsl(var(--chart-2))" },} satisfies ChartConfig;

const mockStocktakeDetail: StocktakeDetails = { id: "STK-2024-06-30-A", date: new Date("2024-06-30").toLocaleDateString('ar-SA'), warehouse: "مستودع A", status: "مكتمل", responsible: "فريق الجرد ألف", itemsCounted: 3, discrepanciesFound: 2, notes: "تم الجرد الدوري للمستودع أ. بعض الفروقات الطفيفة تم تسجيلها.", items: [ { productId: "ITEM001", productName: "لابتوب Dell XPS 15", expectedQuantity: 48, countedQuantity: 48, difference: 0, differenceValue: 0 }, { productId: "ITEM002", productName: "طابعة HP LaserJet Pro", expectedQuantity: 7, countedQuantity: 6, difference: -1, differenceValue: -1000 }, { productId: "ITEM003", productName: "ورق طباعة A4 (صندوق)", expectedQuantity: 195, countedQuantity: 198, difference: 3, differenceValue: 360 },],};


export default function InventoryClientComponent({ initialData }: { initialData: { products: any[], categories: any[], suppliers: any[] } }) {
  const [productsData, setProductsData] = useState<ProductFormValues[]>(initialData.products);
  const [categoriesData, setCategoriesData] = useState<CategoryFormValues[]>(initialData.categories);
  const [suppliersData, setSuppliersData] = useState<any[]>(initialData.suppliers);
  const [showManageProductDialog, setShowManageProductDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductFormValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  const [showManageCategoryDialog, setShowManageCategoryDialog] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryFormValues | null>(null);

  const [currentReport, setCurrentReport] = useState<{key: string, name: string, description: string, icon: React.ElementType} | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportFilters, setReportFilters] = useState<{itemId?:string, dateRange?: {from?: Date, to?:Date}, warehouseId?: string, supplierId?: string, lastMovementDate?: Date}>({});

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
  const categoryForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: "", description: "" }});
  const stocktakeInitiationForm = useForm<StocktakeInitiationFormValues>({ resolver: zodResolver(stocktakeInitiationSchema), defaultValues: { stocktakeDate: new Date(), warehouseId: "", responsiblePerson: "", notes: "" }});

  const stockIssueVoucherForm = useForm<StockIssueVoucherFormValues>({ resolver: zodResolver(stockIssueVoucherSchema), defaultValues: { date: new Date(), warehouseId: "", recipient: "", reason: "", items: [{ productId: "", quantityIssued: 1}], status: "مسودة", notes: ""}});
  const { fields: stockIssueItemsFields, append: appendStockIssueItem, remove: removeStockIssueItem } = useFieldArray({ control: stockIssueVoucherForm.control, name: "items" });

  const stockReceiptVoucherForm = useForm<StockReceiptVoucherFormValues>({ resolver: zodResolver(stockReceiptVoucherSchema), defaultValues: { date: new Date(), warehouseId: "", source: "", items: [{ productId: "", quantityReceived: 1, costPricePerUnit:0 }], status: "مسودة", notes: ""}});
  const { fields: stockReceiptItemsFields, append: appendStockReceiptItem, remove: removeStockReceiptItem } = useFieldArray({ control: stockReceiptVoucherForm.control, name: "items" });

  const stockRequisitionForm = useForm<StockRequisitionFormValues>({ resolver: zodResolver(stockRequisitionSchema), defaultValues: { requestDate: new Date(), requestingDepartmentOrPerson: "", requiredByDate: new Date(), items: [{ productId: "", quantityRequested: 1}], status: "جديد", overallJustification: ""}});
  const { fields: stockRequisitionItemsFields, append: appendStockRequisitionItem, remove: removeStockRequisitionItem } = useFieldArray({ control: stockRequisitionForm.control, name: "items" });

  useEffect(() => { if (productToEdit) { productForm.reset(productToEdit); setImagePreview(productToEdit.image || null); } else { productForm.reset({ sku: "", name: "", description: "", category: "", unit: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 0, location: "", barcode: "", supplierId: "", itemsPerParentUnit: undefined, subUnit: undefined, subUnitSellingPrice: undefined, image: "", dataAiHint: "" }); setImagePreview(null); }}, [productToEdit, productForm, showManageProductDialog]);
  useEffect(() => { if (categoryToEdit) { categoryForm.reset(categoryToEdit); } else { categoryForm.reset({ name: "", description: "" }); }}, [categoryToEdit, categoryForm, showManageCategoryDialog]);
  useEffect(() => { if (stockIssueToEdit) stockIssueVoucherForm.reset(stockIssueToEdit); else stockIssueVoucherForm.reset({ date: new Date(), warehouseId: "", recipient: "", reason: "", items: [{ productId: "", quantityIssued: 1}], status: "مسودة", notes: ""});}, [stockIssueToEdit, stockIssueVoucherForm, showManageStockIssueDialog]);
  useEffect(() => { if (stockReceiptToEdit) stockReceiptVoucherForm.reset(stockReceiptToEdit); else stockReceiptVoucherForm.reset({ date: new Date(), warehouseId: "", source: "", items: [{ productId: "", quantityReceived: 1, costPricePerUnit:0 }], status: "مسودة", notes: ""});}, [stockReceiptToEdit, stockReceiptVoucherForm, showManageStockReceiptDialog]);
  useEffect(() => { if (stockRequisitionToEdit) stockRequisitionForm.reset(stockRequisitionToEdit); else stockRequisitionForm.reset({ requestDate: new Date(), requestingDepartmentOrPerson: "", requiredByDate: new Date(), items: [{ productId: "", quantityRequested: 1}], status: "جديد", overallJustification: ""});}, [stockRequisitionToEdit, stockRequisitionForm, showManageStockRequisitionDialog]);

  const handleProductSubmit = async (values: ProductFormValues) => {
    toast({ title: "متوقف مؤقتاً", description: "حفظ المنتجات معطل حالياً.", variant: "destructive"});
    // try {
    //   if (productToEdit) {
    //     await updateProduct({ ...values, id: productToEdit.id! });
    //     toast({ title: "تم التعديل", description: "تم تعديل بيانات المنتج بنجاح." });
    //   } else {
    //     await addProduct(values);
    //     toast({ title: "تمت الإضافة", description: "تم إضافة المنتج بنجاح." });
    //   }
    //   setShowManageProductDialog(false);
    //   setProductToEdit(null);
    //   setImagePreview(null);
    // } catch (error) {
    //   toast({ title: "خطأ", description: "لم يتم حفظ المنتج.", variant: "destructive" });
    // }
  };
  
  const handleCategorySubmit = async (values: CategoryFormValues) => {
    toast({ title: "متوقف مؤقتاً", description: "حفظ الفئات معطل حالياً.", variant: "destructive"});
    //  try {
    //     if (categoryToEdit) {
    //         await updateCategory({ ...values, id: categoryToEdit.id! });
    //         toast({ title: "تم التعديل", description: "تم تعديل الفئة بنجاح." });
    //     } else {
    //         await addCategory(values);
    //         toast({ title: "تمت الإضافة", description: "تم إضافة الفئة بنجاح." });
    //     }
    //     setShowManageCategoryDialog(false);
    //     setCategoryToEdit(null);
    // } catch (error) {
    //     toast({ title: "خطأ", description: "لم يتم حفظ الفئة.", variant: "destructive" });
    // }
  };

  const handleDeleteProduct = async (productId: string) => {
    toast({ title: "متوقف مؤقتاً", description: "حذف المنتجات معطل حالياً.", variant: "destructive"});
    // try {
    //     await deleteProduct(productId);
    //     toast({ title: "تم الحذف", description: "تم حذف المنتج بنجاح.", variant: "destructive" });
    // } catch (error) {
    //     toast({ title: "خطأ", description: "لم يتم حذف المنتج.", variant: "destructive" });
    // }
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    toast({ title: "متوقف مؤقتاً", description: "حذف الفئات معطل حالياً.", variant: "destructive"});
    // const isCategoryInUse = productsData.some(p => p.category === categoriesData.find(c => c.id === categoryId)?.name);
    // if(isCategoryInUse) {
    //     toast({ title: "خطأ", description: "لا يمكن حذف الفئة لأنها مستخدمة في بعض المنتجات.", variant: "destructive" });
    //     return;
    // }
    // try {
    //     await deleteCategory(categoryId);
    //     toast({ title: "تم الحذف", description: "تم حذف الفئة بنجاح.", variant: "destructive" });
    // } catch (error) {
    //     toast({ title: "خطأ", description: "لم يتم حذف الفئة.", variant: "destructive" });
    // }
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

    const generateReportData = (reportKey: string, filters: typeof reportFilters) => {
        // This is mock data generation. In a real app, you'd fetch and filter data.
        if (reportKey === "itemMovement") {
            return stockMovements
                .filter(m => !filters.itemId || m.item === filters.itemId)
                .filter(m => {
                    if (!filters.dateRange?.from || !filters.dateRange?.to) return true;
                    const moveDate = new Date(m.date);
                    return moveDate >= filters.dateRange.from && moveDate <= filters.dateRange.to;
                })
                .map(m => ({ ...m, itemName: productsData.find(p => p.id === m.item)?.name || m.item }));
        }
        if (reportKey === "valuation") {
            return productsData
                .filter(p => !filters.warehouseId || (p.location && p.location.includes(mockWarehouses.find(w=>w.id === filters.warehouseId)?.name || "")))
                .map(p => ({ 
                    ...p, 
                    totalCostValue: p.quantity * p.costPrice, 
                    totalSellingValue: p.quantity * p.sellingPrice 
                }));
        }
        if (reportKey === "stocktakeDiscrepancy") return mockStocktakeDetail.items;
        if (reportKey === "obsoleteStock") {
            return productsData
                .filter(p => p.quantity > 0 && (!filters.lastMovementDate || (stockMovements.filter(m => m.item === p.id && new Date(m.date) > filters.lastMovementDate!).length === 0)))
                .map(p => ({
                    ...p,
                    lastMovementDate: stockMovements.filter(m => m.item === p.id).sort((a,b) => b.date.getTime() - a.date.getTime())[0]?.date.toLocaleDateString('ar-SA') || "لا توجد حركة",
                    value: p.quantity * p.costPrice
                }));
        }
        if (reportKey === "locationReport") {
             return productsData
                .filter(p => !filters.warehouseId || (p.location && p.location.includes(mockWarehouses.find(w=>w.id === filters.warehouseId)?.name || "")))
                .map(p => ({location: p.location, name: p.name, quantity: p.quantity}));
        }
        if (reportKey === "supplierItems") {
            return productsData
                .filter(p => !filters.supplierId || p.supplierId === filters.supplierId)
                .map(p => ({
                    ...p,
                    lastPurchaseDate: stockMovements.find(m => m.item === p.id && m.type.includes("شراء") && m.fromTo === suppliersData.find(s=>s.id === p.supplierId)?.name)?.date.toLocaleDateString('ar-SA') || "N/A"
                }));
        }
        return [];
    };

    const handleViewReport = (report: typeof inventoryReportTypes[0]) => {
        setCurrentReport(report);
        setReportFilters({}); // Reset filters when opening a new report type
        setReportData(generateReportData(report.key, {}));
        setShowReportDialog(true);
    };

    const handleApplyReportFilters = () => {
        if(currentReport) {
            setReportData(generateReportData(currentReport.key, reportFilters));
        }
    };

    const formatDateForDisplay = (date: Date | string | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' });
    };


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
                <FormField control={productForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>الفئة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl><SelectContent>{categoriesData.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
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
              <FormField control={productForm.control} name="supplierId" render={({ field }) => (<FormItem><FormLabel>المورد الافتراضي (اختياري)</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المورد" /></SelectTrigger></FormControl><SelectContent>{suppliersData.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={productForm.control} name="image" render={({ field }) => (
                    <FormItem>
                        <FormLabel>صورة المنتج</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={handleImageChange} className="bg-background"/>
                        </FormControl>
                        {imagePreview && <Image src={imagePreview} alt="معاينة المنتج" width={100} height={100} className="mt-2 rounded-md border object-cover" data-ai-hint={productForm.getValues("dataAiHint") || "product"}/>}
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={productForm.control} name="dataAiHint" render={({ field }) => (
                    <FormItem>
                        <FormLabel>وصف الصورة (AI Hint)</FormLabel>
                        <FormControl><Input placeholder="مثال: مكتب خشبي (كلمتين كحد أقصى)" {...field} className="bg-background" /></FormControl>
                        <DialogDescriptionComponent className="text-xs text-muted-foreground">
                            كلمة أو كلمتين للبحث عن صور مشابهة في حالة عدم رفع صورة.
                        </DialogDescriptionComponent>
                        <FormMessage />
                    </FormItem>
                )}/>

              <DialogFooter><Button type="submit">{productToEdit ? 'حفظ التعديلات' : 'حفظ المنتج'}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
            </form></Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="itemsList" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="itemsList" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Package className="inline-block me-2 h-4 w-4" /> قائمة المنتجات</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ListTree className="inline-block me-2 h-4 w-4" /> فئات الأصناف</TabsTrigger>
          <TabsTrigger value="stockIssue" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><PackageMinus className="inline-block me-2 h-4 w-4" /> أذونات الصرف</TabsTrigger>
          <TabsTrigger value="stockReceipt" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ArchiveRestore className="inline-block me-2 h-4 w-4" /> أذونات الإضافة</TabsTrigger>
          <TabsTrigger value="stockRequisition" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ClipboardList className="inline-block me-2 h-4 w-4" /> طلبات الصرف</TabsTrigger>
          <TabsTrigger value="stockMovement" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><History className="inline-block me-2 h-4 w-4" /> حركة المخزون</TabsTrigger>
          <TabsTrigger value="stocktaking" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><SlidersHorizontal className="inline-block me-2 h-4 w-4" /> الجرد والتسويات</TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BarChart3 className="inline-block me-2 h-4 w-4" /> تقارير المخزون</TabsTrigger>
        </TabsList>

        {/* ... Rest of the client component ... */}
        
      </Tabs>
    </div>
  );
}

    
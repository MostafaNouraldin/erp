
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Printer, Search, Filter, FileDown, Banknote, Building, FileText, Wallet, CheckCircle, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AppLogo from '@/components/app-logo'; // Assuming AppLogo exists

// Mock data initial state
const initialReceiptVoucherData = [
  { id: "RC001", date: new Date("2024-07-15"), type: "سند قبض" as const, method: "نقدي" as const, partyId: "CUST001", partyName: "عميل أ", amount: 5000, status: "مرحل" as const, branch: "الرئيسي", notes: "دفعة من العميل أ", accountId: "1011" },
  { id: "PV001", date: new Date("2024-07-16"), type: "سند صرف" as const, method: "بنكي" as const, partyId: "SUP001", partyName: "مورد س", amount: 12000, status: "مرحل" as const, branch: "الرياض", notes: "دفعة للمورد س", accountId: "1012" },
  { id: "RC002", date: new Date("2024-07-18"), type: "سند قبض" as const, method: "بنكي" as const, partyId: "CUST002", partyName: "عميل ب", amount: 2500, status: "مسودة" as const, branch: "جدة", notes: "", accountId: "1012" },
  { id: "PV002", date: new Date("2024-07-20"), type: "سند صرف" as const, method: "نقدي" as const, partyId: "EXP001", partyName: "مصروفات عامة", amount: 300, status: "مرحل" as const, branch: "الرئيسي", notes: "", accountId: "5010"},
];

const mockParties = [
    { id: "CUST001", name: "عميل أ (شركة الأمل)", type: "customer" }, { id: "CUST002", name: "عميل ب (مؤسسة النجاح)", type: "customer" },
    { id: "SUP001", name: "مورد س (مورد التقنية)", type: "supplier" }, { id: "EXP001", name: "مصروفات عامة", type: "expense" },
];
const mockAccounts = [ {id: "1011", name: "صندوق الفرع الرئيسي"}, {id: "1012", name: "حساب البنك الأهلي"}, {id: "5010", name: "مصروفات نثرية"} ];

const initialTreasuryMovementData = [
    { date: "2024-07-20", type: "إيداع", description: "إيداع نقدي من مبيعات", amount: 1500, balance: 101500 },
    { date: "2024-07-20", type: "سحب", description: "سند صرف #PV002", amount: 300, balance: 101200 },
    { date: "2024-07-19", type: "إيداع", description: "تحصيل من عميل أ", amount: 2000, balance: 101500 },
];

const voucherSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  type: z.enum(["سند قبض", "سند صرف"]),
  method: z.enum(["نقدي", "بنكي", "شيك"], { required_error: "طريقة الدفع مطلوبة" }),
  partyId: z.string().min(1, "الجهة مطلوبة"),
  partyName: z.string().optional(), 
  accountId: z.string().min(1, "حساب الصندوق/البنك مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
  branch: z.string().min(1, "الفرع مطلوب"),
});
type VoucherFormValues = z.infer<typeof voucherSchema>;

// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};


export default function ReceiptsVouchersPage() {
  const [vouchers, setVouchers] = useState(initialReceiptVoucherData);
  const [treasuryMovements, setTreasuryMovements] = useState(initialTreasuryMovementData);

  const [showCreateVoucherDialog, setShowCreateVoucherDialog] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<VoucherFormValues | null>(null);
  const [dialogType, setDialogType] = useState<"سند قبض" | "سند صرف">("سند قبض");
  
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<VoucherFormValues | null>(null);

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: { date: new Date(), method: "نقدي", amount: 0, status: "مسودة", branch: "الرئيسي" },
  });

  useEffect(() => {
    if (voucherToEdit) {
      form.reset(voucherToEdit);
    } else {
      form.reset({ date: new Date(), type: dialogType, method: "نقدي", amount: 0, status: "مسودة", branch: "الرئيسي", partyId: "", accountId: "", notes: "" });
    }
  }, [voucherToEdit, dialogType, form, showCreateVoucherDialog]);

  const handleSubmit = (values: VoucherFormValues) => {
    const party = mockParties.find(p => p.id === values.partyId);
    const completeValues = {...values, partyName: party?.name || values.partyId };

    if (voucherToEdit) {
      setVouchers(prev => prev.map(v => v.id === voucherToEdit.id ? completeValues : v));
    } else {
      const newIdPrefix = values.type === "سند قبض" ? "RC" : "PV";
      setVouchers(prev => [...prev, { ...completeValues, id: `${newIdPrefix}${Date.now()}` }]);
    }
    setShowCreateVoucherDialog(false);
    setVoucherToEdit(null);
  };

  const handlePrintVoucher = (voucher: VoucherFormValues) => {
    const party = mockParties.find(p => p.id === voucher.partyId);
    setSelectedVoucherForPrint({...voucher, partyName: party?.name || voucher.partyId});
    setShowPrintDialog(true);
  }
  
  const openDialog = (type: "سند قبض" | "سند صرف", voucherData: VoucherFormValues | null = null) => {
    setDialogType(type);
    setVoucherToEdit(voucherData);
    setShowCreateVoucherDialog(true);
  }

  const handleDeleteVoucher = (voucherId: string) => {
    setVouchers(prev => prev.filter(v => v.id !== voucherId));
  };

  const handlePostVoucher = (voucherId: string) => {
    setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, status: "مرحل" } : v));
    // Mock adding to treasury movement for posted vouchers
    const voucher = vouchers.find(v => v.id === voucherId);
    if (voucher) {
        setTreasuryMovements(prev => [
            { 
                date: voucher.date.toLocaleDateString('ar-SA', { calendar: 'gregory' }), 
                type: voucher.type === "سند قبض" ? "إيداع" : "سحب", 
                description: `${voucher.type} #${voucher.id} - ${voucher.partyName}`, 
                amount: voucher.amount, 
                balance: (prev[0]?.balance || 0) + (voucher.type === "سند قبض" ? voucher.amount : -voucher.amount) // Simplified balance calculation
            },
            ...prev
        ]);
    }
  };

  const handleUnpostVoucher = (voucherId: string) => {
     if (voucherId !== "RC001" && voucherId !== "PV001" && voucherId !== "PV002") { // Mock system generated check
        setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, status: "مسودة" } : v));
        // Mock removing from treasury (or creating a reverse entry)
        setTreasuryMovements(prev => prev.filter(tm => !tm.description.includes(voucherId)));
     } else {
        alert("لا يمكن إلغاء ترحيل هذا السند لأنه مرتبط بعمليات نظام أساسية.");
     }
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">سندات القبض والصرف</h1>
        <div className="flex gap-2">
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => openDialog("سند قبض")}>
                <PlusCircle className="me-2 h-4 w-4" /> إنشاء سند قبض
            </Button>
            <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow" onClick={() => openDialog("سند صرف")}>
                <PlusCircle className="me-2 h-4 w-4" /> إنشاء سند صرف
            </Button>
        </div>
      </div>

      <Dialog open={showCreateVoucherDialog} onOpenChange={(isOpen) => {setShowCreateVoucherDialog(isOpen); if(!isOpen) setVoucherToEdit(null);}}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{voucherToEdit ? `تعديل ${dialogType}` : `إنشاء ${dialogType} جديد`}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                
                <FormField control={form.control} name="partyId" render={({ field }) => (
                    <FormItem><FormLabel>الجهة ({dialogType === "سند قبض" ? "العميل" : "المورد/المصروف"})</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الجهة" /></SelectTrigger></FormControl>
                        <SelectContent>{mockParties.filter(p => dialogType === "سند قبض" ? p.type === 'customer' : p.type === 'supplier' || p.type === 'expense').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>)} />

                <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>المبلغ</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="method" render={({ field }) => (
                        <FormItem><FormLabel>طريقة {dialogType === "سند قبض" ? "القبض" : "الصرف"}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger id="receiptMethod" className="bg-background"><SelectValue placeholder={`اختر طريقة ${dialogType === "سند قبض" ? "القبض" : "الصرف"}`} /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="نقدي">نقدي</SelectItem><SelectItem value="بنكي">بنكي</SelectItem><SelectItem value="شيك">شيك</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="accountId" render={({ field }) => (
                        <FormItem><FormLabel>حساب الصندوق/البنك</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب" /></SelectTrigger></FormControl>
                            <SelectContent>{mockAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>)} />
                </div>

                <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem><FormLabel>الفرع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الفرع" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="الرئيسي">الرئيسي</SelectItem><SelectItem value="الرياض">الرياض</SelectItem>
                                <SelectItem value="جدة">جدة</SelectItem><SelectItem value="الدمام">الدمام</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>)} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>ملاحظات</FormLabel>
                        <FormControl><Textarea placeholder="ملاحظات إضافية" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
              <DialogFooter>
                <Button type="submit">{voucherToEdit ? 'حفظ التعديلات' : 'حفظ السند'}</Button>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Tabs defaultValue="allVouchers" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="allVouchers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="inline-block me-2 h-4 w-4" /> جميع السندات
          </TabsTrigger>
          <TabsTrigger value="treasuryMovement" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Wallet className="inline-block me-2 h-4 w-4" /> حركة الخزينة اليومية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allVouchers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة السندات</CardTitle>
              <CardDescription>إدارة جميع سندات القبض والصرف النقدية والبنكية. الربط مع الحسابات والعملاء/الموردين.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في السندات..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب نوع السند</DropdownMenuLabel><DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>سند قبض</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>سند صرف</DropdownMenuCheckboxItem><DropdownMenuSeparator />
                      <DropdownMenuLabel>تصفية حسب طريقة الدفع</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>نقدي</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>بنكي</DropdownMenuCheckboxItem><DropdownMenuSeparator />
                       <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مرحل</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range"/>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => alert("تصدير السندات...")}><FileDown className="me-2 h-4 w-4" /> تصدير</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead>رقم السند</TableHead><TableHead>التاريخ</TableHead><TableHead>النوع</TableHead>
                      <TableHead>الطريقة</TableHead><TableHead>الجهة</TableHead><TableHead>المبلغ</TableHead>
                      <TableHead>الفرع</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{vouchers.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{voucher.id}</TableCell><TableCell>{voucher.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell><Badge variant={voucher.type === "سند قبض" ? "default" : "secondary"} className="whitespace-nowrap bg-opacity-80">
                            {voucher.type === "سند قبض" ? <Banknote className="inline me-1 h-3 w-3"/> : <Building className="inline me-1 h-3 w-3"/>}{voucher.type}</Badge>
                        </TableCell>
                        <TableCell>{voucher.method}</TableCell><TableCell>{voucher.partyName}</TableCell>
                        <TableCell className="whitespace-nowrap">{voucher.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>{voucher.branch}</TableCell><TableCell><Badge variant={voucher.status === "مرحل" ? "default" : "outline"} className="whitespace-nowrap">{voucher.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintVoucher(voucher)}><Printer className="h-4 w-4" /></Button>
                          {voucher.status === "مسودة" && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => openDialog(voucher.type, voucher)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف السند "{voucher.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVoucher(voucher.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل السند" onClick={() => handlePostVoucher(voucher.id!)}><CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /></Button>
                          </>)}
                           {voucher.status === "مرحل" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل" onClick={() => handleUnpostVoucher(voucher.id!)}><Undo className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></Button>
                          )}
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treasuryMovement">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>حركة الخزينة اليومية</CardTitle><CardDescription>مراجعة يومية لحركة الخزينة والإيداعات والسحوبات.</CardDescription></CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end"><DatePickerWithPresets /></div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>نوع الحركة</TableHead><TableHead>الوصف</TableHead><TableHead>المبلغ</TableHead><TableHead>الرصيد</TableHead></TableRow></TableHeader>
                  <TableBody>{treasuryMovements.map((movement, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>{movement.date}</TableCell>
                        <TableCell><Badge variant={movement.type === "إيداع" ? "default" : "destructive"} className="bg-opacity-70">{movement.type}</Badge></TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.balance.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

       <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl"> {/* Increased max-width for better A4 preview */}
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة السند: {selectedVoucherForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedVoucherForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="receipt voucher">
              {/* Header Section */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'>
                  <AppLogo /> {/* Replace with your actual AppLogo component or an img tag */}
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض - المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-md font-semibold">{selectedVoucherForPrint.type}</h3>
                  <p className="text-xs">{selectedVoucherForPrint.type === "سند قبض" ? "Receipt Voucher" : "Payment Voucher"}</p>
                  <p className="text-xs mt-1">رقم: {selectedVoucherForPrint.id}</p>
                  <p className="text-xs">تاريخ: {new Date(selectedVoucherForPrint.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p>
                </div>
              </div>

              {/* Body Section - Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-xs">
                <div><strong>الفرع:</strong> {selectedVoucherForPrint.branch}</div>
                <div><strong>طريقة {selectedVoucherForPrint.type === "سند قبض" ? "القبض" : "الصرف"}:</strong> {selectedVoucherForPrint.method}</div>
                <div className="col-span-2"><strong>{selectedVoucherForPrint.type === "سند قبض" ? "استلمنا من السيد/السادة:" : "ادفعوا لأمر السيد/السادة:"}</strong> {selectedVoucherForPrint.partyName}</div>
                <div><strong>الحساب النقدي/البنكي:</strong> {mockAccounts.find(a=>a.id === selectedVoucherForPrint.accountId)?.name || selectedVoucherForPrint.accountId}</div>
              </div>
              <div className="mb-6 text-xs">
                <p><strong>وذلك عن (البيان):</strong> {selectedVoucherForPrint.notes || `${selectedVoucherForPrint.type} لـ ${selectedVoucherForPrint.partyName} بمبلغ ${selectedVoucherForPrint.amount.toLocaleString('ar-SA')}`}</p>
              </div>
              <div className="mb-8 p-3 border border-gray-300 rounded-md bg-muted/30 text-xs">
                  <p><strong>المبلغ:</strong> <span className="font-bold text-base">{selectedVoucherForPrint.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</span></p>
                  <p data-ai-hint="amount words"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedVoucherForPrint.amount)}</p>
              </div>

              {/* Footer Section - Signatures */}
              <div className="grid grid-cols-3 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">المحاسب</p>
                  <p>Accountant</p>
                </div>
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">المدير المالي</p>
                  <p>Finance Manager</p>
                </div>
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">{selectedVoucherForPrint.type === "سند قبض" ? "المستلم منه" : "المستلم"}</p>
                  <p>{selectedVoucherForPrint.type === "سند قبض" ? "Received From" : "Received by"}</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()} ><Printer className="me-2 h-4 w-4" /> طباعة</Button>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

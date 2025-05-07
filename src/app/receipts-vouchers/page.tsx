
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Printer, Search, Filter, FileDown, Banknote, Building, FileText, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Kept for direct use if needed outside forms
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


// Mock data - replace with actual data fetching
const receiptVoucherData = [
  { id: "RC001", date: new Date("2024-07-15"), type: "سند قبض" as const, method: "نقدي" as const, partyId: "CUST001", partyName: "عميل أ", amount: 5000, status: "مرحل" as const, branch: "الرئيسي", notes: "دفعة من العميل أ", accountId: "1011" },
  { id: "PV001", date: new Date("2024-07-16"), type: "سند صرف" as const, method: "بنكي" as const, partyId: "SUP001", partyName: "مورد س", amount: 12000, status: "مرحل" as const, branch: "الرياض", notes: "دفعة للمورد س", accountId: "1012" },
  { id: "RC002", date: new Date("2024-07-18"), type: "سند قبض" as const, method: "بنكي" as const, partyId: "CUST002", partyName: "عميل ب", amount: 2500, status: "مسودة" as const, branch: "جدة", notes: "", accountId: "1012" },
  { id: "PV002", date: new Date("2024-07-20"), type: "سند صرف" as const, method: "نقدي" as const, partyId: "EXP001", partyName: "مصروفات عامة", amount: 300, status: "مرحل" as const, branch: "الرئيسي", notes: "", accountId: "5010"},
];

const mockParties = [
    { id: "CUST001", name: "عميل أ (شركة الأمل)", type: "customer" },
    { id: "CUST002", name: "عميل ب (مؤسسة النجاح)", type: "customer" },
    { id: "SUP001", name: "مورد س (مورد التقنية)", type: "supplier" },
    { id: "EXP001", name: "مصروفات عامة", type: "expense" },
];

const mockAccounts = [ // Cash and Bank accounts
    {id: "1011", name: "صندوق الفرع الرئيسي"},
    {id: "1012", name: "حساب البنك الأهلي"},
];


const treasuryMovementData = [
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
  partyName: z.string().optional(), // For display, will be auto-filled
  accountId: z.string().min(1, "حساب الصندوق/البنك مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
  branch: z.string().min(1, "الفرع مطلوب"),
});

type VoucherFormValues = z.infer<typeof voucherSchema>;


export default function ReceiptsVouchersPage() {
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
      console.log("Updating voucher:", completeValues);
      // Mock update logic
    } else {
      console.log("Adding new voucher:", completeValues);
      // Mock add logic
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
                                <SelectItem value="نقدي">نقدي</SelectItem>
                                <SelectItem value="بنكي">بنكي</SelectItem>
                                <SelectItem value="شيك">شيك</SelectItem>
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
                                <SelectItem value="الرئيسي">الرئيسي</SelectItem>
                                <SelectItem value="الرياض">الرياض</SelectItem>
                                <SelectItem value="جدة">جدة</SelectItem>
                                <SelectItem value="الدمام">الدمام</SelectItem>
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


      <Tabs defaultValue="allVouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="allVouchers" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="inline-block me-2 h-4 w-4" /> جميع السندات
          </TabsTrigger>
          <TabsTrigger value="treasuryMovement" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
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
                      <DropdownMenuLabel>تصفية حسب نوع السند</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>سند قبض</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>سند صرف</DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuLabel>تصفية حسب طريقة الدفع</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>نقدي</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>بنكي</DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مرحل</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range"/>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    <FileDown className="me-2 h-4 w-4" /> تصدير
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الجهة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptVoucherData.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{voucher.id}</TableCell>
                        <TableCell>{voucher.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.type === "سند قبض" ? "default" : "secondary"} className="whitespace-nowrap bg-opacity-80">
                            {voucher.type === "سند قبض" ? <Banknote className="inline me-1 h-3 w-3"/> : <Building className="inline me-1 h-3 w-3"/>}
                            {voucher.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{voucher.method}</TableCell>
                        <TableCell>{voucher.partyName}</TableCell>
                        <TableCell className="whitespace-nowrap">{voucher.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>{voucher.branch}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.status === "مرحل" ? "default" : "outline"} className="whitespace-nowrap">
                            {voucher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintVoucher(voucher)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => openDialog(voucher.type, voucher)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {voucher.status === "مسودة" && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      سيتم حذف السند "{voucher.id}" نهائياً.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => console.log(`Deleting voucher ${voucher.id}`)}>
                                      تأكيد الحذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

        <TabsContent value="treasuryMovement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>حركة الخزينة اليومية</CardTitle>
              <CardDescription>مراجعة يومية لحركة الخزينة والإيداعات والسحوبات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <DatePickerWithPresets />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع الحركة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treasuryMovementData.map((movement, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>
                            <Badge variant={movement.type === "إيداع" ? "default" : "destructive"} className="bg-opacity-70">
                                {movement.type}
                            </Badge>
                        </TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.balance.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

       {/* Dialog for Printing Voucher */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>طباعة السند: {selectedVoucherForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedVoucherForPrint && (
            <div className="py-4 space-y-3 border rounded-md p-4 my-4">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="text-xl font-semibold">شركة المستقبل ERP</h3>
                <p className="text-sm">{selectedVoucherForPrint.type}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong>رقم السند:</strong> {selectedVoucherForPrint.id}</p>
                <p><strong>التاريخ:</strong> {selectedVoucherForPrint.date.toLocaleDateString('ar-SA')}</p>
                <p><strong>الجهة:</strong> {selectedVoucherForPrint.partyName}</p>
                <p><strong>المبلغ:</strong> {selectedVoucherForPrint.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
                <p><strong>طريقة {selectedVoucherForPrint.type === "سند قبض" ? "القبض" : "الصرف"}:</strong> {selectedVoucherForPrint.method}</p>
                <p><strong>الفرع:</strong> {selectedVoucherForPrint.branch}</p>
                <p className="col-span-2"><strong>المبلغ كتابة:</strong> {/* Implement proper number to words conversion here */}</p>
                <p className="col-span-2"><strong>البيان:</strong> {selectedVoucherForPrint.notes || `${selectedVoucherForPrint.type} لـ ${selectedVoucherForPrint.partyName} بمبلغ ${selectedVoucherForPrint.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`}</p>
                 <p className="col-span-2"><strong>الحساب:</strong> {mockAccounts.find(a=>a.id === selectedVoucherForPrint.accountId)?.name || selectedVoucherForPrint.accountId}</p>
              </div>
               <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t">
                <div className="text-center">
                    <p className="mb-6">.........................</p>
                    <p className="text-sm font-semibold">توقيع المحاسب</p>
                </div>
                 <div className="text-center">
                    <p className="mb-6">.........................</p>
                    <p className="text-sm font-semibold">توقيع المستلم</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { alert(`Printing voucher ${selectedVoucherForPrint?.id}`); setShowPrintDialog(false); }} >
              <Printer className="me-2 h-4 w-4" /> طباعة
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

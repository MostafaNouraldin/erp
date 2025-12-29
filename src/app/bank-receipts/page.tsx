
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, ArrowUpCircle, Printer, CheckCircle, Undo, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog"; // Renamed DialogDescription
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AppLogo from '@/components/app-logo'; // Assuming AppLogo exists for company logo
import { useCurrency } from '@/hooks/use-currency';

// Mock Data
const mockBankAccounts = [
  { id: "BANK001", name: "البنك الأهلي - حساب جاري" },
  { id: "BANK002", name: "بنك الرياض - حساب توفير" },
];
const mockRevenueAccounts = [ // From Chart of Accounts (type: تفصيلي, parent: الإيرادات)
  { id: "4010", name: "إيرادات مبيعات منتجات" },
  { id: "4020", name: "إيرادات خدمات استشارية" },
  { id: "4030", name: "إيرادات أخرى" },
];
const mockCustomers = [
    {id: "CUST001", name: "شركة الأمل"}, {id: "CUST002", name: "مؤسسة النجاح"},
];

const bankReceiptSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ المقبوضات مطلوب" }),
  bankAccountId: z.string().min(1, "الحساب البنكي مطلوب"),
  revenueAccountId: z.string().min(1, "حساب الإيراد مطلوب"),
  payerName: z.string().min(1, "اسم الدافع مطلوب"), // Could be a customer or other entity
  customerId: z.string().optional(), // Optional link to customer
  description: z.string().min(1, "وصف المقبوضات مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  referenceNumber: z.string().optional(), // Deposit slip, transfer ID
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
});

type BankReceiptFormValues = z.infer<typeof bankReceiptSchema>;

const initialBankReceiptsData: BankReceiptFormValues[] = [
  { id: "BREC001", date: new Date("2024-07-08"), bankAccountId: "BANK001", revenueAccountId: "4010", payerName: "شركة الأمل", customerId: "CUST001", description: "دفعة مقدمة لمشروع تطوير", amount: 25000, referenceNumber: "DEP-JULY-001", status: "مرحل" },
  { id: "BREC002", date: new Date("2024-07-14"), bankAccountId: "BANK002", revenueAccountId: "4020", payerName: "مؤسسة النجاح", customerId: "CUST002", description: "أتعاب استشارات", amount: 8500, referenceNumber: "TRN-CONSULT-005", status: "مرحل" },
  { id: "BREC003", date: new Date("2024-07-19"), bankAccountId: "BANK001", revenueAccountId: "4030", payerName: "جهة خارجية", description: "إيرادات متنوعة", amount: 1200, referenceNumber: "MISC-REV-002", status: "مسودة" },
];

// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  // This is a placeholder. A full implementation is complex.
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};


export default function BankReceiptsPage() {
  const [bankReceipts, setBankReceipts] = useState(initialBankReceiptsData);
  const [showManageReceiptDialog, setShowManageReceiptDialog] = useState(false);
  const [receiptToEdit, setReceiptToEdit] = useState<BankReceiptFormValues | null>(null);
  const [showPrintReceiptDialog, setShowPrintReceiptDialog] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<BankReceiptFormValues | null>(null);
  const { formatCurrency } = useCurrency();


  const form = useForm<BankReceiptFormValues>({
    resolver: zodResolver(bankReceiptSchema),
    defaultValues: { date: new Date(), amount: 0, status: "مسودة" },
  });

  useEffect(() => {
    if (receiptToEdit) {
      form.reset(receiptToEdit);
    } else {
      form.reset({ date: new Date(), bankAccountId: "", revenueAccountId: "", payerName: "", description: "", amount: 0, referenceNumber: "", status: "مسودة", customerId: "" });
    }
  }, [receiptToEdit, form, showManageReceiptDialog]);

  const handleReceiptSubmit = (values: BankReceiptFormValues) => {
    if (receiptToEdit) {
      setBankReceipts(prev => prev.map(rec => rec.id === receiptToEdit.id ? values : rec));
    } else {
      setBankReceipts(prev => [...prev, { ...values, id: `BREC${Date.now()}` }]);
    }
    setShowManageReceiptDialog(false);
    setReceiptToEdit(null);
  };

  const handleDeleteReceipt = (receiptId: string) => {
    setBankReceipts(prev => prev.filter(rec => rec.id !== receiptId));
  };
  
  const handlePostReceipt = (receiptId: string) => {
    setBankReceipts(prev => prev.map(rec => rec.id === receiptId ? { ...rec, status: "مرحل" } : rec));
  };

  const handleUnpostReceipt = (receiptId: string) => {
    if(receiptId !== "BREC001" && receiptId !== "BREC002"){ // Mock check
        setBankReceipts(prev => prev.map(rec => rec.id === receiptId ? { ...rec, status: "مسودة" } : rec));
    } else {
        alert("لا يمكن إلغاء ترحيل هذه المقبوضات لارتباطها بعمليات أخرى.");
    }
  };
  
  const handlePrintReceipt = (receipt: BankReceiptFormValues) => {
    setSelectedReceiptForPrint(receipt);
    setShowPrintReceiptDialog(true);
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <ArrowUpCircle className="me-2 h-8 w-8 text-primary" />
            المقبوضات البنكية
          </CardTitle>
          <CardDescription>
            تسجيل وتتبع جميع المبالغ المستلمة في الحسابات البنكية للشركة.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">سجل المقبوضات البنكية</h2>
        <Dialog open={showManageReceiptDialog} onOpenChange={(isOpen) => { setShowManageReceiptDialog(isOpen); if (!isOpen) setReceiptToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setReceiptToEdit(null); form.reset(); setShowManageReceiptDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> تسجيل مقبوضات بنكية
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{receiptToEdit ? 'تعديل مقبوضات بنكية' : 'تسجيل مقبوضات بنكية جديدة'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReceiptSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>تاريخ المقبوضات</FormLabel>
                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="payerName" render={({ field }) => (
                    <FormItem><FormLabel>اسم الدافع</FormLabel><FormControl><Input placeholder="اسم الجهة أو الشخص الدافع" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                 <FormField control={form.control} name="customerId" render={({ field }) => (
                    <FormItem><FormLabel>العميل (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل إذا كان مرتبطاً" /></SelectTrigger></FormControl>
                        <SelectContent>{mockCustomers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                    <FormItem><FormLabel>الحساب البنكي (المستلم فيه)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب البنكي" /></SelectTrigger></FormControl>
                        <SelectContent>{mockBankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="revenueAccountId" render={({ field }) => (
                    <FormItem><FormLabel>حساب الإيراد</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب الإيراد" /></SelectTrigger></FormControl>
                        <SelectContent>{mockRevenueAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>وصف المقبوضات</FormLabel><FormControl><Textarea placeholder="تفاصيل المقبوضات" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="referenceNumber" render={({ field }) => (
                        <FormItem><FormLabel>الرقم المرجعي (اختياري)</FormLabel><FormControl><Input placeholder="رقم إيداع، تحويل، إلخ" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                  <Button type="submit">{receiptToEdit ? 'حفظ التعديلات' : 'حفظ المقبوضات'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input placeholder="بحث باسم الدافع أو الوصف..." className="max-w-sm bg-background" />
            </div>
            <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مرحل</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DatePickerWithPresets mode="range"/>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحساب البنكي</TableHead>
                  <TableHead>حساب الإيراد</TableHead>
                  <TableHead>الدافع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-muted/50">
                    <TableCell>{receipt.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                    <TableCell className="font-medium">{mockBankAccounts.find(b => b.id === receipt.bankAccountId)?.name}</TableCell>
                    <TableCell>{mockRevenueAccounts.find(e => e.id === receipt.revenueAccountId)?.name}</TableCell>
                    <TableCell>{receipt.payerName}</TableCell>
                    <TableCell>{receipt.description}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(receipt.amount) }}></TableCell>
                    <TableCell>{receipt.referenceNumber || "-"}</TableCell>
                    <TableCell><Badge variant={receipt.status === "مرحل" ? "default" : "outline"}>{receipt.status}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintReceipt(receipt)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {receipt.status === "مسودة" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setReceiptToEdit(receipt); setShowManageReceiptDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف المقبوضات البنكية من "{receipt.payerName}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteReceipt(receipt.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل" onClick={() => handlePostReceipt(receipt.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        </>
                      )}
                      {receipt.status === "مرحل" && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل" onClick={() => handleUnpostReceipt(receipt.id!)}>
                            <Undo className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
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

      {/* Dialog for Printing Receipt */}
      <Dialog open={showPrintReceiptDialog} onOpenChange={setShowPrintReceiptDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة إيصال مقبوضات بنكية: {selectedReceiptForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedReceiptForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="receipt voucher">
              {/* Header Section */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'>
                  <AppLogo />
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض - المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-md font-semibold">إيصال مقبوضات بنكية</h3>
                  <p className="text-xs">Bank Receipt Voucher</p>
                  <p className="text-xs mt-1">رقم: {selectedReceiptForPrint.id}</p>
                  <p className="text-xs">تاريخ: {new Date(selectedReceiptForPrint.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p>
                </div>
              </div>

              {/* Body Section - Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-xs">
                <div><strong>الحساب البنكي (المستلم فيه):</strong> {mockBankAccounts.find(b => b.id === selectedReceiptForPrint.bankAccountId)?.name}</div>
                <div><strong>حساب الإيراد:</strong> {mockRevenueAccounts.find(e => e.id === selectedReceiptForPrint.revenueAccountId)?.name}</div>
                <div className="col-span-2"><strong>الدافع:</strong> {selectedReceiptForPrint.payerName}</div>
                {selectedReceiptForPrint.customerId && <div className="col-span-2"><strong>العميل:</strong> {mockCustomers.find(c => c.id === selectedReceiptForPrint.customerId)?.name}</div>}
                <div className="col-span-2"><strong>الرقم المرجعي:</strong> {selectedReceiptForPrint.referenceNumber || "لا يوجد"}</div>
              </div>
              <div className="mb-6 text-xs">
                <p><strong>الوصف (البيان):</strong> {selectedReceiptForPrint.description}</p>
              </div>
              <div className="mb-8 p-3 border border-gray-300 rounded-md bg-muted/30 text-xs">
                  <p><strong>المبلغ:</strong> <span className="font-bold text-base" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedReceiptForPrint.amount) }}></span></p>
                  <p data-ai-hint="amount words"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedReceiptForPrint.amount)}</p>
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
                  <p className="font-semibold">أمين الصندوق/المدير المالي</p>
                  <p>Treasurer/Finance Manager</p>
                </div>
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">المستلم (الموقع)</p>
                  <p>Received by (Signature)</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}



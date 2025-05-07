"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, BookCopy, FileText, Printer, Filter, CheckCircle, XCircle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AppLogo from '@/components/app-logo'; // Assuming AppLogo exists

// Mock Data
const mockBankAccounts = [
  { id: "BANK001", name: "البنك الأهلي - حساب جاري 102030405060" },
  { id: "BANK002", name: "بنك الرياض - حساب توفير 987654321000" },
];

const checkbookSchema = z.object({
  id: z.string().optional(),
  bankAccountId: z.string().min(1, "الحساب البنكي مطلوب"),
  startSerial: z.coerce.number().min(1, "رقم بداية دفتر الشيكات مطلوب"),
  endSerial: z.coerce.number().min(1, "رقم نهاية دفتر الشيكات مطلوب"),
  issueDate: z.date({ required_error: "تاريخ إصدار الدفتر مطلوب" }),
  notes: z.string().optional(),
}).refine(data => data.endSerial >= data.startSerial, {
  message: "رقم النهاية يجب أن يكون أكبر من أو يساوي رقم البداية.",
  path: ["endSerial"],
});
type CheckbookFormValues = z.infer<typeof checkbookSchema>;

const initialCheckbooksData: CheckbookFormValues[] = [
  { id: "CHKBOOK001", bankAccountId: "BANK001", startSerial: 1001, endSerial: 1050, issueDate: new Date("2024-01-15"), notes: "دفتر شيكات أساسي" },
  { id: "CHKBOOK002", bankAccountId: "BANK002", startSerial: 201, endSerial: 220, issueDate: new Date("2024-03-01"), notes: "دفتر شيكات صغير" },
];

// For individual checks, we'll manage them within a selected checkbook context or a flat list for simplicity here
interface CheckRecord {
    id: string;
    checkbookId: string; // Link to checkbook
    checkNumber: number;
    issueDate: Date;
    payee: string;
    amount: number;
    status: "صادر" | "مسحوب" | "ملغي" | "متاح";
    notes?: string;
}

const initialChecksData: CheckRecord[] = [
    { id: "CHK001", checkbookId: "CHKBOOK001", checkNumber: 1001, issueDate: new Date("2024-07-05"), payee: "مورد التقنية الحديثة", amount: 15000, status: "صادر" },
    { id: "CHK002", checkbookId: "CHKBOOK001", checkNumber: 1002, issueDate: new Date("2024-07-10"), payee: "شركة الإتصالات", amount: 2500, status: "مسحوب" },
    { id: "CHK003", checkbookId: "CHKBOOK001", checkNumber: 1003, issueDate: new Date("2024-07-15"), payee: "", amount: 0, status: "ملغي", notes: "خطأ في الكتابة" },
    { id: "CHK004", checkbookId: "CHKBOOK001", checkNumber: 1004, issueDate: new Date(), payee: "", amount: 0, status: "متاح" },
    { id: "CHK005", checkbookId: "CHKBOOK002", checkNumber: 201, issueDate: new Date("2024-07-20"), payee: "مصروفات مكتبية", amount: 750, status: "صادر" },
];

// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  // This is a placeholder. A full implementation is complex.
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};


export default function CheckbookRegisterPage() {
  const [checkbooks, setCheckbooks] = useState(initialCheckbooksData);
  const [checks, setChecks] = useState(initialChecksData);
  
  const [showManageCheckbookDialog, setShowManageCheckbookDialog] = useState(false);
  const [checkbookToEdit, setCheckbookToEdit] = useState<CheckbookFormValues | null>(null);
  
  // For managing individual checks (simplified for this example)
  const [showManageCheckDialog, setShowManageCheckDialog] = useState(false);
  const [checkToEdit, setCheckToEdit] = useState<CheckRecord | null>(null);
  
  const [showPrintCheckDialog, setShowPrintCheckDialog] = useState(false);
  const [selectedCheckForPrint, setSelectedCheckForPrint] = useState<CheckRecord | null>(null);


  const checkbookForm = useForm<CheckbookFormValues>({
    resolver: zodResolver(checkbookSchema),
    defaultValues: { issueDate: new Date() },
  });

  // Simplified form for individual check status update/issuance
  const checkForm = useForm<Omit<CheckRecord, 'id' | 'checkbookId' | 'checkNumber'>>({
    defaultValues: {status: "صادر", amount:0},
  });


  useEffect(() => {
    if (checkbookToEdit) checkbookForm.reset(checkbookToEdit);
    else checkbookForm.reset({ bankAccountId: "", startSerial: 1, endSerial: 1, issueDate: new Date(), notes: "" });
  }, [checkbookToEdit, checkbookForm, showManageCheckbookDialog]);
  
  useEffect(() => {
    if (checkToEdit) {
      checkForm.reset({
        issueDate: checkToEdit.issueDate,
        payee: checkToEdit.payee,
        amount: checkToEdit.amount,
        status: checkToEdit.status,
        notes: checkToEdit.notes
      });
    } else {
      checkForm.reset({issueDate: new Date(), payee: "", amount: 0, status:"صادر", notes: ""});
    }
  }, [checkToEdit, checkForm, showManageCheckDialog]);

  const handleCheckbookSubmit = (values: CheckbookFormValues) => {
    if (checkbookToEdit) {
      setCheckbooks(prev => prev.map(cb => cb.id === checkbookToEdit.id ? values : cb));
    } else {
      const newCheckbookId = `CHKBOOK${Date.now()}`;
      setCheckbooks(prev => [...prev, { ...values, id: newCheckbookId }]);
      // Auto-generate check records for the new checkbook
      const newChecks: CheckRecord[] = [];
      for (let i = values.startSerial; i <= values.endSerial; i++) {
        newChecks.push({
            id: `CHK-${newCheckbookId}-${i}`,
            checkbookId: newCheckbookId,
            checkNumber: i,
            issueDate: new Date(), // or values.issueDate
            payee: "",
            amount: 0,
            status: "متاح",
        });
      }
      setChecks(prev => [...prev, ...newChecks]);
    }
    setShowManageCheckbookDialog(false);
    setCheckbookToEdit(null);
  };

  const handleDeleteCheckbook = (checkbookId: string) => {
    // In a real app, ensure no checks are 'صادر' or 'مسحوب'
    const hasActiveChecks = checks.some(chk => chk.checkbookId === checkbookId && (chk.status === "صادر" || chk.status === "مسحوب"));
    if (hasActiveChecks) {
        alert("لا يمكن حذف دفتر شيكات يحتوي على شيكات صادرة أو مسحوبة.");
        return;
    }
    setCheckbooks(prev => prev.filter(cb => cb.id !== checkbookId));
    setChecks(prev => prev.filter(chk => chk.checkbookId !== checkbookId)); // Also remove its checks
  };

  const handleCheckSubmit = (values: Omit<CheckRecord, 'id' | 'checkbookId' | 'checkNumber'>) => {
    if (checkToEdit) {
        setChecks(prev => prev.map(chk => chk.id === checkToEdit.id ? {...checkToEdit, ...values} : chk));
    } // For issuing new check, it's handled by selecting "متاح" check and editing
    setShowManageCheckDialog(false);
    setCheckToEdit(null);
  };

  const openManageCheckDialog = (check: CheckRecord) => {
      setCheckToEdit(check);
      setShowManageCheckDialog(true);
  }
  
  const handlePrintCheck = (check: CheckRecord) => {
    setSelectedCheckForPrint(check);
    setShowPrintCheckDialog(true);
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <BookCopy className="me-2 h-8 w-8 text-primary" />
            دفتر الشيكات
          </CardTitle>
          <CardDescription>
            إدارة دفاتر الشيكات الصادرة للشركة، وتتبع حالة كل شيك (صادر، مسحوب، ملغي، متاح).
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Section for Managing Checkbooks */}
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">دفاتر الشيكات المسجلة</h2>
            <Dialog open={showManageCheckbookDialog} onOpenChange={(isOpen) => { setShowManageCheckbookDialog(isOpen); if (!isOpen) setCheckbookToEdit(null); }}>
            <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setCheckbookToEdit(null); checkbookForm.reset(); setShowManageCheckbookDialog(true); }}>
                <PlusCircle className="me-2 h-4 w-4" /> إضافة دفتر شيكات
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader><DialogTitle>{checkbookToEdit ? 'تعديل دفتر شيكات' : 'إضافة دفتر شيكات جديد'}</DialogTitle></DialogHeader>
                <Form {...checkbookForm}>
                <form onSubmit={checkbookForm.handleSubmit(handleCheckbookSubmit)} className="space-y-4 py-4">
                    <FormField control={checkbookForm.control} name="bankAccountId" render={({ field }) => (
                        <FormItem><FormLabel>الحساب البنكي</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب البنكي" /></SelectTrigger></FormControl>
                            <SelectContent>{mockBankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={checkbookForm.control} name="startSerial" render={({ field }) => (
                            <FormItem><FormLabel>رقم بداية الدفتر</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={checkbookForm.control} name="endSerial" render={({ field }) => (
                            <FormItem><FormLabel>رقم نهاية الدفتر</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={checkbookForm.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>تاريخ إصدار الدفتر</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                    )} />
                    <FormField control={checkbookForm.control} name="notes" render={({ field }) => (
                        <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Input placeholder="أي ملاحظات إضافية" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                    <Button type="submit">{checkbookToEdit ? 'حفظ التعديلات' : 'حفظ الدفتر'}</Button>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                </form>
                </Form>
            </DialogContent>
            </Dialog>
        </div>
        <Card className="shadow-md">
            <CardContent className="pt-6">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow>
                        <TableHead>الحساب البنكي</TableHead><TableHead>الرقم التسلسلي (من-إلى)</TableHead>
                        <TableHead>تاريخ الإصدار</TableHead><TableHead>ملاحظات</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{checkbooks.map((cb) => (
                        <TableRow key={cb.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{mockBankAccounts.find(b => b.id === cb.bankAccountId)?.name}</TableCell>
                            <TableCell>{cb.startSerial} - {cb.endSerial}</TableCell>
                            <TableCell>{cb.issueDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</TableCell>
                            <TableCell>{cb.notes || "-"}</TableCell>
                            <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الشيكات" onClick={() => alert(`عرض شيكات دفتر ${cb.id}`)}>
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setCheckbookToEdit(cb); setShowManageCheckbookDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف دفتر الشيكات ({cb.startSerial}-{cb.endSerial}) وجميع الشيكات المرتبطة به نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCheckbook(cb.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>


      {/* Section for Managing Individual Checks */}
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">سجل الشيكات</h2>
             <Dialog open={showManageCheckDialog} onOpenChange={(isOpen) => { setShowManageCheckDialog(isOpen); if (!isOpen) setCheckToEdit(null); }}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader><DialogTitle>إدارة الشيك رقم: {checkToEdit?.checkNumber}</DialogTitle></DialogHeader>
                    <Form {...checkForm}>
                        <form onSubmit={checkForm.handleSubmit(handleCheckSubmit)} className="space-y-4 py-4">
                             <FormField control={checkForm.control} name="issueDate" render={({ field }) => (
                                <FormItem className="flex flex-col"><FormLabel>تاريخ الإصدار/التعديل</FormLabel>
                                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} disabled={checkToEdit?.status === "مسحوب"} /><FormMessage /></FormItem>
                            )} />
                            <FormField control={checkForm.control} name="payee" render={({ field }) => (
                                <FormItem><FormLabel>المستفيد</FormLabel><FormControl><Input placeholder="اسم المستفيد من الشيك" {...field} className="bg-background" disabled={checkToEdit?.status === "مسحوب"} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={checkForm.control} name="amount" render={({ field }) => (
                                <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" {...field} className="bg-background" disabled={checkToEdit?.status === "مسحوب"} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={checkForm.control} name="status" render={({ field }) => (
                                <FormItem><FormLabel>حالة الشيك</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl" disabled={checkToEdit?.status === "مسحوب"}>
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حالة الشيك" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="صادر">صادر (تم إصداره)</SelectItem>
                                        <SelectItem value="مسحوب">مسحوب (تم صرفه من البنك)</SelectItem>
                                        <SelectItem value="ملغي">ملغي</SelectItem>
                                        <SelectItem value="متاح">متاح (لم يصدر بعد)</SelectItem>
                                    </SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )} />
                            <FormField control={checkForm.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input placeholder="سبب الإلغاء، إلخ" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit" disabled={checkToEdit?.status === "مسحوب"}>حفظ التغييرات</Button>
                                <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
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
                        <Input placeholder="بحث برقم الشيك أو المستفيد..." className="max-w-sm bg-background" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow"><Filter className="me-2 h-4 w-4" /> تصفية الحالة</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" dir="rtl">
                                <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem>صادر</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>مسحوب</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>متاح</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DatePickerWithPresets mode="range"/>
                    </div>
                </div>
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader><TableRow>
                        <TableHead>رقم الشيك</TableHead><TableHead>دفتر الشيكات</TableHead><TableHead>تاريخ الإصدار</TableHead>
                        <TableHead>المستفيد</TableHead><TableHead>المبلغ</TableHead><TableHead>الحالة</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{checks.sort((a,b) => a.checkNumber - b.checkNumber).map((chk) => (
                        <TableRow key={chk.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{chk.checkNumber}</TableCell>
                            <TableCell>{checkbooks.find(cb => cb.id === chk.checkbookId)?.bankAccountId.substring(0,10)}... ({checkbooks.find(cb => cb.id === chk.checkbookId)?.startSerial})</TableCell>
                            <TableCell>{chk.status !== "متاح" ? chk.issueDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' }) : "-"}</TableCell>
                            <TableCell>{chk.payee || "-"}</TableCell>
                            <TableCell>{chk.amount > 0 ? chk.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) : "-"}</TableCell>
                            <TableCell>
                                <Badge variant={chk.status === "مسحوب" ? "default" : chk.status === "صادر" ? "secondary" : chk.status === "ملغي" ? "destructive" : "outline"}>
                                    {chk.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                {chk.status !== "متاح" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الشيك" onClick={() => handlePrintCheck(chk)}><Printer className="h-4 w-4" /></Button>}
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title={chk.status === "متاح" ? "إصدار الشيك" : "تعديل/عرض حالة الشيك"} onClick={() => openManageCheckDialog(chk)}>
                                    {chk.status === "متاح" ? <PlusCircle className="h-4 w-4 text-green-600"/> : <Edit className="h-4 w-4" />}
                                </Button>
                            </TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Dialog for Printing Check */}
      <Dialog open={showPrintCheckDialog} onOpenChange={setShowPrintCheckDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة شيك رقم: {selectedCheckForPrint?.checkNumber}</DialogTitle>
          </DialogHeader>
          {selectedCheckForPrint && (() => {
            const checkbookDetails = checkbooks.find(cb => cb.id === selectedCheckForPrint.checkbookId);
            const bankAccountDetails = mockBankAccounts.find(ba => ba.id === checkbookDetails?.bankAccountId);
            return (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="cheque layout">
              {/* Header Section (Company info - optional for a cheque but good for context) */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'>
                  <AppLogo />
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-md font-semibold">شيك / Cheque</h3>
                  <p className="text-xs mt-1">رقم الشيك: <span className="font-mono">{selectedCheckForPrint.checkNumber}</span></p>
                  <p className="text-xs">البنك: {bankAccountDetails?.name || checkbookDetails?.bankAccountId}</p>
                </div>
              </div>

              {/* Cheque Body */}
              <div className="border border-gray-400 rounded-lg p-6 bg-muted/20 font-serif" data-ai-hint="bank cheque">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs">التاريخ / Date</span>
                    <span className="border-b-2 border-dotted border-gray-600 px-8 py-1 text-center text-base font-medium tracking-wider">
                        {new Date(selectedCheckForPrint.issueDate).toLocaleDateString('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' })}
                    </span>
                </div>

                <div className="flex items-center mb-4">
                    <span className="text-xs whitespace-nowrap me-2">ادفعوا لأمر / Pay to the order of</span>
                    <span className="border-b-2 border-dotted border-gray-600 px-4 py-1 flex-grow text-right text-base font-medium">
                        {selectedCheckForPrint.payee}
                    </span>
                </div>

                <div className="flex items-center mb-6">
                    <span className="text-xs whitespace-nowrap me-2">مبلغ وقدره / The sum of</span>
                    <span className="border-b-2 border-dotted border-gray-600 px-4 py-1 flex-grow text-right text-sm">
                        {convertAmountToWords(selectedCheckForPrint.amount)}
                    </span>
                </div>
                
                <div className="flex justify-end items-center mb-8">
                    <span className="text-xs me-2">المبلغ</span>
                    <span className="border-2 border-gray-500 rounded px-4 py-2 text-lg font-bold tracking-wider bg-white">
                        SAR {selectedCheckForPrint.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="flex justify-between items-end mt-10">
                    <div className="text-xs text-muted-foreground w-1/3">
                        <p>ملاحظات: {selectedCheckForPrint.notes || "لا يوجد"}</p>
                        {selectedCheckForPrint.status === "ملغي" && <p className="text-destructive font-bold">ملغي</p>}
                    </div>
                    <div className="w-1/3 text-center">
                        <p className="border-t-2 border-dotted border-gray-600 pt-1 text-xs">التوقيع المعتمد / Authorized Signature</p>
                    </div>
                     <div className="w-1/3 text-left text-xs text-muted-foreground">
                        <p>Account No: {bankAccountDetails?.name.split(' ').pop()}</p>
                    </div>
                </div>
                 <p className="text-center text-xs text-muted-foreground mt-6 print:block hidden">
                    هذا الشيك صادر من نظام المستقبل ERP - شركة المستقبل لتقنية المعلومات
                 </p>
              </div>
            </div>
          )}}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

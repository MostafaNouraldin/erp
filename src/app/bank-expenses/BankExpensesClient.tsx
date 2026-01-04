
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, ArrowDownCircle, Printer, CheckCircle, Undo, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AppLogo from '@/components/app-logo';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from "@/hooks/use-toast";
import { addBankExpense, updateBankExpense, deleteBankExpense, updateBankExpenseStatus } from './actions';
import type { BankExpenseFormValues, BankAccount, ExpenseAccount } from './actions';


const bankExpenseSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ المصروف مطلوب" }),
  bankAccountId: z.string().min(1, "الحساب البنكي مطلوب"),
  expenseAccountId: z.string().min(1, "حساب المصروف مطلوب"),
  beneficiary: z.string().min(1, "اسم المستفيد مطلوب"),
  description: z.string().min(1, "وصف المصروف مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  referenceNumber: z.string().optional(),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
});

const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};

interface ClientComponentProps {
    initialData: {
        bankExpenses: BankExpenseFormValues[];
        bankAccounts: BankAccount[];
        expenseAccounts: ExpenseAccount[];
    }
}

export default function BankExpensesClient({ initialData }: ClientComponentProps) {
  const [bankExpenses, setBankExpenses] = useState(initialData.bankExpenses);
  const [bankAccounts, setBankAccounts] = useState(initialData.bankAccounts);
  const [expenseAccounts, setExpenseAccounts] = useState(initialData.expenseAccounts);

  const [showManageExpenseDialog, setShowManageExpenseDialog] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<BankExpenseFormValues | null>(null);
  const [showPrintExpenseDialog, setShowPrintExpenseDialog] = useState(false);
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState<BankExpenseFormValues | null>(null);
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    setBankExpenses(initialData.bankExpenses);
    setBankAccounts(initialData.bankAccounts);
    setExpenseAccounts(initialData.expenseAccounts);
  }, [initialData]);

  const form = useForm<BankExpenseFormValues>({
    resolver: zodResolver(bankExpenseSchema),
    defaultValues: { date: new Date(), amount: 0, status: "مسودة" },
  });

  useEffect(() => {
    if (showManageExpenseDialog) {
        if (expenseToEdit) {
            form.reset({...expenseToEdit, date: new Date(expenseToEdit.date)});
        } else {
            form.reset({ date: new Date(), bankAccountId: "", expenseAccountId: "", beneficiary: "", description: "", amount: 0, referenceNumber: "", status: "مسودة" });
        }
    }
  }, [expenseToEdit, form, showManageExpenseDialog]);

  const handleExpenseSubmit = async (values: BankExpenseFormValues) => {
    try {
        if (expenseToEdit) {
            await updateBankExpense({ ...values, id: expenseToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل المصروف البنكي بنجاح." });
        } else {
            await addBankExpense(values);
            toast({ title: "تم الإنشاء", description: "تم إنشاء مصروف بنكي جديد." });
        }
        setShowManageExpenseDialog(false);
        setExpenseToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ المصروف البنكي.", variant: "destructive" });
    }
  };

  const handleDeleteExpenseAction = async (expenseId: string) => {
    try {
        await deleteBankExpense(expenseId);
        toast({ title: "تم الحذف", description: "تم حذف المصروف.", variant: "destructive" });
    } catch (error: any) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };
  
  const handlePostExpenseAction = async (expenseId: string) => {
    try {
        await updateBankExpenseStatus(expenseId, "مرحل");
        toast({ title: "تم الترحيل", description: `تم ترحيل المصروف ${expenseId}.` });
    } catch (error: any) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handleUnpostExpenseAction = async (expenseId: string) => {
    try {
        await updateBankExpenseStatus(expenseId, "مسودة");
        toast({ title: "تم إلغاء الترحيل", description: `تم إلغاء ترحيل المصروف ${expenseId}.` });
    } catch (error: any) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const handlePrintExpense = (expense: BankExpenseFormValues) => {
    setSelectedExpenseForPrint(expense);
    setShowPrintExpenseDialog(true);
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <ArrowDownCircle className="me-2 h-8 w-8 text-primary" />
            المصروفات البنكية
          </CardTitle>
          <CardDescription>
            تسجيل وتتبع جميع المصروفات التي تمت عبر الحسابات البنكية للشركة.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">سجل المصروفات البنكية</h2>
        <Dialog open={showManageExpenseDialog} onOpenChange={(isOpen) => { setShowManageExpenseDialog(isOpen); if (!isOpen) setExpenseToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setExpenseToEdit(null); setShowManageExpenseDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> تسجيل مصروف بنكي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{expenseToEdit ? 'تعديل مصروف بنكي' : 'تسجيل مصروف بنكي جديد'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleExpenseSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>تاريخ المصروف</FormLabel>
                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                    <FormItem><FormLabel>الحساب البنكي (المدفوع منه)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب البنكي" /></SelectTrigger></FormControl>
                        <SelectContent>{bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.bankName}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="expenseAccountId" render={({ field }) => (
                    <FormItem><FormLabel>حساب المصروف</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب المصروف" /></SelectTrigger></FormControl>
                        <SelectContent>{expenseAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="beneficiary" render={({ field }) => (
                    <FormItem><FormLabel>اسم المستفيد</FormLabel><FormControl><Input placeholder="اسم الجهة أو الشخص المستفيد" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>وصف المصروف</FormLabel><FormControl><Textarea placeholder="تفاصيل المصروف" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="referenceNumber" render={({ field }) => (
                        <FormItem><FormLabel>الرقم المرجعي (اختياري)</FormLabel><FormControl><Input placeholder="رقم شيك، تحويل، إلخ" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                  <Button type="submit">{expenseToEdit ? 'حفظ التعديلات' : 'حفظ المصروف'}</Button>
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
                <Input placeholder="بحث بالمستفيد أو الوصف..." className="max-w-sm bg-background" />
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
                  <TableHead>حساب المصروف</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell>{new Date(expense.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                    <TableCell className="font-medium">{bankAccounts.find(b => b.id === expense.bankAccountId)?.bankName}</TableCell>
                    <TableCell>{expenseAccounts.find(e => e.id === expense.expenseAccountId)?.name}</TableCell>
                    <TableCell>{expense.beneficiary}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(expense.amount) }}></TableCell>
                    <TableCell>{expense.referenceNumber || "-"}</TableCell>
                    <TableCell><Badge variant={expense.status === "مرحل" ? "default" : "outline"}>{expense.status}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintExpense(expense)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {expense.status === "مسودة" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setExpenseToEdit(expense); setShowManageExpenseDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف المصروف البنكي للمستفيد "{expense.beneficiary}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteExpenseAction(expense.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل" onClick={() => handlePostExpenseAction(expense.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        </>
                      )}
                      {expense.status === "مرحل" && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل" onClick={() => handleUnpostExpenseAction(expense.id!)}>
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

      <Dialog open={showPrintExpenseDialog} onOpenChange={setShowPrintExpenseDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة مصروف بنكي: {selectedExpenseForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedExpenseForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="voucher layout">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'>
                  
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض - المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-md font-semibold">إيصال مصروف بنكي</h3>
                  <p className="text-xs">Bank Expense Voucher</p>
                  <p className="text-xs mt-1">رقم: {selectedExpenseForPrint.id}</p>
                  <p className="text-xs">تاريخ: {new Date(selectedExpenseForPrint.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-xs">
                <div><strong>الحساب البنكي:</strong> {bankAccounts.find(b => b.id === selectedExpenseForPrint.bankAccountId)?.bankName}</div>
                <div><strong>حساب المصروف:</strong> {expenseAccounts.find(e => e.id === selectedExpenseForPrint.expenseAccountId)?.name}</div>
                <div className="col-span-2"><strong>المستفيد:</strong> {selectedExpenseForPrint.beneficiary}</div>
                <div className="col-span-2"><strong>الرقم المرجعي:</strong> {selectedExpenseForPrint.referenceNumber || "لا يوجد"}</div>
              </div>
              <div className="mb-6 text-xs">
                <p><strong>الوصف (البيان):</strong> {selectedExpenseForPrint.description}</p>
              </div>
              <div className="mb-8 p-3 border border-gray-300 rounded-md bg-muted/30 text-xs">
                  <p><strong>المبلغ:</strong> <span className="font-bold text-base" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedExpenseForPrint.amount) }}></span></p>
                  <p data-ai-hint="amount to words function"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedExpenseForPrint.amount)}</p>
              </div>
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
                  <p className="font-semibold">المستلم</p>
                  <p>Received by</p>
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

    

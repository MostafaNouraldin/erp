
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, ArrowDownSquare, Printer, CheckCircle, Undo, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// Mock Data
const mockCashAccounts = [ // Treasury accounts
  { id: "CASH001", name: "خزينة الفرع الرئيسي" },
  { id: "CASH002", name: "خزينة فرع جدة" },
];
const mockExpenseAccounts = [ // From Chart of Accounts (type: تفصيلي, parent: المصروفات)
  { id: "5010", name: "مصروفات عمومية وإدارية" },
  { id: "5015", name: "مصروفات نثرية" },
  { id: "5020", name: "مصروفات تسويق" },
  { id: "5050", name: "مشتريات صغيرة" },
];

const cashExpenseSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ المصروف مطلوب" }),
  cashAccountId: z.string().min(1, "حساب الخزينة مطلوب"),
  expenseAccountId: z.string().min(1, "حساب المصروف مطلوب"),
  beneficiary: z.string().min(1, "اسم المستفيد مطلوب"),
  description: z.string().min(1, "وصف المصروف مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  voucherNumber: z.string().optional(), // Internal voucher number
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
});

type CashExpenseFormValues = z.infer<typeof cashExpenseSchema>;

const initialCashExpensesData: CashExpenseFormValues[] = [
  { id: "CEXP001", date: new Date("2024-07-05"), cashAccountId: "CASH001", expenseAccountId: "5015", beneficiary: "سائق الشركة", description: "مصروف وقود للسيارة", amount: 150, voucherNumber: "VN-2024-101", status: "مرحل" },
  { id: "CEXP002", date: new Date("2024-07-12"), cashAccountId: "CASH002", expenseAccountId: "5050", beneficiary: "مكتبة النهضة", description: "شراء أدوات مكتبية عاجلة", amount: 250, voucherNumber: "VN-2024-102", status: "مرحل" },
  { id: "CEXP003", date: new Date("2024-07-18"), cashAccountId: "CASH001", expenseAccountId: "5010", beneficiary: "عامل نظافة", description: "أجرة تنظيف طارئة", amount: 100, voucherNumber: "VN-2024-103", status: "مسودة" },
];

export default function CashExpensesPage() {
  const [cashExpenses, setCashExpenses] = useState(initialCashExpensesData);
  const [showManageExpenseDialog, setShowManageExpenseDialog] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<CashExpenseFormValues | null>(null);

  const form = useForm<CashExpenseFormValues>({
    resolver: zodResolver(cashExpenseSchema),
    defaultValues: { date: new Date(), amount: 0, status: "مسودة" },
  });

  useEffect(() => {
    if (expenseToEdit) {
      form.reset(expenseToEdit);
    } else {
      form.reset({ date: new Date(), cashAccountId: "", expenseAccountId: "", beneficiary: "", description: "", amount: 0, voucherNumber: "", status: "مسودة" });
    }
  }, [expenseToEdit, form, showManageExpenseDialog]);

  const handleExpenseSubmit = (values: CashExpenseFormValues) => {
    if (expenseToEdit) {
      setCashExpenses(prev => prev.map(exp => exp.id === expenseToEdit.id ? values : exp));
    } else {
      setCashExpenses(prev => [...prev, { ...values, id: `CEXP${Date.now()}`, voucherNumber: values.voucherNumber || `VN-AUTO-${Date.now().toString().slice(-4)}` }]);
    }
    setShowManageExpenseDialog(false);
    setExpenseToEdit(null);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setCashExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };
  
  const handlePostExpense = (expenseId: string) => {
    setCashExpenses(prev => prev.map(exp => exp.id === expenseId ? { ...exp, status: "مرحل" } : exp));
  };

  const handleUnpostExpense = (expenseId: string) => {
    if(expenseId !== "CEXP001" && expenseId !== "CEXP002"){ // Mock check
        setCashExpenses(prev => prev.map(exp => exp.id === expenseId ? { ...exp, status: "مسودة" } : exp));
    } else {
        alert("لا يمكن إلغاء ترحيل هذا المصروف.");
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <ArrowDownSquare className="me-2 h-8 w-8 text-primary" />
            المصروفات النقدية
          </CardTitle>
          <CardDescription>
            تسجيل وتتبع جميع المصروفات التي تمت نقداً من خلال الخزائن المختلفة للشركة.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">سجل المصروفات النقدية</h2>
        <Dialog open={showManageExpenseDialog} onOpenChange={(isOpen) => { setShowManageExpenseDialog(isOpen); if (!isOpen) setExpenseToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setExpenseToEdit(null); form.reset(); setShowManageExpenseDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> تسجيل مصروف نقدي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{expenseToEdit ? 'تعديل مصروف نقدي' : 'تسجيل مصروف نقدي جديد'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleExpenseSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>تاريخ المصروف</FormLabel>
                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="cashAccountId" render={({ field }) => (
                    <FormItem><FormLabel>حساب الخزينة (المدفوع منه)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب الخزينة" /></SelectTrigger></FormControl>
                        <SelectContent>{mockCashAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="expenseAccountId" render={({ field }) => (
                    <FormItem><FormLabel>حساب المصروف</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب المصروف" /></SelectTrigger></FormControl>
                        <SelectContent>{mockExpenseAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
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
                    <FormField control={form.control} name="voucherNumber" render={({ field }) => (
                        <FormItem><FormLabel>رقم الإيصال (اختياري)</FormLabel><FormControl><Input placeholder="رقم إيصال داخلي" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
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
                  <TableHead>حساب الخزينة</TableHead>
                  <TableHead>حساب المصروف</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>رقم الإيصال</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/50">
                    <TableCell>{expense.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                    <TableCell className="font-medium">{mockCashAccounts.find(b => b.id === expense.cashAccountId)?.name}</TableCell>
                    <TableCell>{mockExpenseAccounts.find(e => e.id === expense.expenseAccountId)?.name}</TableCell>
                    <TableCell>{expense.beneficiary}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                    <TableCell>{expense.voucherNumber || "-"}</TableCell>
                    <TableCell><Badge variant={expense.status === "مرحل" ? "default" : "outline"}>{expense.status}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة (مثال)" onClick={() => alert(`طباعة إيصال ${expense.id}`)}>
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
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف المصروف النقدي للمستفيد "{expense.beneficiary}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteExpense(expense.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل" onClick={() => handlePostExpense(expense.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        </>
                      )}
                      {expense.status === "مرحل" && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل" onClick={() => handleUnpostExpense(expense.id!)}>
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
    </div>
  );
}

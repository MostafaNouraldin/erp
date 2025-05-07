
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, FileArchive, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Mock chart of accounts (should ideally come from a shared service or context)
const mockChartOfAccounts = [
  { id: "1011", name: "صندوق الفرع الرئيسي", type: "تفصيلي" },
  { id: "1012", name: "حساب البنك الأهلي", type: "تفصيلي" },
  { id: "1020", name: "العملاء", type: "فرعي" }, // Assuming specific customer accounts would be detailed elsewhere
  { id: "2010", name: "الموردون", type: "فرعي" }, // Assuming specific supplier accounts would be detailed elsewhere
  { id: "3000", name: "رأس المال", type: "تفصيلي" },
  { id: "3010", name: "الأرباح المحتجزة", type: "تفصيلي" },
];

const openingBalanceSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().min(1, "الحساب مطلوب"),
  date: z.date({ required_error: "تاريخ الرصيد الافتتاحي مطلوب" }),
  debit: z.coerce.number().min(0).default(0),
  credit: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "يجب إدخال قيمة في المدين أو الدائن.",
  path: ["debit"], // or ["credit"]
});

type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>;

const initialOpeningBalancesData: OpeningBalanceFormValues[] = [
  { id: "OB001", accountId: "1011", date: new Date("2024-01-01"), debit: 100000, credit: 0, notes: "رصيد الصندوق بداية العام" },
  { id: "OB002", accountId: "1012", date: new Date("2024-01-01"), debit: 150000, credit: 0, notes: "رصيد البنك بداية العام" },
  { id: "OB003", accountId: "3000", date: new Date("2024-01-01"), debit: 0, credit: 250000, notes: "رأس المال في بداية العام" },
];

export default function OpeningBalancesPage() {
  const [openingBalances, setOpeningBalances] = useState(initialOpeningBalancesData);
  const [showManageBalanceDialog, setShowManageBalanceDialog] = useState(false);
  const [balanceToEdit, setBalanceToEdit] = useState<OpeningBalanceFormValues | null>(null);

  const form = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: { date: new Date(), debit: 0, credit: 0 },
  });

  useEffect(() => {
    if (balanceToEdit) {
      form.reset(balanceToEdit);
    } else {
      form.reset({ accountId: "", date: new Date(), debit: 0, credit: 0, notes: "" });
    }
  }, [balanceToEdit, form, showManageBalanceDialog]);

  const handleBalanceSubmit = (values: OpeningBalanceFormValues) => {
    if (balanceToEdit) {
      setOpeningBalances(prev => prev.map(bal => bal.id === balanceToEdit.id ? values : bal));
    } else {
      setOpeningBalances(prev => [...prev, { ...values, id: `OB${Date.now()}` }]);
    }
    setShowManageBalanceDialog(false);
    setBalanceToEdit(null);
  };

  const handleDeleteBalance = (balanceId: string) => {
    setOpeningBalances(prev => prev.filter(bal => bal.id !== balanceId));
  };
  
  const totalDebit = openingBalances.reduce((sum, b) => sum + b.debit, 0);
  const totalCredit = openingBalances.reduce((sum, b) => sum + b.credit, 0);


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <FileArchive className="me-2 h-8 w-8 text-primary" />
            الأرصدة الافتتاحية
          </CardTitle>
          <CardDescription>
            إدارة وتسجيل الأرصدة الافتتاحية لحسابات دفتر الأستاذ في بداية الفترة المالية.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">قائمة الأرصدة الافتتاحية</h2>
        <Dialog open={showManageBalanceDialog} onOpenChange={(isOpen) => { setShowManageBalanceDialog(isOpen); if (!isOpen) setBalanceToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setBalanceToEdit(null); form.reset(); setShowManageBalanceDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إضافة رصيد افتتاحي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{balanceToEdit ? 'تعديل رصيد افتتاحي' : 'إضافة رصيد افتتاحي جديد'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBalanceSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>تاريخ الرصيد</FormLabel>
                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="accountId" render={({ field }) => (
                  <FormItem><FormLabel>الحساب</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب" /></SelectTrigger></FormControl>
                      <SelectContent>{mockChartOfAccounts.filter(acc => acc.type === "تفصيلي").map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>))}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="debit" render={({ field }) => (
                    <FormItem><FormLabel>مدين</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="credit" render={({ field }) => (
                    <FormItem><FormLabel>دائن</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 {form.formState.errors.debit && <FormMessage>{form.formState.errors.debit.message}</FormMessage>}
                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input placeholder="ملاحظات (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <DialogFooter>
                  <Button type="submit">{balanceToEdit ? 'حفظ التعديلات' : 'حفظ الرصيد'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="بحث باسم الحساب أو الملاحظات..." className="max-w-sm bg-background" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاريخ الرصيد</TableHead>
                  <TableHead>الحساب</TableHead>
                  <TableHead>مدين</TableHead>
                  <TableHead>دائن</TableHead>
                  <TableHead>ملاحظات</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openingBalances.map((balance) => (
                  <TableRow key={balance.id} className="hover:bg-muted/50">
                    <TableCell>{balance.date.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                    <TableCell className="font-medium">{mockChartOfAccounts.find(acc => acc.id === balance.accountId)?.name || balance.accountId}</TableCell>
                    <TableCell>{balance.debit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                    <TableCell>{balance.credit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                    <TableCell>{balance.notes}</TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setBalanceToEdit(balance); setShowManageBalanceDialog(true); }}>
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
                            <AlertDialogDescription>سيتم حذف الرصيد الافتتاحي للحساب "{mockChartOfAccounts.find(acc => acc.id === balance.accountId)?.name}" نهائياً.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBalance(balance.id!)}>تأكيد الحذف</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
               <TableRow className="font-semibold bg-muted/50">
                  <TableCell colSpan={2} className="text-center">الإجماليات</TableCell>
                  <TableCell>{totalDebit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                  <TableCell>{totalCredit.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                  <TableCell colSpan={2} className="text-center">
                    {totalDebit === totalCredit ? "متوازن" : `الفرق: ${(totalDebit - totalCredit).toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`}
                  </TableCell>
                </TableRow>
            </Table>
          </div>
           {totalDebit !== totalCredit && (
            <div className="mt-4 p-3 text-sm text-destructive-foreground bg-destructive rounded-md text-center">
              تحذير: إجمالي المدين لا يساوي إجمالي الدائن. يجب أن تكون الأرصدة الافتتاحية متوازنة.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

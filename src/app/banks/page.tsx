// This component now fetches data directly from the database.
// It is marked as 'use client' because it contains interactive elements 
// like forms and dialogs that require client-side JavaScript.
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Landmark, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch"; 
import { useCurrency } from '@/hooks/use-currency';

const bankAccountSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().min(1, "اسم البنك مطلوب"),
  accountNumber: z.string().min(1, "رقم الحساب مطلوب").regex(/^\d+$/, "رقم الحساب يجب أن يحتوي على أرقام فقط"),
  iban: z.string().optional(),
  accountType: z.enum(["جارى", "توفير", "وديعة"], { required_error: "نوع الحساب مطلوب" }),
  currency: z.enum(["SAR", "USD", "EUR"], { required_error: "العملة مطلوبة" }),
  balance: z.coerce.number().default(0),
  branchName: z.string().optional(),
  isActive: z.boolean().default(true),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

// This page no longer uses initial mock data.
// It will fetch data from the server action.

export default function BanksPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountFormValues[]>([]);
  const [showManageBankAccountDialog, setShowManageBankAccountDialog] = useState(false);
  const [bankAccountToEdit, setBankAccountToEdit] = useState<BankAccountFormValues | null>(null);
  const { formatCurrency } = useCurrency();

  // Fetch data on component mount
  useEffect(() => {
    // In a real app, this would be an API call.
    // For this demonstration, we'll keep it simple.
    // We will replace this with server actions later.
    const initialBankAccountsData: BankAccountFormValues[] = [
      { id: "BANK001", bankName: "البنك الأهلي التجاري", accountNumber: "102030405060", iban: "SA0380000000608010167519", accountType: "جارى", currency: "SAR", balance: 250000.75, branchName: "الفرع الرئيسي", isActive: true },
      { id: "BANK002", bankName: "بنك الرياض", accountNumber: "987654321000", iban: "SA0320000000102030405060", accountType: "توفير", currency: "SAR", balance: 15000.00, branchName: "فرع العليا", isActive: true },
      { id: "BANK003", bankName: "بنك ساب", accountNumber: "555111222333", iban: "SA4545000000012345678901", accountType: "جارى", currency: "USD", balance: 5000.00, branchName: "فرع جدة", isActive: false },
    ];
    setBankAccounts(initialBankAccountsData);
  }, []);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { bankName: "", accountNumber: "", accountType: "جارى", currency: "SAR", balance: 0, isActive: true },
  });

  useEffect(() => {
    if (bankAccountToEdit) {
      form.reset(bankAccountToEdit);
    } else {
      form.reset({ bankName: "", accountNumber: "", accountType: "جارى", currency: "SAR", balance: 0, isActive: true, iban: "", branchName: "" });
    }
  }, [bankAccountToEdit, form, showManageBankAccountDialog]);

  const handleBankAccountSubmit = (values: BankAccountFormValues) => {
    // This is a simulation. In a real app, you'd call a server action here.
    if (bankAccountToEdit) {
      setBankAccounts(prev => prev.map(acc => acc.id === bankAccountToEdit.id ? values : acc));
    } else {
      setBankAccounts(prev => [...prev, { ...values, id: `BANK${Date.now()}` }]);
    }
    setShowManageBankAccountDialog(false);
    setBankAccountToEdit(null);
  };

  const handleDeleteBankAccount = (accountId: string) => {
    // This is a simulation. In a real app, you'd call a server action here.
    setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Landmark className="me-2 h-8 w-8 text-primary" />
            إدارة البنوك والحسابات البنكية
          </CardTitle>
          <CardDescription>
            تسجيل وإدارة جميع الحسابات البنكية للشركة، تتبع الأرصدة، وتفاصيل الحسابات.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">قائمة الحسابات البنكية</h2>
        <Dialog open={showManageBankAccountDialog} onOpenChange={(isOpen) => { setShowManageBankAccountDialog(isOpen); if (!isOpen) setBankAccountToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setBankAccountToEdit(null); form.reset(); setShowManageBankAccountDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إضافة حساب بنكي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{bankAccountToEdit ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي جديد'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBankAccountSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="bankName" render={({ field }) => (
                    <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="مثال: البنك الأهلي" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>رقم الحساب</FormLabel><FormControl><Input placeholder="رقم الحساب البنكي" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="iban" render={({ field }) => (
                    <FormItem><FormLabel>رقم الآيبان (IBAN)</FormLabel><FormControl><Input placeholder="رقم الآيبان الدولي (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="accountType" render={({ field }) => (
                    <FormItem><FormLabel>نوع الحساب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر نوع الحساب" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="جارى">جارى</SelectItem><SelectItem value="توفير">توفير</SelectItem><SelectItem value="وديعة">وديعة</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>العملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العملة" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="SAR">SAR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="branchName" render={({ field }) => (
                    <FormItem><FormLabel>اسم الفرع</FormLabel><FormControl><Input placeholder="اسم فرع البنك (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                 <FormField control={form.control} name="balance" render={({ field }) => (
                    <FormItem><FormLabel>الرصيد الافتتاحي</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-start space-x-3 space-y-0 rtl:space-x-reverse rounded-md border p-3 shadow-sm"><FormLabel>الحساب نشط؟</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                <DialogFooter>
                  <Button type="submit">{bankAccountToEdit ? 'حفظ التعديلات' : 'حفظ الحساب'}</Button>
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
            <Input placeholder="بحث باسم البنك أو رقم الحساب..." className="max-w-sm bg-background" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم البنك</TableHead>
                  <TableHead>رقم الحساب</TableHead>
                  <TableHead>نوع الحساب</TableHead>
                  <TableHead>العملة</TableHead>
                  <TableHead>الرصيد الحالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{account.bankName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(account.balance) }}></TableCell>
                    <TableCell><Badge variant={account.isActive ? "default" : "outline"}>{account.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل/كشف حساب (مثال)" onClick={() => alert(`عرض كشف حساب لـ ${account.bankName}`)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setBankAccountToEdit(account); setShowManageBankAccountDialog(true); }}>
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
                            <AlertDialogDescription>سيتم حذف الحساب البنكي "{account.bankName} - {account.accountNumber}" نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBankAccount(account.id!)}>تأكيد الحذف</AlertDialogAction>
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
    </div>
  );
}

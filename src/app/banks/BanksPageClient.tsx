
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrency } from '@/hooks/use-currency';
import { addBankAccount, updateBankAccount, deleteBankAccount } from './actions';
import type { BankAccountFormValues } from './actions';

interface ClientComponentProps {
    initialBankAccounts: BankAccountFormValues[];
}

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


export default function BanksPageClient({ initialBankAccounts }: ClientComponentProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccountFormValues[]>(initialBankAccounts);
  const [showManageAccountDialog, setShowManageAccountDialog] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<BankAccountFormValues | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    setBankAccounts(initialBankAccounts);
  }, [initialBankAccounts]);

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: "",
      accountNumber: "",
      iban: "",
      accountType: "جارى",
      currency: "SAR",
      balance: 0,
      branchName: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      form.reset(accountToEdit);
    } else {
      form.reset({
        bankName: "", accountNumber: "", iban: "", accountType: "جارى", currency: "SAR",
        balance: 0, branchName: "", isActive: true,
      });
    }
  }, [accountToEdit, form, showManageAccountDialog]);

  const handleAccountSubmit = async (values: BankAccountFormValues) => {
    try {
      if (accountToEdit) {
        await updateBankAccount({ ...values, id: accountToEdit.id });
        toast({ title: "تم التعديل", description: "تم تعديل الحساب البنكي بنجاح." });
      } else {
        await addBankAccount(values);
        toast({ title: "تمت الإضافة", description: "تمت إضافة الحساب البنكي بنجاح." });
      }
      setShowManageAccountDialog(false);
      setAccountToEdit(null);
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم حفظ الحساب البنكي.", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteBankAccount(accountId);
      toast({ title: "تم الحذف", description: "تم حذف الحساب البنكي بنجاح.", variant: "destructive" });
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم حذف الحساب.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Landmark className="me-2 h-8 w-8 text-primary" />
            البنوك والحسابات البنكية
          </CardTitle>
          <CardDescription>
            إدارة جميع الحسابات البنكية للشركة، أرصدتها، وتفاصيلها.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">قائمة الحسابات البنكية</h2>
        <Dialog open={showManageAccountDialog} onOpenChange={(isOpen) => { setShowManageAccountDialog(isOpen); if (!isOpen) setAccountToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setAccountToEdit(null); form.reset(); setShowManageAccountDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إضافة حساب بنكي
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{accountToEdit ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي جديد'}</DialogTitle>
              <DialogDescription>أدخل تفاصيل الحساب البنكي.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAccountSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input placeholder="اسم البنك" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem><FormLabel>رقم الحساب</FormLabel><FormControl><Input placeholder="رقم الحساب" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="iban" render={({ field }) => (
                  <FormItem><FormLabel>رقم الآيبان (IBAN)</FormLabel><FormControl><Input placeholder="SA..." {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="accountType" render={({ field }) => (
                    <FormItem><FormLabel>نوع الحساب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="جارى">جارى</SelectItem><SelectItem value="توفير">توفير</SelectItem><SelectItem value="وديعة">وديعة</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem><FormLabel>العملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العملة" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="SAR">SAR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="branchName" render={({ field }) => (
                  <FormItem><FormLabel>اسم الفرع (اختياري)</FormLabel><FormControl><Input placeholder="اسم الفرع" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel className="mb-0">الحساب نشط؟</FormLabel>
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit">{accountToEdit ? 'حفظ التعديلات' : 'حفظ الحساب'}</Button>
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
                  <TableHead>الآيبان (IBAN)</TableHead>
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
                    <TableCell>{account.iban || "-"}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(account.balance).amount + ' ' + formatCurrency(account.balance).symbol }}></TableCell>
                    <TableCell><Badge variant={account.isActive ? "default" : "outline"}>{account.isActive ? "نشط" : "غير نشط"}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض كشف الحساب">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الحساب" onClick={() => { setAccountToEdit(account); setShowManageAccountDialog(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف الحساب">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                            <AlertDialogDescriptionComponent>
                              لا يمكن التراجع عن هذا الإجراء. سيتم حذف الحساب البنكي "{account.bankName}" ({account.accountNumber}) نهائياً.
                            </AlertDialogDescriptionComponent>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAccount(account.id!)}>تأكيد الحذف</AlertDialogAction>
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

    

    
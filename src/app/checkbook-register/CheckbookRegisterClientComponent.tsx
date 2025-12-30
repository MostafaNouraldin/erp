
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Printer, CheckCircle, Undo, Filter, BookCopy, FileText } from "lucide-react";
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
import { addCheck, updateCheck, deleteCheck, updateCheckStatus } from './actions';
import type { CheckFormValues, BankAccount } from './actions';

interface ClientComponentProps {
    initialData: {
        checks: CheckFormValues[];
        bankAccounts: BankAccount[];
    }
}

const checkSchema = z.object({
  id: z.string().optional(),
  checkNumber: z.string().min(1, "رقم الشيك مطلوب"),
  issueDate: z.date({ required_error: "تاريخ إصدار الشيك مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ استحقاق الشيك مطلوب" }),
  bankAccountId: z.string().min(1, "الحساب البنكي مطلوب"),
  beneficiaryName: z.string().min(1, "اسم المستفيد مطلوب"),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  currency: z.enum(["SAR", "USD", "EUR"]).default("SAR"),
  purpose: z.string().min(1, "الغرض من الشيك مطلوب"),
  notes: z.string().optional(),
  status: z.enum(["صادر", "مسدد", "ملغي", "مرتجع"]).default("صادر"),
});

const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`; 
};

export default function CheckbookRegisterClientComponent({ initialData }: ClientComponentProps) {
  const [checks, setChecks] = useState(initialData.checks);
  const [bankAccounts, setBankAccounts] = useState(initialData.bankAccounts);
  const [showManageCheckDialog, setShowManageCheckDialog] = useState(false);
  const [checkToEdit, setCheckToEdit] = useState<CheckFormValues | null>(null);
  const [showPrintCheckDialog, setShowPrintCheckDialog] = useState(false);
  const [selectedCheckForPrint, setSelectedCheckForPrint] = useState<CheckFormValues | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    setChecks(initialData.checks);
    setBankAccounts(initialData.bankAccounts);
  }, [initialData]);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<CheckFormValues>({
    resolver: zodResolver(checkSchema),
    defaultValues: { 
      issueDate: new Date(), 
      dueDate: new Date(), 
      amount: 0, 
      status: "صادر", 
      currency: "SAR" 
    },
  });

  useEffect(() => {
    if (showManageCheckDialog) {
        if (checkToEdit) {
        form.reset({
            ...checkToEdit,
            issueDate: new Date(checkToEdit.issueDate),
            dueDate: new Date(checkToEdit.dueDate),
        });
        } else {
        form.reset({ 
            checkNumber: "",
            issueDate: new Date(), 
            dueDate: new Date(), 
            bankAccountId: "", 
            beneficiaryName: "",
            amount: 0, 
            currency: "SAR",
            purpose: "",
            notes: "",
            status: "صادر" 
        });
        }
    }
  }, [checkToEdit, form, showManageCheckDialog]);

  const handleCheckSubmit = async (values: CheckFormValues) => {
    try {
        if (checkToEdit) {
          await updateCheck({ ...values, id: checkToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل الشيك بنجاح." });
        } else {
          await addCheck(values);
          toast({ title: "تم الإنشاء", description: "تم إنشاء الشيك بنجاح." });
        }
        setShowManageCheckDialog(false);
        setCheckToEdit(null);
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حفظ الشيك.", variant: "destructive"});
    }
  };

  const handleDeleteCheckAction = async (checkId: string) => {
    try {
        await deleteCheck(checkId);
        toast({ title: "تم الحذف", description: "تم حذف الشيك.", variant: "destructive" });
    } catch(e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };
  
  const handleUpdateCheckStatusAction = async (checkId: string, newStatus: CheckFormValues["status"]) => {
    try {
        await updateCheckStatus(checkId, newStatus);
        toast({ title: "تم تحديث الحالة", description: `تم تحديث حالة الشيك إلى ${newStatus}`});
    } catch(e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive"});
    }
  };

  const handlePrintCheck = (check: CheckFormValues) => {
    setSelectedCheckForPrint(check);
    setShowPrintCheckDialog(true);
  };

  const formatDate = (date: Date | string) => {
    if (!isClient) return ''; 
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'long', year: 'numeric', calendar: 'gregory' }).format(d);
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
            تسجيل ومتابعة جميع الشيكات الصادرة، تواريخ استحقاقها، وحالتها (مسدد، ملغي، إلخ).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">سجل الشيكات الصادرة</h2>
        <Dialog open={showManageCheckDialog} onOpenChange={(isOpen) => { setShowManageCheckDialog(isOpen); if (!isOpen) setCheckToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setCheckToEdit(null); form.reset(); setShowManageCheckDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إصدار شيك جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>{checkToEdit ? 'تعديل بيانات شيك' : 'إصدار شيك جديد'}</DialogTitle>
              <DialogDescriptionComponent>أدخل تفاصيل الشيك.</DialogDescriptionComponent>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCheckSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="checkNumber" render={({ field }) => (
                  <FormItem><FormLabel>رقم الشيك</FormLabel><FormControl><Input placeholder="أدخل رقم الشيك" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>تاريخ الإصدار</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="bankAccountId" render={({ field }) => (
                    <FormItem><FormLabel>الحساب البنكي المسحوب عليه</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب البنكي" /></SelectTrigger></FormControl>
                        <SelectContent>{bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="beneficiaryName" render={({ field }) => (
                    <FormItem><FormLabel>اسم المستفيد</FormLabel><FormControl><Input placeholder="اسم الجهة أو الشخص المستفيد" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="currency" render={({ field }) => (
                        <FormItem><FormLabel>العملة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العملة" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="SAR">SAR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                            </Select><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="purpose" render={({ field }) => (
                    <FormItem><FormLabel>الغرض من الشيك</FormLabel><FormControl><Textarea placeholder="وصف موجز لسبب إصدار الشيك" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>ملاحظات (اختياري)</FormLabel><FormControl><Input placeholder="أي ملاحظات إضافية" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                  <Button type="submit">{checkToEdit ? 'حفظ التعديلات' : 'حفظ الشيك'}</Button>
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
                <Input placeholder="بحث برقم الشيك أو المستفيد..." className="max-w-sm bg-background" />
            </div>
            <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب حالة الشيك</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>صادر</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>مسدد</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>مرتجع</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DatePickerWithPresets mode="range"/>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الشيك</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحساب البنكي</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{check.checkNumber}</TableCell>
                    <TableCell>{formatDate(check.issueDate)}</TableCell>
                    <TableCell>{formatDate(check.dueDate)}</TableCell>
                    <TableCell>{bankAccounts.find(b => b.id === check.bankAccountId)?.name}</TableCell>
                    <TableCell>{check.beneficiaryName}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(check.amount) }}></TableCell>
                    <TableCell>
                        <Badge 
                            variant={
                                check.status === "مسدد" ? "default" :
                                check.status === "صادر" ? "secondary" :
                                check.status === "ملغي" || check.status === "مرتجع" ? "destructive" :
                                "outline"
                            }
                            className="whitespace-nowrap"
                        >{check.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الشيك" onClick={() => handlePrintCheck(check)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الشيك" onClick={() => alert(`عرض تفاصيل الشيك: ${check.checkNumber}`)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      {check.status === "صادر" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setCheckToEdit(check); setShowManageCheckDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="تسجيل كسداد">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد السداد</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من تسجيل الشيك رقم "{check.checkNumber}" كـ "مسدد"؟
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleUpdateCheckStatusAction(check.id!, "مسدد")}>
                                  تأكيد السداد
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إلغاء الشيك">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الإلغاء</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من إلغاء الشيك رقم "{check.checkNumber}"؟
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUpdateCheckStatusAction(check.id!, "ملغي")}
                                    className={buttonVariants({ variant: "destructive" })}
                                  >
                                    تأكيد الإلغاء
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </>
                      )}
                       {check.status === "مسدد" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="تسجيل كمرتجع">
                                <Undo className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الارتجاع</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من تسجيل الشيك رقم "{check.checkNumber}" كـ "مرتجع"؟
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleUpdateCheckStatusAction(check.id!, "مرتجع")}>
                                تأكيد الارتجاع
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

      {/* Dialog for Printing Check */}
      <Dialog open={showPrintCheckDialog} onOpenChange={setShowPrintCheckDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl"> 
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة شيك رقم: {selectedCheckForPrint?.checkNumber}</DialogTitle>
            <DialogDescriptionComponent>معاينة الشيك قبل الطباعة.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedCheckForPrint && isClient && (
             <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="bank check print layout">
                {/* Header Section */}
                <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                    <div className='flex items-center gap-2'>
                    <AppLogo />
                    <div>
                        <h2 className="text-lg font-bold">{bankAccounts.find(b => b.id === selectedCheckForPrint.bankAccountId)?.name || 'اسم البنك'}</h2>
                        <p className="text-xs">فرع: [اسم الفرع هنا]</p> 
                    </div>
                    </div>
                    <div className="text-left">
                    <p className="text-xs">التاريخ: {formatDate(selectedCheckForPrint.issueDate)}</p>
                    <p className="text-xs mt-1">تاريخ الاستحقاق: {formatDate(selectedCheckForPrint.dueDate)}</p>
                    <p className="text-lg font-bold mt-1">رقم الشيك: {selectedCheckForPrint.checkNumber}</p>
                    </div>
                </div>

                {/* Body Section - Details */}
                <div className="flex justify-between items-center mb-6 text-md">
                    <span>ادفعوا لأمر:</span>
                    <span className="text-xl font-semibold border-b-2 border-dotted border-foreground flex-grow mx-4 text-center py-1">{selectedCheckForPrint.beneficiaryName}</span>
                </div>

                <div className="flex justify-between items-center mb-8 text-md">
                    <span>مبلغ وقدره:</span>
                    <span className="text-lg border-b-2 border-dotted border-foreground flex-grow mx-4 text-center py-1" data-ai-hint="amount words">{convertAmountToWords(selectedCheckForPrint.amount)}</span>
                    <div className="border-2 border-foreground p-2 rounded-md min-w-[180px] text-center">
                        <span className="text-xl font-bold" dangerouslySetInnerHTML={{ __html: formatCurrency(selectedCheckForPrint.amount) }}></span>
                    </div>
                </div>
                
                {/* Footer Section - Signatures and Purpose */}
                <div className="flex justify-between items-end mt-10">
                    <div>
                        <p className="text-xs">الغرض: {selectedCheckForPrint.purpose}</p>
                        {selectedCheckForPrint.notes && <p className="text-xs mt-1">ملاحظات: {selectedCheckForPrint.notes}</p>}
                    </div>
                    <div className="text-center">
                        <p className="border-t-2 border-dotted border-foreground w-48 pt-2 mt-4">التوقيع المعتمد</p>
                        <p className="text-xs">Authorized Signature</p>
                    </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-6 print:block hidden">هذا الشيك خاضع لشروط وأحكام البنك</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()} disabled={!selectedCheckForPrint || !isClient}><Printer className="me-2 h-4 w-4" /> طباعة</Button>
            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

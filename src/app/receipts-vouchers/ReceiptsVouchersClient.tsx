
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import AppLogo from '@/components/app-logo'; 
import { useToast } from "@/hooks/use-toast";
import { addVoucher, updateVoucher, deleteVoucher, postVoucher } from './actions';
import type { VoucherFormValues, Party, Account } from './actions';

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

const convertAmountToWords = (amount: number) => {
  return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};

interface ClientComponentProps {
    initialData: {
        vouchers: VoucherFormValues[];
        accounts: Account[];
        parties: Party[];
    }
}

export default function ReceiptsVouchersClient({ initialData }: ClientComponentProps) {
  const [vouchers, setVouchers] = useState(initialData.vouchers);
  const [showCreateVoucherDialog, setShowCreateVoucherDialog] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<VoucherFormValues | null>(null);
  const [dialogType, setDialogType] = useState<"سند قبض" | "سند صرف">("سند قبض");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<VoucherFormValues | null>(null);
  const { toast } = useToast();

  const form = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: { date: new Date(), method: "نقدي", amount: 0, status: "مسودة", branch: "الرئيسي" },
  });

  useEffect(() => {
    setVouchers(initialData.vouchers);
  }, [initialData]);

  useEffect(() => {
    if (showCreateVoucherDialog) {
        if (voucherToEdit) {
            form.reset({
                ...voucherToEdit,
                date: new Date(voucherToEdit.date),
            });
        } else {
            form.reset({ date: new Date(), type: dialogType, method: "نقدي", amount: 0, status: "مسودة", branch: "الرئيسي", partyId: "", accountId: "", notes: "" });
        }
    }
  }, [voucherToEdit, dialogType, form, showCreateVoucherDialog]);

  const handleSubmit = async (values: VoucherFormValues) => {
    const party = initialData.parties.find(p => p.id === values.partyId);
    const completeValues = { ...values, partyName: party?.name || values.partyId };

    try {
        if (voucherToEdit) {
            await updateVoucher({ ...completeValues, id: voucherToEdit.id! });
            toast({ title: "تم التعديل", description: "تم تعديل السند بنجاح." });
        } else {
            await addVoucher(completeValues);
            toast({ title: "تم الإنشاء", description: "تم إنشاء السند بنجاح." });
        }
        setShowCreateVoucherDialog(false);
        setVoucherToEdit(null);
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (voucherId: string) => {
    try {
        await deleteVoucher(voucherId);
        toast({ title: "تم الحذف", description: "تم حذف السند بنجاح.", variant: "destructive" });
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handlePost = async (voucherId: string) => {
    try {
        await postVoucher(voucherId);
        toast({ title: "تم الترحيل", description: "تم ترحيل السند وتحديث الأرصدة." });
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handlePrintVoucher = (voucher: VoucherFormValues) => {
    setSelectedVoucherForPrint(voucher);
    setShowPrintDialog(true);
  };
  
  const openDialog = (type: "سند قبض" | "سند صرف", voucherData: VoucherFormValues | null = null) => {
    setDialogType(type);
    setVoucherToEdit(voucherData);
    setShowCreateVoucherDialog(true);
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
            <DialogDescriptionComponent>أدخل تفاصيل السند.</DialogDescriptionComponent>
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
                        <SelectContent>{initialData.parties.filter(p => dialogType === "سند قبض" ? p.type === 'customer' : p.type === 'supplier' || p.type === 'expense').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
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
                            <SelectContent>{initialData.accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
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
        </TabsList>

        <TabsContent value="allVouchers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة السندات</CardTitle>
              <CardDescription>إدارة جميع سندات القبض والصرف النقدية والبنكية.</CardDescription>
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
                       <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مرحل</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range"/>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                      <TableHead>رقم السند</TableHead><TableHead>التاريخ</TableHead><TableHead>النوع</TableHead>
                      <TableHead>الجهة</TableHead><TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{vouchers.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{voucher.id}</TableCell>
                        <TableCell>{new Date(voucher.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell><Badge variant={voucher.type === "سند قبض" ? "default" : "secondary"} className="whitespace-nowrap bg-opacity-80">
                            {voucher.type === "سند قبض" ? <Banknote className="inline me-1 h-3 w-3"/> : <Building className="inline me-1 h-3 w-3"/>}{voucher.type}</Badge>
                        </TableCell>
                        <TableCell>{voucher.partyName}</TableCell>
                        <TableCell className="whitespace-nowrap">{voucher.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell><Badge variant={voucher.status === "مرحل" ? "default" : "outline"} className="whitespace-nowrap">{voucher.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintVoucher(voucher)}><Printer className="h-4 w-4" /></Button>
                          {voucher.status === "مسودة" && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => openDialog(voucher.type, voucher)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                  <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف السند "{voucher.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(voucher.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل السند" onClick={() => handlePost(voucher.id!)}><CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /></Button>
                          </>)}
                           {voucher.status === "مرحل" && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل"><Undo className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></Button></AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>تأكيد إلغاء الترحيل</AlertDialogTitle><AlertDialogDescription>سيتم إلغاء ترحيل السند "{voucher.id}" وعكس تأثيره المالي. هل أنت متأكد؟</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => alert("Unpost functionality to be implemented")}>تأكيد الإلغاء</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

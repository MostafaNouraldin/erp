"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Download, Search, BookUser, FilePlus, BookOpen, BarChart3, MinusCircle, CheckCircle, Undo, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose, DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from "@/hooks/use-toast";
import { addAccount, updateAccount, deleteAccount, addJournalEntry, updateJournalEntry, deleteJournalEntry, updateJournalEntryStatus, getAccountStatement } from './actions';
import type { JournalEntry, AccountStatementEntry } from './actions'; 

const NO_PARENT_ID_VALUE = "__no_parent__";

// Schemas
const accountSchema = z.object({
  id: z.string().min(1, "رقم الحساب مطلوب").regex(/^\d+$/, "رقم الحساب يجب أن يحتوي على أرقام فقط"),
  name: z.string().min(1, "اسم الحساب مطلوب"),
  type: z.enum(["رئيسي", "فرعي", "تحليلي", "صندوق", "بنك"], { required_error: "نوع الحساب مطلوب" }),
  parentId: z.string().nullable().optional(),
  balance: z.number().optional(), 
});
type AccountFormValues = z.infer<typeof accountSchema>;

const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "الحساب مطلوب"),
  debit: z.coerce.number().min(0, "المبلغ المدين يجب أن يكون إيجابيًا").default(0),
  credit: z.coerce.number().min(0, "المبلغ الدائن يجب أن يكون إيجابيًا").default(0),
  description: z.string().optional(),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "يجب إدخال مبلغ مدين أو دائن",
  path: ["debit"], 
});


const journalEntrySchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  description: z.string().min(1, "الوصف مطلوب"),
  lines: z.array(journalEntryLineSchema).min(2, "يجب أن يحتوي القيد على حركتين على الأقل."),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
  totalAmount: z.number().optional(), 
  sourceModule: z.string().optional().default("General"),
  sourceDocumentId: z.string().optional(),
}).refine(data => {
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Use a tolerance for float comparison
}, {
    message: "إجمالي المدين يجب أن يساوي إجمالي الدائن.",
    path: ["lines"], 
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;


export default function GeneralLedgerClientComponent({ initialData }: { initialData: { chartOfAccounts: any[], journalEntries: any[] } }) {
  const [chartOfAccounts, setChartOfAccounts] = useState(initialData.chartOfAccounts);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(initialData.journalEntries);
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  
  useEffect(() => {
    setChartOfAccounts(initialData.chartOfAccounts);
    setJournalEntries(initialData.journalEntries);
  }, [initialData]);
  
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountFormValues | null>(null);
  
  const [showAddJournalEntryDialog, setShowAddJournalEntryDialog] = useState(false);
  const [journalEntryToEdit, setJournalEntryToEdit] = useState<JournalEntryFormValues | null>(null);
  
  const [showViewJournalEntryDialog, setShowViewJournalEntryDialog] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  
  const [showFinancialReportDialog, setShowFinancialReportDialog] = useState(false);
  const [selectedFinancialReport, setSelectedFinancialReport] = useState<string | null>(null);

  const [showAccountStatementDialog, setShowAccountStatementDialog] = useState(false);
  const [selectedAccountForStatement, setSelectedAccountForStatement] = useState<any | null>(null);
  const [accountStatementData, setAccountStatementData] = useState<AccountStatementEntry[]>([]);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);


  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { id: '', name: '', type: "تحليلي", parentId: null, balance: 0 },
  });

  const journalEntryForm = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date(), description: "", lines: [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }], status: "مسودة", sourceModule: "General"
    },
  });
  const { fields: journalLinesFields, append: appendJournalLine, remove: removeJournalLine } = useFieldArray({
    control: journalEntryForm.control, name: "lines",
  });


  useEffect(() => {
    if (accountToEdit) accountForm.reset(accountToEdit);
    else accountForm.reset({ id: '', name: '', type: "تحليلي", parentId: null, balance: 0 });
  }, [accountToEdit, accountForm, showAddAccountDialog]);

  useEffect(() => {
    if (journalEntryToEdit) {
      journalEntryForm.reset({
        ...journalEntryToEdit,
        lines: journalEntryToEdit.lines.length > 0 ? journalEntryToEdit.lines : [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }]
      });
    } else {
      journalEntryForm.reset({
        date: new Date(), description: "", lines: [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }], status: "مسودة", sourceModule: "General"
      });
    }
  }, [journalEntryToEdit, journalEntryForm, showAddJournalEntryDialog]);


  const handleAccountSubmit = async (values: AccountFormValues) => {
    const finalValues = {
      ...values,
      parentId: values.parentId === NO_PARENT_ID_VALUE ? null : values.parentId,
    };
    try {
      if (accountToEdit) {
        await updateAccount({ ...finalValues, balance: accountToEdit.balance || 0 });
        toast({ title: "تم التعديل", description: "تم تعديل الحساب بنجاح." });
      } else {
        await addAccount({ ...finalValues, balance: 0 });
        toast({ title: "تمت الإضافة", description: "تمت إضافة الحساب بنجاح." });
      }
      setShowAddAccountDialog(false);
      setAccountToEdit(null);
    } catch (error) {
        toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast({ title: "تم الحذف", description: "تم حذف الحساب بنجاح.", variant: "destructive" });
    } catch (error) {
      toast({ title: "خطأ", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleJournalEntrySubmit = async (values: JournalEntryFormValues) => {
    const totalDebit = values.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const finalValues = { 
        ...values, 
        totalAmount: totalDebit,
    };

    try {
      if (journalEntryToEdit) {
        await updateJournalEntry({ ...finalValues, id: journalEntryToEdit.id! });
        toast({ title: "تم التعديل", description: "تم تعديل القيد بنجاح." });
      } else {
        await addJournalEntry(finalValues);
        toast({ title: "تم الإنشاء", description: "تم إنشاء القيد بنجاح." });
      }
      setShowAddJournalEntryDialog(false);
      setJournalEntryToEdit(null);
    } catch(e) {
       toast({ title: "خطأ", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleViewJournalEntry = (entry: JournalEntry) => {
    setSelectedJournalEntry(entry);
    setShowViewJournalEntryDialog(true);
  };

  const handleViewAccountStatement = async (account: any) => {
    setSelectedAccountForStatement(account);
    setShowAccountStatementDialog(true);
    setIsLoadingStatement(true);
    try {
      const statement = await getAccountStatement(account.id);
      setAccountStatementData(statement);
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم تحميل كشف الحساب.", variant: "destructive" });
    } finally {
      setIsLoadingStatement(false);
    }
  };
  
  const handlePostJournalEntry = async (entryId: string) => {
    try {
        await updateJournalEntryStatus(entryId, "مرحل");
        toast({ title: "تم الترحيل", description: "تم ترحيل القيد بنجاح." });
    } catch (e) {
        toast({ title: "خطأ", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleUnpostJournalEntry = async (entryId: string) => {
    try {
        await updateJournalEntryStatus(entryId, "مسودة");
        toast({ title: "تم إلغاء الترحيل", description: "تم إلغاء ترحيل القيد بنجاح." });
    } catch (e) {
        toast({ title: "خطأ", description: (e as Error).message, variant: "destructive" });
    }
  };
  
  const handleDeleteJournalEntry = async (entryId: string) => {
    try {
        await deleteJournalEntry(entryId);
        toast({ title: "تم الحذف", description: "تم حذف القيد بنجاح.", variant: "destructive" });
    } catch (e) {
        toast({ title: "خطأ", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleViewFinancialReport = (reportName: string) => {
    setSelectedFinancialReport(reportName);
    setShowFinancialReportDialog(true);
  }

  const watchedLines = journalEntryForm.watch('lines');
  const totalDebit = watchedLines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = watchedLines.reduce((sum, line) => sum + (line.credit || 0), 0);

  const translateSourceModule = (source: string | undefined) => {
    switch (source) {
        case "General": return "عام";
        case "POS": return "نقاط البيع";
        case "EmployeeSettlements": return "تسوية موظف";
        case "ReceiptVoucher": return "سند قبض";
        case "PaymentVoucher": return "سند صرف";
        default: return source || "غير محدد";
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات العامة</h1>
        <Dialog open={showAddJournalEntryDialog} onOpenChange={(isOpen) => { setShowAddJournalEntryDialog(isOpen); if (!isOpen) setJournalEntryToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setJournalEntryToEdit(null); journalEntryForm.reset({date: new Date(), description: "", lines: [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }], status: "مسودة", sourceModule: "General"}); setShowAddJournalEntryDialog(true);}}>
              <FilePlus className="me-2 h-4 w-4" /> إنشاء قيد يومية جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>{journalEntryToEdit ? "تعديل قيد يومية" : "إنشاء قيد يومية جديد"}</DialogTitle>
              <DialogDescription>أدخل تفاصيل القيد اليومي.</DialogDescription>
            </DialogHeader>
            <Form {...journalEntryForm}>
              <form onSubmit={journalEntryForm.handleSubmit(handleJournalEntrySubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={journalEntryForm.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                    <FormField control={journalEntryForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>الوصف العام للقيد</FormLabel>
                        <FormControl><Textarea placeholder="وصف القيد" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <ScrollArea className="h-[300px] border rounded-md p-2">
                    {journalLinesFields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-3 p-2 border-b">
                        <FormField control={journalEntryForm.control} name={`lines.${index}.accountId`} render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="text-xs">الحساب</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background h-9 text-xs"><SelectValue placeholder="اختر الحساب" /></SelectTrigger></FormControl>
                                <SelectContent>{chartOfAccounts.filter(acc => acc.type === "تحليلي" || acc.type === "صندوق" || acc.type === "بنك").map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>))}</SelectContent>
                            </Select><FormMessage className="text-xs"/></FormItem> )} />
                        <FormField control={journalEntryForm.control} name={`lines.${index}.debit`} render={({ field }) => (
                            <FormItem className="col-span-6 sm:col-span-2"><FormLabel className="text-xs">مدين</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-background h-9 text-xs" placeholder="0.00" /></FormControl>
                            <FormMessage className="text-xs"/></FormItem> )} />
                        <FormField control={journalEntryForm.control} name={`lines.${index}.credit`} render={({ field }) => (
                            <FormItem className="col-span-6 sm:col-span-2"><FormLabel className="text-xs">دائن</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-background h-9 text-xs" placeholder="0.00" /></FormControl>
                             <FormMessage className="text-xs"/></FormItem> )} />
                        <FormField control={journalEntryForm.control} name={`lines.${index}.description`} render={({ field }) => (
                            <FormItem className="col-span-10 sm:col-span-3"><FormLabel className="text-xs">وصف السطر</FormLabel>
                            <FormControl><Input {...field} className="bg-background h-9 text-xs" placeholder="وصف تفصيلي (اختياري)"/></FormControl>
                            <FormMessage className="text-xs"/></FormItem> )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeJournalLine(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10" disabled={journalLinesFields.length <= 2}><MinusCircle className="h-4 w-4" /></Button>
                    </div>))}
                </ScrollArea>
                <Button type="button" variant="outline" onClick={() => appendJournalLine({ accountId: "", debit: 0, credit: 0, description: "" })} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة سطر جديد</Button>
                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
                    <div className="font-semibold">إجمالي المدين: <span dangerouslySetInnerHTML={{ __html: formatCurrency(totalDebit).amount + ' ' + formatCurrency(totalDebit).symbol }}></span></div>
                    <div className="font-semibold">إجمالي الدائن: <span dangerouslySetInnerHTML={{ __html: formatCurrency(totalCredit).amount + ' ' + formatCurrency(totalCredit).symbol }}></span></div>
                </div>
                {journalEntryForm.formState.errors.lines && <FormMessage>{journalEntryForm.formState.errors.lines.message || journalEntryForm.formState.errors.lines.root?.message}</FormMessage>}
                <DialogFooter>
                  <Button type="submit">{journalEntryToEdit ? "حفظ التعديلات" : "حفظ القيد"}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="chartOfAccounts" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="chartOfAccounts" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BookUser className="inline-block me-2 h-4 w-4" /> شجرة الحسابات</TabsTrigger>
          <TabsTrigger value="journalEntries" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BookOpen className="inline-block me-2 h-4 w-4" /> القيود اليومية</TabsTrigger>
          <TabsTrigger value="financialReports" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BarChart3 className="inline-block me-2 h-4 w-4" /> التقارير المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="chartOfAccounts">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>شجرة الحسابات</CardTitle><CardDescription>إدارة وتتبع هيكل الحسابات المالية للشركة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الحسابات..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <Dialog open={showAddAccountDialog} onOpenChange={(isOpen) => { setShowAddAccountDialog(isOpen); if (!isOpen) setAccountToEdit(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => { setAccountToEdit(null); accountForm.reset({ id: '', name: '', type: "تحليلي", parentId: null, balance: 0 }); setShowAddAccountDialog(true); }}>
                      <PlusCircle className="me-2 h-4 w-4" /> إضافة حساب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader><DialogTitle>{accountToEdit ? 'تعديل حساب' : 'إضافة حساب جديد'}</DialogTitle><DialogDescription>أدخل تفاصيل الحساب.</DialogDescription></DialogHeader>
                    <Form {...accountForm}>
                        <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4 py-4">
                            <FormField control={accountForm.control} name="id" render={({ field }) => (<FormItem><FormLabel>رقم الحساب</FormLabel><FormControl><Input placeholder="مثال: 1012" {...field} className="bg-background" disabled={!!accountToEdit} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={accountForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم الحساب</FormLabel><FormControl><Input placeholder="اسم الحساب" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={accountForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>النوع</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="رئيسي">رئيسي</SelectItem>
                                        <SelectItem value="فرعي">فرعي</SelectItem>
                                        <SelectItem value="تحليلي">تحليلي</SelectItem>
                                        <SelectItem value="صندوق">صندوق</SelectItem>
                                        <SelectItem value="بنك">بنك</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>)} />
                            <FormField control={accountForm.control} name="parentId" render={({ field }) => (
                                <FormItem><FormLabel>الحساب الرئيسي</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(value === NO_PARENT_ID_VALUE ? null : value)} 
                                    value={field.value === null || field.value === undefined ? NO_PARENT_ID_VALUE : field.value} 
                                    dir="rtl"
                                >
                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب الرئيسي (إن وجد)" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value={NO_PARENT_ID_VALUE}><em>لا يوجد</em></SelectItem>
                                        {chartOfAccounts.filter(acc => acc.type !== 'تحليلي').map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>))}
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>)} />
                            <DialogFooter><Button type="submit">{accountToEdit ? 'حفظ التعديلات' : 'حفظ الحساب'}</Button><DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>رقم الحساب</TableHead><TableHead>اسم الحساب</TableHead><TableHead>النوع</TableHead><TableHead>الحساب الرئيسي</TableHead><TableHead>الرصيد الحالي</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>{chartOfAccounts.map((account) => (<TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell>{account.id}</TableCell><TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell><Badge variant={account.type === "رئيسي" ? "default" : account.type === "فرعي" ? "secondary" : "outline"}>{account.type}</Badge></TableCell>
                        <TableCell>{chartOfAccounts.find(a => a.id === account.parentId)?.name || "-"}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(account.balance).amount + ' ' + formatCurrency(account.balance).symbol }}></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض كشف الحساب" onClick={() => handleViewAccountStatement(account)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setAccountToEdit(account); setShowAddAccountDialog(true); }}><Edit className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescriptionComponent>لا يمكن التراجع عن هذا الإجراء. سيتم حذف الحساب "{account.name}" نهائياً.</AlertDialogDescriptionComponent></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell></TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journalEntries">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>القيود اليومية</CardTitle><CardDescription>تسجيل ومراجعة جميع المعاملات المالية.</CardDescription></CardHeader>
            <CardContent>
             <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في القيود..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DatePickerWithPresets mode="range" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>رقم القيد</TableHead><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>المبلغ</TableHead><TableHead>المصدر</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                  <TableBody>{journalEntries.map((entry) => (<TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell>{entry.id}</TableCell><TableCell>{new Date(entry.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell><TableCell>{entry.description}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.totalAmount || 0).amount + ' ' + formatCurrency(entry.totalAmount || 0).symbol }}></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{translateSourceModule(entry.sourceModule)}</Badge></TableCell>
                        <TableCell><Badge variant={entry.status === "مرحل" ? "default" : "outline"}>{entry.status}</Badge></TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => handleViewJournalEntry(entry)}><FileText className="h-4 w-4" /></Button>
                          {entry.status === "مسودة" && entry.sourceModule === "General" && (<>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setJournalEntryToEdit(entry); setShowAddJournalEntryDialog(true);}}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescriptionComponent>سيتم حذف القيد "{entry.id}" نهائياً.</AlertDialogDescriptionComponent></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteJournalEntry(entry.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="ترحيل القيد" onClick={() => handlePostJournalEntry(entry.id!)}><CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" /></Button>
                          </>)}
                          {entry.status === "مرحل" && entry.sourceModule === "General" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100 dark:hover:bg-yellow-900" title="إلغاء الترحيل" onClick={() => handleUnpostJournalEntry(entry.id!)}><Undo className="h-4 w-4 text-yellow-600 dark:text-yellow-400" /></Button>
                          )}
                        </TableCell></TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financialReports">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>التقارير المالية</CardTitle><CardDescription>عرض وإنشاء التقارير المالية الأساسية.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {["الميزانية العمومية", "قائمة الدخل", "قائمة التدفقات النقدية", "ميزان المراجعة"].map((reportName) => (
                <Card key={reportName} className="flex flex-col items-center justify-center p-6 hover:shadow-xl transition-shadow duration-300 shadow-md rounded-lg">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-lg mb-2 text-center">{reportName}</CardTitle>
                  <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-shadow" onClick={() => handleViewFinancialReport(reportName)}><Download className="me-2 h-4 w-4" /> عرض/تحميل</Button>
                </Card>))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showViewJournalEntryDialog} onOpenChange={setShowViewJournalEntryDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل القيد: {selectedJournalEntry?.id}</DialogTitle></DialogHeader>
          {selectedJournalEntry && (<div className="py-4 space-y-3">
              <div><strong>التاريخ:</strong> {new Date(selectedJournalEntry.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</div>
              <div><strong>الوصف العام:</strong> {selectedJournalEntry.description}</div>
              <div><strong>المبلغ الإجمالي:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(selectedJournalEntry.totalAmount || 0).amount + ' ' + formatCurrency(selectedJournalEntry.totalAmount || 0).symbol }}></span></div>
              <div className="flex items-center gap-2"><strong>الحالة:</strong> <Badge variant={selectedJournalEntry.status === "مرحل" ? "default" : "outline"}>{selectedJournalEntry.status}</Badge></div>
              <div><strong>المصدر:</strong> <Badge variant="outline" className="text-xs">{translateSourceModule(selectedJournalEntry.sourceModule)} {selectedJournalEntry.sourceDocumentId ? `(${selectedJournalEntry.sourceDocumentId})` : ''}</Badge></div>

              <h4 className="font-semibold mt-3">تفاصيل الحركات:</h4>
              {selectedJournalEntry.lines && selectedJournalEntry.lines.length > 0 ? (<Table>
                  <TableHeader><TableRow><TableHead>الحساب</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الوصف</TableHead></TableRow></TableHeader>
                  <TableBody>{selectedJournalEntry.lines.map((line, idx) => (<TableRow key={idx}>
                        <TableCell>{chartOfAccounts.find(acc => acc.id === line.accountId)?.name || line.accountId}</TableCell>
                        <TableCell><span dangerouslySetInnerHTML={{ __html: line.debit > 0 ? formatCurrency(line.debit).amount + ' ' + formatCurrency(line.debit).symbol : '-' }}></span></TableCell>
                        <TableCell><span dangerouslySetInnerHTML={{ __html: line.credit > 0 ? formatCurrency(line.credit).amount + ' ' + formatCurrency(line.credit).symbol : '-' }}></span></TableCell>
                        <TableCell>{line.description || '-'}</TableCell></TableRow>))}
                  </TableBody></Table>) : <p className="text-muted-foreground">لا توجد تفاصيل حركات لهذا القيد.</p>}</div>)}
          <DialogFooter><DialogClose asChild><Button type="button">إغلاق</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showFinancialReportDialog} onOpenChange={setShowFinancialReportDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>تقرير: {selectedFinancialReport}</DialogTitle></DialogHeader>
          <div className="py-4"><p>سيتم عرض تفاصيل تقرير "{selectedFinancialReport}" هنا.</p><p className="mt-4 text-muted-foreground">هذا مجرد مثال. يمكن عرض جداول، رسوم بيانية، أو بيانات مفصلة هنا.</p></div>
          <DialogFooter><Button variant="outline" onClick={() => alert(`Downloading ${selectedFinancialReport}`)}>تحميل PDF</Button><DialogClose asChild><Button type="button">إغلاق</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showAccountStatementDialog} onOpenChange={setShowAccountStatementDialog}>
        <DialogContent className="sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>كشف حساب: {selectedAccountForStatement?.name}</DialogTitle>
            <DialogDescription>عرض جميع الحركات المالية التي تمت على هذا الحساب.</DialogDescription>
          </DialogHeader>
          {isLoadingStatement ? (<p>جارِ تحميل كشف الحساب...</p>) :
          accountStatementData.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الوصف</TableHead><TableHead>مدين</TableHead><TableHead>دائن</TableHead><TableHead>الرصيد</TableHead></TableRow></TableHeader>
                <TableBody>
                  {accountStatementData.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.debit).amount + ' ' + formatCurrency(entry.debit).symbol }}></TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.credit).amount + ' ' + formatCurrency(entry.credit).symbol }}></TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(entry.balance).amount + ' ' + formatCurrency(entry.balance).symbol }}></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (<p className="text-muted-foreground text-center py-10">لا توجد حركات لعرضها على هذا الحساب.</p>)}
           <DialogFooter><DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
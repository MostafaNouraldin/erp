
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Download, Search, BookUser, FilePlus, BookOpen, BarChart3, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from '@/components/ui/scroll-area';


// Mock data - replace with actual data fetching
const chartOfAccountsData = [
  { id: "1000", name: "الأصول", type: "رئيسي", parentId: null, balance: "1,500,000 SAR" },
  { id: "1010", name: "النقدية وما في حكمها", type: "فرعي", parentId: "1000", balance: "250,000 SAR" },
  { id: "1011", name: "صندوق الفرع الرئيسي", type: "تفصيلي", parentId: "1010", balance: "100,000 SAR" },
  { id: "1012", name: "حساب البنك الأهلي", type: "تفصيلي", parentId: "1010", balance: "150,000 SAR" },
  { id: "1020", name: "العملاء", type: "فرعي", parentId: "1000", balance: "300,000 SAR"},
  { id: "2000", name: "الخصوم", type: "رئيسي", parentId: null, balance: "800,000 SAR" },
  { id: "2010", name: "الموردون", type: "فرعي", parentId: "2000", balance: "400,000 SAR"},
  { id: "3000", name: "حقوق الملكية", type: "رئيسي", parentId: null, balance: "700,000 SAR" },
  { id: "4000", name: "الإيرادات", type: "رئيسي", parentId: null, balance: "1,200,000 SAR"},
  { id: "4010", name: "إيرادات المبيعات", type: "فرعي", parentId: "4000", balance: "1,200,000 SAR"},
  { id: "5000", name: "المصروفات", type: "رئيسي", parentId: null, balance: "600,000 SAR"},
  { id: "5010", name: "مصروفات الرواتب", type: "فرعي", parentId: "5000", balance: "300,000 SAR"},
];

const journalEntriesData = [
  { id: "JV001", date: new Date("2024-07-01"), description: "قيد إثبات رأس المال", totalAmount: "500,000 SAR", status: "مرحل", lines: [{accountId: '1011', debit: 500000, credit: 0, description: 'ايداع رأس المال بالصندوق'}, {accountId: '3000', debit: 0, credit: 500000, description: 'اثبات رأس المال'}] },
  { id: "JV002", date: new Date("2024-07-05"), description: "شراء أثاث مكتبي", totalAmount: "15,000 SAR", status: "مرحل", lines: [] },
  { id: "JV003", date: new Date("2024-07-10"), description: "مصروفات كهرباء", totalAmount: "1,200 SAR", status: "مسودة", lines: [] },
];

const accountSchema = z.object({
  id: z.string().min(1, "رقم الحساب مطلوب"),
  name: z.string().min(1, "اسم الحساب مطلوب"),
  type: z.enum(["رئيسي", "فرعي", "تفصيلي"], { required_error: "نوع الحساب مطلوب" }),
  parentId: z.string().nullable(),
  balance: z.string().optional(), // Balance might not be set initially
});
type AccountFormValues = z.infer<typeof accountSchema>;

const journalEntryLineSchema = z.object({
  accountId: z.string().min(1, "الحساب مطلوب"),
  debit: z.coerce.number().min(0, "المبلغ المدين يجب أن يكون إيجابيًا").default(0),
  credit: z.coerce.number().min(0, "المبلغ الدائن يجب أن يكون إيجابيًا").default(0),
  description: z.string().optional(),
});

const journalEntrySchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  description: z.string().min(1, "الوصف مطلوب"),
  lines: z.array(journalEntryLineSchema).min(2, "يجب أن يحتوي القيد على حركتين على الأقل (مدين ودائن)."),
  status: z.enum(["مسودة", "مرحل"]).default("مسودة"),
}).refine(data => {
    const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return totalDebit === totalCredit;
}, {
    message: "إجمالي المدين يجب أن يساوي إجمالي الدائن.",
    path: ["lines"], // You can point this to a specific field or a general form error
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;


export default function GeneralLedgerPage() {
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountFormValues | null>(null);
  
  const [showAddJournalEntryDialog, setShowAddJournalEntryDialog] = useState(false);
  const [journalEntryToEdit, setJournalEntryToEdit] = useState<JournalEntryFormValues | null>(null);
  
  const [showViewJournalEntryDialog, setShowViewJournalEntryDialog] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<typeof journalEntriesData[0] | null>(null);
  
  const [showFinancialReportDialog, setShowFinancialReportDialog] = useState(false);
  const [selectedFinancialReport, setSelectedFinancialReport] = useState<string | null>(null);

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { id: '', name: '', type: undefined, parentId: null, balance: '0 SAR' },
  });

  const journalEntryForm = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date(),
      description: "",
      lines: [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }],
      status: "مسودة",
    },
  });
  const { fields: journalLinesFields, append: appendJournalLine, remove: removeJournalLine } = useFieldArray({
    control: journalEntryForm.control,
    name: "lines",
  });


  useEffect(() => {
    if (accountToEdit) {
      accountForm.reset(accountToEdit);
    } else {
      accountForm.reset({ id: '', name: '', type: undefined, parentId: null, balance: '0 SAR' });
    }
  }, [accountToEdit, accountForm, showAddAccountDialog]);

  useEffect(() => {
    if (journalEntryToEdit) {
      journalEntryForm.reset(journalEntryToEdit);
    } else {
      journalEntryForm.reset({
        date: new Date(),
        description: "",
        lines: [{ accountId: "", debit: 0, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }],
        status: "مسودة",
      });
    }
  }, [journalEntryToEdit, journalEntryForm, showAddJournalEntryDialog]);


  const handleAccountSubmit = (values: AccountFormValues) => {
    if (accountToEdit) {
      console.log("Updating account:", values);
      // Mock update: find and replace in chartOfAccountsData
    } else {
      console.log("Adding new account:", values);
      // Mock add: push to chartOfAccountsData
    }
    setShowAddAccountDialog(false);
    setAccountToEdit(null);
  };

  const handleJournalEntrySubmit = (values: JournalEntryFormValues) => {
    if (journalEntryToEdit) {
      console.log("Updating journal entry:", values);
    } else {
      console.log("Adding new journal entry:", values);
    }
    setShowAddJournalEntryDialog(false);
    setJournalEntryToEdit(null);
  };

  const handleViewJournalEntry = (entry: typeof journalEntriesData[0]) => {
    setSelectedJournalEntry(entry);
    setShowViewJournalEntryDialog(true);
  };
  
  const handleViewFinancialReport = (reportName: string) => {
    setSelectedFinancialReport(reportName);
    setShowFinancialReportDialog(true);
  }

  const totalDebit = journalEntryForm.watch('lines').reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = journalEntryForm.watch('lines').reduce((sum, line) => sum + (line.credit || 0), 0);


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات العامة</h1>
        <Dialog open={showAddJournalEntryDialog} onOpenChange={(isOpen) => { setShowAddJournalEntryDialog(isOpen); if (!isOpen) setJournalEntryToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setJournalEntryToEdit(null); journalEntryForm.reset(); setShowAddJournalEntryDialog(true);}}>
              <FilePlus className="ml-2 h-4 w-4" /> إنشاء قيد يومية جديد
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
                    <FormField
                    control={journalEntryForm.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>التاريخ</FormLabel>
                        <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} />
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={journalEntryForm.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>الوصف العام للقيد</FormLabel>
                        <FormControl>
                            <Textarea placeholder="وصف القيد" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <ScrollArea className="h-[300px] border rounded-md p-2">
                    {journalLinesFields.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start mb-3 p-2 border-b">
                        <FormField
                        control={journalEntryForm.control}
                        name={`lines.${index}.accountId`}
                        render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-4">
                            <FormLabel className="text-xs">الحساب</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                <FormControl>
                                <SelectTrigger className="bg-background h-9 text-xs">
                                    <SelectValue placeholder="اختر الحساب" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {chartOfAccountsData.filter(acc => acc.type === "تفصيلي").map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={journalEntryForm.control}
                        name={`lines.${index}.debit`}
                        render={({ field }) => (
                            <FormItem className="col-span-6 sm:col-span-2">
                            <FormLabel className="text-xs">مدين</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-background h-9 text-xs" placeholder="0.00" />
                            </FormControl>
                            <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={journalEntryForm.control}
                        name={`lines.${index}.credit`}
                        render={({ field }) => (
                            <FormItem className="col-span-6 sm:col-span-2">
                            <FormLabel className="text-xs">دائن</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-background h-9 text-xs" placeholder="0.00" />
                            </FormControl>
                             <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={journalEntryForm.control}
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                            <FormItem className="col-span-10 sm:col-span-3">
                            <FormLabel className="text-xs">وصف السطر</FormLabel>
                            <FormControl>
                                <Input {...field} className="bg-background h-9 text-xs" placeholder="وصف تفصيلي (اختياري)"/>
                            </FormControl>
                            <FormMessage className="text-xs"/>
                            </FormItem>
                        )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeJournalLine(index)} className="col-span-2 sm:col-span-1 self-end h-9 w-9 text-destructive hover:bg-destructive/10">
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                    ))}
                </ScrollArea>
                <Button type="button" variant="outline" onClick={() => appendJournalLine({ accountId: "", debit: 0, credit: 0, description: "" })} className="text-xs py-1 px-2 h-auto">
                  <PlusCircle className="ml-1 h-3 w-3" /> إضافة سطر جديد
                </Button>

                <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t">
                    <div className="font-semibold">إجمالي المدين: {totalDebit.toFixed(2)} SAR</div>
                    <div className="font-semibold">إجمالي الدائن: {totalCredit.toFixed(2)} SAR</div>
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

      <Tabs defaultValue="chartOfAccounts" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="chartOfAccounts" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BookUser className="inline-block ml-2 h-4 w-4" /> شجرة الحسابات
          </TabsTrigger>
          <TabsTrigger value="journalEntries" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BookOpen className="inline-block ml-2 h-4 w-4" /> القيود اليومية
          </TabsTrigger>
          <TabsTrigger value="financialReports" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BarChart3 className="inline-block ml-2 h-4 w-4" /> التقارير المالية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chartOfAccounts">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>شجرة الحسابات</CardTitle>
              <CardDescription>إدارة وتتبع هيكل الحسابات المالية للشركة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الحسابات..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <Dialog open={showAddAccountDialog} onOpenChange={(isOpen) => { setShowAddAccountDialog(isOpen); if (!isOpen) setAccountToEdit(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => { setAccountToEdit(null); accountForm.reset(); setShowAddAccountDialog(true); }}>
                      <PlusCircle className="ml-2 h-4 w-4" /> إضافة حساب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>{accountToEdit ? 'تعديل حساب' : 'إضافة حساب جديد'}</DialogTitle>
                      <DialogDescription>أدخل تفاصيل الحساب.</DialogDescription>
                    </DialogHeader>
                    <Form {...accountForm}>
                        <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={accountForm.control}
                                name="id"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>رقم الحساب</FormLabel>
                                    <FormControl><Input placeholder="مثال: 1012" {...field} className="bg-background" /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={accountForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>اسم الحساب</FormLabel>
                                    <FormControl><Input placeholder="اسم الحساب" {...field} className="bg-background"/></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={accountForm.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>النوع</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                        <FormControl>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="اختر النوع" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        <SelectItem value="رئيسي">رئيسي</SelectItem>
                                        <SelectItem value="فرعي">فرعي</SelectItem>
                                        <SelectItem value="تفصيلي">تفصيلي</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={accountForm.control}
                                name="parentId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>الحساب الرئيسي</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || ""} dir="rtl">
                                        <FormControl>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="اختر الحساب الرئيسي (إن وجد)" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value=""><em>لا يوجد</em></SelectItem>
                                            {chartOfAccountsData.filter(acc => acc.type !== 'تفصيلي').map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">{accountToEdit ? 'حفظ التعديلات' : 'حفظ الحساب'}</Button>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            </DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الحساب</TableHead>
                      <TableHead className="text-right">اسم الحساب</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الحساب الرئيسي</TableHead>
                      <TableHead className="text-right">الرصيد الحالي</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartOfAccountsData.map((account) => (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell>{account.id}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant={account.type === "رئيسي" ? "default" : account.type === "فرعي" ? "secondary" : "outline"}>
                            {account.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{chartOfAccountsData.find(a => a.id === account.parentId)?.name || "-"}</TableCell>
                        <TableCell>{account.balance}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setAccountToEdit(account); setShowAddAccountDialog(true); }}>
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
                                <AlertDialogDescription>
                                  لا يمكن التراجع عن هذا الإجراء. سيتم حذف الحساب "{account.name}" نهائياً.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => console.log(`Deleting account ${account.id}`)}>
                                  تأكيد الحذف
                                </AlertDialogAction>
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
        </TabsContent>

        <TabsContent value="journalEntries">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>القيود اليومية</CardTitle>
              <CardDescription>تسجيل ومراجعة جميع المعاملات المالية.</CardDescription>
            </CardHeader>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم القيد</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntriesData.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell>{entry.id}</TableCell>
                        <TableCell>{entry.date.toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.totalAmount}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === "مرحل" ? "default" : "outline"}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => handleViewJournalEntry(entry)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setJournalEntryToEdit(entry); setShowAddJournalEntryDialog(true);}}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {entry.status === "مسودة" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    سيتم حذف القيد "{entry.id}" نهائياً.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => console.log(`Deleting entry ${entry.id}`)}>
                                    تأكيد الحذف
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
        </TabsContent>

        <TabsContent value="financialReports">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>التقارير المالية</CardTitle>
              <CardDescription>عرض وإنشاء التقارير المالية الأساسية.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                "الميزانية العمومية",
                "قائمة الدخل",
                "قائمة التدفقات النقدية",
                "ميزان المراجعة",
              ].map((reportName) => (
                <Card key={reportName} className="flex flex-col items-center justify-center p-6 hover:shadow-xl transition-shadow duration-300 shadow-md rounded-lg">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-lg mb-2 text-center">{reportName}</CardTitle>
                  <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-shadow" onClick={() => handleViewFinancialReport(reportName)}>
                    <Download className="ml-2 h-4 w-4" /> عرض/تحميل
                  </Button>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Viewing Journal Entry */}
      <Dialog open={showViewJournalEntryDialog} onOpenChange={setShowViewJournalEntryDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد: {selectedJournalEntry?.id}</DialogTitle>
          </DialogHeader>
          {selectedJournalEntry && (
            <div className="py-4 space-y-3">
              <p><strong>التاريخ:</strong> {selectedJournalEntry.date.toLocaleDateString('ar-SA')}</p>
              <p><strong>الوصف العام:</strong> {selectedJournalEntry.description}</p>
              <p><strong>المبلغ الإجمالي:</strong> {selectedJournalEntry.totalAmount}</p>
              <p><strong>الحالة:</strong> <Badge variant={selectedJournalEntry.status === "مرحل" ? "default" : "outline"}>{selectedJournalEntry.status}</Badge></p>
              <h4 className="font-semibold mt-3">تفاصيل الحركات:</h4>
              {selectedJournalEntry.lines && selectedJournalEntry.lines.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الحساب</TableHead>
                      <TableHead className="text-right">مدين</TableHead>
                      <TableHead className="text-right">دائن</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedJournalEntry.lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{chartOfAccountsData.find(acc => acc.id === line.accountId)?.name || line.accountId}</TableCell>
                        <TableCell>{line.debit > 0 ? line.debit.toFixed(2) : '-'}</TableCell>
                        <TableCell>{line.credit > 0 ? line.credit.toFixed(2) : '-'}</TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground">لا توجد تفاصيل حركات لهذا القيد.</p>}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Financial Report */}
      <Dialog open={showFinancialReportDialog} onOpenChange={setShowFinancialReportDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تقرير: {selectedFinancialReport}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>سيتم عرض تفاصيل تقرير "{selectedFinancialReport}" هنا.</p>
            <p className="mt-4 text-muted-foreground">هذا مجرد مثال. يمكن عرض جداول، رسوم بيانية، أو بيانات مفصلة هنا.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => alert(`Downloading ${selectedFinancialReport}`)}>تحميل PDF</Button>
            <DialogClose asChild>
              <Button type="button">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


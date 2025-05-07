
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Download, Search, BookUser, FilePlus, BookOpen, BarChart3 } from "lucide-react";
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


// Mock data - replace with actual data fetching
const chartOfAccountsData = [
  { id: "1000", name: "الأصول", type: "رئيسي", parent: null, balance: "1,500,000 SAR" },
  { id: "1010", name: "النقدية وما في حكمها", type: "فرعي", parent: "1000", balance: "250,000 SAR" },
  { id: "1011", name: "صندوق الفرع الرئيسي", type: "تفصيلي", parent: "1010", balance: "100,000 SAR" },
  { id: "2000", name: "الخصوم", type: "رئيسي", parent: null, balance: "800,000 SAR" },
  { id: "3000", name: "حقوق الملكية", type: "رئيسي", parent: null, balance: "700,000 SAR" },
];

const journalEntriesData = [
  { id: "JV001", date: "2024-07-01", description: "قيد إثبات رأس المال", amount: "500,000 SAR", status: "مرحل" },
  { id: "JV002", date: "2024-07-05", description: "شراء أثاث مكتبي", amount: "15,000 SAR", status: "مرحل" },
  { id: "JV003", date: "2024-07-10", description: "مصروفات كهرباء", amount: "1,200 SAR", status: "مسودة" },
];

export default function GeneralLedgerPage() {
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [showAddJournalEntryDialog, setShowAddJournalEntryDialog] = useState(false);
  const [showViewJournalEntryDialog, setShowViewJournalEntryDialog] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<typeof journalEntriesData[0] | null>(null);
  const [showFinancialReportDialog, setShowFinancialReportDialog] = useState(false);
  const [selectedFinancialReport, setSelectedFinancialReport] = useState<string | null>(null);


  const handleViewJournalEntry = (entry: typeof journalEntriesData[0]) => {
    setSelectedJournalEntry(entry);
    setShowViewJournalEntryDialog(true);
  };
  
  const handleViewFinancialReport = (reportName: string) => {
    setSelectedFinancialReport(reportName);
    setShowFinancialReportDialog(true);
  }

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات العامة</h1>
        <Dialog open={showAddJournalEntryDialog} onOpenChange={setShowAddJournalEntryDialog}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              <FilePlus className="me-2 h-4 w-4" /> إنشاء قيد يومية جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إنشاء قيد يومية جديد</DialogTitle>
              <DialogDescription>أدخل تفاصيل القيد اليومي.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryDate" className="text-right col-span-1">التاريخ</Label>
                <DatePickerWithPresets mode="single" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryDesc" className="text-right col-span-1">الوصف</Label>
                <Textarea id="entryDesc" placeholder="وصف القيد" className="col-span-3 bg-background" />
              </div>
              {/* Add more fields for debit/credit accounts, amounts etc. */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entryAmount" className="text-right col-span-1">المبلغ</Label>
                <Input id="entryAmount" type="number" placeholder="0.00" className="col-span-3 bg-background" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setShowAddJournalEntryDialog(false)}>حفظ القيد</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">إلغاء</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="chartOfAccounts" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="chartOfAccounts" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BookUser className="inline-block me-2 h-4 w-4" /> شجرة الحسابات
          </TabsTrigger>
          <TabsTrigger value="journalEntries" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BookOpen className="inline-block me-2 h-4 w-4" /> القيود اليومية
          </TabsTrigger>
          <TabsTrigger value="financialReports" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BarChart3 className="inline-block me-2 h-4 w-4" /> التقارير المالية
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الحسابات..." className="pl-10 w-full sm:w-64 bg-background" />
                </div>
                <Dialog open={showAddAccountDialog} onOpenChange={setShowAddAccountDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <PlusCircle className="me-2 h-4 w-4" /> إضافة حساب جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة حساب جديد</DialogTitle>
                      <DialogDescription>أدخل تفاصيل الحساب الجديد.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accId" className="text-right col-span-1">رقم الحساب</Label>
                        <Input id="accId" placeholder="مثال: 1012" className="col-span-3 bg-background" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accName" className="text-right col-span-1">اسم الحساب</Label>
                        <Input id="accName" placeholder="اسم الحساب" className="col-span-3 bg-background" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accType" className="text-right col-span-1">النوع</Label>
                        <Select dir="rtl">
                          <SelectTrigger className="col-span-3 bg-background">
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">رئيسي</SelectItem>
                            <SelectItem value="sub">فرعي</SelectItem>
                            <SelectItem value="detail">تفصيلي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="accParent" className="text-right col-span-1">الحساب الرئيسي</Label>
                        <Select dir="rtl">
                          <SelectTrigger className="col-span-3 bg-background">
                            <SelectValue placeholder="اختر الحساب الرئيسي (إن وجد)" />
                          </SelectTrigger>
                          <SelectContent>
                            {chartOfAccountsData.filter(acc => acc.type !== 'تفصيلي').map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={() => setShowAddAccountDialog(false)}>حفظ الحساب</Button>
                       <DialogClose asChild>
                        <Button type="button" variant="outline">إلغاء</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الحساب</TableHead>
                      <TableHead>اسم الحساب</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحساب الرئيسي</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
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
                        <TableCell>{chartOfAccountsData.find(a => a.id === account.parent)?.name || "-"}</TableCell>
                        <TableCell>{account.balance}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في القيود..." className="pl-10 w-full sm:w-64 bg-background" />
                </div>
                <DatePickerWithPresets mode="range" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم القيد</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalEntriesData.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell>{entry.id}</TableCell>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.amount}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === "مرحل" ? "default" : "outline"}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض" onClick={() => handleViewJournalEntry(entry)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
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
                    <Download className="me-2 h-4 w-4" /> عرض/تحميل
                  </Button>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Viewing Journal Entry */}
      <Dialog open={showViewJournalEntryDialog} onOpenChange={setShowViewJournalEntryDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد: {selectedJournalEntry?.id}</DialogTitle>
          </DialogHeader>
          {selectedJournalEntry && (
            <div className="py-4 space-y-2">
              <p><strong>التاريخ:</strong> {selectedJournalEntry.date}</p>
              <p><strong>الوصف:</strong> {selectedJournalEntry.description}</p>
              <p><strong>المبلغ:</strong> {selectedJournalEntry.amount}</p>
              <p><strong>الحالة:</strong> <Badge variant={selectedJournalEntry.status === "مرحل" ? "default" : "outline"}>{selectedJournalEntry.status}</Badge></p>
              {/* Add more details as needed */}
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

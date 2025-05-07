
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Search, Filter, Users, Briefcase, TrendingUp, TrendingDown, FileWarning, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// Mock data
const customerInvoices = [
  { id: "INV-C001", customer: "شركة الأمل", date: "2024-07-01", dueDate: "2024-07-31", amount: "15,000 SAR", paid: "10,000 SAR", remaining: "5,000 SAR", status: "جزئي" },
  { id: "INV-C002", customer: "مؤسسة النجاح", date: "2024-06-15", dueDate: "2024-07-15", amount: "8,200 SAR", paid: "8,200 SAR", remaining: "0 SAR", status: "مدفوع" },
  { id: "INV-C003", customer: "شركة التطور", date: "2024-07-10", dueDate: "2024-08-10", amount: "22,500 SAR", paid: "0 SAR", remaining: "22,500 SAR", status: "غير مدفوع" },
  { id: "INV-C004", customer: "مؤسسة الإبداع", date: "2024-05-20", dueDate: "2024-06-20", amount: "12,000 SAR", paid: "0 SAR", remaining: "12,000 SAR", status: "متأخر" },
];

const supplierInvoices = [
  { id: "INV-S001", supplier: "مورد التقنية الحديثة", date: "2024-07-05", dueDate: "2024-08-05", amount: "30,000 SAR", paid: "15,000 SAR", remaining: "15,000 SAR", status: "جزئي" },
  { id: "INV-S002", supplier: "مورد الخدمات اللوجستية", date: "2024-06-20", dueDate: "2024-07-20", amount: "7,500 SAR", paid: "7,500 SAR", remaining: "0 SAR", status: "مدفوع" },
  { id: "INV-S003", supplier: "مورد المواد الخام", date: "2024-07-12", dueDate: "2024-08-12", amount: "18,000 SAR", paid: "0 SAR", remaining: "18,000 SAR", status: "غير مدفوع" },
];

const agingReportData = {
  receivables: [
    { range: "0-30 يوم", amount: "25,000 SAR", percent: 40 },
    { range: "31-60 يوم", amount: "15,000 SAR", percent: 25 },
    { range: "61-90 يوم", amount: "10,000 SAR", percent: 15 },
    { range: ">90 يوم", amount: "12,500 SAR", percent: 20 },
  ],
  payables: [
    { range: "0-30 يوم", amount: "20,000 SAR", percent: 50 },
    { range: "31-60 يوم", amount: "12,000 SAR", percent: 30 },
    { range: "61-90 يوم", amount: "5,000 SAR", percent: 12.5 },
    { range: ">90 يوم", amount: "3,000 SAR", percent: 7.5 },
  ],
};

const mockCustomers = [
    {id: "CUST001", name: "شركة الأمل"},
    {id: "CUST002", name: "مؤسسة النجاح"},
    {id: "CUST003", name: "شركة التطور"},
    {id: "CUST004", name: "مؤسسة الإبداع"},
];

const mockSuppliers = [
    {id: "SUP001", name: "مورد التقنية الحديثة"},
    {id: "SUP002", name: "مورد الخدمات اللوجستية"},
    {id: "SUP003", name: "مورد المواد الخام"},
];


export default function AccountsPayableReceivablePage() {
  const [showAddCustomerInvoiceDialog, setShowAddCustomerInvoiceDialog] = useState(false);
  const [showAddSupplierInvoiceDialog, setShowAddSupplierInvoiceDialog] = useState(false);
  const [showViewInvoiceDialog, setShowViewInvoiceDialog] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null); // Can be customer or supplier invoice
  
  const handleViewInvoice = (invoice: any, type: 'customer' | 'supplier') => {
    setSelectedInvoiceForView({...invoice, type});
    setShowViewInvoiceDialog(true);
  }


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الحسابات المدينة والدائنة</h1>
        <div className="flex gap-2">
          <Dialog open={showAddCustomerInvoiceDialog} onOpenChange={setShowAddCustomerInvoiceDialog}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="me-2 h-4 w-4" /> إضافة فاتورة عميل
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة فاتورة عميل جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-1">
                  <Label htmlFor="customerName">اسم العميل</Label>
                  <Select dir="rtl">
                    <SelectTrigger id="customerName" className="bg-background">
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customerInvoiceDate">تاريخ الفاتورة</Label>
                  <DatePickerWithPresets mode="single" />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="customerInvoiceDueDate">تاريخ الاستحقاق</Label>
                  <DatePickerWithPresets mode="single" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customerInvoiceAmount">المبلغ الإجمالي</Label>
                  <Input id="customerInvoiceAmount" type="number" placeholder="0.00 SAR" className="bg-background"/>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="customerInvoiceNotes">ملاحظات</Label>
                  <Textarea id="customerInvoiceNotes" placeholder="أضف ملاحظات (اختياري)" className="bg-background"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => setShowAddCustomerInvoiceDialog(false)}>حفظ الفاتورة</Button>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddSupplierInvoiceDialog} onOpenChange={setShowAddSupplierInvoiceDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="me-2 h-4 w-4" /> إضافة فاتورة مورد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة فاتورة مورد جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="space-y-1">
                  <Label htmlFor="supplierName">اسم المورد</Label>
                  <Select dir="rtl">
                    <SelectTrigger id="supplierName" className="bg-background">
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSuppliers.map(sup => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="supplierInvoiceDate">تاريخ الفاتورة</Label>
                  <DatePickerWithPresets mode="single" />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="supplierInvoiceDueDate">تاريخ الاستحقاق</Label>
                  <DatePickerWithPresets mode="single" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="supplierInvoiceAmount">المبلغ الإجمالي</Label>
                  <Input id="supplierInvoiceAmount" type="number" placeholder="0.00 SAR" className="bg-background"/>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="supplierInvoiceNotes">ملاحظات</Label>
                  <Textarea id="supplierInvoiceNotes" placeholder="أضف ملاحظات (اختياري)" className="bg-background"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={() => setShowAddSupplierInvoiceDialog(false)}>حفظ الفاتورة</Button>
                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="receivables" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="receivables" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> الذمم المدينة (العملاء)
          </TabsTrigger>
          <TabsTrigger value="payables" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Briefcase className="inline-block me-2 h-4 w-4" /> الذمم الدائنة (الموردين)
          </TabsTrigger>
          <TabsTrigger value="agingReport" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileWarning className="inline-block me-2 h-4 w-4" /> أعمار الذمم
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير العملاء</CardTitle>
              <CardDescription>متابعة فواتير العملاء، الذمم المستحقة، وحدود الائتمان.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في فواتير العملاء..." className="pl-10 w-full sm:w-64 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>جزئي</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>غير مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>متأخر</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>المبلغ المدفوع</TableHead>
                      <TableHead>المبلغ المتبقي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.customer}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>{invoice.amount}</TableCell>
                        <TableCell>{invoice.paid}</TableCell>
                        <TableCell className="font-semibold">{invoice.remaining}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "مدفوع" ? "default" :
                              invoice.status === "جزئي" ? "secondary" :
                              invoice.status === "متأخر" ? "destructive" : "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'customer')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال كشف حساب" onClick={() => alert(`إرسال كشف حساب للعميل: ${invoice.customer}`)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير الموردين</CardTitle>
              <CardDescription>متابعة فواتير الموردين والذمم المستحقة لهم.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في فواتير الموردين..." className="pl-10 w-full sm:w-64 bg-background" />
                </div>
                 <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>جزئي</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>غير مدفوع</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>المبلغ المدفوع</TableHead>
                      <TableHead>المبلغ المتبقي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.supplier}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>{invoice.amount}</TableCell>
                        <TableCell>{invoice.paid}</TableCell>
                        <TableCell className="font-semibold">{invoice.remaining}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === "مدفوع" ? "default" :
                              invoice.status === "جزئي" ? "secondary" : "outline"
                            }
                             className="whitespace-nowrap"
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewInvoice(invoice, 'supplier')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agingReport">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="me-2 h-6 w-6 text-primary" /> أعمار الذمم المدينة (العملاء)
                </CardTitle>
                <CardDescription>تحليل لأعمار المبالغ المستحقة من العملاء.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agingReportData.receivables.map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                      <span className="font-semibold">{item.amount} ({item.percent}%)</span>
                    </div>
                    <Progress value={item.percent} aria-label={`${item.percent}% للعملاء في نطاق ${item.range}`} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="me-2 h-6 w-6 text-destructive" /> أعمار الذمم الدائنة (الموردين)
                </CardTitle>
                <CardDescription>تحليل لأعمار المبالغ المستحقة للموردين.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agingReportData.payables.map((item) => (
                  <div key={item.range}>
                    <div className="flex justify-between mb-1">
                      <span>{item.range}</span>
                      <span className="font-semibold">{item.amount} ({item.percent}%)</span>
                    </div>
                    <Progress value={item.percent} aria-label={`${item.percent}% للموردين في نطاق ${item.range}`} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog for Viewing Invoice */}
       <Dialog open={showViewInvoiceDialog} onOpenChange={setShowViewInvoiceDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              تفاصيل الفاتورة: {selectedInvoiceForView?.id} ({selectedInvoiceForView?.type === 'customer' ? 'عميل' : 'مورد'})
            </DialogTitle>
          </DialogHeader>
          {selectedInvoiceForView && (
            <div className="py-4 space-y-2">
              <p><strong>{selectedInvoiceForView.type === 'customer' ? 'العميل' : 'المورد'}:</strong> {selectedInvoiceForView.type === 'customer' ? selectedInvoiceForView.customer : selectedInvoiceForView.supplier}</p>
              <p><strong>تاريخ الفاتورة:</strong> {selectedInvoiceForView.date}</p>
              <p><strong>تاريخ الاستحقاق:</strong> {selectedInvoiceForView.dueDate}</p>
              <p><strong>المبلغ الإجمالي:</strong> {selectedInvoiceForView.amount}</p>
              <p><strong>المبلغ المدفوع:</strong> {selectedInvoiceForView.paid}</p>
              <p><strong>المبلغ المتبقي:</strong> {selectedInvoiceForView.remaining}</p>
              <p><strong>الحالة:</strong> <Badge variant={selectedInvoiceForView.status === "مدفوع" ? "default" : selectedInvoiceForView.status === "جزئي" ? "secondary" : selectedInvoiceForView.status === "متأخر" ? "destructive" : "outline"}>{selectedInvoiceForView.status}</Badge></p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

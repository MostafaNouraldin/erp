
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Printer, Search, Filter, FileDown, Banknote, Building, FileText, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Mock data - replace with actual data fetching
const receiptVoucherData = [
  { id: "RC001", date: "2024-07-15", type: "سند قبض", method: "نقدي", party: "عميل أ", amount: "5,000 SAR", status: "مرحل", branch: "الرئيسي" },
  { id: "PV001", date: "2024-07-16", type: "سند صرف", method: "بنكي", party: "مورد س", amount: "12,000 SAR", status: "مرحل", branch: "الرياض" },
  { id: "RC002", date: "2024-07-18", type: "سند قبض", method: "بنكي", party: "عميل ب", amount: "2,500 SAR", status: "مسودة", branch: "جدة" },
  { id: "PV002", date: "2024-07-20", type: "سند صرف", method: "نقدي", party: "مصروفات عامة", amount: "300 SAR", status: "مرحل", branch: "الرئيسي" },
];

const treasuryMovementData = [
    { date: "2024-07-20", type: "إيداع", description: "إيداع نقدي من مبيعات", amount: "1,500 SAR", balance: "101,500 SAR" },
    { date: "2024-07-20", type: "سحب", description: "سند صرف #PV002", amount: "300 SAR", balance: "101,200 SAR" },
    { date: "2024-07-19", type: "إيداع", description: "تحصيل من عميل أ", amount: "2,000 SAR", balance: "101,500 SAR" },
];


export default function ReceiptsVouchersPage() {
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<typeof receiptVoucherData[0] | null>(null);

  const handlePrintVoucher = (voucher: typeof receiptVoucherData[0]) => {
    setSelectedVoucherForPrint(voucher);
    setShowPrintDialog(true);
  }

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">سندات القبض والصرف</h1>
        <div className="flex gap-2">
            <Dialog open={showCreateReceiptDialog} onOpenChange={setShowCreateReceiptDialog}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء سند قبض
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء سند قبض جديد</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Form fields for new receipt voucher */}
                  <div className="space-y-1">
                    <Label htmlFor="receiptDate">التاريخ</Label>
                    <DatePickerWithPresets mode="single" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptParty">الجهة (العميل)</Label>
                    <Input id="receiptParty" placeholder="اسم العميل" className="bg-background"/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptAmount">المبلغ</Label>
                    <Input id="receiptAmount" type="number" placeholder="0.00" className="bg-background"/>
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="receiptMethod">طريقة القبض</Label>
                    <Select dir="rtl" defaultValue="cash">
                        <SelectTrigger id="receiptMethod" className="bg-background">
                            <SelectValue placeholder="اختر طريقة القبض" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank">بنكي</SelectItem>
                            <SelectItem value="cheque">شيك</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="receiptNotes">ملاحظات</Label>
                    <Textarea id="receiptNotes" placeholder="ملاحظات إضافية" className="bg-background"/>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => setShowCreateReceiptDialog(false)}>حفظ السند</Button>
                  <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
              <DialogTrigger asChild>
                 <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء سند صرف
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء سند صرف جديد</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Form fields for new payment voucher */}
                   <div className="space-y-1">
                    <Label htmlFor="paymentDate">التاريخ</Label>
                    <DatePickerWithPresets mode="single" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentParty">الجهة (المورد/المصروف)</Label>
                    <Input id="paymentParty" placeholder="اسم المورد أو نوع المصروف" className="bg-background"/>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentAmount">المبلغ</Label>
                    <Input id="paymentAmount" type="number" placeholder="0.00" className="bg-background"/>
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="paymentMethod">طريقة الصرف</Label>
                    <Select dir="rtl" defaultValue="cash">
                        <SelectTrigger id="paymentMethod" className="bg-background">
                            <SelectValue placeholder="اختر طريقة الصرف" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank">بنكي</SelectItem>
                            <SelectItem value="cheque">شيك</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentNotes">ملاحظات</Label>
                    <Textarea id="paymentNotes" placeholder="ملاحظات إضافية" className="bg-background"/>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => setShowCreatePaymentDialog(false)}>حفظ السند</Button>
                  <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <Tabs defaultValue="allVouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="allVouchers" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="inline-block me-2 h-4 w-4" /> جميع السندات
          </TabsTrigger>
          <TabsTrigger value="treasuryMovement" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Wallet className="inline-block me-2 h-4 w-4" /> حركة الخزينة اليومية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="allVouchers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة السندات</CardTitle>
              <CardDescription>إدارة جميع سندات القبض والصرف النقدية والبنكية. الربط مع الحسابات والعملاء/الموردين.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في السندات..." className="pl-10 w-full sm:w-64 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب نوع السند</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>سند قبض</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>سند صرف</DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuLabel>تصفية حسب طريقة الدفع</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>نقدي</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>بنكي</DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مرحل</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets />
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    <FileDown className="me-2 h-4 w-4" /> تصدير
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الجهة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptVoucherData.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{voucher.id}</TableCell>
                        <TableCell>{voucher.date}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.type === "سند قبض" ? "default" : "secondary"} className="whitespace-nowrap bg-opacity-80">
                            {voucher.type === "سند قبض" ? <Banknote className="inline me-1 h-3 w-3"/> : <Building className="inline me-1 h-3 w-3"/>}
                            {voucher.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{voucher.method}</TableCell>
                        <TableCell>{voucher.party}</TableCell>
                        <TableCell className="whitespace-nowrap">{voucher.amount}</TableCell>
                        <TableCell>{voucher.branch}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.status === "مرحل" ? "default" : "outline"} className="whitespace-nowrap">
                            {voucher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintVoucher(voucher)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {voucher.status === "مسودة" && (
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
                                      سيتم حذف السند "{voucher.id}" نهائياً.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => console.log(`Deleting voucher ${voucher.id}`)}>
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

        <TabsContent value="treasuryMovement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>حركة الخزينة اليومية</CardTitle>
              <CardDescription>مراجعة يومية لحركة الخزينة والإيداعات والسحوبات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <DatePickerWithPresets />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع الحركة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treasuryMovementData.map((movement, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>
                            <Badge variant={movement.type === "إيداع" ? "default" : "destructive"} className="bg-opacity-70">
                                {movement.type}
                            </Badge>
                        </TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.amount}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.balance}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

       {/* Dialog for Printing Voucher */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>طباعة السند: {selectedVoucherForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedVoucherForPrint && (
            <div className="py-4 space-y-3 border rounded-md p-4 my-4">
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="text-xl font-semibold">شركة المستقبل ERP</h3>
                <p className="text-sm">{selectedVoucherForPrint.type}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p><strong>رقم السند:</strong> {selectedVoucherForPrint.id}</p>
                <p><strong>التاريخ:</strong> {selectedVoucherForPrint.date}</p>
                <p><strong>الجهة:</strong> {selectedVoucherForPrint.party}</p>
                <p><strong>المبلغ:</strong> {selectedVoucherForPrint.amount}</p>
                <p><strong>طريقة {selectedVoucherForPrint.type === "سند قبض" ? "القبض" : "الصرف"}:</strong> {selectedVoucherForPrint.method}</p>
                <p><strong>الفرع:</strong> {selectedVoucherForPrint.branch}</p>
                <p className="col-span-2"><strong>المبلغ كتابة:</strong> فقط {selectedVoucherForPrint.amount.split(' ')[0].replace(/,/g, '')} ريال سعودي لا غير.</p> {/* Basic conversion */}
                <p className="col-span-2"><strong>البيان:</strong> {selectedVoucherForPrint.type} لـ {selectedVoucherForPrint.party} بمبلغ {selectedVoucherForPrint.amount}</p>
              </div>
               <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t">
                <div className="text-center">
                    <p className="mb-6">.........................</p>
                    <p className="text-sm font-semibold">توقيع المحاسب</p>
                </div>
                 <div className="text-center">
                    <p className="mb-6">.........................</p>
                    <p className="text-sm font-semibold">توقيع المستلم</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { alert(`Printing voucher ${selectedVoucherForPrint?.id}`); setShowPrintDialog(false); }} >
              <Printer className="me-2 h-4 w-4" /> طباعة
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

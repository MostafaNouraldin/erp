
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { ShoppingCart, FileSignature, FilePlus, UsersIcon, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Send, Printer } from "lucide-react";
import AppLogo from '@/components/app-logo';

// Mock data
const quotations = [
  { id: "QT001", customer: "شركة الأمل", date: new Date("2024-07-01"), expiryDate: new Date("2024-07-15"), totalAmount: 15500, status: "مرسل" as const },
  { id: "QT002", customer: "مؤسسة النجاح", date: new Date("2024-07-05"), expiryDate: new Date("2024-07-20"), totalAmount: 8200, status: "مقبول" as const },
  { id: "QT003", customer: "شركة التطور", date: new Date("2024-07-10"), expiryDate: new Date("2024-07-25"), totalAmount: 22000, status: "مسودة" as const },
];

const salesOrders = [
  { id: "SO001", quoteId: "QT002", customer: "مؤسسة النجاح", date: new Date("2024-07-06"), deliveryDate: new Date("2024-07-20"), totalAmount: 8200, status: "قيد التنفيذ" as const },
  { id: "SO002", customer: "مؤسسة الإبداع", date: new Date("2024-07-12"), deliveryDate: new Date("2024-07-28"), totalAmount: 12000, status: "مؤكد" as const },
];

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // Price excluding VAT
  total: number;    // quantity * unitPrice
}
interface Invoice {
  id: string;
  orderId?: string;
  customerId: string;
  date: Date;
  dueDate: Date;
  numericTotalAmount: number; // Grand total (including VAT)
  status: "مدفوع" | "غير مدفوع" | "متأخر";
  items: InvoiceItem[];
}

const initialInvoicesData: Invoice[] = [
  {
    id: "INV-C001",
    orderId: "SO001",
    customerId: "CUST002",
    date: new Date("2024-07-20"),
    dueDate: new Date("2024-08-20"),
    numericTotalAmount: 8200, // This is the total including VAT
    status: "مدفوع",
    items: [
      { description: "خدمة استشارية لتطوير الأعمال", quantity: 1, unitPrice: 7130.43, total: 7130.43 }, // 8200 / 1.15
    ],
  },
  {
    id: "INV-C002",
    customerId: "CUST001",
    date: new Date("2024-07-15"),
    dueDate: new Date("2024-08-15"),
    numericTotalAmount: 15500,
    status: "غير مدفوع",
    items: [
      { description: "تطوير واجهة مستخدم لتطبيق موبايل", quantity: 1, unitPrice: 10000, total: 10000 },
      { description: "تصميم شعار وهوية بصرية", quantity: 1, unitPrice: 3478.26, total: 3478.26 }, // Subtotal for this item (15500/1.15 - 10000)
    ],
  },
];


const customers = [
  { id: "CUST001", name: "شركة الأمل", email: "contact@alamal.com", phone: "0501234567", type: "شركة", balance: "15,500 SAR", address: "طريق الملك فهد، الرياض، المملكة العربية السعودية", vatNumber: "300123456700003" },
  { id: "CUST002", name: "مؤسسة النجاح", email: "info@najjsuccess.org", phone: "0559876543", type: "مؤسسة", balance: "0 SAR", address: "شارع الأمير سلطان، جدة، المملكة العربية السعودية", vatNumber: "300765432100003" },
  { id: "CUST003", name: "أحمد خالد (فرد)", email: "ahmed.k@mail.com", phone: "0533332222", type: "فرد", balance: "0 SAR", address: "حي النزهة، الدمام، المملكة العربية السعودية", vatNumber: null },
];

interface PrintableInvoice extends Invoice {
    customerName: string;
    customerAddress?: string;
    customerVatNumber?: string | null;
    subTotalForPrint: number;
    vatAmountForPrint: number;
}

// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
  // This is a placeholder. A full implementation is complex.
  return `فقط ${amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 })} لا غير`;
};


export default function SalesPage() {
  const [invoices, setInvoicesData] = useState<Invoice[]>(initialInvoicesData);
  const [showPrintInvoiceDialog, setShowPrintInvoiceDialog] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<PrintableInvoice | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePrintInvoice = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const subTotal = invoice.numericTotalAmount / 1.15; // Assuming 15% VAT
    const vatAmount = invoice.numericTotalAmount - subTotal;

    setSelectedInvoiceForPrint({
        ...invoice,
        customerName: customer?.name || 'عميل غير محدد',
        customerAddress: customer?.address,
        customerVatNumber: customer?.vatNumber,
        subTotalForPrint: subTotal,
        vatAmountForPrint: vatAmount,
    });
    setShowPrintInvoiceDialog(true);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!isClient || !date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ar-SA', { day: '2-digit', month: '2-digit', year: 'numeric', calendar: 'gregory' }).format(d);
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المبيعات</h1>
        <div className="flex gap-2">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="me-2 h-4 w-4" /> إنشاء عرض سعر جديد
            </Button>
             <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="me-2 h-4 w-4" /> إنشاء فاتورة مبيعات
            </Button>
        </div>
      </div>

      <Tabs defaultValue="quotations" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="quotations" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileSignature className="inline-block me-2 h-4 w-4" /> عروض الأسعار
          </TabsTrigger>
          <TabsTrigger value="salesOrders" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShoppingCart className="inline-block me-2 h-4 w-4" /> أوامر البيع
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> فواتير المبيعات
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <UsersIcon className="inline-block me-2 h-4 w-4" /> العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة عروض الأسعار</CardTitle>
              <CardDescription>إنشاء، إرسال، وتتبع حالة عروض الأسعار المقدمة للعملاء.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في عروض الأسعار..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرسل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مقبول</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرفوض</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>منتهي الصلاحية</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العرض</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ العرض</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((qt) => (
                      <TableRow key={qt.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{qt.id}</TableCell>
                        <TableCell>{qt.customer}</TableCell>
                        <TableCell>{formatDate(qt.date)}</TableCell>
                        <TableCell>{formatDate(qt.expiryDate)}</TableCell>
                        <TableCell>{qt.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              qt.status === "مقبول" ? "default" :
                              qt.status === "مرسل" ? "secondary" :
                              "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {qt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {qt.status === "مسودة" && (
                            <>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                                <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال للعميل">
                                <Send className="h-4 w-4 text-primary" />
                               </Button>
                            </>
                          )}
                           {qt.status === "مرسل" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحويل إلى أمر بيع">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
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

        <TabsContent value="salesOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>أوامر البيع</CardTitle>
              <CardDescription>إدارة أوامر البيع المؤكدة، وتتبع حالة تنفيذها وتسليمها.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر بيع مباشر
                    </Button>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في أوامر البيع..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>عرض السعر (إن وجد)</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الأمر</TableHead>
                      <TableHead>تاريخ التسليم</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((so) => (
                      <TableRow key={so.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{so.id}</TableCell>
                        <TableCell>{so.quoteId || "-"}</TableCell>
                        <TableCell>{so.customer}</TableCell>
                        <TableCell>{formatDate(so.date)}</TableCell>
                        <TableCell>{formatDate(so.deliveryDate)}</TableCell>
                        <TableCell>{so.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                            <Badge variant={so.status === "مؤكد" ? "default" : "secondary"} className="whitespace-nowrap">{so.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الأمر">
                                <FileText className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إنشاء فاتورة">
                                <FilePlus className="h-4 w-4 text-primary" />
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
        
        <TabsContent value="invoices">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير المبيعات</CardTitle>
              <CardDescription>إصدار ومتابعة فواتير المبيعات، وحالة الدفع من العملاء.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في الفواتير..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                    <DatePickerWithPresets mode="range" />
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>أمر البيع (إن وجد)</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell>{inv.orderId || "-"}</TableCell>
                        <TableCell>{customers.find(c => c.id === inv.customerId)?.name || inv.customerId}</TableCell>
                        <TableCell>{formatDate(inv.date)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>{inv.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                        <TableCell>
                            <Badge variant={inv.status === "مدفوع" ? "default" : "destructive"} className="whitespace-nowrap">{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الفاتورة" onClick={() => handlePrintInvoice(inv)}>
                                <Printer className="h-4 w-4" />
                            </Button>
                             {inv.status === "غير مدفوع" && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
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

        <TabsContent value="customers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة العملاء</CardTitle>
              <CardDescription>سجل بيانات العملاء، تاريخ معاملاتهم، وأرصدتهم.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة عميل جديد
                    </Button>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث باسم العميل أو الرقم..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العميل</TableHead>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((cust) => (
                      <TableRow key={cust.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{cust.id}</TableCell>
                        <TableCell>{cust.name}</TableCell>
                        <TableCell>{cust.email}</TableCell>
                        <TableCell>{cust.phone}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="whitespace-nowrap">{cust.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{cust.balance}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض ملف العميل">
                                <FileText className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل بيانات العميل">
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
      </Tabs>

      {/* Print Invoice Dialog */}
      <Dialog open={showPrintInvoiceDialog} onOpenChange={setShowPrintInvoiceDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة فاتورة مبيعات: {selectedInvoiceForPrint?.id}</DialogTitle>
            <DialogDescriptionComponent>معاينة الفاتورة قبل الطباعة.</DialogDescriptionComponent>
          </DialogHeader>
          {selectedInvoiceForPrint && isClient && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="sales invoice layout">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b">
                <div className="flex items-center gap-2">
                  <AppLogo />
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض - المملكة العربية السعودية</p>
                    <p className="text-xs">الرقم الضريبي: 300012345600003</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-semibold text-primary">فاتورة مبيعات</h3>
                  <p className="text-xs">Sales Invoice</p>
                  <p className="text-sm mt-1"><strong>رقم الفاتورة:</strong> {selectedInvoiceForPrint.id}</p>
                  <p className="text-sm"><strong>تاريخ الفاتورة:</strong> {formatDate(selectedInvoiceForPrint.date)}</p>
                  <p className="text-sm"><strong>تاريخ الاستحقاق:</strong> {formatDate(selectedInvoiceForPrint.dueDate)}</p>
                  {selectedInvoiceForPrint.orderId && <p className="text-sm"><strong>أمر البيع:</strong> {selectedInvoiceForPrint.orderId}</p>}
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-6 text-xs">
                <h4 className="font-semibold mb-1 text-sm">فاتورة إلى:</h4>
                <p><strong>{selectedInvoiceForPrint.customerName}</strong></p>
                {selectedInvoiceForPrint.customerAddress && <p>{selectedInvoiceForPrint.customerAddress}</p>}
                {selectedInvoiceForPrint.customerVatNumber && <p>الرقم الضريبي للعميل: {selectedInvoiceForPrint.customerVatNumber}</p>}
              </div>

              {/* Items Table */}
              <Table size="sm" className="mb-6">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">سعر الوحدة</TableHead>
                    <TableHead className="text-left">الإجمالي (قبل الضريبة)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoiceForPrint.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">{item.unitPrice.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-left">{item.total.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals Section */}
              <div className="flex justify-end mb-6">
                <div className="w-full max-w-xs space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي (قبل الضريبة):</span>
                    <span>{selectedInvoiceForPrint.subTotalForPrint.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span>{selectedInvoiceForPrint.vatAmountForPrint.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1 mt-1 text-primary">
                    <span>المبلغ الإجمالي المستحق:</span>
                    <span>{selectedInvoiceForPrint.numericTotalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="mb-6 text-xs p-2 border rounded-md bg-muted/30">
                <p data-ai-hint="amount to words"><strong>المبلغ كتابة:</strong> {convertAmountToWords(selectedInvoiceForPrint.numericTotalAmount)}</p>
              </div>
              
              {/* Terms and Conditions / Notes */}
              <div className="text-xs text-muted-foreground mb-6">
                  <h5 className="font-semibold text-foreground mb-1">الشروط والأحكام:</h5>
                  <p>- يجب دفع الفاتورة خلال 30 يوماً من تاريخ الاستحقاق.</p>
                  <p>- جميع الأسعار بالريال السعودي شاملة ضريبة القيمة المضافة.</p>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t text-xs">
                <div className="text-center">
                    <p className="mb-10">.........................</p>
                    <p className="font-semibold">ختم وتوقيع الشركة</p>
                </div>
                <div className="text-center">
                    <p className="mb-10">.........................</p>
                    <p className="font-semibold">استلمت بواسطة (العميل)</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()} disabled={!selectedInvoiceForPrint || !isClient}>
              <Printer className="me-2 h-4 w-4" /> طباعة
            </Button>
            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


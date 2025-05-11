
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter, Printer, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { SubscriptionInvoice } from '@/types/saas';

// Mock data
const initialSubscriptionInvoicesData: SubscriptionInvoice[] = [
  { id: "INV-SUB-001", tenantId: "TEN001", issueDate: new Date(2024, 0, 15), dueDate: new Date(2024, 1, 15), totalAmount: 1000, status: "paid", items: [{ moduleId: "Accounting", moduleName: "الحسابات", price: 1000, period: "2024" }], paymentMethod: "تحويل بنكي", transactionId: "TRN123" },
  { id: "INV-SUB-002", tenantId: "TEN003", issueDate: new Date(2024, 4, 1), dueDate: new Date(2024, 5, 1), totalAmount: 2800, status: "unpaid", items: [{ moduleId: "Sales", moduleName: "المبيعات", price: 900, period: "2024" }, {moduleId: "HR", moduleName: "الموارد البشرية", price: 1200, period: "2024"}, {moduleId: "POS", moduleName: "نقاط البيع", price: 500, period: "2024"}], },
  { id: "INV-SUB-003", tenantId: "TEN001", issueDate: new Date(2025, 0, 15), dueDate: new Date(2025, 1, 15), totalAmount: 1000, status: "unpaid", items: [{ moduleId: "Accounting", moduleName: "الحسابات", price: 1000, period: "2025" }], },
];

const mockTenantNames: Record<string, string> = {
    "TEN001": "شركة الأوائل للتجارة",
    "TEN003": "مجموعة الريادة",
};


export default function SubscriptionInvoicesPage() {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(initialSubscriptionInvoicesData);

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <FileText className="me-2 h-8 w-8 text-primary" />
            فواتير الاشتراكات
          </CardTitle>
          <CardDescription>
            إدارة وعرض فواتير الاشتراكات الصادرة للشركات (العملاء المستأجرين).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>قائمة فواتير الاشتراكات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برقم الفاتورة أو اسم الشركة..." className="pr-10 w-full sm:w-72 bg-background" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب حالة الفاتورة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>مدفوعة</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>غير مدفوعة</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>متأخرة</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets mode="range" />
                   <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                     <Download className="me-2 h-4 w-4" /> تصدير
                   </Button>
                </div>
              </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>اسم الشركة</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{mockTenantNames[invoice.tenantId] || invoice.tenantId}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{invoice.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={
                                invoice.status === "paid" ? "default" :
                                invoice.status === "unpaid" ? "outline" :
                                "destructive" // for overdue or cancelled
                            }
                        >
                          {invoice.status === "paid" ? "مدفوعة" : invoice.status === "unpaid" ? "غير مدفوعة" : invoice.status === "overdue" ? "متأخرة" : "ملغاة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة الفاتورة">
                          <Printer className="h-4 w-4" />
                        </Button>
                        {invoice.status === "unpaid" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة">
                                <BadgeCent className="h-4 w-4 text-green-600" />
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
      </div>
    </div>
  );
}

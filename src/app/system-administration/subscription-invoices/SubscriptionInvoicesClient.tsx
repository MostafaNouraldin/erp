
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { useToast } from "@/hooks/use-toast";

// In a real app this would come from props/database
type SubscriptionInvoice = {
    id: string;
    tenantId: string;
    tenantName: string;
    issueDate: Date;
    dueDate: Date;
    totalAmount: number;
    status: 'paid' | 'unpaid' | 'overdue';
    paidDate?: Date;
};

interface ClientProps {
  initialData: {
    tenants: Array<{ id: string, name: string }>;
  }
}

export default function SubscriptionInvoicesPage({ initialData }: ClientProps) {
    const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
    const { toast } = useToast();

    const handleMarkAsPaid = (invoiceId: string) => {
        setInvoices(prev => prev.map(inv => 
            inv.id === invoiceId ? { ...inv, status: "paid", paidDate: new Date() } : inv
        ));
        toast({
            title: "تم تحديث الفاتورة",
            description: `تم تمييز الفاتورة رقم ${invoiceId} كمدفوعة.`,
        });
    };

    return (
        <div className="container mx-auto py-6" dir="rtl">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl md:text-3xl">
                        <FileText className="me-2 h-8 w-8 text-primary" />
                        فواتير الاشتراكات
                    </CardTitle>
                    <CardDescription>
                        عرض وإدارة فواتير اشتراكات العملاء وحالات السداد الخاصة بهم.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card className="shadow-md mt-6">
                <CardHeader>
                    <CardTitle>قائمة الفواتير</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                        <Input placeholder="بحث باسم الشركة أو رقم الفاتورة..." className="max-w-sm bg-background" />
                         <div className="flex gap-2 flex-wrap">
                            <DatePickerWithPresets mode="range" />
                            {/* Filter component can be added here */}
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
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{inv.id}</TableCell>
                                        <TableCell>{inv.tenantName}</TableCell>
                                        <TableCell>{new Date(inv.issueDate).toLocaleDateString('ar-SA')}</TableCell>
                                        <TableCell>{new Date(inv.dueDate).toLocaleDateString('ar-SA')}</TableCell>
                                        <TableCell>{inv.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                                        <TableCell>
                                            <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                                                {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'overdue' ? 'متأخرة' : 'غير مدفوعة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            {inv.status !== 'paid' && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100" title="تمييز كمدفوعة" onClick={() => handleMarkAsPaid(inv.id)}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                             <Button variant="ghost" size="icon" className="h-8 w-8" title="عرض الفاتورة">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {invoices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                            لا توجد فواتير لعرضها.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

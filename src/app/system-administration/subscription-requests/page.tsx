
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, CheckCircle, XCircle, Search, Filter, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { addTenant } from '../tenants/actions'; // Assuming this action can be used

// Mock data, in a real app this would come from a database
const mockRequests = [
    { id: 1, companyName: "شركة الأمل للتجارة", email: "contact@alamal.com", phone: "0501234567", totalAmount: 5500, billingCycle: "yearly", status: "pending", createdAt: new Date("2024-07-29T10:00:00Z"), selectedModules: ["Accounting", "Inventory", "Sales"], paymentProof: "https://picsum.photos/seed/proof1/400/300" },
    { id: 2, companyName: "مؤسسة البناء الحديث", email: "info@modern-build.com", phone: "0559876543", totalAmount: 800, billingCycle: "monthly", status: "pending", createdAt: new Date("2024-07-28T15:30:00Z"), selectedModules: ["Accounting", "HR", "Projects"], paymentProof: "https://picsum.photos/seed/proof2/400/300" },
    { id: 3, companyName: "مصنع الشرقية للكيماويات", email: "ceo@echem.com", phone: "0533344455", totalAmount: 12500, billingCycle: "yearly", status: "approved", createdAt: new Date("2024-07-27T09:00:00Z"), selectedModules: ["Accounting", "Inventory", "Sales", "Purchases", "Production"], paymentProof: "https://picsum.photos/seed/proof3/400/300" },
];

type SubscriptionRequest = typeof mockRequests[0];

export default function SubscriptionRequestsPage() {
    const [requests, setRequests] = useState<SubscriptionRequest[]>(mockRequests);
    const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const { toast } = useToast();

    const handleApprove = async (request: SubscriptionRequest) => {
        try {
            // Here you would call the server action to create the tenant
            // For now, we simulate success and update the UI
            // await addTenant({ name: request.companyName, email: request.email, phone: request.phone, subscribedModules: request.selectedModules.map(m => ({ moduleId: m, subscribed: true })), billingCycle: request.billingCycle });

            setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: "approved" } : r));
            toast({
                title: "تمت الموافقة على الطلب",
                description: `تم إنشاء حساب لشركة "${request.companyName}" بنجاح.`,
            });
        } catch (error) {
            toast({
                title: "خطأ",
                description: "لم يتمكن النظام من إنشاء حساب الشركة.",
                variant: "destructive",
            });
        }
    };

    const handleReject = (requestId: number) => {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "rejected" } : r));
        toast({
            title: "تم رفض الطلب",
            description: `تم رفض طلب الاشتراك رقم ${requestId}.`,
            variant: "destructive"
        });
    };

    const handleViewRequest = (request: SubscriptionRequest) => {
        setSelectedRequest(request);
        setShowViewDialog(true);
    };

    return (
        <div className="container mx-auto py-6" dir="rtl">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl md:text-3xl">
                        <Mail className="me-2 h-8 w-8 text-primary" />
                        طلبات الاشتراك الجديدة
                    </CardTitle>
                    <CardDescription>
                        مراجعة واعتماد طلبات الاشتراك المقدمة من الشركات الجديدة.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card className="shadow-md mt-6">
                <CardHeader>
                    <CardTitle>قائمة الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                        <Input placeholder="بحث باسم الشركة أو البريد الإلكتروني..." className="max-w-sm bg-background" />
                        {/* Filter component can be added here */}
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الشركة</TableHead>
                                    <TableHead>البريد الإلكتروني</TableHead>
                                    <TableHead>تاريخ الطلب</TableHead>
                                    <TableHead>المبلغ</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">{req.companyName}</TableCell>
                                        <TableCell>{req.email}</TableCell>
                                        <TableCell>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                                        <TableCell>{req.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                                        <TableCell>
                                            <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {req.status === 'pending' ? 'معلق' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="عرض التفاصيل" onClick={() => handleViewRequest(req)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {req.status === 'pending' && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100" title="موافقة" onClick={() => handleApprove(req)}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="رفض" onClick={() => handleReject(req.id)}>
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

             <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="sm:max-w-lg" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تفاصيل طلب الاشتراك: {selectedRequest?.companyName}</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="py-4 space-y-4">
                            <p><strong>البريد الإلكتروني:</strong> {selectedRequest.email}</p>
                            <p><strong>الهاتف:</strong> {selectedRequest.phone}</p>
                            <p><strong>الوحدات المطلوبة:</strong> {selectedRequest.selectedModules.join(', ')}</p>
                            <p><strong>دورة الفوترة:</strong> {selectedRequest.billingCycle === 'yearly' ? 'سنوي' : 'شهري'}</p>
                            <p><strong>المبلغ الإجمالي:</strong> {selectedRequest.totalAmount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
                             <div>
                                <Label className='font-semibold'>إثبات الدفع:</Label>
                                <div className="mt-2 border rounded-md p-2 flex justify-center">
                                     <Image src={selectedRequest.paymentProof} alt="إثبات الدفع" width={400} height={300} className="rounded-md object-contain" />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}


"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Search, Filter, CheckCircle, XCircle, Eye, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { approveSubscriptionRequest, rejectSubscriptionRequest, getSubscriptionRequestDetails } from './actions';
import { useCurrency } from '@/hooks/use-currency';

interface SubscriptionRequest {
  id: number;
  companyName: string;
  email: string;
  phone: string | null;
  selectedModules: string[];
  billingCycle: 'monthly' | 'yearly';
  totalAmount: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  paymentProof?: string | null;
}

interface ClientProps {
  initialData: {
    requests: SubscriptionRequest[];
  }
}

export default function SubscriptionRequestsClient({ initialData }: ClientProps) {
  const [requests, setRequests] = useState<SubscriptionRequest[]>(initialData.requests);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    setRequests(initialData.requests);
  }, [initialData]);
  
  const handleViewDetails = async (request: SubscriptionRequest) => {
    setSelectedRequest(request); // Show basic data immediately
    setIsDetailsDialogOpen(true);
    setIsLoadingDetails(true);
    try {
        const fullRequestDetails = await getSubscriptionRequestDetails(request.id);
        setSelectedRequest(fullRequestDetails as SubscriptionRequest); // Update with full data including proof
    } catch (e: any) {
        toast({ title: "خطأ", description: "لم يتم العثور على تفاصيل الطلب.", variant: "destructive" });
        setIsDetailsDialogOpen(false); // Close dialog on error
    } finally {
        setIsLoadingDetails(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setIsApproving(true);
    try {
      const result = await approveSubscriptionRequest(requestId);
      if (result.success) {
        toast({
          title: "تمت الموافقة بنجاح!",
          description: result.message,
        });
        // Optimistically update UI
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req));
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (requestId: number) => {
    setIsRejecting(true);
    try {
        await rejectSubscriptionRequest(requestId);
        toast({ title: "تم الرفض", description: `تم رفض طلب الاشتراك رقم ${requestId}.`, variant: "destructive" });
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req));
    } catch (e: any) {
         toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
        setIsRejecting(false);
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Mail className="me-2 h-8 w-8 text-primary" />
            طلبات الاشتراك
          </CardTitle>
          <CardDescription>
            مراجعة طلبات الاشتراك الجديدة والموافقة عليها أو رفضها.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>قائمة الطلبات الواردة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <Input placeholder="بحث باسم الشركة أو البريد الإلكتروني..." className="max-w-sm bg-background" />
            <div className="flex gap-2 flex-wrap">
              <DatePickerWithPresets mode="range" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الشركة</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>دورة الفوترة</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{req.companyName}</TableCell>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{req.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</TableCell>
                    <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(parseFloat(req.totalAmount)) }}></TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {req.status === 'approved' ? 'موافق عليه' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                       <Button variant="ghost" size="icon" className="h-8 w-8" title="عرض التفاصيل" onClick={() => handleViewDetails(req)}>
                         <Eye className="h-4 w-4" />
                       </Button>
                      {req.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-100" title="موافقة">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader><AlertDialogTitle>تأكيد الموافقة</AlertDialogTitle><AlertDialogDescriptionComponent>هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم إنشاء شركة جديدة وإرسال بريد تفعيل للعميل.</AlertDialogDescriptionComponent></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleApprove(req.id)} disabled={isApproving}>
                                        {isApproving && <RefreshCw className="me-2 h-4 w-4 animate-spin" />}
                                        تأكيد الموافقة
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="رفض">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent dir="rtl">
                                <AlertDialogHeader><AlertDialogTitle>تأكيد الرفض</AlertDialogTitle><AlertDialogDescriptionComponent>هل أنت متأكد من رفض طلب الاشتراك هذا؟</AlertDialogDescriptionComponent></AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleReject(req.id)} disabled={isRejecting} className="bg-destructive hover:bg-destructive/90">
                                         {isRejecting && <RefreshCw className="me-2 h-4 w-4 animate-spin" />}
                                        تأكيد الرفض
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الاشتراك: {selectedRequest?.companyName}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4 space-y-3 text-sm">
                <div><strong>اسم الشركة:</strong> {selectedRequest.companyName}</div>
                <div><strong>البريد الإلكتروني:</strong> {selectedRequest.email}</div>
                <div><strong>الهاتف:</strong> {selectedRequest.phone || "-"}</div>
                <div><strong>الوحدات المطلوبة:</strong> {Array.isArray(selectedRequest.selectedModules) ? selectedRequest.selectedModules.join(', ') : ''}</div>
                <div><strong>دورة الفوترة:</strong> {selectedRequest.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}</div>
                <div className="font-semibold"><strong>المبلغ الإجمالي:</strong> <span dangerouslySetInnerHTML={{ __html: formatCurrency(parseFloat(selectedRequest.totalAmount)) }}></span></div>
                <div><strong>طريقة الدفع:</strong> {selectedRequest.paymentMethod}</div>
                <div>
                    <p className="font-semibold">إثبات الدفع:</p>
                    {isLoadingDetails ? (
                       <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
                           <Loader2 className="h-8 w-8 animate-spin text-primary"/>
                       </div>
                    ) : selectedRequest.paymentProof ? (
                        <a href={selectedRequest.paymentProof} target="_blank" rel="noopener noreferrer">
                            <img src={selectedRequest.paymentProof} alt="إثبات الدفع" className="mt-1 border rounded-md max-h-60 object-contain"/>
                        </a>
                    ) : (
                        <p className="text-muted-foreground">لم يتم العثور على إثبات الدفع.</p>
                    )}
                </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">إغلاق</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

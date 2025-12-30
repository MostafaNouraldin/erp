
"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Label } from "@/components/ui/label";
import { Truck, PlusCircle, Search, Edit, Trash2, FileText, Filter, Warehouse, CheckCircle, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const mockInventoryItems = [
  { id: "ITEM001", name: "لابتوب Dell XPS 15", available: 50 },
  { id: "ITEM002", name: "طابعة HP LaserJet Pro", available: 5 },
  { id: "ITEM003", name: "ورق طباعة A4 (صندوق)", available: 200 },
];

const mockWarehouses = [
  { id: "WH001", name: "المستودع الرئيسي - الرياض" },
  { id: "WH002", name: "مستودع فرع جدة" },
  { id: "WH003", name: "مستودع الدمام" },
];

const mockInitialTransfers = [
  { id: "TRN001", date: new Date("2024-07-20"), fromWarehouseId: "WH001", toWarehouseId: "WH002", productId: "ITEM001", quantity: 10, status: "مكتملة" as const },
  { id: "TRN002", date: new Date("2024-07-22"), fromWarehouseId: "WH001", toWarehouseId: "WH003", productId: "ITEM003", quantity: 50, status: "قيد النقل" as const },
  { id: "TRN003", date: new Date("2024-07-25"), fromWarehouseId: "WH002", toWarehouseId: "WH001", productId: "ITEM002", quantity: 2, status: "مسودة" as const },
];

const transferSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ التحويل مطلوب" }),
  fromWarehouseId: z.string().min(1, "المستودع المصدر مطلوب"),
  toWarehouseId: z.string().min(1, "المستودع الهدف مطلوب"),
  productId: z.string().min(1, "الصنف مطلوب"),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "قيد النقل", "مكتملة", "ملغى"]).default("مسودة"),
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
    message: "المستودع المصدر والهدف يجب أن يكونا مختلفين.",
    path: ["toWarehouseId"],
});

type TransferFormValues = z.infer<typeof transferSchema>;

export default function InventoryTransfersPage() {
  const [transfers, setTransfers] = useState(mockInitialTransfers);
  const [showCreateTransferCard, setShowCreateTransferCard] = useState(false);
  const { toast } = useToast();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { date: new Date(), quantity: 1, status: "مسودة" },
  });

  const handleTransferSubmit = (values: TransferFormValues) => {
    // In a real app, this would be a server action call.
    setTransfers(prev => [...prev, { ...values, id: `TRN${Date.now()}` }]);
    toast({ title: "تم الإنشاء", description: "تم إنشاء طلب تحويل جديد." });
    form.reset({ date: new Date(), quantity: 1, status: "مسودة" });
    setShowCreateTransferCard(false);
  };
  
  const handleUpdateStatus = (id: string, status: TransferFormValues['status']) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    toast({ title: "تم تحديث الحالة", description: `تم تحديث حالة التحويل إلى ${status}.` });
  };
  
  const handleDeleteTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    toast({ title: "تم الحذف", description: "تم حذف طلب التحويل.", variant: "destructive" });
  };

  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Truck className="me-2 h-8 w-8 text-primary" />
            تحويلات المخزون
          </CardTitle>
          <CardDescription>إدارة عمليات تحويل الأصناف بين المستودعات والفروع المختلفة.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              إنشاء طلب تحويل جديد
            </CardTitle>
             <Button variant="ghost" size="icon" onClick={() => setShowCreateTransferCard(!showCreateTransferCard)}>
              <PlusCircle className={`h-6 w-6 text-primary transition-transform ${showCreateTransferCard ? 'rotate-45' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        {showCreateTransferCard && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleTransferSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>تاريخ التحويل</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="fromWarehouseId" render={({ field }) => (<FormItem><FormLabel>من مستودع</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المستودع المصدر" /></SelectTrigger></FormControl><SelectContent>{mockWarehouses.map(wh => (<SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="toWarehouseId" render={({ field }) => (<FormItem><FormLabel>إلى مستودع</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المستودع الهدف" /></SelectTrigger></FormControl><SelectContent>{mockWarehouses.map(wh => (<SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="productId" render={({ field }) => (<FormItem><FormLabel>الصنف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl><SelectContent>{mockInventoryItems.map(item => (<SelectItem key={item.id} value={item.id}>{item.name} (المتاح: {item.available})</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>الكمية</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أضف ملاحظات (اختياري)" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
              <div className="flex gap-2">
                <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow"><Truck className="me-2 h-4 w-4" /> حفظ طلب التحويل</Button>
                <Button type="button" variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => {form.reset(); setShowCreateTransferCard(false);}}>إلغاء</Button>
              </div>
            </form>
          </Form>
        </CardContent>
        )}
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center"><FileText className="me-2 h-5 w-5 text-primary" /> سجل تحويلات المخزون</CardTitle>
          <CardDescription>قائمة بجميع عمليات تحويل المخزون المسجلة بين المستودعات.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="relative w-full sm:w-auto grow sm:grow-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم التحويل أو الصنف..." className="pr-10 w-full sm:w-64 bg-background" />
            </div>
             <div className="flex gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow"><Filter className="me-2 h-4 w-4" /> تصفية الحالة</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" dir="rtl"><DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuCheckboxItem>مكتملة</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>قيد النقل</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem></DropdownMenuContent>
              </DropdownMenu>
              <DatePickerWithPresets mode="range" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التحويل</TableHead><TableHead>التاريخ</TableHead><TableHead>من المستودع</TableHead>
                  <TableHead>إلى المستودع</TableHead><TableHead>الصنف</TableHead><TableHead>الكمية</TableHead>
                  <TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{transfer.id}</TableCell>
                    <TableCell>{transfer.date.toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{mockWarehouses.find(wh => wh.id === transfer.fromWarehouseId)?.name || transfer.fromWarehouseId}</TableCell>
                    <TableCell>{mockWarehouses.find(wh => wh.id === transfer.toWarehouseId)?.name || transfer.toWarehouseId}</TableCell>
                    <TableCell>{mockInventoryItems.find(i => i.id === transfer.productId)?.name || transfer.productId}</TableCell>
                    <TableCell className="font-semibold">{transfer.quantity}</TableCell>
                    <TableCell><Badge variant={transfer.status === "مكتملة" ? "default" : transfer.status === "قيد النقل" ? "secondary" : transfer.status === "ملغى" ? "destructive" : "outline"} className="whitespace-nowrap">{transfer.status}</Badge></TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      {transfer.status === "مسودة" && (<>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => alert("تعديل " + transfer.id)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف طلب التحويل رقم "{transfer.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTransfer(transfer.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100" title="إرسال للشحن" onClick={() => handleUpdateStatus(transfer.id!, 'قيد النقل')}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
                      </>)}
                      {transfer.status === "قيد النقل" && (<>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تأكيد الاستلام" onClick={() => handleUpdateStatus(transfer.id!, 'مكتملة')}><Warehouse className="h-4 w-4 text-green-600" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-yellow-100" title="إرجاع كمسودة" onClick={() => handleUpdateStatus(transfer.id!, 'مسودة')}><Undo className="h-4 w-4 text-yellow-600" /></Button>
                      </>)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

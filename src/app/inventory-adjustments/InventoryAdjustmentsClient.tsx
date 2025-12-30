
"use client";

import React, { useState, useEffect } from 'react';
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
import { SlidersHorizontal, PlusCircle, Search, Edit, Trash2, FileText, Filter, CheckCircle, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { AdjustmentFormValues, Product } from './actions';
import { addAdjustment, updateAdjustment, deleteAdjustment, approveAdjustment } from './actions';


const adjustmentSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ التسوية مطلوب" }),
  productId: z.string().min(1, "الصنف مطلوب"),
  type: z.enum(["زيادة", "نقص"], { required_error: "نوع التسوية مطلوب" }),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  reason: z.string().min(1, "سبب التسوية مطلوب"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "معتمدة"]).default("مسودة"),
});

const mockAdjustmentReasons = [
  { id: "REASON001", name: "تلف" },
  { id: "REASON002", name: "فقدان" },
  { id: "REASON003", name: "فرق جرد" },
  { id: "REASON004", name: "إهلاك" },
];

interface ClientComponentProps {
    initialData: {
        adjustments: AdjustmentFormValues[];
        products: Product[];
    }
}

export default function InventoryAdjustmentsClient({ initialData }: ClientComponentProps) {
  const [adjustments, setAdjustments] = useState(initialData.adjustments);
  const [products, setProducts] = useState(initialData.products);
  const [showCreateAdjustmentCard, setShowCreateAdjustmentCard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAdjustments(initialData.adjustments);
    setProducts(initialData.products);
  }, [initialData]);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { date: new Date(), type: "نقص", quantity: 1, status: "مسودة" },
  });

  const handleAdjustmentSubmit = async (values: AdjustmentFormValues) => {
    try {
        if (values.id) {
            await updateAdjustment(values);
            toast({ title: "تم التعديل", description: "تم تعديل تسوية الجرد بنجاح." });
        } else {
            await addAdjustment(values);
            toast({ title: "تم الإنشاء", description: "تم إنشاء تسوية جردية جديدة." });
        }
        form.reset({ date: new Date(), type: "نقص", quantity: 1, status: "مسودة" });
        setShowCreateAdjustmentCard(false);
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  const handleApproveAdjustment = async (id: string) => {
    try {
        await approveAdjustment(id);
        toast({ title: "تم الاعتماد", description: `تم اعتماد التسوية ${id} وتحديث المخزون.` });
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };
  
  const handleDeleteAdjustment = async (id: string) => {
    try {
        await deleteAdjustment(id);
        toast({ title: "تم الحذف", description: `تم حذف التسوية ${id}.`, variant: "destructive" });
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <SlidersHorizontal className="me-2 h-8 w-8 text-primary" />
            تسويات جردية
          </CardTitle>
          <CardDescription>تسجيل ومتابعة التسويات الجردية لضمان دقة بيانات المخزون (زيادة أو نقص).</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              إنشاء تسوية جردية جديدة
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowCreateAdjustmentCard(!showCreateAdjustmentCard)}>
              <PlusCircle className={`h-6 w-6 text-primary transition-transform ${showCreateAdjustmentCard ? 'rotate-45' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        {showCreateAdjustmentCard && (
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAdjustmentSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>تاريخ التسوية</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} /><FormMessage /></FormItem> )} />
                   <FormField control={form.control} name="productId" render={({ field }) => (<FormItem><FormLabel>الصنف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الصنف" /></SelectTrigger></FormControl><SelectContent>{products.map(item => (<SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                   <FormField control={form.control} name="type" render={({ field }) => (<FormItem><FormLabel>نوع التسوية</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl><SelectContent><SelectItem value="زيادة">زيادة (+)</SelectItem><SelectItem value="نقص">نقص (-)</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                   <FormField control={form.control} name="quantity" render={({ field }) => (<FormItem><FormLabel>الكمية</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                   <FormField control={form.control} name="reason" render={({ field }) => (<FormItem><FormLabel>سبب التسوية</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر السبب" /></SelectTrigger></FormControl><SelectContent>{mockAdjustmentReasons.map(reason => (<SelectItem key={reason.id} value={reason.name}>{reason.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )} />
                <div className="flex gap-2">
                  <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow"> <PlusCircle className="me-2 h-4 w-4" /> حفظ التسوية </Button>
                  <Button type="button" variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => {form.reset(); setShowCreateAdjustmentCard(false);}}> إلغاء </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="me-2 h-5 w-5 text-primary" />
            سجل التسويات الجردية
          </CardTitle>
           <CardDescription>قائمة بجميع التسويات الجردية المسجلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="relative w-full sm:w-auto grow sm:grow-0">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث برقم التسوية أو الصنف..." className="pr-10 w-full sm:w-64 bg-background" />
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
                  <DropdownMenuCheckboxItem>معتمدة</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DatePickerWithPresets mode="range" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التسوية</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الصنف</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{adj.id}</TableCell>
                    <TableCell>{new Date(adj.date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{products.find(i => i.id === adj.productId)?.name || adj.productId}</TableCell>
                    <TableCell>
                        <Badge variant={adj.type === "زيادة" ? "default" : "destructive"} className="bg-opacity-80">
                            {adj.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{adj.quantity}</TableCell>
                    <TableCell>{adj.reason}</TableCell>
                    <TableCell>
                      <Badge variant={adj.status === "معتمدة" ? "default" : "outline"}>{adj.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      {adj.status === "مسودة" && (
                        <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف التسوية رقم "{adj.id}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAdjustment(adj.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="اعتماد" onClick={() => handleApproveAdjustment(adj.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
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
    </div>
  );
}

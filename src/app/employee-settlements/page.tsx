
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, UserCheck, Printer, CheckCircle, FileText, Filter, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from '@/components/date-picker-with-presets';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

// Mock Data
const mockEmployees = [
  { id: "EMP001", name: "أحمد محمود" },
  { id: "EMP002", name: "فاطمة علي" },
  { id: "EMP003", name: "خالد عبدالله" },
];
const mockSettlementAccounts = [ // Could be specific liability/asset accounts for employee advances/loans
  { id: "1210", name: "سلف الموظفين" }, // Asset
  { id: "2210", name: "قروض الموظفين" }, // Liability if company gives loan
];

const settlementSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "تاريخ التسوية مطلوب" }),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  settlementType: z.enum(["سلفة", "قرض", "تسوية عهدة", "خصم", "مكافأة"], { required_error: "نوع التسوية مطلوب" }),
  accountId: z.string().min(1, "حساب التسوية مطلوب"), // Account affected (e.g., Employee Advances)
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().min(1, "وصف التسوية مطلوب"),
  paymentMethod: z.enum(["نقدي", "راتب", "تحويل بنكي"], { required_error: "طريقة الدفع/الاسترداد مطلوبة" }),
  status: z.enum(["مسودة", "معتمدة", "مسددة جزئياً", "مسددة بالكامل", "ملغاة"]).default("مسودة"),
  reference: z.string().optional(),
});

type SettlementFormValues = z.infer<typeof settlementSchema>;

const initialSettlementsData: SettlementFormValues[] = [
  { id: "ESET001", date: new Date("2024-07-01"), employeeId: "EMP001", settlementType: "سلفة", accountId: "1210", amount: 1000, description: "سلفة شخصية", paymentMethod: "راتب", status: "معتمدة", reference: "ADV-07-001" },
  { id: "ESET002", date: new Date("2024-06-15"), employeeId: "EMP002", settlementType: "تسوية عهدة", accountId: "1210", amount: 500, description: "تسوية عهدة سفر", paymentMethod: "نقدي", status: "مسددة بالكامل", reference: "CUST-06-015" },
  { id: "ESET003", date: new Date("2024-07-20"), employeeId: "EMP003", settlementType: "خصم", accountId: "1210", amount: 200, description: "خصم تأخير", paymentMethod: "راتب", status: "مسودة", reference: "DED-07-020" },
];

export default function EmployeeSettlementsPage() {
  const [settlements, setSettlements] = useState(initialSettlementsData);
  const [showManageSettlementDialog, setShowManageSettlementDialog] = useState(false);
  const [settlementToEdit, setSettlementToEdit] = useState<SettlementFormValues | null>(null);
  const [showViewSettlementDialog, setShowViewSettlementDialog] = useState(false);
  const [selectedSettlementForView, setSelectedSettlementForView] = useState<SettlementFormValues | null>(null);


  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: { date: new Date(), amount: 0, status: "مسودة", paymentMethod: "راتب" },
  });

  useEffect(() => {
    if (settlementToEdit) {
      form.reset(settlementToEdit);
    } else {
      form.reset({ date: new Date(), employeeId: "", settlementType: undefined, accountId: "", amount: 0, description: "", paymentMethod: "راتب", status: "مسودة", reference: "" });
    }
  }, [settlementToEdit, form, showManageSettlementDialog]);

  const handleSettlementSubmit = (values: SettlementFormValues) => {
    if (settlementToEdit) {
      setSettlements(prev => prev.map(set => set.id === settlementToEdit.id ? values : set));
    } else {
      setSettlements(prev => [...prev, { ...values, id: `ESET${Date.now()}` }]);
    }
    setShowManageSettlementDialog(false);
    setSettlementToEdit(null);
  };

  const handleDeleteSettlement = (settlementId: string) => {
    setSettlements(prev => prev.filter(set => set.id !== settlementId));
  };
  
  const handleApproveSettlement = (settlementId: string) => {
    setSettlements(prev => prev.map(set => set.id === settlementId ? { ...set, status: "معتمدة" } : set));
  };

  const handleCancelSettlement = (settlementId: string) => {
     const settlement = settlements.find(s => s.id === settlementId);
     if (settlement && (settlement.status === "مسودة" || settlement.status === "معتمدة")) { // Allow cancelling if مسودة or معتمدة
        setSettlements(prev => prev.map(set => set.id === settlementId ? { ...set, status: "ملغاة" } : set));
     } else {
        alert("لا يمكن إلغاء هذه التسوية لأنها ليست في حالة مسودة أو معتمدة.");
     }
  };

  const handleViewSettlement = (settlement: SettlementFormValues) => {
    setSelectedSettlementForView(settlement);
    setShowViewSettlementDialog(true);
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <UserCheck className="me-2 h-8 w-8 text-primary" />
            تسوية حسابات الموظفين
          </CardTitle>
          <CardDescription>
            إدارة السلف، القروض، العهد، الخصومات، والمكافآت للموظفين، ومتابعة تسديدها.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="my-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">سجل تسويات الموظفين</h2>
        <Dialog open={showManageSettlementDialog} onOpenChange={(isOpen) => { setShowManageSettlementDialog(isOpen); if (!isOpen) setSettlementToEdit(null); }}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setSettlementToEdit(null); form.reset(); setShowManageSettlementDialog(true); }}>
              <PlusCircle className="me-2 h-4 w-4" /> إنشاء تسوية جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{settlementToEdit ? 'تعديل تسوية موظف' : 'إنشاء تسوية موظف جديدة'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSettlementSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>تاريخ التسوية</FormLabel>
                    <DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem><FormLabel>الموظف</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                        <SelectContent>{mockEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                 <FormField control={form.control} name="settlementType" render={({ field }) => (
                    <FormItem><FormLabel>نوع التسوية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر نوع التسوية" /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="سلفة">سلفة</SelectItem><SelectItem value="قرض">قرض</SelectItem>
                            <SelectItem value="تسوية عهدة">تسوية عهدة</SelectItem><SelectItem value="خصم">خصم</SelectItem>
                            <SelectItem value="مكافأة">مكافأة</SelectItem>
                        </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                <FormField control={form.control} name="accountId" render={({ field }) => (
                    <FormItem><FormLabel>حساب التسوية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحساب المرتبط" /></SelectTrigger></FormControl>
                        <SelectContent>{mockSettlementAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>المبلغ</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="تفاصيل التسوية" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                        <FormItem><FormLabel>طريقة الدفع/الاسترداد</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الطريقة" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="نقدي">نقدي</SelectItem><SelectItem value="راتب">خصم/إضافة للراتب</SelectItem>
                                <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                            </SelectContent>
                            </Select><FormMessage /></FormItem>
                        )} />
                    <FormField control={form.control} name="reference" render={({ field }) => (
                        <FormItem><FormLabel>مرجع (اختياري)</FormLabel><FormControl><Input placeholder="رقم مستند، إلخ" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <DialogFooter>
                  <Button type="submit">{settlementToEdit ? 'حفظ التعديلات' : 'حفظ التسوية'}</Button>
                  <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input placeholder="بحث باسم الموظف أو الوصف..." className="max-w-sm bg-background" />
            </div>
             <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuLabel>تصفية حسب النوع</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>سلفة</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>قرض</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>تسوية عهدة</DropdownMenuCheckboxItem>
                       <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel><DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>معتمدة</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>مسددة بالكامل</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DatePickerWithPresets mode="range"/>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الموظف</TableHead>
                  <TableHead>نوع التسوية</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع/الاسترداد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((set) => (
                  <TableRow key={set.id} className="hover:bg-muted/50">
                    <TableCell>{set.date.toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell className="font-medium">{mockEmployees.find(e => e.id === set.employeeId)?.name}</TableCell>
                    <TableCell>{set.settlementType}</TableCell>
                    <TableCell>{set.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</TableCell>
                    <TableCell>{set.paymentMethod}</TableCell>
                    <TableCell>
                        <Badge 
                            variant={
                                set.status === "معتمدة" || set.status === "مسددة بالكامل" ? "default" :
                                set.status === "ملغاة" ? "destructive" :
                                "outline"
                            }
                            className="whitespace-nowrap"
                        >{set.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewSettlement(set)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      {set.status === "مسودة" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => { setSettlementToEdit(set); setShowManageSettlementDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف التسوية للموظف "{mockEmployees.find(e => e.id === set.employeeId)?.name}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSettlement(set.id!)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900" title="اعتماد" onClick={() => handleApproveSettlement(set.id!)}>
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </Button>
                        </>
                      )}
                       {(set.status === "معتمدة" || set.status === "مسودة") && set.status !== "ملغاة" && ( // Allow cancelling if معتمدة or مسودة but not already ملغاة
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-800" title="إلغاء التسوية" onClick={() => handleCancelSettlement(set.id!)}>
                            <Undo className="h-4 w-4 text-red-600 dark:text-red-400" />
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

       {/* Dialog for Viewing Settlement */}
       <Dialog open={showViewSettlementDialog} onOpenChange={setShowViewSettlementDialog}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل التسوية: {selectedSettlementForView?.id}</DialogTitle>
            <DialogDescription>عرض تفاصيل التسوية للموظف.</DialogDescription>
          </DialogHeader>
          {selectedSettlementForView && (
            <div className="py-4 space-y-3">
              <p><strong>رقم التسوية:</strong> {selectedSettlementForView.id}</p>
              <p><strong>تاريخ التسوية:</strong> {selectedSettlementForView.date.toLocaleDateString('ar-SA')}</p>
              <p><strong>الموظف:</strong> {mockEmployees.find(e => e.id === selectedSettlementForView.employeeId)?.name}</p>
              <p><strong>نوع التسوية:</strong> {selectedSettlementForView.settlementType}</p>
              <p><strong>حساب التسوية:</strong> {mockSettlementAccounts.find(a => a.id === selectedSettlementForView.accountId)?.name}</p>
              <p><strong>المبلغ:</strong> {selectedSettlementForView.amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</p>
              <p><strong>الوصف:</strong> {selectedSettlementForView.description}</p>
              <p><strong>طريقة الدفع/الاسترداد:</strong> {selectedSettlementForView.paymentMethod}</p>
              <p><strong>الحالة:</strong> <Badge 
                  variant={
                      selectedSettlementForView.status === "معتمدة" || selectedSettlementForView.status === "مسددة بالكامل" ? "default" :
                      selectedSettlementForView.status === "ملغاة" ? "destructive" :
                      "outline"
                  }
                  className="whitespace-nowrap"
              >{selectedSettlementForView.status}</Badge></p>
              <p><strong>المرجع:</strong> {selectedSettlementForView.reference || "لا يوجد"}</p>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

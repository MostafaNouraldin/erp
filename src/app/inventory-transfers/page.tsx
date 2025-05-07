
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Label } from "@/components/ui/label";
import { Truck, PlusCircle, Search, Edit, Trash2, FileText, Filter, PackagePlus, PackageMinus, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


// Mock data
const inventoryItems = [
  { id: "ITEM001", name: "لابتوب Dell XPS 15", available: 50 },
  { id: "ITEM002", name: "طابعة HP LaserJet Pro", available: 5 },
  { id: "ITEM003", name: "ورق طباعة A4 (صندوق)", available: 200 },
];

const warehouses = [
  { id: "WH001", name: "المستودع الرئيسي - الرياض" },
  { id: "WH002", name: "مستودع فرع جدة" },
  { id: "WH003", name: "مستودع الدمام" },
];

const existingTransfers = [
  { id: "TRN001", date: "2024-07-20", fromWarehouse: "WH001", toWarehouse: "WH002", item: "ITEM001", quantity: 10, status: "مكتملة" },
  { id: "TRN002", date: "2024-07-22", fromWarehouse: "WH001", toWarehouse: "WH003", item: "ITEM003", quantity: 50, status: "قيد النقل" },
  { id: "TRN003", date: "2024-07-25", fromWarehouse: "WH002", toWarehouse: "WH001", item: "ITEM002", quantity: 2, status: "مسودة" },
];

export default function InventoryTransfersPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
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
          <CardTitle className="flex items-center">
            <PlusCircle className="me-2 h-5 w-5 text-primary" />
            إنشاء طلب تحويل جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transferDate">تاريخ التحويل</Label>
                <DatePickerWithPresets mode="single" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromWarehouse" className="flex items-center"><PackageMinus className="me-1 h-4 w-4 text-destructive"/> من مستودع</Label>
                <Select dir="rtl">
                  <SelectTrigger id="fromWarehouse" className="bg-background">
                    <SelectValue placeholder="اختر المستودع المصدر" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toWarehouse" className="flex items-center"><PackagePlus className="me-1 h-4 w-4 text-green-600"/> إلى مستودع</Label>
                <Select dir="rtl">
                  <SelectTrigger id="toWarehouse" className="bg-background">
                    <SelectValue placeholder="اختر المستودع الهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="item">الصنف</Label>
                <Select dir="rtl">
                  <SelectTrigger id="item" className="bg-background">
                    <SelectValue placeholder="اختر الصنف المراد تحويله" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name} (المتاح: {item.available})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية المحولة</Label>
                <Input id="quantity" type="number" placeholder="أدخل الكمية" className="bg-background" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="reference">المرجع (اختياري)</Label>
                <Input id="reference" placeholder="مثال: طلب رقم #123" className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" placeholder="أضف ملاحظات إضافية (سبب التحويل، إلخ)..." rows={3} className="bg-background" />
            </div>
             <div className="flex gap-2">
                <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow">
                    <Truck className="me-2 h-4 w-4" /> حفظ طلب التحويل
                </Button>
                <Button type="button" variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    إلغاء
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="me-2 h-5 w-5 text-primary" />
            سجل تحويلات المخزون
          </CardTitle>
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
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem>مكتملة</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>قيد النقل</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DatePickerWithPresets mode="range" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التحويل</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>من المستودع</TableHead>
                  <TableHead>إلى المستودع</TableHead>
                  <TableHead>الصنف</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingTransfers.map((transfer) => (
                  <TableRow key={transfer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{transfer.id}</TableCell>
                    <TableCell>{transfer.date}</TableCell>
                    <TableCell>{warehouses.find(wh => wh.id === transfer.fromWarehouse)?.name || transfer.fromWarehouse}</TableCell>
                    <TableCell>{warehouses.find(wh => wh.id === transfer.toWarehouse)?.name || transfer.toWarehouse}</TableCell>
                    <TableCell>{inventoryItems.find(i => i.id === transfer.item)?.name || transfer.item}</TableCell>
                    <TableCell className="font-semibold">{transfer.quantity}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                            transfer.status === "مكتملة" ? "default" :
                            transfer.status === "قيد النقل" ? "secondary" :
                            "outline"
                        }
                        className="whitespace-nowrap"
                      >
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                        <FileText className="h-4 w-4" />
                      </Button>
                       {transfer.status === "مسودة" && (
                        <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        </>
                      )}
                       {transfer.status === "قيد النقل" && (
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تأكيد الاستلام">
                            <Warehouse className="h-4 w-4 text-green-600" />
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
  );
}

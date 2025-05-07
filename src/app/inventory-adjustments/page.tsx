
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Label } from "@/components/ui/label";
import { Repeat, PlusCircle, Search, Edit, Trash2, FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


// Mock data
const inventoryItems = [
  { id: "ITEM001", name: "لابتوب Dell XPS 15" },
  { id: "ITEM002", name: "طابعة HP LaserJet Pro" },
  { id: "ITEM003", name: "ورق طباعة A4 (صندوق)" },
];

const adjustmentReasons = [
  { id: "REASON001", name: "تلف" },
  { id: "REASON002", name: "فقدان" },
  { id: "REASON003", name: "فرق جرد" },
  { id: "REASON004", name: "إهلاك" },
];

const existingAdjustments = [
  { id: "ADJ001", date: "2024-07-20", item: "ITEM001", type: "نقص", quantity: 2, reason: "فرق جرد", notes: "تم اكتشاف نقص وحدتين أثناء الجرد السنوي.", status: "معتمدة" },
  { id: "ADJ002", date: "2024-07-22", item: "ITEM003", type: "زيادة", quantity: 5, reason: "فرق جرد", notes: "تم العثور على 5 صناديق إضافية.", status: "معتمدة" },
  { id: "ADJ003", date: "2024-07-25", item: "ITEM002", type: "نقص", quantity: 1, reason: "تلف", notes: "الطابعة تالفة ولا يمكن إصلاحها.", status: "مسودة" },
];


export default function InventoryAdjustmentsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <Repeat className="me-2 h-8 w-8 text-primary" />
            تسويات جردية
          </CardTitle>
          <CardDescription>تسجيل ومتابعة التسويات الجردية لضمان دقة بيانات المخزون (زيادة أو نقص).</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PlusCircle className="me-2 h-5 w-5 text-primary" />
            إنشاء تسوية جردية جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adjustmentDate">تاريخ التسوية</Label>
                <DatePickerWithPresets mode="single" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">الصنف</Label>
                <Select dir="rtl">
                  <SelectTrigger id="item" className="bg-background">
                    <SelectValue placeholder="اختر الصنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustmentType">نوع التسوية</Label>
                <Select dir="rtl">
                  <SelectTrigger id="adjustmentType" className="bg-background">
                    <SelectValue placeholder="اختر نوع التسوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">زيادة (+)</SelectItem>
                    <SelectItem value="decrease">نقص (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">الكمية</Label>
                <Input id="quantity" type="number" placeholder="أدخل الكمية" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">سبب التسوية</Label>
                 <Select dir="rtl">
                  <SelectTrigger id="reason" className="bg-background">
                    <SelectValue placeholder="اختر سبب التسوية" />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentReasons.map(reason => (
                        <SelectItem key={reason.id} value={reason.id}>{reason.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="reference">المرجع (اختياري)</Label>
                <Input id="reference" placeholder="مثال: رقم محضر الجرد" className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea id="notes" placeholder="أضف ملاحظات إضافية..." rows={3} className="bg-background" />
            </div>
            <div className="flex gap-2">
                <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> حفظ التسوية
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
                {existingAdjustments.map((adj) => (
                  <TableRow key={adj.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{adj.id}</TableCell>
                    <TableCell>{adj.date}</TableCell>
                    <TableCell>{inventoryItems.find(i => i.id === adj.item)?.name || adj.item}</TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                        <FileText className="h-4 w-4" />
                      </Button>
                      {adj.status === "مسودة" && (
                        <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                            <Trash2 className="h-4 w-4" />
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


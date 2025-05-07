
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Filter, Package, Warehouse, ArrowRightLeft, Layers, AlertTriangle, Truck, Repeat, History, BarChart3, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Progress } from "@/components/ui/progress";


// Mock data
const inventoryItems = [
  { id: "ITEM001", name: "لابتوب Dell XPS 15", category: "إلكترونيات", unit: "قطعة", price: "6,500 SAR", quantity: 50, reorderLevel: 10, location: "مستودع A - رف 3" },
  { id: "ITEM002", name: "طابعة HP LaserJet Pro", category: "إلكترونيات", unit: "قطعة", price: "1,200 SAR", quantity: 5, reorderLevel: 5, location: "مستودع A - رف 1" },
  { id: "ITEM003", name: "ورق طباعة A4 (صندوق)", category: "قرطاسية", unit: "صندوق", price: "150 SAR", quantity: 200, reorderLevel: 50, location: "مستودع B - قسم 2" },
  { id: "ITEM004", name: "مكاتب خشبية", category: "أثاث مكتبي", unit: "قطعة", price: "800 SAR", quantity: 15, reorderLevel: 5, location: "مستودع C - منطقة 1" },
  { id: "ITEM005", name: "أقلام حبر أزرق (علبة)", category: "قرطاسية", unit: "علبة", price: "25 SAR", quantity: 500, reorderLevel: 100, location: "مستودع B - قسم 1" },
];

const stockMovements = [
  { id: "MV001", date: "2024-07-20", type: "دخول (شراء)", item: "ITEM001", quantity: 20, fromTo: "مورد X", reference: "PO-123" },
  { id: "MV002", date: "2024-07-21", type: "خروج (بيع)", item: "ITEM003", quantity: 10, fromTo: "عميل Y", reference: "SO-456" },
  { id: "MV003", date: "2024-07-22", type: "تحويل داخلي", item: "ITEM002", quantity: 2, fromTo: "مستودع A -> مستودع B", reference: "TRN-001" },
  { id: "MV004", date: "2024-07-23", type: "تعديل جرد (زيادة)", item: "ITEM005", quantity: 5, fromTo: "جرد سنوي", reference: "ADJ-001" },
];


export default function InventoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">إدارة المخزون والمستودعات</h1>
        <Button className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="me-2 h-4 w-4" /> إضافة صنف جديد
        </Button>
      </div>

      <Tabs defaultValue="itemsList" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="itemsList" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Package className="inline-block me-2 h-4 w-4" /> قائمة الأصناف
          </TabsTrigger>
          <TabsTrigger value="stockMovement" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <History className="inline-block me-2 h-4 w-4" /> حركة المخزون
          </TabsTrigger>
          <TabsTrigger value="stocktaking" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Repeat className="inline-block me-2 h-4 w-4" /> الجرد والتسويات
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BarChart3 className="inline-block me-2 h-4 w-4" /> تقارير المخزون
          </TabsTrigger>
        </TabsList>

        <TabsContent value="itemsList">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة الأصناف</CardTitle>
              <CardDescription>تعريف الأصناف، الوحدات، الأسعار، وإدارة مواقع التخزين. تنبيهات الحد الأدنى لإعادة الطلب.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الأصناف..." className="pr-10 w-full sm:w-64" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="me-2 h-4 w-4" /> تصفية الفئة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>تصفية حسب الفئة</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem>إلكترونيات</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>قرطاسية</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>أثاث مكتبي</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                     <AlertTriangle className="me-2 h-4 w-4 text-destructive" /> عرض أصناف تحت حد الطلب
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>كود الصنف</TableHead>
                      <TableHead>اسم الصنف</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الوحدة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الكمية الحالية</TableHead>
                      <TableHead>حد إعادة الطلب</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.map((item) => (
                      <TableRow key={item.id} className={`hover:bg-muted/50 ${item.quantity <= item.reorderLevel ? 'bg-destructive/10' : ''}`}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.price}</TableCell>
                        <TableCell className="font-semibold">
                          {item.quantity}
                          {item.quantity <= item.reorderLevel && <AlertTriangle className="inline-block me-2 h-4 w-4 text-destructive" />}
                        </TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الصنف">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف الصنف">
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="stockMovement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>حركة المخزون</CardTitle>
              <CardDescription>تتبع جميع حركات الدخول والخروج والتحويلات بين المخازن.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في حركات المخزون..." className="pr-10 w-full sm:w-64" />
                </div>
                 <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <ArrowRightLeft className="me-2 h-4 w-4" /> إنشاء تحويل مخزني
                    </Button>
                    <DatePickerWithPresets mode="range" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الحركة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع الحركة</TableHead>
                      <TableHead>الصنف</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>من/إلى</TableHead>
                      <TableHead>المرجع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{movement.id}</TableCell>
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>
                           <Badge variant={movement.type.includes("دخول") || movement.type.includes("زيادة") ? "default" : movement.type.includes("خروج") ? "destructive" : "secondary" } className="whitespace-nowrap bg-opacity-80">
                                {movement.type}
                           </Badge>
                        </TableCell>
                        <TableCell>{movement.item}</TableCell>
                        <TableCell className="font-semibold">{movement.quantity}</TableCell>
                        <TableCell>{movement.fromTo}</TableCell>
                        <TableCell>{movement.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stocktaking">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>الجرد والتسويات المخزنية</CardTitle>
                    <CardDescription>تنفيذ عمليات الجرد الدورية وتسجيل التسويات لضمان دقة بيانات المخزون.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <Button className="shadow-md hover:shadow-lg transition-shadow">
                            <PlusCircle className="me-2 h-4 w-4" /> بدء جرد جديد
                        </Button>
                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Layers className="me-2 h-4 w-4" /> عرض عمليات الجرد السابقة
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">آخر عملية جرد</CardTitle>
                            <CardDescription>تاريخ: 2024-06-30 - المستودع: مستودع A - الحالة: مكتمل</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>تم جرد 500 صنف، تم العثور على فروقات في 15 صنفًا.</p>
                            <Button variant="link" className="px-0">عرض تفاصيل الجرد</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">إنشاء تسوية مخزنية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Form for stock adjustment could go here */}
                            <p className="text-sm text-muted-foreground">يمكنك هنا إدخال تسويات يدوية لزيادة أو خفض كميات الأصناف بناءً على نتائج الجرد أو لأسباب أخرى (تلف، فقدان، إلخ).</p>
                            <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                               <Settings2 className="me-2 h-4 w-4" /> إنشاء تسوية
                            </Button>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="reports">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>تقارير المخزون</CardTitle>
                    <CardDescription>تقارير متنوعة لتحليل أداء المخزون وقيمته وحركته.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        { name: "تقرير حركة صنف", icon: Package },
                        { name: "تقرير تقييم المخزون", icon: Layers },
                        { name: "تقرير الجرد والفروقات", icon: Repeat },
                        { name: "تقرير الأصناف الراكدة", icon: AlertTriangle },
                        { name: "تقرير مواقع التخزين", icon: Warehouse },
                        { name: "تقرير الأصناف حسب المورد", icon: Truck },
                    ].map((report) => (
                        <Card key={report.name} className="flex flex-col items-center justify-center p-6 hover:shadow-xl transition-shadow duration-300 shadow-md rounded-lg">
                            <report.icon className="h-10 w-10 text-primary mb-3" />
                            <CardTitle className="text-md mb-3 text-center">{report.name}</CardTitle>
                            <Button variant="outline" className="w-full shadow-sm hover:shadow-md transition-shadow">
                                عرض التقرير
                            </Button>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}


"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cog, ListChecks, CalendarClock, ShieldCheck, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, Settings2 } from "lucide-react";

// Mock data
const workOrders = [
  { id: "WO001", product: "منتج ألف", quantity: 100, startDate: "2024-08-01", endDate: "2024-08-05", status: "قيد التنفيذ", progress: 60 },
  { id: "WO002", product: "منتج باء", quantity: 250, startDate: "2024-07-20", endDate: "2024-07-30", status: "مكتمل", progress: 100 },
  { id: "WO003", product: "منتج جيم", quantity: 50, startDate: "2024-08-10", endDate: "2024-08-15", status: "مجدول", progress: 0 },
];

const boms = [
  { id: "BOM001", productName: "منتج ألف", version: "1.2", items: [{ material: "مادة خام X", quantity: 5 }, { material: "مادة خام Y", quantity: 2 }], lastUpdated: "2024-06-15" },
  { id: "BOM002", productName: "منتج باء", version: "2.0", items: [{ material: "مادة خام Z", quantity: 10 }, { material: "مادة خام A", quantity: 3 }], lastUpdated: "2024-05-01" },
];

const productionPlans = [
  { id: "PLAN001", name: "خطة إنتاج أغسطس", startDate: "2024-08-01", endDate: "2024-08-31", totalOrders: 5, status: "نشطة" },
  { id: "PLAN002", name: "خطة إنتاج الربع الثالث", startDate: "2024-07-01", endDate: "2024-09-30", totalOrders: 12, status: "مكتملة" },
];

const qualityChecks = [
    { id: "QC001", workOrder: "WO001", checkPoint: "فحص أولي للمواد", result: "ناجح", date: "2024-08-01", inspector: "أحمد علي"},
    { id: "QC002", workOrder: "WO001", checkPoint: "فحص أثناء العملية (50%)", result: "ناجح", date: "2024-08-03", inspector: "أحمد علي"},
    { id: "QC003", workOrder: "WO002", checkPoint: "فحص نهائي للمنتج", result: "ناجح مع ملاحظات", date: "2024-07-30", inspector: "فاطمة محمد"},
];


export default function ProductionPage() {
  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الإنتاج والتصنيع</h1>
        <Button className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="me-2 h-4 w-4" /> إنشاء أمر عمل جديد
        </Button>
      </div>

      <Tabs defaultValue="workOrders" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="workOrders" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Cog className="inline-block me-2 h-4 w-4" /> أوامر العمل
          </TabsTrigger>
          <TabsTrigger value="boms" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListChecks className="inline-block me-2 h-4 w-4" /> قائمة المواد (BOM)
          </TabsTrigger>
          <TabsTrigger value="planning" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CalendarClock className="inline-block me-2 h-4 w-4" /> تخطيط الإنتاج
          </TabsTrigger>
          <TabsTrigger value="qualityControl" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShieldCheck className="inline-block me-2 h-4 w-4" /> مراقبة الجودة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة أوامر العمل</CardTitle>
              <CardDescription>تتبع أوامر العمل، حالة الإنتاج، والكميات المطلوبة والمنتجة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في أوامر العمل..." className="pr-10 w-full sm:w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مجدول</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد التنفيذ</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متوقف مؤقتاً</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مكتمل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الكمية المطلوبة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء المتوقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => (
                      <TableRow key={wo.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{wo.id}</TableCell>
                        <TableCell>{wo.product}</TableCell>
                        <TableCell>{wo.quantity}</TableCell>
                        <TableCell>{wo.startDate}</TableCell>
                        <TableCell>{wo.endDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              wo.status === "مكتمل" ? "default" :
                              wo.status === "قيد التنفيذ" ? "secondary" :
                              "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {wo.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Progress value={wo.progress} aria-label={`${wo.progress}%`} className="h-2 w-24" />
                                <span className="text-xs text-muted-foreground">{wo.progress}%</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {wo.status !== "مكتمل" && wo.status !== "ملغي" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                                <Edit className="h-4 w-4" />
                            </Button>
                          )}
                           {wo.status === "قيد التنفيذ" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحديث التقدم">
                                <PlayCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {wo.status === "مجدول" && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إلغاء الأمر">
                                <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="boms">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المواد (Bill of Materials)</CardTitle>
              <CardDescription>إدارة مكونات المنتجات وتكاليفها وتحديثات الإصدارات.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء قائمة مواد جديدة
                </Button>
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث باسم المنتج أو المادة..." className="pr-10 w-full sm:w-64" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف القائمة</TableHead>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>الإصدار</TableHead>
                      <TableHead>عدد المواد</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{bom.id}</TableCell>
                        <TableCell>{bom.productName}</TableCell>
                        <TableCell>{bom.version}</TableCell>
                        <TableCell>{bom.items.length}</TableCell>
                        <TableCell>{bom.lastUpdated}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل القائمة">
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إنشاء نسخة جديدة">
                            <Settings2 className="h-4 w-4" />
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
        
        <TabsContent value="planning">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>تخطيط موارد الإنتاج (MRP)</CardTitle>
              <CardDescription>جدولة الإنتاج، إدارة الطلب على المواد، وتخطيط السعة الإنتاجية.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء خطة إنتاج جديدة
                </Button>
                <DatePickerWithPresets mode="range" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف الخطة</TableHead>
                      <TableHead>اسم الخطة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>إجمالي أوامر العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionPlans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{plan.id}</TableCell>
                        <TableCell>{plan.name}</TableCell>
                        <TableCell>{plan.startDate}</TableCell>
                        <TableCell>{plan.endDate}</TableCell>
                        <TableCell>{plan.totalOrders}</TableCell>
                        <TableCell>
                            <Badge variant={plan.status === "نشطة" ? "default" : "outline"}>{plan.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الخطة">
                            <FileText className="h-4 w-4" />
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

        <TabsContent value="qualityControl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>مراقبة الجودة</CardTitle>
              <CardDescription>إدارة عمليات فحص الجودة، تسجيل النتائج، وتتبع معايير الجودة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> تسجيل فحص جودة جديد
                </Button>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية بنتيجة الفحص
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب النتيجة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>ناجح</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>فاشل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ناجح مع ملاحظات</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف الفحص</TableHead>
                      <TableHead>أمر العمل</TableHead>
                      <TableHead>نقطة الفحص</TableHead>
                       <TableHead>النتيجة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>المفتش</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityChecks.map((qc) => (
                      <TableRow key={qc.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{qc.id}</TableCell>
                        <TableCell>{qc.workOrder}</TableCell>
                        <TableCell>{qc.checkPoint}</TableCell>
                        <TableCell>
                           <Badge
                            variant={qc.result === "ناجح" ? "default" : qc.result === "فاشل" ? "destructive" : "secondary"}
                            className="whitespace-nowrap"
                           >
                            {qc.result}
                           </Badge>
                        </TableCell>
                        <TableCell>{qc.date}</TableCell>
                        <TableCell>{qc.inspector}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الفحص">
                            <FileText className="h-4 w-4" />
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
      </Tabs>
    </div>
  );
}


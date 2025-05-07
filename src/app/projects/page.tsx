
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
import { Building, ListTodo, Users, CircleDollarSign, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, GanttChartSquare } from "lucide-react";

// Mock data
const projects = [
  { id: "PROJ001", name: "تطوير نظام ERP جديد", client: "شركة المستقبل الذهبي", startDate: "2024-05-01", endDate: "2025-01-31", budget: "500,000 SAR", status: "قيد التنفيذ", progress: 45, manager: "خالد الأحمد" },
  { id: "PROJ002", name: "حملة تسويقية لإطلاق منتج", client: "مؤسسة الإبداع الرقمي", startDate: "2024-07-15", endDate: "2024-09-30", budget: "150,000 SAR", status: "مخطط له", progress: 10, manager: "سارة عبدالله" },
  { id: "PROJ003", name: "إنشاء فرع جديد في جدة", client: "الشركة المتحدة للتجارة", startDate: "2023-10-01", endDate: "2024-06-30", budget: "1,200,000 SAR", status: "مكتمل", progress: 100, manager: "يوسف إبراهيم" },
];

const tasks = [
  { id: "TASK001", projectId: "PROJ001", name: "تحليل المتطلبات", assignee: "فريق التحليل", dueDate: "2024-06-15", status: "مكتملة", priority: "مرتفعة" },
  { id: "TASK002", projectId: "PROJ001", name: "تصميم واجهات المستخدم", assignee: "فريق التصميم", dueDate: "2024-07-30", status: "قيد التنفيذ", priority: "مرتفعة" },
  { id: "TASK003", projectId: "PROJ001", name: "تطوير الوحدات الأساسية", assignee: "فريق التطوير", dueDate: "2024-10-30", status: "قيد التنفيذ", priority: "متوسطة" },
  { id: "TASK004", projectId: "PROJ002", name: "وضع استراتيجية الحملة", assignee: "أحمد خالد", dueDate: "2024-07-30", status: "مخطط لها", priority: "مرتفعة" },
];

const resources = [
  { id: "RES001", projectId: "PROJ001", name: "أحمد محمود (مطور أول)", role: "تطوير", allocation: "80%", availability: "متاح" },
  { id: "RES002", projectId: "PROJ001", name: "فاطمة علي (مصممة UX)", role: "تصميم", allocation: "100%", availability: "متاح" },
  { id: "RES003", projectId: "PROJ002", name: "سارة إبراهيم (أخصائية تسويق)", role: "تسويق", allocation: "50%", availability: "متاح جزئياً" },
];

const budgetItems = [
  { id: "BUD001", projectId: "PROJ001", item: "رواتب الفريق", allocated: "200,000 SAR", spent: "80,000 SAR", remaining: "120,000 SAR" },
  { id: "BUD002", projectId: "PROJ001", item: "تراخيص البرامج", allocated: "50,000 SAR", spent: "30,000 SAR", remaining: "20,000 SAR" },
  { id: "BUD003", projectId: "PROJ002", item: "إعلانات رقمية", allocated: "70,000 SAR", spent: "15,000 SAR", remaining: "55,000 SAR" },
];

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">إدارة المشاريع</h1>
        <Button className="shadow-md hover:shadow-lg transition-shadow">
          <PlusCircle className="me-2 h-4 w-4" /> إنشاء مشروع جديد
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Building className="inline-block me-2 h-4 w-4" /> نظرة عامة على المشاريع
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListTodo className="inline-block me-2 h-4 w-4" /> المهام والجداول
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة الموارد
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CircleDollarSign className="inline-block me-2 h-4 w-4" /> الميزانية والتكاليف
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المشاريع</CardTitle>
              <CardDescription>تتبع جميع المشاريع الحالية، المخطط لها، والمكتملة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث باسم المشروع أو العميل..." className="pr-10 w-full sm:w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب حالة المشروع</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مخطط له</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد التنفيذ</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متوقف</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مكتمل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المشروع</TableHead>
                      <TableHead>اسم المشروع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{project.id}</TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{project.client}</TableCell>
                        <TableCell>{project.startDate}</TableCell>
                        <TableCell>{project.endDate}</TableCell>
                        <TableCell>
                          <Badge variant={project.status === "مكتمل" ? "default" : project.status === "قيد التنفيذ" ? "secondary" : "outline"}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} aria-label={`${project.progress}%`} className="h-2 w-24" />
                            <span className="text-xs text-muted-foreground">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المشروع">
                            <Edit className="h-4 w-4" />
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

        <TabsContent value="tasks">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة مهام المشاريع</CardTitle>
              <CardDescription>تتبع المهام، تعيين المسؤولين، وتحديد الأولويات والمواعيد النهائية.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة مهمة جديدة
                    </Button>
                    <div className="flex gap-2 flex-wrap">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <GanttChartSquare className="me-2 h-4 w-4" /> عرض مخطط جانت
                        </Button>
                    </div>
                </div>
                {/* Placeholder for Gantt Chart */}
                <div className="my-6 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                    <GanttChartSquare className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p>سيتم عرض مخطط جانت هنا لعرض الجدول الزمني للمهام بشكل مرئي.</p>
                </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف المهمة</TableHead>
                      <TableHead>اسم المهمة</TableHead>
                      <TableHead>المسؤول</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{task.id}</TableCell>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{task.assignee}</TableCell>
                        <TableCell>{task.dueDate}</TableCell>
                        <TableCell>
                            <Badge variant={task.priority === "مرتفعة" ? "destructive" : task.priority === "متوسطة" ? "secondary" : "outline"}>
                                {task.priority}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.status === "مكتملة" ? "default" : "outline"}>{task.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحديث الحالة">
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المهمة">
                            <Edit className="h-4 w-4" />
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
        
        <TabsContent value="resources">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة موارد المشروع</CardTitle>
              <CardDescription>تخصيص الموارد البشرية والمادية للمشاريع وتتبع مدى توفرها.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" /> تخصيص مورد جديد
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المعرف</TableHead>
                      <TableHead>اسم المورد</TableHead>
                      <TableHead>الدور/الوصف</TableHead>
                      <TableHead>نسبة التخصيص</TableHead>
                      <TableHead>التوفر</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((res) => (
                      <TableRow key={res.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{res.id}</TableCell>
                        <TableCell>{res.name}</TableCell>
                        <TableCell>{res.role}</TableCell>
                        <TableCell>{res.allocation}</TableCell>
                        <TableCell>
                           <Badge variant={res.availability === "متاح" ? "default" : "secondary"}>{res.availability}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل تخصيص المورد">
                            <Edit className="h-4 w-4" />
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

        <TabsContent value="budget">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>ميزانية وتكاليف المشروع</CardTitle>
              <CardDescription>تتبع الميزانيات المخصصة، المصروفات الفعلية، والتكاليف المتبقية لكل مشروع.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="me-2 h-4 w-4" /> إضافة بند ميزانية
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المعرف</TableHead>
                      <TableHead>بند التكلفة</TableHead>
                      <TableHead>الميزانية المخصصة</TableHead>
                      <TableHead>المصروف الفعلي</TableHead>
                      <TableHead>المتبقي</TableHead>
                       <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.allocated}</TableCell>
                        <TableCell>{item.spent}</TableCell>
                        <TableCell className="font-semibold">{item.remaining}</TableCell>
                         <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل مصروف">
                            <PlusCircle className="h-4 w-4" />
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


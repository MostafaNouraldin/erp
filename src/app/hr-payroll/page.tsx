
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CalendarDays, LogOut, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

// Mock data
const employees = [
  { id: "EMP001", name: "أحمد محمود", department: "قسم المبيعات", position: "مدير مبيعات", joinDate: "2022-01-15", status: "نشط" },
  { id: "EMP002", name: "فاطمة علي", department: "قسم التسويق", position: "أخصائية تسويق", joinDate: "2023-03-01", status: "نشط" },
  { id: "EMP003", name: "خالد عبدالله", department: "قسم المالية", position: "محاسب أول", joinDate: "2021-07-20", status: "نشط" },
  { id: "EMP004", name: "سارة إبراهيم", department: "قسم الموارد البشرية", position: "مسؤول موارد بشرية", joinDate: "2024-02-10", status: "نشط" },
  { id: "EMP005", name: "يوسف حسن", department: "قسم التشغيل", position: "فني صيانة", joinDate: "2020-05-01", status: "في إجازة" },
];

const payrollData = [
  { id: "PAY001", employee: "أحمد محمود", month: "يوليو 2024", basicSalary: "12,000 SAR", allowances: "3,000 SAR", deductions: "500 SAR", netSalary: "14,500 SAR", status: "مدفوع" },
  { id: "PAY002", employee: "فاطمة علي", month: "يوليو 2024", basicSalary: "8,000 SAR", allowances: "1,500 SAR", deductions: "200 SAR", netSalary: "9,300 SAR", status: "مدفوع" },
  { id: "PAY003", employee: "خالد عبدالله", month: "يوليو 2024", basicSalary: "10,000 SAR", allowances: "2,000 SAR", deductions: "300 SAR", netSalary: "11,700 SAR", status: "قيد المعالجة" },
];

const attendanceData = [
  { id: "ATT001", employee: "أحمد محمود", date: "2024-07-25", checkIn: "08:55", checkOut: "17:05", hours: "8.17", status: "حاضر" },
  { id: "ATT002", employee: "فاطمة علي", date: "2024-07-25", checkIn: "09:10", checkOut: "17:00", hours: "7.83", status: "حاضر (متأخر)" },
  { id: "ATT003", employee: "خالد عبدالله", date: "2024-07-25", checkIn: null, checkOut: null, hours: "0", status: "غائب" },
  { id: "ATT004", employee: "سارة إبراهيم", date: "2024-07-25", checkIn: "09:00", checkOut: "16:30", hours: "7.5", status: "حاضر (مغادرة مبكرة)" },
];

const leaveRequests = [
  { id: "LR001", employee: "يوسف حسن", type: "إجازة سنوية", startDate: "2024-08-01", endDate: "2024-08-10", days: 10, status: "موافق عليها" },
  { id: "LR002", employee: "فاطمة علي", type: "إجازة مرضية", startDate: "2024-07-28", endDate: "2024-07-29", days: 2, status: "مقدمة" },
  { id: "LR003", employee: "أحمد محمود", type: "إجازة عارضة", startDate: "2024-09-05", endDate: "2024-09-05", days: 1, status: "مرفوضة" },
];

export default function HRPayrollPage() {
  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الموارد البشرية والرواتب</h1>
        <div className="flex gap-2">
          <Button className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="me-2 h-4 w-4" /> إضافة موظف جديد
          </Button>
          <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="me-2 h-4 w-4" /> إنشاء مسير رواتب
          </Button>
        </div>
      </div>

      <Tabs defaultValue="employeeManagement" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="employeeManagement" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة الموظفين
          </TabsTrigger>
          <TabsTrigger value="payroll" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Briefcase className="inline-block me-2 h-4 w-4" /> مسيرات الرواتب
          </TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CalendarDays className="inline-block me-2 h-4 w-4" /> الحضور والانصراف
          </TabsTrigger>
          <TabsTrigger value="leaveRequests" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LogOut className="inline-block me-2 h-4 w-4" /> طلبات الإجازات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employeeManagement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>سجلات الموظفين</CardTitle>
              <CardDescription>إدارة بيانات الموظفين، الوظائف، العقود، والمستندات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الموظفين..." className="pr-10 w-full sm:w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية القسم
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب القسم</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>قسم المبيعات</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قسم التسويق</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قسم المالية</DropdownMenuCheckboxItem>
                    {/* Add more departments */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرقم الوظيفي</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>المنصب</TableHead>
                      <TableHead>تاريخ التعيين</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{emp.id}</TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{emp.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant={emp.status === "نشط" ? "default" : "secondary"}>{emp.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الملف الشخصي">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إنهاء خدمة">
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

        <TabsContent value="payroll">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>مسيرات الرواتب</CardTitle>
              <CardDescription>إنشاء وإدارة مسيرات الرواتب الشهرية، البدلات، والخصومات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <DatePickerWithPresets mode="single" /> {/* For selecting payroll month */}
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد المعالجة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف المسير</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>الشهر</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>البدلات</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>صافي الراتب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((payroll) => (
                      <TableRow key={payroll.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{payroll.id}</TableCell>
                        <TableCell>{payroll.employee}</TableCell>
                        <TableCell>{payroll.month}</TableCell>
                        <TableCell>{payroll.basicSalary}</TableCell>
                        <TableCell>{payroll.allowances}</TableCell>
                        <TableCell>{payroll.deductions}</TableCell>
                        <TableCell className="font-semibold">{payroll.netSalary}</TableCell>
                        <TableCell>
                          <Badge variant={payroll.status === "مدفوع" ? "default" : "outline"}>{payroll.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
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

        <TabsContent value="attendance">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>سجلات الحضور والانصراف</CardTitle>
              <CardDescription>متابعة حضور الموظفين، التأخير، الغياب، وساعات العمل الإضافية.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                 <DatePickerWithPresets mode="range" />
                 <Input placeholder="بحث باسم الموظف أو الرقم الوظيفي" className="w-full sm:w-64 pe-4" /> {/* Changed pr-4 to pe-4 for RTL */}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>وقت الحضور</TableHead>
                      <TableHead>وقت الانصراف</TableHead>
                      <TableHead>ساعات العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((att) => (
                      <TableRow key={att.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{att.id}</TableCell>
                        <TableCell>{att.employee}</TableCell>
                        <TableCell>{att.date}</TableCell>
                        <TableCell>{att.checkIn || "--:--"}</TableCell>
                        <TableCell>{att.checkOut || "--:--"}</TableCell>
                        <TableCell>{att.hours}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                                att.status === "حاضر" ? "default" :
                                att.status === "غائب" ? "destructive" :
                                "secondary"
                            }
                            className="whitespace-nowrap"
                          >
                            {att.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل السجل">
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

        <TabsContent value="leaveRequests">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>طلبات الإجازات</CardTitle>
              <CardDescription>إدارة طلبات الإجازات المقدمة من الموظفين والموافقة عليها أو رفضها.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-end items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية حالة الطلب
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب حالة الطلب</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مقدمة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>موافق عليها</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرفوضة</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                    <PlusCircle className="me-2 h-4 w-4" /> تقديم طلب إجازة بالنيابة
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>نوع الإجازة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>عدد الأيام</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{req.id}</TableCell>
                        <TableCell>{req.employee}</TableCell>
                        <TableCell>{req.type}</TableCell>
                        <TableCell>{req.startDate}</TableCell>
                        <TableCell>{req.endDate}</TableCell>
                        <TableCell>{req.days}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === "موافق عليها" ? "default" :
                              req.status === "مرفوضة" ? "destructive" :
                              "secondary"
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {req.status === "مقدمة" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-800" title="موافقة">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-800" title="رفض">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}


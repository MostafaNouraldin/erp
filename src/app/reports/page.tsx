
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { BarChart2, FileText, DollarSign, ShoppingCart, Package, Users, Download, Eye, Settings2, Filter, BarChartBig, PieChart, LineChart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"; // Aliased to avoid name collision
import React from "react";


const financialReports = [
  { name: "الميزانية العمومية", icon: FileText, description: "عرض المركز المالي للشركة في تاريخ محدد." },
  { name: "قائمة الدخل", icon: DollarSign, description: "ملخص الإيرادات والمصروفات خلال فترة معينة." },
  { name: "قائمة التدفقات النقدية", icon: BarChartBig, description: "تتبع حركة النقد الداخل والخارج." },
  { name: "ميزان المراجعة", icon: PieChart, description: "قائمة بجميع الحسابات وأرصدتها." },
  { name: "تحليل الربحية", icon: LineChart, description: "تقييم مدى ربحية المنتجات أو الخدمات." },
];

const salesReports = [
  { name: "تقرير المبيعات حسب المنتج", icon: ShoppingCart, description: "تحليل مبيعات كل منتج على حدة." },
  { name: "تقرير المبيعات حسب العميل", icon: Users, description: "عرض مبيعات كل عميل وأكثرهم شراءً." },
  { name: "تقرير أداء مندوبي المبيعات", icon: Users, description: "تقييم أداء فريق المبيعات." },
  { name: "تحليل اتجاهات المبيعات", icon: LineChart, description: "تتبع نمو المبيعات وتوقعاتها." },
];

const inventoryReports = [
  { name: "تقرير تقييم المخزون", icon: Package, description: "عرض قيمة المخزون الحالي." },
  { name: "تقرير حركة الأصناف", icon: Package, description: "تتبع دخول وخروج الأصناف من المخازن." },
  { name: "تقرير الأصناف الراكدة", icon: Package, description: "تحديد الأصناف التي لم يتم بيعها لفترة طويلة." },
  { name: "تقرير مستويات المخزون", icon: Package, description: "مقارنة الكميات الحالية مع حدود الطلب." },
];

const hrReports = [
  { name: "تقرير كشوف المرتبات", icon: Users, description: "ملخص الرواتب والخصومات والبدلات للموظفين." },
  { name: "تقرير الحضور والانصراف", icon: Users, description: "سجل حضور وغياب الموظفين." },
  { name: "تقرير الإجازات", icon: Users, description: "عرض طلبات الإجازات المعتمدة والمستخدمة." },
  { name: "تحليل دوران الموظفين", icon: Users, description: "قياس معدل ترك الموظفين للعمل." },
];

const sampleChartData = [
  { month: "يناير", sales: 4000, expenses: 2400 },
  { month: "فبراير", sales: 3000, expenses: 1398 },
  { month: "مارس", sales: 2000, expenses: 9800 },
  { month: "ابريل", sales: 2780, expenses: 3908 },
  { month: "مايو", sales: 1890, expenses: 4800 },
  { month: "يونيو", sales: 2390, expenses: 3800 },
];

const chartConfig = {
  sales: { label: "المبيعات", color: "hsl(var(--chart-1))" },
  expenses: { label: "المصروفات", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;


export default function ReportsPage() {
  const [selectedReportGroup, setSelectedReportGroup] = React.useState("financial");
  const [currentReport, setCurrentReport] = React.useState<{name: string, description: string, group: string} | null>(null);

  const renderReportList = (reports: Array<{ name: string, icon: React.ElementType, description: string }>, groupName: string) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reports.map((report) => (
        <Card key={report.name} className="shadow-md hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <report.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
                <CardTitle className="text-lg">{report.name}</CardTitle>
                <CardDescription className="text-xs mt-1">{report.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-auto flex justify-end gap-2 p-4 pt-0">
             <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setCurrentReport({...report, group: groupName})}>
              <Eye className="me-1.5 h-3.5 w-3.5" /> عرض التقرير
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (currentReport) {
    return (
         <div className="container mx-auto py-6 space-y-6" dir="rtl">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl flex items-center">
                                <BarChart2 className="me-2 h-7 w-7 text-primary" /> {currentReport.name}
                            </CardTitle>
                            <CardDescription>{currentReport.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => setCurrentReport(null)}>العودة لقائمة التقارير</Button>
                    </div>
                </CardHeader>
            </Card>
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">خيارات التقرير</CardTitle>
                    <div className="mt-4 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-1 block">النطاق الزمني</label>
                            <DatePickerWithPresets mode="range" />
                        </div>
                        {currentReport.group === "sales" && (
                             <div className="flex-1 min-w-[200px]">
                                <label className="text-sm font-medium mb-1 block">المنتج/العميل</label>
                                <Select dir="rtl">
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="الكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">الكل</SelectItem>
                                        <SelectItem value="prod1">منتج أ</SelectItem>
                                        <SelectItem value="cust1">عميل س</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button className="shadow-sm hover:shadow-md">
                            <Filter className="me-2 h-4 w-4" /> تطبيق الفلاتر
                        </Button>
                        <Button variant="secondary" className="shadow-sm hover:shadow-md">
                            <Download className="me-2 h-4 w-4" /> تصدير (Excel/PDF)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg mb-4">عرض التقرير</CardTitle>
                    {/* Placeholder for report content - e.g., a chart */}
                    <div className="h-[400px] p-4 border rounded-md bg-muted/30 flex items-center justify-center">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={sampleChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                     <div className="mt-6">
                        <h3 className="text-md font-semibold mb-2">ملاحظات/ملخص التقرير:</h3>
                        <p className="text-sm text-muted-foreground">
                            هنا يتم عرض ملخص للبيانات المعروضة في التقرير، مثل أهم المؤشرات أو الاتجاهات.
                            مثلاً: "أظهرت المبيعات ارتفاعاً بنسبة 15% خلال الربع الحالي مقارنة بالربع السابق."
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-6 space-y-8" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <BarChart2 className="me-2 h-8 w-8 text-primary" />
            التقارير والتحليل
          </CardTitle>
          <CardDescription>إنشاء وعرض تقارير مخصصة وتحليلات لجميع وحدات النظام لاتخاذ قرارات مستنيرة.</CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={selectedReportGroup === "financial" ? "default" : "outline"} onClick={() => setSelectedReportGroup("financial")} className="shadow-sm hover:shadow-md">التقارير المالية</Button>
        <Button variant={selectedReportGroup === "sales" ? "default" : "outline"} onClick={() => setSelectedReportGroup("sales")} className="shadow-sm hover:shadow-md">تقارير المبيعات</Button>
        <Button variant={selectedReportGroup === "inventory" ? "default" : "outline"} onClick={() => setSelectedReportGroup("inventory")} className="shadow-sm hover:shadow-md">تقارير المخزون</Button>
        <Button variant={selectedReportGroup === "hr" ? "default" : "outline"} onClick={() => setSelectedReportGroup("hr")} className="shadow-sm hover:shadow-md">تقارير الموارد البشرية</Button>
      </div>
      
      {selectedReportGroup === "financial" && renderReportList(financialReports, "financial")}
      {selectedReportGroup === "sales" && renderReportList(salesReports, "sales")}
      {selectedReportGroup === "inventory" && renderReportList(inventoryReports, "inventory")}
      {selectedReportGroup === "hr" && renderReportList(hrReports, "hr")}
      
    </div>
  );
}


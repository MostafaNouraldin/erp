
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Package, TrendingUp, ArrowUpRight, Activity, CreditCardIcon, Percent, FilePlus, FileCheck, FileClock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { useCurrency } from "@/hooks/use-currency"; // Import useCurrency

const chartData = [
  { month: "يناير", desktop: 186, mobile: 80 },
  { month: "فبراير", desktop: 305, mobile: 200 },
  { month: "مارس", desktop: 237, mobile: 120 },
  { month: "ابريل", desktop: 73, mobile: 190 },
  { month: "مايو", desktop: 209, mobile: 130 },
  { month: "يونيو", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "مكتبي",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "جوال",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const pieChartData = [
  { name: "الرواتب", value: 400, fill: "hsl(var(--chart-1))" },
  { name: "التشغيل", value: 300, fill: "hsl(var(--chart-2))" },
  { name: "التسويق", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "الصيانة", value: 200, fill: "hsl(var(--chart-4))" },
];

const pieChartConfig = {
  الرواتب: { label: "الرواتب" },
  التشغيل: { label: "التشغيل" },
  التسويق: { label: "التسويق" },
  الصيانة: { label: "الصيانة" },
} satisfies ChartConfig


export default function DashboardPage() {
  const { formatCurrency } = useCurrency(); // Use the currency context

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: formatCurrency(45231.89) }}></div>
            <p className="text-xs text-muted-foreground">
              +20.1% عن الشهر الماضي
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% عن الشهر الماضي
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبيعات</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% عن الشهر الماضي
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النشاط</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 منذ الساعة الأخيرة
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات</CardTitle>
          </CardHeader>
          <CardContent className="pe-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                  <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>توزيع المصروفات</CardTitle>
            <CardDescription>يناير - يونيو 2024</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
             <ChartContainer
              config={pieChartConfig}
              className="mx-auto aspect-square max-h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         <Card>
          <CardHeader>
            <CardTitle>ملخص المخزون</CardTitle>
            <CardDescription>
              نظرة سريعة على حالة المخزون الحالية.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">إجمالي الأصناف</span>
              <span className="font-semibold">1,250</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">قيمة المخزون</span>
              <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(350720.00) }}></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">أصناف قاربت على النفاد</span>
              <span className="font-semibold text-destructive">15</span>
            </div>
            <Button variant="outline" className="w-full">
              عرض تفاصيل المخزون
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>أداء الموارد البشرية</CardTitle>
            <CardDescription>
              مؤشرات رئيسية للموظفين هذا الشهر.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">إجمالي الموظفين</span>
              <span className="font-semibold">152</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">نسبة الحضور</span>
              <span className="font-semibold">98.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">طلبات إجازة معلقة</span>
              <span className="font-semibold">5</span>
            </div>
            <Button variant="outline" className="w-full">
              إدارة الموظفين
            </Button>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>أحدث الأنشطة</CardTitle>
             <CardDescription>تتبع آخر الإجراءات في النظام.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FilePlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">تم إنشاء فاتورة جديدة #INV00125</p>
                <p className="text-xs text-muted-foreground">بواسطة: أحمد خالد - قبل دقيقتين</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">تم تأكيد طلب شراء #PO0087</p>
                <p className="text-xs text-muted-foreground">بواسطة: النظام - قبل 5 دقائق</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">طلب إجازة معلق من: سارة عبدالله</p>
                <p className="text-xs text-muted-foreground">قسم المبيعات - قبل 10 دقائق</p>
              </div>
            </div>
             <Button variant="outline" className="w-full mt-2">
              عرض كل الأنشطة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

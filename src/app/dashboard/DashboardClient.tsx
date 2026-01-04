
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, ShoppingCart, Activity, Package, FilePlus, FileCheck, FileClock } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { useCurrency } from "@/hooks/use-currency"; 
import { useEffect, useMemo } from "react";

interface DashboardClientProps {
  totalRevenue: number;
  totalCustomers: number;
  totalSales: number;
  totalActivity: number;
  inventorySummary: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
  };
  salesChartData: { month: string; total: number }[];
  expenseChartData: { name: string; value: number }[];
}

export default function DashboardClient({
  totalRevenue,
  totalCustomers,
  totalSales,
  totalActivity,
  inventorySummary,
  salesChartData,
  expenseChartData
}: DashboardClientProps) {
  const { formatCurrency } = useCurrency();

  const salesChartConfig = {
    total: {
      label: "المبيعات",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const pieChartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];
  
  const expensePieChartData = expenseChartData.map((item, index) => ({
      ...item,
      fill: pieChartColors[index % pieChartColors.length]
  }));
  
  const pieChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    expensePieChartData.forEach(item => {
        config[item.name] = { label: item.name };
    });
    return config;
  }, [expensePieChartData]);


  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: formatCurrency(totalRevenue).amount + ' ' + formatCurrency(totalRevenue).symbol }}></div>
            <p className="text-xs text-muted-foreground">
              من الفواتير المدفوعة
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء المسجلون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              إجمالي العملاء في النظام
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              فاتورة مبيعات مسجلة
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الحركات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalActivity}</div>
            <p className="text-xs text-muted-foreground">
              قيد يومية مسجل
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
            <ChartContainer config={salesChartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={salesChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value as number).amount} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>توزيع المصروفات</CardTitle>
            <CardDescription>أعلى 4 بنود مصروفات</CardDescription>
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
                    data={expensePieChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {expensePieChartData.map((entry, index) => (
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
              <span className="font-semibold">{inventorySummary.totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">قيمة المخزون (بالتكلفة)</span>
              <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(inventorySummary.totalValue).amount + ' ' + formatCurrency(inventorySummary.totalValue).symbol }}></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">أصناف قاربت على النفاد</span>
              <span className="font-semibold text-destructive">{inventorySummary.lowStockCount}</span>
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

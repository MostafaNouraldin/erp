"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2, FileText, DollarSign, ShoppingCart, Package, Users, Download, Eye, Settings2, Filter, BarChartBig, PieChart, LineChart } from "lucide-react";
import { useCurrency } from '@/hooks/use-currency';

interface Account {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  balance: number;
}

const financialReports = [
  { name: "الميزانية العمومية", key: "balanceSheet", icon: FileText, description: "عرض المركز المالي للشركة في تاريخ محدد." },
  { name: "قائمة الدخل", key: "incomeStatement", icon: DollarSign, description: "ملخص الإيرادات والمصروفات خلال فترة معينة." },
  { name: "ميزان المراجعة", key: "trialBalance", icon: PieChart, description: "قائمة بجميع الحسابات وأرصدتها." },
  { name: "قائمة التدفقات النقدية", key: "cashFlow", icon: BarChartBig, description: "تتبع حركة النقد الداخل والخارج." },
];

const salesReports = [
  { name: "تقرير المبيعات حسب المنتج", key: "salesByProduct", icon: ShoppingCart, description: "تحليل مبيعات كل منتج على حدة." },
  { name: "تقرير المبيعات حسب العميل", key: "salesByCustomer", icon: Users, description: "عرض مبيعات كل عميل وأكثرهم شراءً." },
];

const inventoryReports = [
  { name: "تقرير تقييم المخزون", key: "inventoryValuation", icon: Package, description: "عرض قيمة المخزون الحالي." },
  { name: "تقرير حركة الأصناف", key: "itemMovement", icon: Package, description: "تتبع دخول وخروج الأصناف من المخازن." },
];

const hrReports = [
  { name: "تقرير كشوف المرتبات", key: "payroll", icon: Users, description: "ملخص الرواتب والخصومات والبدلات للموظفين." },
  { name: "تقرير الحضور والانصراف", key: "attendance", icon: Users, description: "سجل حضور وغياب الموظفين." },
];

interface ReportsClientProps {
  initialData: {
    accounts: Account[];
  }
}

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [selectedReportGroup, setSelectedReportGroup] = useState("financial");
  const [currentReport, setCurrentReport] = useState<{name: string; description: string; key: string} | null>(null);
  const { formatCurrency } = useCurrency();

  const trialBalanceData = useMemo(() => {
    const debitAccounts = initialData.accounts.filter(acc => acc.balance > 0);
    const creditAccounts = initialData.accounts.filter(acc => acc.balance < 0);
    const totalDebit = debitAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalCredit = creditAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    
    return { debitAccounts, creditAccounts, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [initialData.accounts]);
  
  const incomeStatementData = useMemo(() => {
    const revenues = initialData.accounts.filter(acc => acc.id.startsWith('4'));
    const expenses = initialData.accounts.filter(acc => acc.id.startsWith('5'));
    const totalRevenue = revenues.reduce((sum, acc) => sum + Math.abs(acc.balance), 0); // Balances are typically negative for revenue
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalExpenses;
    return { revenues, expenses, totalRevenue, totalExpenses, netIncome };
  }, [initialData.accounts]);


  const renderReportList = (reports: Array<{ name: string; icon: React.ElementType; description: string, key: string }>) => (
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
             <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setCurrentReport(report)}>
              <Eye className="me-1.5 h-3.5 w-3.5" /> عرض التقرير
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderReportContent = () => {
    if (!currentReport) return null;

    switch (currentReport.key) {
        case 'trialBalance':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Table>
                        <TableHeader><TableRow><TableHead>الحسابات المدينة</TableHead><TableHead className="text-left">الرصيد</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {trialBalanceData.debitAccounts.map(acc => (
                                <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(acc.balance) }}></TableCell></TableRow>
                            ))}
                        </TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي المدين</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(trialBalanceData.totalDebit) }}></TableCell></TableRow>
                    </Table>
                     <Table>
                        <TableHeader><TableRow><TableHead>الحسابات الدائنة</TableHead><TableHead className="text-left">الرصيد</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {trialBalanceData.creditAccounts.map(acc => (
                                <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(Math.abs(acc.balance)) }}></TableCell></TableRow>
                            ))}
                        </TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي الدائن</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(trialBalanceData.totalCredit) }}></TableCell></TableRow>
                    </Table>
                    {!trialBalanceData.isBalanced && <p className="text-destructive font-semibold col-span-2 text-center">تحذير: ميزان المراجعة غير متوازن!</p>}
                </div>
            );
        case 'incomeStatement':
             return (
                <div>
                    <h3 className="font-bold text-xl mb-2">الإيرادات</h3>
                    <Table>
                        <TableBody>
                            {incomeStatementData.revenues.map(acc => (
                                <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(Math.abs(acc.balance)) }}></TableCell></TableRow>
                            ))}
                        </TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي الإيرادات</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(incomeStatementData.totalRevenue) }}></TableCell></TableRow>
                    </Table>
                    <h3 className="font-bold text-xl mt-6 mb-2">المصروفات</h3>
                    <Table>
                        <TableBody>
                            {incomeStatementData.expenses.map(acc => (
                                <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(acc.balance) }}></TableCell></TableRow>
                            ))}
                        </TableBody>
                         <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي المصروفات</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(incomeStatementData.totalExpenses) }}></TableCell></TableRow>
                    </Table>
                    <CardFooter className="mt-6 p-4 bg-background border rounded-lg">
                        <div className="flex justify-between w-full text-lg font-bold">
                            <span>{incomeStatementData.netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}:</span>
                            <span className={incomeStatementData.netIncome >= 0 ? "text-green-600" : "text-destructive"} dangerouslySetInnerHTML={{ __html: formatCurrency(incomeStatementData.netIncome) }}></span>
                        </div>
                    </CardFooter>
                </div>
            );
        default:
            return <p className="text-muted-foreground text-center py-10">عرض هذا التقرير قيد التطوير.</p>;
    }
  };


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
                            <Label className="text-sm font-medium mb-1 block">النطاق الزمني</Label>
                            <DatePickerWithPresets mode="range" />
                        </div>
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
                    <div className="p-4 border rounded-md bg-muted/30">
                       {renderReportContent()}
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
      
      {selectedReportGroup === "financial" && renderReportList(financialReports)}
      {selectedReportGroup === "sales" && renderReportList(salesReports)}
      {selectedReportGroup === "inventory" && renderReportList(inventoryReports)}
      {selectedReportGroup === "hr" && renderReportList(hrReports)}
      
    </div>
  );
}

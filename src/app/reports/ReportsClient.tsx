
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart2, FileText, DollarSign, ShoppingCart, Package, Users, Download, Eye, Settings2, Filter, BarChartBig, PieChart, LineChart, GanttChartSquare, Clock, Wallet } from "lucide-react";
import { useCurrency } from '@/hooks/use-currency';

interface Account {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  balance: number;
}

interface ProductSale {
    name: string;
    quantity: number;
    total: number;
}

interface CustomerSale {
    name: string;
    total: number;
}

interface InventoryValuation {
    id: string;
    name: string;
    quantity: number;
    costPrice: number;
    totalValue: number;
}

interface Payroll {
    id: string;
    employeeId: string;
    monthYear: string;
    netSalary: number;
    status: string;
}

interface Attendance {
    id: string;
    employeeId: string;
    date: Date;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
}

const financialReports = [
  { name: "الميزانية العمومية", key: "balanceSheet", icon: FileText, description: "عرض المركز المالي للشركة في تاريخ محدد." },
  { name: "قائمة الدخل", key: "incomeStatement", icon: DollarSign, description: "ملخص الإيرادات والمصروفات خلال فترة معينة." },
  { name: "ميزان المراجعة", key: "trialBalance", icon: PieChart, description: "قائمة بجميع الحسابات وأرصدتها." },
  { name: "قائمة التدفقات النقدية", key: "cashFlow", icon: Wallet, description: "تتبع حركة النقد الداخل والخارج." },
];

const salesReports = [
  { name: "تقرير المبيعات حسب المنتج", key: "salesByProduct", icon: ShoppingCart, description: "تحليل مبيعات كل منتج على حدة." },
  { name: "تقرير المبيعات حسب العميل", key: "salesByCustomer", icon: Users, description: "عرض مبيعات كل عميل وأكثرهم شراءً." },
];

const inventoryReports = [
  { name: "تقرير تقييم المخزون", key: "inventoryValuation", icon: Package, description: "عرض قيمة المخزون الحالي." },
  { name: "تقرير حركة الأصناف", key: "itemMovement", icon: GanttChartSquare, description: "تتبع دخول وخروج الأصناف من المخازن." },
];

const hrReports = [
  { name: "تقرير كشوف المرتبات", key: "payroll", icon: Users, description: "ملخص الرواتب والخصومات والبدلات للموظفين." },
  { name: "تقرير الحضور والانصراف", key: "attendance", icon: Clock, description: "سجل حضور وغياب الموظفين." },
];

interface ReportsClientProps {
  initialData: {
    accounts: Account[];
    salesByProduct: ProductSale[];
    salesByCustomer: CustomerSale[];
    inventoryValuation: InventoryValuation[];
    payrolls: Payroll[];
    attendances: Attendance[];
    products: Array<{ id: string; name: string }>;
    customers: Array<{ id: string; name: string }>;
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
    const totalRevenue = revenues.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netIncome = totalRevenue - totalExpenses;
    return { revenues, expenses, totalRevenue, totalExpenses, netIncome };
  }, [initialData.accounts]);

  const balanceSheetData = useMemo(() => {
    const assets = initialData.accounts.filter(acc => acc.id.startsWith('1'));
    const liabilities = initialData.accounts.filter(acc => acc.id.startsWith('2'));
    const equity = initialData.accounts.filter(acc => acc.id.startsWith('3'));
    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + Math.abs(acc.balance), 0) + incomeStatementData.netIncome; // Add net income to equity
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, totalLiabilitiesAndEquity, netIncome: incomeStatementData.netIncome };
  }, [initialData.accounts, incomeStatementData.netIncome]);
  
  const cashFlowData = useMemo(() => {
    // Simplified version: operating activities are revenues and expenses
    return {
      operatingInflow: incomeStatementData.totalRevenue,
      operatingOutflow: incomeStatementData.totalExpenses,
      netCashFlow: incomeStatementData.totalRevenue - incomeStatementData.totalExpenses,
    };
  }, [incomeStatementData]);


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
        case 'balanceSheet':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-bold text-xl mb-2">الأصول</h3>
                        <Table>
                            <TableBody>
                                {balanceSheetData.assets.map(acc => (
                                    <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(acc.balance) }}></TableCell></TableRow>
                                ))}
                            </TableBody>
                            <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي الأصول</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(balanceSheetData.totalAssets) }}></TableCell></TableRow>
                        </Table>
                    </div>
                    <div>
                        <h3 className="font-bold text-xl mb-2">الخصوم وحقوق الملكية</h3>
                        <Table>
                            <TableBody>
                                {balanceSheetData.liabilities.map(acc => (
                                    <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(Math.abs(acc.balance)) }}></TableCell></TableRow>
                                ))}
                                 <TableRow className="font-semibold bg-muted/30"><TableCell>إجمالي الخصوم</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(balanceSheetData.totalLiabilities) }}></TableCell></TableRow>
                                {balanceSheetData.equity.map(acc => (
                                    <TableRow key={acc.id}><TableCell>{acc.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(Math.abs(acc.balance)) }}></TableCell></TableRow>
                                ))}
                                <TableRow className="bg-muted/30"><TableCell>أرباح (خسائر) الفترة</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(balanceSheetData.netIncome) }}></TableCell></TableRow>
                                <TableRow className="font-semibold bg-muted/30"><TableCell>إجمالي حقوق الملكية</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(balanceSheetData.totalEquity) }}></TableCell></TableRow>
                            </TableBody>
                            <TableRow className="font-bold bg-muted/50"><TableCell>إجمالي الخصوم وحقوق الملكية</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(balanceSheetData.totalLiabilitiesAndEquity) }}></TableCell></TableRow>
                        </Table>
                    </div>
                </div>
            );
        case 'cashFlow':
            return (
                 <div>
                    <h3 className="font-bold text-xl mb-2">التدفقات النقدية من الأنشطة التشغيلية</h3>
                    <Table>
                        <TableBody>
                            <TableRow><TableCell>المقبوضات من العملاء (الإيرادات)</TableCell><TableCell className="text-left text-green-600" dangerouslySetInnerHTML={{ __html: formatCurrency(cashFlowData.operatingInflow) }}></TableCell></TableRow>
                             <TableRow><TableCell>المدفوعات للموردين والمصروفات</TableCell><TableCell className="text-left text-destructive" dangerouslySetInnerHTML={{ __html: formatCurrency(cashFlowData.operatingOutflow) }}></TableCell></TableRow>
                        </TableBody>
                        <TableRow className="font-bold bg-muted/50"><TableCell>صافي التدفق النقدي من الأنشطة التشغيلية</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(cashFlowData.netCashFlow) }}></TableCell></TableRow>
                    </Table>
                    <p className="text-muted-foreground text-xs mt-2">ملاحظة: هذا عرض مبسط. قائمة التدفقات النقدية الكاملة تتضمن أنشطة استثمارية وتمويلية.</p>
                </div>
            );
        case 'salesByProduct':
            return (
                <Table>
                    <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead>الكمية المباعة</TableHead><TableHead className="text-left">إجمالي المبيعات</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialData.salesByProduct.map(p => (
                             <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell>{p.quantity}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(p.total) }}></TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        case 'salesByCustomer':
            return (
                <Table>
                    <TableHeader><TableRow><TableHead>العميل</TableHead><TableHead className="text-left">إجمالي المبيعات</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialData.salesByCustomer.map(c => (
                            <TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(c.total) }}></TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
         case 'inventoryValuation':
            return (
                <Table>
                    <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead>الكمية</TableHead><TableHead>تكلفة الوحدة</TableHead><TableHead className="text-left">القيمة الإجمالية</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialData.inventoryValuation.map(p => (
                             <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.quantity}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(p.costPrice) }}></TableCell><TableCell className="text-left" dangerouslySetInnerHTML={{ __html: formatCurrency(p.totalValue) }}></TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        case 'payroll':
             return (
                <Table>
                    <TableHeader><TableRow><TableHead>الشهر</TableHead><TableHead>معرف الموظف</TableHead><TableHead>صافي الراتب</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialData.payrolls.map(p => (
                             <TableRow key={p.id}><TableCell>{p.monthYear}</TableCell><TableCell>{p.employeeId}</TableCell><TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(p.netSalary) }}></TableCell><TableCell>{p.status}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        case 'attendance':
             return (
                <Table>
                    <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>معرف الموظف</TableHead><TableHead>الحالة</TableHead><TableHead>الدخول</TableHead><TableHead>الخروج</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {initialData.attendances.map(a => (
                             <TableRow key={a.id}><TableCell>{a.date.toLocaleDateString('ar-SA')}</TableCell><TableCell>{a.employeeId}</TableCell><TableCell>{a.status}</TableCell><TableCell>{a.checkIn || '-'}</TableCell><TableCell>{a.checkOut || '-'}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
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

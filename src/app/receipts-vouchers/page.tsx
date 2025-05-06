"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Printer, Search, Filter, FileDown, Banknote, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets"; // Assuming this component exists

// Mock data - replace with actual data fetching
const receiptVoucherData = [
  { id: "RC001", date: "2024-07-15", type: "سند قبض", method: "نقدي", party: "عميل أ", amount: "5,000 SAR", status: "مرحل", branch: "الرئيسي" },
  { id: "PV001", date: "2024-07-16", type: "سند صرف", method: "بنكي", party: "مورد س", amount: "12,000 SAR", status: "مرحل", branch: "الرياض" },
  { id: "RC002", date: "2024-07-18", type: "سند قبض", method: "بنكي", party: "عميل ب", amount: "2,500 SAR", status: "مسودة", branch: "جدة" },
  { id: "PV002", date: "2024-07-20", type: "سند صرف", method: "نقدي", party: "مصروفات عامة", amount: "300 SAR", status: "مرحل", branch: "الرئيسي" },
];

const treasuryMovementData = [
    { date: "2024-07-20", type: "إيداع", description: "إيداع نقدي من مبيعات", amount: "1,500 SAR", balance: "101,500 SAR" },
    { date: "2024-07-20", type: "سحب", description: "سند صرف #PV002", amount: "300 SAR", balance: "101,200 SAR" },
    { date: "2024-07-19", type: "إيداع", description: "تحصيل من عميل أ", amount: "2,000 SAR", balance: "101,500 SAR" },
];


export default function ReceiptsVouchersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">سندات القبض والصرف</h1>
        <div className="flex gap-2">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إنشاء سند قبض
            </Button>
            <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إنشاء سند صرف
            </Button>
        </div>
      </div>

      <Tabs defaultValue="allVouchers" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="allVouchers" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">جميع السندات</TabsTrigger>
          <TabsTrigger value="treasuryMovement" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">حركة الخزينة اليومية</TabsTrigger>
        </TabsList>

        <TabsContent value="allVouchers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة السندات</CardTitle>
              <CardDescription>إدارة جميع سندات القبض والصرف النقدية والبنكية. الربط مع الحسابات والعملاء/الموردين.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في السندات..." className="pl-10 w-full sm:w-64" />
                </div>
                <div className="flex gap-2 flex-wrap">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                        <Filter className="ms-2 h-4 w-4" /> تصفية النوع
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>تصفية حسب نوع السند</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked>سند قبض</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem>سند صرف</DropdownMenuCheckboxItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuLabel>تصفية حسب طريقة الدفع</DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <DropdownMenuCheckboxItem>نقدي</DropdownMenuCheckboxItem>
                       <DropdownMenuCheckboxItem>بنكي</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DatePickerWithPresets />
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                    <FileDown className="ms-2 h-4 w-4" /> تصدير
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم السند</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الطريقة</TableHead>
                      <TableHead>الجهة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptVoucherData.map((voucher) => (
                      <TableRow key={voucher.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{voucher.id}</TableCell>
                        <TableCell>{voucher.date}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.type === "سند قبض" ? "default" : "secondary"} className="whitespace-nowrap bg-opacity-80">
                            {voucher.type === "سند قبض" ? <Banknote className="inline ms-1 h-3 w-3"/> : <Building className="inline ms-1 h-3 w-3"/>}
                            {voucher.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{voucher.method}</TableCell>
                        <TableCell>{voucher.party}</TableCell>
                        <TableCell className="whitespace-nowrap">{voucher.amount}</TableCell>
                        <TableCell>{voucher.branch}</TableCell>
                        <TableCell>
                          <Badge variant={voucher.status === "مرحل" ? "default" : "outline"} className="whitespace-nowrap">
                            {voucher.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {voucher.status === "مسودة" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
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

        <TabsContent value="treasuryMovement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>حركة الخزينة اليومية</CardTitle>
              <CardDescription>مراجعة يومية لحركة الخزينة والإيداعات والسحوبات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <DatePickerWithPresets />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>نوع الحركة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treasuryMovementData.map((movement, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell>{movement.date}</TableCell>
                        <TableCell>
                            <Badge variant={movement.type === "إيداع" ? "default" : "destructive"} className="bg-opacity-70">
                                {movement.type}
                            </Badge>
                        </TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.amount}</TableCell>
                        <TableCell className="whitespace-nowrap">{movement.balance}</TableCell>
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


"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FilePlus, FileCheck, PackageSearch, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Eye } from "lucide-react";

// Mock data
const purchaseOrders = [
  { id: "PO001", supplier: "مورد التقنية الحديثة", date: "2024-07-10", expectedDelivery: "2024-07-25", totalAmount: "30,000 SAR", status: "معتمد" },
  { id: "PO002", supplier: "مورد المواد الخام", date: "2024-07-15", expectedDelivery: "2024-08-01", totalAmount: "18,000 SAR", status: "مسودة" },
  { id: "PO003", supplier: "مورد الخدمات اللوجستية", date: "2024-06-20", expectedDelivery: "2024-07-05", totalAmount: "7,500 SAR", status: "مستلم جزئياً" },
  { id: "PO004", supplier: "مورد الأثاث المكتبي", date: "2024-05-10", expectedDelivery: "2024-05-25", totalAmount: "25,000 SAR", status: "مستلم بالكامل" },
];

const supplierInvoices = [
  { id: "INV-S001", poId: "PO001", supplier: "مورد التقنية الحديثة", date: "2024-07-26", dueDate: "2024-08-26", amount: "30,000 SAR", status: "غير مدفوع" },
  { id: "INV-S002", poId: "PO004", supplier: "مورد الأثاث المكتبي", date: "2024-05-28", dueDate: "2024-06-28", amount: "25,000 SAR", status: "مدفوع" },
];

const receivedItems = [
  { id: "GRN001", poId: "PO001", supplier: "مورد التقنية الحديثة", date: "2024-07-25", items: [{ name: "لابتوب Dell XPS 15", qty: 5 }, { name: "شاشة 27 بوصة", qty: 5 }], status: "مستلم" },
  { id: "GRN002", poId: "PO003", supplier: "مورد الخدمات اللوجستية", date: "2024-07-04", items: [{ name: "خدمة شحن دولي", qty: 1 }], status: "مستلم" },
];


export default function PurchasesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المشتريات</h1>
        <div className="flex gap-2">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إنشاء أمر شراء جديد
            </Button>
             <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إضافة فاتورة مورد
            </Button>
        </div>
      </div>

      <Tabs defaultValue="purchaseOrders" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="purchaseOrders" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> أوامر الشراء (PO)
          </TabsTrigger>
          <TabsTrigger value="supplierInvoices" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileCheck className="inline-block me-2 h-4 w-4" /> فواتير الموردين
          </TabsTrigger>
          <TabsTrigger value="receivedItems" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <PackageSearch className="inline-block me-2 h-4 w-4" /> عمليات الاستلام (GRN)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchaseOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة أوامر الشراء</CardTitle>
              <CardDescription>إنشاء ومتابعة أوامر الشراء، الموافقات، وحالة التسليم.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في أوامر الشراء..." className="pl-10 w-full sm:w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="ms-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>معتمد</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مستلم جزئياً</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مستلم بالكامل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم أمر الشراء</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>تاريخ الأمر</TableHead>
                      <TableHead>تاريخ التسليم المتوقع</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{po.id}</TableCell>
                        <TableCell>{po.supplier}</TableCell>
                        <TableCell>{po.date}</TableCell>
                        <TableCell>{po.expectedDelivery}</TableCell>
                        <TableCell>{po.totalAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              po.status === "معتمد" ? "default" :
                              po.status === "مستلم بالكامل" ? "default" :
                              po.status === "مسودة" ? "outline" : "secondary"
                            }
                            className="whitespace-nowrap"
                          >
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {po.status === "مسودة" && (
                            <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </>
                          )}
                           {po.status === "معتمد" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل استلام">
                                <PackageSearch className="h-4 w-4 text-green-600" />
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

        <TabsContent value="supplierInvoices">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير الموردين</CardTitle>
              <CardDescription>تسجيل ومتابعة فواتير الموردين، وربطها بأوامر الشراء، وتتبع حالة الدفع.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برقم الفاتورة أو المورد..." className="pl-10 w-full sm:w-64" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="ms-2 h-4 w-4" /> تصفية حالة الدفع
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>تصفية حسب حالة الدفع</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>غير مدفوع</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مدفوع جزئياً</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متأخر</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>أمر الشراء المرتبط</TableHead>
                      <TableHead>المورد</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>حالة الدفع</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.poId}</TableCell>
                        <TableCell>{invoice.supplier}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>{invoice.amount}</TableCell>
                        <TableCell>
                           <Badge variant={invoice.status === "مدفوع" ? "default" : "destructive"}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الفاتورة">
                            <FileText className="h-4 w-4" />
                          </Button>
                           {invoice.status === "غير مدفوع" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل دفعة">
                                <CheckCircle className="h-4 w-4 text-green-600" />
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
        
        <TabsContent value="receivedItems">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>عمليات الاستلام (Good Received Note - GRN)</CardTitle>
                    <CardDescription>تسجيل ومتابعة البضائع والخدمات المستلمة من الموردين.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                        <div className="relative w-full sm:w-auto grow sm:grow-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="بحث برقم الاستلام أو أمر الشراء..." className="pl-10 w-full sm:w-72" />
                        </div>
                        <DatePickerWithPresets mode="range" />
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>رقم الاستلام</TableHead>
                            <TableHead>أمر الشراء</TableHead>
                            <TableHead>المورد</TableHead>
                            <TableHead>تاريخ الاستلام</TableHead>
                            <TableHead>الحالة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receivedItems.map((grn) => (
                            <TableRow key={grn.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{grn.id}</TableCell>
                                <TableCell>{grn.poId}</TableCell>
                                <TableCell>{grn.supplier}</TableCell>
                                <TableCell>{grn.date}</TableCell>
                                <TableCell>
                                    <Badge variant={grn.status === "مستلم" ? "default" : "outline"}>{grn.status}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الاستلام">
                                    <Eye className="h-4 w-4" />
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

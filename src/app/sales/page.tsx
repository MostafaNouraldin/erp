
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, FileSignature, FilePlus, UsersIcon, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, Send, Printer } from "lucide-react"; // Changed Users to UsersIcon

// Mock data
const quotations = [
  { id: "QT001", customer: "شركة الأمل", date: "2024-07-01", expiryDate: "2024-07-15", totalAmount: "15,500 SAR", status: "مرسل" },
  { id: "QT002", customer: "مؤسسة النجاح", date: "2024-07-05", expiryDate: "2024-07-20", totalAmount: "8,200 SAR", status: "مقبول" },
  { id: "QT003", customer: "شركة التطور", date: "2024-07-10", expiryDate: "2024-07-25", totalAmount: "22,000 SAR", status: "مسودة" },
];

const salesOrders = [
  { id: "SO001", quoteId: "QT002", customer: "مؤسسة النجاح", date: "2024-07-06", deliveryDate: "2024-07-20", totalAmount: "8,200 SAR", status: "قيد التنفيذ" },
  { id: "SO002", customer: "مؤسسة الإبداع", date: "2024-07-12", deliveryDate: "2024-07-28", totalAmount: "12,000 SAR", status: "مؤكد" },
];

const invoices = [
  { id: "INV-C001", orderId: "SO001", customer: "مؤسسة النجاح", date: "2024-07-20", dueDate: "2024-08-20", totalAmount: "8,200 SAR", status: "مدفوع" },
  { id: "INV-C002", customer: "شركة الأمل", date: "2024-07-15", dueDate: "2024-08-15", totalAmount: "15,500 SAR", status: "غير مدفوع" },
];

const customers = [
  { id: "CUST001", name: "شركة الأمل", email: "contact@alamal.com", phone: "0501234567", type: "شركة", balance: "15,500 SAR" },
  { id: "CUST002", name: "مؤسسة النجاح", email: "info@najjsuccess.org", phone: "0559876543", type: "مؤسسة", balance: "0 SAR" },
  { id: "CUST003", name: "أحمد خالد (فرد)", email: "ahmed.k@mail.com", phone: "0533332222", type: "فرد", balance: "0 SAR" },
];


export default function SalesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">المبيعات</h1>
        <div className="flex gap-2">
            <Button className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إنشاء عرض سعر جديد
            </Button>
             <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="ms-2 h-4 w-4" /> إنشاء فاتورة مبيعات
            </Button>
        </div>
      </div>

      <Tabs defaultValue="quotations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="quotations" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileSignature className="inline-block me-2 h-4 w-4" /> عروض الأسعار
          </TabsTrigger>
          <TabsTrigger value="salesOrders" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShoppingCart className="inline-block me-2 h-4 w-4" /> أوامر البيع
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FilePlus className="inline-block me-2 h-4 w-4" /> فواتير المبيعات
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <UsersIcon className="inline-block me-2 h-4 w-4" /> العملاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة عروض الأسعار</CardTitle>
              <CardDescription>إنشاء، إرسال، وتتبع حالة عروض الأسعار المقدمة للعملاء.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في عروض الأسعار..." className="pl-10 w-full sm:w-64" />
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
                    <DropdownMenuCheckboxItem>مرسل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مقبول</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرفوض</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>منتهي الصلاحية</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العرض</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ العرض</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((qt) => (
                      <TableRow key={qt.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{qt.id}</TableCell>
                        <TableCell>{qt.customer}</TableCell>
                        <TableCell>{qt.date}</TableCell>
                        <TableCell>{qt.expiryDate}</TableCell>
                        <TableCell>{qt.totalAmount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              qt.status === "مقبول" ? "default" :
                              qt.status === "مرسل" ? "secondary" :
                              "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {qt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {qt.status === "مسودة" && (
                            <>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل">
                                <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إرسال للعميل">
                                <Send className="h-4 w-4 text-primary" />
                               </Button>
                            </>
                          )}
                           {qt.status === "مرسل" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحويل إلى أمر بيع">
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

        <TabsContent value="salesOrders">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>أوامر البيع</CardTitle>
              <CardDescription>إدارة أوامر البيع المؤكدة، وتتبع حالة تنفيذها وتسليمها.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="ms-2 h-4 w-4" /> إنشاء أمر بيع مباشر
                    </Button>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في أوامر البيع..." className="pl-10 w-full sm:w-64" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>عرض السعر (إن وجد)</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الأمر</TableHead>
                      <TableHead>تاريخ التسليم</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((so) => (
                      <TableRow key={so.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{so.id}</TableCell>
                        <TableCell>{so.quoteId || "-"}</TableCell>
                        <TableCell>{so.customer}</TableCell>
                        <TableCell>{so.date}</TableCell>
                        <TableCell>{so.deliveryDate}</TableCell>
                        <TableCell>{so.totalAmount}</TableCell>
                        <TableCell>
                            <Badge variant={so.status === "مؤكد" ? "default" : "secondary"}>{so.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض تفاصيل الأمر">
                                <FileText className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إنشاء فاتورة">
                                <FilePlus className="h-4 w-4 text-primary" />
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
        
        <TabsContent value="invoices">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>فواتير المبيعات</CardTitle>
              <CardDescription>إصدار ومتابعة فواتير المبيعات، وحالة الدفع من العملاء.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في الفواتير..." className="pl-10 w-full sm:w-64" />
                    </div>
                    <DatePickerWithPresets mode="range" />
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>أمر البيع (إن وجد)</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ الفاتورة</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>المبلغ الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{inv.id}</TableCell>
                        <TableCell>{inv.orderId || "-"}</TableCell>
                        <TableCell>{inv.customer}</TableCell>
                        <TableCell>{inv.date}</TableCell>
                        <TableCell>{inv.dueDate}</TableCell>
                        <TableCell>{inv.totalAmount}</TableCell>
                        <TableCell>
                            <Badge variant={inv.status === "مدفوع" ? "default" : "destructive"}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الفاتورة">
                                <Printer className="h-4 w-4" />
                            </Button>
                             {inv.status === "غير مدفوع" && (
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

        <TabsContent value="customers">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة العملاء</CardTitle>
              <CardDescription>سجل بيانات العملاء، تاريخ معاملاتهم، وأرصدتهم.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="ms-2 h-4 w-4" /> إضافة عميل جديد
                    </Button>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث باسم العميل أو الرقم..." className="pl-10 w-full sm:w-64" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم العميل</TableHead>
                      <TableHead>اسم العميل</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الرصيد الحالي</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((cust) => (
                      <TableRow key={cust.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{cust.id}</TableCell>
                        <TableCell>{cust.name}</TableCell>
                        <TableCell>{cust.email}</TableCell>
                        <TableCell>{cust.phone}</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{cust.type}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{cust.balance}</TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض ملف العميل">
                                <FileText className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل بيانات العميل">
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
      </Tabs>
    </div>
  );
}

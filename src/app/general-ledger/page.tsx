import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data - replace with actual data fetching
const chartOfAccountsData = [
  { id: "1000", name: "الأصول", type: "رئيسي", balance: "1,500,000 SAR" },
  { id: "1010", name: "النقدية وما في حكمها", type: "فرعي", parent: "1000", balance: "250,000 SAR" },
  { id: "1011", name: "صندوق الفرع الرئيسي", type: "تفصيلي", parent: "1010", balance: "100,000 SAR" },
  { id: "2000", name: "الخصوم", type: "رئيسي", balance: "800,000 SAR" },
  { id: "3000", name: "حقوق الملكية", type: "رئيسي", balance: "700,000 SAR" },
];

const journalEntriesData = [
  { id: "JV001", date: "2024-07-01", description: "قيد إثبات رأس المال", amount: "500,000 SAR", status: "مرحل" },
  { id: "JV002", date: "2024-07-05", description: "شراء أثاث مكتبي", amount: "15,000 SAR", status: "مرحل" },
  { id: "JV003", date: "2024-07-10", description: "مصروفات كهرباء", amount: "1,200 SAR", status: "مسودة" },
];

export default function GeneralLedgerPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">الحسابات العامة</h1>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" /> إنشاء قيد يومية جديد
        </Button>
      </div>

      <Tabs defaultValue="chartOfAccounts">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="chartOfAccounts">شجرة الحسابات</TabsTrigger>
          <TabsTrigger value="journalEntries">القيود اليومية</TabsTrigger>
          <TabsTrigger value="financialReports">التقارير المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="chartOfAccounts">
          <Card>
            <CardHeader>
              <CardTitle>شجرة الحسابات</CardTitle>
              <CardDescription>إدارة وتتبع هيكل الحسابات المالية للشركة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-end">
                <Button variant="outline">
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة حساب جديد
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الحساب</TableHead>
                    <TableHead>اسم الحساب</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحساب الرئيسي</TableHead>
                    <TableHead>الرصيد الحالي</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartOfAccountsData.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.id}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant={account.type === "رئيسي" ? "default" : account.type === "فرعي" ? "secondary" : "outline"}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.parent || "-"}</TableCell>
                      <TableCell>{account.balance}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="ml-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journalEntries">
          <Card>
            <CardHeader>
              <CardTitle>القيود اليومية</CardTitle>
              <CardDescription>تسجيل ومراجعة جميع المعاملات المالية.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم القيد</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntriesData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.amount}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "مرحل" ? "default" : "outline"}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        <Button variant="ghost" size="icon" className="ml-2" title="عرض">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="ml-2" title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {entry.status === "مسودة" && (
                          <Button variant="ghost" size="icon" className="text-destructive" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financialReports">
          <Card>
            <CardHeader>
              <CardTitle>التقارير المالية</CardTitle>
              <CardDescription>عرض وإنشاء التقارير المالية الأساسية.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                "الميزانية العمومية",
                "قائمة الدخل",
                "قائمة التدفقات النقدية",
                "ميزان المراجعة",
              ].map((reportName) => (
                <Card key={reportName} className="flex flex-col items-center justify-center p-6 hover:shadow-lg transition-shadow">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-lg mb-2 text-center">{reportName}</CardTitle>
                  <Button variant="outline" className="w-full">
                    <Download className="ml-2 h-4 w-4" /> عرض/تحميل
                  </Button>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


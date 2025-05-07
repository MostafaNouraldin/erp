
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Users, ShieldCheck, SlidersHorizontal, PlusCircle, Edit, Trash2, Save, Search, KeyRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge"; // Added import for Badge

// Mock data
const users = [
  { id: "USR001", name: "أحمد علي", email: "ahmed.ali@example.com", role: "مدير النظام", status: "نشط", avatarUrl: "https://picsum.photos/100/100?random=10" },
  { id: "USR002", name: "فاطمة خالد", email: "fatima.k@example.com", role: "محاسب", status: "نشط", avatarUrl: "https://picsum.photos/100/100?random=11" },
  { id: "USR003", name: "يوسف حسن", email: "youssef.h@example.com", role: "موظف مبيعات", status: "غير نشط", avatarUrl: "https://picsum.photos/100/100?random=12" },
];

const roles = [
  { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة على النظام." },
  { id: "ROLE002", name: "محاسب", description: "صلاحيات على وحدات الحسابات والمالية." },
  { id: "ROLE003", name: "موظف مبيعات", description: "صلاحيات على وحدة المبيعات وعروض الأسعار." },
  { id: "ROLE004", name: "مدير مخزون", description: "صلاحيات على وحدة المخزون والمستودعات." },
];

const modules = ["الحسابات", "المبيعات", "المشتريات", "المخزون", "الموارد البشرية", "التقارير", "الإعدادات"];
const permissions = ["عرض", "إنشاء", "تعديل", "حذف", "موافقة"];


export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الإعدادات</h1>
        {/* Optional: Add a global save button or context-specific actions here */}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <SettingsIcon className="inline-block me-2 h-4 w-4" /> الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة المستخدمين
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShieldCheck className="inline-block me-2 h-4 w-4" /> الأدوار والصلاحيات
          </TabsTrigger>
          <TabsTrigger value="customization" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <SlidersHorizontal className="inline-block me-2 h-4 w-4" /> تخصيص النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إعدادات النظام العامة</CardTitle>
              <CardDescription>تكوين المعلومات الأساسية للشركة، إعدادات اللغة، والعملة، والضرائب.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input id="companyName" defaultValue="شركة المستقبل للتكنولوجيا" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">عنوان الشركة</Label>
                  <Input id="companyAddress" defaultValue="الرياض، المملكة العربية السعودية" className="bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label htmlFor="systemLanguage">لغة النظام الافتراضية</Label>
                  <Select dir="rtl" defaultValue="ar">
                    <SelectTrigger id="systemLanguage" className="bg-background">
                      <SelectValue placeholder="اختر لغة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة الأساسية</Label>
                  <Select dir="rtl" defaultValue="SAR">
                    <SelectTrigger id="currency" className="bg-background">
                      <SelectValue placeholder="اختر عملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">معدل ضريبة القيمة المضافة (%)</Label>
                <Input id="taxRate" type="number" defaultValue="15" className="bg-background" />
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Switch id="autoBackup" defaultChecked />
                <Label htmlFor="autoBackup">تمكين النسخ الاحتياطي التلقائي</Label>
              </div>
              <Button className="shadow-md hover:shadow-lg transition-shadow">
                <Save className="ms-2 h-4 w-4" /> حفظ الإعدادات العامة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>إضافة، تعديل، وحذف حسابات المستخدمين وتعيين الأدوار لهم.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="ms-2 h-4 w-4" /> إضافة مستخدم جديد
                    </Button>
                    <div className="relative w-full sm:w-auto grow sm:grow-0">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث باسم المستخدم أو البريد..." className="pr-10 w-full sm:w-64 bg-background" />
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person" />
                                <AvatarFallback>{user.name.substring(0,1)}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "نشط" ? "default" : "outline"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المستخدم">
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إعادة تعيين كلمة المرور">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title={user.status === "نشط" ? "تعطيل الحساب" : "تفعيل الحساب"}>
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
        
        <TabsContent value="roles">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>الأدوار والصلاحيات</CardTitle>
              <CardDescription>إنشاء وتعديل الأدوار وتحديد الصلاحيات لكل دور على وحدات النظام المختلفة.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Button className="shadow-md hover:shadow-lg transition-shadow">
                        <PlusCircle className="ms-2 h-4 w-4" /> إضافة دور جديد
                    </Button>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">قائمة الأدوار</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {roles.map(role => (
                                <Card key={role.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{role.name}</p>
                                            <p className="text-xs text-muted-foreground">{role.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">صلاحيات الدور المحدد (مثال: محاسب)</h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto border p-4 rounded-md bg-background">
                            {modules.map(moduleName => (
                                <div key={moduleName}>
                                    <h4 className="font-medium mb-1.5">{moduleName}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                        {permissions.map(permission => (
                                            <div key={`${moduleName}-${permission}`} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                <Checkbox id={`${moduleName}-${permission}`} defaultChecked={Math.random() > 0.5} />
                                                <Label htmlFor={`${moduleName}-${permission}`} className="text-sm font-normal">{permission}</Label>
                                            </div>
                                        ))}
                                    </div>
                                     {moduleName !== modules[modules.length -1] && <hr className="my-3"/>}
                                </div>
                            ))}
                        </div>
                         <Button className="mt-4 shadow-md hover:shadow-lg transition-shadow w-full">
                            <Save className="ms-2 h-4 w-4" /> حفظ صلاحيات الدور
                        </Button>
                    </div>
                 </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customization">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>تخصيص النظام</CardTitle>
              <CardDescription>تعديل مظهر النظام، إضافة حقول مخصصة، وإدارة التكامل مع خدمات أخرى.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="themeColor">لون الواجهة الرئيسي</Label>
                <div className="flex gap-2">
                    {/* Placeholder for color pickers */}
                    <Button variant="outline" style={{backgroundColor: "hsl(var(--primary))"}} className="h-10 w-10 p-0 border-2 border-border shadow-sm"></Button>
                    <Button variant="outline" style={{backgroundColor: "#3B82F6"}} className="h-10 w-10 p-0 border-2 border-border shadow-sm"></Button>
                    <Button variant="outline" style={{backgroundColor: "#10B981"}} className="h-10 w-10 p-0 border-2 border-border shadow-sm"></Button>
                    <Button variant="outline" style={{backgroundColor: "#F59E0B"}} className="h-10 w-10 p-0 border-2 border-border shadow-sm"></Button>
                    <Input type="color" defaultValue="#008080" className="w-12 h-10 p-1 bg-background"/>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="logoUpload">شعار الشركة</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-md">
                        <AvatarImage src="https://picsum.photos/200/200?random=1" alt="شعار الشركة الحالي" data-ai-hint="company logo"/>
                        <AvatarFallback>ERP</AvatarFallback>
                    </Avatar>
                    <Input id="logoUpload" type="file" className="bg-background" />
                </div>
              </div>
              <div className="border p-4 rounded-md">
                <h4 className="font-semibold mb-2">إدارة الحقول المخصصة</h4>
                <p className="text-sm text-muted-foreground mb-3">إضافة حقول إضافية لوحدات مثل العملاء، المنتجات، إلخ.</p>
                <Button variant="secondary" className="shadow-sm hover:shadow-md">إدارة الحقول</Button>
              </div>
              <div className="border p-4 rounded-md">
                <h4 className="font-semibold mb-2">التكامل مع خدمات خارجية (API)</h4>
                <p className="text-sm text-muted-foreground mb-3">ربط النظام مع بوابات الدفع، خدمات الشحن، وغيرها.</p>
                <Button variant="secondary" className="shadow-sm hover:shadow-md">إعدادات التكامل</Button>
              </div>
               <Button className="shadow-md hover:shadow-lg transition-shadow">
                <Save className="ms-2 h-4 w-4" /> حفظ إعدادات التخصيص
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


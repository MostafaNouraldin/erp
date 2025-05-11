
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponentClass, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Mock data
const initialUsers = [
  { id: "USR001", name: "أحمد علي", email: "ahmed.ali@example.com", roleId: "ROLE001", status: "نشط", avatarUrl: "https://picsum.photos/100/100?random=10" },
  { id: "USR002", name: "فاطمة خالد", email: "fatima.k@example.com", roleId: "ROLE002", status: "نشط", avatarUrl: "https://picsum.photos/100/100?random=11" },
  { id: "USR003", name: "يوسف حسن", email: "youssef.h@example.com", roleId: "ROLE003", status: "غير نشط", avatarUrl: "https://picsum.photos/100/100?random=12" },
];

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const initialRoles: Role[] = [
  { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة على النظام.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "sales.view", "sales.create", "sales.edit", "sales.delete", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "hr.view", "hr.create", "hr.edit", "hr.delete", "settings.view", "settings.edit"] },
  { id: "ROLE002", name: "محاسب", description: "صلاحيات على وحدات الحسابات والمالية.", permissions: ["accounting.view", "accounting.create", "accounting.edit"] },
  { id: "ROLE003", name: "موظف مبيعات", description: "صلاحيات على وحدة المبيعات وعروض الأسعار.", permissions: ["sales.view", "sales.create"] },
  { id: "ROLE004", name: "مدير مخزون", description: "صلاحيات على وحدة المخزون والمستودعات.", permissions: ["inventory.view", "inventory.create", "inventory.edit"] },
];

const modules = ["الحسابات", "المبيعات", "المشتريات", "المخزون", "الموارد البشرية", "التقارير", "الإعدادات"];
const permissionsMap: { [key: string]: string[] } = {
  "الحسابات": ["view", "create", "edit", "delete", "approve"],
  "المبيعات": ["view", "create", "edit", "delete", "send_quote"],
  "المشتريات": ["view", "create", "edit", "delete", "approve_po"],
  "المخزون": ["view", "create", "edit", "delete", "adjust_stock"],
  "الموارد البشرية": ["view", "create_employee", "edit_employee", "run_payroll"],
  "التقارير": ["view_financial", "view_sales", "view_inventory", "view_hr"],
  "الإعدادات": ["view", "edit_general", "manage_users", "manage_roles"],
};

const allPermissions = modules.flatMap(module => 
  permissionsMap[module]?.map(permission => `${module.toLowerCase().replace(/\s+/g, '_')}.${permission}`) || []
);


const userSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم المستخدم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    roleId: z.string().min(1, "الدور مطلوب"),
    status: z.enum(["نشط", "غير نشط"]).default("نشط"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
    avatarUrl: z.string().url().optional(),
});
type UserFormValues = z.infer<typeof userSchema>;

const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الدور مطلوب"),
    description: z.string().min(1, "وصف الدور مطلوب"),
});
type RoleFormValues = z.infer<typeof roleSchema>;


export default function SettingsPage() {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRolesData] = useState<Role[]>(initialRoles); // Renamed to setRolesData
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [showManageUserDialog, setShowManageUserDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserFormValues | null>(null);
  const [showManageRoleDialog, setShowManageRoleDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const { toast } = useToast();

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", roleId: "", status: "نشط" },
  });

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (userToEdit) userForm.reset(userToEdit);
    else userForm.reset({ name: "", email: "", roleId: "", status: "نشط" });
  }, [userToEdit, userForm, showManageUserDialog]);

  useEffect(() => {
    if (roleToEdit) {
        roleForm.reset({ id: roleToEdit.id, name: roleToEdit.name, description: roleToEdit.description });
        setSelectedRolePermissions(roleToEdit.permissions);
        setSelectedRole(roleToEdit);
    } else {
        roleForm.reset({ name: "", description: "" });
        setSelectedRolePermissions([]);
        setSelectedRole(null);
    }
  }, [roleToEdit, roleForm, showManageRoleDialog]);

  const handleUserSubmit = (values: UserFormValues) => {
    if (userToEdit) {
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...values, id: userToEdit.id, avatarUrl: u.avatarUrl } : u));
      toast({ title: "تم التعديل", description: `تم تعديل بيانات المستخدم ${values.name}.` });
    } else {
      setUsers(prev => [...prev, { ...values, id: `USR${Date.now()}`, avatarUrl: "https://picsum.photos/100/100?random=" + Date.now() }]);
      toast({ title: "تمت الإضافة", description: `تم إضافة المستخدم ${values.name} بنجاح.` });
    }
    setShowManageUserDialog(false);
    setUserToEdit(null);
  };

  const handleRoleSubmit = (values: RoleFormValues) => {
    const finalValues = { ...values, permissions: selectedRolePermissions };
    if (roleToEdit) {
      setRolesData(prev => prev.map(role => role.id === roleToEdit.id ? { ...finalValues, id: roleToEdit.id! } : role));
      toast({ title: "تم التعديل", description: `تم تعديل الدور ${values.name}.` });
    } else {
      setRolesData(prev => [...prev, { ...finalValues, id: `ROLE${Date.now()}` }]);
      toast({ title: "تمت الإضافة", description: `تم إضافة الدور ${values.name} بنجاح.` });
    }
    setShowManageRoleDialog(false);
    setRoleToEdit(null);
    setSelectedRolePermissions([]);
    setSelectedRole(null);
  };

  const handleSelectRoleForPermissions = (role: Role) => {
    setSelectedRole(role);
    setSelectedRolePermissions(role.permissions);
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean | string) => {
    if (checked) {
      setSelectedRolePermissions(prev => [...prev, permissionKey]);
    } else {
      setSelectedRolePermissions(prev => prev.filter(p => p !== permissionKey));
    }
  };

  const handleSaveRolePermissions = () => {
    if (selectedRole) {
      setRolesData(prevRoles =>
        prevRoles.map(r =>
          r.id === selectedRole.id ? { ...r, permissions: selectedRolePermissions } : r
        )
      );
      toast({ title: "تم الحفظ", description: `تم حفظ صلاحيات الدور ${selectedRole.name}.` });
    }
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الإعدادات</h1>
      </div>

      <Tabs defaultValue="general" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
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
                <Save className="me-2 h-4 w-4" /> حفظ الإعدادات العامة
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
                    <Dialog open={showManageUserDialog} onOpenChange={(isOpen) => {setShowManageUserDialog(isOpen); if(!isOpen) setUserToEdit(null);}}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setUserToEdit(null); userForm.reset(); setShowManageUserDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إضافة مستخدم جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{userToEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle></DialogHeader>
                            <Form {...userForm}>
                                <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4 py-4">
                                    <FormField control={userForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المستخدم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={userForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={userForm.control} name="roleId" render={({ field }) => ( <FormItem><FormLabel>الدور</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger></FormControl>
                                            <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )}/>
                                     {!userToEdit && <FormField control={userForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )}/>}
                                     <FormField control={userForm.control} name="status" render={({ field }) => ( <FormItem><FormLabel>الحالة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="نشط">نشط</SelectItem><SelectItem value="غير نشط">غير نشط</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem> )}/>
                                    <DialogFooter>
                                        <Button type="submit">{userToEdit ? "حفظ التعديلات" : "إضافة المستخدم"}</Button>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
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
                        <TableCell>{roles.find(r => r.id === user.roleId)?.name}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "نشط" ? "default" : "outline"}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المستخدم" onClick={() => {setUserToEdit(user); setShowManageUserDialog(true);}}>
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
                    <Dialog open={showManageRoleDialog} onOpenChange={(isOpen) => {setShowManageRoleDialog(isOpen); if(!isOpen) {setRoleToEdit(null); setSelectedRole(null); setSelectedRolePermissions([]); }}}>
                         <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setRoleToEdit(null); roleForm.reset(); setSelectedRolePermissions([]); setSelectedRole(null); setShowManageRoleDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إضافة دور جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{roleToEdit ? "تعديل دور" : "إضافة دور جديد"}</DialogTitle></DialogHeader>
                            <Form {...roleForm}>
                                <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4 py-4">
                                    <FormField control={roleForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم الدور</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={roleForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>وصف الدور</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                    <DialogFooter>
                                        <Button type="submit">{roleToEdit ? "حفظ التعديلات" : "إضافة الدور"}</Button>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                 </div>
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-lg font-semibold mb-2">قائمة الأدوار</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto pe-2">
                            {roles.map(role => (
                                <Card key={role.id} className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedRole?.id === role.id ? 'bg-primary/10 border-primary' : 'bg-muted/30'}`} onClick={() => handleSelectRoleForPermissions(role)}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{role.name}</p>
                                            <p className="text-xs text-muted-foreground">{role.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); setRoleToEdit(role); setShowManageRoleDialog(true);}}><Edit className="h-4 w-4"/></Button>
                                            {/* Delete button could be added here with confirmation */}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-2">صلاحيات الدور: {selectedRole?.name || "اختر دورًا"}</h3>
                        {selectedRole ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto border p-4 rounded-md bg-background">
                                {modules.map(moduleName => (
                                    <div key={moduleName}>
                                        <h4 className="font-medium mb-1.5">{moduleName}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                            {permissionsMap[moduleName]?.map(permission => {
                                                const permissionKey = `${moduleName.toLowerCase().replace(/\s+/g, '_')}.${permission}`;
                                                return (
                                                <div key={permissionKey} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                    <Checkbox
                                                        id={permissionKey}
                                                        checked={selectedRolePermissions.includes(permissionKey)}
                                                        onCheckedChange={(checked) => handlePermissionChange(permissionKey, checked)}
                                                    />
                                                    <Label htmlFor={permissionKey} className="text-sm font-normal">{permission}</Label>
                                                </div>
                                            )})}
                                        </div>
                                        {moduleName !== modules[modules.length -1] && <hr className="my-3"/>}
                                    </div>
                                ))}
                                 <Button className="mt-4 shadow-md hover:shadow-lg transition-shadow w-full" onClick={handleSaveRolePermissions}>
                                    <Save className="me-2 h-4 w-4" /> حفظ صلاحيات هذا الدور
                                </Button>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">الرجاء اختيار دور من القائمة لعرض أو تعديل صلاحياته.</p>
                        )}
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
                <Save className="me-2 h-4 w-4" /> حفظ إعدادات التخصيص
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



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
import { Settings as SettingsIcon, Users, ShieldCheck, SlidersHorizontal, PlusCircle, Edit, Trash2, Save, Search, KeyRound, ToggleLeft, ToggleRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponentClass, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Role } from '@/types/saas';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data
const initialUsers = [
  { id: "USR001", name: "أحمد علي", email: "ahmed.ali@example.com", roleId: "ROLE001", status: "نشط" as const, avatarUrl: "https://picsum.photos/100/100?random=10" },
  { id: "USR002", name: "فاطمة خالد", email: "fatima.k@example.com", roleId: "ROLE002", status: "نشط" as const, avatarUrl: "https://picsum.photos/100/100?random=11" },
  { id: "USR003", name: "يوسف حسن", email: "youssef.h@example.com", roleId: "ROLE003", status: "غير نشط" as const, avatarUrl: "https://picsum.photos/100/100?random=12" },
];

const initialRoles: Role[] = [
  { id: "ROLE001", name: "مدير النظام", description: "صلاحيات كاملة على النظام.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles"] },
  { id: "ROLE002", name: "محاسب", description: "صلاحيات على وحدات الحسابات والمالية.", permissions: ["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"] },
  { id: "ROLE003", name: "موظف مبيعات", description: "صلاحيات على وحدة المبيعات وعروض الأسعار.", permissions: ["sales.view", "sales.create", "reports.view_sales"] },
  { id: "ROLE004", name: "مدير مخزون", description: "صلاحيات على وحدة المخزون والمستودعات.", permissions: ["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory"] },
];

const modules = ["الحسابات", "المبيعات", "المشتريات", "المخزون", "الموارد البشرية", "التقارير", "الإعدادات"];
const permissionsMap: { [key: string]: {name: string, key: string}[] } = {
  "الحسابات": [{name:"عرض", key:"view"}, {name:"إنشاء", key:"create"}, {name:"تعديل", key:"edit"}, {name:"حذف", key:"delete"}, {name:"موافقة", key:"approve"}],
  "المبيعات": [{name:"عرض", key:"view"}, {name:"إنشاء", key:"create"}, {name:"تعديل", key:"edit"}, {name:"حذف", key:"delete"}, {name:"إرسال عرض سعر", key:"send_quote"}],
  "المشتريات": [{name:"عرض", key:"view"}, {name:"إنشاء", key:"create"}, {name:"تعديل", key:"edit"}, {name:"حذف", key:"delete"}, {name:"موافقة على أمر شراء", key:"approve_po"}],
  "المخزون": [{name:"عرض", key:"view"}, {name:"إنشاء", key:"create"}, {name:"تعديل", key:"edit"}, {name:"حذف", key:"delete"}, {name:"تسوية مخزون", key:"adjust_stock"}],
  "الموارد البشرية": [{name:"عرض", key:"view"}, {name:"إضافة موظف", key:"create_employee"}, {name:"تعديل موظف", key:"edit_employee"}, {name:"تشغيل الرواتب", key:"run_payroll"}],
  "التقارير": [{name:"عرض مالية", key:"view_financial"}, {name:"عرض مبيعات", key:"view_sales"}, {name:"عرض مخزون", key:"view_inventory"}, {name:"عرض موارد بشرية", key:"view_hr"}],
  "الإعدادات": [{name:"عرض", key:"view"}, {name:"تعديل عامة", key:"edit_general"}, {name:"إدارة المستخدمين", key:"manage_users"}, {name:"إدارة الأدوار", key:"manage_roles"}],
};

const userSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم المستخدم مطلوب"),
    email: z.string().email("بريد إلكتروني غير صالح"),
    roleId: z.string().min(1, "الدور مطلوب"),
    status: z.enum(["نشط", "غير نشط"]).default("نشط"),
    password: z.string().optional().refine(val => !val || val.length >= 6, {message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل إذا تم إدخالها"}),
    avatarUrl: z.string().url().optional().or(z.literal('')),
});
type UserFormValues = z.infer<typeof userSchema>;

const roleFormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الدور مطلوب"),
    description: z.string().min(1, "وصف الدور مطلوب"),
});
type RoleFormValues = z.infer<typeof roleFormSchema>;


export default function SettingsPage() {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRolesData] = useState(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<string[]>([]);
  const [showManageUserDialog, setShowManageUserDialog] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserFormValues | null>(null);
  const [showManageRoleDialog, setShowManageRoleDialog] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null); 
  const { toast } = useToast();

  const [logoPreview, setLogoPreview] = useState<string | null>("https://picsum.photos/200/200?random=1");

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedLogo = localStorage.getItem("companyLogo");
        if (savedLogo) {
            setLogoPreview(savedLogo);
        }
    }
  }, []);


  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomization = () => {
    if (typeof window !== 'undefined') {
        if(logoPreview) localStorage.setItem("companyLogo", logoPreview);
        else localStorage.removeItem("companyLogo");
    }
    toast({ title: "تم الحفظ", description: "تم حفظ إعدادات التخصيص بنجاح." });
  };

  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", roleId: "", status: "نشط", password: "", avatarUrl: "" },
  });

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (showManageUserDialog) {
      if (userToEdit) userForm.reset(userToEdit);
      else userForm.reset({ name: "", email: "", roleId: "", status: "نشط", password: "", avatarUrl:"" });
    }
  }, [userToEdit, userForm, showManageUserDialog]);

  useEffect(() => {
    if (showManageRoleDialog) {
        if (roleToEdit) {
            roleForm.reset({ id: roleToEdit.id, name: roleToEdit.name, description: roleToEdit.description });
        } else {
            roleForm.reset({ name: "", description: "" });
        }
    }
  }, [roleToEdit, showManageRoleDialog, roleForm]);

  useEffect(() => {
    if (selectedRole) {
      setSelectedRolePermissions(selectedRole.permissions || []);
    } else {
      setSelectedRolePermissions([]);
    }
  }, [selectedRole]);

  const handleUserSubmit = (values: UserFormValues) => {
    if (userToEdit) {
      setUsers(prev => prev.map(u => u.id === userToEdit.id ? { ...values, id: userToEdit.id!, avatarUrl: u.avatarUrl } : u));
      toast({ title: "تم التعديل", description: `تم تعديل بيانات المستخدم ${values.name}.` });
    } else {
      if(!values.password) {
        userForm.setError("password", {type: "manual", message: "كلمة المرور مطلوبة للمستخدم الجديد"});
        return;
      }
      setUsers(prev => [...prev, { ...values, id: `USR${Date.now()}`, avatarUrl: values.avatarUrl || "https://picsum.photos/100/100?random=" + Date.now() }]);
      toast({ title: "تمت الإضافة", description: `تم إضافة المستخدم ${values.name} بنجاح.` });
    }
    setShowManageUserDialog(false);
    setUserToEdit(null);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === userId ? { ...user, status: user.status === "نشط" ? "غير نشط" : "نشط" } : user
    ));
    const user = users.find(u => u.id === userId);
    toast({ title: "تم تحديث الحالة", description: `تم ${user?.status === "نشط" ? "تعطيل" : "تفعيل"} حساب ${user?.name}.`});
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    toast({ title: "طلب إعادة تعيين", description: `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${user?.email}. (محاكاة)` });
  };


  const handleRoleSubmit = (values: RoleFormValues) => {
    if (roleToEdit) {
      const updatedRole = { ...roleToEdit, name: values.name, description: values.description, permissions: selectedRolePermissions };
      setRolesData(prev => prev.map(role => role.id === roleToEdit.id ? updatedRole : role));
      toast({ title: "تم التعديل", description: `تم تعديل الدور ${values.name}.` });
      if (selectedRole && selectedRole.id === roleToEdit.id) {
        setSelectedRole(updatedRole);
      }
    } else {
      const newRole: Role = { ...values, id: `ROLE${Date.now()}`, permissions: selectedRolePermissions };
      setRolesData(prev => [...prev, newRole]);
      toast({ title: "تمت الإضافة", description: `تم إضافة الدور ${values.name} بنجاح.` });
    }
    setShowManageRoleDialog(false);
    setRoleToEdit(null);
  };

  const handleDeleteRole = (roleId: string) => {
      const isRoleInUse = users.some(user => user.roleId === roleId);
      if (isRoleInUse) {
          toast({ title: "خطأ في الحذف", description: "لا يمكن حذف الدور لأنه مستخدم من قبل بعض المستخدمين.", variant: "destructive" });
          return;
      }
      setRolesData(prev => prev.filter(role => role.id !== roleId));
      if (selectedRole?.id === roleId) {
          setSelectedRole(null);
          setSelectedRolePermissions([]);
      }
      toast({ title: "تم الحذف", description: `تم حذف الدور ${roleId}.`, variant: "destructive" });
  };

  const handleSelectRoleForPermissions = (role: Role) => {
    setSelectedRole(role);
    // Permissions will be set by the useEffect hook watching selectedRole
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'string' ? checked === 'true' : !!checked;
    setSelectedRolePermissions(prev => {
      if (isChecked) {
        return [...new Set([...prev, permissionKey])];
      } else {
        return prev.filter(p => p !== permissionKey);
      }
    });
  };
  

  const handleSaveRolePermissions = () => {
    if (selectedRole) {
      const updatedRole = { ...selectedRole, permissions: selectedRolePermissions };
      setRolesData(prevRoles =>
        prevRoles.map(r =>
          r.id === selectedRole.id ? updatedRole : r
        )
      );
      setSelectedRole(updatedRole); 
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
          <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <SettingsIcon className="inline-block me-2 h-4 w-4" /> الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة المستخدمين
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ShieldCheck className="inline-block me-2 h-4 w-4" /> الأدوار والصلاحيات
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
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
              <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => toast({title: "تم الحفظ", description: "تم حفظ الإعدادات العامة بنجاح."})}>
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
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setUserToEdit(null); userForm.reset({ name: "", email: "", roleId: "", status: "نشط", password:"", avatarUrl:"" }); setShowManageUserDialog(true);}}>
                                <PlusCircle className="me-2 h-4 w-4" /> إضافة مستخدم جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{userToEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle></DialogHeader>
                            <Form {...userForm}>
                                <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4 py-4">
                                    <FormField control={userForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المستخدم</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={userForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={userForm.control} name="roleId" render={({ field }) => ( <FormItem><FormLabel>الدور</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الدور" /></SelectTrigger></FormControl>
                                            <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage /></FormItem> )}/>
                                     {!userToEdit && <FormField control={userForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور</FormLabel><FormControl><Input type="password" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem> )}/> }
                                     <FormField control={userForm.control} name="status" render={({ field }) => ( <FormItem><FormLabel>الحالة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="نشط">نشط</SelectItem><SelectItem value="غير نشط">غير نشط</SelectItem></SelectContent>
                                        </Select><FormMessage /></FormItem> )}/>
                                     <FormField control={userForm.control} name="avatarUrl" render={({ field }) => (<FormItem><FormLabel> رابط الصورة</FormLabel><FormControl><Input placeholder="https://example.com/avatar.png" {...field} className="bg-background"/></FormControl><FormMessage /></FormItem> )}/>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المستخدم" onClick={() => {setUserToEdit(user as any); setShowManageUserDialog(true);}}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="إعادة تعيين كلمة المرور" onClick={() => handleResetPassword(user.id!)}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title={user.status === "نشط" ? "تعطيل الحساب" : "تفعيل الحساب"} onClick={() => handleToggleUserStatus(user.id!)}>
                            {user.status === "نشط" ? <ToggleLeft className="h-5 w-5 text-destructive" /> : <ToggleRight className="h-5 w-5 text-green-600" />}
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
                                    <FormField control={roleForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم الدور</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )}/>
                                    <FormField control={roleForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>وصف الدور</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem> )}/>
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
                        <ScrollArea className="h-96 pe-2">
                        <div className="space-y-2">
                            {roles.map(role => (
                                <Card key={role.id} className={`p-3 hover:shadow-md transition-shadow cursor-pointer ${selectedRole?.id === role.id ? 'bg-primary/10 border-primary' : 'bg-muted/30'}`} onClick={() => handleSelectRoleForPermissions(role)}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{role.name}</p>
                                            <p className="text-xs text-muted-foreground">{role.description}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); setRoleToEdit(role); setSelectedRolePermissions(role.permissions); setShowManageRoleDialog(true);}}><Edit className="h-4 w-4"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescriptionComponentClass>هل أنت متأكد من حذف الدور "{role.name}"؟</AlertDialogDescriptionComponentClass></AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>تأكيد الحذف</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        </ScrollArea>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-2">صلاحيات الدور: {selectedRole?.name || "اختر دورًا"}</h3>
                        {selectedRole ? (
                            <ScrollArea className="h-[calc(100vh-300px)] border p-4 rounded-md bg-background">
                            <div className="space-y-3"> 
                                {modules.map(moduleName => (
                                    <div key={moduleName}>
                                        <h4 className="font-medium mb-1.5">{moduleName}</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                            {permissionsMap[moduleName]?.map(permissionDetail => {
                                                const permissionKey = `${moduleName.toLowerCase().replace(/\s+/g, '_').replace(/وال/g,'_')}.${permissionDetail.key}`;
                                                return (
                                                <div key={permissionKey} className="flex items-center space-x-2 rtl:space-x-reverse">
                                                    <Checkbox
                                                        id={permissionKey}
                                                        checked={selectedRolePermissions.includes(permissionKey)}
                                                        onCheckedChange={(checked) => handlePermissionChange(permissionKey, checked)}
                                                    />
                                                    <Label htmlFor={permissionKey} className="text-sm font-normal">{permissionDetail.name}</Label>
                                                </div>
                                            )})}
                                        </div>
                                        {moduleName !== modules[modules.length - 1] && <hr className="my-3"/>}
                                    </div>
                            ))}
                                 <Button className="mt-4 shadow-md hover:shadow-lg transition-shadow w-full" onClick={handleSaveRolePermissions} disabled={!selectedRole}>
                                    <Save className="me-2 h-4 w-4" /> حفظ صلاحيات هذا الدور
                                </Button>
                            </div>
                            </ScrollArea>
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
              {/* Color customization UI is removed */}
               <div className="space-y-2">
                <Label htmlFor="logoUpload">شعار الشركة</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-md">
                        <AvatarImage src={logoPreview || undefined} alt="شعار الشركة الحالي" data-ai-hint="company logo"/>
                        <AvatarFallback>ERP</AvatarFallback>
                    </Avatar>
                    <Input id="logoUpload" type="file" accept="image/*" className="bg-background" onChange={handleLogoUpload} />
                </div>
              </div>
              <div className="border p-4 rounded-md">
                <h4 className="font-semibold mb-2">إدارة الحقول المخصصة</h4>
                <p className="text-sm text-muted-foreground mb-3">إضافة حقول إضافية لوحدات مثل العملاء، المنتجات، إلخ.</p>
                <Button variant="secondary" className="shadow-sm hover:shadow-md" onClick={() => toast({title: "قيد التطوير", description:"سيتم تفعيل هذه الميزة قريباً."})}>إدارة الحقول</Button>
              </div>
              <div className="border p-4 rounded-md">
                <h4 className="font-semibold mb-2">التكامل مع خدمات خارجية (API)</h4>
                <p className="text-sm text-muted-foreground mb-3">ربط النظام مع بوابات الدفع، خدمات الشحن، وغيرها.</p>
                <Button variant="secondary" className="shadow-sm hover:shadow-md" onClick={() => toast({title: "قيد التطوير", description:"سيتم تفعيل هذه الميزة قريباً."})}>إعدادات التكامل</Button>
              </div>
               <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={handleSaveCustomization}>
                <Save className="me-2 h-4 w-4" /> حفظ إعدادات التخصيص
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

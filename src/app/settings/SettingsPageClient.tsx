
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Users, Shield, Palette, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Role } from '@/types/saas';
import { addRole, updateRole, deleteRole, addUser, updateUser } from './actions';
import type { UserFormValues, RoleFormValues } from './actions';


const permissionGroups = {
    "accounting": "الحسابات",
    "sales": "المبيعات",
    "inventory": "المخزون",
    "hr": "الموارد البشرية",
    "reports": "التقارير",
    "settings": "الإعدادات",
    "projects": "المشاريع",
    "production": "الإنتاج",
    "pos": "نقاط البيع"
};
const permissionsList = [
    { key: "accounting.view", label: "عرض المحاسبة" }, { key: "accounting.create", label: "إنشاء في المحاسبة" }, { key: "accounting.edit", label: "تعديل في المحاسبة" }, { key: "accounting.delete", label: "حذف في المحاسبة" }, { key: "accounting.approve", label: "اعتماد في المحاسبة" },
    { key: "sales.view", label: "عرض المبيعات" }, { key: "sales.create", label: "إنشاء في المبيعات" }, { key: "sales.edit", label: "تعديل في المبيعات" }, { key: "sales.delete", label: "حذف في المبيعات" },
    { key: "inventory.view", label: "عرض المخزون" }, { key: "inventory.create", label: "إنشاء في المخزون" }, { key: "inventory.edit", label: "تعديل في المخزون" }, { key: "inventory.delete", label: "حذف في المخزون" }, { key: "inventory.adjust_stock", label: "تسوية المخزون" },
    { key: "hr.view", label: "عرض الموارد البشرية" }, { key: "hr.create_employee", label: "إنشاء موظف" }, { key: "hr.edit_employee", label: "تعديل موظف" }, { key: "hr.run_payroll", label: "تشغيل مسير الرواتب" },
    { key: "settings.view", label: "عرض الإعدادات" }, { key: "settings.edit_general", label: "تعديل الإعدادات العامة" }, { key: "settings.manage_users", label: "إدارة المستخدمين" }, { key: "settings.manage_roles", label: "إدارة الأدوار" },
];


const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المستخدم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  roleId: z.string().min(1, "الدور مطلوب"),
  status: z.enum(["نشط", "غير نشط"]).default("نشط"),
  password: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الدور مطلوب"),
    description: z.string().min(1, "وصف الدور مطلوب"),
    permissions: z.array(z.string()).default([]),
});


interface SettingsPageProps {
  initialData: {
    users: UserFormValues[];
    roles: Role[];
  }
}

export default function SettingsPage({ initialData }: SettingsPageProps) {
    const [users, setUsers] = useState<UserFormValues[]>(initialData.users);
    const [roles, setRoles] = useState<Role[]>(initialData.roles);

    const [showManageUserDialog, setShowManageUserDialog] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserFormValues | null>(null);

    const [showManageRoleDialog, setShowManageRoleDialog] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

    const { toast } = useToast();

    const userForm = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: { name: "", email: "", roleId: "", status: "نشط", password: "", avatarUrl: ""},
    });

    const roleForm = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: "", description: "", permissions: []},
    });
    
    useEffect(() => {
        setUsers(initialData.users);
        setRoles(initialData.roles);
    }, [initialData]);

    useEffect(() => {
        if (userToEdit) {
            userForm.reset({...userToEdit, password: ''});
        } else {
            userForm.reset({ name: "", email: "", roleId: "", status: "نشط", password: "", avatarUrl: ""});
        }
    }, [userToEdit, userForm, showManageUserDialog]);
    
    useEffect(() => {
        if (roleToEdit) {
            roleForm.reset(roleToEdit);
        } else {
            roleForm.reset({ name: "", description: "", permissions: []});
        }
    }, [roleToEdit, roleForm, showManageRoleDialog]);

    const handleUserSubmit = async (values: UserFormValues) => {
        if (userToEdit && !values.password) {
            delete values.password; // Don't send empty password
        } else if (!userToEdit && !values.password) {
            userForm.setError("password", {type: "manual", message: "كلمة المرور مطلوبة للمستخدم الجديد"});
            return;
        }

        try {
            if (userToEdit) {
                await updateUser({...values, id: userToEdit.id!});
                toast({ title: "تم التعديل", description: "تم تعديل بيانات المستخدم." });
            } else {
                await addUser(values);
                toast({ title: "تمت الإضافة", description: "تمت إضافة المستخدم بنجاح." });
            }
            setShowManageUserDialog(false);
            setUserToEdit(null);
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    };

    const handleRoleSubmit = async (values: RoleFormValues) => {
        try {
            if (roleToEdit) {
                await updateRole({ ...values, id: roleToEdit.id });
                toast({ title: "تم التعديل", description: "تم تعديل الدور بنجاح." });
            } else {
                await addRole(values);
                toast({ title: "تمت الإضافة", description: "تمت إضافة الدور بنجاح." });
            }
            setShowManageRoleDialog(false);
            setRoleToEdit(null);
        } catch (error: any) {
             toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    };
    
    const handleDeleteRole = async (roleId: string) => {
        try {
            await deleteRole(roleId);
            toast({title: "تم الحذف", description: "تم حذف الدور بنجاح.", variant: "destructive"})
        } catch (e: any) {
            toast({ title: "خطأ", description: e.message, variant: "destructive"});
        }
    };
    
    return (
        <div className="container mx-auto py-6" dir="rtl">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl md:text-3xl">
                        <Settings className="me-2 h-8 w-8 text-primary" />
                        الإعدادات العامة
                    </CardTitle>
                    <CardDescription>إدارة إعدادات النظام الرئيسية، المستخدمين، الصلاحيات، والمظهر.</CardDescription>
                </CardHeader>
            </Card>

            <Tabs defaultValue="users" className="w-full mt-6">
                <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
                    <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Users className="inline-block me-2 h-4 w-4" /> إدارة المستخدمين</TabsTrigger>
                    <TabsTrigger value="roles" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Shield className="inline-block me-2 h-4 w-4" /> إدارة الأدوار والصلاحيات</TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Palette className="inline-block me-2 h-4 w-4" /> المظهر</TabsTrigger>
                </TabsList>
                <TabsContent value="users">
                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>قائمة المستخدمين</CardTitle>
                                <Dialog open={showManageUserDialog} onOpenChange={(isOpen) => { setShowManageUserDialog(isOpen); if(!isOpen) setUserToEdit(null);}}>
                                    <DialogTrigger asChild><Button onClick={() => {setUserToEdit(null); userForm.reset(); setShowManageUserDialog(true);}}><PlusCircle className="me-2 h-4 w-4" /> إضافة مستخدم</Button></DialogTrigger>
                                    <DialogContent className="sm:max-w-lg" dir="rtl">
                                        <DialogHeader><DialogTitle>{userToEdit ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle></DialogHeader>
                                        <Form {...userForm}><form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4 py-4">
                                            <FormField control={userForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                            <FormField control={userForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                            <FormField control={userForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور {userToEdit ? '(اتركه فارغاً لعدم التغيير)' : ''}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                            <FormField control={userForm.control} name="roleId" render={({ field }) => ( <FormItem><FormLabel>الدور</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                    <FormControl><SelectTrigger><SelectValue placeholder="اختر دور المستخدم" /></SelectTrigger></FormControl>
                                                    <SelectContent>{roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}</SelectContent>
                                                </Select><FormMessage/></FormItem> )}/>
                                            <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                        </form></Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>البريد الإلكتروني</TableHead><TableHead>الدور</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell>
                                            <TableCell>{roles.find(r => r.id === user.roleId)?.name || user.roleId}</TableCell>
                                            <TableCell><Badge variant={user.status === 'نشط' ? 'default' : 'outline'}>{user.status}</Badge></TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => {setUserToEdit(user); setShowManageUserDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="roles">
                     <Card className="shadow-md">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>الأدوار والصلاحيات</CardTitle>
                                <Dialog open={showManageRoleDialog} onOpenChange={(isOpen) => { setShowManageRoleDialog(isOpen); if(!isOpen) setRoleToEdit(null);}}>
                                    <DialogTrigger asChild><Button onClick={() => {setRoleToEdit(null); roleForm.reset(); setShowManageRoleDialog(true);}}><PlusCircle className="me-2 h-4 w-4" /> إضافة دور</Button></DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl" dir="rtl">
                                        <DialogHeader><DialogTitle>{roleToEdit ? "تعديل دور" : "إضافة دور جديد"}</DialogTitle></DialogHeader>
                                        <Form {...roleForm}>
                                            <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-4 py-4">
                                                <FormField control={roleForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم الدور</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                <FormField control={roleForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>وصف الدور</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                <FormItem>
                                                    <FormLabel>الصلاحيات</FormLabel>
                                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                                        <div className="space-y-4">
                                                            {Object.entries(permissionGroups).map(([groupKey, groupName]) => (
                                                                <div key={groupKey}>
                                                                    <h4 className="font-semibold mb-2">{groupName}</h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        {permissionsList.filter(p => p.key.startsWith(groupKey)).map((permission) => (
                                                                            <FormField key={permission.key} control={roleForm.control} name="permissions" render={({ field }) => (
                                                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                                                                                    <FormControl>
                                                                                        <Checkbox checked={field.value?.includes(permission.key)} onCheckedChange={(checked) => {
                                                                                            return checked ? field.onChange([...field.value, permission.key]) : field.onChange(field.value?.filter(value => value !== permission.key));
                                                                                        }} />
                                                                                    </FormControl>
                                                                                    <FormLabel className="font-normal">{permission.label}</FormLabel>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </FormItem>
                                                <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>اسم الدور</TableHead><TableHead>الوصف</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {roles.map(role => (
                                        <TableRow key={role.id}>
                                            <TableCell>{role.name}</TableCell><TableCell className="text-sm text-muted-foreground">{role.description}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => {setRoleToEdit(role); setShowManageRoleDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive" disabled={role.name === 'مدير النظام'}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف دور "{role.name}"؟</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRole(role.id)}>تأكيد الحذف</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="appearance">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>إعدادات المظهر</CardTitle>
                             <CardDescription>تخصيص ألوان وهوية النظام لتناسب علامتك التجارية.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">هذه الميزة قيد التطوير.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

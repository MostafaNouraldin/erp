
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Search, Users, Shield, Palette, Settings, Building, FileSliders, Save, Briefcase, CalendarDays, HeartPulse, User, Mail } from "lucide-react";
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
import { addRole, updateRole, deleteRole, addUser, updateUser, saveCompanySettings, addDepartment, updateDepartment, deleteDepartment, addJobTitle, updateJobTitle, deleteJobTitle, addLeaveType, updateLeaveType, deleteLeaveType, addAllowanceType, updateAllowanceType, deleteAllowanceType, addDeductionType, updateDeductionType, deleteDeductionType } from './actions';
import type { UserFormValues, RoleFormValues, SettingsFormValues, Department, JobTitle, LeaveType, AllowanceType, DeductionType, Account } from './actions';
import { availableCurrencies } from '@/contexts/currency-context';
import { Textarea } from '@/components/ui/textarea';


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
    { key: "projects.view", label: "عرض المشاريع" }, { key: "projects.create", label: "إنشاء المشاريع" }, { key: "projects.edit", label: "تعديل المشاريع" }, { key: "projects.delete", label: "حذف المشاريع" },
    { key: "production.view", label: "عرض الإنتاج" }, { key: "production.create", label: "إنشاء في الإنتاج" }, { key: "production.edit", label: "تعديل في الإنتاج" }, { key: "production.delete", label: "حذف في الإنتاج" },
    { key: "pos.use", label: "استخدام نقاط البيع" }
];


const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المستخدم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  roleId: z.string().min(1, "الدور مطلوب"),
  status: z.enum(["نشط", "غير نشط"]).default("نشط"),
  password: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم الدور مطلوب"),
    description: z.string().min(1, "وصف الدور مطلوب"),
    permissions: z.array(z.string()).default([]),
});

const settingsSchema = z.object({
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyEmail: z.string().email({ message: "بريد إلكتروني غير صالح" }).optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  companyVatNumber: z.string().optional(),
  defaultCurrency: z.string().optional(),
  vatRate: z.coerce.number().min(0).max(100).optional(),
  themePrimaryColor: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpSecure: z.boolean().optional(),
});
export type SettingsFormValues = z.infer<typeof settingsSchema>;

const departmentSchema = z.object({ id: z.string().optional(), name: z.string().min(1, "اسم القسم مطلوب") });
const jobTitleSchema = z.object({ id: z.string().optional(), name: z.string().min(1, "اسم المسمى الوظيفي مطلوب") });
const leaveTypeSchema = z.object({ id: z.string().optional(), name: z.string().min(1, "اسم نوع الإجازة مطلوب") });
const allowanceTypeSchema = z.object({ id: z.string().optional(), name: z.string().min(1, "اسم البدل مطلوب"), expenseAccountId: z.string().min(1, "حساب المصروف مطلوب") });
const deductionTypeSchema = z.object({ id: z.string().optional(), name: z.string().min(1, "اسم الخصم مطلوب"), liabilityAccountId: z.string().min(1, "حساب الالتزام مطلوب") });

interface SettingsPageProps {
  initialData: {
    users: UserFormValues[]; roles: Role[]; settings: SettingsFormValues; departments: Department[]; jobTitles: JobTitle[]; leaveTypes: LeaveType[]; allowanceTypes: AllowanceType[]; deductionTypes: DeductionType[]; accounts: Account[];
  }
}

export default function SettingsPage({ initialData }: SettingsPageProps) {
    const [users, setUsers] = useState<UserFormValues[]>(initialData.users);
    const [roles, setRoles] = useState<Role[]>(initialData.roles);
    const [departments, setDepartments] = useState<Department[]>(initialData.departments);
    const [jobTitles, setJobTitles] = useState<JobTitle[]>(initialData.jobTitles);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(initialData.leaveTypes);
    const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>(initialData.allowanceTypes);
    const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>(initialData.deductionTypes);
    const [accounts, setAccounts] = useState<Account[]>(initialData.accounts);

    const [showManageUserDialog, setShowManageUserDialog] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserFormValues | null>(null);

    const [showManageRoleDialog, setShowManageRoleDialog] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

    const [showManageDepartmentDialog, setShowManageDepartmentDialog] = useState(false);
    const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);

    const [showManageJobTitleDialog, setShowManageJobTitleDialog] = useState(false);
    const [jobTitleToEdit, setJobTitleToEdit] = useState<JobTitle | null>(null);

    const [showManageLeaveTypeDialog, setShowManageLeaveTypeDialog] = useState(false);
    const [leaveTypeToEdit, setLeaveTypeToEdit] = useState<LeaveType | null>(null);

    const [showManageAllowanceTypeDialog, setShowManageAllowanceTypeDialog] = useState(false);
    const [allowanceTypeToEdit, setAllowanceTypeToEdit] = useState<AllowanceType | null>(null);
    
    const [showManageDeductionTypeDialog, setShowManageDeductionTypeDialog] = useState(false);
    const [deductionTypeToEdit, setDeductionTypeToEdit] = useState<DeductionType | null>(null);

    const { toast } = useToast();

    const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: "", email: "", roleId: "", status: "نشط", password: "", avatar_url: ""}, });
    const roleForm = useForm<RoleFormValues>({ resolver: zodResolver(roleSchema), defaultValues: { name: "", description: "", permissions: []}, });
    const settingsForm = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema), defaultValues: initialData.settings, });
    const departmentForm = useForm<Department>({ resolver: zodResolver(departmentSchema), defaultValues: { name: "" } });
    const jobTitleForm = useForm<JobTitle>({ resolver: zodResolver(jobTitleSchema), defaultValues: { name: "" } });
    const leaveTypeForm = useForm<LeaveType>({ resolver: zodResolver(leaveTypeSchema), defaultValues: { name: "" } });
    const allowanceTypeForm = useForm<AllowanceType>({ resolver: zodResolver(allowanceTypeSchema), defaultValues: { name: "", expenseAccountId: "" } });
    const deductionTypeForm = useForm<DeductionType>({ resolver: zodResolver(deductionTypeSchema), defaultValues: { name: "", liabilityAccountId: "" } });
    
    useEffect(() => {
        setUsers(initialData.users);
        setRoles(initialData.roles);
        settingsForm.reset(initialData.settings);
        setDepartments(initialData.departments);
        setJobTitles(initialData.jobTitles);
        setLeaveTypes(initialData.leaveTypes);
        setAllowanceTypes(initialData.allowanceTypes);
        setDeductionTypes(initialData.deductionTypes);
        setAccounts(initialData.accounts);
    }, [initialData, settingsForm]);

    useEffect(() => { if (userToEdit) { userForm.reset({...userToEdit, password: ''}); } else { userForm.reset({ name: "", email: "", roleId: "", status: "نشط", password: "", avatar_url: ""}); } }, [userToEdit, userForm, showManageUserDialog]);
    useEffect(() => { if (roleToEdit) { roleForm.reset(roleToEdit); } else { roleForm.reset({ name: "", description: "", permissions: []}); } }, [roleToEdit, roleForm, showManageRoleDialog]);
    useEffect(() => { if (departmentToEdit) { departmentForm.reset(departmentToEdit); } else { departmentForm.reset({ name: "" }); } }, [departmentToEdit, departmentForm, showManageDepartmentDialog]);
    useEffect(() => { if (jobTitleToEdit) { jobTitleForm.reset(jobTitleToEdit); } else { jobTitleForm.reset({ name: "" }); } }, [jobTitleToEdit, jobTitleForm, showManageJobTitleDialog]);
    useEffect(() => { if (leaveTypeToEdit) { leaveTypeForm.reset(leaveTypeToEdit); } else { leaveTypeForm.reset({ name: "" }); } }, [leaveTypeToEdit, leaveTypeForm, showManageLeaveTypeDialog]);
    useEffect(() => { if (allowanceTypeToEdit) { allowanceTypeForm.reset(allowanceTypeToEdit); } else { allowanceTypeForm.reset({ name: "", expenseAccountId: "" }); } }, [allowanceTypeToEdit, allowanceTypeForm, showManageAllowanceTypeDialog]);
    useEffect(() => { if (deductionTypeToEdit) { deductionTypeForm.reset(deductionTypeToEdit); } else { deductionTypeForm.reset({ name: "", liabilityAccountId: "" }); } }, [deductionTypeToEdit, deductionTypeForm, showManageDeductionTypeDialog]);


    const handleUserSubmit = async (values: UserFormValues) => {
        if (userToEdit && !values.password) { delete values.password; } else if (!userToEdit && !values.password) { userForm.setError("password", {type: "manual", message: "كلمة المرور مطلوبة للمستخدم الجديد"}); return; }
        try {
            if (userToEdit) { await updateUser({...values, id: userToEdit.id!}); toast({ title: "تم التعديل", description: "تم تعديل بيانات المستخدم." }); } 
            else { await addUser(values); toast({ title: "تمت الإضافة", description: "تمت إضافة المستخدم بنجاح." }); }
            setShowManageUserDialog(false); setUserToEdit(null);
        } catch (error: any) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); }
    };

    const handleRoleSubmit = async (values: RoleFormValues) => {
        try {
            if (roleToEdit) { await updateRole({ ...values, id: roleToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل الدور بنجاح." }); } 
            else { await addRole(values); toast({ title: "تمت الإضافة", description: "تمت إضافة الدور بنجاح." }); }
            setShowManageRoleDialog(false); setRoleToEdit(null);
        } catch (error: any) { toast({ title: "خطأ", description: error.message, variant: "destructive"}); }
    };
    
    const handleDeleteRole = async (roleId: string) => {
        try { await deleteRole(roleId); toast({title: "تم الحذف", description: "تم حذف الدور بنجاح.", variant: "destructive"}) } 
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };

    const handleSettingsSubmit = async (values: SettingsFormValues) => {
        try {
            await saveCompanySettings('T001', values); // Assuming a single tenant for now
            toast({ title: "تم الحفظ", description: "تم حفظ الإعدادات العامة بنجاح." });
            if (values.themePrimaryColor) { const [h, s, l] = values.themePrimaryColor.split(' ').map(Number); document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`); }
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    }
    
    const handleDepartmentSubmit = async (values: Department) => {
        try {
            if (departmentToEdit) { await updateDepartment({ ...values, id: departmentToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل القسم." }); }
            else { await addDepartment(values); toast({ title: "تمت الإضافة", description: "تمت إضافة القسم." }); }
            setShowManageDepartmentDialog(false); setDepartmentToEdit(null);
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    const handleDeleteDepartment = async (id: string) => {
        try { await deleteDepartment(id); toast({title: "تم الحذف", description: "تم حذف القسم.", variant: "destructive"}) }
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };

    const handleJobTitleSubmit = async (values: JobTitle) => {
        try {
            if (jobTitleToEdit) { await updateJobTitle({ ...values, id: jobTitleToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل المسمى الوظيفي." }); }
            else { await addJobTitle(values); toast({ title: "تمت الإضافة", description: "تمت إضافة المسمى الوظيفي." }); }
            setShowManageJobTitleDialog(false); setJobTitleToEdit(null);
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    const handleDeleteJobTitle = async (id: string) => {
        try { await deleteJobTitle(id); toast({title: "تم الحذف", description: "تم حذف المسمى الوظيفي.", variant: "destructive"}) }
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    
    const handleLeaveTypeSubmit = async (values: LeaveType) => {
        try {
            if (leaveTypeToEdit) { await updateLeaveType({ ...values, id: leaveTypeToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل نوع الإجازة." }); }
            else { await addLeaveType(values); toast({ title: "تمت الإضافة", description: "تمت إضافة نوع الإجازة." }); }
            setShowManageLeaveTypeDialog(false); setLeaveTypeToEdit(null);
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    const handleDeleteLeaveType = async (id: string) => {
        try { await deleteLeaveType(id); toast({title: "تم الحذف", description: "تم حذف نوع الإجازة.", variant: "destructive"}) }
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    
    const handleAllowanceTypeSubmit = async (values: AllowanceType) => {
        try {
            if (allowanceTypeToEdit) { await updateAllowanceType({ ...values, id: allowanceTypeToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل نوع البدل." }); }
            else { await addAllowanceType(values); toast({ title: "تمت الإضافة", description: "تمت إضافة نوع البدل." }); }
            setShowManageAllowanceTypeDialog(false); setAllowanceTypeToEdit(null);
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    const handleDeleteAllowanceType = async (id: string) => {
        try { await deleteAllowanceType(id); toast({title: "تم الحذف", description: "تم حذف نوع البدل.", variant: "destructive"}) }
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };

    const handleDeductionTypeSubmit = async (values: DeductionType) => {
        try {
            if (deductionTypeToEdit) { await updateDeductionType({ ...values, id: deductionTypeToEdit.id }); toast({ title: "تم التعديل", description: "تم تعديل نوع الخصم." }); }
            else { await addDeductionType(values); toast({ title: "تمت الإضافة", description: "تمت إضافة نوع الخصم." }); }
            setShowManageDeductionTypeDialog(false); setDeductionTypeToEdit(null);
        } catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
    };
    const handleDeleteDeductionType = async (id: string) => {
        try { await deleteDeductionType(id); toast({title: "تم الحذف", description: "تم حذف نوع الخصم.", variant: "destructive"}) }
        catch (e: any) { toast({ title: "خطأ", description: e.message, variant: "destructive"}); }
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

            <Tabs defaultValue="company" className="w-full mt-6" dir="rtl">
                <TabsList className="w-full mb-6 bg-muted p-1 rounded-md overflow-x-auto">
                    <TabsTrigger value="company" className="flex-shrink-0"><Building className="inline-block me-2 h-4 w-4" /> معلومات الشركة</TabsTrigger>
                    <TabsTrigger value="financial" className="flex-shrink-0"><FileSliders className="inline-block me-2 h-4 w-4" /> المالية والضرائب</TabsTrigger>
                    <TabsTrigger value="hr" className="flex-shrink-0"><Briefcase className="inline-block me-2 h-4 w-4" /> الموارد البشرية</TabsTrigger>
                    <TabsTrigger value="email" className="flex-shrink-0"><Mail className="inline-block me-2 h-4 w-4" /> البريد الإلكتروني</TabsTrigger>
                    <TabsTrigger value="users" className="flex-shrink-0"><Users className="inline-block me-2 h-4 w-4" /> المستخدمين</TabsTrigger>
                    <TabsTrigger value="roles" className="flex-shrink-0"><Shield className="inline-block me-2 h-4 w-4" /> الأدوار والصلاحيات</TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-shrink-0"><Palette className="inline-block me-2 h-4 w-4" /> المظهر</TabsTrigger>
                </TabsList>
                
                <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit(handleSettingsSubmit)}>
                        <TabsContent value="company">
                            <Card className="shadow-md">
                                <CardHeader><CardTitle>معلومات الشركة</CardTitle><CardDescription>هذه المعلومات ستظهر في المستندات المطبوعة مثل الفواتير.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={settingsForm.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>اسم الشركة</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="companyVatNumber" render={({ field }) => ( <FormItem><FormLabel>الرقم الضريبي</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="companyEmail" render={({ field }) => ( <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="companyPhone" render={({ field }) => ( <FormItem><FormLabel>الهاتف</FormLabel><FormControl><Input {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <div className="md:col-span-2">
                                            <FormField control={settingsForm.control} name="companyAddress" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Textarea {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        </div>
                                     </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="financial">
                             <Card className="shadow-md">
                                <CardHeader><CardTitle>الإعدادات المالية والضريبية</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <FormField control={settingsForm.control} name="defaultCurrency" render={({ field }) => (
                                            <FormItem><FormLabel>العملة الافتراضية</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                                    <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العملة" /></SelectTrigger></FormControl>
                                                    <SelectContent>{availableCurrencies.map(c => <SelectItem key={c.code} value={c.code}>{c.name} ({c.symbol})</SelectItem>)}</SelectContent>
                                                </Select><FormMessage /></FormItem> )} />
                                        <FormField control={settingsForm.control} name="vatRate" render={({ field }) => ( <FormItem><FormLabel>نسبة ضريبة القيمة المضافة (%)</FormLabel><FormControl><Input type="number" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                     </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="email">
                            <Card className="shadow-md">
                                <CardHeader><CardTitle>إعدادات خادم البريد الإلكتروني (SMTP)</CardTitle><CardDescription>تستخدم هذه الإعدادات لإرسال رسائل البريد الإلكتروني من النظام، مثل إشعارات تفعيل الحسابات.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={settingsForm.control} name="smtpHost" render={({ field }) => ( <FormItem><FormLabel>خادم SMTP</FormLabel><FormControl><Input placeholder="smtp.example.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="smtpPort" render={({ field }) => ( <FormItem><FormLabel>المنفذ (Port)</FormLabel><FormControl><Input type="number" placeholder="587" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="smtpUser" render={({ field }) => ( <FormItem><FormLabel>اسم المستخدم</FormLabel><FormControl><Input placeholder="user@example.com" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="smtpPass" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور</FormLabel><FormControl><Input type="password" placeholder="********" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={settingsForm.control} name="smtpSecure" render={({ field }) => (
                                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm md:col-span-2">
                                            <div className="space-y-0.5">
                                              <FormLabel>استخدام اتصال آمن (TLS/SSL)</FormLabel>
                                              <DialogDescriptionComponent className="text-xs">
                                                موصى به. قم بتعطيله فقط إذا كان خادم SMTP لا يدعم الاتصال المشفر.
                                              </DialogDescriptionComponent>
                                            </div>
                                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                          </FormItem>
                                        )}/>
                                     </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="hr">
                             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                 {/* Departments */}
                                 <Card className="shadow-md">
                                    <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-base">الأقسام</CardTitle>
                                        <Dialog open={showManageDepartmentDialog} onOpenChange={(isOpen) => { setShowManageDepartmentDialog(isOpen); if(!isOpen) setDepartmentToEdit(null);}}>
                                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setDepartmentToEdit(null); departmentForm.reset(); setShowManageDepartmentDialog(true);}}><PlusCircle className="h-5 w-5 text-primary"/></Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-md" dir="rtl">
                                                <DialogHeader><DialogTitle>{departmentToEdit ? "تعديل قسم" : "إضافة قسم"}</DialogTitle></DialogHeader>
                                                <Form {...departmentForm}><form onSubmit={departmentForm.handleSubmit(handleDepartmentSubmit)} className="space-y-4 py-4">
                                                    <FormField control={departmentForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم القسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                    <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                                </form></Form>
                                            </DialogContent>
                                        </Dialog></div></CardHeader>
                                    <CardContent><Table>
                                        <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                        <TableBody>{departments.map(d => (<TableRow key={d.id}><TableCell>{d.name}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => {setDepartmentToEdit(d); setShowManageDepartmentDialog(true);}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>handleDeleteDepartment(d.id!)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                                    </Table></CardContent>
                                 </Card>
                                 {/* Job Titles */}
                                 <Card className="shadow-md">
                                    <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-base">المسميات الوظيفية</CardTitle>
                                        <Dialog open={showManageJobTitleDialog} onOpenChange={(isOpen) => { setShowManageJobTitleDialog(isOpen); if(!isOpen) setJobTitleToEdit(null);}}>
                                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setJobTitleToEdit(null); jobTitleForm.reset(); setShowManageJobTitleDialog(true);}}><PlusCircle className="h-5 w-5 text-primary"/></Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-md" dir="rtl">
                                                <DialogHeader><DialogTitle>{jobTitleToEdit ? "تعديل مسمى وظيفي" : "إضافة مسمى وظيفي"}</DialogTitle></DialogHeader>
                                                <Form {...jobTitleForm}><form onSubmit={jobTitleForm.handleSubmit(handleJobTitleSubmit)} className="space-y-4 py-4">
                                                    <FormField control={jobTitleForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم المسمى الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                    <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                                </form></Form>
                                            </DialogContent>
                                        </Dialog></div></CardHeader>
                                    <CardContent><Table>
                                        <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                        <TableBody>{jobTitles.map(jt => (<TableRow key={jt.id}><TableCell>{jt.name}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => {setJobTitleToEdit(jt); setShowManageJobTitleDialog(true);}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>handleDeleteJobTitle(jt.id!)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                                    </Table></CardContent>
                                 </Card>
                                 {/* Leave Types */}
                                 <Card className="shadow-md">
                                    <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-base">أنواع الإجازات</CardTitle>
                                        <Dialog open={showManageLeaveTypeDialog} onOpenChange={(isOpen) => { setShowManageLeaveTypeDialog(isOpen); if(!isOpen) setLeaveTypeToEdit(null);}}>
                                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setLeaveTypeToEdit(null); leaveTypeForm.reset(); setShowManageLeaveTypeDialog(true);}}><PlusCircle className="h-5 w-5 text-primary"/></Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-md" dir="rtl">
                                                <DialogHeader><DialogTitle>{leaveTypeToEdit ? "تعديل نوع إجازة" : "إضافة نوع إجازة"}</DialogTitle></DialogHeader>
                                                <Form {...leaveTypeForm}><form onSubmit={leaveTypeForm.handleSubmit(handleLeaveTypeSubmit)} className="space-y-4 py-4">
                                                    <FormField control={leaveTypeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم نوع الإجازة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                    <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                                </form></Form>
                                            </DialogContent>
                                        </Dialog></div></CardHeader>
                                    <CardContent><Table>
                                        <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                        <TableBody>{leaveTypes.map(lt => (<TableRow key={lt.id}><TableCell>{lt.name}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => {setLeaveTypeToEdit(lt); setShowManageLeaveTypeDialog(true);}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>handleDeleteLeaveType(lt.id!)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                                    </Table></CardContent>
                                 </Card>
                                  {/* Allowance Types */}
                                 <Card className="shadow-md">
                                    <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-base">أنواع البدلات</CardTitle>
                                        <Dialog open={showManageAllowanceTypeDialog} onOpenChange={(isOpen) => { setShowManageAllowanceTypeDialog(isOpen); if(!isOpen) setAllowanceTypeToEdit(null);}}>
                                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setAllowanceTypeToEdit(null); allowanceTypeForm.reset(); setShowManageAllowanceTypeDialog(true);}}><PlusCircle className="h-5 w-5 text-primary"/></Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-md" dir="rtl">
                                                <DialogHeader><DialogTitle>{allowanceTypeToEdit ? "تعديل نوع بدل" : "إضافة نوع بدل"}</DialogTitle></DialogHeader>
                                                <Form {...allowanceTypeForm}><form onSubmit={allowanceTypeForm.handleSubmit(handleAllowanceTypeSubmit)} className="space-y-4 py-4">
                                                    <FormField control={allowanceTypeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم البدل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                    <FormField control={allowanceTypeForm.control} name="expenseAccountId" render={({ field }) => (<FormItem><FormLabel>حساب المصروف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب المصروف" /></SelectTrigger></FormControl><SelectContent>{accounts.filter(acc => acc.id.startsWith('5')).map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>))}</SelectContent></Select><FormMessage/></FormItem> )}/>
                                                    <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                                </form></Form>
                                            </DialogContent>
                                        </Dialog></div></CardHeader>
                                    <CardContent><Table>
                                        <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الحساب</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                        <TableBody>{allowanceTypes.map(at => (<TableRow key={at.id}><TableCell>{at.name}</TableCell><TableCell>{at.expenseAccountId}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => {setAllowanceTypeToEdit(at); setShowManageAllowanceTypeDialog(true);}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>handleDeleteAllowanceType(at.id!)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                                    </Table></CardContent>
                                 </Card>
                                 {/* Deduction Types */}
                                 <Card className="shadow-md">
                                    <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-base">أنواع الخصومات</CardTitle>
                                        <Dialog open={showManageDeductionTypeDialog} onOpenChange={(isOpen) => { setShowManageDeductionTypeDialog(isOpen); if(!isOpen) setDeductionTypeToEdit(null);}}>
                                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => {setDeductionTypeToEdit(null); deductionTypeForm.reset(); setShowManageDeductionTypeDialog(true);}}><PlusCircle className="h-5 w-5 text-primary"/></Button></DialogTrigger>
                                            <DialogContent className="sm:max-w-md" dir="rtl">
                                                <DialogHeader><DialogTitle>{deductionTypeToEdit ? "تعديل نوع خصم" : "إضافة نوع خصم"}</DialogTitle></DialogHeader>
                                                <Form {...deductionTypeForm}><form onSubmit={deductionTypeForm.handleSubmit(handleDeductionTypeSubmit)} className="space-y-4 py-4">
                                                    <FormField control={deductionTypeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم الخصم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem> )}/>
                                                     <FormField control={deductionTypeForm.control} name="liabilityAccountId" render={({ field }) => (<FormItem><FormLabel>حساب الالتزام/الذمم</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حساب الالتزام" /></SelectTrigger></FormControl><SelectContent>{accounts.filter(acc => acc.id.startsWith('2') || acc.id.startsWith('12')).map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>))}</SelectContent></Select><FormMessage/></FormItem> )}/>
                                                    <DialogFooter><Button type="submit">حفظ</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                                </form></Form>
                                            </DialogContent>
                                        </Dialog></div></CardHeader>
                                    <CardContent><Table>
                                        <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الحساب</TableHead><TableHead className="text-left">إجراء</TableHead></TableRow></TableHeader>
                                        <TableBody>{deductionTypes.map(dt => (<TableRow key={dt.id}><TableCell>{dt.name}</TableCell><TableCell>{dt.liabilityAccountId}</TableCell><TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => {setDeductionTypeToEdit(dt); setShowManageDeductionTypeDialog(true);}}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>handleDeleteDeductionType(dt.id!)}><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}</TableBody>
                                    </Table></CardContent>
                                 </Card>
                             </div>
                        </TabsContent>
                        <TabsContent value="appearance">
                             <Card className="shadow-md">
                                <CardHeader><CardTitle>تخصيص المظهر</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <FormField control={settingsForm.control} name="themePrimaryColor" render={({ field }) => (
                                        <FormItem className="max-w-xs"><FormLabel>اللون الأساسي للنظام</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl><Input type="color" {...field} className="bg-background p-1 h-10 w-14" /></FormControl>
                                                <Input value={field.value || ''} onChange={field.onChange} placeholder="e.g., 221 83 53" className="bg-background text-left" dir="ltr"/>
                                            </div>
                                            <DialogDescriptionComponent className="text-xs text-muted-foreground">أدخل قيم HSL (Hue Saturation Lightness) بدون رموز. مثال: 221 83 53</DialogDescriptionComponent>
                                        <FormMessage/></FormItem> )} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <div className="flex justify-start mt-6">
                            <Button type="submit" className="shadow-md hover:shadow-lg transition-shadow">
                                <Save className="me-2 h-4 w-4" /> حفظ الإعدادات
                            </Button>
                        </div>
                    </form>
                </Form>

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
                
            </Tabs>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, ListTodo, Users, CircleDollarSign, PlusCircle, Search, Filter, Edit, Trash2, FileText, PlayCircle, CheckCircle, GanttChartSquare, Eye, XCircle, Briefcase } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const mockClients = [
  { id: "CLIENT001", name: "شركة المستقبل الذهبي" },
  { id: "CLIENT002", name: "مؤسسة الإبداع الرقمي" },
  { id: "CLIENT003", name: "الشركة المتحدة للتجارة" },
];

const mockEmployees = [
  { id: "EMP001", name: "خالد الأحمد" },
  { id: "EMP002", name: "سارة عبدالله" },
  { id: "EMP003", name: "يوسف إبراهيم" },
  { id: "EMP004", name: "فريق التحليل" },
  { id: "EMP005", name: "فريق التصميم" },
  { id: "EMP006", name: "فريق التطوير" },
  { id: "EMP007", name: "أحمد خالد" },
];


// Schemas
const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المشروع مطلوب"),
  clientId: z.string().min(1, "العميل مطلوب"),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  budget: z.coerce.number().min(0, "الميزانية يجب أن تكون رقماً موجباً"),
  status: z.enum(["مخطط له", "قيد التنفيذ", "متوقف", "مكتمل", "ملغي"]).default("مخطط له"),
  progress: z.coerce.number().min(0).max(100).default(0),
  managerId: z.string().min(1, "مدير المشروع مطلوب"),
  notes: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof projectSchema>;

const taskSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  name: z.string().min(1, "اسم المهمة مطلوب"),
  assigneeId: z.string().min(1, "المسؤول مطلوب"),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  status: z.enum(["مخطط لها", "قيد التنفيذ", "مكتملة", "متأخرة", "ملغاة"]).default("مخطط لها"),
  priority: z.enum(["مرتفعة", "متوسطة", "منخفضة"]).default("متوسطة"),
  notes: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskSchema>;

const resourceSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  employeeId: z.string().min(1, "الموظف/المورد مطلوب"),
  role: z.string().min(1, "الدور مطلوب"),
  allocation: z.coerce.number().min(0).max(100, "نسبة التخصيص بين 0 و 100").default(100),
  availability: z.enum(["متاح", "متاح جزئياً", "غير متاح"]).default("متاح"),
  notes: z.string().optional(),
});
type ResourceFormValues = z.infer<typeof resourceSchema>;

const budgetItemSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1, "المشروع مطلوب"),
  item: z.string().min(1, "وصف البند مطلوب"),
  allocated: z.coerce.number().min(0, "المبلغ المخصص يجب أن يكون موجباً"),
  spent: z.coerce.number().min(0, "المبلغ المصروف يجب أن يكون موجباً").default(0),
  notes: z.string().optional(),
});
type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;


// Initial Data States
const initialProjectsData: ProjectFormValues[] = [
  { id: "PROJ001", name: "تطوير نظام ERP جديد", clientId: "CLIENT001", startDate: new Date("2024-05-01"), endDate: new Date("2025-01-31"), budget: 500000, status: "قيد التنفيذ", progress: 45, managerId: "EMP001", notes: "مشروع ضخم لتطوير نظام متكامل" },
  { id: "PROJ002", name: "حملة تسويقية لإطلاق منتج", clientId: "CLIENT002", startDate: new Date("2024-07-15"), endDate: new Date("2024-09-30"), budget: 150000, status: "مخطط له", progress: 10, managerId: "EMP002", notes: "" },
  { id: "PROJ003", name: "إنشاء فرع جديد في جدة", clientId: "CLIENT003", startDate: new Date("2023-10-01"), endDate: new Date("2024-06-30"), budget: 1200000, status: "مكتمل", progress: 100, managerId: "EMP003", notes: "تم الافتتاح بنجاح" },
];

const initialTasksData: TaskFormValues[] = [
  { id: "TASK001", projectId: "PROJ001", name: "تحليل المتطلبات", assigneeId: "EMP004", dueDate: new Date("2024-06-15"), status: "مكتملة", priority: "مرتفعة" },
  { id: "TASK002", projectId: "PROJ001", name: "تصميم واجهات المستخدم", assigneeId: "EMP005", dueDate: new Date("2024-07-30"), status: "قيد التنفيذ", priority: "مرتفعة" },
  { id: "TASK003", projectId: "PROJ001", name: "تطوير الوحدات الأساسية", assigneeId: "EMP006", dueDate: new Date("2024-10-30"), status: "قيد التنفيذ", priority: "متوسطة" },
  { id: "TASK004", projectId: "PROJ002", name: "وضع استراتيجية الحملة", assigneeId: "EMP007", dueDate: new Date("2024-07-30"), status: "مخطط لها", priority: "مرتفعة" },
];

const initialResourcesData: ResourceFormValues[] = [
  { id: "RES001", projectId: "PROJ001", employeeId: "EMP001", role: "مدير المشروع", allocation: 50, availability: "متاح جزئياً" },
  { id: "RES002", projectId: "PROJ001", employeeId: "EMP006", role: "فريق تطوير", allocation: 100, availability: "متاح" },
  { id: "RES003", projectId: "PROJ002", employeeId: "EMP002", role: "مدير تسويق", allocation: 75, availability: "متاح جزئياً" },
];

const initialBudgetItemsData: BudgetItemFormValues[] = [
  { id: "BUD001", projectId: "PROJ001", item: "رواتب الفريق", allocated: 200000, spent: 80000 },
  { id: "BUD002", projectId: "PROJ001", item: "تراخيص البرامج", allocated: 50000, spent: 30000 },
  { id: "BUD003", projectId: "PROJ002", item: "إعلانات رقمية", allocated: 70000, spent: 15000 },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjectsData);
  const [tasks, setTasks] = useState(initialTasksData);
  const [resources, setResources] = useState(initialResourcesData);
  const [budgetItems, setBudgetItems] = useState(initialBudgetItemsData);

  const [showManageProjectDialog, setShowManageProjectDialog] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectFormValues | null>(null);
  const [showViewProjectDialog, setShowViewProjectDialog] = useState(false);
  const [selectedProjectForView, setSelectedProjectForView] = useState<ProjectFormValues | null>(null);


  const [showManageTaskDialog, setShowManageTaskDialog] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskFormValues | null>(null);

  const [showManageResourceDialog, setShowManageResourceDialog] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<ResourceFormValues | null>(null);

  const [showManageBudgetItemDialog, setShowManageBudgetItemDialog] = useState(false);
  const [budgetItemToEdit, setBudgetItemToEdit] = useState<BudgetItemFormValues | null>(null);
  const [budgetItemToRecordExpense, setBudgetItemToRecordExpense] = useState<BudgetItemFormValues | null>(null);


  const { toast } = useToast();

  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { startDate: new Date(), endDate: new Date(), budget: 0, progress: 0, status: "مخطط له" },
  });
  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { dueDate: new Date(), status: "مخطط لها", priority: "متوسطة" },
  });
  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { allocation: 100, availability: "متاح" },
  });
  const budgetItemForm = useForm<BudgetItemFormValues>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: { allocated: 0, spent: 0 },
  });

  useEffect(() => {
    if (projectToEdit) projectForm.reset(projectToEdit);
    else projectForm.reset({ clientId: '', managerId: '', name: '', startDate: new Date(), endDate: new Date(), budget: 0, progress: 0, status: "مخطط له", notes: '' });
  }, [projectToEdit, projectForm, showManageProjectDialog]);

  useEffect(() => {
    if (taskToEdit) taskForm.reset(taskToEdit);
    else taskForm.reset({ projectId: '', name: '', assigneeId: '', dueDate: new Date(), status: "مخطط لها", priority: "متوسطة", notes: '' });
  }, [taskToEdit, taskForm, showManageTaskDialog]);

  useEffect(() => {
    if (resourceToEdit) resourceForm.reset(resourceToEdit);
    else resourceForm.reset({ projectId: '', employeeId: '', role: '', allocation: 100, availability: "متاح", notes: '' });
  }, [resourceToEdit, resourceForm, showManageResourceDialog]);

  useEffect(() => {
    if (budgetItemToEdit) budgetItemForm.reset(budgetItemToEdit);
    else budgetItemForm.reset({ projectId: '', item: '', allocated: 0, spent: 0, notes: '' });
  }, [budgetItemToEdit, budgetItemForm, showManageBudgetItemDialog]);


  const handleProjectSubmit = (values: ProjectFormValues) => {
    if (projectToEdit) {
      setProjects(prev => prev.map(p => p.id === projectToEdit.id ? { ...values, id: projectToEdit.id } : p));
      toast({ title: "تم التعديل", description: "تم تعديل بيانات المشروع بنجاح." });
    } else {
      setProjects(prev => [...prev, { ...values, id: `PROJ${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: "تم إنشاء المشروع بنجاح." });
    }
    setShowManageProjectDialog(false);
    setProjectToEdit(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
    setResources(prev => prev.filter(r => r.projectId !== projectId));
    setBudgetItems(prev => prev.filter(b => b.projectId !== projectId));
    toast({ title: "تم الحذف", description: `تم حذف المشروع ${projectId} وجميع بياناته المرتبطة.`, variant: "destructive" });
  };

  const handleViewProject = (project: ProjectFormValues) => {
    setSelectedProjectForView(project);
    setShowViewProjectDialog(true);
  };

  const handleTaskSubmit = (values: TaskFormValues) => {
    if (taskToEdit) {
      setTasks(prev => prev.map(t => t.id === taskToEdit.id ? { ...values, id: taskToEdit.id } : t));
      toast({ title: "تم التعديل", description: "تم تعديل المهمة بنجاح." });
    } else {
      setTasks(prev => [...prev, { ...values, id: `TASK${Date.now()}` }]);
      toast({ title: "تمت الإضافة", description: "تم إضافة المهمة بنجاح." });
    }
    setShowManageTaskDialog(false);
    setTaskToEdit(null);
  };

  const handleResourceSubmit = (values: ResourceFormValues) => {
    if (resourceToEdit) {
      setResources(prev => prev.map(r => r.id === resourceToEdit.id ? { ...values, id: resourceToEdit.id } : r));
      toast({ title: "تم التعديل", description: "تم تعديل تخصيص المورد بنجاح." });
    } else {
      setResources(prev => [...prev, { ...values, id: `RES${Date.now()}` }]);
      toast({ title: "تم التخصيص", description: "تم تخصيص المورد بنجاح." });
    }
    setShowManageResourceDialog(false);
    setResourceToEdit(null);
  };
  
  const handleBudgetItemSubmit = (values: BudgetItemFormValues) => {
    if (budgetItemToEdit) {
      setBudgetItems(prev => prev.map(b => b.id === budgetItemToEdit.id ? { ...values, id: budgetItemToEdit.id } : b));
      toast({ title: "تم التعديل", description: "تم تعديل بند الميزانية بنجاح." });
    } else {
      setBudgetItems(prev => [...prev, { ...values, id: `BUD${Date.now()}` }]);
      toast({ title: "تمت الإضافة", description: "تم إضافة بند الميزانية بنجاح." });
    }
    setShowManageBudgetItemDialog(false);
    setBudgetItemToEdit(null);
  };

  const handleRecordExpense = (budgetItemId: string, newSpentAmount: number) => {
     setBudgetItems(prev => prev.map(b => b.id === budgetItemId ? {...b, spent: newSpentAmount} : b));
     toast({title: "تم تسجيل المصروف", description: `تم تحديث المبلغ المصروف لبند الميزانية.`});
     setBudgetItemToRecordExpense(null); // Close dialog
  };

  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">إدارة المشاريع</h1>
        <Dialog open={showManageProjectDialog} onOpenChange={(isOpen) => { setShowManageProjectDialog(isOpen); if(!isOpen) setProjectToEdit(null);}}>
            <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setProjectToEdit(null); projectForm.reset(); setShowManageProjectDialog(true); }}>
                <PlusCircle className="me-2 h-4 w-4" /> إنشاء مشروع جديد
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader><DialogTitle>{projectToEdit ? "تعديل مشروع" : "إنشاء مشروع جديد"}</DialogTitle></DialogHeader>
                <Form {...projectForm}>
                    <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-4 py-4">
                        <FormField control={projectForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المشروع</FormLabel><FormControl><Input placeholder="اسم المشروع" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={projectForm.control} name="clientId" render={({ field }) => ( <FormItem><FormLabel>العميل</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر العميل"/></SelectTrigger></FormControl>
                                <SelectContent>{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage/></FormItem> )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={projectForm.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} /><FormMessage/></FormItem> )}/>
                            <FormField control={projectForm.control} name="endDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء المتوقع</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange} /><FormMessage/></FormItem> )}/>
                        </div>
                         <FormField control={projectForm.control} name="budget" render={({ field }) => ( <FormItem><FormLabel>الميزانية التقديرية (SAR)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={projectForm.control} name="managerId" render={({ field }) => ( <FormItem><FormLabel>مدير المشروع</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر مدير المشروع"/></SelectTrigger></FormControl>
                                <SelectContent>{mockEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage/></FormItem> )}/>
                        <FormField control={projectForm.control} name="status" render={({ field }) => ( <FormItem><FormLabel>الحالة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة"/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="مخطط له">مخطط له</SelectItem><SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                                    <SelectItem value="متوقف">متوقف</SelectItem><SelectItem value="مكتمل">مكتمل</SelectItem><SelectItem value="ملغي">ملغي</SelectItem>
                                </SelectContent>
                            </Select><FormMessage/></FormItem> )}/>
                        <FormField control={projectForm.control} name="progress" render={({ field }) => ( <FormItem><FormLabel>نسبة الإنجاز (%)</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="0" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <FormField control={projectForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية عن المشروع" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                        <DialogFooter>
                            <Button type="submit">{projectToEdit ? "حفظ التعديلات" : "حفظ المشروع"}</Button>
                            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Building className="inline-block me-2 h-4 w-4" /> نظرة عامة على المشاريع
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ListTodo className="inline-block me-2 h-4 w-4" /> المهام والجداول
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة الموارد
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CircleDollarSign className="inline-block me-2 h-4 w-4" /> الميزانية والتكاليف
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>قائمة المشاريع</CardTitle>
              <CardDescription>تتبع جميع المشاريع الحالية، المخطط لها، والمكتملة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث باسم المشروع أو العميل..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب حالة المشروع</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مخطط له</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد التنفيذ</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>متوقف</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مكتمل</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم المشروع</TableHead>
                      <TableHead>اسم المشروع</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التقدم</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{project.id}</TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{mockClients.find(c => c.id === project.clientId)?.name}</TableCell>
                        <TableCell>{project.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>{project.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>
                          <Badge variant={project.status === "مكتمل" ? "default" : project.status === "قيد التنفيذ" ? "secondary" : "outline"} className="whitespace-nowrap">
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} aria-label={`${project.progress}%`} className="h-2 w-24" />
                            <span className="text-xs text-muted-foreground">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewProject(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المشروع" onClick={() => { setProjectToEdit(project); setShowManageProjectDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف المشروع">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف المشروع "{project.name}"؟ سيتم حذف جميع المهام والموارد والميزانية المرتبطة به.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProject(project.id!)} className={buttonVariants({variant: "destructive"})}>تأكيد الحذف</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                           </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة مهام المشاريع</CardTitle>
              <CardDescription>تتبع المهام، تعيين المسؤولين، وتحديد الأولويات والمواعيد النهائية.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showManageTaskDialog} onOpenChange={(isOpen) => { setShowManageTaskDialog(isOpen); if(!isOpen) setTaskToEdit(null);}}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setTaskToEdit(null); taskForm.reset(); setShowManageTaskDialog(true); }}>
                                <PlusCircle className="me-2 h-4 w-4" /> إضافة مهمة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{taskToEdit ? "تعديل مهمة" : "إضافة مهمة جديدة"}</DialogTitle></DialogHeader>
                            <Form {...taskForm}>
                                <form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-4 py-4">
                                    <FormField control={taskForm.control} name="projectId" render={({ field }) => ( <FormItem><FormLabel>المشروع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المشروع"/></SelectTrigger></FormControl>
                                            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={taskForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>اسم المهمة</FormLabel><FormControl><Input placeholder="وصف موجز للمهمة" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <FormField control={taskForm.control} name="assigneeId" render={({ field }) => ( <FormItem><FormLabel>المسؤول عن المهمة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المسؤول"/></SelectTrigger></FormControl>
                                            <SelectContent>{mockEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={taskForm.control} name="dueDate" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>تاريخ الاستحقاق</FormLabel><DatePickerWithPresets mode="single" selectedDate={field.value} onDateChange={field.onChange}/><FormMessage/></FormItem> )}/>
                                     <FormField control={taskForm.control} name="priority" render={({ field }) => ( <FormItem><FormLabel>الأولوية</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الأولوية"/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="مرتفعة">مرتفعة</SelectItem><SelectItem value="متوسطة">متوسطة</SelectItem><SelectItem value="منخفضة">منخفضة</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={taskForm.control} name="status" render={({ field }) => ( <FormItem><FormLabel>الحالة</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة"/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="مخطط لها">مخطط لها</SelectItem><SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                                                <SelectItem value="مكتملة">مكتملة</SelectItem><SelectItem value="متأخرة">متأخرة</SelectItem><SelectItem value="ملغاة">ملغاة</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={taskForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية..." {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <DialogFooter>
                                        <Button type="submit">{taskToEdit ? "حفظ التعديلات" : "حفظ المهمة"}</Button>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <div className="flex gap-2 flex-wrap">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" dir="rtl">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => alert("سيتم عرض مخطط جانت هنا.")}>
                            <GanttChartSquare className="me-2 h-4 w-4" /> عرض مخطط جانت
                        </Button>
                    </div>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف المهمة</TableHead>
                      <TableHead>اسم المهمة</TableHead>
                      <TableHead>المسؤول</TableHead>
                      <TableHead>تاريخ الاستحقاق</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{task.id}</TableCell>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{mockEmployees.find(e => e.id === task.assigneeId)?.name}</TableCell>
                        <TableCell>{task.dueDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</TableCell>
                        <TableCell>
                            <Badge variant={task.priority === "مرتفعة" ? "destructive" : task.priority === "متوسطة" ? "secondary" : "outline"} className="whitespace-nowrap">
                                {task.priority}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={task.status === "مكتملة" ? "default" : "outline"} className="whitespace-nowrap">{task.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تحديث الحالة" onClick={() => alert("تحديث حالة المهمة " + task.id)}>
                            <PlayCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المهمة" onClick={() => { setTaskToEdit(task); setShowManageTaskDialog(true);}}>
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
        
        <TabsContent value="resources">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>إدارة موارد المشروع</CardTitle>
              <CardDescription>تخصيص الموارد البشرية والمادية للمشاريع وتتبع مدى توفرها.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showManageResourceDialog} onOpenChange={(isOpen) => { setShowManageResourceDialog(isOpen); if(!isOpen) setResourceToEdit(null);}}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setResourceToEdit(null); resourceForm.reset(); setShowManageResourceDialog(true); }}>
                                <PlusCircle className="me-2 h-4 w-4" /> تخصيص مورد جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{resourceToEdit ? "تعديل تخصيص مورد" : "تخصيص مورد جديد"}</DialogTitle></DialogHeader>
                            <Form {...resourceForm}>
                                <form onSubmit={resourceForm.handleSubmit(handleResourceSubmit)} className="space-y-4 py-4">
                                    <FormField control={resourceForm.control} name="projectId" render={({ field }) => ( <FormItem><FormLabel>المشروع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المشروع"/></SelectTrigger></FormControl>
                                            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={resourceForm.control} name="employeeId" render={({ field }) => ( <FormItem><FormLabel>الموظف/المورد</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف أو المورد"/></SelectTrigger></FormControl>
                                            <SelectContent>{mockEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={resourceForm.control} name="role" render={({ field }) => ( <FormItem><FormLabel>الدور/الوصف</FormLabel><FormControl><Input placeholder="مثال: مطور، مصمم، استشاري" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <FormField control={resourceForm.control} name="allocation" render={({ field }) => ( <FormItem><FormLabel>نسبة التخصيص (%)</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <FormField control={resourceForm.control} name="availability" render={({ field }) => ( <FormItem><FormLabel>التوفر</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر حالة التوفر"/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="متاح">متاح</SelectItem><SelectItem value="متاح جزئياً">متاح جزئياً</SelectItem><SelectItem value="غير متاح">غير متاح</SelectItem>
                                            </SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={resourceForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية..." {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <DialogFooter>
                                        <Button type="submit">{resourceToEdit ? "حفظ التعديلات" : "حفظ التخصيص"}</Button>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" dir="rtl">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المعرف</TableHead>
                      <TableHead>اسم المورد</TableHead>
                      <TableHead>الدور/الوصف</TableHead>
                      <TableHead>نسبة التخصيص</TableHead>
                      <TableHead>التوفر</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((res) => (
                      <TableRow key={res.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{res.id}</TableCell>
                        <TableCell>{mockEmployees.find(e => e.id === res.employeeId)?.name}</TableCell>
                        <TableCell>{res.role}</TableCell>
                        <TableCell>{res.allocation}%</TableCell>
                        <TableCell>
                           <Badge variant={res.availability === "متاح" ? "default" : "secondary"} className="whitespace-nowrap">{res.availability}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل تخصيص المورد" onClick={() => {setResourceToEdit(res); setShowManageResourceDialog(true);}}>
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

        <TabsContent value="budget">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>ميزانية وتكاليف المشروع</CardTitle>
              <CardDescription>تتبع الميزانيات المخصصة، المصروفات الفعلية، والتكاليف المتبقية لكل مشروع.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                    <Dialog open={showManageBudgetItemDialog} onOpenChange={(isOpen) => { setShowManageBudgetItemDialog(isOpen); if(!isOpen) setBudgetItemToEdit(null);}}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => { setBudgetItemToEdit(null); budgetItemForm.reset(); setShowManageBudgetItemDialog(true); }}>
                                <PlusCircle className="me-2 h-4 w-4" /> إضافة بند ميزانية
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg" dir="rtl">
                            <DialogHeader><DialogTitle>{budgetItemToEdit ? "تعديل بند ميزانية" : "إضافة بند ميزانية جديد"}</DialogTitle></DialogHeader>
                            <Form {...budgetItemForm}>
                                <form onSubmit={budgetItemForm.handleSubmit(handleBudgetItemSubmit)} className="space-y-4 py-4">
                                    <FormField control={budgetItemForm.control} name="projectId" render={({ field }) => ( <FormItem><FormLabel>المشروع</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المشروع"/></SelectTrigger></FormControl>
                                            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select><FormMessage/></FormItem> )}/>
                                    <FormField control={budgetItemForm.control} name="item" render={({ field }) => ( <FormItem><FormLabel>وصف البند</FormLabel><FormControl><Input placeholder="مثال: رواتب الفريق، تراخيص، سفر" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <FormField control={budgetItemForm.control} name="allocated" render={({ field }) => ( <FormItem><FormLabel>المبلغ المخصص (SAR)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <FormField control={budgetItemForm.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea placeholder="أية ملاحظات إضافية..." {...field} className="bg-background"/></FormControl><FormMessage/></FormItem> )}/>
                                    <DialogFooter>
                                        <Button type="submit">{budgetItemToEdit ? "حفظ التعديلات" : "حفظ البند"}</Button>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                            <Filter className="me-2 h-4 w-4" /> تصفية المشروع
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" dir="rtl">
                            <DropdownMenuLabel>اختر المشروع</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(p => <DropdownMenuCheckboxItem key={p.id}>{p.name}</DropdownMenuCheckboxItem>)}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المعرف</TableHead>
                      <TableHead>بند التكلفة</TableHead>
                      <TableHead>الميزانية المخصصة</TableHead>
                      <TableHead>المصروف الفعلي</TableHead>
                      <TableHead>المتبقي</TableHead>
                       <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.allocated.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}</TableCell>
                        <TableCell>{item.spent.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}</TableCell>
                        <TableCell className="font-semibold">{(item.allocated - item.spent).toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}</TableCell>
                         <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تسجيل مصروف" onClick={() => { setBudgetItemToRecordExpense(item); /* Open a new dialog or inline edit for spent amount */ }}>
                            <Briefcase className="h-4 w-4 text-green-600" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل البند" onClick={() => { setBudgetItemToEdit(item); setShowManageBudgetItemDialog(true);}}>
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

        {/* View Project Details Dialog */}
        <Dialog open={showViewProjectDialog} onOpenChange={setShowViewProjectDialog}>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
            <DialogHeader>
                <DialogTitle>تفاصيل المشروع: {selectedProjectForView?.name}</DialogTitle>
                <DialogDescriptionComponent>نظرة شاملة على تفاصيل المشروع وحالته.</DialogDescriptionComponent>
            </DialogHeader>
            {selectedProjectForView && (
                <ScrollArea className="max-h-[70vh]">
                <div className="py-4 px-1 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">معلومات أساسية</CardTitle></CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            <p><strong>العميل:</strong> {mockClients.find(c => c.id === selectedProjectForView.clientId)?.name}</p>
                            <p><strong>مدير المشروع:</strong> {mockEmployees.find(e => e.id === selectedProjectForView.managerId)?.name}</p>
                            <p><strong>تاريخ البدء:</strong> {selectedProjectForView.startDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                            <p><strong>تاريخ الانتهاء:</strong> {selectedProjectForView.endDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</p>
                            <p><strong>الميزانية:</strong> {selectedProjectForView.budget.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}</p>
                            <p><strong>الحالة:</strong> <Badge variant={selectedProjectForView.status === "مكتمل" ? "default" : "secondary"}>{selectedProjectForView.status}</Badge></p>
                            <p><strong>التقدم:</strong> <Progress value={selectedProjectForView.progress} className="h-2 inline-block w-32 me-2"/> {selectedProjectForView.progress}%</p>
                            <p><strong>ملاحظات:</strong> {selectedProjectForView.notes || "لا يوجد"}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">المهام الرئيسية</CardTitle></CardHeader>
                        <CardContent>
                            {tasks.filter(t => t.projectId === selectedProjectForView.id).length > 0 ? (
                                <ul className="list-disc ps-5 space-y-1 text-sm">
                                {tasks.filter(t => t.projectId === selectedProjectForView.id).map(task => (
                                    <li key={task.id}>{task.name} (<Badge variant={task.status === "مكتملة" ? "default" : "outline"} className="text-xs">{task.status}</Badge>) - مستحقة في: {task.dueDate.toLocaleDateString('ar-SA', { calendar: 'gregory' })}</li>
                                ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground">لا توجد مهام مرتبطة بهذا المشروع.</p>}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="text-lg">الموارد المخصصة</CardTitle></CardHeader>
                        <CardContent>
                            {resources.filter(r => r.projectId === selectedProjectForView.id).length > 0 ? (
                                <ul className="list-disc ps-5 space-y-1 text-sm">
                                {resources.filter(r => r.projectId === selectedProjectForView.id).map(res => (
                                    <li key={res.id}>{mockEmployees.find(e=> e.id === res.employeeId)?.name} ({res.role}) - تخصيص: {res.allocation}%</li>
                                ))}
                                </ul>
                            ) : <p className="text-sm text-muted-foreground">لا توجد موارد مخصصة لهذا المشروع.</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">ملخص الميزانية</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                             {budgetItems.filter(b => b.projectId === selectedProjectForView.id).map(item => (
                                 <div key={item.id} className="flex justify-between">
                                     <span>{item.item}:</span>
                                     <span>{item.spent.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})} / {item.allocated.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}</span>
                                 </div>
                             ))}
                             {budgetItems.filter(b => b.projectId === selectedProjectForView.id).length === 0 && (
                                 <p className="text-muted-foreground">لا توجد بنود ميزانية لهذا المشروع.</p>
                             )}
                        </CardContent>
                    </Card>
                </div>
                </ScrollArea>
            )}
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
            </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Dialog for recording expense on budget item */}
        <Dialog open={!!budgetItemToRecordExpense} onOpenChange={(isOpen) => !isOpen && setBudgetItemToRecordExpense(null)}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تسجيل مصروف لبند: {budgetItemToRecordExpense?.item}</DialogTitle>
                    <DialogDescriptionComponent>
                        المبلغ المخصص: {budgetItemToRecordExpense?.allocated.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})} | 
                        المصروف حالياً: {budgetItemToRecordExpense?.spent.toLocaleString('ar-SA',{style:'currency', currency:'SAR'})}
                    </DialogDescriptionComponent>
                </DialogHeader>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const newSpentAmount = parseFloat((e.target as any).elements.spentAmount.value);
                    if(budgetItemToRecordExpense && !isNaN(newSpentAmount) && newSpentAmount >= 0){
                       handleRecordExpense(budgetItemToRecordExpense.id!, budgetItemToRecordExpense.spent + newSpentAmount);
                    } else {
                        toast({title: "خطأ", description: "الرجاء إدخال مبلغ صحيح للمصروف.", variant: "destructive"});
                    }
                }} className="space-y-4 py-4">
                    <FormItem>
                        <FormLabel htmlFor="spentAmount">المبلغ المصروف الجديد</FormLabel>
                        <FormControl>
                            <Input id="spentAmount" name="spentAmount" type="number" min="0" step="0.01" required className="bg-background" placeholder="0.00"/>
                        </FormControl>
                    </FormItem>
                    <DialogFooter>
                        <Button type="submit">تسجيل المصروف</Button>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>


    </div>
  );
}

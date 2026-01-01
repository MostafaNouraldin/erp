

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
import { Users, Briefcase, CalendarDays, LogOut, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, XCircle, Clock, Eye, DollarSign, FileClock, Send, MinusCircle, Shield, Banknote, CalendarPlus, CalendarCheck2, UserCog, Award, Plane, UploadCloud, Printer, FileWarning, FileEdit, UserMinus, AlertOctagon, FolderOpen, BookText, UserX, ClipboardSignature } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import AppLogo from '@/components/app-logo';
import { useCurrency } from '@/hooks/use-currency';
import type { EmployeeFormValues, PayrollFormValues, AttendanceFormValues, LeaveRequestFormValues, WarningNoticeFormValues, AdministrativeDecisionFormValues, ResignationFormValues, DisciplinaryWarningFormValues } from './actions';
import { addEmployee, updateEmployee, deleteEmployee, addPayroll, updatePayroll, updatePayrollStatus, addAttendance, updateAttendance, addLeaveRequest, updateLeaveRequestStatus, addWarningNotice, updateWarningNotice, deleteWarningNotice, addAdministrativeDecision, updateAdministrativeDecision, deleteAdministrativeDecision, addResignation, updateResignation, deleteResignation, addDisciplinaryWarning, updateDisciplinaryWarning, deleteDisciplinaryWarning, postPayrollToGL } from './actions';


// Schemas (as they are not exported from actions.ts)
const employeeAllowanceSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف البدل مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  type: z.enum(["ثابت", "متغير", "مرة واحدة"]).default("ثابت"),
});

const employeeDeductionSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف الخصم مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  type: z.enum(["ثابت", "متغير", "مرة واحدة"]).default("ثابت"),
});

const employeeIncentiveSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف الحافز مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  date: z.date({ required_error: "تاريخ استحقاق الحافز مطلوب" }),
  type: z.enum(["شهري", "ربع سنوي", "سنوي", "مرة واحدة"]).default("مرة واحدة"),
});

const employeeDelegationSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  description: z.string().min(1, "وصف الانتداب مطلوب"),
  startDate: z.date({ required_error: "تاريخ بداية الانتداب مطلوب" }),
  endDate: z.date({ required_error: "تاريخ نهاية الانتداب مطلوب" }),
  location: z.string().min(1, "مكان الانتداب مطلوب"),
  status: z.enum(["مخطط له", "جارٍ", "مكتمل", "ملغى"]).default("مخطط له"),
});

const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الموظف مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  contractStartDate: z.date({ required_error: "تاريخ بداية العقد مطلوب" }),
  contractEndDate: z.date({ required_error: "تاريخ نهاية العقد مطلوب" }),
  employmentType: z.enum(["دوام كامل", "دوام جزئي", "عقد محدد", "مستقل"], { required_error: "نوع التوظيف مطلوب" }).default("دوام كامل"),
  status: z.enum(["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"]).default("نشط"),
  basicSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون إيجابياً"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  avatarUrl: z.string().url("رابط الصورة غير صالح").optional().or(z.literal('')),
  dataAiHint: z.string().max(30, "الكلمات المفتاحية يجب ألا تتجاوز 30 حرفًا").optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  allowances: z.array(employeeAllowanceSchema).optional().default([]), 
  deductions: z.array(employeeDeductionSchema).optional().default([]),
});

const payrollItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "الوصف مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
});
const payrollSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  monthYear: z.string().min(1, "شهر وسنة المسير مطلوبان"),
  basicSalary: z.coerce.number().min(0),
  allowances: z.array(payrollItemSchema).optional().default([]),
  deductions: z.array(payrollItemSchema).optional().default([]),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "معتمد", "مرحل للحسابات", "مدفوع", "ملغي"]),
  netSalary: z.coerce.number().optional(),
  paymentDate: z.date().optional().nullable(),
});

const attendanceSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["حاضر", "غائب", "حاضر (متأخر)", "حاضر (مغادرة مبكرة)", "إجازة"]).default("حاضر"),
  hours: z.string().optional(),
});

const leaveRequestSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  leaveType: z.string().min(1, "نوع الإجازة مطلوب"),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  reason: z.string().optional(),
  status: z.enum(["مقدمة", "موافق عليها", "مرفوضة", "ملغاة"]).default("مقدمة"),
  days: z.coerce.number().optional(),
});

const warningNoticeSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    date: z.date({ required_error: "تاريخ لفت النظر مطلوب" }),
    reason: z.string().min(1, "سبب لفت النظر مطلوب"),
    details: z.string().min(1, "تفاصيل المخالفة/الملاحظة مطلوبة"),
    issuingManager: z.string().min(1, "المدير المصدر مطلوب"),
    status: z.enum(["مسودة", "تم التسليم", "ملغى"]).default("مسودة"),
});

const administrativeDecisionSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    decisionDate: z.date({ required_error: "تاريخ القرار مطلوب" }),
    decisionType: z.string().min(1, "نوع القرار مطلوب (مثال: ترقية, نقل, تعديل راتب)"),
    details: z.string().min(1, "تفاصيل القرار مطلوبة"),
    issuingAuthority: z.string().min(1, "الجهة المصدرة للقرار مطلوبة"),
    effectiveDate: z.date({ required_error: "تاريخ سريان القرار مطلوب" }),
    status: z.enum(["مسودة", "معتمد", "منفذ", "ملغى"]).default("مسودة"),
});

const resignationSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    submissionDate: z.date({ required_error: "تاريخ تقديم الاستقالة مطلوب" }),
    lastWorkingDate: z.date({ required_error: "تاريخ آخر يوم عمل مطلوب" }),
    reason: z.string().min(1, "سبب الاستقالة مطلوب"),
    managerNotifiedDate: z.date().optional().nullable(),
    status: z.enum(["مقدمة", "مقبولة", "قيد المراجعة", "مسحوبة", "مرفوضة"]).default("مقدمة"),
});

const disciplinaryWarningSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    warningDate: z.date({ required_error: "تاريخ الإنذار مطلوب" }),
    warningType: z.enum(["إنذار أول", "إنذار ثاني", "إنذار نهائي", "إجراء تأديبي آخر"], { required_error: "نوع الإنذار مطلوب" }),
    violationDetails: z.string().min(1, "تفاصيل المخالفة مطلوبة"),
    actionTaken: z.string().optional(),
    issuingManager: z.string().min(1, "المدير المصدر مطلوب"),
    status: z.enum(["مسودة", "تم التسليم", "معترض عليه", "منفذ"]).default("مسودة"),
});

const mockDepartments = ["قسم المبيعات", "قسم التسويق", "قسم المالية", "قسم الموارد البشرية", "قسم التشغيل", "الإدارة"];
const mockJobTitles = ["مدير مبيعات", "أخصائية تسويق", "محاسب أول", "مسؤول موارد بشرية", "فني صيانة", "مدير قسم", "مساعد إداري"];
const mockEmploymentTypes = ["دوام كامل", "دوام جزئي", "عقد محدد", "مستقل"];
const mockLeaveTypes = ["إجازة سنوية", "إجازة مرضية", "إجازة عارضة", "إجازة بدون راتب", "إجازة أمومة", "إجازة زواج", "أخرى"];
const mockManagers = [{id: "EMP001", name: "أحمد محمود"}];
const mockDecisionTypes = ["ترقية", "نقل", "تعديل راتب", "إنهاء خدمات", "أخرى"];
const mockWarningTypes = ["إنذار أول", "إنذار ثاني", "إنذار نهائي", "إجراء تأديبي آخر"];

const employeeDefaultValues = {
  name: "", department: "", jobTitle: "", contractStartDate: new Date(), contractEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  status: "نشط" as const, basicSalary: 0, email: "", phone: "", avatarUrl: "", dataAiHint: "",
  employmentType: "دوام كامل" as const,
  nationality: "", idNumber: "", bankName: "", iban: "", socialInsuranceNumber: "",
  allowances: [], deductions: [],
};

const convertAmountToWords = (amount: number) => {
    return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};

interface HRClientComponentProps {
    initialData: {
        employees: EmployeeFormValues[];
        payrolls: PayrollFormValues[];
        attendances: AttendanceFormValues[];
        leaveRequests: LeaveRequestFormValues[];
        warningNotices: WarningNoticeFormValues[];
        administrativeDecisions: AdministrativeDecisionFormValues[];
        resignations: ResignationFormValues[];
        disciplinaryWarnings: DisciplinaryWarningFormValues[];
    }
}

// Main Component
export default function HRClientComponent({ initialData }: HRClientComponentProps) {
  const [employees, setEmployeesData] = useState<EmployeeFormValues[]>(initialData.employees);
  const [payrollData, setPayrollData] = useState(initialData.payrolls);
  const [attendanceData, setAttendanceData] = useState(initialData.attendances);
  const [leaveRequests, setLeaveRequestsData] = useState(initialData.leaveRequests);
  const [warningNoticesData, setWarningNoticesData] = useState(initialData.warningNotices);
  const [administrativeDecisionsData, setAdministrativeDecisionsData] = useState(initialData.administrativeDecisions);
  const [resignationsData, setResignationsData] = useState(initialData.resignations);
  const [disciplinaryWarningsData, setDisciplinaryWarningsData] = useState(initialData.disciplinaryWarnings);


  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeFormValues | null>(null);
  const [showViewEmployeeDialog, setShowViewEmployeeDialog] = useState(false);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<EmployeeFormValues | null>(null);

  const [showCreatePayrollDialog, setShowCreatePayrollDialog] = useState(false);
  const [payrollToEdit, setPayrollToEdit] = useState<PayrollFormValues | null>(null);
  const [showViewPayrollDialog, setShowViewPayrollDialog] = useState(false);
  const [selectedPayrollForView, setSelectedPayrollForView] = useState<(PayrollFormValues & {employeeName?: string}) | null>(null);


  const [showEditAttendanceDialog, setShowEditAttendanceDialog] = useState(false);
  const [attendanceToEdit, setAttendanceToEdit] = useState<AttendanceFormValues | null>(null);

  const [showCreateLeaveDialog, setShowCreateLeaveDialog] = useState(false);
  const [leaveRequestToEdit, setLeaveRequestToEdit] = useState<LeaveRequestFormValues | null>(null);
  const [showViewLeaveDialog, setShowViewLeaveDialog] = useState(false);
  const [selectedLeaveForView, setSelectedLeaveForView] = useState<(LeaveRequestFormValues & {employeeName?:string}) | null>(null);

  const [showManageDelegationDialog, setShowManageDelegationDialog] = useState(false);
  const [delegationToEdit, setDelegationToEdit] = useState<any | null>(null);

  const [showManageWarningNoticeDialog, setShowManageWarningNoticeDialog] = useState(false);
  const [warningNoticeToEdit, setWarningNoticeToEdit] = useState<WarningNoticeFormValues | null>(null);
  const [showPrintWarningNoticeDialog, setShowPrintWarningNoticeDialog] = useState(false);
  const [selectedWarningNoticeForPrint, setSelectedWarningNoticeForPrint] = useState<WarningNoticeFormValues | null>(null);
  
  const [showManageAdminDecisionDialog, setShowManageAdminDecisionDialog] = useState(false);
  const [adminDecisionToEdit, setAdminDecisionToEdit] = useState<AdministrativeDecisionFormValues | null>(null);
  const [showPrintAdminDecisionDialog, setShowPrintAdminDecisionDialog] = useState(false);
  const [selectedAdminDecisionForPrint, setSelectedAdminDecisionForPrint] = useState<AdministrativeDecisionFormValues | null>(null);

  const [showManageResignationDialog, setShowManageResignationDialog] = useState(false);
  const [resignationToEdit, setResignationToEdit] = useState<ResignationFormValues | null>(null);
  const [showPrintResignationDialog, setShowPrintResignationDialog] = useState(false);
  const [selectedResignationForPrint, setSelectedResignationForPrint] = useState<ResignationFormValues | null>(null);
  
  const [showManageDisciplinaryDialog, setShowManageDisciplinaryDialog] = useState(false);
  const [disciplinaryToEdit, setDisciplinaryToEdit] = useState<DisciplinaryWarningFormValues | null>(null);
  const [showPrintDisciplinaryDialog, setShowPrintDisciplinaryDialog] = useState(false);
  const [selectedDisciplinaryForPrint, setSelectedDisciplinaryForPrint] = useState<DisciplinaryWarningFormValues | null>(null);

  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const employeeForm = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: employeeDefaultValues });
  const { fields: allowanceFormFields, append: appendAllowanceField, remove: removeAllowanceField } = useFieldArray({ control: employeeForm.control, name: "allowances" });
  const { fields: deductionFormFields, append: appendDeductionField, remove: removeDeductionField } = useFieldArray({ control: employeeForm.control, name: "deductions" });

  const warningNoticeForm = useForm<WarningNoticeFormValues>({ resolver: zodResolver(warningNoticeSchema), defaultValues: { employeeId: '', date: new Date(), reason: '', details: '', issuingManager: '', status: "مسودة" } });
  const adminDecisionForm = useForm<AdministrativeDecisionFormValues>({ resolver: zodResolver(administrativeDecisionSchema), defaultValues: { employeeId: '', decisionDate: new Date(), decisionType: '', details: '', issuingAuthority: '', effectiveDate: new Date(), status: "مسودة" } });
  const resignationForm = useForm<ResignationFormValues>({ resolver: zodResolver(resignationSchema), defaultValues: { employeeId: '', submissionDate: new Date(), lastWorkingDate: new Date(), reason: '', managerNotifiedDate: null, status: "مقدمة" } });
  const disciplinaryWarningForm = useForm<DisciplinaryWarningFormValues>({ resolver: zodResolver(disciplinaryWarningSchema), defaultValues: { employeeId: '', warningDate: new Date(), warningType: undefined, violationDetails: '', actionTaken: '', issuingManager: '', status: "مسودة" } });

  const payrollForm = useForm<PayrollFormValues>({ resolver: zodResolver(payrollSchema) });
  const { fields: payrollAllowanceFields, append: appendPayrollAllowance, remove: removePayrollAllowance } = useFieldArray({ control: payrollForm.control, name: "allowances" });
  const { fields: payrollDeductionFields, append: appendPayrollDeduction, remove: removePayrollDeduction } = useFieldArray({ control: payrollForm.control, name: "deductions" });

  const attendanceForm = useForm<AttendanceFormValues>({ resolver: zodResolver(attendanceSchema) });
  const leaveRequestForm = useForm<LeaveRequestFormValues>({ resolver: zodResolver(leaveRequestSchema) });
  
  useEffect(() => {
    setEmployeesData(initialData.employees);
    setPayrollData(initialData.payrolls);
    setAttendanceData(initialData.attendances);
    setLeaveRequestsData(initialData.leaveRequests);
    setWarningNoticesData(initialData.warningNotices);
    setAdministrativeDecisionsData(initialData.administrativeDecisions);
    setResignationsData(initialData.resignations);
    setDisciplinaryWarningsData(initialData.disciplinaryWarnings);
  }, [initialData]);

  useEffect(() => {
    if (employeeToEdit) employeeForm.reset({...employeeToEdit, contractStartDate: new Date(employeeToEdit.contractStartDate), contractEndDate: new Date(employeeToEdit.contractEndDate)});
    else employeeForm.reset(employeeDefaultValues);
  }, [employeeToEdit, employeeForm, showAddEmployeeDialog]);

  useEffect(() => {
    if (payrollToEdit) {
        const emp = employees.find(e => e.id === payrollToEdit.employeeId);
        payrollForm.reset({
            ...payrollToEdit,
            basicSalary: payrollToEdit.basicSalary || emp?.basicSalary || 0,
            paymentDate: payrollToEdit.paymentDate ? new Date(payrollToEdit.paymentDate) : null,
        });
    } else {
        const currentMonthYear = `${new Date().toLocaleString('ar-SA', { month: 'long' })} ${new Date().getFullYear()}`;
        payrollForm.reset({ employeeId: "", monthYear: currentMonthYear, basicSalary: 0, allowances: [], deductions: [], notes: "", status: "مسودة", paymentDate: null });
    }
  }, [payrollToEdit, payrollForm, showCreatePayrollDialog, employees]);

  useEffect(() => {
    if (attendanceToEdit) attendanceForm.reset({...attendanceToEdit, date: new Date(attendanceToEdit.date)});
    else attendanceForm.reset({ employeeId: "", date: new Date(), checkIn: null, checkOut: null, notes: "", status: "حاضر" });
  }, [attendanceToEdit, attendanceForm, showEditAttendanceDialog]);

  useEffect(() => {
    if (leaveRequestToEdit) leaveRequestForm.reset({...leaveRequestToEdit, startDate: new Date(leaveRequestToEdit.startDate), endDate: new Date(leaveRequestToEdit.endDate)});
    else leaveRequestForm.reset({ employeeId: "", leaveType: "", startDate: new Date(), endDate: new Date(), reason: "", status: "مقدمة" });
  }, [leaveRequestToEdit, leaveRequestForm, showCreateLeaveDialog]);


  useEffect(() => {
    if (warningNoticeToEdit) warningNoticeForm.reset({...warningNoticeToEdit, date: new Date(warningNoticeToEdit.date)});
    else warningNoticeForm.reset({ employeeId: '', date: new Date(), reason: '', details: '', issuingManager: '', status: "مسودة" });
  }, [warningNoticeToEdit, warningNoticeForm, showManageWarningNoticeDialog]);

  useEffect(() => {
    if (adminDecisionToEdit) adminDecisionForm.reset({...adminDecisionToEdit, decisionDate: new Date(adminDecisionToEdit.decisionDate), effectiveDate: new Date(adminDecisionToEdit.effectiveDate)});
    else adminDecisionForm.reset({ employeeId: '', decisionDate: new Date(), decisionType: '', details: '', issuingAuthority: '', effectiveDate: new Date(), status: "مسودة" });
  }, [adminDecisionToEdit, adminDecisionForm, showManageAdminDecisionDialog]);

  useEffect(() => {
    if (resignationToEdit) resignationForm.reset({...resignationToEdit, submissionDate: new Date(resignationToEdit.submissionDate), lastWorkingDate: new Date(resignationToEdit.lastWorkingDate)});
    else resignationForm.reset({ employeeId: '', submissionDate: new Date(), lastWorkingDate: new Date(), reason: '', managerNotifiedDate: null, status: "مقدمة" });
  }, [resignationToEdit, resignationForm, showManageResignationDialog]);

  useEffect(() => {
    if (disciplinaryToEdit) disciplinaryWarningForm.reset({...disciplinaryToEdit, warningDate: new Date(disciplinaryToEdit.warningDate)});
    else disciplinaryWarningForm.reset({ employeeId: '', warningDate: new Date(), warningType: undefined, violationDetails: '', actionTaken: '', issuingManager: '', status: "مسودة" });
  }, [disciplinaryToEdit, disciplinaryWarningForm, showManageDisciplinaryDialog]);


  const handleEmployeeSubmit = async (values: EmployeeFormValues) => {
    try {
      if (employeeToEdit) {
        await updateEmployee({ ...values, id: employeeToEdit.id! });
        toast({ title: "تم التعديل", description: `تم تعديل بيانات الموظف ${values.name}.` });
      } else {
        await addEmployee(values);
        toast({ title: "تمت الإضافة", description: `تم إضافة الموظف ${values.name} بنجاح.` });
      }
      setShowAddEmployeeDialog(false);
      setEmployeeToEdit(null);
    } catch (error) {
      toast({ title: "خطأ", description: "لم يتم حفظ بيانات الموظف.", variant: "destructive" });
    }
  };
  
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
      toast({ title: "تم الحذف", description: `تم حذف الموظف.`, variant: "destructive" });
    } catch (error) {
       toast({ title: "خطأ", description: "لم يتم حذف الموظف.", variant: "destructive" });
    }
  }


  const handleTerminateEmployee = (employeeId: string) => {
      // This is optimistic update. The server action would handle the actual change.
      setEmployeesData(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: "منتهية خدمته" } : emp));
      toast({ title: "إنهاء خدمة", description: `تم إنهاء خدمة الموظف ${employeeId}.`, variant: "destructive" });
  };

  const handleViewEmployee = (employee: EmployeeFormValues) => {
      setSelectedEmployeeForView(employee);
      setShowViewEmployeeDialog(true);
  };

  const handlePayrollSubmit = async (values: PayrollFormValues) => {
    const totalAllowances = values.allowances?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalDeductions = values.deductions?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const netSalary = (values.basicSalary || 0) + totalAllowances - totalDeductions;
    const employee = employees.find(e => e.id === values.employeeId);

    const finalValues = { ...values, netSalary };

    try {
      if (payrollToEdit) {
        await updatePayroll({ ...finalValues, id: payrollToEdit.id! });
        toast({ title: "تم التعديل", description: `تم تعديل مسير الرواتب للموظف ${employee?.name}.` });
      } else {
        await addPayroll(finalValues);
        toast({ title: "تم الإنشاء", description: `تم إنشاء مسير الرواتب للموظف ${employee?.name}.` });
      }
      setShowCreatePayrollDialog(false);
      setPayrollToEdit(null);
    } catch (error) {
       toast({ title: "خطأ", description: "لم يتم حفظ مسير الرواتب.", variant: "destructive" });
    }
  };

  const handleViewPayroll = (payroll: PayrollFormValues) => {
      const employee = employees.find(e => e.id === payroll.employeeId);
      setSelectedPayrollForView({...payroll, employeeName: employee?.name });
      setShowViewPayrollDialog(true);
  }
  
  const handlePayPayroll = async (payrollId: string) => {
    try {
        await updatePayrollStatus(payrollId, "مدفوع");
        toast({title: "تم الدفع", description: "تم تسجيل دفعة المسير بنجاح."});
    } catch (e) {
        toast({ title: "خطأ", description: "لم يتم تسجيل الدفعة.", variant: "destructive" });
    }
  }

  const handleAttendanceSubmit = async (values: AttendanceFormValues) => {
      let hours = "0";
      if (values.checkIn && values.checkOut) {
        try {
            const [inHours, inMinutes] = values.checkIn.split(':').map(Number);
            const [outHours, outMinutes] = values.checkOut.split(':').map(Number);
            const checkInDate = new Date(0); checkInDate.setHours(inHours, inMinutes);
            const checkOutDate = new Date(0); checkOutDate.setHours(outHours, outMinutes);
            if (checkOutDate > checkInDate) {
                const diffMs = checkOutDate.getTime() - checkInDate.getTime();
                hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
            }
        } catch(e) { console.error("Error calculating hours:", e); }
      }
      const finalValues = {...values, hours};

      try {
        if (attendanceToEdit) {
          await updateAttendance({ ...finalValues, id: attendanceToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل سجل الحضور." });
        } else {
          await addAttendance(finalValues);
          toast({ title: "تم التسجيل", description: "تم تسجيل الحضور." });
        }
        setShowEditAttendanceDialog(false);
        setAttendanceToEdit(null);
      } catch (error) {
        toast({ title: "خطأ", description: "لم يتم حفظ سجل الحضور.", variant: "destructive" });
      }
  };

  const handleLeaveRequestSubmit = async (values: LeaveRequestFormValues) => {
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const finalValues = {...values, days: diffDays};

    try {
      if (leaveRequestToEdit) {
        await updateLeaveRequestStatus(leaveRequestToEdit.id!, values.status, finalValues);
        toast({ title: "تم التعديل", description: "تم تعديل طلب الإجازة." });
      } else {
        await addLeaveRequest(finalValues);
        toast({ title: "تم الإرسال", description: "تم إرسال طلب الإجازة بنجاح." });
      }
      setShowCreateLeaveDialog(false);
      setLeaveRequestToEdit(null);
    } catch(e) {
       toast({ title: "خطأ", description: "لم يتم إرسال طلب الإجازة.", variant: "destructive" });
    }
  };

  const handleLeaveAction = async (leaveId: string, newStatus: "موافق عليها" | "مرفوضة") => {
      try {
        await updateLeaveRequestStatus(leaveId, newStatus);
        toast({ title: "تم تحديث الطلب", description: `تم ${newStatus === "موافق عليها" ? "الموافقة على" : "رفض"} طلب الإجازة.` });
      } catch(e) {
        toast({ title: "خطأ", description: "لم يتم تحديث حالة الطلب.", variant: "destructive" });
      }
  };

  const handleViewLeave = (leave: LeaveRequestFormValues) => {
      const employee = employees.find(e => e.id === leave.employeeId);
      setSelectedLeaveForView({...leave, employeeName: employee?.name});
      setShowViewLeaveDialog(true);
  };

  const handleWarningNoticeSubmit = async (values: WarningNoticeFormValues) => {
    try {
      if (warningNoticeToEdit) {
          await updateWarningNotice({ ...values, id: warningNoticeToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل لفت النظر بنجاح." });
      } else {
          await addWarningNotice(values);
          toast({ title: "تم الإنشاء", description: "تم إنشاء لفت النظر بنجاح." });
      }
      setShowManageWarningNoticeDialog(false);
      setWarningNoticeToEdit(null);
    } catch(e) {
       toast({ title: "خطأ", description: "لم يتم حفظ لفت النظر.", variant: "destructive" });
    }
  };

  const handleDeleteWarningNotice = async (warningNoticeId: string) => {
    try {
      await deleteWarningNotice(warningNoticeId);
      toast({ title: "تم الحذف", description: `تم حذف لفت النظر.`, variant: "destructive" });
    } catch(e) {
       toast({ title: "خطأ", description: "لم يتم حذف لفت النظر.", variant: "destructive" });
    }
  };

  const handlePrintWarningNotice = (notice: WarningNoticeFormValues) => {
    setSelectedWarningNoticeForPrint(notice);
    setShowPrintWarningNoticeDialog(true);
  };

  const handleAdministrativeDecisionSubmit = async (values: AdministrativeDecisionFormValues) => {
    try {
      if (adminDecisionToEdit) {
          await updateAdministrativeDecision({ ...values, id: adminDecisionToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل القرار الإداري بنجاح." });
      } else {
          await addAdministrativeDecision(values);
          toast({ title: "تم الإنشاء", description: "تم إنشاء القرار الإداري بنجاح." });
      }
      setShowManageAdminDecisionDialog(false);
      setAdminDecisionToEdit(null);
    } catch (e) {
      toast({ title: "خطأ", description: "لم يتم حفظ القرار الإداري.", variant: "destructive" });
    }
  };
  const handleDeleteAdministrativeDecision = async (decisionId: string) => {
    try {
      await deleteAdministrativeDecision(decisionId);
      toast({ title: "تم الحذف", description: `تم حذف القرار الإداري.`, variant: "destructive" });
    } catch (e) {
       toast({ title: "خطأ", description: "لم يتم حذف القرار.", variant: "destructive" });
    }
  };
  const handlePrintAdministrativeDecision = (decision: AdministrativeDecisionFormValues) => {
    setSelectedAdminDecisionForPrint(decision);
    setShowPrintAdminDecisionDialog(true);
  };
  
  const handleResignationSubmit = async (values: ResignationFormValues) => {
    try {
      if (resignationToEdit) {
          await updateResignation({ ...values, id: resignationToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل طلب الاستقالة بنجاح." });
      } else {
          await addResignation(values);
          toast({ title: "تم التقديم", description: "تم تقديم طلب الاستقالة بنجاح." });
      }
      setShowManageResignationDialog(false);
      setResignationToEdit(null);
    } catch(e) {
       toast({ title: "خطأ", description: "لم يتم حفظ طلب الاستقالة.", variant: "destructive" });
    }
  };
  const handleDeleteResignation = async (resignationId: string) => {
    try {
        await deleteResignation(resignationId);
        toast({ title: "تم الحذف", description: `تم حذف طلب الاستقالة.`, variant: "destructive" });
    } catch(e) {
        toast({ title: "خطأ", description: "لم يتم حذف الطلب.", variant: "destructive" });
    }
  };
  const handlePrintResignation = (resignation: ResignationFormValues) => {
    setSelectedResignationForPrint(resignation);
    setShowPrintResignationDialog(true);
  };

  const handleDisciplinaryWarningSubmit = async (values: DisciplinaryWarningFormValues) => {
    try {
      if (disciplinaryToEdit) {
          await updateDisciplinaryWarning({ ...values, id: disciplinaryToEdit.id! });
          toast({ title: "تم التعديل", description: "تم تعديل الإنذار بنجاح." });
      } else {
          await addDisciplinaryWarning(values);
          toast({ title: "تم الإنشاء", description: "تم إنشاء الإنذار بنجاح." });
      }
      setShowManageDisciplinaryDialog(false);
      setDisciplinaryToEdit(null);
    } catch(e) {
       toast({ title: "خطأ", description: "لم يتم حفظ الإنذار.", variant: "destructive" });
    }
  };
  const handleDeleteDisciplinaryWarning = async (warningId: string) => {
    try {
        await deleteDisciplinaryWarning(warningId);
        toast({ title: "تم الحذف", description: `تم حذف الإنذار.`, variant: "destructive" });
    } catch(e) {
         toast({ title: "خطأ", description: "لم يتم حذف الإنذار.", variant: "destructive" });
    }
  };
  const handlePrintDisciplinaryWarning = (warning: DisciplinaryWarningFormValues) => {
    setSelectedDisciplinaryForPrint(warning);
    setShowPrintDisciplinaryDialog(true);
  };
  
  const handlePostPayroll = async (payrollId: string) => {
    try {
        await postPayrollToGL(payrollId);
        toast({ title: "تم الترحيل", description: "تم ترحيل مسير الرواتب إلى الحسابات العامة." });
    } catch (e: any) {
        toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };


  return (
    <div className="container mx-auto py-6" dir="rtl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">الموارد البشرية والرواتب</h1>
        <div className="flex gap-2">
          <Dialog open={showAddEmployeeDialog} onOpenChange={(isOpen) => {setShowAddEmployeeDialog(isOpen); if(!isOpen) setEmployeeToEdit(null);}}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setEmployeeToEdit(null); employeeForm.reset(employeeDefaultValues); setShowAddEmployeeDialog(true);}}>
                <PlusCircle className="me-2 h-4 w-4" /> إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]" dir="rtl">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{employeeToEdit ? "تعديل بيانات موظف" : "إضافة موظف جديد"}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto min-h-0 py-4">
                    <Form {...employeeForm}>
                        <form onSubmit={employeeForm.handleSubmit(handleEmployeeSubmit)} className="space-y-4 px-2" id="employeeDialogForm">
                            <Tabs defaultValue="personal" className="w-full flex flex-col" dir="rtl">
                                <TabsList className="w-full mb-4 flex-shrink-0 sticky top-0 bg-background z-10 border-b">
                                    <TabsTrigger value="personal" className="flex-1">معلومات شخصية ووظيفية</TabsTrigger>
                                    <TabsTrigger value="contract" className="flex-1">العقد والتوظيف</TabsTrigger>
                                    <TabsTrigger value="financial" className="flex-1">المعلومات المالية</TabsTrigger>
                                </TabsList>
                                <div className="flex-grow overflow-y-auto min-h-0">
                                    <TabsContent value="personal" className="space-y-4 mt-0">
                                        <FormField control={employeeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم الموظف</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>المسمى الوظيفي</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المسمى" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockJobTitles.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="department" render={({ field }) => (<FormItem><FormLabel>القسم</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl>
                                                <SelectContent>{mockDepartments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input type="tel" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>الجنسية</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>رقم الهوية/الإقامة</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={employeeForm.control} name="avatarUrl" render={({ field }) => (<FormItem><FormLabel>رابط صورة الموظف (اختياري)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/avatar.jpg" className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>كلمات مفتاحية للصورة (AI Hint)</FormLabel><FormControl><Input {...field} placeholder="مثال: رجل أعمال (كلمتين كحد أقصى)" className="bg-background" /></FormControl><DialogDescriptionComponent className="text-xs text-muted-foreground">كلمة أو كلمتين لوصف الصورة (للبحث).</DialogDescriptionComponent><FormMessage /></FormItem>)} />
                                    </TabsContent>

                                    <TabsContent value="contract" className="space-y-4 mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="contractStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ بداية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="contractEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ نهاية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={employeeForm.control} name="employmentType" render={({ field }) => (<FormItem><FormLabel>نوع التوظيف</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                            <SelectContent>{mockEmploymentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>حالة الموظف</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                            <SelectContent>{["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="financial" className="space-y-4 mt-0">
                                        <FormField control={employeeForm.control} name="basicSalary" render={({ field }) => (<FormItem><FormLabel>الراتب الأساسي (SAR)</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="iban" render={({ field }) => (<FormItem><FormLabel>رقم الآيبان (IBAN)</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={employeeForm.control} name="socialInsuranceNumber" render={({ field }) => (<FormItem><FormLabel>رقم التأمينات الاجتماعية</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <Separator className="my-3"/>
                                        <FormLabel>البدلات</FormLabel>
                                        {allowanceFormFields.map((item, index) => (
                                            <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                                <FormField control={employeeForm.control} name={`allowances.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف البدل</FormLabel><FormControl><Input placeholder="وصف البدل" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`allowances.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ (SAR)</FormLabel><FormControl><Input type="number" placeholder="المبلغ" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`allowances.${index}.type`} render={({ field }) => (<FormItem><FormLabel className="text-xs">نوع البدل</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="اختر نوع البدل" /></SelectTrigger></FormControl>
                                                    <SelectContent>{["ثابت", "متغير", "مرة واحدة"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeAllowanceField(index)} className="text-destructive w-full justify-start p-1 text-xs h-auto"><MinusCircle className="me-1 h-3 w-3" /> إزالة البدل</Button>
                                            </Card>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendAllowanceField({description: '', amount: 0, type: "ثابت"})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة بدل</Button>
                                        <Separator className="my-3"/>
                                        <FormLabel>الخصومات</FormLabel>
                                        {deductionFormFields.map((item, index) => (
                                            <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                                <FormField control={employeeForm.control} name={`deductions.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف الخصم</FormLabel><FormControl><Input placeholder="وصف الخصم" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`deductions.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ (SAR)</FormLabel><FormControl><Input type="number" placeholder="المبلغ" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`deductions.${index}.type`} render={({ field }) => (<FormItem><FormLabel className="text-xs">نوع الخصم</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="اختر نوع الخصم" /></SelectTrigger></FormControl>
                                                    <SelectContent>{["ثابت", "متغير", "مرة واحدة"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeDeductionField(index)} className="text-destructive w-full justify-start p-1 text-xs h-auto"><MinusCircle className="me-1 h-3 w-3" /> إزالة الخصم</Button>
                                            </Card>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendDeductionField({description: '', amount: 0, type: "ثابت"})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة خصم</Button>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </form>
                    </Form>
                </div>
                <DialogFooter className="flex-shrink-0 border-t pt-4">
                    <Button type="submit" form="employeeDialogForm">{employeeToEdit ? "حفظ التعديلات" : "إضافة الموظف"}</Button>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="employeeManagement" className="w-full" dir="rtl">
        <TabsList className="w-full mb-6 bg-muted p-1 rounded-md">
          <TabsTrigger value="employeeManagement" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="inline-block me-2 h-4 w-4" /> إدارة الموظفين
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Briefcase className="inline-block me-2 h-4 w-4" /> مسيرات الرواتب
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <CalendarDays className="inline-block me-2 h-4 w-4" /> الحضور والانصراف
          </TabsTrigger>
          <TabsTrigger value="leaveRequests" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LogOut className="inline-block me-2 h-4 w-4" /> طلبات الإجازات
          </TabsTrigger>
           <TabsTrigger value="forms" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FolderOpen className="inline-block me-2 h-4 w-4" /> النماذج
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>مسيرات الرواتب</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { setPayrollToEdit(null); payrollForm.reset(); setShowCreatePayrollDialog(true); }}>
                  <PlusCircle className="me-2 h-4 w-4" /> إنشاء مسير رواتب
                </Button>
              </div>
              <CardDescription>إدارة ومعالجة مسيرات الرواتب الشهرية للموظفين.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشهر/السنة</TableHead>
                    <TableHead>الموظف</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>صافي الراتب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.monthYear}</TableCell>
                      <TableCell>{employees.find(e => e.id === p.employeeId)?.name}</TableCell>
                      <TableCell dangerouslySetInnerHTML={{ __html: formatCurrency(p.basicSalary || 0) }}></TableCell>
                      <TableCell className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(p.netSalary || 0) }}></TableCell>
                      <TableCell>
                        <Badge variant={p.status === "مدفوع" ? "default" : p.status === "مرحل للحسابات" ? "secondary" : "outline"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" title="عرض" onClick={() => handleViewPayroll(p)}><Eye className="h-4 w-4" /></Button>
                        {p.status === "مسودة" && (<Button variant="ghost" size="icon" title="تعديل" onClick={() => { setPayrollToEdit(p); setShowCreatePayrollDialog(true); }}><Edit className="h-4 w-4" /></Button>)}
                        {p.status === "معتمد" && (<Button variant="ghost" size="icon" title="ترحيل للحسابات" className="text-blue-600" onClick={() => handlePostPayroll(p.id!)}><UploadCloud className="h-4 w-4" /></Button>)}
                        {p.status === "مرحل للحسابات" && (<Button variant="ghost" size="icon" title="تسجيل كمدفوع" className="text-green-600" onClick={() => handlePayPayroll(p.id!)}><Banknote className="h-4 w-4" /></Button>)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Other tabs remain the same */}
      </Tabs>
    </div>
  );
}

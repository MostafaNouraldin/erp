
      "use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DatePickerWithPresets } from "@/components/date-picker-with-presets";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, CalendarDays, LogOut, PlusCircle, Search, Filter, Edit, Trash2, FileText, CheckCircle, XCircle, Clock, Eye, DollarSign, FileClock, Send, MinusCircle, Shield, Banknote, CalendarPlus, CalendarCheck2, UserCog, Award, Plane } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';


// Schemas
const employeeAllowanceSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف البدل مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  type: z.enum(["ثابت", "متغير", "مرة واحدة"]).default("ثابت"),
});

const employeeDelegationSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف الانتداب مطلوب"),
  startDate: z.date({ required_error: "تاريخ بداية الانتداب مطلوب" }),
  endDate: z.date({ required_error: "تاريخ نهاية الانتداب مطلوب" }),
  location: z.string().min(1, "مكان الانتداب مطلوب"),
  status: z.enum(["مخطط له", "جارٍ", "مكتمل", "ملغى"]).default("مخطط له"),
});

const employeeIncentiveSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "وصف الحافز مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  date: z.date({ required_error: "تاريخ استحقاق الحافز مطلوب" }),
  type: z.enum(["شهري", "ربع سنوي", "سنوي", "مرة واحدة"]).default("مرة واحدة"),
});


const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الموظف مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),

  // Contract Information
  contractStartDate: z.date({ required_error: "تاريخ بداية العقد مطلوب" }),
  contractEndDate: z.date({ required_error: "تاريخ نهاية العقد مطلوب" }),
  contractDuration: z.string().optional(),
  probationEndDate: z.date().optional().nullable(),
  canRenewContract: z.boolean().default(true),
  employmentType: z.enum(["دوام كامل", "دوام جزئي", "عقد محدد", "مستقل"], { required_error: "نوع التوظيف مطلوب" }).default("دوام كامل"),
  contractType: z.enum(["فردي", "عائلي"], { required_error: "نوع العقد مطلوب" }).default("فردي"),

  // Personal Information
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  avatarUrl: z.string().url("رابط الصورة غير صالح").optional().or(z.literal('')),
  dataAiHint: z.string().max(30, "الكلمات المفتاحية يجب ألا تتجاوز 30 حرفًا").optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  workLocation: z.string().optional(),

  // Financial Information
  basicSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون إيجابياً"),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  allowances: z.array(employeeAllowanceSchema).optional().default([]), // Replaced housing & transportation with general allowances

  // Medical Insurance
  medicalInsuranceProvider: z.string().optional(),
  medicalInsurancePolicyNumber: z.string().optional(),
  medicalInsuranceExpiryDate: z.date().optional().nullable(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  status: z.enum(["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"]).default("نشط"),

  // New Fields
  delegations: z.array(employeeDelegationSchema).optional().default([]),
  incentives: z.array(employeeIncentiveSchema).optional().default([]),
});
type EmployeeFormValues = z.infer<typeof employeeSchema>;

const payrollItemSchema = z.object({
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
  status: z.enum(["مسودة", "قيد المعالجة", "مدفوع", "ملغي"]).default("مسودة"),
  netSalary: z.coerce.number().optional(),
});
type PayrollFormValues = z.infer<typeof payrollSchema>;

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
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const leaveRequestSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  type: z.string().min(1, "نوع الإجازة مطلوب"),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  reason: z.string().optional(),
  status: z.enum(["مقدمة", "موافق عليها", "مرفوضة", "ملغاة"]).default("مقدمة"),
  days: z.coerce.number().optional(),
});
type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

// Mock data
const initialEmployeesData: EmployeeFormValues[] = [
  { id: "EMP001", name: "أحمد محمود", department: "قسم المبيعات", jobTitle: "مدير مبيعات", contractStartDate: new Date("2022-01-15"), contractEndDate: new Date("2025-01-14"), contractDuration: "3 سنوات", probationEndDate: new Date("2022-04-15"), canRenewContract: true, employmentType: "دوام كامل", contractType: "عائلي", status: "نشط", basicSalary: 12000, email: "ahmed.m@example.com", phone: "0501234567", avatarUrl: "https://picsum.photos/100/100?random=1", dataAiHint: "man portrait", nationality: "سعودي", idNumber: "1012345678", bankName: "البنك الأهلي", iban: "SA0380000000608010167519", socialInsuranceNumber:"12345001", medicalInsuranceProvider: "بوبا للتأمين", medicalInsurancePolicyNumber: "BUPA-111", medicalInsuranceExpiryDate: new Date("2024-12-31"), allowances: [{id: "ALW001", description: "بدل سكن", amount:3000, type: "ثابت"}, {id: "ALW002", description: "بدل مواصلات", amount:1000, type: "ثابت"}, {id:"ALW003", description: "بدل طبيعة عمل", amount:500, type: "متغير"}], emergencyContactName: "محمد محمود", emergencyContactPhone:"0507654321", workLocation: "المقر الرئيسي - الرياض", delegations: [{id: "DEL001", description: "مهمة عمل لمعرض دبي", startDate: new Date("2024-09-01"), endDate: new Date("2024-09-05"), location: "دبي", status: "مخطط له"}], incentives: [{id: "INC001", description: "مكافأة تحقيق الهدف السنوي", amount: 5000, date: new Date("2024-12-31"), type: "سنوي"}]  },
  { id: "EMP002", name: "فاطمة علي", department: "قسم التسويق", jobTitle: "أخصائية تسويق", contractStartDate: new Date("2023-03-01"), contractEndDate: new Date("2025-02-28"), contractDuration: "سنتان", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 8000, email: "fatima.a@example.com", phone: "0509876543", avatarUrl: "https://picsum.photos/100/100?random=2", dataAiHint: "woman portrait", nationality: "سعودية", idNumber:"2023456789", medicalInsuranceProvider: "التعاونية للتأمين", medicalInsurancePolicyNumber: "TAW-222", medicalInsuranceExpiryDate: new Date("2025-01-31"), allowances: [], emergencyContactName:"علي حسن", emergencyContactPhone: "0551231234", workLocation: "فرع جدة", delegations: [], incentives: []},
  { id: "EMP003", name: "خالد عبدالله", department: "قسم المالية", jobTitle: "محاسب أول", contractStartDate: new Date("2021-07-20"), contractEndDate: new Date("2024-07-19"), contractDuration: "3 سنوات", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 10000, email: "khaled.ab@example.com", phone: "0501122334", avatarUrl: "https://picsum.photos/100/100?random=3", dataAiHint: "man office", allowances: [], workLocation: "المقر الرئيسي - الرياض", delegations: [], incentives: [] },
  { id: "EMP004", name: "سارة إبراهيم", department: "قسم الموارد البشرية", jobTitle: "مسؤول موارد بشرية", contractStartDate: new Date("2024-02-10"), contractEndDate: new Date("2026-02-09"), contractDuration: "سنتان", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 9000, email: "sara.i@example.com", phone: "0504455667", avatarUrl: "https://picsum.photos/100/100?random=4", dataAiHint: "woman smiling", allowances: [], delegations: [], incentives: [] },
  { id: "EMP005", name: "يوسف حسن", department: "قسم التشغيل", jobTitle: "فني صيانة", contractStartDate: new Date("2020-05-01"), contractEndDate: new Date("2024-04-30"), contractDuration: "4 سنوات", canRenewContract: false, employmentType: "دوام كامل", contractType: "فردي", status: "في إجازة", basicSalary: 7000, email: "youssef.h@example.com", phone: "0507788990", avatarUrl: "https://picsum.photos/100/100?random=5", dataAiHint: "man worker", allowances: [], delegations: [], incentives: [] },
];

const initialPayrollData = [
  { id: "PAY001", employeeId: "EMP001", monthYear: "يوليو 2024", basicSalary: 12000, allowances: [{description: "بدل سكن", amount: 2500}, {description: "بدل مواصلات", amount: 500}], deductions: [{description: "سلفة", amount: 500}], netSalary: 14500, status: "مدفوع" as const, notes: "تم الدفع مع سداد السلفة." },
  { id: "PAY002", employeeId: "EMP002", monthYear: "يوليو 2024", basicSalary: 8000, allowances: [{description: "بدل طبيعة عمل", amount: 1500}], deductions: [{description: "تأمين صحي", amount:200}], netSalary: 9300, status: "مدفوع" as const, notes: "" },
  { id: "PAY003", employeeId: "EMP003", monthYear: "يوليو 2024", basicSalary: 10000, allowances: [{description: "بدل إضافي", amount:2000}], deductions: [{description: "جزاء تأخير", amount:300}], netSalary: 11700, status: "قيد المعالجة" as const, notes: "يراجع من المدير المالي" },
];


const initialAttendanceData = [
  { id: "ATT001", employeeId: "EMP001", date: new Date("2024-07-25"), checkIn: "08:55", checkOut: "17:05", hours: "8.17", status: "حاضر" as const, notes: "" },
  { id: "ATT002", employeeId: "EMP002", date: new Date("2024-07-25"), checkIn: "09:10", checkOut: "17:00", hours: "7.83", status: "حاضر (متأخر)" as const, notes: "تأخير 10 دقائق" },
  { id: "ATT003", employeeId: "EMP003", date: new Date("2024-07-25"), checkIn: null, checkOut: null, hours: "0", status: "غائب" as const, notes: "غياب بدون عذر" },
  { id: "ATT004", employeeId: "EMP004", date: new Date("2024-07-25"), checkIn: "09:00", checkOut: "16:30", hours: "7.5", status: "حاضر (مغادرة مبكرة)" as const, notes: "استئذان شخصي" },
];

const initialLeaveRequestsData = [
  { id: "LR001", employeeId: "EMP005", type: "إجازة سنوية", startDate: new Date("2024-08-01"), endDate: new Date("2024-08-10"), days: 10, status: "موافق عليها" as const, reason: "إجازة اعتيادية" },
  { id: "LR002", employeeId: "EMP002", type: "إجازة مرضية", startDate: new Date("2024-07-28"), endDate: new Date("2024-07-29"), days: 2, status: "مقدمة" as const, reason: "وعكة صحية طارئة" },
  { id: "LR003", employeeId: "EMP001", type: "إجازة عارضة", startDate: new Date("2024-09-05"), endDate: new Date("2024-09-05"), days: 1, status: "مرفوضة" as const, reason: "ظرف طارئ" },
];
const mockDepartments = ["قسم المبيعات", "قسم التسويق", "قسم المالية", "قسم الموارد البشرية", "قسم التشغيل", "الإدارة"];
const mockJobTitles = ["مدير مبيعات", "أخصائية تسويق", "محاسب أول", "مسؤول موارد بشرية", "فني صيانة", "مدير قسم", "مساعد إداري"];
const mockEmploymentTypes = ["دوام كامل", "دوام جزئي", "عقد محدد", "مستقل"];
const mockContractTypes = ["فردي", "عائلي"];

const employeeDefaultValues: EmployeeFormValues = {
  name: "", department: "", jobTitle: "", contractStartDate: new Date(), contractEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  status: "نشط", basicSalary: 0, email: "", phone: "", avatarUrl: "", dataAiHint: "",
  contractDuration: "سنة واحدة", probationEndDate: null, canRenewContract: true, employmentType: "دوام كامل", contractType: "فردي",
  nationality: "", idNumber: "", workLocation: "", bankName: "", iban: "", socialInsuranceNumber: "",
  allowances: [],
  medicalInsuranceProvider: "", medicalInsurancePolicyNumber: "", medicalInsuranceExpiryDate: null,
  emergencyContactName: "", emergencyContactPhone: "",
  delegations: [], incentives: [],
};


export default function HRPayrollPage() {
  const [employees, setEmployeesData] = useState(initialEmployeesData);
  const [payrollData, setPayrollDataState] = useState(initialPayrollData);
  const [attendanceData, setAttendanceDataState] = useState(initialAttendanceData);
  const [leaveRequests, setLeaveRequestsData] = useState(initialLeaveRequestsData);

  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeFormValues | null>(null);
  const [showViewEmployeeDialog, setShowViewEmployeeDialog] = useState(false);
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<EmployeeFormValues | null>(null);

  const [showCreatePayrollDialog, setShowCreatePayrollDialog] = useState(false);
  const [payrollToEdit, setPayrollToEdit] = useState<PayrollFormValues | null>(null);
  const [showViewPayrollDialog, setShowViewPayrollDialog] = useState(false);
  const [selectedPayrollForView, setSelectedPayrollForView] = useState<PayrollFormValues & {employeeName?: string} | null>(null);


  const [showEditAttendanceDialog, setShowEditAttendanceDialog] = useState(false);
  const [attendanceToEdit, setAttendanceToEdit] = useState<AttendanceFormValues | null>(null);

  const [showCreateLeaveDialog, setShowCreateLeaveDialog] = useState(false);
  const [leaveRequestToEdit, setLeaveRequestToEdit] = useState<LeaveRequestFormValues | null>(null);
  const [showViewLeaveDialog, setShowViewLeaveDialog] = useState(false);
  const [selectedLeaveForView, setSelectedLeaveForView] = useState<(LeaveRequestFormValues & {employeeName?:string}) | null>(null);


  const { toast } = useToast();

  const employeeForm = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: employeeDefaultValues });
  const { fields: allowanceFormFields, append: appendAllowanceField, remove: removeAllowanceField } = useFieldArray({ control: employeeForm.control, name: "allowances" });
  const { fields: delegationFormFields, append: appendDelegationField, remove: removeDelegationField } = useFieldArray({ control: employeeForm.control, name: "delegations" });
  const { fields: incentiveFormFields, append: appendIncentiveField, remove: removeIncentiveField } = useFieldArray({ control: employeeForm.control, name: "incentives" });


  const payrollForm = useForm<PayrollFormValues>({ resolver: zodResolver(payrollSchema) });
  const { fields: payrollAllowanceFields, append: appendPayrollAllowance, remove: removePayrollAllowance } = useFieldArray({ control: payrollForm.control, name: "allowances" });
  const { fields: payrollDeductionFields, append: appendPayrollDeduction, remove: removePayrollDeduction } = useFieldArray({ control: payrollForm.control, name: "deductions" });

  const attendanceForm = useForm<AttendanceFormValues>({ resolver: zodResolver(attendanceSchema) });
  const leaveRequestForm = useForm<LeaveRequestFormValues>({ resolver: zodResolver(leaveRequestSchema) });

  useEffect(() => {
    if (employeeToEdit) employeeForm.reset(employeeToEdit);
    else employeeForm.reset(employeeDefaultValues);
  }, [employeeToEdit, employeeForm, showAddEmployeeDialog]);

  useEffect(() => {
    if (payrollToEdit) {
        const emp = employees.find(e => e.id === payrollToEdit.employeeId);
        payrollForm.reset({
            ...payrollToEdit,
            basicSalary: payrollToEdit.basicSalary || emp?.basicSalary || 0,
        });
    } else {
        const currentMonthYear = `${new Date().toLocaleString('ar-SA', { month: 'long' })} ${new Date().getFullYear()}`;
        payrollForm.reset({ employeeId: "", monthYear: currentMonthYear, basicSalary: 0, allowances: [], deductions: [], notes: "", status: "مسودة" });
    }
  }, [payrollToEdit, payrollForm, showCreatePayrollDialog, employees]);

  useEffect(() => {
    if (attendanceToEdit) attendanceForm.reset(attendanceToEdit);
    else attendanceForm.reset({ employeeId: "", date: new Date(), checkIn: null, checkOut: null, notes: "", status: "حاضر" });
  }, [attendanceToEdit, attendanceForm, showEditAttendanceDialog]);

  useEffect(() => {
    if (leaveRequestToEdit) leaveRequestForm.reset(leaveRequestToEdit);
    else leaveRequestForm.reset({ employeeId: "", type: "", startDate: new Date(), endDate: new Date(), reason: "", status: "مقدمة" });
  }, [leaveRequestToEdit, leaveRequestForm, showCreateLeaveDialog]);

  const handleEmployeeSubmit = (values: EmployeeFormValues) => {
    if (employeeToEdit) {
      setEmployeesData(prev => prev.map(emp => emp.id === employeeToEdit.id ? { ...values, id: employeeToEdit.id } : emp));
      toast({ title: "تم التعديل", description: `تم تعديل بيانات الموظف ${values.name}.` });
    } else {
      setEmployeesData(prev => [...prev, { ...values, id: `EMP${Date.now()}` }]);
      toast({ title: "تمت الإضافة", description: `تم إضافة الموظف ${values.name} بنجاح.` });
    }
    setShowAddEmployeeDialog(false);
    setEmployeeToEdit(null);
  };

  const handleTerminateEmployee = (employeeId: string) => {
      setEmployeesData(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: "منتهية خدمته" } : emp));
      toast({ title: "إنهاء خدمة", description: `تم إنهاء خدمة الموظف ${employeeId}.`, variant: "destructive" });
  };

  const handleViewEmployee = (employee: EmployeeFormValues) => {
      setSelectedEmployeeForView(employee);
      setShowViewEmployeeDialog(true);
  };

  const handlePayrollSubmit = (values: PayrollFormValues) => {
    const totalAllowances = values.allowances?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const totalDeductions = values.deductions?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const netSalary = (values.basicSalary || 0) + totalAllowances - totalDeductions;
    const employee = employees.find(e => e.id === values.employeeId);

    const finalValues = { ...values, netSalary, employeeName: employee?.name };

    if (payrollToEdit) {
      setPayrollDataState(prev => prev.map(p => p.id === payrollToEdit.id ? { ...finalValues, id: payrollToEdit.id! } : p));
      toast({ title: "تم التعديل", description: `تم تعديل مسير الرواتب للموظف ${employee?.name}.` });
    } else {
      setPayrollDataState(prev => [...prev, { ...finalValues, id: `PAY${Date.now()}` }]);
      toast({ title: "تم الإنشاء", description: `تم إنشاء مسير الرواتب للموظف ${employee?.name}.` });
    }
    setShowCreatePayrollDialog(false);
    setPayrollToEdit(null);
  };

  const handleViewPayroll = (payroll: PayrollFormValues) => {
      const employee = employees.find(e => e.id === payroll.employeeId);
      setSelectedPayrollForView({...payroll, employeeName: employee?.name });
      setShowViewPayrollDialog(true);
  }

  const handleAttendanceSubmit = (values: AttendanceFormValues) => {
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
    if (attendanceToEdit) {
      setAttendanceDataState(prev => prev.map(att => att.id === attendanceToEdit.id ? { ...finalValues, id: attendanceToEdit.id! } : att));
      toast({ title: "تم التعديل", description: "تم تعديل سجل الحضور." });
    } else {
      setAttendanceDataState(prev => [...prev, { ...finalValues, id: `ATT${Date.now()}` }]);
      toast({ title: "تم التسجيل", description: "تم تسجيل الحضور." });
    }
    setShowEditAttendanceDialog(false);
    setAttendanceToEdit(null);
  };

  const handleLeaveRequestSubmit = (values: LeaveRequestFormValues) => {
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const finalValues = {...values, days: diffDays};

    if (leaveRequestToEdit) {
      setLeaveRequestsData(prev => prev.map(lr => lr.id === leaveRequestToEdit.id ? { ...finalValues, id: leaveRequestToEdit.id! } : lr));
      toast({ title: "تم التعديل", description: "تم تعديل طلب الإجازة." });
    } else {
      setLeaveRequestsData(prev => [...prev, { ...finalValues, id: `LR${Date.now()}` }]);
      toast({ title: "تم الإرسال", description: "تم إرسال طلب الإجازة بنجاح." });
    }
    setShowCreateLeaveDialog(false);
    setLeaveRequestToEdit(null);
  };

  const handleLeaveAction = (leaveId: string, newStatus: "موافق عليها" | "مرفوضة") => {
      setLeaveRequestsData(prev => prev.map(lr => lr.id === leaveId ? { ...lr, status: newStatus } : lr));
      toast({ title: "تم تحديث الطلب", description: `تم ${newStatus === "موافق عليها" ? "الموافقة على" : "رفض"} طلب الإجازة.` });
  };

  const handleViewLeave = (leave: LeaveRequestFormValues) => {
      const employee = employees.find(e => e.id === leave.employeeId);
      setSelectedLeaveForView({...leave, employeeName: employee?.name});
      setShowViewLeaveDialog(true);
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
            <DialogContent className="sm:max-w-3xl" dir="rtl">
                <DialogHeader><DialogTitle>{employeeToEdit ? "تعديل بيانات موظف" : "إضافة موظف جديد"}</DialogTitle></DialogHeader>
                <Form {...employeeForm}>
                    <form onSubmit={employeeForm.handleSubmit(handleEmployeeSubmit)} className="space-y-4 py-4">
                        <ScrollArea className="max-h-[70vh] p-1">
                        <Tabs defaultValue="personal" className="w-full" dir="rtl">
                            <TabsList className="w-full mb-4">
                                <TabsTrigger value="personal" className="flex-1">معلومات شخصية ووظيفية</TabsTrigger>
                                <TabsTrigger value="contract" className="flex-1">العقد والانتدابات</TabsTrigger>
                                <TabsTrigger value="financial" className="flex-1">معلومات مالية وحوافز</TabsTrigger>
                                <TabsTrigger value="insurance" className="flex-1">التأمين والطوارئ</TabsTrigger>
                            </TabsList>

                            <TabsContent value="personal" className="space-y-4">
                                <FormField control={employeeForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>اسم الموظف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>المسمى الوظيفي</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر المسمى" /></SelectTrigger></FormControl>
                                        <SelectContent>{mockJobTitles.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="department" render={({ field }) => (<FormItem><FormLabel>القسم</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger></FormControl>
                                        <SelectContent>{mockDepartments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="phone" render={({ field }) => (<FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="nationality" render={({ field }) => (<FormItem><FormLabel>الجنسية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>رقم الهوية/الإقامة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={employeeForm.control} name="workLocation" render={({ field }) => (<FormItem><FormLabel>موقع العمل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={employeeForm.control} name="avatarUrl" render={({ field }) => (<FormItem><FormLabel>رابط صورة الموظف (اختياري)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/avatar.jpg" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={employeeForm.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>كلمات مفتاحية للصورة (AI Hint)</FormLabel><FormControl><Input {...field} placeholder="مثال: رجل أعمال (كلمتين كحد أقصى)" /></FormControl><DialogDescription className="text-xs text-muted-foreground">كلمة أو كلمتين لوصف الصورة (للبحث).</DialogDescription><FormMessage /></FormItem>)} />
                            </TabsContent>

                            <TabsContent value="contract" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="contractStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ بداية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="contractEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ نهاية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>مدة العقد</FormLabel><FormControl><Input {...field} placeholder="مثال: سنة واحدة, سنتان" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="probationEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>نهاية فترة التجربة (اختياري)</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField control={employeeForm.control} name="employmentType" render={({ field }) => (<FormItem><FormLabel>نوع التوظيف</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                      <SelectContent>{mockEmploymentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                  <FormField control={employeeForm.control} name="contractType" render={({ field }) => (<FormItem><FormLabel>نوع العقد</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر نوع العقد" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockContractTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={employeeForm.control} name="canRenewContract" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm rtl:space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="canRenewContractEmployee" /></FormControl><FormLabel htmlFor="canRenewContractEmployee" className="font-normal">العقد قابل للتجديد</FormLabel></FormItem>)} />
                                <FormField control={employeeForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>حالة الموظف</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                    <SelectContent>{["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <Separator className="my-3"/>
                                <FormLabel>الانتدابات</FormLabel>
                                {delegationFormFields.map((item, index) => (
                                    <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                        <FormField control={employeeForm.control} name={`delegations.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف الانتداب</FormLabel><FormControl><Input placeholder="وصف الانتداب" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-2 gap-2">
                                          <FormField control={employeeForm.control} name={`delegations.${index}.startDate`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ البدء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                          <FormField control={employeeForm.control} name={`delegations.${index}.endDate`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ الانتهاء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={employeeForm.control} name={`delegations.${index}.location`} render={({ field }) => (<FormItem><FormLabel className="text-xs">الموقع</FormLabel><FormControl><Input placeholder="موقع الانتداب" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`delegations.${index}.status`} render={({ field }) => (<FormItem><FormLabel className="text-xs">حالة الانتداب</FormLabel>
                                          <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                          <SelectContent>{["مخطط له", "جارٍ", "مكتمل", "ملغى"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDelegationField(index)} className="text-destructive w-full justify-start p-1"><MinusCircle className="me-1 h-4 w-4" /> إزالة الانتداب</Button>
                                    </Card>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendDelegationField({ description: '', startDate: new Date(), endDate: new Date(), location: '', status: "مخطط له" })}><PlusCircle className="me-1 h-3 w-3" /> إضافة انتداب</Button>
                            </TabsContent>

                            <TabsContent value="financial" className="space-y-4">
                                <FormField control={employeeForm.control} name="basicSalary" render={({ field }) => (<FormItem><FormLabel>الراتب الأساسي (SAR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>اسم البنك</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="iban" render={({ field }) => (<FormItem><FormLabel>رقم الآيبان (IBAN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={employeeForm.control} name="socialInsuranceNumber" render={({ field }) => (<FormItem><FormLabel>رقم التأمينات الاجتماعية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <Separator className="my-3"/>
                                <FormLabel>البدلات</FormLabel>
                                 {allowanceFormFields.map((item, index) => (
                                    <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                        <FormField control={employeeForm.control} name={`allowances.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف البدل</FormLabel><FormControl><Input placeholder="وصف البدل" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`allowances.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ (SAR)</FormLabel><FormControl><Input type="number" placeholder="المبلغ" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`allowances.${index}.type`} render={({ field }) => (<FormItem><FormLabel className="text-xs">نوع البدل</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر نوع البدل" /></SelectTrigger></FormControl>
                                            <SelectContent>{["ثابت", "متغير", "مرة واحدة"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAllowanceField(index)} className="text-destructive w-full justify-start p-1"><MinusCircle className="me-1 h-4 w-4" /> إزالة البدل</Button>
                                    </Card>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendAllowanceField({description: '', amount: 0, type: "ثابت"})}><PlusCircle className="me-1 h-3 w-3" /> إضافة بدل</Button>
                                 <Separator className="my-3"/>
                                <FormLabel>الحوافز والمكافآت</FormLabel>
                                {incentiveFormFields.map((item, index) => (
                                     <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                        <FormField control={employeeForm.control} name={`incentives.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف الحافز</FormLabel><FormControl><Input placeholder="وصف الحافز/المكافأة" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`incentives.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ (SAR)</FormLabel><FormControl><Input type="number" placeholder="المبلغ" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`incentives.${index}.date`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ الاستحقاق</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name={`incentives.${index}.type`} render={({ field }) => (<FormItem><FormLabel className="text-xs">نوع الحافز</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر نوع الحافز" /></SelectTrigger></FormControl>
                                            <SelectContent>{["شهري", "ربع سنوي", "سنوي", "مرة واحدة"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeIncentiveField(index)} className="text-destructive w-full justify-start p-1"><MinusCircle className="me-1 h-4 w-4" /> إزالة الحافز</Button>
                                    </Card>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendIncentiveField({description: '', amount: 0, date: new Date(), type: "مرة واحدة"})}><PlusCircle className="me-1 h-3 w-3" /> إضافة حافز</Button>
                            </TabsContent>
                             <TabsContent value="insurance" className="space-y-4">
                                <FormLabel>التأمين الطبي</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="medicalInsuranceProvider" render={({ field }) => (<FormItem><FormLabel>شركة التأمين</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="medicalInsurancePolicyNumber" render={({ field }) => (<FormItem><FormLabel>رقم البوليصة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={employeeForm.control} name="medicalInsuranceExpiryDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ انتهاء التأمين</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                <Separator className="my-3"/>
                                <FormLabel>معلومات الاتصال في الطوارئ</FormLabel>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={employeeForm.control} name="emergencyContactName" render={({ field }) => (<FormItem><FormLabel>اسم جهة الاتصال</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={employeeForm.control} name="emergencyContactPhone" render={({ field }) => (<FormItem><FormLabel>رقم هاتف جهة الاتصال</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </TabsContent>
                        </Tabs>
                        </ScrollArea>
                        <DialogFooter><Button type="submit">{employeeToEdit ? "حفظ التعديلات" : "إضافة الموظف"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreatePayrollDialog} onOpenChange={(isOpen) => {setShowCreatePayrollDialog(isOpen); if(!isOpen) setPayrollToEdit(null);}}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setPayrollToEdit(null); payrollForm.reset(); setShowCreatePayrollDialog(true);}}>
                    <PlusCircle className="me-2 h-4 w-4" /> إنشاء مسير رواتب
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl" dir="rtl">
                <DialogHeader><DialogTitle>{payrollToEdit ? "تعديل مسير رواتب" : "إنشاء مسير رواتب جديد"}</DialogTitle></DialogHeader>
                <Form {...payrollForm}>
                    <form onSubmit={payrollForm.handleSubmit(handlePayrollSubmit)} className="space-y-4 py-4">
                        <FormField control={payrollForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); const emp = employees.find(e => e.id === value); if (emp) payrollForm.setValue("basicSalary", emp.basicSalary); }} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                                <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                        <FormField control={payrollForm.control} name="monthYear" render={({ field }) => (<FormItem><FormLabel>الشهر والسنة</FormLabel><FormControl><Input {...field} placeholder="مثال: يوليو 2024" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={payrollForm.control} name="basicSalary" render={({ field }) => (<FormItem><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />

                        <Card><CardHeader><CardTitle className="text-sm">البدلات</CardTitle></CardHeader><CardContent>
                            <ScrollArea className="h-[100px]">{payrollAllowanceFields.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-end mb-2"><FormField control={payrollForm.control} name={`allowances.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={payrollForm.control} name={`allowances.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePayrollAllowance(index)} className="h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4" /></Button></div>))}
                            </ScrollArea><Button type="button" variant="outline" size="sm" onClick={() => appendPayrollAllowance({description: '', amount: 0})}><PlusCircle className="me-1 h-3 w-3" /> إضافة بدل</Button>
                        </CardContent></Card>

                        <Card><CardHeader><CardTitle className="text-sm">الخصومات</CardTitle></CardHeader><CardContent>
                             <ScrollArea className="h-[100px]">{payrollDeductionFields.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-end mb-2"><FormField control={payrollForm.control} name={`deductions.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={payrollForm.control} name={`deductions.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePayrollDeduction(index)} className="h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4" /></Button></div>))}
                            </ScrollArea><Button type="button" variant="outline" size="sm" onClick={() => appendPayrollDeduction({description: '', amount: 0})}><PlusCircle className="me-1 h-3 w-3" /> إضافة خصم</Button>
                        </CardContent></Card>
                        <FormField control={payrollForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><Button type="submit">{payrollToEdit ? "حفظ التعديلات" : "حفظ المسير"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                    </form>
                </Form>
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
        </TabsList>

        <TabsContent value="employeeManagement">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>سجلات الموظفين</CardTitle>
              <CardDescription>إدارة بيانات الموظفين، الوظائف، العقود، والمستندات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث في الموظفين..." className="pr-10 w-full sm:w-64 bg-background" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية القسم
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب القسم</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mockDepartments.map(dep => <DropdownMenuCheckboxItem key={dep}>{dep}</DropdownMenuCheckboxItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>الرقم الوظيفي</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>المسمى الوظيفي</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>تاريخ بداية العقد</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-muted/50">
                        <TableCell><Avatar className="h-9 w-9"><AvatarImage src={emp.avatarUrl} alt={emp.name} data-ai-hint={emp.dataAiHint || emp.name.split(' ').slice(0,2).join(' ') } /><AvatarFallback>{emp.name.substring(0,1)}</AvatarFallback></Avatar></TableCell>
                        <TableCell className="font-medium">{emp.id}</TableCell>
                        <TableCell>{emp.name}</TableCell>
                        <TableCell>{emp.jobTitle}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.contractStartDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell>
                        <TableCell>
                          <Badge variant={emp.status === "نشط" ? "default" : "secondary"}>{emp.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الملف الشخصي" onClick={() => handleViewEmployee(emp)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setEmployeeToEdit(emp); setShowAddEmployeeDialog(true);}}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {emp.status === "نشط" && <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إنهاء خدمة"><UserCog className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد إنهاء الخدمة</AlertDialogTitle><AlertDialogDescriptionComponent>هل أنت متأكد من إنهاء خدمة الموظف {emp.name}؟</AlertDialogDescriptionComponent></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleTerminateEmployee(emp.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                          </AlertDialog>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>مسيرات الرواتب</CardTitle>
              <CardDescription>إنشاء وإدارة مسيرات الرواتب الشهرية، البدلات، والخصومات.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                 <Input type="month" className="w-auto bg-background" defaultValue={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`} />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية الحالة
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب الحالة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مدفوع</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>قيد المعالجة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغي</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>معرف المسير</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>الشهر</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>البدلات</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>صافي الراتب</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((payroll) => {
                      const emp = employees.find(e => e.id === payroll.employeeId);
                      return (
                      <TableRow key={payroll.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{payroll.id}</TableCell>
                        <TableCell>{emp?.name}</TableCell>
                        <TableCell>{payroll.monthYear}</TableCell>
                        <TableCell>{(payroll.basicSalary || 0).toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</TableCell>
                        <TableCell>{(payroll.allowances?.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</TableCell>
                        <TableCell>{(payroll.deductions?.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</TableCell>
                        <TableCell className="font-semibold">{(payroll.netSalary || 0).toLocaleString('ar-SA', {style: 'currency', currency: 'SAR'})}</TableCell>
                        <TableCell>
                          <Badge variant={payroll.status === "مدفوع" ? "default" : "outline"}>{payroll.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewPayroll(payroll)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           {payroll.status !== "مدفوع" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المسير" onClick={() => {setPayrollToEdit(payroll); setShowCreatePayrollDialog(true);}}><Edit className="h-4 w-4" /></Button>}
                           {payroll.status === "قيد المعالجة" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="اعتماد ودفع"><DollarSign className="h-4 w-4 text-green-600"/></Button>}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>سجلات الحضور والانصراف</CardTitle>
              <CardDescription>متابعة حضور الموظفين، التأخير، الغياب، وساعات العمل الإضافية.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                 <DatePickerWithPresets mode="range" />
                 <Input placeholder="بحث باسم الموظف أو الرقم الوظيفي" className="w-full sm:w-64 pe-4 bg-background" />
                 <Dialog open={showEditAttendanceDialog} onOpenChange={(isOpen) => {setShowEditAttendanceDialog(isOpen); if(!isOpen) setAttendanceToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow" onClick={() => {setAttendanceToEdit(null); attendanceForm.reset(); setShowEditAttendanceDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> تسجيل حضور/انصراف يدوي
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="sm:max-w-md">
                        <DialogHeader><DialogTitle>{attendanceToEdit ? "تعديل سجل حضور" : "تسجيل حضور/انصراف يدوي"}</DialogTitle></DialogHeader>
                        <Form {...attendanceForm}>
                            <form onSubmit={attendanceForm.handleSubmit(handleAttendanceSubmit)} className="space-y-4 py-4">
                                <FormField control={attendanceForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                                    <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={attendanceForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={attendanceForm.control} name="checkIn" render={({ field }) => (<FormItem><FormLabel>وقت الحضور</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={attendanceForm.control} name="checkOut" render={({ field }) => (<FormItem><FormLabel>وقت الانصراف</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                 <FormField control={attendanceForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {["حاضر", "غائب", "حاضر (متأخر)", "حاضر (مغادرة مبكرة)", "إجازة"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={attendanceForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit">{attendanceToEdit ? "حفظ التعديل" : "تسجيل"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                 </Dialog>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>وقت الحضور</TableHead>
                      <TableHead>وقت الانصراف</TableHead>
                      <TableHead>ساعات العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((att) => (
                      <TableRow key={att.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{att.id}</TableCell>
                        <TableCell>{employees.find(e => e.id === att.employeeId)?.name}</TableCell>
                        <TableCell>{att.date.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell>
                        <TableCell>{att.checkIn || "--:--"}</TableCell>
                        <TableCell>{att.checkOut || "--:--"}</TableCell>
                        <TableCell>{att.hours}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                                att.status === "حاضر" ? "default" :
                                att.status === "غائب" ? "destructive" :
                                "secondary"
                            }
                            className="whitespace-nowrap"
                          >
                            {att.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل السجل" onClick={() => {setAttendanceToEdit(att); setShowEditAttendanceDialog(true);}}>
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

        <TabsContent value="leaveRequests">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>طلبات الإجازات</CardTitle>
              <CardDescription>إدارة طلبات الإجازات المقدمة من الموظفين والموافقة عليها أو رفضها.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
                <Dialog open={showCreateLeaveDialog} onOpenChange={(isOpen) => {setShowCreateLeaveDialog(isOpen); if(!isOpen) setLeaveRequestToEdit(null);}}>
                    <DialogTrigger asChild>
                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setLeaveRequestToEdit(null); leaveRequestForm.reset(); setShowCreateLeaveDialog(true);}}>
                            <PlusCircle className="me-2 h-4 w-4" /> تقديم طلب إجازة بالنيابة
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="sm:max-w-lg">
                        <DialogHeader><DialogTitle>{leaveRequestToEdit ? "تعديل طلب إجازة" : "تقديم طلب إجازة بالنيابة"}</DialogTitle></DialogHeader>
                        <Form {...leaveRequestForm}>
                            <form onSubmit={leaveRequestForm.handleSubmit(handleLeaveRequestSubmit)} className="space-y-4 py-4">
                                <FormField control={leaveRequestForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                                    <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={leaveRequestForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>نوع الإجازة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                    <SelectContent>{["إجازة سنوية", "إجازة مرضية", "إجازة عارضة", "إجازة بدون راتب", "أخرى"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={leaveRequestForm.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={leaveRequestForm.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={leaveRequestForm.control} name="reason" render={({ field }) => (<FormItem><FormLabel>السبب (اختياري)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <DialogFooter><Button type="submit">{leaveRequestToEdit ? "حفظ التعديلات" : "إرسال الطلب"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
                      <Filter className="me-2 h-4 w-4" /> تصفية حالة الطلب
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>تصفية حسب حالة الطلب</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem>مقدمة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>موافق عليها</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>مرفوضة</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>ملغاة</DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>نوع الإجازة</TableHead>
                      <TableHead>تاريخ البدء</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                      <TableHead>عدد الأيام</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{req.id}</TableCell>
                        <TableCell>{employees.find(e => e.id === req.employeeId)?.name}</TableCell>
                        <TableCell>{req.type}</TableCell>
                        <TableCell>{req.startDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell>
                        <TableCell>{req.endDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell>
                        <TableCell>{req.days}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === "موافق عليها" ? "default" :
                              req.status === "مرفوضة" || req.status === "ملغاة" ? "destructive" :
                              "secondary"
                            }
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewLeave(req)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {req.status === "مقدمة" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-800" title="موافقة" onClick={() => handleLeaveAction(req.id!, "موافق عليها")}>
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-800" title="رفض" onClick={() => handleLeaveAction(req.id!, "مرفوضة")}>
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </>
                          )}
                          {req.status !== "موافق عليها" && req.status !== "مرفوضة" && req.status !== "ملغاة" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل الطلب" onClick={() => {setLeaveRequestToEdit(req); setShowCreateLeaveDialog(true);}}><Edit className="h-4 w-4"/></Button>}
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

      {/* View Employee Dialog */}
        <Dialog open={showViewEmployeeDialog} onOpenChange={setShowViewEmployeeDialog}>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle>ملف الموظف: {selectedEmployeeForView?.name}</DialogTitle>
                </DialogHeader>
                {selectedEmployeeForView && (
                    <ScrollArea className="max-h-[70vh] p-1">
                    <div className="py-4 space-y-3 text-sm">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-24 w-24"><AvatarImage src={selectedEmployeeForView.avatarUrl} alt={selectedEmployeeForView.name} data-ai-hint={selectedEmployeeForView.dataAiHint || selectedEmployeeForView.name.split(' ').slice(0,2).join(' ') } /><AvatarFallback>{selectedEmployeeForView.name?.substring(0,1)}</AvatarFallback></Avatar>
                        </div>
                        <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><UserCog className="me-2 h-4 w-4 text-primary" /> معلومات أساسية</CardTitle></CardHeader>
                          <CardContent className="p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                            <p><strong>الرقم الوظيفي:</strong> {selectedEmployeeForView.id}</p>
                            <p><strong>الاسم:</strong> {selectedEmployeeForView.name}</p>
                            <p><strong>المسمى الوظيفي:</strong> {selectedEmployeeForView.jobTitle}</p>
                            <p><strong>القسم:</strong> {selectedEmployeeForView.department}</p>
                            <p><strong>البريد الإلكتروني:</strong> {selectedEmployeeForView.email || "-"}</p>
                            <p><strong>الهاتف:</strong> {selectedEmployeeForView.phone || "-"}</p>
                            <p><strong>الجنسية:</strong> {selectedEmployeeForView.nationality || "-"}</p>
                            <p><strong>رقم الهوية/الإقامة:</strong> {selectedEmployeeForView.idNumber || "-"}</p>
                            <p><strong>موقع العمل:</strong> {selectedEmployeeForView.workLocation || "-"}</p>
                            <div className="flex items-center gap-1 col-span-2"><strong>الحالة:</strong> <span className="inline-block"><Badge variant={selectedEmployeeForView.status === "نشط" ? "default" : "outline"}>{selectedEmployeeForView.status}</Badge></span></div>
                          </CardContent>
                        </Card>

                        <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><CalendarCheck2 className="me-2 h-4 w-4 text-primary" /> معلومات العقد</CardTitle></CardHeader>
                            <CardContent className="p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                <p><strong>تاريخ بداية العقد:</strong> {selectedEmployeeForView.contractStartDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                                <p><strong>تاريخ نهاية العقد:</strong> {selectedEmployeeForView.contractEndDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                                <p><strong>مدة العقد:</strong> {selectedEmployeeForView.contractDuration || "-"}</p>
                                <p><strong>نهاية فترة التجربة:</strong> {selectedEmployeeForView.probationEndDate ? selectedEmployeeForView.probationEndDate.toLocaleDateString('ar-SA', {calendar:'gregory'}) : "-"}</p>
                                <p><strong>نوع التوظيف:</strong> {selectedEmployeeForView.employmentType}</p>
                                <p><strong>نوع العقد:</strong> {selectedEmployeeForView.contractType}</p>
                                <p><strong>قابل للتجديد:</strong> {selectedEmployeeForView.canRenewContract ? "نعم" : "لا"}</p>
                            </CardContent>
                        </Card>

                        <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><Banknote className="me-2 h-4 w-4 text-primary" /> معلومات مالية</CardTitle></CardHeader>
                            <CardContent className="p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                <p><strong>الراتب الأساسي:</strong> {(selectedEmployeeForView.basicSalary || 0)?.toLocaleString('ar-SA', {style:'currency', currency: 'SAR'})}</p>
                                <p><strong>اسم البنك:</strong> {selectedEmployeeForView.bankName || "-"}</p>
                                <p><strong>رقم الآيبان:</strong> {selectedEmployeeForView.iban || "-"}</p>
                                <p><strong>رقم التأمينات:</strong> {selectedEmployeeForView.socialInsuranceNumber || "-"}</p>
                                {(selectedEmployeeForView.allowances && selectedEmployeeForView.allowances.length > 0) && (
                                    <div className="col-span-2 mt-1">
                                        <p><strong>البدلات:</strong></p>
                                        <ul className="list-disc ms-4">
                                            {selectedEmployeeForView.allowances.map((allow, i) => (
                                                <li key={i}>{allow.description}: {allow.amount.toLocaleString('ar-SA', {style:'currency', currency: 'SAR'})} ({allow.type})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                 {(selectedEmployeeForView.incentives && selectedEmployeeForView.incentives.length > 0) && (
                                    <div className="col-span-2 mt-1">
                                        <p><strong>الحوافز:</strong></p>
                                        <ul className="list-disc ms-4">
                                            {selectedEmployeeForView.incentives.map((inc, i) => (
                                                <li key={i}>{inc.description}: {inc.amount.toLocaleString('ar-SA', {style:'currency', currency: 'SAR'})} ({inc.type} - {inc.date.toLocaleDateString('ar-SA', {calendar:'gregory'})})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                         <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><Plane className="me-2 h-4 w-4 text-primary" /> الانتدابات</CardTitle></CardHeader>
                            <CardContent className="p-3 text-xs">
                                 {(selectedEmployeeForView.delegations && selectedEmployeeForView.delegations.length > 0) ? (
                                    <ul className="list-disc ms-4 space-y-1">
                                        {selectedEmployeeForView.delegations.map((del, i) => (
                                            <li key={i}>{del.description} إلى {del.location} (من {del.startDate.toLocaleDateString('ar-SA', {calendar:'gregory'})} إلى {del.endDate.toLocaleDateString('ar-SA', {calendar:'gregory'})}) - الحالة: {del.status}</li>
                                        ))}
                                    </ul>
                                ) : <p className="text-muted-foreground">لا توجد انتدابات مسجلة.</p>}
                            </CardContent>
                        </Card>

                        <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><Shield className="me-2 h-4 w-4 text-primary" /> التأمين والاتصال بالطوارئ</CardTitle></CardHeader>
                            <CardContent className="p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                <p><strong>شركة التأمين:</strong> {selectedEmployeeForView.medicalInsuranceProvider || "-"}</p>
                                <p><strong>رقم البوليصة:</strong> {selectedEmployeeForView.medicalInsurancePolicyNumber || "-"}</p>
                                <p><strong>انتهاء التأمين:</strong> {selectedEmployeeForView.medicalInsuranceExpiryDate ? selectedEmployeeForView.medicalInsuranceExpiryDate.toLocaleDateString('ar-SA', {calendar:'gregory'}) : "-"}</p>
                                <p className="col-span-2 border-t pt-1 mt-1"><strong>جهة اتصال الطوارئ:</strong> {selectedEmployeeForView.emergencyContactName || "-"} ({selectedEmployeeForView.emergencyContactPhone || "-"})</p>
                            </CardContent>
                        </Card>

                    </div>
                    </ScrollArea>
                )}
                <DialogFooter><DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

      {/* View Payroll Dialog */}
        <Dialog open={showViewPayrollDialog} onOpenChange={setShowViewPayrollDialog}>
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تفاصيل مسير الرواتب: {selectedPayrollForView?.id}</DialogTitle>
                    <DialogDescription>مسير رواتب الموظف: {selectedPayrollForView?.employeeName} لشهر: {selectedPayrollForView?.monthYear}</DialogDescription>
                </DialogHeader>
                {selectedPayrollForView && (
                    <div className="py-4 space-y-3 text-sm">
                        <p><strong>الراتب الأساسي:</strong> {(selectedPayrollForView.basicSalary || 0).toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</p>

                        <h4 className="font-semibold mt-2">البدلات:</h4>
                        {selectedPayrollForView.allowances && selectedPayrollForView.allowances.length > 0 ? (
                            <ul className="list-disc ps-5 text-xs">
                                {selectedPayrollForView.allowances.map((allow, idx) => <li key={`all-${idx}`}>{allow.description}: {allow.amount.toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</li>)}
                                <li className="font-bold">إجمالي البدلات: {(selectedPayrollForView.allowances.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</li>
                            </ul>
                        ) : <p className="text-xs text-muted-foreground">لا توجد بدلات.</p>}

                        <h4 className="font-semibold mt-2">الخصومات:</h4>
                         {selectedPayrollForView.deductions && selectedPayrollForView.deductions.length > 0 ? (
                            <ul className="list-disc ps-5 text-xs">
                                {selectedPayrollForView.deductions.map((ded, idx) => <li key={`ded-${idx}`}>{ded.description}: {ded.amount.toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</li>)}
                                 <li className="font-bold">إجمالي الخصومات: {(selectedPayrollForView.deductions.reduce((sum, item) => sum + item.amount, 0) || 0).toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</li>
                            </ul>
                        ) : <p className="text-xs text-muted-foreground">لا توجد خصومات.</p>}

                        <p className="font-bold text-primary mt-3 border-t pt-2"><strong>صافي الراتب:</strong> {(selectedPayrollForView.netSalary || 0).toLocaleString('ar-SA', {style:'currency', currency:'SAR'})}</p>
                        <div className="flex items-center gap-1"><strong>الحالة:</strong> <span className="inline-block"><Badge variant={selectedPayrollForView.status === "مدفوع" ? "default" : "outline"}>{selectedPayrollForView.status}</Badge></span></div>
                        <p><strong>ملاحظات:</strong> {selectedPayrollForView.notes || "لا يوجد"}</p>
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

       {/* View Leave Request Dialog */}
        <Dialog open={showViewLeaveDialog} onOpenChange={setShowViewLeaveDialog}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تفاصيل طلب الإجازة: {selectedLeaveForView?.id}</DialogTitle>
                </DialogHeader>
                {selectedLeaveForView && (
                     <div className="py-4 space-y-3 text-sm">
                        <p><strong>الموظف:</strong> {selectedLeaveForView.employeeName}</p>
                        <p><strong>نوع الإجازة:</strong> {selectedLeaveForView.type}</p>
                        <p><strong>تاريخ البدء:</strong> {selectedLeaveForView.startDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                        <p><strong>تاريخ الانتهاء:</strong> {selectedLeaveForView.endDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                        <p><strong>عدد الأيام:</strong> {selectedLeaveForView.days}</p>
                        <p><strong>السبب:</strong> {selectedLeaveForView.reason || "لا يوجد"}</p>
                        <div className="flex items-center gap-1"><strong>الحالة:</strong> <span className="inline-block"><Badge variant={selectedLeaveForView.status === "موافق عليها" ? "default" : selectedLeaveForView.status === "مرفوضة" ? "destructive" : "secondary"}>{selectedLeaveForView.status}</Badge></span></div>
                    </div>
                )}
                <DialogFooter><DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}





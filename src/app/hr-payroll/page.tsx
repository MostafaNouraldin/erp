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


// Schemas
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
type EmployeeDelegationFormValues = z.infer<typeof employeeDelegationSchema>;


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
  allowances: z.array(employeeAllowanceSchema).optional().default([]), 
  deductions: z.array(employeeDeductionSchema).optional().default([]),


  // Medical Insurance
  medicalInsuranceProvider: z.string().optional(),
  medicalInsurancePolicyNumber: z.string().optional(),
  medicalInsuranceExpiryDate: z.date().optional().nullable(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),

  status: z.enum(["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"]).default("نشط"),
  incentives: z.array(employeeIncentiveSchema).optional().default([]),
  delegations: z.array(employeeDelegationSchema).optional().default([]),
});
type EmployeeFormValues = z.infer<typeof employeeSchema>;


const warningNoticeSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    date: z.date({ required_error: "تاريخ لفت النظر مطلوب" }),
    reason: z.string().min(1, "سبب لفت النظر مطلوب"),
    details: z.string().min(1, "تفاصيل المخالفة/الملاحظة مطلوبة"),
    issuingManager: z.string().min(1, "المدير المصدر مطلوب"),
    status: z.enum(["مسودة", "تم التسليم", "ملغى"]).default("مسودة"),
});
type WarningNoticeFormValues = z.infer<typeof warningNoticeSchema>;


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
  status: z.enum(["مسودة", "قيد المعالجة", "مدفوع", "ملغي"]).default("مسودة"),
  netSalary: z.coerce.number().optional(),
  paymentDate: z.date().optional().nullable(),
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
type AdministrativeDecisionFormValues = z.infer<typeof administrativeDecisionSchema>;

const resignationSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    submissionDate: z.date({ required_error: "تاريخ تقديم الاستقالة مطلوب" }),
    lastWorkingDate: z.date({ required_error: "تاريخ آخر يوم عمل مطلوب" }),
    reason: z.string().min(1, "سبب الاستقالة مطلوب"),
    managerNotifiedDate: z.date().optional().nullable(),
    status: z.enum(["مقدمة", "مقبولة", "قيد المراجعة", "مسحوبة", "مرفوضة"]).default("مقدمة"),
});
type ResignationFormValues = z.infer<typeof resignationSchema>;

const disciplinaryWarningSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1, "الموظف مطلوب"),
    warningDate: z.date({ required_error: "تاريخ الإنذار مطلوب" }),
    warningType: z.enum(["إنذار أول", "إنذار ثاني", "إنذار نهائي", "إجراء تأديبي آخر"], { required_error: "نوع الإنذار مطلوب" }),
    violationDetails: z.string().min(1, "تفاصيل المخالفة مطلوبة"),
    actionTaken: z.string().optional(), // e.g., خصم يوم, تدريب إضافي
    issuingManager: z.string().min(1, "المدير المصدر مطلوب"),
    status: z.enum(["مسودة", "تم التسليم", "معترض عليه", "منفذ"]).default("مسودة"),
});
type DisciplinaryWarningFormValues = z.infer<typeof disciplinaryWarningSchema>;


// Mock data
const initialEmployeesData: EmployeeFormValues[] = [
  { id: "EMP001", name: "أحمد محمود", department: "قسم المبيعات", jobTitle: "مدير مبيعات", contractStartDate: new Date("2022-01-15"), contractEndDate: new Date("2025-01-14"), contractDuration: "3 سنوات", probationEndDate: new Date("2022-04-15"), canRenewContract: true, employmentType: "دوام كامل", contractType: "عائلي", status: "نشط", basicSalary: 12000, email: "ahmed.m@example.com", phone: "0501234567", avatarUrl: "https://picsum.photos/100/100?random=1", dataAiHint: "man portrait", nationality: "سعودي", idNumber: "1012345678", bankName: "البنك الأهلي", iban: "SA0380000000608010167519", socialInsuranceNumber:"12345001", medicalInsuranceProvider: "بوبا للتأمين", medicalInsurancePolicyNumber: "BUPA-111", medicalInsuranceExpiryDate: new Date("2024-12-31"), allowances: [{id: "ALW001", description: "بدل سكن", amount:3000, type: "ثابت"}, {id: "ALW002", description: "بدل مواصلات", amount:1000, type: "ثابت"}, {id:"ALW003", description: "بدل طبيعة عمل", amount:500, type: "متغير"}], deductions: [{id: "DED001", description: "سلفة شخصية", amount: 200, type: "ثابت"}], emergencyContactName: "محمد محمود", emergencyContactPhone:"0507654321", workLocation: "المقر الرئيسي - الرياض", incentives: [{id: "INC001", description: "مكافأة تحقيق الهدف السنوي", amount: 5000, date: new Date("2024-12-31"), type: "سنوي"}], delegations: []  },
  { id: "EMP002", name: "فاطمة علي", department: "قسم التسويق", jobTitle: "أخصائية تسويق", contractStartDate: new Date("2023-03-01"), contractEndDate: new Date("2025-02-28"), contractDuration: "سنتان", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 8000, email: "fatima.a@example.com", phone: "0509876543", avatarUrl: "https://picsum.photos/100/100?random=2", dataAiHint: "woman portrait", nationality: "سعودية", idNumber:"2023456789", medicalInsuranceProvider: "التعاونية للتأمين", medicalInsurancePolicyNumber: "TAW-222", medicalInsuranceExpiryDate: new Date("2025-01-31"), allowances: [], deductions: [], emergencyContactName:"علي حسن", emergencyContactPhone: "0551231234", workLocation: "فرع جدة", incentives: [], delegations: []},
  { id: "EMP003", name: "خالد عبدالله", department: "قسم المالية", jobTitle: "محاسب أول", contractStartDate: new Date("2021-07-20"), contractEndDate: new Date("2024-07-19"), contractDuration: "3 سنوات", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 10000, email: "khaled.ab@example.com", phone: "0501122334", avatarUrl: "https://picsum.photos/100/100?random=3", dataAiHint: "man office", allowances: [], deductions: [], workLocation: "المقر الرئيسي - الرياض", incentives: [], delegations: [] },
  { id: "EMP004", name: "سارة إبراهيم", department: "قسم الموارد البشرية", jobTitle: "مسؤول موارد بشرية", contractStartDate: new Date("2024-02-10"), contractEndDate: new Date("2026-02-09"), contractDuration: "سنتان", employmentType: "دوام كامل", contractType: "فردي", status: "نشط", basicSalary: 9000, email: "sara.i@example.com", phone: "0504455667", avatarUrl: "https://picsum.photos/100/100?random=4", dataAiHint: "woman smiling", allowances: [], deductions: [], incentives: [], delegations: [] },
  { id: "EMP005", name: "يوسف حسن", department: "قسم التشغيل", jobTitle: "فني صيانة", contractStartDate: new Date("2020-05-01"), contractEndDate: new Date("2024-04-30"), contractDuration: "4 سنوات", canRenewContract: false, employmentType: "دوام كامل", contractType: "فردي", status: "في إجازة", basicSalary: 7000, email: "youssef.h@example.com", phone: "0507788990", avatarUrl: "https://picsum.photos/100/100?random=5", dataAiHint: "man worker", allowances: [], deductions: [], incentives: [], delegations: [] },
];

const initialDelegationsData: EmployeeDelegationFormValues[] = [
  { id: "DEL001", employeeId: "EMP001", description: "مهمة عمل لمعرض دبي", startDate: new Date("2024-09-01"), endDate: new Date("2024-09-05"), location: "دبي", status: "مخطط له" },
  { id: "DEL002", employeeId: "EMP002", description: "ورشة عمل تسويقية في جدة", startDate: new Date("2024-10-10"), endDate: new Date("2024-10-12"), location: "جدة", status: "مخطط له" },
];

const initialWarningNoticesData: WarningNoticeFormValues[] = [
    { id: "WN001", employeeId: "EMP003", date: new Date("2024-07-15"), reason: "تأخير متكرر عن العمل", details: "لوحظ تأخر الموظف عن موعد الحضور الرسمي لأكثر من ثلاث مرات خلال الأسبوع الماضي بدون عذر مقبول.", issuingManager: "مدير القسم المالي", status: "تم التسليم" },
];

const initialAdministrativeDecisionsData: AdministrativeDecisionFormValues[] = [
    { id: "AD001", employeeId: "EMP001", decisionDate: new Date("2024-08-01"), decisionType: "ترقية", details: "ترقية الموظف إلى منصب مدير مبيعات إقليمي.", issuingAuthority: "إدارة الموارد البشرية", effectiveDate: new Date("2024-08-15"), status: "معتمد" },
];
const initialResignationsData: ResignationFormValues[] = [
    { id: "RES001", employeeId: "EMP005", submissionDate: new Date("2024-07-20"), lastWorkingDate: new Date("2024-08-20"), reason: "عرض وظيفي أفضل", managerNotifiedDate: new Date("2024-07-21"), status: "مقبولة" },
];
const initialDisciplinaryWarningsData: DisciplinaryWarningFormValues[] = [
    { id: "DW001", employeeId: "EMP003", warningDate: new Date("2024-07-25"), warningType: "إنذار أول", violationDetails: "تجاوز سياسات الشركة المتعلقة باستخدام الإنترنت خلال ساعات العمل.", actionTaken: "خصم نصف يوم", issuingManager: "مدير القسم المالي", status: "تم التسليم" },
];


const initialPayrollData = [
  { id: "PAY001", employeeId: "EMP001", monthYear: "يوليو 2024", basicSalary: 12000, allowances: [{id: "PAYALW001", description: "بدل سكن", amount: 2500}, {id: "PAYALW002", description: "بدل مواصلات", amount: 500}], deductions: [{id: "PAYDED001", description: "سلفة", amount: 500}], netSalary: 14500, status: "مدفوع" as const, notes: "تم الدفع مع سداد السلفة.", paymentDate: new Date("2024-07-28") },
  { id: "PAY002", employeeId: "EMP002", monthYear: "يوليو 2024", basicSalary: 8000, allowances: [{id: "PAYALW003", description: "بدل طبيعة عمل", amount: 1500}], deductions: [{id: "PAYDED002", description: "تأمين صحي", amount:200}], netSalary: 9300, status: "مدفوع" as const, notes: "", paymentDate: new Date("2024-07-28") },
  { id: "PAY003", employeeId: "EMP003", monthYear: "يوليو 2024", basicSalary: 10000, allowances: [{id: "PAYALW004", description: "بدل إضافي", amount:2000}], deductions: [{id: "PAYDED003", description: "جزاء تأخير", amount:300}], netSalary: 11700, status: "قيد المعالجة" as const, notes: "يراجع من المدير المالي" },
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
const mockLeaveTypes = ["إجازة سنوية", "إجازة مرضية", "إجازة عارضة", "إجازة بدون راتب", "إجازة أمومة", "إجازة زواج", "أخرى"];
const mockManagers = initialEmployeesData.filter(emp => emp.jobTitle?.includes("مدير") || emp.jobTitle?.includes("مسؤول")).map(emp => ({id: emp.id!, name: emp.name})); // Added non-null assertion
const mockDecisionTypes = ["ترقية", "نقل", "تعديل راتب", "إنهاء خدمات", "أخرى"];
const mockWarningTypes = ["إنذار أول", "إنذار ثاني", "إنذار نهائي", "إجراء تأديبي آخر"];


const employeeDefaultValues: EmployeeFormValues = {
  name: "", department: "", jobTitle: "", contractStartDate: new Date(), contractEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  status: "نشط", basicSalary: 0, email: "", phone: "", avatarUrl: "", dataAiHint: "",
  contractDuration: "سنة واحدة", probationEndDate: null, canRenewContract: true, employmentType: "دوام كامل", contractType: "فردي",
  nationality: "", idNumber: "", workLocation: "", bankName: "", iban: "", socialInsuranceNumber: "",
  allowances: [], deductions: [],
  medicalInsuranceProvider: "", medicalInsurancePolicyNumber: "", medicalInsuranceExpiryDate: null,
  emergencyContactName: "", emergencyContactPhone: "",
  incentives: [],
  delegations: [],
};

// Placeholder for amount to words conversion
const convertAmountToWords = (amount: number) => {
    return `فقط ${amount.toLocaleString('ar-SA')} ريال سعودي لا غير`;
};


export default function HRPayrollPage() {
  const [employees, setEmployeesData] = useState(initialEmployeesData);
  const [payrollData, setPayrollDataState] = useState(initialPayrollData);
  const [attendanceData, setAttendanceDataState] = useState(initialAttendanceData);
  const [leaveRequests, setLeaveRequestsData] = useState(initialLeaveRequestsData);
  const [warningNoticesData, setWarningNoticesData] = useState<WarningNoticeFormValues[]>(initialWarningNoticesData);
  const [administrativeDecisionsData, setAdministrativeDecisionsData] = useState<AdministrativeDecisionFormValues[]>(initialAdministrativeDecisionsData);
  const [resignationsData, setResignationsData] = useState<ResignationFormValues[]>(initialResignationsData);
  const [disciplinaryWarningsData, setDisciplinaryWarningsData] = useState<DisciplinaryWarningFormValues[]>(initialDisciplinaryWarningsData);


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

  const [showManageDelegationDialog, setShowManageDelegationDialog] = useState(false);
  const [delegationToEdit, setDelegationToEdit] = useState<EmployeeDelegationFormValues | null>(null);

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

  const employeeForm = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues: employeeDefaultValues });
  const { fields: allowanceFormFields, append: appendAllowanceField, remove: removeAllowanceField } = useFieldArray({ control: employeeForm.control, name: "allowances" });
  const { fields: deductionFormFields, append: appendDeductionField, remove: removeDeductionField } = useFieldArray({ control: employeeForm.control, name: "deductions" });
  const { fields: incentiveFormFields, append: appendIncentiveField, remove: removeIncentiveField } = useFieldArray({ control: employeeForm.control, name: "incentives" });
  const { fields: delegationFormFields, append: appendDelegationField, remove: removeDelegationField } = useFieldArray({ control: employeeForm.control, name: "delegations" });

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
    if (employeeToEdit) employeeForm.reset(employeeToEdit);
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
    if (attendanceToEdit) attendanceForm.reset(attendanceToEdit);
    else attendanceForm.reset({ employeeId: "", date: new Date(), checkIn: null, checkOut: null, notes: "", status: "حاضر" });
  }, [attendanceToEdit, attendanceForm, showEditAttendanceDialog]);

  useEffect(() => {
    if (leaveRequestToEdit) leaveRequestForm.reset(leaveRequestToEdit);
    else leaveRequestForm.reset({ employeeId: "", type: "", startDate: new Date(), endDate: new Date(), reason: "", status: "مقدمة" });
  }, [leaveRequestToEdit, leaveRequestForm, showCreateLeaveDialog]);


  useEffect(() => {
    if (warningNoticeToEdit) warningNoticeForm.reset(warningNoticeToEdit);
    else warningNoticeForm.reset({ employeeId: '', date: new Date(), reason: '', details: '', issuingManager: '', status: "مسودة" });
  }, [warningNoticeToEdit, warningNoticeForm, showManageWarningNoticeDialog]);

  useEffect(() => {
    if (adminDecisionToEdit) adminDecisionForm.reset(adminDecisionToEdit);
    else adminDecisionForm.reset({ employeeId: '', decisionDate: new Date(), decisionType: '', details: '', issuingAuthority: '', effectiveDate: new Date(), status: "مسودة" });
  }, [adminDecisionToEdit, adminDecisionForm, showManageAdminDecisionDialog]);

  useEffect(() => {
    if (resignationToEdit) resignationForm.reset(resignationToEdit);
    else resignationForm.reset({ employeeId: '', submissionDate: new Date(), lastWorkingDate: new Date(), reason: '', managerNotifiedDate: null, status: "مقدمة" });
  }, [resignationToEdit, resignationForm, showManageResignationDialog]);

  useEffect(() => {
    if (disciplinaryToEdit) disciplinaryWarningForm.reset(disciplinaryToEdit);
    else disciplinaryWarningForm.reset({ employeeId: '', warningDate: new Date(), warningType: undefined, violationDetails: '', actionTaken: '', issuingManager: '', status: "مسودة" });
  }, [disciplinaryToEdit, disciplinaryWarningForm, showManageDisciplinaryDialog]);


  const handleEmployeeSubmit = (values: EmployeeFormValues) => {
    if (employeeToEdit) {
      setEmployeesData(prev => prev.map(emp => emp.id === employeeToEdit.id ? { ...values, id: employeeToEdit.id! } : emp));
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
  
  const handlePayPayroll = (payrollId: string) => {
    setPayrollDataState(prev => prev.map(p => p.id === payrollId ? {...p, status: "مدفوع", paymentDate: new Date() } : p));
    toast({title: "تم الدفع", description: "تم تسجيل دفعة المسير بنجاح."});
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

  const handleDelegationSubmitInEmployeeForm = (employeeId: string, values: EmployeeDelegationFormValues) => {
    setEmployeesData(prev => prev.map(emp => {
        if (emp.id === employeeId) {
            const existingDelegations = emp.delegations || [];
            if (delegationToEdit && delegationToEdit.id) { // Editing existing delegation
                return {
                    ...emp,
                    delegations: existingDelegations.map(del => 
                        del.id === delegationToEdit.id ? { ...values, id: delegationToEdit.id } : del
                    )
                };
            } else { // Adding new delegation
                return {
                    ...emp,
                    delegations: [...existingDelegations, { ...values, id: `DEL-EMP${Date.now()}` }]
                };
            }
        }
        return emp;
    }));
    toast({ title: delegationToEdit ? "تم التعديل" : "تم الإنشاء", description: `تم ${delegationToEdit ? 'تعديل' : 'إنشاء'} الانتداب بنجاح للموظف.` });
    setShowManageDelegationDialog(false);
    setDelegationToEdit(null);
  };


  const handleDeleteDelegationInEmployeeForm = (employeeId: string, delegationId: string) => {
      setEmployeesData(prev => prev.map(emp => {
          if (emp.id === employeeId) {
              return {
                  ...emp,
                  delegations: (emp.delegations || []).filter(del => del.id !== delegationId)
              };
          }
          return emp;
      }));
      toast({ title: "تم الحذف", description: `تم حذف الانتداب ${delegationId} من الموظف.`, variant: "destructive" });
  };

  const handleWarningNoticeSubmit = (values: WarningNoticeFormValues) => {
    if (warningNoticeToEdit) {
        setWarningNoticesData(prev => prev.map(wn => wn.id === warningNoticeToEdit.id ? { ...values, id: warningNoticeToEdit.id! } : wn));
        toast({ title: "تم التعديل", description: "تم تعديل لفت النظر بنجاح." });
    } else {
        setWarningNoticesData(prev => [...prev, { ...values, id: `WN${Date.now()}` }]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء لفت النظر بنجاح." });
    }
    setShowManageWarningNoticeDialog(false);
    setWarningNoticeToEdit(null);
  };

  const handleDeleteWarningNotice = (warningNoticeId: string) => {
    setWarningNoticesData(prev => prev.filter(wn => wn.id !== warningNoticeId));
    toast({ title: "تم الحذف", description: `تم حذف لفت النظر ${warningNoticeId}.`, variant: "destructive" });
  };

  const handlePrintWarningNotice = (notice: WarningNoticeFormValues) => {
    setSelectedWarningNoticeForPrint(notice);
    setShowPrintWarningNoticeDialog(true);
  };

  const handleAdministrativeDecisionSubmit = (values: AdministrativeDecisionFormValues) => {
    if (adminDecisionToEdit) {
        setAdministrativeDecisionsData(prev => prev.map(ad => ad.id === adminDecisionToEdit.id ? { ...values, id: adminDecisionToEdit.id! } : ad));
        toast({ title: "تم التعديل", description: "تم تعديل القرار الإداري بنجاح." });
    } else {
        setAdministrativeDecisionsData(prev => [...prev, { ...values, id: `AD${Date.now()}` }]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء القرار الإداري بنجاح." });
    }
    setShowManageAdminDecisionDialog(false);
    setAdminDecisionToEdit(null);
  };
  const handleDeleteAdministrativeDecision = (decisionId: string) => {
    setAdministrativeDecisionsData(prev => prev.filter(ad => ad.id !== decisionId));
    toast({ title: "تم الحذف", description: `تم حذف القرار الإداري ${decisionId}.`, variant: "destructive" });
  };
  const handlePrintAdministrativeDecision = (decision: AdministrativeDecisionFormValues) => {
    setSelectedAdminDecisionForPrint(decision);
    setShowPrintAdminDecisionDialog(true);
  };
  
  const handleResignationSubmit = (values: ResignationFormValues) => {
    if (resignationToEdit) {
        setResignationsData(prev => prev.map(res => res.id === resignationToEdit.id ? { ...values, id: resignationToEdit.id! } : res));
        toast({ title: "تم التعديل", description: "تم تعديل طلب الاستقالة بنجاح." });
    } else {
        setResignationsData(prev => [...prev, { ...values, id: `RES${Date.now()}` }]);
        toast({ title: "تم التقديم", description: "تم تقديم طلب الاستقالة بنجاح." });
    }
    setShowManageResignationDialog(false);
    setResignationToEdit(null);
  };
  const handleDeleteResignation = (resignationId: string) => {
    setResignationsData(prev => prev.filter(res => res.id !== resignationId));
    toast({ title: "تم الحذف", description: `تم حذف طلب الاستقالة ${resignationId}.`, variant: "destructive" });
  };
  const handlePrintResignation = (resignation: ResignationFormValues) => {
    setSelectedResignationForPrint(resignation);
    setShowPrintResignationDialog(true);
  };

  const handleDisciplinaryWarningSubmit = (values: DisciplinaryWarningFormValues) => {
    if (disciplinaryToEdit) {
        setDisciplinaryWarningsData(prev => prev.map(dw => dw.id === disciplinaryToEdit.id ? { ...values, id: disciplinaryToEdit.id! } : dw));
        toast({ title: "تم التعديل", description: "تم تعديل الإنذار بنجاح." });
    } else {
        setDisciplinaryWarningsData(prev => [...prev, { ...values, id: `DW${Date.now()}` }]);
        toast({ title: "تم الإنشاء", description: "تم إنشاء الإنذار بنجاح." });
    }
    setShowManageDisciplinaryDialog(false);
    setDisciplinaryToEdit(null);
  };
  const handleDeleteDisciplinaryWarning = (warningId: string) => {
    setDisciplinaryWarningsData(prev => prev.filter(dw => dw.id !== warningId));
    toast({ title: "تم الحذف", description: `تم حذف الإنذار ${warningId}.`, variant: "destructive" });
  };
  const handlePrintDisciplinaryWarning = (warning: DisciplinaryWarningFormValues) => {
    setSelectedDisciplinaryForPrint(warning);
    setShowPrintDisciplinaryDialog(true);
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
                                    <TabsTrigger value="contract" className="flex-1">العقد والانتدابات</TabsTrigger>
                                    <TabsTrigger value="financial" className="flex-1">معلومات مالية وحوافز</TabsTrigger>
                                    <TabsTrigger value="insurance" className="flex-1">التأمين والطوارئ</TabsTrigger>
                                </TabsList>
                                <div className="flex-grow overflow-y-auto min-h-0"> {/* Scrollable area for TabsContent */}
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
                                        <FormField control={employeeForm.control} name="workLocation" render={({ field }) => (<FormItem><FormLabel>موقع العمل</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name="avatarUrl" render={({ field }) => (<FormItem><FormLabel>رابط صورة الموظف (اختياري)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/avatar.jpg" className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name="dataAiHint" render={({ field }) => (<FormItem><FormLabel>كلمات مفتاحية للصورة (AI Hint)</FormLabel><FormControl><Input {...field} placeholder="مثال: رجل أعمال (كلمتين كحد أقصى)" className="bg-background" /></FormControl><DialogDescriptionComponent className="text-xs text-muted-foreground">كلمة أو كلمتين لوصف الصورة (للبحث).</DialogDescriptionComponent><FormMessage /></FormItem>)} />
                                    </TabsContent>

                                    <TabsContent value="contract" className="space-y-4 mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="contractStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ بداية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="contractEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ نهاية العقد</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="contractDuration" render={({ field }) => (<FormItem><FormLabel>مدة العقد</FormLabel><FormControl><Input {...field} placeholder="مثال: سنة واحدة, سنتان" className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="probationEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>نهاية فترة التجربة (اختياري)</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={employeeForm.control} name="employmentType" render={({ field }) => (<FormItem><FormLabel>نوع التوظيف</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                            <SelectContent>{mockEmploymentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={employeeForm.control} name="contractType" render={({ field }) => (<FormItem><FormLabel>نوع العقد</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر نوع العقد" /></SelectTrigger></FormControl>
                                            <SelectContent>{mockContractTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={employeeForm.control} name="canRenewContract" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm rtl:space-x-reverse"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="canRenewContractEmployee" /></FormControl><FormLabel htmlFor="canRenewContractEmployee" className="font-normal">العقد قابل للتجديد</FormLabel></FormItem>)} />
                                        <FormField control={employeeForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>حالة الموظف</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                            <SelectContent>{["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        
                                        <Separator className="my-3"/>
                                        <FormLabel>الانتدابات</FormLabel>
                                        {delegationFormFields.map((item, index) => (
                                            <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                                <FormField control={employeeForm.control} name={`delegations.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف الانتداب</FormLabel><FormControl><Input placeholder="وصف المهمة" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs" /></FormItem>)} />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <FormField control={employeeForm.control} name={`delegations.${index}.startDate`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ البدء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage className="text-xs"/></FormItem>)} />
                                                    <FormField control={employeeForm.control} name={`delegations.${index}.endDate`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ الانتهاء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage className="text-xs"/></FormItem>)} />
                                                </div>
                                                <FormField control={employeeForm.control} name={`delegations.${index}.location`} render={({ field }) => (<FormItem><FormLabel className="text-xs">الموقع</FormLabel><FormControl><Input placeholder="موقع الانتداب" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`delegations.${index}.status`} render={({ field }) => (<FormItem><FormLabel className="text-xs">الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl><SelectContent>{["مخطط له", "جارٍ", "مكتمل", "ملغى"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeDelegationField(index)} className="text-destructive w-full justify-start p-1 text-xs h-auto"><MinusCircle className="me-1 h-3 w-3" /> إزالة الانتداب</Button>
                                            </Card>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendDelegationField({employeeId: employeeForm.getValues("id") || "", description: '', startDate: new Date(), endDate: new Date(), location: '', status: "مخطط له"})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة انتداب</Button>
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

                                        <Separator className="my-3"/>
                                        <FormLabel>الحوافز والمكافآت</FormLabel>
                                        {incentiveFormFields.map((item, index) => (
                                            <Card key={item.id} className="p-3 space-y-2 bg-muted/30">
                                                <FormField control={employeeForm.control} name={`incentives.${index}.description`} render={({ field }) => (<FormItem><FormLabel className="text-xs">وصف الحافز</FormLabel><FormControl><Input placeholder="وصف الحافز/المكافأة" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`incentives.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ (SAR)</FormLabel><FormControl><Input type="number" placeholder="المبلغ" {...field} className="bg-background h-8 text-xs" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`incentives.${index}.date`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel className="text-xs">تاريخ الاستحقاق</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage className="text-xs"/></FormItem>)} />
                                                <FormField control={employeeForm.control} name={`incentives.${index}.type`} render={({ field }) => (<FormItem><FormLabel className="text-xs">نوع الحافز</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background h-8 text-xs"><SelectValue placeholder="اختر نوع الحافز" /></SelectTrigger></FormControl>
                                                    <SelectContent>{["شهري", "ربع سنوي", "سنوي", "مرة واحدة"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs"/></FormItem>)} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeIncentiveField(index)} className="text-destructive w-full justify-start p-1 text-xs h-auto"><MinusCircle className="me-1 h-3 w-3" /> إزالة الحافز</Button>
                                            </Card>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendIncentiveField({description: '', amount: 0, date: new Date(), type: "مرة واحدة"})} className="text-xs py-1 px-2 h-auto"><PlusCircle className="me-1 h-3 w-3" /> إضافة حافز</Button>
                                    </TabsContent>
                                    <TabsContent value="insurance" className="space-y-4 mt-0">
                                        <FormLabel>التأمين الطبي</FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="medicalInsuranceProvider" render={({ field }) => (<FormItem><FormLabel>شركة التأمين</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="medicalInsurancePolicyNumber" render={({ field }) => (<FormItem><FormLabel>رقم البوليصة</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={employeeForm.control} name="medicalInsuranceExpiryDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ انتهاء التأمين</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                        <Separator className="my-3"/>
                                        <FormLabel>معلومات الاتصال في الطوارئ</FormLabel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={employeeForm.control} name="emergencyContactName" render={({ field }) => (<FormItem><FormLabel>اسم جهة الاتصال</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={employeeForm.control} name="emergencyContactPhone" render={({ field }) => (<FormItem><FormLabel>رقم هاتف جهة الاتصال</FormLabel><FormControl><Input type="tel" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
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
                            <Select onValueChange={(value) => { 
                                field.onChange(value); 
                                const emp = employees.find(e => e.id === value); 
                                if (emp) {
                                    payrollForm.setValue("basicSalary", emp.basicSalary);
                                    payrollForm.setValue("allowances", emp.allowances?.map(a=> ({description: a.description, amount: a.amount})) || []);
                                    payrollForm.setValue("deductions", emp.deductions?.map(d=> ({description: d.description, amount: d.amount})) || []);
                                }
                            }} value={field.value} dir="rtl">
                                <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                                <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent>
                            </Select><FormMessage /></FormItem>)} />
                        <FormField control={payrollForm.control} name="monthYear" render={({ field }) => (<FormItem><FormLabel>الشهر والسنة</FormLabel><FormControl><Input {...field} placeholder="مثال: يوليو 2024" className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={payrollForm.control} name="basicSalary" render={({ field }) => (<FormItem><FormLabel>الراتب الأساسي</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />

                        <Card><CardHeader><CardTitle className="text-sm">البدلات</CardTitle></CardHeader><CardContent className="p-2">
                            <ScrollArea className="h-[100px]">{payrollAllowanceFields.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-end mb-2"><FormField control={payrollForm.control} name={`allowances.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">الوصف</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={payrollForm.control} name={`allowances.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePayrollAllowance(index)} className="h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4" /></Button></div>))}
                            </ScrollArea><Button type="button" variant="outline" size="sm" onClick={() => appendPayrollAllowance({description: '', amount: 0})}><PlusCircle className="me-1 h-3 w-3" /> إضافة بدل</Button>
                        </CardContent></Card>

                        <Card><CardHeader><CardTitle className="text-sm">الخصومات</CardTitle></CardHeader><CardContent className="p-2">
                             <ScrollArea className="h-[100px]">{payrollDeductionFields.map((item, index) => (
                                <div key={item.id} className="flex gap-2 items-end mb-2"><FormField control={payrollForm.control} name={`deductions.${index}.description`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-xs">الوصف</FormLabel><FormControl><Input {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={payrollForm.control} name={`deductions.${index}.amount`} render={({ field }) => (<FormItem><FormLabel className="text-xs">المبلغ</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removePayrollDeduction(index)} className="h-9 w-9 text-destructive"><MinusCircle className="h-4 w-4" /></Button></div>))}
                            </ScrollArea><Button type="button" variant="outline" size="sm" onClick={() => appendPayrollDeduction({description: '', amount: 0})}><PlusCircle className="me-1 h-3 w-3" /> إضافة خصم</Button>
                        </CardContent></Card>
                        <FormField control={payrollForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
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
           <TabsTrigger value="forms" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FolderOpen className="inline-block me-2 h-4 w-4" /> النماذج
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
                          <Badge variant={emp.status === "نشط" ? "default" : emp.status === "منتهية خدمته" ? "destructive" : "secondary"}>{emp.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض الملف الشخصي" onClick={() => handleViewEmployee(emp)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {emp.status !== "منتهية خدمته" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setEmployeeToEdit(emp); setShowAddEmployeeDialog(true);}}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {emp.status === "نشط" && <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="إنهاء خدمة"><UserCog className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد إنهاء الخدمة</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من إنهاء خدمة الموظف {emp.name}؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleTerminateEmployee(emp.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
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
                    <DropdownMenuCheckboxItem>مسودة</DropdownMenuCheckboxItem>
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
                          <Badge variant={payroll.status === "مدفوع" ? "default" : payroll.status === "قيد المعالجة" ? "secondary" : "outline"}>{payroll.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="عرض التفاصيل" onClick={() => handleViewPayroll(payroll)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                           {payroll.status !== "مدفوع" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل المسير" onClick={() => {setPayrollToEdit(payroll); setShowCreatePayrollDialog(true);}}><Edit className="h-4 w-4" /></Button>}
                           {payroll.status === "قيد المعالجة" && 
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="اعتماد ودفع"><DollarSign className="h-4 w-4 text-green-600"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader><AlertDialogTitle>تأكيد الدفع</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من اعتماد ودفع هذا المسير؟</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePayPayroll(payroll.id!)}>تأكيد الدفع</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                           }
                           {payroll.status === "مدفوع" && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة إيصال الراتب"><Printer className="h-4 w-4"/></Button>}
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
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                                    <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={attendanceForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>التاريخ</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={attendanceForm.control} name="checkIn" render={({ field }) => (<FormItem><FormLabel>وقت الحضور</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={attendanceForm.control} name="checkOut" render={({ field }) => (<FormItem><FormLabel>وقت الانصراف</FormLabel><FormControl><Input type="time" {...field} value={field.value || ""} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                 <FormField control={attendanceForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {["حاضر", "غائب", "حاضر (متأخر)", "حاضر (مغادرة مبكرة)", "إجازة"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={attendanceForm.control} name="notes" render={({ field }) => (<FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
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
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={leaveRequestForm.control} name="type" render={({ field }) => (<FormItem><FormLabel>نوع الإجازة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر النوع" /></SelectTrigger></FormControl>
                                    <SelectContent>{mockLeaveTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={leaveRequestForm.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ البدء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                    <FormField control={leaveRequestForm.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ الانتهاء</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                </div>
                                <FormField control={leaveRequestForm.control} name="reason" render={({ field }) => (<FormItem><FormLabel>السبب (اختياري)</FormLabel><FormControl><Textarea {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
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
                            className="whitespace-nowrap"
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
        
        <TabsContent value="forms">
            <Tabs defaultValue="delegations" className="w-full" dir="rtl">
                <TabsList className="w-full mb-4 bg-muted/50 p-1 rounded-md">
                    <TabsTrigger value="delegations" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Plane className="me-2 h-4 w-4"/>الانتدابات</TabsTrigger>
                    <TabsTrigger value="warningNotices" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><FileWarning className="me-2 h-4 w-4"/>لفت النظر</TabsTrigger>
                    <TabsTrigger value="administrativeDecisions" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><BookText className="me-2 h-4 w-4"/>القرارات الإدارية</TabsTrigger>
                    <TabsTrigger value="resignations" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><UserX className="me-2 h-4 w-4"/>الاستقالات</TabsTrigger>
                    <TabsTrigger value="disciplinaryWarnings" className="flex-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"><ClipboardSignature className="me-2 h-4 w-4"/>الإنذارات</TabsTrigger>
                </TabsList>
                <TabsContent value="delegations">
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>إدارة الانتدابات</CardTitle>
                            <CardDescription>تسجيل ومتابعة مهام الانتداب للموظفين (من داخل ملف الموظف).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-center py-10">يتم إدارة الانتدابات من خلال <Button variant="link" className="p-0 h-auto" onClick={()=> employeeForm.setValue("delegations", [])}>ملف الموظف</Button> في قسم "العقد والانتدابات".</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="warningNotices">
                    <Card className="shadow-md">
                        <CardHeader><CardTitle>نماذج لفت النظر</CardTitle><CardDescription>تسجيل ومتابعة إشعارات لفت النظر للموظفين.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Dialog open={showManageWarningNoticeDialog} onOpenChange={(isOpen) => { setShowManageWarningNoticeDialog(isOpen); if(!isOpen) setWarningNoticeToEdit(null);}}>
                                    <DialogTrigger asChild>
                                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setWarningNoticeToEdit(null); warningNoticeForm.reset(); setShowManageWarningNoticeDialog(true);}}>
                                            <PlusCircle className="me-2 h-4 w-4"/> إنشاء لفت نظر جديد
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent dir="rtl" className="sm:max-w-lg">
                                        <DialogHeader><DialogTitle>{warningNoticeToEdit ? "تعديل لفت نظر" : "إنشاء لفت نظر جديد"}</DialogTitle></DialogHeader>
                                        <Form {...warningNoticeForm}>
                                            <form onSubmit={warningNoticeForm.handleSubmit(handleWarningNoticeSubmit)} className="space-y-4 py-4">
                                                <FormField control={warningNoticeForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={warningNoticeForm.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ لفت النظر</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={warningNoticeForm.control} name="reason" render={({ field }) => (<FormItem><FormLabel>السبب</FormLabel><FormControl><Input placeholder="سبب لفت النظر" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={warningNoticeForm.control} name="details" render={({ field }) => (<FormItem><FormLabel>التفاصيل</FormLabel><FormControl><Textarea placeholder="تفاصيل المخالفة/الملاحظة" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={warningNoticeForm.control} name="issuingManager" render={({ field }) => (<FormItem><FormLabel>المدير المصدر</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المدير" /></SelectTrigger></FormControl><SelectContent>{mockManagers.map(mgr => <SelectItem key={mgr.id!} value={mgr.id!}>{mgr.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <DialogFooter><Button type="submit">{warningNoticeToEdit ? "حفظ التعديلات" : "حفظ النموذج"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>التاريخ</TableHead><TableHead>السبب</TableHead><TableHead>المدير المصدر</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                    <TableBody>{warningNoticesData.map(wn => (<TableRow key={wn.id} className="hover:bg-muted/50">
                                        <TableCell>{employees.find(e => e.id === wn.employeeId)?.name}</TableCell><TableCell>{wn.date.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell><TableCell>{wn.reason}</TableCell><TableCell>{wn.issuingManager}</TableCell>
                                        <TableCell><Badge variant={wn.status === "تم التسليم" ? "default" : "outline"}>{wn.status}</Badge></TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintWarningNotice(wn)}><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setWarningNoticeToEdit(wn); setShowManageWarningNoticeDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا النموذج؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteWarningNotice(wn.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                        </TableCell>
                                    </TableRow>))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="administrativeDecisions">
                    <Card className="shadow-md">
                        <CardHeader><CardTitle>نماذج القرارات الإدارية</CardTitle><CardDescription>تسجيل ومتابعة القرارات الإدارية المتعلقة بالموظفين.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Dialog open={showManageAdminDecisionDialog} onOpenChange={(isOpen) => { setShowManageAdminDecisionDialog(isOpen); if(!isOpen) setAdminDecisionToEdit(null);}}>
                                    <DialogTrigger asChild>
                                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setAdminDecisionToEdit(null); adminDecisionForm.reset(); setShowManageAdminDecisionDialog(true);}}>
                                            <PlusCircle className="me-2 h-4 w-4"/> إنشاء قرار إداري جديد
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent dir="rtl" className="sm:max-w-lg">
                                        <DialogHeader><DialogTitle>{adminDecisionToEdit ? "تعديل قرار إداري" : "إنشاء قرار إداري جديد"}</DialogTitle></DialogHeader>
                                        <Form {...adminDecisionForm}>
                                            <form onSubmit={adminDecisionForm.handleSubmit(handleAdministrativeDecisionSubmit)} className="space-y-4 py-4">
                                                <FormField control={adminDecisionForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={adminDecisionForm.control} name="decisionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ القرار</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={adminDecisionForm.control} name="decisionType" render={({ field }) => (<FormItem><FormLabel>نوع القرار</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر نوع القرار" /></SelectTrigger></FormControl><SelectContent>{mockDecisionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={adminDecisionForm.control} name="details" render={({ field }) => (<FormItem><FormLabel>تفاصيل القرار</FormLabel><FormControl><Textarea placeholder="تفاصيل القرار" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={adminDecisionForm.control} name="issuingAuthority" render={({ field }) => (<FormItem><FormLabel>الجهة المصدرة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الجهة" /></SelectTrigger></FormControl><SelectContent>{mockManagers.map(mgr => <SelectItem key={mgr.id} value={mgr.name}>{mgr.name}</SelectItem>)}<SelectItem value="إدارة الشركة">إدارة الشركة</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={adminDecisionForm.control} name="effectiveDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ السريان</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <DialogFooter><Button type="submit">{adminDecisionToEdit ? "حفظ التعديلات" : "حفظ القرار"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>تاريخ القرار</TableHead><TableHead>النوع</TableHead><TableHead>الجهة المصدرة</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                    <TableBody>{administrativeDecisionsData.map(ad => (<TableRow key={ad.id} className="hover:bg-muted/50">
                                        <TableCell>{employees.find(e => e.id === ad.employeeId)?.name}</TableCell><TableCell>{ad.decisionDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell><TableCell>{ad.decisionType}</TableCell><TableCell>{ad.issuingAuthority}</TableCell>
                                        <TableCell><Badge variant={ad.status === "معتمد" || ad.status === "منفذ" ? "default" : "outline"}>{ad.status}</Badge></TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintAdministrativeDecision(ad)}><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setAdminDecisionToEdit(ad); setShowManageAdminDecisionDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا القرار؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAdministrativeDecision(ad.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                        </TableCell>
                                    </TableRow>))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="resignations">
                    <Card className="shadow-md">
                        <CardHeader><CardTitle>نماذج الاستقالات</CardTitle><CardDescription>تسجيل ومتابعة طلبات الاستقالة من الموظفين.</CardDescription></CardHeader>
                        <CardContent>
                           <div className="mb-4">
                                <Dialog open={showManageResignationDialog} onOpenChange={(isOpen) => { setShowManageResignationDialog(isOpen); if(!isOpen) setResignationToEdit(null);}}>
                                    <DialogTrigger asChild>
                                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setResignationToEdit(null); resignationForm.reset(); setShowManageResignationDialog(true);}}>
                                            <PlusCircle className="me-2 h-4 w-4"/> تسجيل طلب استقالة
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent dir="rtl" className="sm:max-w-lg">
                                        <DialogHeader><DialogTitle>{resignationToEdit ? "تعديل طلب استقالة" : "تسجيل طلب استقالة جديد"}</DialogTitle></DialogHeader>
                                        <Form {...resignationForm}>
                                            <form onSubmit={resignationForm.handleSubmit(handleResignationSubmit)} className="space-y-4 py-4">
                                                <FormField control={resignationForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={resignationForm.control} name="submissionDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ تقديم الاستقالة</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={resignationForm.control} name="lastWorkingDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ آخر يوم عمل</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={resignationForm.control} name="reason" render={({ field }) => (<FormItem><FormLabel>سبب الاستقالة</FormLabel><FormControl><Textarea placeholder="سبب الاستقالة" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={resignationForm.control} name="managerNotifiedDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ إبلاغ المدير (اختياري)</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={resignationForm.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الحالة" /></SelectTrigger></FormControl><SelectContent>{["مقدمة", "مقبولة", "قيد المراجعة", "مسحوبة", "مرفوضة"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <DialogFooter><Button type="submit">{resignationToEdit ? "حفظ التعديلات" : "حفظ الطلب"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                           </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>تاريخ التقديم</TableHead><TableHead>آخر يوم عمل</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                    <TableBody>{resignationsData.map(res => (<TableRow key={res.id} className="hover:bg-muted/50">
                                        <TableCell>{employees.find(e => e.id === res.employeeId)?.name}</TableCell><TableCell>{res.submissionDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell><TableCell>{res.lastWorkingDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell>
                                        <TableCell><Badge variant={res.status === "مقبولة" ? "default" : res.status === "مرفوضة" ? "destructive" : "outline"}>{res.status}</Badge></TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintResignation(res)}><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setResignationToEdit(res); setShowManageResignationDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا الطلب؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteResignation(res.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                        </TableCell>
                                    </TableRow>))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="disciplinaryWarnings">
                    <Card className="shadow-md">
                        <CardHeader><CardTitle>نماذج الإنذارات</CardTitle><CardDescription>تسجيل ومتابعة الإنذارات الموجهة للموظفين.</CardDescription></CardHeader>
                        <CardContent>
                           <div className="mb-4">
                                <Dialog open={showManageDisciplinaryDialog} onOpenChange={(isOpen) => { setShowManageDisciplinaryDialog(isOpen); if(!isOpen) setDisciplinaryToEdit(null);}}>
                                    <DialogTrigger asChild>
                                        <Button className="shadow-md hover:shadow-lg transition-shadow" onClick={() => {setDisciplinaryToEdit(null); disciplinaryWarningForm.reset(); setShowManageDisciplinaryDialog(true);}}>
                                            <PlusCircle className="me-2 h-4 w-4"/> إصدار إنذار جديد
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent dir="rtl" className="sm:max-w-lg">
                                        <DialogHeader><DialogTitle>{disciplinaryToEdit ? "تعديل إنذار" : "إصدار إنذار جديد"}</DialogTitle></DialogHeader>
                                        <Form {...disciplinaryWarningForm}>
                                            <form onSubmit={disciplinaryWarningForm.handleSubmit(handleDisciplinaryWarningSubmit)} className="space-y-4 py-4">
                                                <FormField control={disciplinaryWarningForm.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>الموظف</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl><SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id!}>{emp.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={disciplinaryWarningForm.control} name="warningDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>تاريخ الإنذار</FormLabel><DatePickerWithPresets mode="single" onDateChange={field.onChange} selectedDate={field.value} /><FormMessage /></FormItem>)} />
                                                <FormField control={disciplinaryWarningForm.control} name="warningType" render={({ field }) => (<FormItem><FormLabel>نوع الإنذار</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر نوع الإنذار" /></SelectTrigger></FormControl><SelectContent>{mockWarningTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <FormField control={disciplinaryWarningForm.control} name="violationDetails" render={({ field }) => (<FormItem><FormLabel>تفاصيل المخالفة</FormLabel><FormControl><Textarea placeholder="تفاصيل المخالفة" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={disciplinaryWarningForm.control} name="actionTaken" render={({ field }) => (<FormItem><FormLabel>الإجراء المتخذ (اختياري)</FormLabel><FormControl><Input placeholder="مثال: خصم يوم، تحويل للتحقيق" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={disciplinaryWarningForm.control} name="issuingManager" render={({ field }) => (<FormItem><FormLabel>المدير المصدر</FormLabel><Select onValueChange={field.onChange} value={field.value} dir="rtl"><FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="اختر المدير" /></SelectTrigger></FormControl><SelectContent>{mockManagers.map(mgr => <SelectItem key={mgr.id} value={mgr.name}>{mgr.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                                <DialogFooter><Button type="submit">{disciplinaryToEdit ? "حفظ التعديلات" : "حفظ الإنذار"}</Button><DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose></DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                           </div>
                           <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>تاريخ الإنذار</TableHead><TableHead>النوع</TableHead><TableHead>المدير المصدر</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                                    <TableBody>{disciplinaryWarningsData.map(dw => (<TableRow key={dw.id} className="hover:bg-muted/50">
                                        <TableCell>{employees.find(e => e.id === dw.employeeId)?.name}</TableCell><TableCell>{dw.warningDate.toLocaleDateString('ar-SA', {calendar: 'gregory'})}</TableCell><TableCell>{dw.warningType}</TableCell><TableCell>{dw.issuingManager}</TableCell>
                                        <TableCell><Badge variant={dw.status === "تم التسليم" || dw.status === "منفذ" ? "destructive" : "outline"}>{dw.status}</Badge></TableCell>
                                        <TableCell className="text-center space-x-1 rtl:space-x-reverse">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="طباعة" onClick={() => handlePrintDisciplinaryWarning(dw)}><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" title="تعديل" onClick={() => {setDisciplinaryToEdit(dw); setShowManageDisciplinaryDialog(true);}}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="حذف"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذا الإنذار؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDisciplinaryWarning(dw.id!)}>تأكيد</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                        </TableCell>
                                    </TableRow>))}</TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                 </TabsContent>
            </Tabs>
        </TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
        <Dialog open={showViewEmployeeDialog} onOpenChange={setShowViewEmployeeDialog}>
            <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]" dir="rtl">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>ملف الموظف: {selectedEmployeeForView?.name}</DialogTitle>
                </DialogHeader>
                {selectedEmployeeForView && (
                    <ScrollArea className="flex-grow min-h-0">
                    <div className="py-4 px-2 space-y-3 text-sm">
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
                                <div className="flex items-center gap-1 col-span-2"><strong>الحالة:</strong> <span className="inline-block"><Badge variant={selectedEmployeeForView.status === "نشط" ? "default" : selectedEmployeeForView.status === "منتهية خدمته" ? "destructive" : "outline"}>{selectedEmployeeForView.status}</Badge></span></div>
                            </CardContent>
                            </Card>

                            <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center"><CalendarCheck2 className="me-2 h-4 w-4 text-primary" /> معلومات العقد والانتدابات</CardTitle></CardHeader>
                                <CardContent className="p-3 text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                                    <p><strong>تاريخ بداية العقد:</strong> {selectedEmployeeForView.contractStartDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                                    <p><strong>تاريخ نهاية العقد:</strong> {selectedEmployeeForView.contractEndDate?.toLocaleDateString('ar-SA', {calendar:'gregory'})}</p>
                                    <p><strong>مدة العقد:</strong> {selectedEmployeeForView.contractDuration || "-"}</p>
                                    <p><strong>نهاية فترة التجربة:</strong> {selectedEmployeeForView.probationEndDate ? selectedEmployeeForView.probationEndDate.toLocaleDateString('ar-SA', {calendar:'gregory'}) : "-"}</p>
                                    <p><strong>نوع التوظيف:</strong> {selectedEmployeeForView.employmentType}</p>
                                    <p><strong>نوع العقد:</strong> {selectedEmployeeForView.contractType}</p>
                                    <p><strong>قابل للتجديد:</strong> {selectedEmployeeForView.canRenewContract ? "نعم" : "لا"}</p>
                                     {(selectedEmployeeForView.delegations && selectedEmployeeForView.delegations.length > 0) && (
                                        <div className="col-span-2 mt-1">
                                            <p><strong>الانتدابات:</strong></p>
                                            <ul className="list-disc ms-4">
                                                {selectedEmployeeForView.delegations.map((del, i) => (
                                                    <li key={i}>{del.description} ({del.location}) - من {del.startDate.toLocaleDateString('ar-SA', {calendar:'gregory'})} إلى {del.endDate.toLocaleDateString('ar-SA', {calendar:'gregory'})} [<Badge variant="outline" className="text-xs">{del.status}</Badge>]</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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
                                    {(selectedEmployeeForView.deductions && selectedEmployeeForView.deductions.length > 0) && (
                                        <div className="col-span-2 mt-1">
                                            <p><strong>الخصومات الثابتة:</strong></p>
                                            <ul className="list-disc ms-4">
                                                {selectedEmployeeForView.deductions.map((ded, i) => (
                                                    <li key={i}>{ded.description}: {ded.amount.toLocaleString('ar-SA', {style:'currency', currency: 'SAR'})} ({ded.type})</li>
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
                <DialogFooter className="flex-shrink-0 border-t pt-4">
                    <DialogClose asChild><Button variant="outline">إغلاق</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      {/* View Payroll Dialog */}
        <Dialog open={showViewPayrollDialog} onOpenChange={setShowViewPayrollDialog}>
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader>
                    <DialogTitle>تفاصيل مسير الرواتب: {selectedPayrollForView?.id}</DialogTitle>
                    <DialogDescriptionComponent>مسير رواتب الموظف: {selectedPayrollForView?.employeeName} لشهر: {selectedPayrollForView?.monthYear}</DialogDescriptionComponent>
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
                        {selectedPayrollForView.paymentDate && <p><strong>تاريخ الدفع:</strong> {new Date(selectedPayrollForView.paymentDate).toLocaleDateString('ar-SA', {calendar: 'gregory'})}</p>}
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

        {/* Print Warning Notice Dialog */}
      <Dialog open={showPrintWarningNoticeDialog} onOpenChange={setShowPrintWarningNoticeDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة لفت نظر: {selectedWarningNoticeForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedWarningNoticeForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="warning letter">
              {/* Header Section */}
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'>
                  <AppLogo />
                  <div>
                    <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2>
                    <p className="text-xs">Al-Mustaqbal IT Co.</p>
                    <p className="text-xs">الرياض - المملكة العربية السعودية</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-md font-semibold">إشعار لفت نظر</h3>
                  <p className="text-xs">Warning Notice</p>
                  <p className="text-xs mt-1">الرقم: {selectedWarningNoticeForPrint.id}</p>
                  <p className="text-xs">التاريخ: {new Date(selectedWarningNoticeForPrint.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' })}</p>
                </div>
              </div>

              {/* Body Section - Details */}
              <div className="mb-6 text-xs">
                <p className="mb-2"><strong>إلى السيد/السيدة:</strong> {employees.find(e => e.id === selectedWarningNoticeForPrint.employeeId)?.name}</p>
                <p className="mb-2"><strong>الرقم الوظيفي:</strong> {selectedWarningNoticeForPrint.employeeId}</p>
                <p className="mb-4"><strong>الموضوع:</strong> لفت نظر بخصوص ({selectedWarningNoticeForPrint.reason})</p>
                
                <p className="leading-relaxed mb-4">{selectedWarningNoticeForPrint.details}</p>
                
                <p className="mb-2">عليه، نأمل منكم الالتزام بسياسات الشركة وتجنب تكرار مثل هذه المخالفة مستقبلاً.</p>
                <p>وتفضلوا بقبول فائق الاحترام.</p>
              </div>

              {/* Footer Section - Signatures */}
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">المدير المباشر/المصدر</p>
                  <p>{selectedWarningNoticeForPrint.issuingManager}</p>
                </div>
                <div className="text-center">
                  <p className="mb-10">.........................</p>
                  <p className="font-semibold">استلام الموظف</p>
                  <p>(التوقيع)</p>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4">
            <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button>
            <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print Administrative Decision Dialog */}
      <Dialog open={showPrintAdminDecisionDialog} onOpenChange={setShowPrintAdminDecisionDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden">
            <DialogTitle>طباعة قرار إداري: {selectedAdminDecisionForPrint?.id}</DialogTitle>
          </DialogHeader>
          {selectedAdminDecisionForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="decision document">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> <p className="text-xs">الرياض - المملكة العربية السعودية</p> </div> </div>
                <div className="text-left"> <h3 className="text-md font-semibold">قرار إداري</h3> <p className="text-xs">Administrative Decision</p> <p className="text-xs mt-1">الرقم: {selectedAdminDecisionForPrint.id}</p> <p className="text-xs">تاريخ القرار: {new Date(selectedAdminDecisionForPrint.decisionDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p> </div>
              </div>
              <div className="mb-6 text-xs">
                <p className="mb-2"><strong>بناءً على الصلاحيات المخولة لنا، وبعد الاطلاع على مصلحة العمل، تقرر ما يلي:</strong></p>
                <p className="mb-2"><strong>الموظف:</strong> {employees.find(e => e.id === selectedAdminDecisionForPrint.employeeId)?.name} - (الرقم الوظيفي: {selectedAdminDecisionForPrint.employeeId})</p>
                <p className="mb-2"><strong>نوع القرار:</strong> {selectedAdminDecisionForPrint.decisionType}</p>
                <p className="mb-4"><strong>تفاصيل القرار:</strong></p>
                <p className="leading-relaxed mb-4 whitespace-pre-line">{selectedAdminDecisionForPrint.details}</p>
                <p className="mb-2"><strong>تاريخ سريان القرار:</strong> {new Date(selectedAdminDecisionForPrint.effectiveDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>يُعمل بهذا القرار من تاريخ سريانه وعلى الجهات المعنية تنفيذه كل فيما يخصه.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">الجهة المصدرة للقرار</p> <p>{selectedAdminDecisionForPrint.issuingAuthority}</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">استلام الموظف (للعلم)</p> <p>(التوقيع)</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Resignation Dialog */}
      <Dialog open={showPrintResignationDialog} onOpenChange={setShowPrintResignationDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden"> <DialogTitle>نموذج استقالة: {selectedResignationForPrint?.id}</DialogTitle> </DialogHeader>
          {selectedResignationForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="resignation form">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> </div> </div>
                <div className="text-left"> <h3 className="text-md font-semibold">طلب استقالة</h3> <p className="text-xs">Resignation Request</p> <p className="text-xs mt-1">الرقم: {selectedResignationForPrint.id}</p> </div>
              </div>
              <p className="text-right mb-4 text-xs">التاريخ: {new Date(selectedResignationForPrint.submissionDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="mb-2 text-xs"><strong>إلى السيد/ مدير الموارد البشرية المحترم،</strong></p>
              <p className="mb-4 text-xs">تحية طيبة وبعد،</p>
              <p className="mb-2 text-xs">أتقدم إليكم بطلب استقالتي من العمل في شركة المستقبل لتقنية المعلومات، وذلك اعتباراً من تاريخ آخر يوم عمل الموافق {new Date(selectedResignationForPrint.lastWorkingDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
              <p className="mb-2 text-xs"><strong>الموظف:</strong> {employees.find(e => e.id === selectedResignationForPrint.employeeId)?.name} - (الرقم الوظيفي: {selectedResignationForPrint.employeeId})</p>
              <p className="mb-4 text-xs"><strong>سبب الاستقالة:</strong> {selectedResignationForPrint.reason}</p>
              {selectedResignationForPrint.managerNotifiedDate && <p className="mb-4 text-xs"><strong>تم إبلاغ المدير المباشر بتاريخ:</strong> {new Date(selectedResignationForPrint.managerNotifiedDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
              <p className="mb-4 text-xs">أشكر لكم الفترة التي قضيتها في الشركة وأتمنى لكم كل التوفيق.</p>
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">توقيع الموظف</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">اعتماد مدير الموارد البشرية</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Disciplinary Warning Dialog */}
      <Dialog open={showPrintDisciplinaryDialog} onOpenChange={setShowPrintDisciplinaryDialog}>
        <DialogContent className="sm:max-w-3xl print-hidden" dir="rtl">
          <DialogHeader className="print-hidden"> <DialogTitle>طباعة إنذار: {selectedDisciplinaryForPrint?.id}</DialogTitle> </DialogHeader>
          {selectedDisciplinaryForPrint && (
            <div className="printable-area bg-background text-foreground font-cairo text-sm p-4" data-ai-hint="disciplinary document">
              <div className="flex justify-between items-start pb-4 mb-6 border-b border-gray-300">
                <div className='flex items-center gap-2'> <AppLogo /> <div> <h2 className="text-lg font-bold">شركة المستقبل لتقنية المعلومات</h2> <p className="text-xs">Al-Mustaqbal IT Co.</p> </div> </div>
                <div className="text-left"> <h3 className="text-md font-semibold">إشعار إنذار ({selectedDisciplinaryForPrint.warningType})</h3> <p className="text-xs">Disciplinary Warning</p> <p className="text-xs mt-1">الرقم: {selectedDisciplinaryForPrint.id}</p> <p className="text-xs">التاريخ: {new Date(selectedDisciplinaryForPrint.warningDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p> </div>
              </div>
              <div className="mb-6 text-xs">
                <p className="mb-2"><strong>إلى السيد/السيدة:</strong> {employees.find(e => e.id === selectedDisciplinaryForPrint.employeeId)?.name}</p>
                <p className="mb-2"><strong>الرقم الوظيفي:</strong> {selectedDisciplinaryForPrint.employeeId}</p>
                <p className="mb-4"><strong>الموضوع:</strong> إنذار ({selectedDisciplinaryForPrint.warningType})</p>
                <p className="mb-2"><strong>تفاصيل المخالفة:</strong></p>
                <p className="leading-relaxed mb-4 whitespace-pre-line">{selectedDisciplinaryForPrint.violationDetails}</p>
                {selectedDisciplinaryForPrint.actionTaken && <p className="mb-2"><strong>الإجراء المتخذ:</strong> {selectedDisciplinaryForPrint.actionTaken}</p>}
                <p className="mb-2">نأمل منكم الالتزام التام بأنظمة ولوائح الشركة لتجنب أي إجراءات أخرى قد تترتب على تكرار المخالفة.</p>
                <p>وتفضلوا بقبول فائق الاحترام.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-16 pt-6 border-t border-gray-300 text-xs">
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">المدير المصدر</p> <p>{selectedDisciplinaryForPrint.issuingManager}</p> </div>
                <div className="text-center"> <p className="mb-10">.........................</p> <p className="font-semibold">استلام الموظف</p> <p>(التوقيع)</p> </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-10 print:block hidden">هذا المستند معتمد من نظام المستقبل ERP</p>
            </div>
          )}
          <DialogFooter className="print-hidden pt-4"> <Button onClick={() => window.print()}><Printer className="me-2 h-4 w-4" /> طباعة</Button> <DialogClose asChild><Button type="button" variant="outline">إغلاق</Button></DialogClose> </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
}


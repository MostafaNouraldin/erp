
'use server';

import { db } from '@/db';
import { employees, employeeAllowances, employeeDeductions, payrolls, attendanceRecords, leaveRequests, warningNotices, administrativeDecisions, resignations, disciplinaryWarnings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الموظف مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  contractStartDate: z.date({ required_error: "تاريخ بداية العقد مطلوب" }),
  contractEndDate: z.date({ required_error: "تاريخ نهاية العقد مطلوب" }),
  employmentType: z.enum(["دوام كامل", "دوام جزئي", "عقد محدد", "مستقل"]),
  status: z.enum(["نشط", "في إجازة", "منتهية خدمته", "متوقف مؤقتاً"]),
  basicSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون إيجابياً"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  avatarUrl: z.string().url("رابط الصورة غير صالح").optional().or(z.literal('')),
  dataAiHint: z.string().max(30).optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  allowances: z.array(employeeAllowanceSchema).optional(),
  deductions: z.array(employeeDeductionSchema).optional(),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

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
  allowances: z.array(payrollItemSchema).optional(),
  deductions: z.array(payrollItemSchema).optional(),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "قيد المعالجة", "مدفوع", "ملغي"]),
  netSalary: z.coerce.number().optional(),
  paymentDate: z.date().optional().nullable(),
});
export type PayrollFormValues = z.infer<typeof payrollSchema>;

const attendanceSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["حاضر", "غائب", "حاضر (متأخر)", "حاضر (مغادرة مبكرة)", "إجازة"]),
  hours: z.string().optional(),
});
export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const leaveRequestSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  leaveType: z.string().min(1, "نوع الإجازة مطلوب"),
  startDate: z.date({ required_error: "تاريخ البدء مطلوب" }),
  endDate: z.date({ required_error: "تاريخ الانتهاء مطلوب" }),
  reason: z.string().optional(),
  status: z.enum(["مقدمة", "موافق عليها", "مرفوضة", "ملغاة"]),
  days: z.coerce.number().optional(),
});
export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;


const warningNoticeSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1),
    date: z.date(),
    reason: z.string().min(1),
    details: z.string().min(1),
    issuingManager: z.string().min(1),
    status: z.enum(["مسودة", "تم التسليم", "ملغى"]),
});
export type WarningNoticeFormValues = z.infer<typeof warningNoticeSchema>;

const administrativeDecisionSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1),
    decisionDate: z.date(),
    decisionType: z.string().min(1),
    details: z.string().min(1),
    issuingAuthority: z.string().min(1),
    effectiveDate: z.date(),
    status: z.enum(["مسودة", "معتمد", "منفذ", "ملغى"]),
});
export type AdministrativeDecisionFormValues = z.infer<typeof administrativeDecisionSchema>;

const resignationSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1),
    submissionDate: z.date(),
    lastWorkingDate: z.date(),
    reason: z.string().min(1),
    managerNotifiedDate: z.date().optional().nullable(),
    status: z.enum(["مقدمة", "مقبولة", "قيد المراجعة", "مسحوبة", "مرفوضة"]),
});
export type ResignationFormValues = z.infer<typeof resignationSchema>;

const disciplinaryWarningSchema = z.object({
    id: z.string().optional(),
    employeeId: z.string().min(1),
    warningDate: z.date(),
    warningType: z.enum(["إنذار أول", "إنذار ثاني", "إنذار نهائي", "إجراء تأديبي آخر"]),
    violationDetails: z.string().min(1),
    actionTaken: z.string().optional(),
    issuingManager: z.string().min(1),
    status: z.enum(["مسودة", "تم التسليم", "معترض عليه", "منفذ"]),
});
export type DisciplinaryWarningFormValues = z.infer<typeof disciplinaryWarningSchema>;

// --- Employee Actions ---
export async function addEmployee(values: EmployeeFormValues) {
    const newId = `EMP${Date.now()}`;
    await db.transaction(async (tx) => {
        await tx.insert(employees).values({ ...values, id: newId, basicSalary: String(values.basicSalary) });
        if (values.allowances && values.allowances.length > 0) {
            await tx.insert(employeeAllowances).values(values.allowances.map(a => ({ ...a, employeeId: newId, amount: String(a.amount) })));
        }
        if (values.deductions && values.deductions.length > 0) {
            await tx.insert(employeeDeductions).values(values.deductions.map(d => ({ ...d, employeeId: newId, amount: String(d.amount) })));
        }
    });
    revalidatePath('/hr-payroll');
}

export async function updateEmployee(values: EmployeeFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.transaction(async (tx) => {
        await tx.update(employees).set({ ...values, basicSalary: String(values.basicSalary) }).where(eq(employees.id, values.id!));
        await tx.delete(employeeAllowances).where(eq(employeeAllowances.employeeId, values.id!));
        await tx.delete(employeeDeductions).where(eq(employeeDeductions.employeeId, values.id!));
        if (values.allowances && values.allowances.length > 0) {
            await tx.insert(employeeAllowances).values(values.allowances.map(a => ({ ...a, employeeId: values.id!, amount: String(a.amount) })));
        }
        if (values.deductions && values.deductions.length > 0) {
            await tx.insert(employeeDeductions).values(values.deductions.map(d => ({ ...d, employeeId: values.id!, amount: String(d.amount) })));
        }
    });
    revalidatePath('/hr-payroll');
}

export async function deleteEmployee(id: string) {
    await db.delete(employees).where(eq(employees.id, id));
    revalidatePath('/hr-payroll');
}

// --- Payroll Actions ---
export async function addPayroll(values: PayrollFormValues) {
    const newId = `PAY${Date.now()}`;
    await db.insert(payrolls).values({ ...values, id: newId, basicSalary: String(values.basicSalary), netSalary: String(values.netSalary) });
    revalidatePath('/hr-payroll');
}

export async function updatePayroll(values: PayrollFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(payrolls).set({ ...values, basicSalary: String(values.basicSalary), netSalary: String(values.netSalary) }).where(eq(payrolls.id, values.id!));
    revalidatePath('/hr-payroll');
}

// --- Attendance Actions ---
export async function addAttendance(values: AttendanceFormValues) {
    const newId = `ATT${Date.now()}`;
    await db.insert(attendanceRecords).values({ ...values, id: newId });
    revalidatePath('/hr-payroll');
}

export async function updateAttendance(values: AttendanceFormValues) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(attendanceRecords).set(values).where(eq(attendanceRecords.id, values.id!));
    revalidatePath('/hr-payroll');
}

// --- Leave Request Actions ---
export async function addLeaveRequest(values: LeaveRequestFormValues) {
    const newId = `LR${Date.now()}`;
    await db.insert(leaveRequests).values({ ...values, id: newId });
    revalidatePath('/hr-payroll');
}

export async function updateLeaveRequestStatus(id: string, status: LeaveRequestFormValues['status']) {
    await db.update(leaveRequests).set({ status }).where(eq(leaveRequests.id, id));
    revalidatePath('/hr-payroll');
}

// --- Warning Notice Actions ---
export async function addWarningNotice(values: WarningNoticeFormValues) {
  const newId = `WARN${Date.now()}`;
  await db.insert(warningNotices).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateWarningNotice(values: WarningNoticeFormValues) {
  if (!values.id) throw new Error("ID is required");
  await db.update(warningNotices).set(values).where(eq(warningNotices.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteWarningNotice(id: string) {
  await db.delete(warningNotices).where(eq(warningNotices.id, id));
  revalidatePath('/hr-payroll');
}

// --- Administrative Decision Actions ---
export async function addAdministrativeDecision(values: AdministrativeDecisionFormValues) {
  const newId = `ADEC${Date.now()}`;
  await db.insert(administrativeDecisions).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateAdministrativeDecision(values: AdministrativeDecisionFormValues) {
  if (!values.id) throw new Error("ID is required");
  await db.update(administrativeDecisions).set(values).where(eq(administrativeDecisions.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteAdministrativeDecision(id: string) {
  await db.delete(administrativeDecisions).where(eq(administrativeDecisions.id, id));
  revalidatePath('/hr-payroll');
}

// --- Resignation Actions ---
export async function addResignation(values: ResignationFormValues) {
  const newId = `RESG${Date.now()}`;
  await db.insert(resignations).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateResignation(values: ResignationFormValues) {
  if (!values.id) throw new Error("ID is required");
  await db.update(resignations).set(values).where(eq(resignations.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteResignation(id: string) {
  await db.delete(resignations).where(eq(resignations.id, id));
  revalidatePath('/hr-payroll');
}

// --- Disciplinary Warning Actions ---
export async function addDisciplinaryWarning(values: DisciplinaryWarningFormValues) {
  const newId = `DISC${Date.now()}`;
  await db.insert(disciplinaryWarnings).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateDisciplinaryWarning(values: DisciplinaryWarningFormValues) {
  if (!values.id) throw new Error("ID is required");
  await db.update(disciplinaryWarnings).set(values).where(eq(disciplinaryWarnings.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteDisciplinaryWarning(id: string) {
  await db.delete(disciplinaryWarnings).where(eq(disciplinaryWarnings.id, id));
  revalidatePath('/hr-payroll');
}

    


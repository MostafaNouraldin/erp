

'use server';

import { connectToTenantDb } from '@/db';
import { employees, employeeAllowances, employeeDeductions, payrolls, attendanceRecords, leaveRequests, warningNotices, administrativeDecisions, resignations, disciplinaryWarnings, journalEntries, journalEntryLines, overtime } from '@/db/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const employeeAllowanceSchema = z.object({
  id: z.string().optional(),
  typeId: z.string().min(1, "نوع البدل مطلوب"),
  description: z.string().min(1, "وصف البدل مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  type: z.enum(["ثابت", "متغير", "مرة واحدة"]).default("ثابت"),
});

const employeeDeductionSchema = z.object({
  id: z.string().optional(),
  typeId: z.string().min(1, "نوع الخصم مطلوب"),
  description: z.string().min(1, "وصف الخصم مطلوب"),
  amount: z.coerce.number().min(0, "المبلغ يجب أن يكون إيجابياً"),
  type: z.enum(["ثابت", "متغير", "مرة واحدة"]).default("ثابت"),
});

const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الموظف مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  managerId: z.string().optional().nullable(),
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
  medicalInsuranceProvider: z.string().optional(),
  medicalInsurancePolicyNumber: z.string().optional(),
  medicalInsuranceClass: z.string().optional(),
  medicalInsuranceStartDate: z.date().optional().nullable(),
  medicalInsuranceEndDate: z.date().optional().nullable(),
  annualLeaveBalance: z.coerce.number().int().min(0).default(0),
  sickLeaveBalance: z.coerce.number().int().min(0).default(0),
  emergencyLeaveBalance: z.coerce.number().int().min(0).default(0),
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
  status: z.enum(["مسودة", "معتمد", "مرحل للحسابات", "مدفوع", "ملغي"]),
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

const overtimeSchema = z.object({
  id: z.number().optional(),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  hours: z.coerce.number().min(0.1, "يجب أن تكون الساعات أكبر من صفر"),
  rate: z.coerce.number().default(1.5),
  amount: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "paid"]).default("pending"),
});
export type OvertimeFormValues = z.infer<typeof overtimeSchema>;


async function getDb() {
  const { db } = await connectToTenantDb('T001');
  return db;
}


// --- Employee Actions ---
export async function addEmployee(values: EmployeeFormValues) {
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
    await db.delete(employees).where(eq(employees.id, id));
    revalidatePath('/hr-payroll');
}

// --- Payroll Actions ---
export async function addPayroll(values: PayrollFormValues) {
    const db = await getDb();
    const newId = `PAY${Date.now()}`;

    // Get month and year from monthYear string
    const [monthName, year] = values.monthYear.split(' ');
    const month = new Date(Date.parse(monthName +" 1, 2012")).getMonth();
    const startDate = new Date(parseInt(year), month, 1);
    const endDate = new Date(parseInt(year), month + 1, 0);

    const approvedOvertime = await db.select().from(overtime).where(
        and(
            eq(overtime.employeeId, values.employeeId),
            eq(overtime.status, 'approved'),
            gte(overtime.date, startDate),
            lte(overtime.date, endDate)
        )
    );
    
    const overtimeAmount = approvedOvertime.reduce((sum, ot) => sum + (ot.amount ? parseFloat(ot.amount) : 0), 0);
    
    let finalAllowances = values.allowances || [];
    if (overtimeAmount > 0) {
        finalAllowances.push({ description: 'عمل إضافي', amount: overtimeAmount });
    }

    await db.insert(payrolls).values({ ...values, id: newId, basicSalary: String(values.basicSalary), netSalary: String(values.netSalary), allowances: finalAllowances });
    
    // Mark overtime as paid
    if (approvedOvertime.length > 0) {
        await db.update(overtime).set({ status: 'paid' }).where(
            and(
                eq(overtime.employeeId, values.employeeId),
                eq(overtime.status, 'approved'),
                gte(overtime.date, startDate),
                lte(overtime.date, endDate)
            )
        );
    }
    
    revalidatePath('/hr-payroll');
}

export async function updatePayroll(values: PayrollFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(payrolls).set({ ...values, basicSalary: String(values.basicSalary), netSalary: String(values.netSalary) }).where(eq(payrolls.id, values.id!));
    revalidatePath('/hr-payroll');
}

export async function updatePayrollStatus(id: string, status: PayrollFormValues['status']) {
    const db = await getDb();
    await db.update(payrolls).set({ status, paymentDate: status === "مدفوع" ? new Date() : null }).where(eq(payrolls.id, id));
    revalidatePath('/hr-payroll');
}

export async function postPayrollToGL(payrollId: string) {
    const db = await getDb();
    const payroll = await db.query.payrolls.findFirst({ where: eq(payrolls.id, payrollId) });

    if (!payroll) {
        throw new Error("مسير الرواتب غير موجود.");
    }
    if (payroll.status === "مرحل للحسابات" || payroll.status === "مدفوع") {
        throw new Error("هذا المسير تم ترحيله مسبقاً.");
    }

    const employee = await db.query.employees.findFirst({ where: eq(employees.id, payroll.employeeId) });

    const salaryExpenseAccount = '5000'; // حساب مصروف الرواتب
    const allowancesExpenseAccount = '5010'; // حساب مصروف البدلات
    const salariesPayableAccount = '2100'; // حساب الرواتب المستحقة

    const totalAllowances = (payroll.allowances as any[] || []).reduce((sum, item) => sum + Number(item.amount), 0);
    const totalDeductions = (payroll.deductions as any[] || []).reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Total expense is basic salary + allowances
    const totalExpense = Number(payroll.basicSalary) + totalAllowances;
    
    const newEntryId = `JV-PAY-${payrollId}`;

    await db.transaction(async (tx) => {
        // Create Journal Entry
        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: new Date(), // Or use payroll month/year to create a date
            description: `ترحيل مسير رواتب ${payroll.monthYear} للموظف ${employee?.name}`,
            totalAmount: String(totalExpense),
            status: "مرحل",
            sourceModule: "Payroll",
            sourceDocumentId: payroll.id,
        });

        const entryLines = [];

        // Debit Salary Expense
        entryLines.push({
            journalEntryId: newEntryId, accountId: salaryExpenseAccount, debit: String(payroll.basicSalary), credit: '0', description: `راتب أساسي - ${employee?.name}`
        });

        // Debit Allowances Expense
        if (totalAllowances > 0) {
            entryLines.push({
                journalEntryId: newEntryId, accountId: allowancesExpenseAccount, debit: String(totalAllowances), credit: '0', description: `إجمالي البدلات - ${employee?.name}`
            });
        }
        
        // Credit Salaries Payable (Net Salary)
        if (payroll.netSalary && payroll.netSalary > 0) {
             entryLines.push({
                journalEntryId: newEntryId, accountId: salariesPayableAccount, debit: '0', credit: String(payroll.netSalary), description: `صافي الراتب المستحق - ${employee?.name}`
            });
        }
       
        // Credit each deduction to its respective liability/asset account
        // This part needs more detailed logic based on deduction types (e.g., loan, advance)
        // For now, we'll credit a generic deductions account '2110' for simplicity
        if (totalDeductions > 0) {
             entryLines.push({
                journalEntryId: newEntryId, accountId: '2110', debit: '0', credit: String(totalDeductions), description: `إجمالي الخصومات - ${employee?.name}`
            });
        }
        
        await tx.insert(journalEntryLines).values(entryLines);

        // Update payroll status
        await tx.update(payrolls).set({ status: 'مرحل للحسابات' }).where(eq(payrolls.id, payrollId));
    });

    revalidatePath('/hr-payroll');
    revalidatePath('/general-ledger');
}


// --- Attendance Actions ---
export async function addAttendance(values: AttendanceFormValues) {
    const db = await getDb();
    const newId = `ATT${Date.now()}`;
    const checkInDate = values.checkIn ? new Date() : null;
    if (checkInDate && values.checkIn) {
        const [hours, minutes] = values.checkIn.split(':').map(Number);
        checkInDate.setHours(hours, minutes, 0, 0);
    }
    const checkOutDate = values.checkOut ? new Date() : null;
    if (checkOutDate && values.checkOut) {
        const [hours, minutes] = values.checkOut.split(':').map(Number);
        checkOutDate.setHours(hours, minutes, 0, 0);
    }

    await db.insert(attendanceRecords).values({ ...values, id: newId, checkIn: checkInDate, checkOut: checkOutDate });
    revalidatePath('/hr-payroll');
}

export async function updateAttendance(values: AttendanceFormValues) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    const checkInDate = values.checkIn ? new Date() : null;
    if (checkInDate && values.checkIn) {
        const [hours, minutes] = values.checkIn.split(':').map(Number);
        checkInDate.setHours(hours, minutes, 0, 0);
    }
    const checkOutDate = values.checkOut ? new Date() : null;
    if (checkOutDate && values.checkOut) {
        const [hours, minutes] = values.checkOut.split(':').map(Number);
        checkOutDate.setHours(hours, minutes, 0, 0);
    }
    await db.update(attendanceRecords).set({...values, checkIn: checkInDate, checkOut: checkOutDate}).where(eq(attendanceRecords.id, values.id!));
    revalidatePath('/hr-payroll');
}

// --- Leave Request Actions ---
export async function addLeaveRequest(values: LeaveRequestFormValues) {
    const db = await getDb();
    const newId = `LR${Date.now()}`;
    await db.insert(leaveRequests).values({ ...values, id: newId });
    revalidatePath('/hr-payroll');
}

export async function updateLeaveRequestStatus(id: string, status: LeaveRequestFormValues['status'], values?: LeaveRequestFormValues) {
    const db = await getDb();
    if (values) { // This is an update call
         await db.update(leaveRequests).set({...values, status}).where(eq(leaveRequests.id, id));
    } else { // This is just a status change
        await db.update(leaveRequests).set({ status }).where(eq(leaveRequests.id, id));
    }
    revalidatePath('/hr-payroll');
}

// --- Overtime Actions ---
export async function addOvertime(values: OvertimeFormValues) {
    const db = await getDb();
    await db.insert(overtime).values({ ...values, rate: String(values.rate), hours: String(values.hours) });
    revalidatePath('/hr-payroll');
}

export async function approveOvertime(id: number) {
    const db = await getDb();
    const otRecord = await db.query.overtime.findFirst({ where: eq(overtime.id, id) });
    if (!otRecord) throw new Error("سجل العمل الإضافي غير موجود.");

    const employee = await db.query.employees.findFirst({ where: eq(employees.id, otRecord.employeeId) });
    if (!employee) throw new Error("الموظف المرتبط غير موجود.");
    
    // Calculation: (Salary / 30 days / 8 hours) * hours * rate
    const hourlyRate = parseFloat(employee.basicSalary) / 30 / 8;
    const amount = hourlyRate * parseFloat(otRecord.hours) * parseFloat(otRecord.rate);

    await db.update(overtime)
        .set({ status: 'approved', amount: String(amount) })
        .where(eq(overtime.id, id));
    revalidatePath('/hr-payroll');
}

export async function rejectOvertime(id: number) {
    const db = await getDb();
    await db.update(overtime).set({ status: 'rejected' }).where(eq(overtime.id, id));
    revalidatePath('/hr-payroll');
}

// --- Warning Notice Actions ---
export async function addWarningNotice(values: WarningNoticeFormValues) {
  const db = await getDb();
  const newId = `WARN${Date.now()}`;
  await db.insert(warningNotices).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateWarningNotice(values: WarningNoticeFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID is required");
  await db.update(warningNotices).set(values).where(eq(warningNotices.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteWarningNotice(id: string) {
  const db = await getDb();
  await db.delete(warningNotices).where(eq(warningNotices.id, id));
  revalidatePath('/hr-payroll');
}

// --- Administrative Decision Actions ---
export async function addAdministrativeDecision(values: AdministrativeDecisionFormValues) {
  const db = await getDb();
  const newId = `ADEC${Date.now()}`;
  await db.insert(administrativeDecisions).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateAdministrativeDecision(values: AdministrativeDecisionFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID is required");
  await db.update(administrativeDecisions).set(values).where(eq(administrativeDecisions.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteAdministrativeDecision(id: string) {
  const db = await getDb();
  await db.delete(administrativeDecisions).where(eq(administrativeDecisions.id, id));
  revalidatePath('/hr-payroll');
}

// --- Resignation Actions ---
export async function addResignation(values: ResignationFormValues) {
  const db = await getDb();
  const newId = `RESG${Date.now()}`;
  await db.insert(resignations).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateResignation(values: ResignationFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID is required");
  await db.update(resignations).set(values).where(eq(resignations.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteResignation(id: string) {
  const db = await getDb();
  await db.delete(resignations).where(eq(resignations.id, id));
  revalidatePath('/hr-payroll');
}

// --- Disciplinary Warning Actions ---
export async function addDisciplinaryWarning(values: DisciplinaryWarningFormValues) {
  const db = await getDb();
  const newId = `DISC${Date.now()}`;
  await db.insert(disciplinaryWarnings).values({ ...values, id: newId });
  revalidatePath('/hr-payroll');
}
export async function updateDisciplinaryWarning(values: DisciplinaryWarningFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID is required");
  await db.update(disciplinaryWarnings).set(values).where(eq(disciplinaryWarnings.id, values.id));
  revalidatePath('/hr-payroll');
}
export async function deleteDisciplinaryWarning(id: string) {
  const db = await getDb();
  await db.delete(disciplinaryWarnings).where(eq(disciplinaryWarnings.id, id));
  revalidatePath('/hr-payroll');
}

// HR Settings Actions (Department, JobTitle, LeaveType)
export { addDepartment, updateDepartment, deleteDepartment, addJobTitle, updateJobTitle, deleteJobTitle, addLeaveType, updateLeaveType, deleteLeaveType, addAllowanceType, updateAllowanceType, deleteAllowanceType, addDeductionType, updateDeductionType, deleteDeductionType } from '../settings/actions';

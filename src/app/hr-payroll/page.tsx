

import React from 'react';
import { connectToTenantDb } from '@/db';
import { employees, payrolls, attendanceRecords, leaveRequests, warningNotices, administrativeDecisions, resignations, disciplinaryWarnings, employeeAllowances, employeeDeductions, departments, jobTitles, leaveTypes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import HRClientComponent from './HRClientComponent';

export default async function HRPayrollPage() {
    const { db } = await connectToTenantDb();
    try {
        const employeesResult = await db.select().from(employees);
        const payrollsResult = await db.select().from(payrolls);
        const attendanceResult = await db.select().from(attendanceRecords);
        const leaveRequestsResult = await db.select().from(leaveRequests);
        const warningNoticesResult = await db.select().from(warningNotices);
        const administrativeDecisionsResult = await db.select().from(administrativeDecisions);
        const resignationsResult = await db.select().from(resignations);
        const disciplinaryWarningsResult = await db.select().from(disciplinaryWarnings);
        const departmentsResult = await db.select().from(departments);
        const jobTitlesResult = await db.select().from(jobTitles);
        const leaveTypesResult = await db.select().from(leaveTypes);

        const employeesWithDetails = await Promise.all(
            employeesResult.map(async (emp) => {
                const allowances = await db.select().from(employeeAllowances).where(eq(employeeAllowances.employeeId, emp.id));
                const deductions = await db.select().from(employeeDeductions).where(eq(employeeDeductions.employeeId, emp.id));
                return {
                    ...emp,
                    basicSalary: parseFloat(emp.basicSalary),
                    contractStartDate: new Date(emp.contractStartDate),
                    contractEndDate: new Date(emp.contractEndDate),
                    allowances: allowances.map(a => ({...a, amount: parseFloat(a.amount)})),
                    deductions: deductions.map(d => ({...d, amount: parseFloat(d.amount)})),
                    medicalInsuranceStartDate: emp.medicalInsuranceStartDate ? new Date(emp.medicalInsuranceStartDate) : null,
                    medicalInsuranceEndDate: emp.medicalInsuranceEndDate ? new Date(emp.medicalInsuranceEndDate) : null,
                };
            })
        );
        
        const payrollsWithDetails = payrollsResult.map(p => {
            const allowances = (p.allowances as any[] | null)?.map(a => ({ ...a, amount: parseFloat(a.amount) })) || [];
            const deductions = (p.deductions as any[] | null)?.map(d => ({ ...d, amount: parseFloat(d.amount) })) || [];
            return {
                ...p,
                basicSalary: parseFloat(p.basicSalary),
                netSalary: p.netSalary ? parseFloat(p.netSalary) : 0,
                paymentDate: p.paymentDate ? new Date(p.paymentDate) : null,
                allowances,
                deductions,
            };
        });
        
        const attendanceWithCorrectDates = attendanceResult.map(a => {
            const checkInTime = a.checkIn ? new Date(a.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}) : null;
            const checkOutTime = a.checkOut ? new Date(a.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}) : null;
            
            return {
              ...a,
              date: new Date(a.date),
              checkIn: checkInTime,
              checkOut: checkOutTime,
            };
        });

        const initialData = {
            employees: employeesWithDetails,
            payrolls: payrollsWithDetails,
            attendances: attendanceWithCorrectDates,
            leaveRequests: leaveRequestsResult.map(l => ({...l, startDate: new Date(l.startDate), endDate: new Date(l.endDate)})),
            warningNotices: warningNoticesResult.map(w => ({...w, date: new Date(w.date)})),
            administrativeDecisions: administrativeDecisionsResult.map(d => ({...d, decisionDate: new Date(d.decisionDate), effectiveDate: new Date(d.effectiveDate)})),
            resignations: resignationsResult.map(r => ({...r, submissionDate: new Date(r.submissionDate), lastWorkingDate: new Date(r.lastWorkingDate), managerNotifiedDate: r.managerNotifiedDate ? new Date(r.managerNotifiedDate) : null })),
            disciplinaryWarnings: disciplinaryWarningsResult.map(d => ({...d, warningDate: new Date(d.warningDate)})),
            departments: departmentsResult,
            jobTitles: jobTitlesResult,
            leaveTypes: leaveTypesResult,
        };

        return <HRClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for HR/Payroll page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة الموارد البشرية</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول الموارد البشرية (`employees`, etc.) غير موجودة.
                </p>
                <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}


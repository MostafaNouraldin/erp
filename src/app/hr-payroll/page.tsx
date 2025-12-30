
import React from 'react';
import { db } from '@/db';
import { employees, employeeAllowances, employeeDeductions, payrolls, attendanceRecords, leaveRequests } from '@/db/schema';
import { eq } from 'drizzle-orm';
import HRClientComponent from './HRClientComponent';

export default async function HRPayrollPage() {
    try {
        const employeesResult = await db.select().from(employees);
        const payrollsResult = await db.select().from(payrolls);
        const attendanceResult = await db.select().from(attendanceRecords);
        const leaveRequestsResult = await db.select().from(leaveRequests);

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
                    incentives: [], 
                    delegations: [],
                };
            })
        );
        
        const payrollsWithDetails = payrollsResult.map(p => ({
            ...p,
            basicSalary: parseFloat(p.basicSalary),
            netSalary: p.netSalary ? parseFloat(p.netSalary) : 0,
            paymentDate: p.paymentDate ? new Date(p.paymentDate) : null,
            allowances: [], // These would need to be fetched if stored separately per payroll
            deductions: [], // Same as above
        }));

        const initialData = {
            employees: employeesWithDetails,
            payrolls: payrollsWithDetails,
            attendances: attendanceResult.map(a => ({...a, date: new Date(a.date)})),
            leaveRequests: leaveRequestsResult.map(l => ({...l, startDate: new Date(l.startDate), endDate: new Date(l.endDate)})),
            // The following are not yet connected to DB, so we pass empty arrays
            warningNotices: [],
            administrativeDecisions: [],
            resignations: [],
            disciplinaryWarnings: [],
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

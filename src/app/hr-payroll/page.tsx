
import React from 'react';
import { db } from '@/db';
import { employees, employeeAllowances, employeeDeductions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import HRClientComponent from './HRClientComponent';

export default async function HRPayrollPage() {
    const employeesResult = await db.select().from(employees);

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
                // Assuming these other complex types need to be initialized for the form
                incentives: [], 
                delegations: [],
                probationEndDate: null,
                medicalInsuranceExpiryDate: null,
            };
        })
    );

    const initialData = {
        employees: employeesWithDetails,
    };

    return <HRClientComponent initialData={initialData} />;
}

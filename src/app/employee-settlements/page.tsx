
import React from 'react';
import { connectToTenantDb } from '@/db';
import { employees, employeeSettlements, chartOfAccounts } from '@/db/schema';
import { or, like } from 'drizzle-orm';
import EmployeeSettlementsClientComponent from './EmployeeSettlementsClientComponent';


export default async function EmployeeSettlementsPage() {
    const tenantId = 'T001'; // In a real app, this comes from the user session
    const { db } = await connectToTenantDb(tenantId);
    try {
        const employeesData = await db.select().from(employees);
        const settlementsData = await db.select().from(employeeSettlements);
        
        // Fetch accounts that can be used for settlements (e.g., employee advances, other receivables/payables)
        // This is a sample filter, you should adjust it to your Chart of Accounts logic.
        const settlementAccountsData = await db.select().from(chartOfAccounts).where(
            or(
                like(chartOfAccounts.id, '12%'), // Employee Advances, Other Receivables
                like(chartOfAccounts.id, '21%'), // Other Payables
                like(chartOfAccounts.id, '5%')   // Expense accounts for bonuses/deductions
            )
        );

        const initialData = {
            employees: employeesData,
            settlements: settlementsData.map(s => ({
                ...s,
                date: new Date(s.date),
                amount: parseFloat(s.amount),
            })),
            settlementAccounts: settlementAccountsData,
        };

        return <EmployeeSettlementsClientComponent initialData={initialData} />;

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Database query failed for Employee Settlements page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة تسويات الموظفين</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات. قد تكون جداول تسويات الموظفين (`employee_settlements`, etc.) غير موجودة.
                </p>
                 <p className="mb-2">
                    يرجى التأكد من تنفيذ محتوى ملف <code className="font-mono bg-muted p-1 rounded-md">db_schema.sql</code> في محرر SQL بقاعدة بيانات Supabase الخاصة بك.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

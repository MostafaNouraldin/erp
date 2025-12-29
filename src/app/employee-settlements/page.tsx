
import React from 'react';
import { db } from '@/db';
import { employees, employeeSettlements, chartOfAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import EmployeeSettlementsClientComponent from './EmployeeSettlementsClientComponent';


export default async function EmployeeSettlementsPage() {
    const employeesData = await db.select().from(employees);
    const settlementsData = await db.select().from(employeeSettlements);
    const settlementAccountsData = await db.select().from(chartOfAccounts).where(
        // Example: filter for asset and expense accounts suitable for settlements
        // This logic should be refined based on a proper chart of accounts structure
        z.or(
            eq(chartOfAccounts.type, 'تحليلي'),
            // You might have specific parent accounts for these
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
}

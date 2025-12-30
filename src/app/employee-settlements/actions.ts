
'use server';

import { connectToTenantDb } from '@/db';
import { employeeSettlements, employees, chartOfAccounts, journalEntries, journalEntryLines } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settlementSchema = z.object({
  id: z.string().optional(),
  date: z.date(),
  employeeId: z.string().min(1),
  settlementType: z.enum(["سلفة", "قرض", "تسوية عهدة", "خصم", "مكافأة"]),
  accountId: z.string().min(1),
  amount: z.number().min(0.01),
  description: z.string().min(1),
  paymentMethod: z.enum(["نقدي", "راتب", "تحويل بنكي"]),
  status: z.enum(["مسودة", "معتمدة", "مسددة جزئياً", "مسددة بالكامل", "ملغاة"]),
  reference: z.string().optional(),
});

export type Settlement = z.infer<typeof settlementSchema>;
export type Employee = typeof employees.$inferSelect;
export type SettlementAccount = typeof chartOfAccounts.$inferSelect;

async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


export async function addSettlement(values: Settlement) {
    const db = await getDb();
    const newSettlementId = `ESET${Date.now()}`;
    await db.insert(employeeSettlements).values({
        ...values,
        id: newSettlementId,
        amount: String(values.amount),
    });
    revalidatePath('/employee-settlements');
}

export async function updateSettlement(values: Settlement) {
    const db = await getDb();
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(employeeSettlements).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(employeeSettlements.id, values.id));
    revalidatePath('/employee-settlements');
}

export async function deleteSettlement(id: string) {
    const db = await getDb();
    const settlement = await db.query.employeeSettlements.findFirst({ where: eq(employeeSettlements.id, id) });
    if (settlement && settlement.status !== "مسودة") {
        throw new Error("لا يمكن حذف تسوية ليست في حالة مسودة.");
    }
    await db.delete(employeeSettlements).where(eq(employeeSettlements.id, id));
    revalidatePath('/employee-settlements');
}

export async function updateSettlementStatus(id: string, status: Settlement['status']) {
    const db = await getDb();
    const settlement = await db.query.employeeSettlements.findFirst({ where: eq(employeeSettlements.id, id) });
     if (status === 'ملغاة' && settlement && (settlement.status !== "مسودة" && settlement.status !== "معتمدة")) {
        throw new Error("لا يمكن إلغاء هذه التسوية لأنها ليست في حالة مسودة أو معتمدة.");
    }
    await db.update(employeeSettlements).set({ status }).where(eq(employeeSettlements.id, id));
    revalidatePath('/employee-settlements');
}

export async function postSettlementToGL(settlement: Settlement) {
    const db = await getDb();
    if (settlement.status !== "معتمدة") {
        throw new Error("لا يمكن ترحيل تسوية ليست في حالة 'معتمدة'.");
    }

    // Check if a journal entry already exists for this settlement
    const existingEntry = await db.query.journalEntries.findFirst({
        where: eq(journalEntries.sourceDocumentId, settlement.id!),
    });
    if (existingEntry) {
        throw new Error("تم ترحيل هذه التسوية مسبقاً.");
    }

    const employee = await db.query.employees.findFirst({ where: eq(employees.id, settlement.employeeId) });
    const employeeName = employee?.name || "غير محدد";
    const amount = settlement.amount;

    let journalLines: Array<{accountId: string, debit: string, credit: string, description: string}> = [];
    const defaultCashAccount = '1011'; // خزينة
    const defaultBankAccount = '1012'; // بنك
    const defaultSalaryPayableAccount = '2100'; // رواتب مستحقة
    const stringAmount = String(amount);

    if (settlement.settlementType === "سلفة" || settlement.settlementType === "قرض") {
        journalLines.push({ accountId: settlement.accountId, debit: stringAmount, credit: '0', description: `إثبات ${settlement.settlementType} للموظف ${employeeName}` });
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: '0', credit: stringAmount, description: `إضافة قيمة ${settlement.settlementType} لراتب ${employeeName} (سيتم خصمها لاحقاً)` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: '0', credit: stringAmount, description: `دفع ${settlement.settlementType} نقداً لـ ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: '0', credit: stringAmount, description: `دفع ${settlement.settlementType} بنكياً لـ ${employeeName}` });
    } else if (settlement.settlementType === "مكافأة") {
        journalLines.push({ accountId: settlement.accountId, debit: stringAmount, credit: '0', description: `إثبات مصروف مكافأة للموظف ${employeeName}` });
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: '0', credit: stringAmount, description: `إضافة مكافأة لراتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: '0', credit: stringAmount, description: `دفع مكافأة نقداً لـ ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: '0', credit: stringAmount, description: `دفع مكافأة بنكية لـ ${employeeName}` });
    } else if (settlement.settlementType === "خصم" || settlement.settlementType === "تسوية عهدة") {
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: stringAmount, credit: '0', description: `تحصيل/خصم من راتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: stringAmount, credit: '0', description: `تحصيل/استلام نقداً من ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: stringAmount, credit: '0', description: `تحصيل/استلام بنكي من ${employeeName}` });
        
        journalLines.push({ accountId: settlement.accountId, debit: '0', credit: stringAmount, description: `تسوية ${settlement.settlementType} للموظف ${employeeName}` });
    }

    if (journalLines.length < 2) {
        throw new Error("لم يتمكن النظام من إنشاء قيد محاسبي لهذه التسوية.");
    }
    
    const totalDebit = journalLines.reduce((sum, line) => sum + parseFloat(line.debit), 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + parseFloat(line.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
         throw new Error("القيد المحاسبي غير متوازن.");
    }

    const newEntryId = `JV-ESET-${settlement.id}`;

    await db.transaction(async (tx) => {
        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: settlement.date,
            description: `ترحيل ${settlement.settlementType}: ${settlement.description} (الموظف: ${employeeName})`,
            totalAmount: stringAmount,
            status: "مرحل", // Auto-posted
            sourceModule: "EmployeeSettlements",
            sourceDocumentId: settlement.id
        });

        await tx.insert(journalEntryLines).values(journalLines.map(line => ({
            journalEntryId: newEntryId,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
        })));
    });

    revalidatePath('/general-ledger');
    revalidatePath('/employee-settlements');
}

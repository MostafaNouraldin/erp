
'use server';

import { db } from '@/db';
import { employeeSettlements, employees, chartOfAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addJournalEntry } from '@/app/general-ledger/actions';

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


export async function addSettlement(values: Settlement) {
    const newSettlementId = `ESET${Date.now()}`;
    await db.insert(employeeSettlements).values({
        ...values,
        id: newSettlementId,
        amount: String(values.amount),
    });
    revalidatePath('/employee-settlements');
}

export async function updateSettlement(values: Settlement) {
    if (!values.id) throw new Error("ID is required for update.");
    await db.update(employeeSettlements).set({
        ...values,
        amount: String(values.amount),
    }).where(eq(employeeSettlements.id, values.id));
    revalidatePath('/employee-settlements');
}

export async function deleteSettlement(id: string) {
    const settlement = await db.query.employeeSettlements.findFirst({ where: eq(employeeSettlements.id, id) });
    if (settlement && settlement.status !== "مسودة") {
        throw new Error("لا يمكن حذف تسوية ليست في حالة مسودة.");
    }
    await db.delete(employeeSettlements).where(eq(employeeSettlements.id, id));
    revalidatePath('/employee-settlements');
}

export async function updateSettlementStatus(id: string, status: Settlement['status']) {
    const settlement = await db.query.employeeSettlements.findFirst({ where: eq(employeeSettlements.id, id) });
     if (status === 'ملغاة' && settlement && (settlement.status !== "مسودة" && settlement.status !== "معتمدة")) {
        throw new Error("لا يمكن إلغاء هذه التسوية لأنها ليست في حالة مسودة أو معتمدة.");
    }
    await db.update(employeeSettlements).set({ status }).where(eq(employeeSettlements.id, id));
    revalidatePath('/employee-settlements');
}

export async function postSettlementToGL(settlement: Settlement) {
    if (settlement.status !== "معتمدة") {
        throw new Error("لا يمكن ترحيل تسوية ليست في حالة 'معتمدة'.");
    }

    const employee = await db.query.employees.findFirst({ where: eq(employees.id, settlement.employeeId) });
    const employeeName = employee?.name || "غير محدد";
    const amount = settlement.amount;

    let journalLines: Array<{accountId: string, debit: number, credit: number, description: string}> = [];
    const defaultCashAccount = '1011'; // خزينة
    const defaultBankAccount = '1012'; // بنك
    const defaultSalaryPayableAccount = '2100'; // رواتب مستحقة

    if (settlement.settlementType === "سلفة") {
        journalLines.push({ accountId: settlement.accountId, debit: amount, credit: 0, description: `إثبات سلفة لـ ${employeeName}` });
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: 0, credit: amount, description: `خصم سلفة من راتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: 0, credit: amount, description: `دفع سلفة نقداً لـ ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: 0, credit: amount, description: `دفع سلفة بنكية لـ ${employeeName}` });
    } else if (settlement.settlementType === "مكافأة") {
        journalLines.push({ accountId: settlement.accountId, debit: amount, credit: 0, description: `إثبات مصروف مكافأة لـ ${employeeName}` });
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: 0, credit: amount, description: `إضافة مكافأة لراتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: 0, credit: amount, description: `دفع مكافأة نقداً لـ ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: 0, credit: amount, description: `دفع مكافأة بنكية لـ ${employeeName}` });
    } else if (settlement.settlementType === "خصم") {
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: amount, credit: 0, description: `تحصيل خصم من راتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: amount, credit: 0, description: `تحصيل خصم نقداً من ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: amount, credit: 0, description: `تحصيل خصم بنكي من ${employeeName}` });
        journalLines.push({ accountId: settlement.accountId, debit: 0, credit: amount, description: `تسوية خصم لـ ${employeeName}` });
    } else if (settlement.settlementType === "تسوية عهدة") {
        if (settlement.paymentMethod === "راتب") journalLines.push({ accountId: defaultSalaryPayableAccount, debit: amount, credit: 0, description: `تسوية عهدة من راتب ${employeeName}` });
        else if (settlement.paymentMethod === "نقدي") journalLines.push({ accountId: defaultCashAccount, debit: amount, credit: 0, description: `إرجاع عهدة نقداً من ${employeeName}` });
        else journalLines.push({ accountId: defaultBankAccount, debit: amount, credit: 0, description: `إرجاع عهدة بنكية من ${employeeName}` });
        journalLines.push({ accountId: settlement.accountId, debit: 0, credit: amount, description: `إغلاق/تخفيض رصيد عهدة ${employeeName}` });
    }

    if (journalLines.length < 2) {
        throw new Error("لم يتمكن النظام من إنشاء قيد محاسبي لهذه التسوية.");
    }
    
    // Debit and credit should balance
    const totalDebit = journalLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = journalLines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
         throw new Error("القيد المحاسبي غير متوازن.");
    }


    await addJournalEntry({
        date: settlement.date,
        description: `ترحيل ${settlement.settlementType}: ${settlement.description} (الموظف: ${employeeName})`,
        lines: journalLines,
        totalAmount: settlement.amount,
        status: "مرحل",
        sourceModule: "EmployeeSettlements",
        sourceDocumentId: settlement.id
    });
}

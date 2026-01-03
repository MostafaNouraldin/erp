

'use server';

import { connectToTenantDb } from '@/db';
import { bankExpenses, journalEntries, journalEntryLines, salesInvoices, salesInvoiceItems, supplierInvoices, supplierInvoiceItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Duplicated from sales/actions for logical separation
const salesInvoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(z.object({
    itemId: z.string().min(1, "الصنف مطلوب"),
    description: z.string().optional(),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
    total: z.coerce.number(),
  })).min(1, "يجب إضافة صنف واحد على الأقل"),
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
  isDeferredPayment: z.boolean().default(false),
  numericTotalAmount: z.number().optional(), 
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
});
type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>;


// Duplicated from purchases/actions for logical separation
const supplierInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});
const supplierInvoiceSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  invoiceDate: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(supplierInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  totalAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  status: z.enum(["غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"]).default("غير مدفوع"),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;


async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


// --- Sales Invoice Actions (from sales/actions) ---
export async function addSalesInvoice(invoiceData: SalesInvoiceFormValues) {
  const db = await getDb();
  const newInvoiceId = `INV-C${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(salesInvoices).values({
      id: newInvoiceId,
      ...invoiceData,
      numericTotalAmount: String(invoiceData.numericTotalAmount),
    });
    if (invoiceData.items.length > 0) {
      await tx.insert(salesInvoiceItems).values(
        invoiceData.items.map(item => ({
          invoiceId: newInvoiceId,
          itemId: item.itemId,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/sales');
}

export async function updateSalesInvoice(invoiceData: SalesInvoiceFormValues) {
    const db = await getDb();
    if (!invoiceData.id) throw new Error("ID required");
    await db.transaction(async (tx) => {
        await tx.update(salesInvoices).set({
            ...invoiceData,
            numericTotalAmount: String(invoiceData.numericTotalAmount),
        }).where(eq(salesInvoices.id, invoiceData.id));
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceData.id));
        if (invoiceData.items.length > 0) {
            await tx.insert(salesInvoiceItems).values(invoiceData.items.map(item => ({
                invoiceId: invoiceData.id!,
                itemId: item.itemId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: String(item.unitPrice),
                total: String(item.total),
            })));
        }
    });
    revalidatePath('/accounts-payable-receivable');
    revalidatePath('/sales');
}


export async function deleteSalesInvoice(invoiceId: string) {
    const db = await getDb();
    await db.transaction(async (tx) => {
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceId));
        await tx.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
    });
    revalidatePath('/accounts-payable-receivable');
    revalidatePath('/sales');
}

// --- Supplier Invoice Actions (from purchases/actions) ---
export async function addSupplierInvoice(invoiceData: SupplierInvoiceFormValues) {
  const db = await getDb();
  const newInvoiceId = `INV-S${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(supplierInvoices).values({
      id: newInvoiceId,
      poId: '', // PO ID is optional in this context
      supplierId: invoiceData.supplierId,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      totalAmount: String(invoiceData.totalAmount),
      paidAmount: String(invoiceData.paidAmount || 0),
      status: invoiceData.status,
    });

    if (invoiceData.items.length > 0) {
      await tx.insert(supplierInvoiceItems).values(
        invoiceData.items.map(item => ({
          invoiceId: newInvoiceId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/purchases');
}

export async function updateSupplierInvoice(invoiceData: SupplierInvoiceFormValues) {
  const db = await getDb();
  if (!invoiceData.id) {
    throw new Error("Supplier Invoice ID is required for updating.");
  }
  await db.transaction(async (tx) => {
    await tx.update(supplierInvoices).set({
      supplierId: invoiceData.supplierId,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      totalAmount: String(invoiceData.totalAmount),
      paidAmount: String(invoiceData.paidAmount || 0),
      status: invoiceData.status,
    }).where(eq(supplierInvoices.id, invoiceData.id));

    await tx.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, invoiceData.id));

    if (invoiceData.items.length > 0) {
      await tx.insert(supplierInvoiceItems).values(
        invoiceData.items.map(item => ({
          invoiceId: invoiceData.id!,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/purchases');
}

export async function deleteSupplierInvoice(invoiceId: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, invoiceId));
    await tx.delete(supplierInvoices).where(eq(supplierInvoices.id, invoiceId));
  });
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/purchases');
}

export async function updateSupplierInvoicePayment(
  invoiceId: string,
  newPaidAmount: number,
  newStatus: 'مدفوع' | 'مدفوع جزئياً'
) {
  const db = await getDb();
  await db.update(supplierInvoices)
    .set({
      paidAmount: String(newPaidAmount),
      status: newStatus,
    })
    .where(eq(supplierInvoices.id, invoiceId));
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/purchases');
}

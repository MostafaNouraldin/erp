

'use server';

import { connectToTenantDb } from '@/db';
import { bankExpenses, journalEntries, journalEntryLines, salesInvoices, salesInvoiceItems, supplierInvoices, supplierInvoiceItems, companySettings, customers, products, inventoryMovementLog } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const salesInvoiceItemSchema = z.object({
    itemId: z.string().min(1, "الصنف مطلوب"),
    description: z.string().optional(),
    quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
    total: z.coerce.number(),
});
const salesInvoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(salesInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر", "مدفوع جزئياً"]).default("غير مدفوع"),
  isDeferredPayment: z.boolean().default(false),
  numericTotalAmount: z.number().optional(), 
  paidAmount: z.coerce.number().optional(),
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
  discountType: z.enum(['amount', 'percentage']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
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

// Helper to get dynamic settings
async function getCompanySettings(db: any) {
    const settingsResult = await db.query.companySettings.findFirst({
        where: eq(companySettings.id, 'T001'), // Assuming single tenant for now
    });
    return (settingsResult?.settings as any) || {};
}


// --- Sales Invoice Actions (from sales/actions) ---
export async function addSalesInvoice(invoiceData: SalesInvoiceFormValues) {
  const db = await getDb();
  const settings = await getCompanySettings(db);
  const newInvoiceId = `INV-C${Date.now()}`;

  const VAT_RATE = (settings.vatRate ?? 15) / 100;
  const accountsReceivableAccount = "1200";
  const salesRevenueAccount = "4000";
  const vatPayableAccount = "2200";
  const salesDiscountAccount = "4200";

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
  let discountAmount = 0;
  if(invoiceData.discountType === 'percentage' && invoiceData.discountValue) {
    discountAmount = subtotal * (invoiceData.discountValue / 100);
  } else if (invoiceData.discountValue) {
    discountAmount = invoiceData.discountValue;
  }

  const totalAfterDiscount = subtotal - discountAmount;
  const vatAmount = totalAfterDiscount * VAT_RATE;
  const finalTotal = totalAfterDiscount + vatAmount;

  await db.transaction(async (tx) => {
    for (const item of invoiceData.items) {
      const product = await tx.query.products.findFirst({ where: eq(products.id, item.itemId), columns: { quantity: true, name: true } });
      if (!product || product.quantity < item.quantity) {
        throw new Error(`الكمية غير كافية للمنتج: ${product?.name || item.itemId}. الكمية المتاحة: ${product?.quantity || 0}`);
      }
    }
    
    await tx.insert(salesInvoices).values({
      id: newInvoiceId, ...invoiceData,
      numericTotalAmount: String(finalTotal),
      paidAmount: String(invoiceData.paidAmount || 0),
      discountType: invoiceData.discountType || 'amount',
      discountValue: String(invoiceData.discountValue || 0),
    });

    if (invoiceData.items.length > 0) {
      await tx.insert(salesInvoiceItems).values(invoiceData.items.map(item => ({ invoiceId: newInvoiceId, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
      for (const item of invoiceData.items) {
          await tx.update(products).set({ quantity: sql`${products.quantity} - ${item.quantity}` }).where(eq(products.id, item.itemId));
          await tx.insert(inventoryMovementLog).values({ productId: item.itemId, quantity: item.quantity, type: 'OUT', sourceType: 'فاتورة مبيعات', sourceId: newInvoiceId });
      }
    }

    if (invoiceData.source !== 'POS') {
        const newEntryId = `JV-SI-${newInvoiceId}`;
        const customer = await tx.query.customers.findFirst({ where: eq(customers.id, invoiceData.customerId) });
        let journalLines = [
            { journalEntryId: newEntryId, accountId: accountsReceivableAccount, debit: String(finalTotal), credit: '0', description: `فاتورة للعميل ${customer?.name}` },
            { journalEntryId: newEntryId, accountId: salesRevenueAccount, debit: '0', credit: String(subtotal), description: `إيراد من فاتورة ${newInvoiceId}` },
            { journalEntryId: newEntryId, accountId: vatPayableAccount, debit: '0', credit: String(vatAmount), description: `ضريبة القيمة المضافة لفاتورة ${newInvoiceId}` },
        ];
        if (discountAmount > 0) {
            journalLines.push({ journalEntryId: newEntryId, accountId: salesDiscountAccount, debit: String(discountAmount), credit: '0', description: `خصم على فاتورة ${newInvoiceId}` });
        }
        journalLines = journalLines.filter(line => parseFloat(line.debit) > 0 || parseFloat(line.credit) > 0);
        await tx.insert(journalEntries).values({ id: newEntryId, date: invoiceData.date, description: `فاتورة مبيعات رقم ${newInvoiceId} للعميل ${customer?.name || invoiceData.customerId}`, totalAmount: String(finalTotal), status: "مرحل", sourceModule: "SalesInvoice", sourceDocumentId: newInvoiceId });
        await tx.insert(journalEntryLines).values(journalLines);
    }
  });

  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/sales');
  revalidatePath('/inventory');
  revalidatePath('/general-ledger');
}

export async function updateSalesInvoice(invoiceData: SalesInvoiceFormValues) {
    const db = await getDb();
    if (!invoiceData.id) throw new Error("ID required");

    const subtotal = invoiceData.items.reduce((sum, item) => sum + item.total, 0);
    let finalTotal = subtotal;
    if (invoiceData.discountType === 'percentage' && invoiceData.discountValue) {
        finalTotal = subtotal - (subtotal * (invoiceData.discountValue / 100));
    } else if (invoiceData.discountValue) {
        finalTotal = subtotal - invoiceData.discountValue;
    }
    
    await db.transaction(async (tx) => {
        await tx.update(salesInvoices).set({
            ...invoiceData,
            numericTotalAmount: String(finalTotal),
            paidAmount: String(invoiceData.paidAmount || 0),
            discountType: invoiceData.discountType || 'amount',
            discountValue: String(invoiceData.discountValue || 0),
        }).where(eq(salesInvoices.id, invoiceData.id));
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceData.id));
        if (invoiceData.items.length > 0) {
            await tx.insert(salesInvoiceItems).values(invoiceData.items.map(item => ({ invoiceId: invoiceData.id!, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
        }
    });
    revalidatePath('/accounts-payable-receivable');
    revalidatePath('/sales');
}

export async function updateCustomerInvoicePayment(
  invoiceId: string,
  newPaidAmount: number,
  newStatus: 'مدفوع' | 'مدفوع جزئياً'
) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const invoice = await tx.query.salesInvoices.findFirst({ where: eq(salesInvoices.id, invoiceId) });
    if (!invoice) throw new Error("Invoice not found.");

    const paymentAmount = newPaidAmount - parseFloat(invoice.paidAmount ?? '0');

    await tx.update(salesInvoices)
      .set({
        paidAmount: String(newPaidAmount),
        status: newStatus,
      })
      .where(eq(salesInvoices.id, invoiceId));

    if (paymentAmount > 0) {
        const newEntryId = `JV-PAY-C-${invoiceId}`;
        const accountsReceivableAccount = "1200"; // حساب الذمم المدينة
        const cashAccount = "1011"; // حساب النقدية

        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: new Date(),
            description: `سداد فاتورة عميل رقم ${invoiceId}`,
            totalAmount: String(paymentAmount),
            status: "مرحل",
            sourceModule: "CustomerPayment",
            sourceDocumentId: invoiceId,
        });

        await tx.insert(journalEntryLines).values([
            { journalEntryId: newEntryId, accountId: cashAccount, debit: String(paymentAmount), credit: '0', description: `تحصيل نقدي لفاتورة ${invoiceId}` },
            { journalEntryId: newEntryId, accountId: accountsReceivableAccount, debit: '0', credit: String(paymentAmount), description: `تخفيض رصيد العميل لفاتورة ${invoiceId}` },
        ]);
    }
  });

  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/sales');
  revalidatePath('/general-ledger');
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
  
  await db.transaction(async (tx) => {
    const invoice = await tx.query.supplierInvoices.findFirst({ where: eq(supplierInvoices.id, invoiceId) });
    if (!invoice) throw new Error("Invoice not found.");
    
    const paymentAmount = newPaidAmount - parseFloat(invoice.paidAmount);

    await tx.update(supplierInvoices)
      .set({
        paidAmount: String(newPaidAmount),
        status: newStatus,
      })
      .where(eq(supplierInvoices.id, invoiceId));

    if (paymentAmount > 0) {
        const newEntryId = `JV-PAY-S-${invoiceId}`;
        const accountsPayableAccount = "2010"; // حساب الذمم الدائنة
        const cashAccount = "1011"; // حساب النقدية

        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: new Date(),
            description: `سداد فاتورة مورد رقم ${invoiceId}`,
            totalAmount: String(paymentAmount),
            status: "مرحل",
            sourceModule: "SupplierPayment",
            sourceDocumentId: invoiceId,
        });

        await tx.insert(journalEntryLines).values([
            { journalEntryId: newEntryId, accountId: accountsPayableAccount, debit: String(paymentAmount), credit: '0', description: `تخفيض رصيد المورد لفاتورة ${invoiceId}` },
            { journalEntryId: newEntryId, accountId: cashAccount, debit: '0', credit: String(paymentAmount), description: `دفع نقدي لفاتورة ${invoiceId}` },
        ]);
    }
  });

  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/purchases');
  revalidatePath('/general-ledger');
}

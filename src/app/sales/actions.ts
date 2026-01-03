

// src/app/sales/actions.ts
'use server';

import { connectToTenantDb } from '@/db';
import { customers, salesInvoices, salesInvoiceItems, quotations, quotationItems, salesOrders, salesOrderItems, products, journalEntries, journalEntryLines, salesReturns, salesReturnItems, sql, inventoryMovementLog } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم العميل مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  balance: z.coerce.number().default(0),
});
type CustomerFormValues = z.infer<typeof customerSchema>;

const invoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(invoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مدفوع", "غير مدفوع", "متأخر"]).default("غير مدفوع"),
  orderId: z.string().optional(),
  isDeferredPayment: z.boolean().optional().default(false),
  source: z.enum(["POS", "Manual"]).optional().default("Manual"),
});
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const quotationItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const quotationSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ العرض مطلوب" }),
  expiryDate: z.date({ required_error: "تاريخ انتهاء العرض مطلوب" }),
  items: z.array(quotationItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "مرسل", "مقبول", "مرفوض", "منتهي الصلاحية"]).default("مسودة"),
});
type QuotationFormValues = z.infer<typeof quotationSchema>;

const salesOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const salesOrderSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  date: z.date({ required_error: "تاريخ الأمر مطلوب" }),
  deliveryDate: z.date({ required_error: "تاريخ التسليم المتوقع مطلوب" }),
  items: z.array(salesOrderItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مؤكد", "قيد التنفيذ", "ملغي", "مكتمل"]).default("مؤكد"),
  quoteId: z.string().optional(),
});
type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

const salesReturnItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
  reason: z.string().optional(),
});

const salesReturnSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "العميل مطلوب"),
  invoiceId: z.string().optional(),
  date: z.date({ required_error: "تاريخ المرتجع مطلوب" }),
  items: z.array(salesReturnItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  numericTotalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "ملغي"]).default("مسودة"),
});
type SalesReturnFormValues = z.infer<typeof salesReturnSchema>;


async function getDb() {
  const tenantId = 'T001';
  const { db } = await connectToTenantDb(tenantId);
  return db;
}


export async function addSalesInvoice(invoiceData: InvoiceFormValues) {
  const db = await getDb();
  const newInvoiceId = `INV-C${Date.now()}`;
  const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);

  // Constants for accounting
  const VAT_RATE = 0.15;
  const accountsReceivableAccount = "1200";
  const salesRevenueAccount = "4000";
  const vatPayableAccount = "2200";

  const totalBeforeTax = totalAmount / (1 + VAT_RATE);
  const vatAmount = totalAmount - totalBeforeTax;

  await db.transaction(async (tx) => {
    // 1. Check stock availability
    for (const item of invoiceData.items) {
      const product = await tx.query.products.findFirst({
        where: eq(products.id, item.itemId),
        columns: { quantity: true, name: true },
      });
      if (!product || product.quantity < item.quantity) {
        throw new Error(`الكمية غير كافية للمنتج: ${product?.name || item.itemId}. الكمية المتاحة: ${product?.quantity || 0}`);
      }
    }
    
    // 2. Insert sales invoice
    await tx.insert(salesInvoices).values({
      id: newInvoiceId,
      ...invoiceData,
      numericTotalAmount: String(totalAmount),
    });

    // 3. Insert sales invoice items
    if (invoiceData.items.length > 0) {
      await tx.insert(salesInvoiceItems).values(
        invoiceData.items.map(item => ({
          invoiceId: newInvoiceId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
      // 4. Update inventory and log movement
      for (const item of invoiceData.items) {
          await tx.update(products)
              .set({ quantity: sql`${products.quantity} - ${item.quantity}` })
              .where(eq(products.id, item.itemId));
          await tx.insert(inventoryMovementLog).values({
              productId: item.itemId,
              quantity: item.quantity,
              type: 'OUT',
              sourceType: 'فاتورة مبيعات',
              sourceId: newInvoiceId,
          });
      }
    }

    // 5. Create Journal Entry if not from POS (POS settles in batch)
    if (invoiceData.source !== 'POS') {
        const newEntryId = `JV-SI-${newInvoiceId}`;
        const customer = await tx.query.customers.findFirst({ where: eq(customers.id, invoiceData.customerId) });
        
        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: invoiceData.date,
            description: `فاتورة مبيعات رقم ${newInvoiceId} للعميل ${customer?.name || invoiceData.customerId}`,
            totalAmount: String(totalAmount),
            status: "مرحل", // Sales invoices are posted immediately
            sourceModule: "SalesInvoice",
            sourceDocumentId: newInvoiceId,
        });

        await tx.insert(journalEntryLines).values([
            // Debit Accounts Receivable for the full amount
            { journalEntryId: newEntryId, accountId: accountsReceivableAccount, debit: String(totalAmount), credit: '0', description: `فاتورة للعميل ${customer?.name}` },
            // Credit Sales Revenue for the amount before tax
            { journalEntryId: newEntryId, accountId: salesRevenueAccount, debit: '0', credit: String(totalBeforeTax), description: `إيراد من فاتورة ${newInvoiceId}` },
            // Credit VAT Payable for the VAT amount
            { journalEntryId: newEntryId, accountId: vatPayableAccount, debit: '0', credit: String(vatAmount), description: `ضريبة القيمة المضافة لفاتورة ${newInvoiceId}` },
        ]);
    }

  });

  revalidatePath('/sales');
  revalidatePath('/pos');
  revalidatePath('/accounts-payable-receivable');
  revalidatePath('/inventory');
  revalidatePath('/general-ledger');
}

export async function updateSalesInvoice(invoiceData: InvoiceFormValues) {
  const db = await getDb();
  if (!invoiceData.id) {
    throw new Error("Invoice ID is required for updating.");
  }
  // In a real app, you'd handle reversing old stock changes and applying new ones.
  // This simplified version doesn't handle stock updates on edit.
  const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);

  await db.transaction(async (tx) => {
    await tx.update(salesInvoices)
      .set({
        ...invoiceData,
        numericTotalAmount: String(totalAmount),
      })
      .where(eq(salesInvoices.id, invoiceData.id!));

    // Delete existing items and insert new ones
    await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceData.id!));
    if (invoiceData.items.length > 0) {
      await tx.insert(salesInvoiceItems).values(
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
    // Note: Updating related journal entries is a complex accounting task (reversing and creating new)
    // and is omitted here for simplicity.
  });

  revalidatePath('/sales');
  revalidatePath('/accounts-payable-receivable');
}

export async function deleteSalesInvoice(invoiceId: string) {
    const db = await getDb();
    // Reversing stock changes on delete is complex and often handled by a credit note process in real ERPs.
    // For simplicity, we are just deleting the records here.
    // Also, deleting the related journal entry would be required.
    await db.transaction(async (tx) => {
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceId));
        await tx.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
    });
    revalidatePath('/sales');
    revalidatePath('/accounts-payable-receivable');
}

// Quotation Actions
export async function addQuotation(values: QuotationFormValues) {
  const db = await getDb();
  const newId = `QT${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(quotations).values({ ...values, id: newId, numericTotalAmount: String(values.numericTotalAmount) });
    await tx.insert(quotationItems).values(values.items.map(item => ({ quoteId: newId, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
  });
  revalidatePath('/sales');
}

export async function updateQuotation(values: QuotationFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID required");
  await db.transaction(async (tx) => {
    await tx.update(quotations).set({ ...values, numericTotalAmount: String(values.numericTotalAmount) }).where(eq(quotations.id, values.id!));
    await tx.delete(quotationItems).where(eq(quotationItems.quoteId, values.id!));
    await tx.insert(quotationItems).values(values.items.map(item => ({ quoteId: values.id!, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
  });
  revalidatePath('/sales');
}

export async function deleteQuotation(id: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(quotationItems).where(eq(quotationItems.quoteId, id));
    await tx.delete(quotations).where(eq(quotations.id, id));
  });
  revalidatePath('/sales');
}


// Sales Order Actions
export async function addSalesOrder(values: SalesOrderFormValues) {
  const db = await getDb();
  const newId = `SO${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(salesOrders).values({ ...values, id: newId, numericTotalAmount: String(values.numericTotalAmount) });
    await tx.insert(salesOrderItems).values(values.items.map(item => ({ soId: newId, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
  });
  revalidatePath('/sales');
}

export async function updateSalesOrder(values: SalesOrderFormValues) {
  const db = await getDb();
  if (!values.id) throw new Error("ID required");
  await db.transaction(async (tx) => {
    await tx.update(salesOrders).set({ ...values, numericTotalAmount: String(values.numericTotalAmount) }).where(eq(salesOrders.id, values.id!));
    await tx.delete(salesOrderItems).where(eq(salesOrderItems.soId, values.id!));
    await tx.insert(salesOrderItems).values(values.items.map(item => ({ soId: values.id!, ...item, unitPrice: String(item.unitPrice), total: String(item.total) })));
  });
  revalidatePath('/sales');
}

export async function deleteSalesOrder(id: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(salesOrderItems).where(eq(salesOrderItems.soId, id));
    await tx.delete(salesOrders).where(eq(salesOrders.id, id));
  });
  revalidatePath('/sales');
}

// Sales Return Actions
export async function addSalesReturn(values: SalesReturnFormValues) {
  const db = await getDb();
  const newId = `SR${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(salesReturns).values({ ...values, id: newId, numericTotalAmount: String(values.numericTotalAmount) });
    if (values.items.length > 0) {
      await tx.insert(salesReturnItems).values(
        values.items.map(item => ({
          returnId: newId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
          reason: item.reason,
        }))
      );
    }
  });
  revalidatePath('/sales');
}

export async function approveSalesReturn(returnId: string) {
    const db = await getDb();
    const salesReturn = await db.query.salesReturns.findFirst({
        where: eq(salesReturns.id, returnId),
        with: { items: true },
    });

    if (!salesReturn) throw new Error("لم يتم العثور على مرتجع المبيعات.");
    if (salesReturn.status === 'معتمد') throw new Error("هذا المرتجع معتمد بالفعل.");

    const totalAmount = salesReturn.numericTotalAmount;
    const VAT_RATE = 0.15;
    const totalBeforeTax = totalAmount / (1 + VAT_RATE);
    const vatAmount = totalAmount - totalBeforeTax;

    // Account IDs
    const salesReturnAccount = "4100"; // حساب مردودات المبيعات
    const vatPayableAccount = "2200"; // حساب ضريبة القيمة المضافة
    const accountsReceivableAccount = "1200"; // حساب الذمم المدينة

    await db.transaction(async (tx) => {
        // 1. Update inventory
        for (const item of salesReturn.items) {
            await tx.update(products)
                .set({ quantity: sql`${products.quantity} + ${item.quantity}` })
                .where(eq(products.id, item.itemId));
            await tx.insert(inventoryMovementLog).values({
                productId: item.itemId,
                quantity: item.quantity,
                type: 'IN',
                sourceType: 'مرتجع مبيعات',
                sourceId: returnId,
            });
        }
        
        // 2. Create reversing journal entry
        const newEntryId = `JV-SR-${returnId}`;
        const customer = await tx.query.customers.findFirst({ where: eq(customers.id, salesReturn.customerId) });

        await tx.insert(journalEntries).values({
            id: newEntryId,
            date: salesReturn.date,
            description: `إشعار دائن لمرتجع مبيعات رقم ${returnId} من العميل ${customer?.name || salesReturn.customerId}`,
            totalAmount: String(totalAmount),
            status: "مرحل",
            sourceModule: "SalesReturn",
            sourceDocumentId: returnId,
        });

        await tx.insert(journalEntryLines).values([
            // Debit Sales Returns (a contra-revenue account)
            { journalEntryId: newEntryId, accountId: salesReturnAccount, debit: String(totalBeforeTax), credit: '0', description: `مرتجع مبيعات من ${customer?.name}` },
            // Debit VAT Payable (to reduce liability)
            { journalEntryId: newEntryId, accountId: vatPayableAccount, debit: String(vatAmount), credit: '0', description: `عكس ضريبة القيمة المضافة لمرتجع` },
            // Credit Accounts Receivable (to reduce what the customer owes)
            { journalEntryId: newEntryId, accountId: accountsReceivableAccount, debit: '0', credit: String(totalAmount), description: `تخفيض رصيد العميل ${customer?.name}` },
        ]);

        // 3. Update the sales return status
        await tx.update(salesReturns).set({ status: 'معتمد' }).where(eq(salesReturns.id, returnId));
    });

    revalidatePath('/sales');
    revalidatePath('/inventory');
    revalidatePath('/general-ledger');
}

export async function deleteSalesReturn(id: string) {
    const db = await getDb();
    const salesReturn = await db.query.salesReturns.findFirst({ where: eq(salesReturns.id, id) });
    if (salesReturn?.status === 'معتمد') {
        throw new Error("لا يمكن حذف مرتجع معتمد.");
    }
    await db.transaction(async (tx) => {
        await tx.delete(salesReturnItems).where(eq(salesReturnItems.returnId, id));
        await tx.delete(salesReturns).where(eq(salesReturns.id, id));
    });
    revalidatePath('/sales');
}

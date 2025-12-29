
// src/app/sales/actions.ts
'use server';

import { db } from '@/db';
import { customers, salesInvoices, salesInvoiceItems } from '@/db/schema';
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

export async function addCustomer(customerData: CustomerFormValues) {
  const newCustomer = {
    ...customerData,
    id: `CUST${Date.now()}`,
    balance: String(customerData.balance),
  };
  await db.insert(customers).values(newCustomer);
  revalidatePath('/sales');
}

export async function updateCustomer(customerData: CustomerFormValues) {
    if (!customerData.id) {
        throw new Error("Customer ID is required for updating.");
    }
    const updatedCustomer = {
        ...customerData,
        balance: String(customerData.balance),
    };
  await db.update(customers).set(updatedCustomer).where(eq(customers.id, customerData.id));
  revalidatePath('/sales');
}

export async function deleteCustomer(customerId: string) {
  // In a real app, you might want to check if the customer has invoices before deleting.
  await db.delete(customers).where(eq(customers.id, customerId));
  revalidatePath('/sales');
}


export async function addSalesInvoice(invoiceData: InvoiceFormValues) {
  const newInvoiceId = `INV-C${Date.now()}`;
  const totalAmount = invoiceData.items.reduce((sum, item) => sum + item.total, 0);

  await db.transaction(async (tx) => {
    await tx.insert(salesInvoices).values({
      id: newInvoiceId,
      ...invoiceData,
      numericTotalAmount: String(totalAmount),
    });

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
    }
  });

  revalidatePath('/sales');
}

export async function updateSalesInvoice(invoiceData: InvoiceFormValues) {
  if (!invoiceData.id) {
    throw new Error("Invoice ID is required for updating.");
  }
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
  });

  revalidatePath('/sales');
}

export async function deleteSalesInvoice(invoiceId: string) {
    await db.transaction(async (tx) => {
        // First delete items associated with the invoice due to foreign key constraints
        await tx.delete(salesInvoiceItems).where(eq(salesInvoiceItems.invoiceId, invoiceId));
        // Then delete the invoice itself
        await tx.delete(salesInvoices).where(eq(salesInvoices.id, invoiceId));
    });
    revalidatePath('/sales');
}

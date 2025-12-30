

'use server';

import { db } from '@/db';
import { suppliers, purchaseOrders, purchaseOrderItems, supplierInvoices, supplierInvoiceItems, goodsReceivedNotes, goodsReceivedNoteItems, products, purchaseReturns, purchaseReturnItems } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const supplierSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المورد مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

const purchaseOrderItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});
const purchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  date: z.date({ required_error: "تاريخ الأمر مطلوب" }),
  expectedDeliveryDate: z.date({ required_error: "تاريخ التسليم المتوقع مطلوب" }),
  items: z.array(purchaseOrderItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "مستلم جزئياً", "مستلم بالكامل", "ملغي"]).default("مسودة"),
});
type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;


const supplierInvoiceItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  total: z.coerce.number(),
});

const supplierInvoiceSchema = z.object({
  id: z.string().optional(),
  poId: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  invoiceDate: z.date({ required_error: "تاريخ الفاتورة مطلوب" }),
  dueDate: z.date({ required_error: "تاريخ الاستحقاق مطلوب" }),
  items: z.array(supplierInvoiceItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  totalAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0).optional(),
  status: z.enum(["غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"]).default("غير مدفوع"),
  notes: z.string().optional(),
});
type SupplierInvoiceFormValues = z.infer<typeof supplierInvoiceSchema>;

const goodsReceivedNoteItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  orderedQuantity: z.coerce.number().min(0),
  receivedQuantity: z.coerce.number().min(0),
  notes: z.string().optional(),
});

const goodsReceivedNoteSchema = z.object({
  id: z.string().optional(),
  poId: z.string().min(1, "أمر الشراء مطلوب"),
  supplierId: z.string().min(1, "المورد مطلوب"),
  grnDate: z.date({ required_error: "تاريخ الاستلام مطلوب" }),
  items: z.array(goodsReceivedNoteItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  status: z.enum(["مستلم جزئياً", "مستلم بالكامل"]),
  receivedBy: z.string().optional(),
});

type GoodsReceivedNoteFormValues = z.infer<typeof goodsReceivedNoteSchema>;

const purchaseReturnItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unitPrice: z.coerce.number().min(0, "سعر الوحدة إيجابي"),
  reason: z.string().optional(),
  total: z.coerce.number(),
});

const purchaseReturnSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, "المورد مطلوب"),
  date: z.date({ required_error: "تاريخ المرتجع مطلوب" }),
  originalInvoiceId: z.string().optional(), 
  items: z.array(purchaseReturnItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["مسودة", "معتمد", "معالج", "ملغي"]).default("مسودة"),
});
type PurchaseReturnFormValues = z.infer<typeof purchaseReturnSchema>;


// --- Supplier Actions ---
export async function addSupplier(supplierData: SupplierFormValues) {
  const newSupplier = {
    ...supplierData,
    id: `SUP${Date.now()}`,
  };
  await db.insert(suppliers).values(newSupplier);
  revalidatePath('/purchases');
}

export async function updateSupplier(supplierData: SupplierFormValues) {
  if (!supplierData.id) {
    throw new Error("Supplier ID is required for updating.");
  }
  await db.update(suppliers).set(supplierData).where(eq(suppliers.id, supplierData.id));
  revalidatePath('/purchases');
}

export async function deleteSupplier(supplierId: string) {
  // You might want to add a check here to ensure the supplier isn't linked to any purchase orders.
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));
  revalidatePath('/purchases');
}


// --- Purchase Order Actions ---
export async function addPurchaseOrder(poData: PurchaseOrderFormValues) {
  const newPoId = `PO${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(purchaseOrders).values({
      id: newPoId,
      supplierId: poData.supplierId,
      date: poData.date,
      expectedDeliveryDate: poData.expectedDeliveryDate,
      notes: poData.notes,
      totalAmount: String(poData.totalAmount),
      status: poData.status,
    });
    if (poData.items.length > 0) {
      await tx.insert(purchaseOrderItems).values(
        poData.items.map(item => ({
          poId: newPoId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/purchases');
}

export async function updatePurchaseOrder(poData: PurchaseOrderFormValues) {
    if (!poData.id) {
        throw new Error("PO ID is required for updating.");
    }
    await db.transaction(async (tx) => {
        await tx.update(purchaseOrders).set({
            supplierId: poData.supplierId,
            date: poData.date,
            expectedDeliveryDate: poData.expectedDeliveryDate,
            notes: poData.notes,
            totalAmount: String(poData.totalAmount),
            status: poData.status,
        }).where(eq(purchaseOrders.id, poData.id!));

        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poData.id!));

        if (poData.items.length > 0) {
            await tx.insert(purchaseOrderItems).values(
                poData.items.map(item => ({
                    poId: poData.id!,
                    itemId: item.itemId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: String(item.unitPrice),
                    total: String(item.total),
                }))
            );
        }
    });
    revalidatePath('/purchases');
}

export async function deletePurchaseOrder(poId: string) {
    await db.transaction(async (tx) => {
        await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId));
        await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, poId));
    });
    revalidatePath('/purchases');
}

export async function updatePurchaseOrderStatus(poId: string, status: PurchaseOrderFormValues['status']) {
    await db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, poId));
    revalidatePath('/purchases');
}


// --- Supplier Invoice Actions ---
export async function addSupplierInvoice(invoiceData: SupplierInvoiceFormValues) {
  const newInvoiceId = `INV-S${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(supplierInvoices).values({
      id: newInvoiceId,
      poId: invoiceData.poId,
      supplierId: invoiceData.supplierId,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      totalAmount: String(invoiceData.totalAmount),
      paidAmount: String(invoiceData.paidAmount || 0),
      status: invoiceData.status,
      notes: invoiceData.notes,
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
  revalidatePath('/purchases');
  revalidatePath('/accounts-payable-receivable');
}

export async function updateSupplierInvoice(invoiceData: SupplierInvoiceFormValues) {
  if (!invoiceData.id) {
    throw new Error("Supplier Invoice ID is required for updating.");
  }
  await db.transaction(async (tx) => {
    await tx.update(supplierInvoices).set({
      poId: invoiceData.poId,
      supplierId: invoiceData.supplierId,
      invoiceDate: invoiceData.invoiceDate,
      dueDate: invoiceData.dueDate,
      totalAmount: String(invoiceData.totalAmount),
      paidAmount: String(invoiceData.paidAmount || 0),
      status: invoiceData.status,
      notes: invoiceData.notes,
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
  revalidatePath('/purchases');
  revalidatePath('/accounts-payable-receivable');
}

export async function deleteSupplierInvoice(invoiceId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, invoiceId));
    await tx.delete(supplierInvoices).where(eq(supplierInvoices.id, invoiceId));
  });
  revalidatePath('/purchases');
  revalidatePath('/accounts-payable-receivable');
}

export async function updateSupplierInvoicePayment(
  invoiceId: string,
  newPaidAmount: number,
  newStatus: 'مدفوع' | 'مدفوع جزئياً'
) {
  await db.update(supplierInvoices)
    .set({
      paidAmount: String(newPaidAmount),
      status: newStatus,
    })
    .where(eq(supplierInvoices.id, invoiceId));
  revalidatePath('/purchases');
  revalidatePath('/accounts-payable-receivable');
}

// --- Goods Received Note (GRN) Actions ---
export async function addGoodsReceivedNote(grnData: GoodsReceivedNoteFormValues) {
    const newGrnId = `GRN${Date.now()}`;
    await db.transaction(async (tx) => {
        await tx.insert(goodsReceivedNotes).values({
            id: newGrnId,
            poId: grnData.poId,
            supplierId: grnData.supplierId,
            grnDate: grnData.grnDate,
            notes: grnData.notes,
            status: grnData.status,
            receivedBy: grnData.receivedBy,
        });

        const receivedItems = grnData.items.filter(item => item.receivedQuantity > 0);
        if (receivedItems.length > 0) {
            await tx.insert(goodsReceivedNoteItems).values(
                receivedItems.map(item => ({
                    grnId: newGrnId,
                    itemId: item.itemId,
                    description: item.description,
                    orderedQuantity: item.orderedQuantity,
                    receivedQuantity: item.receivedQuantity,
                    notes: item.notes,
                }))
            );
            // Update inventory
            for (const item of receivedItems) {
                await tx.update(products)
                    .set({ quantity: sql`${products.quantity} + ${item.receivedQuantity}` })
                    .where(eq(products.id, item.itemId));
            }
        }
        
        // Update PO status
        const po = await tx.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, grnData.poId),
            with: { items: true }
        });
        const allGrnsForPo = await tx.query.goodsReceivedNotes.findMany({
            where: eq(goodsReceivedNotes.poId, grnData.poId),
            with: { items: true }
        });

        if (po) {
            const totalReceived = allGrnsForPo.reduce((sum, grn) => sum + grn.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0), 0);
            const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
            const newPoStatus = totalReceived >= totalOrdered ? "مستلم بالكامل" : "مستلم جزئياً";
            await tx.update(purchaseOrders).set({ status: newPoStatus }).where(eq(purchaseOrders.id, grnData.poId));
        }

    });
    revalidatePath('/purchases');
    revalidatePath('/inventory');
}


export async function updateGoodsReceivedNoteStatus(grnId: string, status: 'مستلم جزئياً' | 'مستلم بالكامل') {
    await db.update(goodsReceivedNotes).set({ status }).where(eq(goodsReceivedNotes.id, grnId));
    revalidatePath('/purchases');
}

export async function deleteGoodsReceivedNote(grnId: string) {
    // Note: In a real app, deleting a GRN should reverse the inventory update.
    // This is a simplified version.
    await db.transaction(async (tx) => {
        await tx.delete(goodsReceivedNoteItems).where(eq(goodsReceivedNoteItems.grnId, grnId));
        await tx.delete(goodsReceivedNotes).where(eq(goodsReceivedNotes.id, grnId));
    });
    revalidatePath('/purchases');
}


// --- Purchase Return Actions ---
export async function addPurchaseReturn(returnData: PurchaseReturnFormValues) {
  const newReturnId = `PR${Date.now()}`;
  await db.transaction(async (tx) => {
    await tx.insert(purchaseReturns).values({
      ...returnData,
      id: newReturnId,
      totalAmount: String(returnData.totalAmount),
    });
    if (returnData.items.length > 0) {
      await tx.insert(purchaseReturnItems).values(
        returnData.items.map(item => ({
          returnId: newReturnId,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          reason: item.reason,
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/purchases');
}

export async function updatePurchaseReturn(returnData: PurchaseReturnFormValues) {
  if (!returnData.id) throw new Error("Return ID is required for updating.");
  await db.transaction(async (tx) => {
    await tx.update(purchaseReturns).set({
      ...returnData,
      totalAmount: String(returnData.totalAmount),
    }).where(eq(purchaseReturns.id, returnData.id!));
    
    await tx.delete(purchaseReturnItems).where(eq(purchaseReturnItems.returnId, returnData.id!));

    if (returnData.items.length > 0) {
      await tx.insert(purchaseReturnItems).values(
        returnData.items.map(item => ({
          returnId: returnData.id!,
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
          reason: item.reason,
          total: String(item.total),
        }))
      );
    }
  });
  revalidatePath('/purchases');
}

export async function deletePurchaseReturn(returnId: string) {
    const pr = await db.query.purchaseReturns.findFirst({ where: eq(purchaseReturns.id, returnId) });
    if (pr?.status !== 'مسودة') throw new Error("لا يمكن حذف مرتجع معتمد أو معالج.");
    await db.transaction(async (tx) => {
        await tx.delete(purchaseReturnItems).where(eq(purchaseReturnItems.returnId, returnId));
        await tx.delete(purchaseReturns).where(eq(purchaseReturns.id, returnId));
    });
    revalidatePath('/purchases');
}

export async function approvePurchaseReturn(returnId: string) {
    const pr = await db.query.purchaseReturns.findFirst({ where: eq(purchaseReturns.id, returnId), with: { items: true } });
    if (!pr) throw new Error("لم يتم العثور على مرتجع الشراء.");
    if (pr.status !== 'مسودة') throw new Error("يمكن فقط اعتماد المرتجعات التي في حالة 'مسودة'.");

    await db.transaction(async (tx) => {
        await tx.update(purchaseReturns).set({ status: 'معتمد' }).where(eq(purchaseReturns.id, returnId));
        // Decrease inventory
        for (const item of pr.items) {
            await tx.update(products)
                .set({ quantity: sql`${products.quantity} - ${item.quantity}` })
                .where(eq(products.id, item.itemId));
        }
    });
    revalidatePath('/purchases');
    revalidatePath('/inventory');
}


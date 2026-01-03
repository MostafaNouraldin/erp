

'use server';

import { connectToTenantDb } from '@/db';
import { products, categories, warehouses, stockRequisitions, stockRequisitionItems, stockIssueVouchers, stockIssueVoucherItems, stocktakes, goodsReceivedNotes, goodsReceivedNoteItems, inventoryMovementLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from "zod";

const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU مطلوب"),
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().optional(),
  category: z.string().min(1, "الفئة مطلوبة"),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  costPrice: z.coerce.number().min(0, "سعر التكلفة يجب أن يكون إيجابياً"),
  sellingPrice: z.coerce.number().min(0, "سعر البيع يجب أن يكون إيجابياً"),
  quantity: z.coerce.number().min(0, "الكمية لا يمكن أن تكون سالبة").default(0),
  reorderLevel: z.coerce.number().min(0, "حد إعادة الطلب لا يمكن أن يكون سالباً").default(0),
  location: z.string().optional(),
  barcode: z.string().optional(),
  supplierId: z.string().optional(),
  image: z.string().optional(),
  dataAiHint: z.string().max(30, "الكلمات المفتاحية يجب ألا تتجاوز 30 حرفًا").optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;


type CategoryValues = {
    id?: string;
    name: string;
    description?: string;
};

const warehouseSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "اسم المستودع مطلوب"),
    location: z.string().optional(),
});
export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

const stocktakeInitiationSchema = z.object({
  stocktakeDate: z.date({ required_error: "تاريخ الجرد مطلوب" }),
  warehouseId: z.string().min(1, "المستودع مطلوب"),
  responsiblePerson: z.string().min(1, "المسؤول عن الجرد مطلوب"),
  notes: z.string().optional(),
});
type StocktakeInitiationFormValues = z.infer<typeof stocktakeInitiationSchema>;

const stockIssueItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantityIssued: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  notes: z.string().optional(),
});
const stockIssueVoucherSchema = z.object({
  id: z.string().optional(),
  date: z.date({ required_error: "التاريخ مطلوب" }),
  warehouseId: z.string().min(1, "المستودع المصدر مطلوب"),
  recipient: z.string().min(1, "الجهة المستلمة مطلوبة"),
  reason: z.string().min(1, "سبب الصرف مطلوب"),
  items: z.array(stockIssueItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  notes: z.string().optional(),
  status: z.enum(["مسودة", "معتمد", "ملغي"]).default("مسودة"),
  issuedBy: z.string().optional(),
});
type StockIssueVoucherFormValues = z.infer<typeof stockIssueVoucherSchema>;

const goodsReceivedNoteItemSchema = z.object({
  itemId: z.string().min(1, "الصنف مطلوب"),
  description: z.string().optional(),
  orderedQuantity: z.coerce.number().min(0),
  receivedQuantity: z.coerce.number().min(0, "الكمية المستلمة يجب أن تكون إيجابية أو صفر").max(Number.MAX_SAFE_INTEGER, "الكمية كبيرة جداً"),
  notes: z.string().optional(),
});
const goodsReceivedNoteSchema = z.object({
  id: z.string().optional(),
  poId: z.string().min(1, "أمر الشراء مطلوب"),
  supplierId: z.string().min(1, "المورد مطلوب"),
  grnDate: z.date({ required_error: "تاريخ الاستلام مطلوب" }),
  items: z.array(goodsReceivedNoteItemSchema).min(1, "يجب إضافة صنف واحد على الأقل مستلم"),
  notes: z.string().optional(),
  status: z.enum(["مستلم جزئياً", "مستلم بالكامل"]),
  receivedBy: z.string().optional(),
});
type GoodsReceivedNoteFormValues = z.infer<typeof goodsReceivedNoteSchema>;


const stockRequisitionItemSchema = z.object({
  productId: z.string().min(1, "المنتج مطلوب"),
  quantityRequested: z.coerce.number().min(1, "الكمية يجب أن تكون أكبر من صفر"),
  justification: z.string().optional(),
});
const stockRequisitionSchema = z.object({
  id: z.string().optional(),
  requestDate: z.date({ required_error: "تاريخ الطلب مطلوب" }),
  requestingDepartmentOrPerson: z.string().min(1, "الجهة الطالبة مطلوبة"),
  requiredByDate: z.date({ required_error: "تاريخ الحاجة مطلوب" }),
  items: z.array(stockRequisitionItemSchema).min(1, "يجب إضافة صنف واحد على الأقل"),
  overallJustification: z.string().optional(),
  status: z.enum(["جديد", "قيد المراجعة", "موافق عليه", "مرفوض", "تم الصرف جزئياً", "تم الصرف بالكامل", "ملغي"]).default("جديد"),
  approvedBy: z.string().optional(),
  approvalDate: z.date().optional(),
});
type StockRequisitionFormValues = z.infer<typeof stockRequisitionSchema>;
export type InventoryMovementLog = typeof inventoryMovementLog.$inferSelect;


async function getDb(tenantId: string = 'T001') {
    const { db } = await connectToTenantDb(tenantId);
    return db;
}


export async function addProduct(productData: ProductFormValues) {
  const db = await getDb();
  const newProduct = {
    ...productData,
    id: `ITEM${Date.now()}`,
    costPrice: String(productData.costPrice),
    sellingPrice: String(productData.sellingPrice),
  };
  await db.insert(products).values(newProduct);
  revalidatePath('/inventory');
}

export async function updateProduct(productData: ProductFormValues) {
    const db = await getDb();
    if (!productData.id) {
        throw new Error("Product ID is required for updating.");
    }
    const updatedProduct = {
        ...productData,
        costPrice: String(productData.costPrice),
        sellingPrice: String(productData.sellingPrice),
    };
  await db.update(products).set(updatedProduct).where(eq(products.id, productData.id));
  revalidatePath('/inventory');
}

export async function deleteProduct(productId: string) {
  const db = await getDb();
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath('/inventory');
}

export async function addCategory(categoryData: CategoryValues) {
    const db = await getDb();
    const newCategory = {
        ...categoryData,
        id: `CAT${Date.now()}`,
    };
    await db.insert(categories).values(newCategory);
    revalidatePath('/inventory');
}

export async function updateCategory(categoryData: CategoryValues) {
    const db = await getDb();
    if (!categoryData.id) {
        throw new Error("Category ID is required for updating.");
    }
    await db.update(categories).set(categoryData).where(eq(categories.id, categoryData.id));
    revalidatePath('/inventory');
}

export async function deleteCategory(categoryId: string) {
    const db = await getDb();
    await db.delete(categories).where(eq(categories.id, categoryId));
    revalidatePath('/inventory');
}

export async function addWarehouse(values: WarehouseFormValues) {
    const db = await getDb();
    const newId = `WH${Date.now()}`;
    await db.insert(warehouses).values({ ...values, id: newId });
    revalidatePath('/inventory');
}

export async function updateWarehouse(values: WarehouseFormValues) {
    const db = await getDb();
    if (!values.id) {
        throw new Error("Warehouse ID is required for updating.");
    }
    await db.update(warehouses).set(values).where(eq(warehouses.id, values.id));
    revalidatePath('/inventory');
}

export async function deleteWarehouse(id: string) {
    const db = await getDb();
    await db.delete(warehouses).where(eq(warehouses.id, id));
    revalidatePath('/inventory');
}

export async function addStocktake(values: StocktakeInitiationFormValues) {
    const db = await getDb();
    const newId = `STK${Date.now()}`;
    await db.insert(stocktakes).values({ ...values, id: newId, status: "مجدول" });
    revalidatePath('/inventory');
}

export async function addStockIssueVoucher(values: StockIssueVoucherFormValues) {
    const db = await getDb();
    
    await db.transaction(async (tx) => {
        // Validate stock before proceeding
        for (const item of values.items) {
            const product = await tx.query.products.findFirst({
                where: eq(products.id, item.productId),
                columns: { quantity: true, name: true }
            });
            if (!product || product.quantity < item.quantityIssued) {
                throw new Error(`الكمية المطلوبة للصنف "${product?.name || item.productId}" غير متوفرة. المتاح: ${product?.quantity || 0}`);
            }
        }

        const newId = `SIV${Date.now()}`;
        await tx.insert(stockIssueVouchers).values({ ...values, id: newId });
        if(values.items.length > 0) {
            await tx.insert(stockIssueVoucherItems).values(
                values.items.map(item => ({
                    voucherId: newId,
                    ...item,
                }))
            );
        }
        
        // If status is 'approved' on creation, update stock immediately. 
        if (values.status === 'معتمد') {
             for (const item of values.items) {
                await tx.update(products)
                    .set({ quantity: sql`${products.quantity} - ${item.quantityIssued}` })
                    .where(eq(products.id, item.productId));
                 await tx.insert(inventoryMovementLog).values({
                    productId: item.productId,
                    quantity: item.quantityIssued,
                    type: 'OUT',
                    sourceType: 'إذن صرف',
                    sourceId: newId,
                });
            }
        }
    });

    revalidatePath('/inventory');
}

export async function addGoodsReceivedNote(values: GoodsReceivedNoteFormValues) {
    const db = await getDb();
    const newId = `GRN${Date.now()}`;
    await db.transaction(async (tx) => {
        await tx.insert(goodsReceivedNotes).values({ ...values, id: newId });
        const receivedItems = values.items.filter(item => item.receivedQuantity > 0);
        if (receivedItems.length > 0) {
            await tx.insert(goodsReceivedNoteItems).values(
                receivedItems.map(item => ({
                    grnId: newId,
                    ...item,
                }))
            );
            // Update inventory
            for (const item of receivedItems) {
                await tx.update(products)
                    .set({ quantity: sql`${products.quantity} + ${item.receivedQuantity}` })
                    .where(eq(products.id, item.itemId));
                 await tx.insert(inventoryMovementLog).values({
                    productId: item.itemId,
                    quantity: item.receivedQuantity,
                    type: 'IN',
                    sourceType: 'استلام بضاعة',
                    sourceId: newId,
                });
            }
        }
    });
    revalidatePath('/inventory');
    revalidatePath('/purchases');
}


export async function addStockRequisition(values: StockRequisitionFormValues) {
    const db = await getDb();
    const newId = `SRQ${Date.now()}`;
    await db.transaction(async (tx) => {
        await tx.insert(stockRequisitions).values({ ...values, id: newId });
        if (values.items.length > 0) {
            await tx.insert(stockRequisitionItems).values(
                values.items.map(item => ({
                    requisitionId: newId,
                    ...item
                }))
            );
        }
    });
    revalidatePath('/inventory');
}

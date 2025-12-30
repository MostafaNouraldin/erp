
'use server';

import { connectToTenantDb } from '@/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

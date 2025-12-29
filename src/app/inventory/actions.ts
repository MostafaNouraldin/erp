
'use server';

import { db } from '@/db';
import { products, categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// We need to define the type for the product values coming from the form
// as we don't have access to the Zod schema from the client component.
type ProductValues = {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  location?: string;
  barcode?: string;
  supplierId?: string;
  image?: string;
  dataAiHint?: string;
};

type CategoryValues = {
    id?: string;
    name: string;
    description?: string;
};

export async function addProduct(productData: ProductValues) {
  const newProduct = {
    ...productData,
    id: `ITEM${Date.now()}`,
    costPrice: String(productData.costPrice),
    sellingPrice: String(productData.sellingPrice),
  };
  await db.insert(products).values(newProduct);
  revalidatePath('/inventory');
}

export async function updateProduct(productData: ProductValues) {
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
  await db.delete(products).where(eq(products.id, productId));
  revalidatePath('/inventory');
}

export async function addCategory(categoryData: CategoryValues) {
    const newCategory = {
        ...categoryData,
        id: `CAT${Date.now()}`,
    };
    await db.insert(categories).values(newCategory);
    revalidatePath('/inventory');
}

export async function updateCategory(categoryData: CategoryValues) {
    if (!categoryData.id) {
        throw new Error("Category ID is required for updating.");
    }
    await db.update(categories).set(categoryData).where(eq(categories.id, categoryData.id));
    revalidatePath('/inventory');
}

export async function deleteCategory(categoryId: string) {
    await db.delete(categories).where(eq(categories.id, categoryId));
    revalidatePath('/inventory');
}

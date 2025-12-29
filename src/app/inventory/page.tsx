
// This is now a true Server Component that fetches data and passes it to the client.
import { db } from '@/db';
import { products, categories, suppliers } from '@/db/schema';
import React from 'react';
import InventoryClientComponent from './InventoryClientComponent';


// This is now a true Server Component that fetches data and passes it to the client component.
export default async function InventoryPage() {
    const productsResult = await db.select().from(products);
    const categoriesResult = await db.select().from(categories);
    const suppliersResult = await db.select().from(suppliers);
    
    const initialData = {
        products: productsResult.map(p => ({ ...p, costPrice: Number(p.costPrice), sellingPrice: Number(p.sellingPrice) })),
        categories: categoriesResult,
        suppliers: suppliersResult,
    };

    return <InventoryClientComponent initialData={initialData} />;
}

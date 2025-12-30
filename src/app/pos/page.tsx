
// This is now a true Server Component that fetches data and passes it to the client.
import React from 'react';
import { connectToTenantDb } from '@/db';
import { products, categories, customers } from '@/db/schema';
import POSClientComponent from './POSClientComponent';


export default async function POSPage() {
    const tenantId = 'T001'; // In a real app, this comes from the user session
    const { db } = await connectToTenantDb(tenantId);
    
    const productsResult = await db.select().from(products);
    const categoriesResult = await db.selectDistinct({category: products.category}).from(products);
    const customersResult = await db.select().from(customers);
    
    const initialData = {
        products: productsResult.map(p => ({ 
            ...p, 
            price: parseFloat(p.sellingPrice),
            stock: p.quantity,
        })),
        categories: ["الكل", ...categoriesResult.map(c => c.category).filter(Boolean)],
        customers: customersResult.map(c => ({
            id: c.id,
            name: c.name,
        })),
    };

    return <POSClientComponent initialData={initialData} />;
}

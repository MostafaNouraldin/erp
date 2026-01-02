
// This is now a true Server Component that fetches data and passes it to the client.
import React from 'react';
import { connectToTenantDb } from '@/db';
import { products, categories, customers, posSessions, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import POSClientComponent from './POSClientComponent';


export default async function POSPage() {
    const { db } = await connectToTenantDb();
    
    try {
        const productsResult = await db.select().from(products);
        const categoriesResult = await db.selectDistinct({category: products.category}).from(products);
        const customersResult = await db.select().from(customers);

        const activeSession = await db.query.posSessions.findFirst({
            where: and(
                eq(posSessions.status, "open")
            ),
             with: {
                user: true // Assuming a relation 'user' is defined on posSessions table
            }
        });
        
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
            activeSession: activeSession ? {
                ...activeSession,
                openingBalance: parseFloat(activeSession.openingBalance),
            } : null,
        };

        return <POSClientComponent initialData={initialData} />;
    } catch (error) {
         const errorMessage = (error as Error).message;
        console.error("Database query failed for POS page:", errorMessage);
        return (
            <div className="container mx-auto py-6 text-center" dir="rtl">
                <h1 className="text-2xl font-bold mb-4 text-destructive">خطأ في وحدة نقاط البيع</h1>
                <p className="text-muted-foreground mb-4">
                    تعذر جلب البيانات من قاعدة البيانات.
                </p>
                <p className="text-sm text-muted-foreground mt-4">رسالة الخطأ: {errorMessage}</p>
            </div>
        );
    }
}

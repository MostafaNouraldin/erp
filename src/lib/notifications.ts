
'use server';

import { connectToTenantDb } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createNotification(userId: string, message: string, link?: string) {
    const { db } = await connectToTenantDb();
    await db.insert(notifications).values({ userId, message, link });
    // This is a generic revalidation, in a real app you might use a more specific
    // or tag-based revalidation strategy if this becomes a performance issue.
    revalidatePath('/', 'layout');
}

export async function getNotificationsForUser(userId: string) {
    const { db } = await connectToTenantDb();
    const userNotifications = await db.query.notifications.findMany({
        where: eq(notifications.userId, userId),
        orderBy: [desc(notifications.createdAt)],
        limit: 10, // Limit to recent notifications for the popover
    });
    return userNotifications.map(n => ({...n, createdAt: n.createdAt.toISOString()}));
}

export async function markNotificationAsRead(notificationId: number) {
    const { db } = await connectToTenantDb();
    await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
    revalidatePath('/', 'layout');
}

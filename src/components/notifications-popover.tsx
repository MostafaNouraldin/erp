
"use client";

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from '@/hooks/auth-context';
import { getNotificationsForUser, markNotificationAsRead } from '@/lib/notifications';

interface Notification {
    id: number;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
        fetchNotifications();
    }
  }, [user?.id, isOpen]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
        const fetchedNotifications = await getNotificationsForUser(user.id);
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
        await markNotificationAsRead(notificationId);
        fetchNotifications(); // Refresh notifications list
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };
  
   const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      // This would be a new server action, for now we do it one by one
      for (const notification of notifications) {
        if (!notification.isRead) {
          await markNotificationAsRead(notification.id);
        }
      }
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
    return `منذ ${Math.floor(seconds)} ثوان`;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-medium text-sm">الإشعارات</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto" onClick={handleMarkAllAsRead}>
              <CheckCheck className="h-3 w-3 me-1" />
              تمييز الكل كمقروء
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 border-b hover:bg-muted/50 ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-snug">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{timeSince(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                    <Button variant="outline" size="icon" className="h-6 w-6" title="تمييز كمقروء" onClick={() => handleMarkAsRead(notification.id)}>
                        <CheckCheck className="h-3 w-3"/>
                    </Button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground p-6">لا توجد إشعارات جديدة.</p>
          )}
        </div>
        <div className="p-2 border-t">
            <Button variant="link" size="sm" className="w-full">
                عرض كل الإشعارات
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

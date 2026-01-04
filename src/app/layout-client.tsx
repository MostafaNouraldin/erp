
"use client";

import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Settings, LogOut, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import LoginPage from './login/page';
import { usePathname } from "next/navigation";
import { allNavItems } from "@/lib/nav-links";
import NotificationsPopover from "@/components/notifications-popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface AppLayoutClientProps {
  children: React.ReactNode;
  companySettings: { name: string; logo: string } | null;
}

export default function AppLayoutClient({ children, companySettings }: AppLayoutClientProps) {
    const auth = useAuth();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
        }
    }, []);

    if (!mounted || auth.isLoading) {
        return (
            <div className="flex min-h-screen w-full bg-background">
                <div className="w-64 border-r p-4 hidden md:block">
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-5/6" />
                </div>
                <div className="flex-1 p-6">
                    <Skeleton className="h-12 w-full mb-6" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    const isPublicPage = pathname === '/login' || pathname === '/subscribe';

    if (!auth.isAuthenticated && !isPublicPage) {
        return <LoginPage />;
    }
    
    if (auth.isAuthenticated && isPublicPage) {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
        return null;
    }
    
    if (!auth.isAuthenticated && isPublicPage) {
        return <>{children}</>;
    }

    const navItems = allNavItems
      .filter(item => {
        // Hide subscription link for super admins
        if (auth.isSuperAdmin && item.href === '/subscription') {
            return false;
        }
        // Hide system administration for non-super admins
        if (!auth.isSuperAdmin && item.module === 'SystemAdministration') {
            return false;
        }
        
        // If the item itself doesn't have a permission key, it might be a parent with sub-items.
        // If it has no sub-items, it's a direct link that should be checked for permission.
        const mainPermission = item.permissionKey;
        
        // A user can see a parent item if they have permission for AT LEAST ONE of its children.
        const canSeeAnySubItem = item.subItems?.some(sub => auth.hasPermission(sub.permissionKey));
        
        // An item is visible if it's not a parent OR if it's a parent and the user can see at least one child.
        // Also check direct permission if it exists.
        return !mainPermission ? (canSeeAnySubItem || !item.subItems) : (auth.hasPermission(mainPermission) || canSeeAnySubItem);
      })
      .map(item => {
        if (item.subItems) {
            return {
                ...item,
                subItems: item.subItems.filter(sub => auth.hasPermission(sub.permissionKey))
            };
        }
        return item;
      })
      .filter(item => item.href || (item.subItems && item.subItems.length > 0));


    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar collapsible="icon" side="right" className="shadow-lg">
                    <SidebarHeader logoUrl={companySettings?.logo} companyName={companySettings?.name} />
                    <SidebarContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.label} item={item} />
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                    {!auth.isSuperAdmin && (
                        <Card className="bg-transparent border-0 shadow-none">
                            <CardContent className="p-2 text-xs">
                                <div className="mb-1 hidden group-data-[collapsible=icon]:hidden">
                                    <p className="font-semibold text-sidebar-primary">{companySettings?.name}</p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full hidden group-data-[collapsible=icon]:hidden bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-primary/10">
                                  <Link href="/subscription">
                                    إدارة الاشتراك
                                  </Link>
                                </Button>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex justify-center items-center group-data-[collapsible=icon]:block hidden">
                                        <Link href="/subscription">
                                          <Button variant="ghost" size="icon">
                                              <CreditCardIcon className="h-5 w-5 text-sidebar-foreground/70" />
                                          </Button>
                                        </Link>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" align="center">
                                      <p>إدارة الاشتراك</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </CardContent>
                        </Card>
                    )}
                    </SidebarFooter>
                </Sidebar>

                <div className="flex flex-col flex-1 overflow-x-hidden">
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
                        <div className="flex-1">
                            <SidebarTrigger className="md:hidden order-first" />
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <Button variant="ghost" size="icon" aria-label="Search">
                                <Search className="h-5 w-5" />
                            </Button>
                            <NotificationsPopover />
                            <LanguageToggle />
                            <ModeToggle />
                            {auth.isAuthenticated && auth.user && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={auth.user.avatar_url || undefined} alt={auth.user.name} data-ai-hint="person" />
                                                <AvatarFallback>{auth.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64" align="end" forceMount dir="rtl">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1 text-right">
                                                <p className="text-sm font-medium leading-none">{auth.user.name}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {auth.user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {!auth.isSuperAdmin && (
                                            <>
                                                <DropdownMenuItem disabled>
                                                    <div className="flex flex-col space-y-0.5 text-right text-xs w-full">
                                                        <p className="text-muted-foreground">الشركة الحالية:</p>
                                                        <p className="font-medium">{companySettings?.name}</p>
                                                    </div>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem>
                                            <UserCircle className="me-2 h-4 w-4" />
                                            <span>الملف الشخصي</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="me-2 h-4 w-4" />
                                            <span>الإعدادات</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={auth.logout}>
                                            <LogOut className="me-2 h-4 w-4" />
                                            <span>تسجيل الخروج</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </header>
                    <SidebarInset className="p-4 md:p-6">
                        {children}
                    </SidebarInset>
                </div>
            </div>
            <Toaster />
        </SidebarProvider>
    );
}

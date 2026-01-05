
"use client";

import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Settings, LogOut, CreditCardIcon, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import LoginPage from './login/page';
import { usePathname, useRouter } from "next/navigation";
import { allNavItems } from "@/lib/nav-links";
import NotificationsPopover from "@/components/notifications-popover";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanySettingsForLayout } from './actions';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AppLayoutClientProps {
  children: React.ReactNode;
  companySettings: { name: string; logo: string } | null;
}

export default function AppLayoutClient({ children, companySettings }: AppLayoutClientProps) {
    const auth = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    
    const isPublicPage = pathname === '/login' || pathname === '/subscribe';
    const isSetupPage = pathname === '/settings';
    const isSubscriptionPage = pathname === '/subscription';
    
    const isNewUnconfiguredUser = auth.isAuthenticated && auth.user?.isConfigured === false;
    const isSubscriptionExpired = auth.isAuthenticated && !auth.isSuperAdmin && auth.user?.subscriptionEndDate && new Date(auth.user.subscriptionEndDate) < new Date();

    const navItems = useMemo(() => allNavItems
      .map(item => {
        if (item.module === "SystemAdministration" && !auth.isSuperAdmin) return null;
        if (isNewUnconfiguredUser && !['/settings', '/help'].includes(item.href || '')) return null;
        if (isSubscriptionExpired && !['/subscription', '/settings', '/help'].includes(item.href || '')) return null;

        if (!auth.hasPermission(item.permissionKey as string)) return null;

        if (item.subItems) {
            const visibleSubItems = item.subItems.filter(sub => {
                if (isNewUnconfiguredUser && !['/settings', '/help'].includes(sub.href || '')) return false;
                if (isSubscriptionExpired && !['/subscription', '/settings', '/help'].includes(sub.href || '')) return false;

                const hasSubSubPermission = sub.subItems ? sub.subItems.some(grandchild => auth.hasPermission(grandchild.permissionKey as string)) : false;
                if (sub.subItems && !hasSubSubPermission) return false;

                if (auth.isSuperAdmin && sub.href === '/subscription') return false;
                return auth.hasPermission(sub.permissionKey as string);
            }).map(sub => {
                if (sub.subItems) {
                    return {
                        ...sub,
                        subItems: sub.subItems.filter(grandchild => auth.hasPermission(grandchild.permissionKey as string))
                    }
                }
                return sub;
            }).filter(sub => sub.href || (sub.subItems && sub.subItems.length > 0));

            if (visibleSubItems.length === 0 && !item.href) return null;

            return { ...item, subItems: visibleSubItems };
        }
        return item;
      })
      .filter(Boolean), [auth, isNewUnconfiguredUser, isSubscriptionExpired]);


    useEffect(() => {
        setMounted(true);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
        }
    }, []);

    useEffect(() => {
        if (!auth.isLoading) {
            if (auth.isAuthenticated) {
                if (isPublicPage) {
                    router.replace('/');
                } else if (auth.user?.isConfigured === false && !isSetupPage) {
                    router.replace('/settings');
                }
            } else if (!isPublicPage) {
                router.replace('/login');
            }
        }
    }, [auth.isAuthenticated, auth.user, auth.isLoading, pathname, router, isPublicPage, isSetupPage]);


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
    
    // If user is not authenticated and not on a public page, show login
    if (!auth.isAuthenticated && !isPublicPage) {
        return <LoginPage />;
    }
    
    // While redirecting, show nothing to prevent flashes of content
    if ((auth.isAuthenticated && isPublicPage) || (auth.isAuthenticated && auth.user?.isConfigured === false && !isSetupPage)) {
        return null;
    }
    
    // If user is not authenticated but on a public page, show the page content
    if (!auth.isAuthenticated && isPublicPage) {
        return <>{children}</>;
    }
    
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <Sidebar collapsible="icon" side="right" className="shadow-lg">
                    <SidebarHeader logoUrl={companySettings?.logo} companyName={companySettings?.name} />
                    <SidebarContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                               item && <SidebarMenuItem key={item.label} item={item} />
                            ))}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                    {!auth.isSuperAdmin && (
                        <Card>
                            <CardContent className="p-2 text-xs">
                                <div className="mb-1 hidden group-data-[collapsible=icon]:hidden">
                                    <p className="font-semibold text-foreground">{companySettings?.name}</p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full hidden group-data-[collapsible=icon]:hidden bg-background text-foreground border-border hover:bg-accent">
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
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings">
                                                <UserCircle className="me-2 h-4 w-4" />
                                                <span>الملف الشخصي</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings">
                                                <Settings className="me-2 h-4 w-4" />
                                                <span>الإعدادات</span>
                                            </Link>
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
                        {isNewUnconfiguredUser && !isSetupPage && (
                            <Alert className="mb-6 border-blue-500 text-blue-800 dark:text-blue-300">
                                <Info className="h-4 w-4" />
                                <AlertTitle className="font-bold">مرحباً بك في نظام المستقبل!</AlertTitle>
                                <AlertDescription>
                                    هذه هي خطوتك الأولى. يرجى إكمال معلومات شركتك الأساسية في قسم "معلومات الشركة" أدناه لحفظ الإعدادات والبدء في استخدام النظام.
                                </AlertDescription>
                            </Alert>
                        )}
                        {isSubscriptionExpired && !isSubscriptionPage && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>انتهى اشتراكك!</AlertTitle>
                                <AlertDescription>
                                    لقد انتهت صلاحية اشتراكك. تم إيقاف الوصول إلى معظم وحدات النظام. يرجى <Link href="/subscription" className="font-bold underline">تجديد اشتراكك</Link> لاستعادة الوصول الكامل.
                                </AlertDescription>
                            </Alert>
                        )}
                        {children}
                    </SidebarInset>
                </div>
            </div>
            <Toaster />
        </SidebarProvider>
    );
}

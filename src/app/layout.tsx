
"use client";

import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem, type SidebarMenuItemProps } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Settings, LogOut, CreditCardIcon } from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import AppLogo from "@/components/app-logo";
import { useEffect, useState, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { AuthProvider, AuthContext } from "@/hooks/auth-context";
import { useAuth } from "@/hooks/use-auth";
import LoginPage from './login/page';
import { usePathname } from "next/navigation";
import { allNavItems } from "@/lib/nav-links";
import NotificationsPopover from "@/components/notifications-popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCompanySettingsForLayout } from "./actions"; // Import the new server action


const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});


function AppLayout({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const pathname = usePathname();
    const [companySettings, setCompanySettings] = useState({ name: "نسيج للحلول المتكاملة", logo: "" });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof document !== 'undefined') {
            document.documentElement.lang = 'ar';
            document.documentElement.dir = 'rtl';
        }
        
        async function fetchSettings() {
            if(auth.user?.tenantId) {
                const settings = await getCompanySettingsForLayout(auth.user.tenantId);
                if(settings) {
                    setCompanySettings({ name: settings.companyName || "نسيج للحلول المتكاملة", logo: settings.companyLogo || "" });
                }
            }
        }
        if(auth.isAuthenticated) {
            fetchSettings();
        }

    }, [auth.isAuthenticated, auth.user?.tenantId]);

    // If loading auth state from localStorage, don't render anything yet
    if (!mounted || auth.isLoading) {
        return null;
    }
    
    // Allow access to login and subscribe pages without authentication
    const isPublicPage = pathname === '/login' || pathname === '/subscribe';

    if (!auth.isAuthenticated && !isPublicPage) {
        return <LoginPage />;
    }
    
    // If authenticated, redirect away from public pages
    if (auth.isAuthenticated && isPublicPage) {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
        return null;
    }
    
    // Render children directly for public pages if not authenticated
    if (!auth.isAuthenticated && isPublicPage) {
        return <>{children}</>;
    }


    const navItems = allNavItems
      .filter(item => {
        const moduleKey = item.module;
        // Super admin should not see tenant-specific settings like 'Subscription'
        if (auth.isSuperAdmin && item.href === '/subscription') {
             return false;
        }

        // Regular users should not see 'System Administration'
        if (!auth.isSuperAdmin && item.module === 'SystemAdministration') {
            return false;
        }
        
        const mainPermission = `${moduleKey.toLowerCase()}.view`;
        return auth.hasPermission(mainPermission) || item.subItems?.some(sub => auth.hasPermission(sub.permissionKey));
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
        <CurrencyProvider>
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                    <Sidebar collapsible="icon" side="right" className="shadow-lg">
                        <SidebarHeader>
                            <AppLogo companyName={companySettings.name} logoUrl={companySettings.logo} />
                            <div className="hidden group-data-[collapsible=icon]:hidden">
                            </div>
                        </SidebarHeader>
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
                                        <p className="font-semibold text-sidebar-primary">{companySettings.name}</p>
                                        {/* Subscription end date logic can be added back here if needed */}
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
                                                    <AvatarImage src={auth.user.avatar_url} alt={auth.user.name} data-ai-hint="person" />
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
                                                            <p className="font-medium">{companySettings.name}</p>
                                                            {/* Subscription end date logic can be added here if needed */}
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
        </CurrencyProvider>
    );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <title>Al-Mustaqbal ERP</title>
        <meta name="description" content="نظام ERP متكامل للشركات المتوسطة والكبيرة" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${cairo.variable} font-sans antialiased bg-secondary/50`}>
        <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
                <AppLayout>{children}</AppLayout>
            </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

    
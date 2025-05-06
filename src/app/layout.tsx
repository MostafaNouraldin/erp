import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, UserCircle, Settings, LogOut, LayoutDashboard, FileText, Users, ShoppingCart, Package, DollarSign, TrendingUp, Briefcase, Building, Printer, BarChart2, Cog, FilePlus, FileOutput, FileCheck, FileClock, Banknote, Warehouse, Truck, Repeat, Search, CircleHelp, Bell, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import AppLogo from "@/components/app-logo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Al-Mustaqbal ERP",
  description: "نظام ERP متكامل للشركات المتوسطة والكبيرة",
};

// Mock authentication status and user data
const isAuthenticated = true;
const user = {
  name: "Ahmed Ali",
  email: "ahmed.ali@example.com",
  avatarUrl: "https://picsum.photos/100/100?grayscale",
  role: "Administrator",
};

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard, module: "Dashboard" },
  {
    label: "الحسابات",
    icon: FileText,
    module: "Accounting",
    subItems: [
      { href: "/general-ledger", label: "الحسابات العامة", icon: FileText },
      { href: "/receipts-vouchers", label: "سندات القبض والصرف", icon: Printer },
      { href: "/accounts-payable-receivable", label: "الحسابات المدينة والدائنة", icon: Users },
    ],
  },
  {
    label: "المخزون",
    icon: Package,
    module: "Inventory",
    subItems: [
        { href: "/inventory", label: "إدارة المخزون", icon: Warehouse },
        { href: "/inventory-transfers", label: "تحويلات المخزون", icon: Truck },
        { href: "/inventory-adjustments", label: "تسويات جردية", icon: Repeat },
    ],
  },
  { href: "/sales", label: "المبيعات", icon: ShoppingCart, module: "Sales" },
  { href: "/purchases", label: "المشتريات", icon: Briefcase, module: "Purchases" },
  { href: "/hr-payroll", label: "الموارد البشرية والرواتب", icon: Users, module: "HR" },
  { href: "/production", label: "الإنتاج", icon: Cog, module: "Production" },
  { href: "/projects", label: "المشاريع", icon: Building, module: "Projects" },
  { href: "/pos", label: "نقاط البيع", icon: DollarSign, module: "POS" },
  { href: "/reports", label: "التقارير والتحليل", icon: BarChart2, module: "BI" },
  { href: "/settings", label: "الإعدادات", icon: Settings, module: "Settings" },
];


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.variable} font-inter antialiased bg-secondary/50`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <Sidebar collapsible="icon" className="border-e shadow-sm">
                <SidebarHeader className="p-4 flex items-center justify-between">
                  <AppLogo />
                  <div className="hidden group-data-[collapsible=icon]:hidden">
                     {/* Placeholder for potential header content when sidebar expanded */}
                  </div>
                </SidebarHeader>
                <SidebarContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        {item.subItems ? (
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <SidebarMenuButton tooltip={{children: item.label, side: 'right', align: 'center'}} className="w-full justify-start">
                                <item.icon className="h-5 w-5" />
                                <span className="truncate">{item.label}</span>
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-56">
                              {item.subItems.map(subItem => (
                                <Link href={subItem.href} key={subItem.label} passHref>
                                  <DropdownMenuItem className="cursor-pointer">
                                    <subItem.icon className="mr-2 h-4 w-4" />
                                    {subItem.label}
                                  </DropdownMenuItem>
                                </Link>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Link href={item.href} passHref>
                            <SidebarMenuButton tooltip={{children: item.label, side: 'right', align: 'center'}} className="w-full justify-start">
                              <item.icon className="h-5 w-5" />
                              <span className="truncate">{item.label}</span>
                            </SidebarMenuButton>
                          </Link>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarContent>
                <SidebarFooter className="p-4 border-t">
                  <Link href="/help" passHref>
                    <SidebarMenuButton tooltip={{children: "المساعدة والدعم", side: 'right', align: 'center'}} className="w-full justify-start">
                      <CircleHelp className="h-5 w-5" />
                      <span className="truncate">المساعدة والدعم</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarFooter>
              </Sidebar>

              <div className="flex flex-col flex-1">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
                  <SidebarTrigger className="md:hidden" />
                  <div className="flex-1">
                    {/* Optional: Breadcrumbs or page title can go here */}
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" aria-label="Search">
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Notifications">
                      <Bell className="h-5 w-5" />
                    </Button>
                    <LanguageToggle />
                    <ModeToggle />
                    {isAuthenticated && (
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person" />
                              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                          <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none">{user.name}</p>
                              <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>الملف الشخصي</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>الإعدادات</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
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
        </ThemeProvider>
      </body>
    </html>
  );
}

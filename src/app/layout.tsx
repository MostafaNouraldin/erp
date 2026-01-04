
import { Suspense } from 'react';
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
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
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { AuthProvider } from "@/hooks/auth-context";
import AppLayoutClient from './layout-client'; // Import the new client component
import { getCompanySettingsForLayout } from "./actions";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
    title: "Al-Mustaqbal ERP",
    description: "نظام ERP متكامل للشركات المتوسطة والكبيرة",
    viewport: "width=device-width, initial-scale=1",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch data on the server
  const companySettingsData = await getCompanySettingsForLayout('T001');
  const companySettings = {
      name: companySettingsData?.companyName || "نسيج للحلول المتكاملة",
      logo: companySettingsData?.companyLogo || ""
  };
  
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-secondary/50`}>
        <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <CurrencyProvider>
                <AppLayoutClient companySettings={companySettings}>
                    {children}
                </AppLayoutClient>
              </CurrencyProvider>
            </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


import { Suspense } from 'react';
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AuthProvider } from "@/hooks/auth-context";
import AppLayoutClient from './layout-client';
import { headers } from 'next/headers';
import { getCompanySettingsForLayout } from './actions';
import { connectToTenantDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decodeJwt } from 'jose';


const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
    title: "Al-Mustaqbal ERP",
    description: "نظام ERP متكامل للشركات المتوسطة والكبيرة",
    viewport: "width=device-width, initial-scale=1",
};

// Helper function to extract tenantId from cookies
function getTenantIdFromCookie(): string | null {
    const headersList = headers();
    const cookieHeader = headersList.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split('; ');
    const authCookie = cookies.find(c => c.startsWith('auth='));

    if (authCookie) {
        const token = authCookie.split('=')[1];
        try {
            const decoded = decodeJwt(token) as { tenantId?: string };
            return decoded?.tenantId || null;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// A helper function to check if the logged-in user is a super admin
function isSuperAdminRequest(): boolean {
    const headersList = headers();
    const userCookie = headersList.get('cookie') || '';
    return userCookie.includes('"roleId":"ROLE_SUPER_ADMIN"');
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let companySettings: { name: string; logo: string } | null = null;
  const isSuperAdmin = isSuperAdminRequest();
  const tenantId = getTenantIdFromCookie();
  
  if (isSuperAdmin) {
    companySettings = { name: "نسيج للحلول المتكاملة", logo: "" };
  } else if (tenantId) {
    const settings = await getCompanySettingsForLayout(tenantId);
    companySettings = {
        name: settings?.companyName || "اسم الشركة",
        logo: settings?.companyLogo || ""
    };
  } else {
    // For public pages like login/subscribe, fetch default system branding if needed.
    // Assuming 'T001' is the main tenant or a template tenant for system branding.
    const settings = await getCompanySettingsForLayout('T001');
    companySettings = {
        name: settings?.companyName || "نسيج للحلول المتكاملة",
        logo: settings?.companyLogo || ""
    };
  }


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


import { Suspense } from 'react';
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/contexts/currency-context";
import { AuthProvider } from "@/hooks/auth-context";
import AppLayoutClient from './layout-client'; // Import the new client component

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
    title: "Al-Mustaqbal ERP",
    description: "نظام ERP متكامل للشركات المتوسطة والكبيرة",
    viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Data fetching is now moved to the Client Component via a server action call inside it.
  // This keeps the root layout clean and static.
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
                <AppLayoutClient>
                    {children}
                </AppLayoutClient>
              </CurrencyProvider>
            </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

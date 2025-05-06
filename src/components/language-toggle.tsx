"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { useRouter, usePathname } from 'next/navigation' // Placeholder for actual routing logic

export function LanguageToggle() {
  // const router = useRouter() // Placeholder
  // const pathname = usePathname() // Placeholder
  const [currentLang, setCurrentLang] = React.useState("ar"); // Default to Arabic

  const toggleLanguage = (lang: string) => {
    setCurrentLang(lang);
    // Placeholder for actual language switching logic
    // Example: router.push(pathname, { locale: lang })
    if (lang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
    // console.log(`Language switched to ${lang}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle language">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toggleLanguage("ar")} disabled={currentLang === "ar"}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleLanguage("en")} disabled={currentLang === "en"}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


import Link from 'next/link';
import { Building } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  companyName?: string;
  logoUrl?: string;
}

export default function AppLogo({ className, companyName, logoUrl }: AppLogoProps) {
  const nameToShow = companyName || "نسيج للحلول المتكاملة";

  return (
    <Link href="/" className={cn("flex h-12 items-center gap-3 group-data-[collapsible=icon]:justify-center", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={36} height={36} className="h-9 w-9 object-contain transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      ) : (
        <Building className="h-9 w-9 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      )}
      <span className="font-bold text-xl text-foreground truncate group-data-[collapsible=icon]:hidden">
        {nameToShow}
      </span>
    </Link>
  );
}

    
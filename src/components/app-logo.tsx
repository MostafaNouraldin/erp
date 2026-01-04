
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
    <Link href="/" className={cn("flex items-center gap-2 group-data-[collapsible=icon]:justify-center", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={28} height={28} className="h-7 w-7 object-contain transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      ) : (
        <Building className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      )}
      <span className="font-bold text-xl text-foreground hidden group-data-[collapsible=icon]:hidden truncate">
        {nameToShow}
      </span>
    </Link>
  );
}

    
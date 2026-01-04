
import { Building } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  logoUrl?: string | null;
  companyName?: string | null;
}

export default function AppLogo({ className, logoUrl, companyName }: AppLogoProps) {
  const nameToShow = companyName || "نسيج للحلول المتكاملة";

  return (
    <div className={cn("flex h-full items-center gap-3", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={40} height={40} className="h-10 w-10 object-contain transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[15deg]" />
      ) : (
        <Building className="h-10 w-10 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[15deg]" />
      )}
      <span className="font-semibold text-lg text-foreground truncate">
        {nameToShow}
      </span>
    </div>
  );
}

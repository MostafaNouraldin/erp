
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
    <div className={cn("flex flex-col items-center justify-center gap-2 text-center", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={48} height={48} className="h-12 w-12 object-contain" />
      ) : (
        <Building className="h-12 w-12 text-primary" />
      )}
      <span className="text-sm font-semibold text-sidebar-foreground truncate block w-full">
        {nameToShow}
      </span>
    </div>
  );
}

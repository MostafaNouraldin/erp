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
    <div className={cn("flex flex-row items-center justify-start gap-3", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={40} height={40} className="h-10 w-10 object-contain" />
      ) : (
        <Building className="h-10 w-10 text-primary" />
      )}
      <span className="text-lg font-semibold text-foreground truncate">
        {nameToShow}
      </span>
    </div>
  );
}

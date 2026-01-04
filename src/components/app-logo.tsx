
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
        <Image src={logoUrl} alt={nameToShow} width={112} height={112} className="h-28 w-28 object-contain" />
      ) : (
        <Building className="h-28 w-28 text-primary" />
      )}
      <span className="text-lg font-semibold text-foreground truncate block w-full">
        {nameToShow}
      </span>
    </div>
  );
}

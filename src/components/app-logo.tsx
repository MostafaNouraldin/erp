
import { Building } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  logoUrl?: string;
  isCollapsed?: boolean; // New prop
}

export default function AppLogo({ className, logoUrl, isCollapsed }: AppLogoProps) {
  const nameToShow = "نسيج للحلول المتكاملة"; // System name is fixed

  return (
    <div className={cn("flex h-full items-center gap-3", isCollapsed ? "justify-center" : "", className)}>
      {logoUrl ? (
        <Image src={logoUrl} alt={nameToShow} width={36} height={36} className="h-9 w-9 object-contain transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      ) : (
        <Building className="h-9 w-9 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      )}
      {!isCollapsed && (
          <span className="font-bold text-xl text-foreground truncate">
            {nameToShow}
          </span>
      )}
    </div>
  );
}

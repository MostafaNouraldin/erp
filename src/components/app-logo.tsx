
import Link from 'next/link';
import { Building } from 'lucide-react'; 
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
}

export default function AppLogo({ className }: AppLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group-data-[collapsible=icon]:justify-center", className)}>
      <Building className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      <span className="font-bold text-xl text-foreground hidden group-data-[collapsible=icon]:hidden group-data-[state=expanded]:block">
        المستقبل ERP
      </span>
    </Link>
  );
}

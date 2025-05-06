import Link from 'next/link';
import { Building } from 'lucide-react'; // Or any other relevant icon

export default function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
      <Building className="h-7 w-7 text-primary transition-transform duration-300 ease-in-out group-hover/sidebar-wrapper:rotate-[360deg]" />
      <span className="font-bold text-xl text-foreground hidden group-data-[collapsible=icon]:hidden">
        المستقبل ERP
      </span>
    </Link>
  );
}

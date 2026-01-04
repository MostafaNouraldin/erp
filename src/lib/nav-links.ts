

import { LayoutDashboard, BookUser, BookOpen, FileArchive, UserCheck, Landmark, ArrowUpCircle, ArrowDownCircle, ArrowDownSquare, BookCopy, Package, Truck, SlidersHorizontal, ShoppingCart, Briefcase, Users, Cog, GanttChartSquare, CreditCardIcon, BarChart2, Settings, Shield, Settings2, Building2, Mail, CircleHelpIcon, FolderOpen, FileWarning, FileEdit, UserX, ClipboardSignature, FileText } from 'lucide-react';
import type { SidebarMenuItemProps } from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  subItems?: NavItem[];
  module: string;
  permissionKey?: string;
}


export const allNavItems: NavItem[] = [ 
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard, module: "Dashboard", permissionKey: "dashboard.view" },
  {
    label: "الحسابات",
    icon: BookUser,
    module: "Accounting",
    permissionKey: "accounting.view",
    subItems: [
        { 
            label: "دفتر الأستاذ", icon: BookOpen, permissionKey: "accounting.view",
            subItems: [
                { href: "/general-ledger", label: "الحسابات العامة والقيود", icon: BookOpen, permissionKey: "accounting.view" },
                { href: "/opening-balances", label: "الأرصدة الافتتاحية", icon: FileArchive, permissionKey: "accounting.create" },
                { href: "/employee-settlements", label: "تسويات الموظفين", icon: UserCheck, permissionKey: "accounting.view" },
            ]
        },
        { 
            label: "الخزينة والبنوك", icon: Landmark, permissionKey: "accounting.view",
            subItems: [
                { href: "/bank-receipts", label: "المقبوضات البنكية", icon: ArrowUpCircle, permissionKey: "accounting.create" },
                { href: "/bank-expenses", label: "المصروفات البنكية", icon: ArrowDownCircle, permissionKey: "accounting.create" },
                { href: "/cash-expenses", label: "المصروفات النقدية", icon: ArrowDownSquare, permissionKey: "accounting.create" },
                { href: "/checkbook-register", label: "دفتر الشيكات", icon: BookCopy, permissionKey: "accounting.view" },
                { href: "/banks", label: "إدارة الحسابات البنكية", icon: Landmark, permissionKey: "accounting.view" },
            ]
        },
        { href: "/accounts-payable-receivable", label: "الذمم المدينة والدائنة", icon: Users, permissionKey: "accounting.view" },
    ],
  },
  {
    label: "المخزون",
    icon: Package,
    module: "Inventory",
    permissionKey: "inventory.view",
    subItems: [
      { href: "/inventory", label: "إدارة المخزون", icon: Package, permissionKey: "inventory.view" },
      { href: "/inventory-transfers", label: "تحويلات المخزون", icon: Truck, permissionKey: "inventory.create" },
      { href: "/inventory-adjustments", label: "تسويات جردية", icon: SlidersHorizontal, permissionKey: "inventory.adjust_stock" },
    ],
  },
    {
    label: "المبيعات",
    icon: ShoppingCart,
    module: "Sales",
    permissionKey: "sales.view",
    subItems: [
      { href: "/sales", label: "لوحة المبيعات", icon: ShoppingCart, permissionKey: "sales.view" },
    ],
  },
  {
    label: "المشتريات",
    icon: Briefcase,
    module: "Purchases",
    permissionKey: "purchases.view",
    subItems: [
        { href: "/purchases", label: "لوحة المشتريات", icon: Briefcase, permissionKey: "purchases.view" },
    ]
  },
  { 
    label: "الموارد البشرية", 
    icon: Users, 
    module: "HR",
    permissionKey: "hr.view",
    subItems: [
        { href: "/hr-payroll", label: "الموظفين والرواتب", icon: Users, permissionKey: "hr.view"},
        { 
            label: "النماذج", icon: FolderOpen, permissionKey: "hr.view",
            subItems: [
                { href: "/hr-payroll?tab=forms&subTab=warningNotice", label: "لفت النظر", icon: FileWarning, permissionKey: "hr.view" },
                { href: "/hr-payroll?tab=forms&subTab=adminDecision", label: "القرارات الإدارية", icon: FileEdit, permissionKey: "hr.view" },
                { href: "/hr-payroll?tab=forms&subTab=resignation", label: "الاستقالات", icon: UserX, permissionKey: "hr.view" },
                { href: "/hr-payroll?tab=forms&subTab=disciplinaryWarning", label: "الإنذارات التأديبية", icon: ClipboardSignature, permissionKey: "hr.view" },
            ]
        },
    ]
  },
  { href: "/production", label: "الإنتاج", icon: Cog, module: "Production", permissionKey: "production.view" },
  { href: "/projects", label: "المشاريع", icon: GanttChartSquare, module: "Projects", permissionKey: "projects.view" },
  { href: "/pos", label: "نقاط البيع", icon: CreditCardIcon, module: "POS", permissionKey: "pos.use" },
  { href: "/reports", label: "التقارير والتحليل", icon: BarChart2, module: "BI", permissionKey: "reports.view_financial" },
  {
    label: "الإعدادات",
    icon: Settings,
    module: "Settings",
    permissionKey: "settings.view",
    subItems: [
      { href: "/settings", label: "الإعدادات العامة", icon: Settings, permissionKey: "settings.view" },
      { href: "/subscription", label: "الاشتراك والفوترة", icon: Shield, permissionKey: "settings.manage_subscription" },
    ]
  },
  {
    label: "إدارة النظام",
    icon: Settings2,
    module: "SystemAdministration",
    permissionKey: "admin.manage_tenants",
    subItems: [
      { href: "/system-administration/tenants", label: "إدارة الشركات (العملاء)", icon: Building2, permissionKey: "admin.manage_tenants" },
      { href: "/system-administration/modules", label: "إعدادات الوحدات والاشتراكات", icon: SlidersHorizontal, permissionKey: "admin.manage_modules" },
      { href: "/system-administration/subscription-invoices", label: "فواتير الاشتراكات", icon: FileText, permissionKey: "admin.manage_billing" },
      { href: "/system-administration/subscription-requests", label: "طلبات الاشتراك", icon: Mail, permissionKey: "admin.manage_requests" },
    ],
  },
  { href: "/help", label: "المساعدة", icon: CircleHelpIcon, module: "Help", permissionKey: "help.view" },
];

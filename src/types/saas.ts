
export interface Module {
  id: string;
  name: string; // Display name for the module
  key: string; // Unique key, e.g., 'Accounting', 'Inventory'
  description?: string;
  isRentable: boolean;
  prices: {
    [key: string]: { // Currency code like 'SAR', 'EGP', 'USD'
      monthly: number;
      yearly: number;
    }
  };
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  adminUserId?: string; // ID of the primary admin user for this tenant
  subscriptionId?: string;
  isActive: boolean;
  subscriptionEndDate?: Date | string; // Store as string if coming from Firestore Timestamp
  createdAt: Date | string;
  phone?: string;
  address?: string;
  vatNumber?: string;
}

export interface TenantSubscribedModule {
  moduleId: string; // Corresponds to Module.key
  subscribed: boolean;
  // specific settings for this module for this tenant can go here if needed
}

export interface TenantSubscription {
  id: string; // Could be same as tenantId or a separate subscription ID
  tenantId: string;
  modules: TenantSubscribedModule[];
  billingCycle: 'monthly' | 'yearly';
  startDate: Date | string;
  endDate: Date | string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled' | 'past_due';
  autoRenews: boolean;
}

export interface SubscriptionInvoiceItem {
  moduleId: string;
  moduleName: string;
  price: number;
  period: string; // e.g., "July 2024 - August 2024" or "Year 2024"
}

export interface SubscriptionInvoice {
  id: string;
  tenantId: string;
  issueDate: Date | string;
  dueDate: Date | string;
  paidDate?: Date | string | null;
  totalAmount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  items: SubscriptionInvoiceItem[];
  paymentMethod?: string;
  transactionId?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission keys like "module.action" e.g. "accounting.view"
}

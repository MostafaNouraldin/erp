import { pgTable, text, varchar, serial, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: varchar('id', { length: 256 }).primaryKey(),
  sku: varchar('sku', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 256 }).notNull(),
  unit: varchar('unit', { length: 256 }).notNull(),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(0),
  location: varchar('location', { length: 256 }),
  barcode: varchar('barcode', { length: 256 }),
  supplierId: varchar('supplier_id', { length: 256 }),
  image: text('image'),
  dataAiHint: varchar('data_ai_hint', { length: 256 }),
});

export const suppliers = pgTable('suppliers', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }),
    phone: varchar('phone', { length: 256 }),
    address: text('address'),
    vatNumber: varchar('vat_number', { length: 256 }),
    contactPerson: varchar('contact_person', { length: 256 }),
    notes: text('notes'),
});

export const categories = pgTable('categories', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    description: text('description'),
});

export const customers = pgTable('customers', {
  id: varchar('id', { length: 256 }).primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }),
  phone: varchar('phone', { length: 256 }),
  type: varchar('type', { length: 256 }),
  balance: numeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  address: text('address'),
  vatNumber: varchar('vat_number', { length: 256 }),
});

export const salesInvoices = pgTable('sales_invoices', {
  id: varchar('id', { length: 256 }).primaryKey(),
  orderId: varchar('order_id', { length: 256 }),
  customerId: varchar('customer_id', { length: 256 }).notNull(),
  date: timestamp('date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  numericTotalAmount: numeric('numeric_total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'مدفوع', 'غير مدفوع', 'متأخر'
  isDeferredPayment: boolean('is_deferred_payment').default(false),
  source: varchar('source', { length: 50 }),
  notes: text('notes'),
});

export const salesInvoiceItems = pgTable('sales_invoice_items', {
    id: serial('id').primaryKey(),
    invoiceId: varchar('invoice_id', { length: 256 }).notNull().references(() => salesInvoices.id),
    itemId: varchar('item_id', { length: 256 }).notNull(),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

export const bankAccounts = pgTable('bank_accounts', {
    id: varchar('id', { length: 256 }).primaryKey(),
    bankName: varchar('bank_name', { length: 256 }).notNull(),
    accountNumber: varchar('account_number', { length: 256 }).notNull(),
    iban: varchar('iban', { length: 256 }),
    accountType: varchar('account_type', { length: 50 }).notNull(), // "جارى", "توفير", "وديعة"
    currency: varchar('currency', { length: 10 }).notNull(), // "SAR", "USD", "EUR"
    balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
    branchName: varchar('branch_name', { length: 256 }),
    isActive: boolean('is_active').default(true).notNull(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 256 }).primaryKey(),
  supplierId: varchar('supplier_id', { length: 256 }).notNull().references(() => suppliers.id),
  date: timestamp('date').notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date').notNull(),
  notes: text('notes'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // "مسودة", "معتمد", ...
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  poId: varchar('po_id', { length: 256 }).notNull().references(() => purchaseOrders.id),
  itemId: varchar('item_id', { length: 256 }).notNull(),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

// Add other schemas from the application here as needed...

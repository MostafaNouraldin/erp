

import { pgTable, text, varchar, serial, numeric, integer, timestamp, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- System Administration & Settings Tables (MAIN SCHEMA) ---
export const tenants = pgTable('tenants', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    isActive: boolean('is_active').default(true),
    subscriptionEndDate: timestamp('subscription_end_date'),
    createdAt: timestamp('created_at').defaultNow(),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    vatNumber: varchar('vat_number', { length: 50 }),
});

export const mainRoles = pgTable('roles', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull().unique(),
    description: text('description'),
    permissions: jsonb('permissions').default('[]'),
});

export const mainUsers = pgTable('users', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    roleId: varchar('role_id', { length: 256 }).notNull().references(() => mainRoles.id),
    status: varchar('status', { length: 50 }).notNull().default('نشط'),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const mainUsersRelations = relations(mainUsers, ({ one }) => ({
  role: one(mainRoles, {
    fields: [mainUsers.roleId],
    references: [mainRoles.id],
  }),
}));


export const tenantModuleSubscriptions = pgTable('tenant_module_subscriptions', {
    id: serial('id').primaryKey(),
    tenantId: varchar('tenant_id', { length: 256 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    moduleKey: varchar('module_key', { length: 100 }).notNull(), // e.g., 'Accounting', 'Inventory'
    subscribed: boolean('subscribed').notNull().default(false),
}, (table) => {
  return {
    tenantModuleUniqueIdx: uniqueIndex('tenant_module_unique_idx').on(table.tenantId, table.moduleKey),
  };
});

export const subscriptionRequests = pgTable('subscription_requests', {
    id: serial('id').primaryKey(),
    companyName: varchar('company_name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    address: text('address'),
    vatNumber: varchar('vat_number', { length: 50 }),
    selectedModules: jsonb('selected_modules').notNull(), // Store as JSON array of module keys
    billingCycle: varchar('billing_cycle', { length: 50 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 100 }).notNull(),
    paymentProof: text('payment_proof').notNull(), // Store image as base64 data URI
    status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, approved, rejected
    createdAt: timestamp('created_at').defaultNow(),
});


// --- Core Tenant-Specific Tables ---

export const roles = pgTable('roles', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull().unique(),
    description: text('description'),
    permissions: jsonb('permissions').default('[]'),
});

export const users = pgTable('users', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).notNull().unique(),
    roleId: varchar('role_id', { length: 256 }).notNull().references(() => roles.id),
    status: varchar('status', { length: 50 }).notNull().default('نشط'),
    passwordHash: text('password_hash').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
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

export const employees = pgTable('employees', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    jobTitle: varchar('job_title', { length: 256 }).notNull(),
    department: varchar('department', { length: 256 }).notNull(),
    contractStartDate: timestamp('contract_start_date').notNull(),
    contractEndDate: timestamp('contract_end_date').notNull(),
    employmentType: varchar('employment_type', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).notNull(),
    email: varchar('email', { length: 256 }),
    phone: varchar('phone', { length: 50 }),
    avatarUrl: text('avatar_url'),
    dataAiHint: varchar('data_ai_hint', { length: 256 }),
    nationality: varchar('nationality', { length: 100 }),
    idNumber: varchar('id_number', { length: 50 }),
    bankName: varchar('bank_name', { length: 256 }),
    iban: varchar('iban', { length: 256 }),
    socialInsuranceNumber: varchar('social_insurance_number', { length: 100 }),
});

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
  supplierId: varchar('supplier_id', { length: 256 }).references(() => suppliers.id),
  image: text('image'),
  dataAiHint: varchar('data_ai_hint', { length: 256 }),
  isRawMaterial: boolean('is_raw_material').default(false),
});

export const categories = pgTable('categories', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    description: text('description'),
});

export const chartOfAccounts = pgTable('chart_of_accounts', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // "رئيسي", "فرعي", "تحليلي"
    parentId: varchar('parent_id', { length: 256 }),
    balance: numeric('balance', { precision: 15, scale: 2 }).default('0'),
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

// --- Sales & Purchases ---

export const quotations = pgTable('quotations', {
  id: varchar('id', { length: 256 }).primaryKey(),
  customerId: varchar('customer_id', { length: 256 }).notNull().references(() => customers.id),
  date: timestamp('date').notNull(),
  expiryDate: timestamp('expiry_date').notNull(),
  numericTotalAmount: numeric('numeric_total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  notes: text('notes'),
});

export const quotationItems = pgTable('quotation_items', {
    id: serial('id').primaryKey(),
    quoteId: varchar('quote_id', { length: 256 }).notNull().references(() => quotations.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

export const salesOrders = pgTable('sales_orders', {
  id: varchar('id', { length: 256 }).primaryKey(),
  quoteId: varchar('quote_id', { length: 256 }),
  customerId: varchar('customer_id', { length: 256 }).notNull().references(() => customers.id),
  date: timestamp('date').notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  numericTotalAmount: numeric('numeric_total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  notes: text('notes'),
});

export const salesOrderItems = pgTable('sales_order_items', {
    id: serial('id').primaryKey(),
    soId: varchar('so_id', { length: 256 }).notNull().references(() => salesOrders.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

export const salesInvoices = pgTable('sales_invoices', {
  id: varchar('id', { length: 256 }).primaryKey(),
  orderId: varchar('order_id', { length: 256 }),
  customerId: varchar('customer_id', { length: 256 }).notNull().references(() => customers.id),
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
    invoiceId: varchar('invoice_id', { length: 256 }).notNull().references(() => salesInvoices.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
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
  poId: varchar('po_id', { length: 256 }).notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
  description: text('description'),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

export const supplierInvoices = pgTable('supplier_invoices', {
    id: varchar('id', { length: 256 }).primaryKey(),
    poId: varchar('po_id', { length: 256 }),
    supplierId: varchar('supplier_id', { length: 256 }).notNull().references(() => suppliers.id),
    invoiceDate: timestamp('invoice_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 50 }).notNull(),
    notes: text('notes'),
});

export const supplierInvoiceItems = pgTable('supplier_invoice_items', {
    id: serial('id').primaryKey(),
    invoiceId: varchar('invoice_id', { length: 256 }).notNull().references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description'),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

// --- HR & Payroll ---

export const employeeAllowances = pgTable('employee_allowances', {
    id: serial('id').primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 256 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // ثابت, متغير, مرة واحدة
});

export const employeeDeductions = pgTable('employee_deductions', {
    id: serial('id').primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 256 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // ثابت, متغير, مرة واحدة
});

export const payrolls = pgTable('payrolls', {
  id: varchar('id', { length: 256 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  monthYear: varchar('month_year', { length: 50 }).notNull(),
  basicSalary: numeric('basic_salary', { precision: 10, scale: 2 }).notNull(),
  allowances: jsonb('allowances'),
  deductions: jsonb('deductions'),
  netSalary: numeric('net_salary', { precision: 10, scale: 2 }),
  paymentDate: timestamp('payment_date'),
  status: varchar('status', { length: 50 }).notNull().default('مسودة'),
  notes: text('notes'),
});

export const employeeSettlements = pgTable('employee_settlements', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id),
    settlementType: varchar('settlement_type', { length: 100 }).notNull(),
    accountId: varchar('account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    description: text('description').notNull(),
    paymentMethod: varchar('payment_method', { length: 100 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
    reference: varchar('reference', { length: 256 }),
});

export const attendanceRecords = pgTable('attendance_records', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    checkIn: timestamp('check_in'),
    checkOut: timestamp('check_out'),
    status: varchar('status', { length: 50 }).notNull().default('حاضر'),
    notes: text('notes'),
    hours: varchar('hours', { length: 10 }),
});

export const leaveRequests = pgTable('leave_requests', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    leaveType: varchar('leave_type', { length: 100 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 50 }).notNull().default('مقدمة'),
    days: integer('days'),
});

export const warningNotices = pgTable('warning_notices', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    reason: varchar('reason', { length: 256 }).notNull(),
    details: text('details').notNull(),
    issuingManager: varchar('issuing_manager', { length: 256 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const administrativeDecisions = pgTable('administrative_decisions', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    decisionDate: timestamp('decision_date').notNull(),
    decisionType: varchar('decision_type', { length: 256 }).notNull(),
    details: text('details').notNull(),
    issuingAuthority: varchar('issuing_authority', { length: 256 }).notNull(),
    effectiveDate: timestamp('effective_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const resignations = pgTable('resignations', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    submissionDate: timestamp('submission_date').notNull(),
    lastWorkingDate: timestamp('last_working_date').notNull(),
    reason: text('reason').notNull(),
    managerNotifiedDate: timestamp('manager_notified_date'),
    status: varchar('status', { length: 50 }).notNull().default('مقدمة'),
});

export const disciplinaryWarnings = pgTable('disciplinary_warnings', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    warningDate: timestamp('warning_date').notNull(),
    warningType: varchar('warning_type', { length: 100 }).notNull(),
    violationDetails: text('violation_details').notNull(),
    actionTaken: text('action_taken'),
    issuingManager: varchar('issuing_manager', { length: 256 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

// --- Accounting ---

export const journalEntries = pgTable('journal_entries', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    description: text('description').notNull(),
    totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // "مسودة", "مرحل"
    sourceModule: varchar('source_module', { length: 100 }),
    sourceDocumentId: varchar('source_document_id', { length: 256 }),
});

export const journalEntryLines = pgTable('journal_entry_lines', {
    id: serial('id').primaryKey(),
    journalEntryId: varchar('journal_entry_id', { length: 256 }).notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
    accountId: varchar('account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    debit: numeric('debit', { precision: 15, scale: 2 }).notNull().default('0'),
    credit: numeric('credit', { precision: 15, scale: 2 }).notNull().default('0'),
    description: text('description'),
});

export const checks = pgTable('checks', {
    id: varchar('id', { length: 256 }).primaryKey(),
    checkNumber: varchar('check_number', { length: 100 }).notNull(),
    issueDate: timestamp('issue_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    bankAccountId: varchar('bank_account_id', { length: 256 }).notNull().references(() => bankAccounts.id),
    beneficiaryName: varchar('beneficiary_name', { length: 256 }).notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('SAR'),
    purpose: text('purpose').notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('صادر'),
});

export const bankExpenses = pgTable('bank_expenses', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    bankAccountId: varchar('bank_account_id', { length: 256 }).notNull().references(() => bankAccounts.id),
    expenseAccountId: varchar('expense_account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    beneficiary: varchar('beneficiary', { length: 256 }).notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    referenceNumber: varchar('reference_number', { length: 256 }),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const bankReceipts = pgTable('bank_receipts', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    bankAccountId: varchar('bank_account_id', { length: 256 }).notNull().references(() => bankAccounts.id),
    revenueAccountId: varchar('revenue_account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    payerName: varchar('payer_name', { length: 256 }).notNull(),
    customerId: varchar('customer_id', { length: 256 }).references(() => customers.id),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    referenceNumber: varchar('reference_number', { length: 256 }),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const cashExpenses = pgTable('cash_expenses', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    cashAccountId: varchar('cash_account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    expenseAccountId: varchar('expense_account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    beneficiary: varchar('beneficiary', { length: 256 }).notNull(),
    description: text('description').notNull(),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    voucherNumber: varchar('voucher_number', { length: 256 }),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

// --- Projects ---

export const projects = pgTable('projects', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    clientId: varchar('client_id', { length: 256 }).notNull().references(() => customers.id),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    budget: numeric('budget', { precision: 15, scale: 2 }).notNull().default('0'),
    status: varchar('status', { length: 50 }).notNull().default('مخطط له'),
    progress: integer('progress').default(0),
    managerId: varchar('manager_id', { length: 256 }).notNull().references(() => employees.id),
    notes: text('notes'),
});

export const projectTasks = pgTable('project_tasks', {
    id: varchar('id', { length: 256 }).primaryKey(),
    projectId: varchar('project_id', { length: 256 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 256 }).notNull(),
    assigneeId: varchar('assignee_id', { length: 256 }).notNull().references(() => employees.id),
    dueDate: timestamp('due_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مخطط لها'),
    priority: varchar('priority', { length: 50 }).notNull().default('متوسطة'),
    notes: text('notes'),
});

export const projectResources = pgTable('project_resources', {
    id: varchar('id', { length: 256 }).primaryKey(),
    projectId: varchar('project_id', { length: 256 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id),
    role: varchar('role', { length: 256 }).notNull(),
    allocation: integer('allocation').default(100),
    notes: text('notes'),
});

export const projectBudgetItems = pgTable('project_budget_items', {
    id: varchar('id', { length: 256 }).primaryKey(),
    projectId: varchar('project_id', { length: 256 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
    item: varchar('item', { length: 256 }).notNull(),
    allocated: numeric('allocated', { precision: 15, scale: 2 }).notNull().default('0'),
    spent: numeric('spent', { precision: 15, scale: 2 }).notNull().default('0'),
    notes: text('notes'),
});

// --- Production ---

export const workOrders = pgTable('work_orders', {
    id: varchar('id', { length: 256 }).primaryKey(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    producedQuantity: integer('produced_quantity').default(0),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مجدول'),
    progress: integer('progress').default(0),
    notes: text('notes'),
});

export const workOrderProductionLogs = pgTable('work_order_production_logs', {
    id: serial('id').primaryKey(),
    workOrderId: varchar('work_order_id', { length: 256 }).notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    quantityProduced: integer('quantity_produced').notNull(),
    notes: text('notes'),
});

export const billsOfMaterial = pgTable('bills_of_material', {
    id: varchar('id', { length: 256 }).primaryKey(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    version: varchar('version', { length: 50 }).notNull(),
    lastUpdated: timestamp('last_updated'),
});

export const billOfMaterialItems = pgTable('bill_of_material_items', {
    id: serial('id').primaryKey(),
    bomId: varchar('bom_id', { length: 256 }).notNull().references(() => billsOfMaterial.id, { onDelete: 'cascade' }),
    materialId: varchar('material_id', { length: 256 }).notNull().references(() => products.id),
    quantity: numeric('quantity', { precision: 10, scale: 4 }).notNull(),
});

export const productionPlans = pgTable('production_plans', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
    notes: text('notes'),
});

export const qualityChecks = pgTable('quality_checks', {
    id: varchar('id', { length: 256 }).primaryKey(),
    workOrderId: varchar('work_order_id', { length: 256 }).notNull().references(() => workOrders.id),
    checkPoint: varchar('check_point', { length: 256 }).notNull(),
    result: varchar('result', { length: 50 }).notNull(),
    date: timestamp('date').notNull(),
    inspectorId: varchar('inspector_id', { length: 256 }).notNull(),
    notes: text('notes'),
});

// --- Inventory Control ---

export const warehouses = pgTable('warehouses', {
    id: varchar('id', { length: 256 }).primaryKey(),
    name: varchar('name', { length: 256 }).notNull(),
    location: text('location'),
});

export const stocktakes = pgTable('stocktakes', {
    id: varchar('id', { length: 256 }).primaryKey(),
    stocktakeDate: timestamp('stocktake_date').notNull(),
    warehouseId: varchar('warehouse_id', { length: 256 }).notNull().references(() => warehouses.id),
    responsiblePerson: varchar('responsible_person', { length: 256 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مجدول'),
    notes: text('notes'),
});


export const inventoryAdjustments = pgTable('inventory_adjustments', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    type: varchar('type', { length: 50 }).notNull(), // 'زيادة' or 'نقص'
    quantity: integer('quantity').notNull(),
    reason: varchar('reason', { length: 256 }).notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const inventoryTransfers = pgTable('inventory_transfers', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    fromWarehouseId: varchar('from_warehouse_id', { length: 256 }).notNull(),
    toWarehouseId: varchar('to_warehouse_id', { length: 256 }).notNull(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
    notes: text('notes'),
});

export const stockIssueVouchers = pgTable('stock_issue_vouchers', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    warehouseId: varchar('warehouse_id', { length: 256 }).notNull().references(() => warehouses.id),
    recipient: varchar('recipient', { length: 256 }).notNull(),
    reason: text('reason').notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
    issuedBy: varchar('issued_by', { length: 256 }),
});

export const stockIssueVoucherItems = pgTable('stock_issue_voucher_items', {
    id: serial('id').primaryKey(),
    voucherId: varchar('voucher_id', { length: 256 }).notNull().references(() => stockIssueVouchers.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantityIssued: integer('quantity_issued').notNull(),
    notes: text('notes'),
});

export const stockReceiptVouchers = pgTable('stock_receipt_vouchers', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    warehouseId: varchar('warehouse_id', { length: 256 }).notNull().references(() => warehouses.id),
    source: varchar('source', { length: 256 }).notNull(),
    reference: varchar('reference', { length: 256 }),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
    receivedBy: varchar('received_by', { length: 256 }),
});

export const stockReceiptVoucherItems = pgTable('stock_receipt_voucher_items', {
    id: serial('id').primaryKey(),
    voucherId: varchar('voucher_id', { length: 256 }).notNull().references(() => stockReceiptVouchers.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantityReceived: integer('quantity_received').notNull(),
    costPricePerUnit: numeric('cost_price_per_unit', { precision: 10, scale: 2 }),
    notes: text('notes'),
});


export const stockRequisitions = pgTable('stock_requisitions', {
    id: varchar('id', { length: 256 }).primaryKey(),
    requestDate: timestamp('request_date').notNull(),
    requestingDepartmentOrPerson: varchar('requesting_department_or_person', { length: 256 }).notNull(),
    requiredByDate: timestamp('required_by_date').notNull(),
    overallJustification: text('overall_justification'),
    status: varchar('status', { length: 50 }).notNull().default('جديد'),
    approvedBy: varchar('approved_by', { length: 256 }),
    approvalDate: timestamp('approval_date'),
});

export const stockRequisitionItems = pgTable('stock_requisition_items', {
    id: serial('id').primaryKey(),
    requisitionId: varchar('requisition_id', { length: 256 }).notNull().references(() => stockRequisitions.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantityRequested: integer('quantity_requested').notNull(),
    justification: text('justification'),
});

export const goodsReceivedNotes = pgTable('goods_received_notes', {
    id: varchar('id', { length: 256 }).primaryKey(),
    poId: varchar('po_id', { length: 256 }).notNull().references(() => purchaseOrders.id),
    supplierId: varchar('supplier_id', { length: 256 }).notNull().references(() => suppliers.id),
    grnDate: timestamp('grn_date').notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull(),
    receivedBy: varchar('received_by', { length: 256 }),
});

export const goodsReceivedNoteItems = pgTable('goods_received_note_items', {
    id: serial('id').primaryKey(),
    grnId: varchar('grn_id', { length: 256 }).notNull().references(() => goodsReceivedNotes.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description'),
    orderedQuantity: integer('ordered_quantity').notNull(),
    receivedQuantity: integer('received_quantity').notNull(),
    notes: text('notes'),
});


export const purchaseReturns = pgTable('purchase_returns', {
    id: varchar('id', { length: 256 }).primaryKey(),
    supplierId: varchar('supplier_id', { length: 256 }).notNull().references(() => suppliers.id),
    date: timestamp('date').notNull(),
    originalInvoiceId: varchar('original_invoice_id', { length: 256 }),
    notes: text('notes'),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'),
});

export const purchaseReturnItems = pgTable('purchase_return_items', {
    id: serial('id').primaryKey(),
    returnId: varchar('return_id', { length: 256 }).notNull().references(() => purchaseReturns.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull().references(() => products.id),
    description: text('description'),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    reason: text('reason'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

// --- Relations ---
export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.poId],
    references: [purchaseOrders.id],
  }),
}));

export const goodsReceivedNotesRelations = relations(goodsReceivedNotes, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [goodsReceivedNotes.poId],
    references: [purchaseOrders.id],
  }),
  items: many(goodsReceivedNoteItems),
}));

export const goodsReceivedNoteItemsRelations = relations(goodsReceivedNoteItems, ({ one }) => ({
  grn: one(goodsReceivedNotes, {
    fields: [goodsReceivedNoteItems.grnId],
    references: [goodsReceivedNotes.id],
  }),
}));


export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
    lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
    journalEntry: one(journalEntries, {
        fields: [journalEntryLines.journalEntryId],
        references: [journalEntries.id],
    }),
}));

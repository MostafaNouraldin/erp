
import { pgTable, text, varchar, serial, numeric, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// --- Core Tables ---

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

// --- Transactional Tables ---

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
    itemId: varchar('item_id', { length: 256 }).notNull(),
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
  itemId: varchar('item_id', { length: 256 }).notNull(),
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
    status: varchar('status', { length: 50 }).notNull(), // "غير مدفوع", "مدفوع جزئياً", "مدفوع", "متأخر"
    notes: text('notes'),
});

export const supplierInvoiceItems = pgTable('supplier_invoice_items', {
    id: serial('id').primaryKey(),
    invoiceId: varchar('invoice_id', { length: 256 }).notNull().references(() => supplierInvoices.id, { onDelete: 'cascade' }),
    itemId: varchar('item_id', { length: 256 }).notNull(),
    description: text('description'),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
});

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


// --- HR & Payroll Tables ---

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

export const employeeSettlements = pgTable('employee_settlements', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id),
    settlementType: varchar('settlement_type', { length: 100 }).notNull(), // "سلفة", "قرض", "تسوية عهدة", "خصم", "مكافأة"
    accountId: varchar('account_id', { length: 256 }).notNull().references(() => chartOfAccounts.id),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    description: text('description').notNull(),
    paymentMethod: varchar('payment_method', { length: 100 }).notNull(), // "نقدي", "راتب", "تحويل بنكي"
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "معتمدة", "مسددة بالكامل", "ملغاة"
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
});

export const leaveRequests = pgTable('leave_requests', {
    id: varchar('id', { length: 256 }).primaryKey(),
    employeeId: varchar('employee_id', { length: 256 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
    leaveType: varchar('leave_type', { length: 100 }).notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 50 }).notNull().default('مقدمة'),
});

// --- Projects Tables ---

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

// --- Production Tables ---

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

// --- Inventory Control Tables ---

export const inventoryAdjustments = pgTable('inventory_adjustments', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    type: varchar('type', { length: 50 }).notNull(), // 'زيادة' or 'نقص'
    quantity: integer('quantity').notNull(),
    reason: varchar('reason', { length: 256 }).notNull(),
    notes: text('notes'),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "معتمدة"
});

export const inventoryTransfers = pgTable('inventory_transfers', {
    id: varchar('id', { length: 256 }).primaryKey(),
    date: timestamp('date').notNull(),
    fromWarehouseId: varchar('from_warehouse_id', { length: 256 }).notNull(),
    toWarehouseId: varchar('to_warehouse_id', { length: 256 }).notNull(),
    productId: varchar('product_id', { length: 256 }).notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "قيد النقل", "مكتملة"
    notes: text('notes'),
});


// --- Other Financial Transaction Tables ---

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
    status: varchar('status', { length: 50 }).notNull().default('صادر'), // "صادر", "مسدد", "ملغي", "مرتجع"
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
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "مرحل"
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
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "مرحل"
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
    status: varchar('status', { length: 50 }).notNull().default('مسودة'), // "مسودة", "مرحل"
});

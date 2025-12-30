
-- Drop schemas if they exist to ensure a clean slate. 
-- Use CASCADE to remove all objects within the schemas (tables, functions, etc.).
DROP SCHEMA IF EXISTS main CASCADE;
DROP SCHEMA IF EXISTS tenant_T001 CASCADE;


-- Create the main schema for system-level tables
CREATE SCHEMA main;

-- Set the search path to main for the following operations
SET search_path TO main;

-- =================================================================
-- MAIN SCHEMA TABLES (For System Administration)
-- =================================================================

-- Tenants Table: Stores information about each company/tenant using the system.
CREATE TABLE IF NOT EXISTS main.tenants (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50)
);

-- Roles Table: Defines roles for system administrators.
CREATE TABLE IF NOT EXISTS main.roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

-- Users Table: Stores system administrator accounts.
CREATE TABLE IF NOT EXISTS main.users (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    role_id VARCHAR(256) NOT NULL REFERENCES main.roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'نشط',
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Module Subscriptions Table
CREATE TABLE IF NOT EXISTS main.tenant_module_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(256) NOT NULL REFERENCES main.tenants(id) ON DELETE CASCADE,
    module_key VARCHAR(100) NOT NULL,
    subscribed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (tenant_id, module_key)
);

-- Subscription Requests Table
CREATE TABLE IF NOT EXISTS main.subscription_requests (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(50),
    selected_modules JSONB NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_proof TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);


-- =================================================================
-- DEFAULT DATA for MAIN SCHEMA
-- =================================================================

-- Insert Super Admin Role
INSERT INTO main.roles (id, name, description, permissions)
VALUES ('ROLE_SUPER_ADMIN', 'Super Admin', 'Full system access for administration.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert Super Admin User
INSERT INTO main.users (id, name, email, role_id, password_hash)
VALUES ('superadmin01', 'Super Admin', 'superadmin@example.com', 'ROLE_SUPER_ADMIN', 'hashed_superpassword')
ON CONFLICT (id) DO NOTHING;

-- Insert the default tenant T001
INSERT INTO main.tenants (id, name, email, is_active, subscription_end_date)
VALUES ('T001', 'Al-Mustaqbal Demo Co.', 'manager@example.com', true, NOW() + INTERVAL '1 year')
ON CONFLICT (id) DO NOTHING;

-- Grant subscriptions for the default tenant
INSERT INTO main.tenant_module_subscriptions (tenant_id, module_key, subscribed) VALUES
('T001', 'Dashboard', true), ('T001', 'Accounting', true), ('T001', 'Inventory', true),
('T001', 'Sales', true), ('T001', 'Purchases', true), ('T001', 'HR', true),
('T001', 'Production', true), ('T001', 'Projects', true), ('T001', 'POS', true),
('T001', 'BI', true), ('T001', 'Settings', true), ('T001', 'Help', true)
ON CONFLICT (tenant_id, module_key) DO NOTHING;


-- =================================================================
-- TENANT SCHEMA (For Tenant T001)
-- =================================================================

-- Create the schema for the default tenant
CREATE SCHEMA tenant_T001;

-- Set the search path to the new tenant schema
SET search_path TO tenant_T001;

-- All subsequent tables will be created in the 'tenant_T001' schema.

CREATE TABLE IF NOT EXISTS tenant_T001.roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS tenant_T001.users (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    role_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'نشط',
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_T001.customers (
  id VARCHAR(256) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  email VARCHAR(256),
  phone VARCHAR(256),
  type VARCHAR(256),
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  address TEXT,
  vat_number VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS tenant_T001.suppliers (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256),
    phone VARCHAR(256),
    address TEXT,
    vat_number VARCHAR(256),
    contact_person VARCHAR(256),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.employees (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    job_title VARCHAR(256) NOT NULL,
    department VARCHAR(256) NOT NULL,
    contract_start_date TIMESTAMP NOT NULL,
    contract_end_date TIMESTAMP NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL,
    email VARCHAR(256),
    phone VARCHAR(50),
    avatar_url TEXT,
    data_ai_hint VARCHAR(256),
    nationality VARCHAR(100),
    id_number VARCHAR(50),
    bank_name VARCHAR(256),
    iban VARCHAR(256),
    social_insurance_number VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS tenant_T001.products (
  id VARCHAR(256) PRIMARY KEY,
  sku VARCHAR(256) NOT NULL UNIQUE,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  category VARCHAR(256) NOT NULL,
  unit VARCHAR(256) NOT NULL,
  cost_price NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(256),
  barcode VARCHAR(256),
  supplier_id VARCHAR(256) REFERENCES tenant_T001.suppliers(id),
  image TEXT,
  data_ai_hint VARCHAR(256),
  is_raw_material BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS tenant_T001.categories (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.chart_of_accounts (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id VARCHAR(256),
    balance NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tenant_T001.bank_accounts (
    id VARCHAR(256) PRIMARY KEY,
    bank_name VARCHAR(256) NOT NULL,
    account_number VARCHAR(256) NOT NULL,
    iban VARCHAR(256),
    account_type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    branch_name VARCHAR(256),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS tenant_T001.quotations (
  id VARCHAR(256) PRIMARY KEY,
  customer_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.customers(id),
  date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  numeric_total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.quotation_items (
    id SERIAL PRIMARY KEY,
    quote_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.quotations(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.sales_orders (
  id VARCHAR(256) PRIMARY KEY,
  quote_id VARCHAR(256),
  customer_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.customers(id),
  date TIMESTAMP NOT NULL,
  delivery_date TIMESTAMP NOT NULL,
  numeric_total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.sales_order_items (
    id SERIAL PRIMARY KEY,
    so_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.sales_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.sales_invoices (
  id VARCHAR(256) PRIMARY KEY,
  order_id VARCHAR(256),
  customer_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.customers(id),
  date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  numeric_total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  is_deferred_payment BOOLEAN DEFAULT false,
  source VARCHAR(50),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.sales_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.sales_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.purchase_orders (
  id VARCHAR(256) PRIMARY KEY,
  supplier_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.suppliers(id),
  date TIMESTAMP NOT NULL,
  expected_delivery_date TIMESTAMP NOT NULL,
  notes TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.purchase_order_items (
  id SERIAL PRIMARY KEY,
  po_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.purchase_orders(id) ON DELETE CASCADE,
  item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.supplier_invoices (
    id VARCHAR(256) PRIMARY KEY,
    po_id VARCHAR(256),
    supplier_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.suppliers(id),
    invoice_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.supplier_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.supplier_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.employee_allowances (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.employee_deductions (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.payrolls (
  id VARCHAR(256) PRIMARY KEY,
  employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
  month_year VARCHAR(50) NOT NULL,
  basic_salary NUMERIC(10, 2) NOT NULL,
  allowances JSONB,
  deductions JSONB,
  net_salary NUMERIC(10, 2),
  payment_date TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.employee_settlements (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id),
    settlement_type VARCHAR(100) NOT NULL,
    account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    reference VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS tenant_T001.attendance_records (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'حاضر',
    notes TEXT,
    hours VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS tenant_T001.leave_requests (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'مقدمة',
    days INTEGER
);

CREATE TABLE IF NOT EXISTS tenant_T001.warning_notices (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    reason VARCHAR(256) NOT NULL,
    details TEXT NOT NULL,
    issuing_manager VARCHAR(256) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.administrative_decisions (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    decision_date TIMESTAMP NOT NULL,
    decision_type VARCHAR(256) NOT NULL,
    details TEXT NOT NULL,
    issuing_authority VARCHAR(256) NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.resignations (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    submission_date TIMESTAMP NOT NULL,
    last_working_date TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    manager_notified_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'مقدمة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.disciplinary_warnings (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id) ON DELETE CASCADE,
    warning_date TIMESTAMP NOT NULL,
    warning_type VARCHAR(100) NOT NULL,
    violation_details TEXT NOT NULL,
    action_taken TEXT,
    issuing_manager VARCHAR(256) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.journal_entries (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    source_module VARCHAR(100),
    source_document_id VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS tenant_T001.journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.checks (
    id VARCHAR(256) PRIMARY KEY,
    check_number VARCHAR(100) NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.bank_accounts(id),
    beneficiary_name VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
    purpose TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'صادر'
);

CREATE TABLE IF NOT EXISTS tenant_T001.bank_expenses (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.bank_accounts(id),
    expense_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    beneficiary VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reference_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.bank_receipts (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.bank_accounts(id),
    revenue_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    payer_name VARCHAR(256) NOT NULL,
    customer_id VARCHAR(256) REFERENCES tenant_T001.customers(id),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reference_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.cash_expenses (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    cash_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    expense_account_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.chart_of_accounts(id),
    beneficiary VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    voucher_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.projects (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    client_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.customers(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'مخطط له',
    progress INTEGER DEFAULT 0,
    manager_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.project_tasks (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.projects(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    assignee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id),
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مخطط لها',
    priority VARCHAR(50) NOT NULL DEFAULT 'متوسطة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.project_resources (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.projects(id) ON DELETE CASCADE,
    employee_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.employees(id),
    role VARCHAR(256) NOT NULL,
    allocation INTEGER DEFAULT 100,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.project_budget_items (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.projects(id) ON DELETE CASCADE,
    item VARCHAR(256) NOT NULL,
    allocated NUMERIC(15, 2) NOT NULL DEFAULT 0,
    spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.work_orders (
    id VARCHAR(256) PRIMARY KEY,
    product_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مجدول',
    progress INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.work_order_production_logs (
    id SERIAL PRIMARY KEY,
    work_order_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.work_orders(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    quantity_produced INTEGER NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.bills_of_material (
    id VARCHAR(256) PRIMARY KEY,
    product_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    version VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_T001.bill_of_material_items (
    id SERIAL PRIMARY KEY,
    bom_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.bills_of_material(id) ON DELETE CASCADE,
    material_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    quantity NUMERIC(10, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_T001.production_plans (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.quality_checks (
    id VARCHAR(256) PRIMARY KEY,
    work_order_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.work_orders(id),
    check_point VARCHAR(256) NOT NULL,
    result VARCHAR(50) NOT NULL,
    date TIMESTAMP NOT NULL,
    inspector_id VARCHAR(256) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.inventory_adjustments (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    product_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    reason VARCHAR(256) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.inventory_transfers (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    from_warehouse_id VARCHAR(256) NOT NULL,
    to_warehouse_id VARCHAR(256) NOT NULL,
    product_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.goods_received_notes (
    id VARCHAR(256) PRIMARY KEY,
    po_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.purchase_orders(id),
    supplier_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.suppliers(id),
    grn_date TIMESTAMP NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    received_by VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS tenant_T001.goods_received_note_items (
    id SERIAL PRIMARY KEY,
    grn_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.goods_received_notes(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT,
    ordered_quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tenant_T001.purchase_returns (
    id VARCHAR(256) PRIMARY KEY,
    supplier_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.suppliers(id),
    date TIMESTAMP NOT NULL,
    original_invoice_id VARCHAR(256),
    notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS tenant_T001.purchase_return_items (
    id SERIAL PRIMARY KEY,
    return_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.purchase_returns(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES tenant_T001.products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    total NUMERIC(10, 2) NOT NULL
);

-- =================================================================
-- DEFAULT DATA for TENANT T001
-- =================================================================

INSERT INTO tenant_T001.roles (id, name, description, permissions) VALUES
('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles"]'::jsonb),
('ROLE002', 'محاسب', 'صلاحيات على وحدات الحسابات والمالية.', '["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"]'::jsonb),
('ROLE003', 'موظف مبيعات', 'صلاحيات على وحدة المبيعات وعروض الأسعار.', '["sales.view", "sales.create", "reports.view_sales"]'::jsonb),
('ROLE004', 'مدير مخزون', 'صلاحيات على وحدة المخزون والمستودعات.', '["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_T001.users (id, name, email, role_id, password_hash) VALUES
('user001', 'مدير الشركة', 'manager@example.com', 'ROLE001', 'hashed_password'),
('user002', 'المحاسب العام', 'accountant@example.com', 'ROLE002', 'hashed_password')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_T001.chart_of_accounts (id, name, type, parent_id) VALUES
('1', 'الأصول', 'رئيسي', NULL),
('101', 'الأصول المتداولة', 'فرعي', '1'),
('1011', 'الصندوق', 'تحليلي', '101'),
('1012', 'البنوك', 'تحليلي', '101'),
('1200', 'العملاء (الذمم المدينة)', 'تحليلي', '101'),
('2', 'الخصوم', 'رئيسي', NULL),
('201', 'الخصوم المتداولة', 'فرعي', '2'),
('2010', 'الموردون (الذمم الدائنة)', 'تحليلي', '201'),
('2100', 'رواتب مستحقة الدفع', 'تحليلي', '201'),
('3', 'حقوق الملكية', 'رئيسي', NULL),
('4', 'الإيرادات', 'رئيسي', NULL),
('4010', 'إيراد المبيعات', 'تحليلي', '4'),
('5', 'المصروفات', 'رئيسي', NULL),
('5100', 'مصروفات عمومية وإدارية', 'تحليلي', '5'),
('5101', 'مصروف رواتب', 'تحليلي', '5'),
('5102', 'مصروف كهرباء', 'تحليلي', '5')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_T001.suppliers (id, name, email, phone) VALUES
('SUP001', 'المورد التقني الأول', 'contact@techsupplier.com', '011-555-1234'),
('SUP002', 'شركة الأثاث الحديث', 'sales@modernfurniture.com', '012-555-5678')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_T001.customers (id, name, email, phone, balance) VALUES
('CUST001', 'العميل الاستراتيجي الذهبي', 'ceo@goldencorp.com', '0501234567', '15000'),
('CUST002', 'شركة المشاريع المبتكرة', 'manager@innovate.com', '0557654321', '8500')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_T001.products (id, sku, name, category, unit, cost_price, selling_price, quantity, reorder_level) VALUES
('ITEM001', 'LP-DELL-XPS15', 'لابتوب Dell XPS 15', 'أجهزة إلكترونية', 'قطعة', 5800.00, 6500.00, 50, 10),
('ITEM002', 'PR-HP-LJ', 'طابعة HP LaserJet', 'أجهزة مكتبية', 'قطعة', 1000.00, 1200.00, 30, 5),
('ITEM003', 'PA-A4-BOX', 'صندوق ورق A4', 'أدوات مكتبية', 'صندوق', 100.00, 120.00, 200, 50),
('ITEM004', 'SERV001', 'خدمة استشارية A', 'خدمات', 'ساعة', 0.00, 250.00, 9999, 0),
('ITEM005', 'KB-LOGI-MX', 'كيبورد Logitech MX', 'ملحقات كمبيوتر', 'قطعة', 350.00, 450.00, 100, 20)
ON CONFLICT (id) DO NOTHING;


INSERT INTO tenant_T001.employees (id, name, job_title, department, contract_start_date, contract_end_date, employment_type, status, basic_salary, email, phone) VALUES
('EMP001', 'أحمد محمود', 'مدير مبيعات', 'قسم المبيعات', '2022-01-01', '2025-01-01', 'دوام كامل', 'نشط', 12000.00, 'ahmed.m@example.com', '0512345678'),
('EMP002', 'سارة عبدالله', 'أخصائية تسويق', 'قسم التسويق', '2023-03-15', '2026-03-15', 'دوام كامل', 'نشط', 8500.00, 'sara.a@example.com', '0598765432')
ON CONFLICT (id) DO NOTHING;

-- Reset search path to default
RESET search_path;

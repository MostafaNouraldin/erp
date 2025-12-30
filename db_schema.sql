
-- This script is designed to be idempotent, meaning it can be run multiple times safely.
-- It sets up the main database for multi-tenancy and also creates and seeds a default
-- tenant database (tenant_T001) for demonstration purposes.

-- ========= MAIN DATABASE SETUP =========
-- This section should be run against your main PostgreSQL database.

-- Create main schema for system-wide tables if it doesn't exist
CREATE SCHEMA IF NOT EXISTS main;
SET search_path TO main, public;

-- Table for Tenants
CREATE TABLE IF NOT EXISTS tenants (
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

-- Table for system-level Roles (e.g., Super Admin)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

-- Table for system-level Users (Super Admins)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    role_id VARCHAR(256) NOT NULL REFERENCES roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'نشط',
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table for Tenant Module Subscriptions
CREATE TABLE IF NOT EXISTS tenant_module_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(256) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_key VARCHAR(100) NOT NULL,
    subscribed BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (tenant_id, module_key)
);

-- Table for new subscription requests
CREATE TABLE IF NOT EXISTS subscription_requests (
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


-- Seed default Super Admin Role and User
-- Using ON CONFLICT to avoid errors on re-runs.
INSERT INTO roles (id, name, description, permissions)
VALUES ('ROLE_SUPER_ADMIN', 'Super Admin', 'صلاحيات كاملة على النظام وإدارة الشركات.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, role_id, password_hash)
VALUES ('superadmin01', 'Super Admin', 'superadmin@example.com', 'ROLE_SUPER_ADMIN', 'hashed_superpassword')
ON CONFLICT (email) DO NOTHING;


-- ========= DEFAULT TENANT DATABASE SETUP (tenant_T001) =========
-- This section creates and populates the database for the default tenant 'T001'.
-- In a real production environment, this might be handled by a separate provisioning script.
-- For Supabase, you need to run this manually or create a function.

-- Note: The following command to create a database might not work in all SQL editors (like Supabase's).
-- If it fails, you must create the database 'tenant_T001' manually through your hosting provider's UI.
SELECT 'CREATE DATABASE tenant_T001'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tenant_T001')\gexec

-- After creating the database, you must connect to it to run the rest of the script.
-- The following is pseudo-code for a command-line tool like psql.
-- \c tenant_T001

-- The Drizzle ORM expects tables to be in the 'public' schema by default for tenants, so we don't create a 'tenant' schema.
-- If you were to connect to the `tenant_T001` database, you would then run the following table creation statements.

-- --- Core Tenant-Specific Tables ---

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256) NOT NULL UNIQUE,
    role_id VARCHAR(256) NOT NULL REFERENCES roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'نشط',
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256),
    phone VARCHAR(256),
    type VARCHAR(256),
    balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
    address TEXT,
    vat_number VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    email VARCHAR(256),
    phone VARCHAR(256),
    address TEXT,
    vat_number VARCHAR(256),
    contact_person VARCHAR(256),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS employees (
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

CREATE TABLE IF NOT EXISTS products (
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
    supplier_id VARCHAR(256) REFERENCES suppliers(id),
    image TEXT,
    data_ai_hint VARCHAR(256),
    is_raw_material BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id VARCHAR(256),
    balance NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bank_accounts (
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

-- --- Sales & Purchases ---
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(256) PRIMARY KEY,
    customer_id VARCHAR(256) NOT NULL REFERENCES customers(id),
    date TIMESTAMP NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    numeric_total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quote_id VARCHAR(256) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(256) PRIMARY KEY,
    quote_id VARCHAR(256),
    customer_id VARCHAR(256) NOT NULL REFERENCES customers(id),
    date TIMESTAMP NOT NULL,
    delivery_date TIMESTAMP NOT NULL,
    numeric_total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    so_id VARCHAR(256) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_invoices (
    id VARCHAR(256) PRIMARY KEY,
    order_id VARCHAR(256),
    customer_id VARCHAR(256) NOT NULL REFERENCES customers(id),
    date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    numeric_total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_deferred_payment BOOLEAN DEFAULT false,
    source VARCHAR(50),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(256) NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(256) PRIMARY KEY,
    supplier_id VARCHAR(256) NOT NULL REFERENCES suppliers(id),
    date TIMESTAMP NOT NULL,
    expected_delivery_date TIMESTAMP NOT NULL,
    notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL
);
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id VARCHAR(256) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_invoices (
    id VARCHAR(256) PRIMARY KEY,
    po_id VARCHAR(256),
    supplier_id VARCHAR(256) NOT NULL REFERENCES suppliers(id),
    invoice_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(256) NOT NULL REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL
);

-- --- HR & Payroll ---
CREATE TABLE IF NOT EXISTS employee_allowances (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_deductions (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS payrolls (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month_year VARCHAR(50) NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL,
    allowances JSONB,
    deductions JSONB,
    net_salary NUMERIC(10, 2),
    payment_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS employee_settlements (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id),
    settlement_type VARCHAR(100) NOT NULL,
    account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    reference VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'حاضر',
    notes TEXT,
    hours VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'مقدمة',
    days INTEGER
);

CREATE TABLE IF NOT EXISTS warning_notices (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    reason VARCHAR(256) NOT NULL,
    details TEXT NOT NULL,
    issuing_manager VARCHAR(256) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS administrative_decisions (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    decision_date TIMESTAMP NOT NULL,
    decision_type VARCHAR(256) NOT NULL,
    details TEXT NOT NULL,
    issuing_authority VARCHAR(256) NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS resignations (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    submission_date TIMESTAMP NOT NULL,
    last_working_date TIMESTAMP NOT NULL,
    reason TEXT NOT NULL,
    manager_notified_date TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'مقدمة'
);

CREATE TABLE IF NOT EXISTS disciplinary_warnings (
    id VARCHAR(256) PRIMARY KEY,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    warning_date TIMESTAMP NOT NULL,
    warning_type VARCHAR(100) NOT NULL,
    violation_details TEXT NOT NULL,
    action_taken TEXT,
    issuing_manager VARCHAR(256) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

-- --- Accounting ---
CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    source_module VARCHAR(100),
    source_document_id VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id VARCHAR(256) NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS checks (
    id VARCHAR(256) PRIMARY KEY,
    check_number VARCHAR(100) NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES bank_accounts(id),
    beneficiary_name VARCHAR(256) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'SAR',
    purpose TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'صادر'
);

CREATE TABLE IF NOT EXISTS bank_expenses (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES bank_accounts(id),
    expense_account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    beneficiary VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reference_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS bank_receipts (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    bank_account_id VARCHAR(256) NOT NULL REFERENCES bank_accounts(id),
    revenue_account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    payer_name VARCHAR(256) NOT NULL,
    customer_id VARCHAR(256) REFERENCES customers(id),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    reference_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS cash_expenses (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    cash_account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    expense_account_id VARCHAR(256) NOT NULL REFERENCES chart_of_accounts(id),
    beneficiary VARCHAR(256) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    voucher_number VARCHAR(256),
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);


-- --- Projects ---
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    client_id VARCHAR(256) NOT NULL REFERENCES customers(id),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'مخطط له',
    progress INTEGER DEFAULT 0,
    manager_id VARCHAR(256) NOT NULL REFERENCES employees(id),
    notes TEXT
);
CREATE TABLE IF NOT EXISTS project_tasks (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(256) NOT NULL,
    assignee_id VARCHAR(256) NOT NULL REFERENCES employees(id),
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مخطط لها',
    priority VARCHAR(50) NOT NULL DEFAULT 'متوسطة',
    notes TEXT
);
CREATE TABLE IF NOT EXISTS project_resources (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id VARCHAR(256) NOT NULL REFERENCES employees(id),
    role VARCHAR(256) NOT NULL,
    allocation INTEGER DEFAULT 100,
    notes TEXT
);
CREATE TABLE IF NOT EXISTS project_budget_items (
    id VARCHAR(256) PRIMARY KEY,
    project_id VARCHAR(256) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    item VARCHAR(256) NOT NULL,
    allocated NUMERIC(15, 2) NOT NULL DEFAULT 0,
    spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT
);

-- --- Production ---
CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(256) PRIMARY KEY,
    product_id VARCHAR(256) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    produced_quantity INTEGER DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مجدول',
    progress INTEGER DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS work_order_production_logs (
    id SERIAL PRIMARY KEY,
    work_order_id VARCHAR(256) NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    quantity_produced INTEGER NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS bills_of_material (
    id VARCHAR(256) PRIMARY KEY,
    product_id VARCHAR(256) NOT NULL REFERENCES products(id),
    version VARCHAR(50) NOT NULL,
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_of_material_items (
    id SERIAL PRIMARY KEY,
    bom_id VARCHAR(256) NOT NULL REFERENCES bills_of_material(id) ON DELETE CASCADE,
    material_id VARCHAR(256) NOT NULL REFERENCES products(id),
    quantity NUMERIC(10, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS production_plans (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS quality_checks (
    id VARCHAR(256) PRIMARY KEY,
    work_order_id VARCHAR(256) NOT NULL REFERENCES work_orders(id),
    check_point VARCHAR(256) NOT NULL,
    result VARCHAR(50) NOT NULL,
    date TIMESTAMP NOT NULL,
    inspector_id VARCHAR(256) NOT NULL,
    notes TEXT
);

-- --- Inventory Control ---
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    product_id VARCHAR(256) NOT NULL REFERENCES products(id),
    type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    reason VARCHAR(256) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS inventory_transfers (
    id VARCHAR(256) PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    from_warehouse_id VARCHAR(256) NOT NULL,
    to_warehouse_id VARCHAR(256) NOT NULL,
    product_id VARCHAR(256) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS goods_received_notes (
    id VARCHAR(256) PRIMARY KEY,
    po_id VARCHAR(256) NOT NULL REFERENCES purchase_orders(id),
    supplier_id VARCHAR(256) NOT NULL REFERENCES suppliers(id),
    grn_date TIMESTAMP NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    received_by VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS goods_received_note_items (
    id SERIAL PRIMARY KEY,
    grn_id VARCHAR(256) NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT,
    ordered_quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS purchase_returns (
    id VARCHAR(256) PRIMARY KEY,
    supplier_id VARCHAR(256) NOT NULL REFERENCES suppliers(id),
    date TIMESTAMP NOT NULL,
    original_invoice_id VARCHAR(256),
    notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
    id SERIAL PRIMARY KEY,
    return_id VARCHAR(256) NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    item_id VARCHAR(256) NOT NULL REFERENCES products(id),
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    total NUMERIC(10, 2) NOT NULL
);

-- ========= SEEDING DEFAULT TENANT (T001) DATA =========
-- This should be run AFTER connecting to the 'tenant_T001' database.

-- Seed Tenant Roles
INSERT INTO roles (id, name, description, permissions) VALUES
('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use"]'),
('ROLE002', 'محاسب', 'صلاحيات على وحدات الحسابات والمالية.', '["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"]'),
('ROLE003', 'موظف مبيعات', 'صلاحيات على وحدة المبيعات وعروض الأسعار.', '["sales.view", "sales.create", "reports.view_sales"]'),
('ROLE004', 'مدير مخزون', 'صلاحيات على وحدة المخزون والمستودعات.', '["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock"]')
ON CONFLICT (id) DO NOTHING;

-- Seed Tenant Users
INSERT INTO users (id, name, email, role_id, password_hash) VALUES
('user001', 'أحمد محمود (مدير)', 'manager@example.com', 'ROLE001', 'hashed_password'),
('user002', 'سارة خالد (محاسبة)', 'accountant@example.com', 'ROLE002', 'hashed_password'),
('user003', 'علي محمد (مبيعات)', 'sales@example.com', 'ROLE003', 'hashed_password')
ON CONFLICT (email) DO NOTHING;

-- Seed Chart of Accounts
INSERT INTO chart_of_accounts (id, name, type, parent_id, balance) VALUES
('1', 'الأصول', 'رئيسي', NULL, '164000.00'),
('101', 'الأصول المتداولة', 'فرعي', '1', '164000.00'),
('1011', 'صندوق', 'تحليلي', '101', '50000.00'),
('1012', 'بنك', 'تحليلي', '101', '100000.00'),
('1013', 'نقاط البيع', 'تحليلي', '101', '0.00'),
('1200', 'العملاء (الذمم المدينة)', 'تحليلي', '101', '14000.00'),
('2', 'الخصوم', 'رئيسي', NULL, '0.00'),
('2010', 'الموردون (الذمم الدائنة)', 'تحليلي', '2', '0.00'),
('2100', 'رواتب مستحقة الدفع', 'تحليلي', '2', '0.00'),
('3', 'حقوق الملكية', 'رئيسي', NULL, '0.00'),
('4', 'الإيرادات', 'رئيسي', NULL, '-15000.00'),
('4010', 'إيرادات المبيعات', 'تحليلي', '4', '-15000.00'),
('5', 'المصروفات', 'رئيسي', NULL, '1000.00'),
('5010', 'مصروفات تسويق', 'تحليلي', '5', '500.00'),
('5020', 'مصروفات إدارية', 'تحليلي', '5', '500.00')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, parent_id = EXCLUDED.parent_id;

-- Seed Products
INSERT INTO products (id, sku, name, description, category, unit, cost_price, selling_price, quantity, reorder_level) VALUES
('ITEM001', 'LP-DELL-XPS15', 'لابتوب Dell XPS 15', 'لابتوب عالي الأداء للمصممين', 'أجهزة إلكترونية', 'قطعة', 5800.00, 6500.00, 10, 5),
('ITEM002', 'PRN-HP-LJ', 'طابعة HP LaserJet', 'طابعة ليزر للمكاتب', 'أجهزة إلكترونية', 'قطعة', 1000.00, 1200.00, 15, 3),
('ITEM003', 'PAP-A4-BOX', 'ورق طباعة A4', 'صندوق ورق طباعة A4 عالي الجودة', 'مستلزمات مكتبية', 'صندوق', 100.00, 120.00, 50, 10)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, selling_price = EXCLUDED.selling_price;

-- Seed Customers
INSERT INTO customers (id, name, email, phone, type, balance, address, vat_number) VALUES
('CUST001', 'شركة الأفق', 'contact@alofouq.com', '0112345678', 'شركة', '7500.00', 'طريق الملك فهد، الرياض', '300011223300003'),
('CUST002', 'مؤسسة البناء الحديث', 'info@modern-const.com', '0123456789', 'شركة', '6500.00', 'شارع التحلية، جدة', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Seed Suppliers
INSERT INTO suppliers (id, name, email, phone, address) VALUES
('SUP001', 'شركة الإلكترونيات المتقدمة', 'sales@adv-electronics.com', '0118765432', 'المنطقة الصناعية، الرياض'),
('SUP002', 'مكتبة جرير', 'corp@jarir.com', '920000089', 'فروع متعددة')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email;

-- Seed an employee for the tenant
INSERT INTO employees (id, name, job_title, department, contract_start_date, contract_end_date, employment_type, status, basic_salary)
VALUES ('EMP001', 'أحمد محمود (مدير)', 'مدير النظام', 'الإدارة', '2023-01-01', '2025-12-31', 'دوام كامل', 'نشط', 15000.00)
ON CONFLICT(id) DO NOTHING;

-- Seed a bank account for the tenant
INSERT INTO bank_accounts (id, bank_name, account_number, iban, account_type, currency, balance, branch_name, is_active) VALUES
('BANK001', 'بنك الرياض', '1234567890', 'SA0380000000123456789012', 'جارى', 'SAR', 100000.00, 'الفرع الرئيسي', true)
ON CONFLICT (id) DO NOTHING;

-- Finally, add the default tenant T001 to the main database if it doesn't exist
-- This part must be run against the main database again.
INSERT INTO tenants (id, name, email)
VALUES ('T001', 'شركة المستقبل التجريبية', 'admin@almustaqbal-erp.com')
ON CONFLICT (id) DO NOTHING;
    

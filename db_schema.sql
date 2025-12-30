-- This script is designed to be idempotent, meaning it can be run multiple times without causing errors.
-- It uses `CREATE TABLE IF NOT EXISTS` to avoid errors if tables already exist.

-- ==============================================================
--  MAIN DATABASE SCHEMA (For managing tenants and system admins)
-- ==============================================================

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

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'
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

CREATE TABLE IF NOT EXISTS tenant_module_subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(256) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_key VARCHAR(100) NOT NULL,
    subscribed BOOLEAN NOT NULL DEFAULT false
);
-- Add unique constraint separately to avoid errors on re-run if it exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tenant_module_subscriptions_tenant_id_module_key_key'
    ) THEN
        ALTER TABLE tenant_module_subscriptions ADD UNIQUE (tenant_id, module_key);
    END IF;
END;
$$;


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

-- Insert Super Admin Role and User into the MAIN database if they don't exist
INSERT INTO roles (id, name, description, permissions)
VALUES ('ROLE_SUPER_ADMIN', 'Super Admin', 'Full system access, manages tenants and subscriptions.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, role_id, password_hash)
VALUES ('USER_SUPER_ADMIN', 'Super Admin', 'superadmin@example.com', 'ROLE_SUPER_ADMIN', 'hashed_superpassword')
ON CONFLICT (email) DO NOTHING;


-- ==============================================================
--  TENANT DATABASE SCHEMA (For individual company data)
-- ==============================================================
-- The following tables should be created inside EACH tenant's database.

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(256) PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]'
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

-- Insert default tenant admin role and user
INSERT INTO roles (id, name, description, permissions)
VALUES ('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, role_id, password_hash)
VALUES ('USER001', 'مدير الشركة', 'manager@example.com', 'ROLE001', 'hashed_password')
ON CONFLICT (email) DO NOTHING;

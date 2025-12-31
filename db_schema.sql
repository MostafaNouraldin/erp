
-- Drop existing tables to start fresh (optional, but recommended for a clean slate)
-- You may need to run these one by one in Supabase if there are dependency issues.
DROP TABLE IF EXISTS "tenant_module_subscriptions" CASCADE;
DROP TABLE IF EXISTS "subscription_requests" CASCADE;
DROP TABLE IF EXISTS "journal_entry_lines" CASCADE;
DROP TABLE IF EXISTS "journal_entries" CASCADE;
DROP TABLE IF EXISTS "sales_invoice_items" CASCADE;
DROP TABLE IF EXISTS "sales_invoices" CASCADE;
DROP TABLE IF EXISTS "sales_order_items" CASCADE;
DROP TABLE IF EXISTS "sales_orders" CASCADE;
DROP TABLE IF EXISTS "quotation_items" CASCADE;
DROP TABLE IF EXISTS "quotations" CASCADE;
DROP TABLE IF EXISTS "purchase_return_items" CASCADE;
DROP TABLE IF EXISTS "purchase_returns" CASCADE;
DROP TABLE IF EXISTS "goods_received_note_items" CASCADE;
DROP TABLE IF EXISTS "goods_received_notes" CASCADE;
DROP TABLE IF EXISTS "purchase_order_items" CASCADE;
DROP TABLE IF EXISTS "purchase_orders" CASCADE;
DROP TABLE IF EXISTS "supplier_invoice_items" CASCADE;
DROP TABLE IF EXISTS "supplier_invoices" CASCADE;
DROP TABLE IF EXISTS "project_budget_items" CASCADE;
DROP TABLE IF EXISTS "project_resources" CASCADE;
DROP TABLE IF EXISTS "project_tasks" CASCADE;
DROP TABLE IF EXISTS "projects" CASCADE;
DROP TABLE IF EXISTS "bill_of_material_items" CASCADE;
DROP TABLE IF EXISTS "bills_of_material" CASCADE;
DROP TABLE IF EXISTS "work_order_production_logs" CASCADE;
DROP TABLE IF EXISTS "quality_checks" CASCADE;
DROP TABLE IF EXISTS "work_orders" CASCADE;
DROP TABLE IF EXISTS "production_plans" CASCADE;
DROP TABLE IF EXISTS "stock_issue_voucher_items" CASCADE;
DROP TABLE IF EXISTS "stock_issue_vouchers" CASCADE;
DROP TABLE IF EXISTS "stock_requisition_items" CASCADE;
DROP TABLE IF EXISTS "stock_requisitions" CASCADE;
DROP TABLE IF EXISTS "inventory_transfers" CASCADE;
DROP TABLE IF EXISTS "inventory_adjustments" CASCADE;
DROP TABLE IF EXISTS "stocktakes" CASCADE;
DROP TABLE IF EXISTS "warehouses" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;
DROP TABLE IF EXISTS "checks" CASCADE;
DROP TABLE IF EXISTS "bank_expenses" CASCADE;
DROP TABLE IF EXISTS "cash_expenses" CASCADE;
DROP TABLE IF EXISTS "bank_receipts" CASCADE;
DROP TABLE IF EXISTS "bank_accounts" CASCADE;
DROP TABLE IF EXISTS "employee_settlements" CASCADE;
DROP TABLE IF EXISTS "disciplinary_warnings" CASCADE;
DROP TABLE IF EXISTS "resignations" CASCADE;
DROP TABLE IF EXISTS "administrative_decisions" CASCADE;
DROP TABLE IF EXISTS "warning_notices" CASCADE;
DROP TABLE IF EXISTS "leave_requests" CASCADE;
DROP TABLE IF EXISTS "attendance_records" CASCADE;
DROP TABLE IF EXISTS "payrolls" CASCADE;
DROP TABLE IF EXISTS "employee_deductions" CASCADE;
DROP TABLE IF EXISTS "employee_allowances" CASCADE;
DROP TABLE IF EXISTS "employees" CASCADE;
DROP TABLE IF EXISTS "chart_of_accounts" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;

-- System Administration & Settings Tables
CREATE TABLE "tenants" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256) NOT NULL UNIQUE,
    "is_active" boolean DEFAULT true,
    "subscription_end_date" timestamp,
    "created_at" timestamp DEFAULT now(),
    "phone" varchar(50),
    "address" text,
    "vat_number" varchar(50)
);

CREATE TABLE "roles" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL UNIQUE,
    "description" text,
    "permissions" jsonb DEFAULT '[]'
);

CREATE TABLE "users" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256) NOT NULL UNIQUE,
    "role_id" varchar(256) NOT NULL REFERENCES "roles"("id"),
    "status" varchar(50) NOT NULL DEFAULT 'نشط',
    "password_hash" text NOT NULL,
    "avatar_url" text,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "tenant_module_subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" varchar(256) NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
    "module_key" varchar(100) NOT NULL,
    "subscribed" boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX "tenant_module_unique_idx" ON "tenant_module_subscriptions" ("tenant_id", "module_key");

CREATE TABLE "subscription_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "company_name" varchar(256) NOT NULL,
    "email" varchar(256) NOT NULL,
    "phone" varchar(50),
    "address" text,
    "vat_number" varchar(50),
    "selected_modules" jsonb NOT NULL,
    "billing_cycle" varchar(50) NOT NULL,
    "total_amount" numeric(10, 2) NOT NULL,
    "payment_method" varchar(100) NOT NULL,
    "payment_proof" text NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "created_at" timestamp DEFAULT now()
);

-- Core Tenant-Specific Tables
CREATE TABLE "customers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256),
    "phone" varchar(256),
    "type" varchar(256),
    "balance" numeric(10, 2) NOT NULL DEFAULT '0',
    "address" text,
    "vat_number" varchar(256)
);

CREATE TABLE "suppliers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256),
    "phone" varchar(256),
    "address" text,
    "vat_number" varchar(256),
    "contact_person" varchar(256),
    "notes" text
);

CREATE TABLE "employees" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "job_title" varchar(256) NOT NULL,
    "department" varchar(256) NOT NULL,
    "contract_start_date" timestamp NOT NULL,
    "contract_end_date" timestamp NOT NULL,
    "employment_type" varchar(50) NOT NULL,
    "status" varchar(50) NOT NULL,
    "basic_salary" numeric(10, 2) NOT NULL,
    "email" varchar(256),
    "phone" varchar(50),
    "avatar_url" text,
    "data_ai_hint" varchar(256),
    "nationality" varchar(100),
    "id_number" varchar(50),
    "bank_name" varchar(256),
    "iban" varchar(256),
    "social_insurance_number" varchar(100)
);

CREATE TABLE "products" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "sku" varchar(256) NOT NULL UNIQUE,
    "name" varchar(256) NOT NULL,
    "description" text,
    "category" varchar(256) NOT NULL,
    "unit" varchar(256) NOT NULL,
    "cost_price" numeric(10, 2) NOT NULL,
    "selling_price" numeric(10, 2) NOT NULL,
    "quantity" integer NOT NULL DEFAULT 0,
    "reorder_level" integer NOT NULL DEFAULT 0,
    "location" varchar(256),
    "barcode" varchar(256),
    "supplier_id" varchar(256) REFERENCES "suppliers"("id"),
    "image" text,
    "data_ai_hint" varchar(256),
    "is_raw_material" boolean DEFAULT false
);

CREATE TABLE "categories" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "description" text
);

CREATE TABLE "chart_of_accounts" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "type" varchar(50) NOT NULL,
    "parent_id" varchar(256),
    "balance" numeric(15, 2) DEFAULT '0'
);

CREATE TABLE "bank_accounts" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "bank_name" varchar(256) NOT NULL,
    "account_number" varchar(256) NOT NULL,
    "iban" varchar(256),
    "account_type" varchar(50) NOT NULL,
    "currency" varchar(10) NOT NULL,
    "balance" numeric(15, 2) NOT NULL DEFAULT '0',
    "branch_name" varchar(256),
    "is_active" boolean NOT NULL DEFAULT true
);

-- Sales & Purchases
CREATE TABLE "quotations" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "customer_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "date" timestamp NOT NULL,
    "expiry_date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL,
    "notes" text
);

CREATE TABLE "quotation_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "quote_id" varchar(256) NOT NULL REFERENCES "quotations"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "sales_orders" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "quote_id" varchar(256),
    "customer_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "date" timestamp NOT NULL,
    "delivery_date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL,
    "notes" text
);

CREATE TABLE "sales_order_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "so_id" varchar(256) NOT NULL REFERENCES "sales_orders"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "sales_invoices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "order_id" varchar(256),
    "customer_id" varchar(256) NOT NULL,
    "date" timestamp NOT NULL,
    "due_date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL,
    "is_deferred_payment" boolean DEFAULT false,
    "source" varchar(50),
    "notes" text
);

CREATE TABLE "sales_invoice_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "invoice_id" varchar(256) NOT NULL REFERENCES "sales_invoices"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "purchase_orders" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "date" timestamp NOT NULL,
    "expected_delivery_date" timestamp NOT NULL,
    "notes" text,
    "total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL
);

CREATE TABLE "purchase_order_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "po_id" varchar(256) NOT NULL REFERENCES "purchase_orders"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "supplier_invoices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "po_id" varchar(256),
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "invoice_date" timestamp NOT NULL,
    "due_date" timestamp NOT NULL,
    "total_amount" numeric(10, 2) NOT NULL,
    "paid_amount" numeric(10, 2) NOT NULL DEFAULT '0',
    "status" varchar(50) NOT NULL,
    "notes" text
);

CREATE TABLE "supplier_invoice_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "invoice_id" varchar(256) NOT NULL REFERENCES "supplier_invoices"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

-- HR & Payroll
CREATE TABLE "employee_allowances" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "description" varchar(256) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "type" varchar(50) NOT NULL
);

CREATE TABLE "employee_deductions" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "description" varchar(256) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "type" varchar(50) NOT NULL
);

CREATE TABLE "payrolls" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "month_year" varchar(50) NOT NULL,
    "basic_salary" numeric(10, 2) NOT NULL,
    "allowances" jsonb,
    "deductions" jsonb,
    "net_salary" numeric(10, 2),
    "payment_date" timestamp,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة',
    "notes" text
);

CREATE TABLE "employee_settlements" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "settlement_type" varchar(100) NOT NULL,
    "account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "amount" numeric(10, 2) NOT NULL,
    "description" text NOT NULL,
    "payment_method" varchar(100) NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة',
    "reference" varchar(256)
);

CREATE TABLE "attendance_records" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "date" timestamp NOT NULL,
    "check_in" timestamp,
    "check_out" timestamp,
    "status" varchar(50) NOT NULL DEFAULT 'حاضر',
    "notes" text,
    "hours" varchar(10)
);

CREATE TABLE "leave_requests" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "leave_type" varchar(100) NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "reason" text,
    "status" varchar(50) NOT NULL DEFAULT 'مقدمة',
    "days" integer
);

CREATE TABLE "warning_notices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "date" timestamp NOT NULL,
    "reason" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "administrative_decisions" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "decision_date" timestamp NOT NULL,
    "decision_type" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_authority" varchar(256) NOT NULL,
    "effective_date" timestamp NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "resignations" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "submission_date" timestamp NOT NULL,
    "last_working_date" timestamp NOT NULL,
    "reason" text NOT NULL,
    "manager_notified_date" timestamp,
    "status" varchar(50) NOT NULL DEFAULT 'مقدمة'
);

CREATE TABLE "disciplinary_warnings" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "warning_date" timestamp NOT NULL,
    "warning_type" varchar(100) NOT NULL,
    "violation_details" text NOT NULL,
    "action_taken" text,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

-- Accounting
CREATE TABLE "journal_entries" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "description" text NOT NULL,
    "total_amount" numeric(15, 2) NOT NULL,
    "status" varchar(50) NOT NULL,
    "source_module" varchar(100),
    "source_document_id" varchar(256)
);

CREATE TABLE "journal_entry_lines" (
    "id" serial PRIMARY KEY NOT NULL,
    "journal_entry_id" varchar(256) NOT NULL REFERENCES "journal_entries"("id") ON DELETE cascade,
    "account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "debit" numeric(15, 2) NOT NULL DEFAULT '0',
    "credit" numeric(15, 2) NOT NULL DEFAULT '0',
    "description" text
);

CREATE TABLE "checks" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "check_number" varchar(100) NOT NULL,
    "issue_date" timestamp NOT NULL,
    "due_date" timestamp NOT NULL,
    "bank_account_id" varchar(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "beneficiary_name" varchar(256) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "currency" varchar(10) NOT NULL DEFAULT 'SAR',
    "purpose" text NOT NULL,
    "notes" text,
    "status" varchar(50) NOT NULL DEFAULT 'صادر'
);

CREATE TABLE "bank_expenses" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "bank_account_id" varchar(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "expense_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "beneficiary" varchar(256) NOT NULL,
    "description" text NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "reference_number" varchar(256),
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "bank_receipts" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "bank_account_id" varchar(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "revenue_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "payer_name" varchar(256) NOT NULL,
    "customer_id" varchar(256) REFERENCES "customers"("id"),
    "description" text NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "reference_number" varchar(256),
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "cash_expenses" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "cash_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "expense_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "beneficiary" varchar(256) NOT NULL,
    "description" text NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "voucher_number" varchar(256),
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

-- Projects
CREATE TABLE "projects" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "client_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "budget" numeric(15, 2) NOT NULL DEFAULT '0',
    "status" varchar(50) NOT NULL DEFAULT 'مخطط له',
    "progress" integer DEFAULT 0,
    "manager_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "notes" text
);

CREATE TABLE "project_tasks" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
    "name" varchar(256) NOT NULL,
    "assignee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "due_date" timestamp NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مخطط لها',
    "priority" varchar(50) NOT NULL DEFAULT 'متوسطة',
    "notes" text
);

CREATE TABLE "project_resources" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "role" varchar(256) NOT NULL,
    "allocation" integer DEFAULT 100,
    "notes" text
);

CREATE TABLE "project_budget_items" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
    "item" varchar(256) NOT NULL,
    "allocated" numeric(15, 2) NOT NULL DEFAULT '0',
    "spent" numeric(15, 2) NOT NULL DEFAULT '0',
    "notes" text
);

-- Production
CREATE TABLE "work_orders" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "produced_quantity" integer DEFAULT 0,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مجدول',
    "progress" integer DEFAULT 0,
    "notes" text
);

CREATE TABLE "work_order_production_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "work_order_id" varchar(256) NOT NULL REFERENCES "work_orders"("id") ON DELETE cascade,
    "date" timestamp NOT NULL,
    "quantity_produced" integer NOT NULL,
    "notes" text
);

CREATE TABLE "bills_of_material" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "version" varchar(50) NOT NULL,
    "last_updated" timestamp
);

CREATE TABLE "bill_of_material_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "bom_id" varchar(256) NOT NULL REFERENCES "bills_of_material"("id") ON DELETE cascade,
    "material_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" numeric(10, 4) NOT NULL
);

CREATE TABLE "production_plans" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة',
    "notes" text
);

CREATE TABLE "quality_checks" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "work_order_id" varchar(256) NOT NULL REFERENCES "work_orders"("id"),
    "check_point" varchar(256) NOT NULL,
    "result" varchar(50) NOT NULL,
    "date" timestamp NOT NULL,
    "inspector_id" varchar(256) NOT NULL,
    "notes" text
);

-- Inventory Control
CREATE TABLE "warehouses" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "location" text
);

CREATE TABLE "stocktakes" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "stocktake_date" timestamp NOT NULL,
    "warehouse_id" varchar(256) NOT NULL REFERENCES "warehouses"("id"),
    "responsible_person" varchar(256) NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مجدول',
    "notes" text
);

CREATE TABLE "inventory_adjustments" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "type" varchar(50) NOT NULL,
    "quantity" integer NOT NULL,
    "reason" varchar(256) NOT NULL,
    "notes" text,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "inventory_transfers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "from_warehouse_id" varchar(256) NOT NULL,
    "to_warehouse_id" varchar(256) NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة',
    "notes" text
);

CREATE TABLE "stock_issue_vouchers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "warehouse_id" varchar(256) NOT NULL REFERENCES "warehouses"("id"),
    "recipient" varchar(256) NOT NULL,
    "reason" text NOT NULL,
    "notes" text,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة',
    "issued_by" varchar(256)
);

CREATE TABLE "stock_issue_voucher_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "voucher_id" varchar(256) NOT NULL REFERENCES "stock_issue_vouchers"("id") ON DELETE cascade,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity_issued" integer NOT NULL,
    "notes" text
);

CREATE TABLE "goods_received_notes" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "po_id" varchar(256),
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "grn_date" timestamp NOT NULL,
    "notes" text,
    "status" varchar(50) NOT NULL,
    "received_by" varchar(256)
);

CREATE TABLE "goods_received_note_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "grn_id" varchar(256) NOT NULL REFERENCES "goods_received_notes"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "ordered_quantity" integer,
    "received_quantity" integer NOT NULL,
    "notes" text
);

CREATE TABLE "stock_requisitions" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "request_date" timestamp NOT NULL,
    "requesting_department_or_person" varchar(256) NOT NULL,
    "required_by_date" timestamp NOT NULL,
    "overall_justification" text,
    "status" varchar(50) NOT NULL DEFAULT 'جديد',
    "approved_by" varchar(256),
    "approval_date" timestamp
);

CREATE TABLE "stock_requisition_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "requisition_id" varchar(256) NOT NULL REFERENCES "stock_requisitions"("id") ON DELETE cascade,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity_requested" integer NOT NULL,
    "justification" text
);

CREATE TABLE "purchase_returns" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "date" timestamp NOT NULL,
    "original_invoice_id" varchar(256),
    "notes" text,
    "total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "purchase_return_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "return_id" varchar(256) NOT NULL REFERENCES "purchase_returns"("id") ON DELETE cascade,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "reason" text,
    "total" numeric(10, 2) NOT NULL
);

-- Insert initial data (Roles)
INSERT INTO "roles" ("id", "name", "description", "permissions") VALUES
('ROLE_SUPER_ADMIN', 'Super Admin', 'صلاحيات كاملة على النظام وإدارة الشركات.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests"]'),
('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use"]'),
('ROLE002', 'محاسب', 'صلاحيات على وحدات الحسابات والمالية.', '["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial"]'),
('ROLE003', 'موظف مبيعات', 'صلاحيات على وحدة المبيعات وعروض الأسعار.', '["sales.view", "sales.create", "reports.view_sales"]'),
('ROLE004', 'مدير مخزون', 'صلاحيات على وحدة المخزون والمستودعات.', '["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock"]');

-- Insert initial data (Users)
INSERT INTO "users" ("id", "name", "email", "role_id", "status", "password_hash", "avatar_url") VALUES
('USER001', 'مدير النظام', 'manager@example.com', 'ROLE001', 'نشط', 'hashed_password', 'https://i.pravatar.cc/150?u=manager'),
('USER002', 'محاسب أول', 'accountant@example.com', 'ROLE002', 'نشط', 'hashed_password', 'https://i.pravatar.cc/150?u=accountant'),
('USER003', 'مندوب مبيعات', 'sales@example.com', 'ROLE003', 'نشط', 'hashed_password', 'https://i.pravatar.cc/150?u=sales'),
('USER_SUPER', 'Super Admin', 'super@admin.com', 'ROLE_SUPER_ADMIN', 'نشط', 'hashed_password', 'https://i.pravatar.cc/150?u=superadmin');


-- Insert initial data for Chart of Accounts (example)
INSERT INTO "chart_of_accounts" ("id", "name", "type", "parent_id") VALUES
('1', 'الأصول', 'رئيسي', NULL),
('10', 'الأصول المتداولة', 'فرعي', '1'),
('101', 'النقد وما في حكمه', 'فرعي', '10'),
('1011', 'صندوق', 'تحليلي', '101'),
('1012', 'بنك', 'تحليلي', '101'),
('12', 'الذمم المدينة', 'فرعي', '10'),
('1200', 'العملاء', 'تحليلي', '12'),
('13', 'المخزون', 'فرعي', '10'),
('1300', 'مخزون بضاعة تامة', 'تحليلي', '13'),
('1301', 'مخزون مستودع أ', 'تحليلي', '13'),
('1302', 'مخزون مستودع ب', 'تحليلي', '13'),
('2', 'الخصوم', 'رئيسي', NULL),
('20', 'الخصوم المتداولة', 'فرعي', '2'),
('201', 'الذمم الدائنة', 'فرعي', '20'),
('2010', 'الموردون', 'تحليلي', '201'),
('21', 'رواتب مستحقة', 'فرعي', '20'),
('2100', 'رواتب وأجور مستحقة', 'تحليلي', '21'),
('22', 'ضرائب مستحقة', 'فرعي', '20'),
('2200', 'ضريبة القيمة المضافة المستحقة', 'تحليلي', '22'),
('3', 'حقوق الملكية', 'رئيسي', NULL),
('30', 'رأس المال', 'فرعي', '3'),
('3000', 'رأس المال', 'تحليلي', '30'),
('4', 'الإيرادات', 'رئيسي', NULL),
('40', 'إيرادات النشاط الرئيسي', 'فرعي', '4'),
('4000', 'إيرادات المبيعات', 'تحليلي', '40'),
('5', 'المصروفات', 'رئيسي', NULL),
('50', 'تكلفة البضاعة المباعة', 'فرعي', '5'),
('5000', 'تكلفة البضاعة المباعة', 'تحليلي', '50'),
('51', 'مصاريف عمومية وإدارية', 'فرعي', '5'),
('5100', 'مصاريف متنوعة', 'تحليلي', '51');

-- Insert initial data for Customers & Suppliers
INSERT INTO "customers" ("id", "name", "email", "phone", "type", "address", "vat_number") VALUES
('CUST001', 'عميل نقدي', 'cash@customer.com', 'N/A', 'فرد', 'N/A', 'N/A'),
('CUST002', 'شركة الأمل للتجارة', 'contact@alamal.com', '0112345678', 'شركة', 'الرياض، المملكة العربية السعودية', '300012345600003');

INSERT INTO "suppliers" ("id", "name", "email", "phone", "address") VALUES
('SUP001', 'مورد عام', 'general@supplier.com', '0501112222', 'جدة، المملكة العربية السعودية'),
('SUP002', 'شركة الإلكترونيات المتقدمة', 'info@adv-electronics.com', '0123456789', 'الدمام، المملكة العربية السعودية');

-- Insert initial data for Products
INSERT INTO "products" ("id", "sku", "name", "description", "category", "unit", "cost_price", "selling_price", "quantity", "reorder_level", "supplier_id") VALUES
('ITEM001', 'LP-DELL-XPS15', 'لابتوب Dell XPS 15', 'لابتوب عالي الأداء بشاشة 15 بوصة', 'أجهزة لابتوب', 'قطعة', '5500.00', '6500.00', 50, 10, 'SUP002'),
('ITEM002', 'PRN-HP-LJ', 'طابعة HP LaserJet', 'طابعة ليزر متعددة الوظائف', 'طابعات', 'قطعة', '1000.00', '1200.00', 20, 5, 'SUP002'),
('SERV001', 'CONS-A', 'خدمة استشارية A', 'خدمة استشارية في مجال التسويق الرقمي', 'خدمات', 'ساعة', '0.00', '150.00', 9999, 0, NULL);

-- Insert initial data for Employees
INSERT INTO "employees" ("id", "name", "job_title", "department", "contract_start_date", "contract_end_date", "employment_type", "status", "basic_salary", "email") VALUES
('EMP001', 'أحمد محمود', 'مدير مبيعات', 'قسم المبيعات', '2023-01-01', '2025-01-01', 'دوام كامل', 'نشط', '12000.00', 'ahmed.m@example.com'),
('EMP002', 'سارة عبدالله', 'أخصائية تسويق', 'قسم التسويق', '2023-03-15', '2025-03-15', 'دوام كامل', 'نشط', '8500.00', 'sara.a@example.com');

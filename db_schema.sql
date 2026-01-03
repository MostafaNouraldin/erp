-- This script is generated based on the Drizzle schema.
-- Execute this in your Supabase SQL editor to set up the database tables.

-- Drop existing tables in reverse order of creation to avoid foreign key constraints
DROP TABLE IF EXISTS "inventory_movement_log";
DROP TABLE IF EXISTS "pos_sessions";
DROP TABLE IF EXISTS "purchase_return_items";
DROP TABLE IF EXISTS "purchase_returns";
DROP TABLE IF EXISTS "stock_requisition_items";
DROP TABLE IF EXISTS "stock_requisitions";
DROP TABLE IF EXISTS "goods_received_note_items";
DROP TABLE IF EXISTS "goods_received_notes";
DROP TABLE IF EXISTS "stock_issue_voucher_items";
DROP TABLE IF EXISTS "stock_issue_vouchers";
DROP TABLE IF EXISTS "stocktakes";
DROP TABLE IF EXISTS "warehouses";
DROP TABLE IF EXISTS "quality_checks";
DROP TABLE IF EXISTS "bill_of_material_items";
DROP TABLE IF EXISTS "bills_of_material";
DROP TABLE IF EXISTS "work_order_production_logs";
DROP TABLE IF EXISTS "work_orders";
DROP TABLE IF EXISTS "production_plans";
DROP TABLE IF EXISTS "project_budget_items";
DROP TABLE IF EXISTS "project_resources";
DROP TABLE IF EXISTS "project_tasks";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "cash_expenses";
DROP TABLE IF EXISTS "bank_receipts";
DROP TABLE IF EXISTS "bank_expenses";
DROP TABLE IF EXISTS "checks";
DROP TABLE IF EXISTS "journal_entry_lines";
DROP TABLE IF EXISTS "journal_entries";
DROP TABLE IF EXISTS "employee_deductions";
DROP TABLE IF EXISTS "employee_allowances";
DROP TABLE IF EXISTS "disciplinary_warnings";
DROP TABLE IF EXISTS "resignations";
DROP TABLE IF EXISTS "administrative_decisions";
DROP TABLE IF EXISTS "warning_notices";
DROP TABLE IF EXISTS "leave_requests";
DROP TABLE IF EXISTS "overtime";
DROP TABLE IF EXISTS "attendance_records";
DROP TABLE IF EXISTS "payrolls";
DROP TABLE IF EXISTS "employee_settlements";
DROP TABLE IF EXISTS "deduction_types";
DROP TABLE IF EXISTS "allowance_types";
DROP TABLE IF EXISTS "leave_types";
DROP TABLE IF EXISTS "job_titles";
DROP TABLE IF EXISTS "departments";
DROP TABLE IF EXISTS "supplier_invoice_items";
DROP TABLE IF EXISTS "supplier_invoices";
DROP TABLE IF EXISTS "purchase_order_items";
DROP TABLE IF EXISTS "purchase_orders";
DROP TABLE IF EXISTS "sales_return_items";
DROP TABLE IF EXISTS "sales_returns";
DROP TABLE IF EXISTS "sales_invoice_items";
DROP TABLE IF EXISTS "sales_invoices";
DROP TABLE IF EXISTS "sales_order_items";
DROP TABLE IF EXISTS "sales_orders";
DROP TABLE IF EXISTS "quotation_items";
DROP TABLE IF EXISTS "quotations";
DROP TABLE IF EXISTS "inventory_adjustments";
DROP TABLE IF EXISTS "inventory_transfers";
DROP TABLE IF EXISTS "products";
DROP TABLE IF EXISTS "suppliers";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "chart_of_accounts";
DROP TABLE IF EXISTS "bank_accounts";
DROP TABLE IF EXISTS "employees";
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "company_settings";
DROP TABLE IF EXISTS "subscription_requests";
DROP TABLE IF EXISTS "tenant_module_subscriptions";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "tenants";


-- System Administration & Settings Tables
CREATE TABLE "tenants" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL UNIQUE,
    "is_active" BOOLEAN DEFAULT true,
    "subscription_end_date" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT now(),
    "phone" VARCHAR(50),
    "address" TEXT,
    "vat_number" VARCHAR(50)
);

CREATE TABLE "roles" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE,
    "description" TEXT,
    "permissions" JSONB DEFAULT '[]'
);

CREATE TABLE "users" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL UNIQUE,
    "role_id" VARCHAR(256) NOT NULL REFERENCES "roles"("id"),
    "status" VARCHAR(50) NOT NULL DEFAULT 'نشط',
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE "tenant_module_subscriptions" (
    "id" SERIAL PRIMARY KEY,
    "tenant_id" VARCHAR(256) NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "module_key" VARCHAR(100) NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT false,
    UNIQUE ("tenant_id", "module_key")
);

CREATE TABLE "subscription_requests" (
    "id" SERIAL PRIMARY KEY,
    "company_name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "vat_number" VARCHAR(50),
    "selected_modules" JSONB NOT NULL,
    "billing_cycle" VARCHAR(50) NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "payment_method" VARCHAR(100) NOT NULL,
    "payment_proof" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP DEFAULT now()
);

CREATE TABLE "company_settings" (
    "id" VARCHAR(256) PRIMARY KEY,
    "settings" JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" VARCHAR(256) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "is_read" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- Core Tenant-Specific Tables
CREATE TABLE "customers" (
  "id" VARCHAR(256) PRIMARY KEY,
  "name" VARCHAR(256) NOT NULL,
  "email" VARCHAR(256),
  "phone" VARCHAR(256),
  "type" VARCHAR(256),
  "balance" NUMERIC(10, 2) NOT NULL DEFAULT 0,
  "address" TEXT,
  "vat_number" VARCHAR(256)
);

CREATE TABLE "suppliers" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256),
    "phone" VARCHAR(256),
    "address" TEXT,
    "vat_number" VARCHAR(256),
    "contact_person" VARCHAR(256),
    "notes" TEXT
);

CREATE TABLE "employees" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "job_title" VARCHAR(256) NOT NULL,
    "department" VARCHAR(256) NOT NULL,
    "manager_id" VARCHAR(256) REFERENCES "employees"("id"),
    "contract_start_date" TIMESTAMP NOT NULL,
    "contract_end_date" TIMESTAMP NOT NULL,
    "employment_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "basic_salary" NUMERIC(10, 2) NOT NULL,
    "email" VARCHAR(256),
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "data_ai_hint" VARCHAR(256),
    "nationality" VARCHAR(100),
    "id_number" VARCHAR(50),
    "bank_name" VARCHAR(256),
    "iban" VARCHAR(256),
    "social_insurance_number" VARCHAR(100),
    "medical_insurance_provider" VARCHAR(256),
    "medical_insurance_policy_number" VARCHAR(100),
    "medical_insurance_class" VARCHAR(100),
    "medical_insurance_start_date" TIMESTAMP,
    "medical_insurance_end_date" TIMESTAMP,
    "annual_leave_balance" INTEGER DEFAULT 0,
    "sick_leave_balance" INTEGER DEFAULT 0,
    "emergency_leave_balance" INTEGER DEFAULT 0
);

CREATE TABLE "products" (
  "id" VARCHAR(256) PRIMARY KEY,
  "sku" VARCHAR(256) NOT NULL UNIQUE,
  "name" VARCHAR(256) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(256) NOT NULL,
  "unit" VARCHAR(256) NOT NULL,
  "cost_price" NUMERIC(10, 2) NOT NULL,
  "selling_price" NUMERIC(10, 2) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "reorder_level" INTEGER NOT NULL DEFAULT 0,
  "location" VARCHAR(256),
  "barcode" VARCHAR(256),
  "supplier_id" VARCHAR(256) REFERENCES "suppliers"("id"),
  "image" TEXT,
  "data_ai_hint" VARCHAR(256),
  "is_raw_material" BOOLEAN DEFAULT false
);

CREATE TABLE "categories" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "description" TEXT
);

CREATE TABLE "chart_of_accounts" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "parent_id" VARCHAR(256),
    "balance" NUMERIC(15, 2) DEFAULT '0'
);

CREATE TABLE "bank_accounts" (
    "id" VARCHAR(256) PRIMARY KEY,
    "bank_name" VARCHAR(256) NOT NULL,
    "account_number" VARCHAR(256) NOT NULL,
    "iban" VARCHAR(256),
    "account_type" VARCHAR(50) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "balance" NUMERIC(15, 2) NOT NULL DEFAULT '0',
    "branch_name" VARCHAR(256),
    "is_active" BOOLEAN DEFAULT true NOT NULL
);

-- HR & Payroll Settings Tables
CREATE TABLE "departments" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE
);

CREATE TABLE "job_titles" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE
);

CREATE TABLE "leave_types" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE
);

CREATE TABLE "allowance_types" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE,
    "expense_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id")
);

CREATE TABLE "deduction_types" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL UNIQUE,
    "liability_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id")
);

CREATE TABLE "employee_allowances" (
    "id" SERIAL PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "type_id" VARCHAR(256) NOT NULL REFERENCES "allowance_types"("id"),
    "description" VARCHAR(256) NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "type" VARCHAR(50) NOT NULL
);

CREATE TABLE "employee_deductions" (
    "id" SERIAL PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "type_id" VARCHAR(256) NOT NULL REFERENCES "deduction_types"("id"),
    "description" VARCHAR(256) NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "type" VARCHAR(50) NOT NULL
);

CREATE TABLE "payrolls" (
  "id" VARCHAR(256) PRIMARY KEY,
  "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "month_year" VARCHAR(50) NOT NULL,
  "basic_salary" NUMERIC(10, 2) NOT NULL,
  "allowances" JSONB,
  "deductions" JSONB,
  "net_salary" NUMERIC(10, 2),
  "payment_date" TIMESTAMP,
  "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
  "notes" TEXT
);

CREATE TABLE "employee_settlements" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id"),
    "settlement_type" VARCHAR(100) NOT NULL,
    "account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "amount" NUMERIC(10, 2) NOT NULL,
    "description" TEXT NOT NULL,
    "payment_method" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    "reference" VARCHAR(256)
);

CREATE TABLE "attendance_records" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" TIMESTAMP NOT NULL,
    "check_in" TIMESTAMP,
    "check_out" TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'حاضر',
    "notes" TEXT,
    "hours" VARCHAR(10)
);

CREATE TABLE "overtime" (
    "id" SERIAL PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" TIMESTAMP NOT NULL,
    "hours" NUMERIC(5, 2) NOT NULL,
    "rate" NUMERIC(4, 2) NOT NULL DEFAULT 1.5,
    "amount" NUMERIC(10, 2),
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending'
);

CREATE TABLE "leave_requests" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "leave_type" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مقدمة',
    "days" INTEGER
);

CREATE TABLE "warning_notices" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" TIMESTAMP NOT NULL,
    "reason" VARCHAR(256) NOT NULL,
    "details" TEXT NOT NULL,
    "issuing_manager" VARCHAR(256) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "administrative_decisions" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "decision_date" TIMESTAMP NOT NULL,
    "decision_type" VARCHAR(256) NOT NULL,
    "details" TEXT NOT NULL,
    "issuing_authority" VARCHAR(256) NOT NULL,
    "effective_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "resignations" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "submission_date" TIMESTAMP NOT NULL,
    "last_working_date" TIMESTAMP NOT NULL,
    "reason" TEXT NOT NULL,
    "manager_notified_date" TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مقدمة'
);

CREATE TABLE "disciplinary_warnings" (
    "id" VARCHAR(256) PRIMARY KEY,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "warning_date" TIMESTAMP NOT NULL,
    "warning_type" VARCHAR(100) NOT NULL,
    "violation_details" TEXT NOT NULL,
    "action_taken" TEXT,
    "issuing_manager" VARCHAR(256) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);


-- Transactional Tables
CREATE TABLE "journal_entries" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "description" TEXT NOT NULL,
    "total_amount" NUMERIC(15, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "source_module" VARCHAR(100),
    "source_document_id" VARCHAR(256)
);

CREATE TABLE "journal_entry_lines" (
    "id" SERIAL PRIMARY KEY,
    "journal_entry_id" VARCHAR(256) NOT NULL REFERENCES "journal_entries"("id") ON DELETE CASCADE,
    "account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "debit" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "credit" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "description" TEXT
);

CREATE TABLE "sales_invoices" (
  "id" VARCHAR(256) PRIMARY KEY,
  "order_id" VARCHAR(256),
  "customer_id" VARCHAR(256) NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "due_date" TIMESTAMP NOT NULL,
  "numeric_total_amount" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "is_deferred_payment" BOOLEAN DEFAULT false,
  "source" VARCHAR(50),
  "notes" TEXT
);

CREATE TABLE "sales_invoice_items" (
    "id" SERIAL PRIMARY KEY,
    "invoice_id" VARCHAR(256) NOT NULL REFERENCES "sales_invoices"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "quotations" (
  "id" VARCHAR(256) PRIMARY KEY,
  "customer_id" VARCHAR(256) NOT NULL REFERENCES "customers"("id"),
  "date" TIMESTAMP NOT NULL,
  "expiry_date" TIMESTAMP NOT NULL,
  "numeric_total_amount" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "notes" TEXT
);

CREATE TABLE "quotation_items" (
    "id" SERIAL PRIMARY KEY,
    "quote_id" VARCHAR(256) NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "sales_orders" (
  "id" VARCHAR(256) PRIMARY KEY,
  "quote_id" VARCHAR(256),
  "customer_id" VARCHAR(256) NOT NULL REFERENCES "customers"("id"),
  "date" TIMESTAMP NOT NULL,
  "delivery_date" TIMESTAMP NOT NULL,
  "numeric_total_amount" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "notes" TEXT
);

CREATE TABLE "sales_order_items" (
    "id" SERIAL PRIMARY KEY,
    "so_id" VARCHAR(256) NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "purchase_orders" (
  "id" VARCHAR(256) PRIMARY KEY,
  "supplier_id" VARCHAR(256) NOT NULL REFERENCES "suppliers"("id"),
  "date" TIMESTAMP NOT NULL,
  "expected_delivery_date" TIMESTAMP NOT NULL,
  "notes" TEXT,
  "total_amount" NUMERIC(10, 2) NOT NULL,
  "status" VARCHAR(50) NOT NULL
);

CREATE TABLE "purchase_order_items" (
  "id" SERIAL PRIMARY KEY,
  "po_id" VARCHAR(256) NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
  "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
  "description" TEXT,
  "quantity" INTEGER NOT NULL,
  "unit_price" NUMERIC(10, 2) NOT NULL,
  "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "supplier_invoices" (
    "id" VARCHAR(256) PRIMARY KEY,
    "po_id" VARCHAR(256),
    "supplier_id" VARCHAR(256) NOT NULL REFERENCES "suppliers"("id"),
    "invoice_date" TIMESTAMP NOT NULL,
    "due_date" TIMESTAMP NOT NULL,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "paid_amount" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT
);

CREATE TABLE "supplier_invoice_items" (
    "id" SERIAL PRIMARY KEY,
    "invoice_id" VARCHAR(256) NOT NULL REFERENCES "supplier_invoices"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "checks" (
    "id" VARCHAR(256) PRIMARY KEY,
    "check_number" VARCHAR(100) NOT NULL,
    "issue_date" TIMESTAMP NOT NULL,
    "due_date" TIMESTAMP NOT NULL,
    "bank_account_id" VARCHAR(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "beneficiary_name" VARCHAR(256) NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'SAR',
    "purpose" TEXT NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'صادر'
);

CREATE TABLE "bank_expenses" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "bank_account_id" VARCHAR(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "expense_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "beneficiary" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "reference_number" VARCHAR(256),
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "bank_receipts" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "bank_account_id" VARCHAR(256) NOT NULL REFERENCES "bank_accounts"("id"),
    "revenue_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "payer_name" VARCHAR(256) NOT NULL,
    "customer_id" VARCHAR(256) REFERENCES "customers"("id"),
    "description" TEXT NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "reference_number" VARCHAR(256),
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "cash_expenses" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "cash_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "expense_account_id" VARCHAR(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "beneficiary" VARCHAR(256) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "voucher_number" VARCHAR(256),
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);


-- Projects Tables
CREATE TABLE "projects" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "client_id" VARCHAR(256) NOT NULL REFERENCES "customers"("id"),
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "budget" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مخطط له',
    "progress" INTEGER DEFAULT 0,
    "manager_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id"),
    "notes" TEXT
);

CREATE TABLE "project_tasks" (
    "id" VARCHAR(256) PRIMARY KEY,
    "project_id" VARCHAR(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "name" VARCHAR(256) NOT NULL,
    "assignee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id"),
    "due_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مخطط لها',
    "priority" VARCHAR(50) NOT NULL DEFAULT 'متوسطة',
    "notes" TEXT
);

CREATE TABLE "project_resources" (
    "id" VARCHAR(256) PRIMARY KEY,
    "project_id" VARCHAR(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "employee_id" VARCHAR(256) NOT NULL REFERENCES "employees"("id"),
    "role" VARCHAR(256) NOT NULL,
    "allocation" INTEGER DEFAULT 100,
    "notes" TEXT
);

CREATE TABLE "project_budget_items" (
    "id" VARCHAR(256) PRIMARY KEY,
    "project_id" VARCHAR(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "item" VARCHAR(256) NOT NULL,
    "allocated" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "spent" NUMERIC(15, 2) NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- Production Tables
CREATE TABLE "work_orders" (
    "id" VARCHAR(256) PRIMARY KEY,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity" INTEGER NOT NULL,
    "produced_quantity" INTEGER DEFAULT 0,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مجدول',
    "progress" INTEGER DEFAULT 0,
    "notes" TEXT
);

CREATE TABLE "work_order_production_logs" (
    "id" SERIAL PRIMARY KEY,
    "work_order_id" VARCHAR(256) NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
    "date" TIMESTAMP NOT NULL,
    "quantity_produced" INTEGER NOT NULL,
    "notes" TEXT
);

CREATE TABLE "bills_of_material" (
    "id" VARCHAR(256) PRIMARY KEY,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "version" VARCHAR(50) NOT NULL,
    "last_updated" TIMESTAMP
);

CREATE TABLE "bill_of_material_items" (
    "id" SERIAL PRIMARY KEY,
    "bom_id" VARCHAR(256) NOT NULL REFERENCES "bills_of_material"("id") ON DELETE CASCADE,
    "material_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity" NUMERIC(10, 4) NOT NULL
);

CREATE TABLE "production_plans" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    "notes" TEXT
);

CREATE TABLE "quality_checks" (
    "id" VARCHAR(256) PRIMARY KEY,
    "work_order_id" VARCHAR(256) NOT NULL REFERENCES "work_orders"("id"),
    "check_point" VARCHAR(256) NOT NULL,
    "result" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "inspector_id" VARCHAR(256) NOT NULL,
    "notes" TEXT
);

-- Inventory Control Tables
CREATE TABLE "warehouses" (
    "id" VARCHAR(256) PRIMARY KEY,
    "name" VARCHAR(256) NOT NULL,
    "location" TEXT
);

CREATE TABLE "stocktakes" (
    "id" VARCHAR(256) PRIMARY KEY,
    "stocktake_date" TIMESTAMP NOT NULL,
    "warehouse_id" VARCHAR(256) NOT NULL REFERENCES "warehouses"("id"),
    "responsible_person" VARCHAR(256) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مجدول',
    "notes" TEXT
);

CREATE TABLE "inventory_adjustments" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "type" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" VARCHAR(256) NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "inventory_transfers" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "from_warehouse_id" VARCHAR(256) NOT NULL,
    "to_warehouse_id" VARCHAR(256) NOT NULL,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    "notes" TEXT
);

CREATE TABLE "stock_issue_vouchers" (
    "id" VARCHAR(256) PRIMARY KEY,
    "date" TIMESTAMP NOT NULL,
    "warehouse_id" VARCHAR(256) NOT NULL REFERENCES "warehouses"("id"),
    "recipient" VARCHAR(256) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    "issued_by" VARCHAR(256)
);

CREATE TABLE "stock_issue_voucher_items" (
    "id" SERIAL PRIMARY KEY,
    "voucher_id" VARCHAR(256) NOT NULL REFERENCES "stock_issue_vouchers"("id") ON DELETE CASCADE,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity_issued" INTEGER NOT NULL,
    "notes" TEXT
);

CREATE TABLE "goods_received_notes" (
    "id" VARCHAR(256) PRIMARY KEY,
    "po_id" VARCHAR(256),
    "supplier_id" VARCHAR(256) NOT NULL REFERENCES "suppliers"("id"),
    "grn_date" TIMESTAMP NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "received_by" VARCHAR(256)
);

CREATE TABLE "goods_received_note_items" (
    "id" SERIAL PRIMARY KEY,
    "grn_id" VARCHAR(256) NOT NULL REFERENCES "goods_received_notes"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT,
    "ordered_quantity" INTEGER,
    "received_quantity" INTEGER NOT NULL,
    "notes" TEXT
);

CREATE TABLE "stock_requisitions" (
    "id" VARCHAR(256) PRIMARY KEY,
    "request_date" TIMESTAMP NOT NULL,
    "requesting_department_or_person" VARCHAR(256) NOT NULL,
    "required_by_date" TIMESTAMP NOT NULL,
    "overall_justification" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'جديد',
    "approved_by" VARCHAR(256),
    "approval_date" TIMESTAMP
);

CREATE TABLE "stock_requisition_items" (
    "id" SERIAL PRIMARY KEY,
    "requisition_id" VARCHAR(256) NOT NULL REFERENCES "stock_requisitions"("id") ON DELETE CASCADE,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity_requested" INTEGER NOT NULL,
    "justification" TEXT
);

CREATE TABLE "purchase_returns" (
    "id" VARCHAR(256) PRIMARY KEY,
    "supplier_id" VARCHAR(256) NOT NULL REFERENCES "suppliers"("id"),
    "date" TIMESTAMP NOT NULL,
    "original_invoice_id" VARCHAR(256),
    "notes" TEXT,
    "total_amount" NUMERIC(10, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة'
);

CREATE TABLE "purchase_return_items" (
    "id" SERIAL PRIMARY KEY,
    "return_id" VARCHAR(256) NOT NULL REFERENCES "purchase_returns"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "reason" TEXT,
    "total" NUMERIC(10, 2) NOT NULL
);

CREATE TABLE "sales_returns" (
    "id" VARCHAR(256) PRIMARY KEY,
    "customer_id" VARCHAR(256) NOT NULL REFERENCES "customers"("id"),
    "invoice_id" VARCHAR(256) REFERENCES "sales_invoices"("id"),
    "date" TIMESTAMP NOT NULL,
    "numeric_total_amount" NUMERIC(10, 2) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'مسودة',
    "notes" TEXT
);

CREATE TABLE "sales_return_items" (
    "id" SERIAL PRIMARY KEY,
    "return_id" VARCHAR(256) NOT NULL REFERENCES "sales_returns"("id") ON DELETE CASCADE,
    "item_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" NUMERIC(10, 2) NOT NULL,
    "total" NUMERIC(10, 2) NOT NULL,
    "reason" TEXT
);


-- POS Tables
CREATE TABLE "pos_sessions" (
    "id" VARCHAR(256) PRIMARY KEY,
    "user_id" VARCHAR(256) NOT NULL REFERENCES "users"("id"),
    "opening_time" TIMESTAMP NOT NULL,
    "closing_time" TIMESTAMP,
    "opening_balance" NUMERIC(10, 2) NOT NULL,
    "closing_balance" NUMERIC(10, 2),
    "expected_balance" NUMERIC(10, 2),
    "cash_sales" NUMERIC(10, 2),
    "card_sales" NUMERIC(10, 2),
    "difference" NUMERIC(10, 2),
    "status" VARCHAR(50) NOT NULL
);

CREATE TABLE "inventory_movement_log" (
    "id" SERIAL PRIMARY KEY,
    "product_id" VARCHAR(256) NOT NULL REFERENCES "products"("id"),
    "quantity" INTEGER NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "date" TIMESTAMP DEFAULT now() NOT NULL,
    "source_type" VARCHAR(50),
    "source_id" VARCHAR(256)
);

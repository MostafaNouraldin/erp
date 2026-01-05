-- This schema is generated based on the Drizzle ORM schema in src/db/schema.ts
-- It includes all tables for system administration, tenant-specific data, and all modules.

-- Drop tables in reverse order of creation to handle dependencies
DROP TABLE IF EXISTS "inventory_movement_log", "pos_sessions", "stock_requisition_items", "stock_requisitions", "goods_received_note_items", "goods_received_notes", "stock_issue_voucher_items", "stock_issue_vouchers", "inventory_transfers", "inventory_adjustments", "stocktakes", "warehouses", "quality_checks", "work_order_production_logs", "bill_of_material_items", "bills_of_material", "work_orders", "production_plans", "project_budget_items", "project_resources", "project_tasks", "projects", "cash_receipts", "cash_expenses", "bank_receipts", "bank_expenses", "checks", "journal_entry_lines", "journal_entries", "disciplinary_warnings", "resignations", "administrative_decisions", "warning_notices", "leave_requests", "overtime", "attendance_records", "employee_settlements", "payrolls", "employee_deductions", "employee_allowances", "deduction_types", "allowance_types", "leave_types", "job_titles", "departments", "purchase_return_items", "purchase_returns", "supplier_invoice_items", "supplier_invoices", "purchase_order_items", "purchase_orders", "sales_return_items", "sales_returns", "sales_invoice_items", "sales_invoices", "sales_order_items", "sales_orders", "quotation_items", "quotations", "bank_accounts", "chart_of_accounts", "categories", "products", "employees", "suppliers", "customers", "notifications", "company_settings", "subscription_requests", "tenant_module_subscriptions", "users", "roles", "tenants" CASCADE;

-- System Administration & SaaS Tables
CREATE TABLE "tenants" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256) UNIQUE NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_configured" boolean DEFAULT false NOT NULL,
    "subscription_end_date" timestamp,
    "created_at" timestamp DEFAULT now(),
    "phone" varchar(50),
    "address" text,
    "vat_number" varchar(50),
    "country" varchar(10)
);

CREATE TABLE "roles" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL,
    "description" text,
    "permissions" jsonb DEFAULT '[]'::jsonb
);

CREATE TABLE "users" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256) UNIQUE NOT NULL,
    "role_id" varchar(256) NOT NULL REFERENCES "roles"("id"),
    "status" varchar(50) DEFAULT 'نشط' NOT NULL,
    "password_hash" text NOT NULL,
    "avatar_url" text,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "tenant_module_subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" varchar(256) NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
    "module_key" varchar(100) NOT NULL,
    "subscribed" boolean DEFAULT false NOT NULL,
    UNIQUE ("tenant_id", "module_key")
);

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
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "country" varchar(10)
);

CREATE TABLE "company_settings" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE "notifications" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" varchar(256) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "message" text NOT NULL,
    "link" text,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Core Tenant-Specific Tables
CREATE TABLE "customers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256),
    "phone" varchar(256),
    "type" varchar(256),
    "opening_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
    "balance" numeric(10, 2) DEFAULT '0' NOT NULL,
    "credit_limit" numeric(10, 2) DEFAULT '0' NOT NULL,
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
    "manager_id" varchar(256) REFERENCES "employees"("id"),
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
    "social_insurance_number" varchar(100),
    "medical_insurance_provider" varchar(256),
    "medical_insurance_policy_number" varchar(100),
    "medical_insurance_class" varchar(100),
    "medical_insurance_start_date" timestamp,
    "medical_insurance_end_date" timestamp,
    "annual_leave_balance" integer DEFAULT 0,
    "sick_leave_balance" integer DEFAULT 0,
    "emergency_leave_balance" integer DEFAULT 0
);

CREATE TABLE "products" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "sku" varchar(256) UNIQUE NOT NULL,
    "name" varchar(256) NOT NULL,
    "description" text,
    "category" varchar(256) NOT NULL,
    "unit" varchar(256) NOT NULL,
    "cost_price" numeric(10, 2) NOT NULL,
    "selling_price" numeric(10, 2) NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "reorder_level" integer DEFAULT 0 NOT NULL,
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
    "balance" numeric(15, 2) DEFAULT '0' NOT NULL,
    "branch_name" varchar(256),
    "is_active" boolean DEFAULT true NOT NULL
);

-- Sales Module Tables
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
    "quote_id" varchar(256) NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "sales_orders" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "quote_id" varchar(256) REFERENCES "quotations"("id") ON DELETE SET NULL,
    "customer_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "date" timestamp NOT NULL,
    "delivery_date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) NOT NULL,
    "notes" text
);

CREATE TABLE "sales_order_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "so_id" varchar(256) NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "sales_invoices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "order_id" varchar(256) REFERENCES "sales_orders"("id") ON DELETE SET NULL,
    "customer_id" varchar(256) NOT NULL,
    "date" timestamp NOT NULL,
    "due_date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "paid_amount" numeric(10, 2) DEFAULT '0',
    "status" varchar(50) NOT NULL,
    "is_deferred_payment" boolean DEFAULT false,
    "source" varchar(50),
    "notes" text,
    "discount_type" varchar(20) DEFAULT 'amount',
    "discount_value" numeric(10, 2) DEFAULT '0',
    "session_id" varchar(256),
    "payment_method" varchar(50)
);

CREATE TABLE "sales_invoice_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "invoice_id" varchar(256) NOT NULL REFERENCES "sales_invoices"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "sales_returns" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "customer_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "invoice_id" varchar(256) REFERENCES "sales_invoices"("id") ON DELETE SET NULL,
    "date" timestamp NOT NULL,
    "numeric_total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
    "notes" text
);

CREATE TABLE "sales_return_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "return_id" varchar(256) NOT NULL REFERENCES "sales_returns"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL,
    "reason" text
);


-- Purchases Module Tables
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
    "po_id" varchar(256) NOT NULL REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "supplier_invoices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "po_id" varchar(256) REFERENCES "purchase_orders"("id") ON DELETE SET NULL,
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "invoice_date" timestamp NOT NULL,
    "due_date" timestamp NOT NULL,
    "total_amount" numeric(10, 2) NOT NULL,
    "paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
    "status" varchar(50) NOT NULL,
    "notes" text
);

CREATE TABLE "supplier_invoice_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "invoice_id" varchar(256) NOT NULL REFERENCES "supplier_invoices"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "total" numeric(10, 2) NOT NULL
);

CREATE TABLE "purchase_returns" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "date" timestamp NOT NULL,
    "original_invoice_id" varchar(256) REFERENCES "supplier_invoices"("id") ON DELETE SET NULL,
    "notes" text,
    "total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "purchase_return_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "return_id" varchar(256) NOT NULL REFERENCES "purchase_returns"("id") ON DELETE CASCADE,
    "item_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "description" text,
    "quantity" integer NOT NULL,
    "unit_price" numeric(10, 2) NOT NULL,
    "reason" text,
    "total" numeric(10, 2) NOT NULL
);


-- HR & Payroll Module Tables
CREATE TABLE "departments" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL
);

CREATE TABLE "job_titles" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL
);

CREATE TABLE "leave_types" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL
);

CREATE TABLE "allowance_types" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL,
    "expense_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id")
);

CREATE TABLE "deduction_types" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) UNIQUE NOT NULL,
    "liability_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id")
);

CREATE TABLE "employee_allowances" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "type_id" varchar(256) NOT NULL REFERENCES "allowance_types"("id"),
    "description" varchar(256) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "type" varchar(50) NOT NULL
);

CREATE TABLE "employee_deductions" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "type_id" varchar(256) NOT NULL REFERENCES "deduction_types"("id"),
    "description" varchar(256) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "type" varchar(50) NOT NULL
);

CREATE TABLE "payrolls" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "month_year" varchar(50) NOT NULL,
    "basic_salary" numeric(10, 2) NOT NULL,
    "allowances" jsonb,
    "deductions" jsonb,
    "net_salary" numeric(10, 2),
    "payment_date" timestamp,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
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
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
    "reference" varchar(256)
);

CREATE TABLE "attendance_records" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" timestamp NOT NULL,
    "check_in" timestamp,
    "check_out" timestamp,
    "status" varchar(50) DEFAULT 'حاضر' NOT NULL,
    "notes" text,
    "hours" varchar(10)
);

CREATE TABLE "overtime" (
    "id" serial PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" timestamp NOT NULL,
    "hours" numeric(5, 2) NOT NULL,
    "rate" numeric(4, 2) DEFAULT '1.5' NOT NULL,
    "amount" numeric(10, 2),
    "notes" text,
    "status" varchar(50) DEFAULT 'pending' NOT NULL
);

CREATE TABLE "leave_requests" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "leave_type" varchar(100) NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "reason" text,
    "status" varchar(50) DEFAULT 'مقدمة' NOT NULL,
    "days" integer
);

CREATE TABLE "warning_notices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "date" timestamp NOT NULL,
    "reason" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "administrative_decisions" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "decision_date" timestamp NOT NULL,
    "decision_type" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_authority" varchar(256) NOT NULL,
    "effective_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "resignations" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "submission_date" timestamp NOT NULL,
    "last_working_date" timestamp NOT NULL,
    "reason" text NOT NULL,
    "manager_notified_date" timestamp,
    "status" varchar(50) DEFAULT 'مقدمة' NOT NULL
);

CREATE TABLE "disciplinary_warnings" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
    "warning_date" timestamp NOT NULL,
    "warning_type" varchar(100) NOT NULL,
    "violation_details" text NOT NULL,
    "action_taken" text,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);


-- Accounting Module Tables
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
    "journal_entry_id" varchar(256) NOT NULL REFERENCES "journal_entries"("id") ON DELETE CASCADE,
    "account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "debit" numeric(15, 2) DEFAULT '0' NOT NULL,
    "credit" numeric(15, 2) DEFAULT '0' NOT NULL,
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
    "currency" varchar(10) DEFAULT 'SAR' NOT NULL,
    "purpose" text NOT NULL,
    "notes" text,
    "status" varchar(50) DEFAULT 'صادر' NOT NULL
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
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
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
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
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
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "cash_receipts" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "cash_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "revenue_account_id" varchar(256) NOT NULL REFERENCES "chart_of_accounts"("id"),
    "payer_name" varchar(256) NOT NULL,
    "customer_id" varchar(256) REFERENCES "customers"("id"),
    "description" text NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "reference_number" varchar(256),
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

-- Projects Module Tables
CREATE TABLE "projects" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "client_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "budget" numeric(15, 2) DEFAULT '0' NOT NULL,
    "status" varchar(50) DEFAULT 'مخطط له' NOT NULL,
    "progress" integer DEFAULT 0,
    "manager_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "notes" text
);

CREATE TABLE "project_tasks" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "name" varchar(256) NOT NULL,
    "assignee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "due_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مخطط لها' NOT NULL,
    "priority" varchar(50) DEFAULT 'متوسطة' NOT NULL,
    "notes" text
);

CREATE TABLE "project_resources" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "role" varchar(256) NOT NULL,
    "allocation" integer DEFAULT 100,
    "notes" text
);

CREATE TABLE "project_budget_items" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
    "item" varchar(256) NOT NULL,
    "allocated" numeric(15, 2) DEFAULT '0' NOT NULL,
    "spent" numeric(15, 2) DEFAULT '0' NOT NULL,
    "notes" text
);

-- Production Module Tables
CREATE TABLE "work_orders" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "produced_quantity" integer DEFAULT 0,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مجدول' NOT NULL,
    "progress" integer DEFAULT 0,
    "notes" text
);

CREATE TABLE "work_order_production_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "work_order_id" varchar(256) NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
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
    "bom_id" varchar(256) NOT NULL REFERENCES "bills_of_material"("id") ON DELETE CASCADE,
    "material_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" numeric(10, 4) NOT NULL
);

CREATE TABLE "production_plans" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "start_date" timestamp NOT NULL,
    "end_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
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

-- Inventory Control Module Tables
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
    "status" varchar(50) DEFAULT 'مجدول' NOT NULL,
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
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "inventory_transfers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "from_warehouse_id" varchar(256) NOT NULL,
    "to_warehouse_id" varchar(256) NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
    "notes" text
);

CREATE TABLE "stock_issue_vouchers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "date" timestamp NOT NULL,
    "warehouse_id" varchar(256) NOT NULL REFERENCES "warehouses"("id"),
    "recipient" varchar(256) NOT NULL,
    "reason" text NOT NULL,
    "notes" text,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL,
    "issued_by" varchar(256)
);

CREATE TABLE "stock_issue_voucher_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "voucher_id" varchar(256) NOT NULL REFERENCES "stock_issue_vouchers"("id") ON DELETE CASCADE,
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
    "grn_id" varchar(256) NOT NULL REFERENCES "goods_received_notes"("id") ON DELETE CASCADE,
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
    "status" varchar(50) DEFAULT 'جديد' NOT NULL,
    "approved_by" varchar(256),
    "approval_date" timestamp
);

CREATE TABLE "stock_requisition_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "requisition_id" varchar(256) NOT NULL REFERENCES "stock_requisitions"("id") ON DELETE CASCADE,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity_requested" integer NOT NULL,
    "justification" text
);

-- POS Module Tables
CREATE TABLE "pos_sessions" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "user_id" varchar(256) NOT NULL REFERENCES "users"("id"),
    "opening_time" timestamp NOT NULL,
    "closing_time" timestamp,
    "opening_balance" numeric(10, 2) NOT NULL,
    "closing_balance" numeric(10, 2),
    "expected_balance" numeric(10, 2),
    "cash_sales" numeric(10, 2),
    "card_sales" numeric(10, 2),
    "difference" numeric(10, 2),
    "status" varchar(50) NOT NULL
);

-- Log Tables
CREATE TABLE "inventory_movement_log" (
    "id" serial PRIMARY KEY NOT NULL,
    "product_id" varchar(256) NOT NULL REFERENCES "products"("id"),
    "quantity" integer NOT NULL,
    "type" varchar(10) NOT NULL,
    "date" timestamp DEFAULT now() NOT NULL,
    "source_type" varchar(50),
    "source_id" varchar(256)
);

-- Initial Data for Roles
INSERT INTO "roles" ("id", "name", "description", "permissions") VALUES
('ROLE_SUPER_ADMIN', 'Super Admin', 'صلاحيات كاملة على النظام وإدارة الشركات.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests", "settings.view", "help.view"]'),
('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["dashboard.view", "accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "settings.manage_subscription", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use", "help.view"]'),
('ROLE002', 'محاسب', 'صلاحيات على وحدات الحسابات والمالية.', '["dashboard.view", "accounting.view", "accounting.create", "accounting.edit", "reports.view_financial", "help.view"]'),
('ROLE003', 'موظف مبيعات', 'صلاحيات على وحدة المبيعات وعروض الأسعار.', '["dashboard.view", "sales.view", "sales.create", "reports.view_sales", "help.view"]'),
('ROLE004', 'مدير مخزون', 'صلاحيات على وحدة المخزون والمستودعات.', '["dashboard.view", "inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock", "help.view"]');

-- Initial Data for Super Admin User
-- IMPORTANT: Replace 'hashed_superadmin_password' with a real, securely hashed password in production.
INSERT INTO "users" ("id", "name", "email", "role_id", "password_hash") VALUES
('SUPER_ADMIN_USER', 'Super Admin', 'super@admin.com', 'ROLE_SUPER_ADMIN', 'hashed_superadmin_password');

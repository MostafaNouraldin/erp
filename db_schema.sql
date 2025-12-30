-- Drop existing tables in reverse order of creation to avoid foreign key constraints
DROP TABLE IF EXISTS "purchase_return_items";
DROP TABLE IF EXISTS "purchase_returns";
DROP TABLE IF EXISTS "goods_received_note_items";
DROP TABLE IF EXISTS "goods_received_notes";
DROP TABLE IF EXISTS "inventory_transfers";
DROP TABLE IF EXISTS "inventory_adjustments";
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
DROP TABLE IF EXISTS "payrolls";
DROP TABLE IF EXISTS "leave_requests";
DROP TABLE IF EXISTS "attendance_records";
DROP TABLE IF EXISTS "employee_settlements";
DROP TABLE IF EXISTS "disciplinary_warnings";
DROP TABLE IF EXISTS "resignations";
DROP TABLE IF EXISTS "administrative_decisions";
DROP TABLE IF EXISTS "warning_notices";
DROP TABLE IF EXISTS "supplier_invoice_items";
DROP TABLE IF EXISTS "supplier_invoices";
DROP TABLE IF EXISTS "purchase_order_items";
DROP TABLE IF EXISTS "purchase_orders";
DROP TABLE IF EXISTS "sales_invoice_items";
DROP TABLE IF EXISTS "sales_invoices";
DROP TABLE IF EXISTS "sales_order_items";
DROP TABLE IF EXISTS "sales_orders";
DROP TABLE IF EXISTS "quotation_items";
DROP TABLE IF EXISTS "quotations";
DROP TABLE IF EXISTS "categories";
DROP TABLE IF EXISTS "products";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "suppliers";
DROP TABLE IF EXISTS "bank_accounts";
DROP TABLE IF EXISTS "chart_of_accounts";
DROP TABLE IF EXISTS "subscription_requests";
DROP TABLE IF EXISTS "tenant_module_subscriptions";
DROP TABLE IF EXISTS "tenants";


-- Main Tables (for system administration)
CREATE TABLE "tenants" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true,
	"subscription_end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"phone" varchar(50),
	"address" text,
	"vat_number" varchar(50),
	CONSTRAINT "tenants_email_unique" UNIQUE("email")
);

CREATE TABLE "tenant_module_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar(256) NOT NULL,
	"module_key" varchar(100) NOT NULL,
	"subscribed" boolean DEFAULT false NOT NULL
);

CREATE UNIQUE INDEX "tenant_module_unique_idx" ON "tenant_module_subscriptions" ("tenant_id","module_key");

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
	"created_at" timestamp DEFAULT now()
);

-- Tenant-Specific Tables
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
    "status" varchar(50) DEFAULT 'نشط' NOT NULL,
    "password_hash" text NOT NULL,
    "avatar_url" text,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "customers" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "name" varchar(256) NOT NULL,
    "email" varchar(256),
    "phone" varchar(256),
    "type" varchar(256),
    "balance" numeric(10, 2) DEFAULT '0' NOT NULL,
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
    "customer_id" varchar(256) NOT NULL REFERENCES "customers"("id"),
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
    "paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
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
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "date" timestamp NOT NULL,
    "check_in" timestamp,
    "check_out" timestamp,
    "status" varchar(50) DEFAULT 'حاضر' NOT NULL,
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
    "status" varchar(50) DEFAULT 'مقدمة' NOT NULL,
    "days" integer
);

CREATE TABLE "warning_notices" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "date" timestamp NOT NULL,
    "reason" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "administrative_decisions" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "decision_date" timestamp NOT NULL,
    "decision_type" varchar(256) NOT NULL,
    "details" text NOT NULL,
    "issuing_authority" varchar(256) NOT NULL,
    "effective_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE "resignations" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "submission_date" timestamp NOT NULL,
    "last_working_date" timestamp NOT NULL,
    "reason" text NOT NULL,
    "manager_notified_date" timestamp,
    "status" varchar(50) DEFAULT 'مقدمة' NOT NULL
);

CREATE TABLE "disciplinary_warnings" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "employee_id" varchar(256) NOT NULL REFERENCES "employees"("id") ON DELETE cascade,
    "warning_date" timestamp NOT NULL,
    "warning_type" varchar(100) NOT NULL,
    "violation_details" text NOT NULL,
    "action_taken" text,
    "issuing_manager" varchar(256) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

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
    "project_id" varchar(256) NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
    "name" varchar(256) NOT NULL,
    "assignee_id" varchar(256) NOT NULL REFERENCES "employees"("id"),
    "due_date" timestamp NOT NULL,
    "status" varchar(50) DEFAULT 'مخطط لها' NOT NULL,
    "priority" varchar(50) DEFAULT 'متوسطة' NOT NULL,
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
    "allocated" numeric(15, 2) DEFAULT '0' NOT NULL,
    "spent" numeric(15, 2) DEFAULT '0' NOT NULL,
    "notes" text
);

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

CREATE TABLE "goods_received_notes" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "po_id" varchar(256) NOT NULL REFERENCES "purchase_orders"("id"),
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
    "ordered_quantity" integer NOT NULL,
    "received_quantity" integer NOT NULL,
    "notes" text
);

CREATE TABLE "purchase_returns" (
    "id" varchar(256) PRIMARY KEY NOT NULL,
    "supplier_id" varchar(256) NOT NULL REFERENCES "suppliers"("id"),
    "date" timestamp NOT NULL,
    "original_invoice_id" varchar(256),
    "notes" text,
    "total_amount" numeric(10, 2) NOT NULL,
    "status" varchar(50) DEFAULT 'مسودة' NOT NULL
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

DO $$
 BEGIN
 IF NOT EXISTS (SELECT 1 FROM "tenants") THEN
    INSERT INTO "tenants" ("id", "name", "email", "is_active", "subscription_end_date") VALUES
    ('T001', 'شركة المستقبل التجريبية', 'admin@example.com', true, NOW() + interval '1 year');
 END IF;
END $$;

DO $$
 BEGIN
 IF NOT EXISTS (SELECT 1 FROM "tenant_module_subscriptions" WHERE "tenant_id" = 'T001') THEN
    INSERT INTO "tenant_module_subscriptions" ("tenant_id", "module_key", "subscribed") VALUES
    ('T001', 'Dashboard', true),
    ('T001', 'Accounting', true),
    ('T001', 'Inventory', true),
    ('T001', 'Sales', true),
    ('T001', 'Purchases', true),
    ('T001', 'HR', true),
    ('T001', 'Production', true),
    ('T001', 'Projects', true),
    ('T001', 'POS', true),
    ('T001', 'BI', true),
    ('T001', 'Settings', true),
    ('T001', 'Help', true),
    ('T001', 'SystemAdministration', true);
 END IF;
END $$;


CREATE TABLE IF NOT EXISTS "customers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256),
	"phone" varchar(256),
	"type" varchar(256),
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"address" text,
	"vat_number" varchar(256)
);

CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256),
	"phone" varchar(256),
	"address" text,
	"vat_number" varchar(256),
	"contact_person" varchar(256),
	"notes" text
);

CREATE TABLE IF NOT EXISTS "employees" (
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

CREATE TABLE IF NOT EXISTS "products" (
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
	"supplier_id" varchar(256),
	"image" text,
	"data_ai_hint" varchar(256),
    "is_raw_material" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "categories" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text
);

CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"parent_id" varchar(256),
	"balance" numeric(15, 2) DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS "bank_accounts" (
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

CREATE TABLE IF NOT EXISTS "sales_invoices" (
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

CREATE TABLE IF NOT EXISTS "sales_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"supplier_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"expected_delivery_date" timestamp NOT NULL,
	"notes" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "supplier_invoices" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"po_id" varchar(256),
	"supplier_id" varchar(256) NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "supplier_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "journal_entries" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"description" text NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"status" varchar(50) NOT NULL,
	"source_module" varchar(100),
	"source_document_id" varchar(256)
);

CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"journal_entry_id" varchar(256) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text
);

CREATE TABLE IF NOT EXISTS "employee_allowances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS "employee_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS "employee_settlements" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"settlement_type" varchar(100) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"payment_method" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"reference" varchar(256)
);

CREATE TABLE IF NOT EXISTS "attendance_records" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"status" varchar(50) DEFAULT 'حاضر' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "leave_requests" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"leave_type" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"status" varchar(50) DEFAULT 'مقدمة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"client_id" varchar(256) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"budget" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'مخطط له' NOT NULL,
	"progress" integer DEFAULT 0,
	"manager_id" varchar(256) NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "project_tasks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"assignee_id" varchar(256) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مخطط لها' NOT NULL,
	"priority" varchar(50) DEFAULT 'متوسطة' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "project_resources" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"role" varchar(256) NOT NULL,
	"allocation" integer DEFAULT 100,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "project_budget_items" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"item" varchar(256) NOT NULL,
	"allocated" numeric(15, 2) DEFAULT '0' NOT NULL,
	"spent" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "work_orders" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity" integer NOT NULL,
	"produced_quantity" integer DEFAULT 0,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مجدول' NOT NULL,
	"progress" integer DEFAULT 0,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "work_order_production_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"quantity_produced" integer NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "bills_of_material" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"version" varchar(50) NOT NULL,
	"last_updated" timestamp
);

CREATE TABLE IF NOT EXISTS "bill_of_material_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bom_id" varchar(256) NOT NULL,
	"material_id" varchar(256) NOT NULL,
	"quantity" numeric(10, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS "production_plans" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "quality_checks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"work_order_id" varchar(256) NOT NULL,
	"check_point" varchar(256) NOT NULL,
	"result" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"inspector_id" varchar(256) NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "inventory_adjustments" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(256) NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_transfers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"from_warehouse_id" varchar(256) NOT NULL,
	"to_warehouse_id" varchar(256) NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "checks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"check_number" varchar(100) NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"bank_account_id" varchar(256) NOT NULL,
	"beneficiary_name" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'SAR' NOT NULL,
	"purpose" text NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'صادر' NOT NULL
);

CREATE TABLE IF NOT EXISTS "bank_expenses" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"bank_account_id" varchar(256) NOT NULL,
	"expense_account_id" varchar(256) NOT NULL,
	"beneficiary" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "bank_receipts" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"bank_account_id" varchar(256) NOT NULL,
	"revenue_account_id" varchar(256) NOT NULL,
	"payer_name" varchar(256) NOT NULL,
	"customer_id" varchar(256),
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "cash_expenses" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"cash_account_id" varchar(256) NOT NULL,
	"expense_account_id" varchar(256) NOT NULL,
	"beneficiary" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"voucher_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

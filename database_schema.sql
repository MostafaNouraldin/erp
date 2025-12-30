
-- Full Database Schema for Al-Mustaqbal ERP System

-- Drop tables in reverse order of creation to handle dependencies, if they exist
DROP TABLE IF EXISTS "work_order_production_logs", "bill_of_material_items", "bills_of_material", "quality_checks", "production_plans", "work_orders";
DROP TABLE IF EXISTS "project_tasks", "project_resources", "project_budget_items", "projects";
DROP TABLE IF EXISTS "sales_invoice_items", "sales_invoices", "purchase_order_items", "purchase_orders", "supplier_invoice_items", "supplier_invoices";
DROP TABLE IF EXISTS "journal_entry_lines", "journal_entries";
DROP TABLE IF EXISTS "employee_allowances", "employee_deductions", "employee_settlements", "attendance_records", "leave_requests";
DROP TABLE IF EXISTS "inventory_adjustments", "inventory_transfers", "checks";
DROP TABLE IF EXISTS "bank_expenses", "cash_expenses", "bank_receipts";
DROP TABLE IF EXISTS "products", "categories", "bank_accounts", "chart_of_accounts", "customers", "suppliers", "employees";

-- Core Tables
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

CREATE TABLE "products" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"sku" varchar(256) NOT NULL,
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
	"is_raw_material" boolean DEFAULT false,
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action
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

-- Transactional Tables
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
	"notes" text,
	CONSTRAINT "sales_invoices_customer_id_customers_id_fk" FOREIGN KEY("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "sales_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	CONSTRAINT "sales_invoice_items_invoice_id_sales_invoices_id_fk" FOREIGN KEY("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "purchase_orders" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"supplier_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"expected_delivery_date" timestamp NOT NULL,
	"notes" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) NOT NULL,
	CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY("po_id") REFERENCES "purchase_orders"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "supplier_invoices" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"po_id" varchar(256),
	"supplier_id" varchar(256) NOT NULL,
	"invoice_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text,
	CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "supplier_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	CONSTRAINT "supplier_invoice_items_invoice_id_supplier_invoices_id_fk" FOREIGN KEY("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE cascade ON UPDATE no action
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
	"journal_entry_id" varchar(256) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"description" text,
	CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action
);

-- HR & Payroll Tables
CREATE TABLE "employee_allowances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	CONSTRAINT "employee_allowances_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "employee_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "employee_settlements" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"settlement_type" varchar(100) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"payment_method" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"reference" varchar(256),
	CONSTRAINT "employee_settlements_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "employee_settlements_account_id_chart_of_accounts_id_fk" FOREIGN KEY("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "attendance_records" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"status" varchar(50) DEFAULT 'حاضر' NOT NULL,
	"notes" text,
	CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "leave_requests" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"leave_type" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"status" varchar(50) DEFAULT 'مقدمة' NOT NULL,
	CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action
);

-- Projects Tables
CREATE TABLE "projects" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"client_id" varchar(256) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"budget" numeric(15, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'مخطط له' NOT NULL,
	"progress" integer DEFAULT 0,
	"manager_id" varchar(256) NOT NULL,
	"notes" text,
	CONSTRAINT "projects_client_id_customers_id_fk" FOREIGN KEY("client_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "projects_manager_id_employees_id_fk" FOREIGN KEY("manager_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "project_tasks" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"assignee_id" varchar(256) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مخطط لها' NOT NULL,
	"priority" varchar(50) DEFAULT 'متوسطة' NOT NULL,
	"notes" text,
	CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "project_tasks_assignee_id_employees_id_fk" FOREIGN KEY("assignee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "project_resources" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"role" varchar(256) NOT NULL,
	"allocation" integer DEFAULT 100,
	"notes" text,
	CONSTRAINT "project_resources_project_id_projects_id_fk" FOREIGN KEY("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "project_resources_employee_id_employees_id_fk" FOREIGN KEY("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "project_budget_items" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"item" varchar(256) NOT NULL,
	"allocated" numeric(15, 2) DEFAULT '0' NOT NULL,
	"spent" numeric(15, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	CONSTRAINT "project_budget_items_project_id_projects_id_fk" FOREIGN KEY("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action
);

-- Production Tables
CREATE TABLE "work_orders" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity" integer NOT NULL,
	"produced_quantity" integer DEFAULT 0,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مجدول' NOT NULL,
	"progress" integer DEFAULT 0,
	"notes" text,
	CONSTRAINT "work_orders_product_id_products_id_fk" FOREIGN KEY("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "work_order_production_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_order_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"quantity_produced" integer NOT NULL,
	"notes" text,
	CONSTRAINT "work_order_production_logs_work_order_id_work_orders_id_fk" FOREIGN KEY("work_order_id") REFERENCES "work_orders"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE "bills_of_material" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"version" varchar(50) NOT NULL,
	"last_updated" timestamp,
	CONSTRAINT "bills_of_material_product_id_products_id_fk" FOREIGN KEY("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "bill_of_material_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bom_id" varchar(256) NOT NULL,
	"material_id" varchar(256) NOT NULL,
	"quantity" numeric(10, 4) NOT NULL,
	CONSTRAINT "bill_of_material_items_bom_id_bills_of_material_id_fk" FOREIGN KEY("bom_id") REFERENCES "bills_of_material"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "bill_of_material_items_material_id_products_id_fk" FOREIGN KEY("material_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action
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
	"work_order_id" varchar(256) NOT NULL,
	"check_point" varchar(256) NOT NULL,
	"result" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"inspector_id" varchar(256) NOT NULL,
	"notes" text,
	CONSTRAINT "quality_checks_work_order_id_work_orders_id_fk" FOREIGN KEY("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action
);

-- Inventory Control Tables
CREATE TABLE "inventory_adjustments" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"type" varchar(50) NOT NULL,
	"quantity" integer NOT NULL,
	"reason" varchar(256) NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	CONSTRAINT "inventory_adjustments_product_id_products_id_fk" FOREIGN KEY("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "inventory_transfers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"from_warehouse_id" varchar(256) NOT NULL,
	"to_warehouse_id" varchar(256) NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"notes" text,
	CONSTRAINT "inventory_transfers_product_id_products_id_fk" FOREIGN KEY("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action
);

-- Other Financial Transaction Tables
CREATE TABLE "checks" (
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
	"status" varchar(50) DEFAULT 'صادر' NOT NULL,
	CONSTRAINT "checks_bank_account_id_bank_accounts_id_fk" FOREIGN KEY("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "bank_expenses" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"bank_account_id" varchar(256) NOT NULL,
	"expense_account_id" varchar(256) NOT NULL,
	"beneficiary" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	CONSTRAINT "bank_expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "bank_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "bank_receipts" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"bank_account_id" varchar(256) NOT NULL,
	"revenue_account_id" varchar(256) NOT NULL,
	"payer_name" varchar(256) NOT NULL,
	"customer_id" varchar(256),
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reference_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	CONSTRAINT "bank_receipts_bank_account_id_bank_accounts_id_fk" FOREIGN KEY("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "bank_receipts_revenue_account_id_chart_of_accounts_id_fk" FOREIGN KEY("revenue_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "bank_receipts_customer_id_customers_id_fk" FOREIGN KEY("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action
);

CREATE TABLE "cash_expenses" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"cash_account_id" varchar(256) NOT NULL,
	"expense_account_id" varchar(256) NOT NULL,
	"beneficiary" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"voucher_number" varchar(256),
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	CONSTRAINT "cash_expenses_cash_account_id_chart_of_accounts_id_fk" FOREIGN KEY("cash_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "cash_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action
);

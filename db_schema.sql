-- Al-Mustaqbal ERP - Full Database Schema
-- Version: 2.0
-- Last Updated: [Current Date]
-- This script is designed to be idempotent and can be run to reset the database schema.

-- Drop tables in reverse order of creation to avoid foreign key constraint issues
DROP TABLE IF EXISTS "inventory_movement_log";
DROP TABLE IF EXISTS "pos_sessions";
DROP TABLE IF EXISTS "purchase_return_items";
DROP TABLE IF EXISTS "purchase_returns";
DROP TABLE IF EXISTS "goods_received_note_items";
DROP TABLE IF EXISTS "goods_received_notes";
DROP TABLE IF EXISTS "stock_issue_voucher_items";
DROP TABLE IF EXISTS "stock_issue_vouchers";
DROP TABLE IF EXISTS "inventory_transfers";
DROP TABLE IF EXISTS "inventory_adjustments";
DROP TABLE IF EXISTS "stocktakes";
DROP TABLE IF EXISTS "warehouses";
DROP TABLE IF EXISTS "bill_of_material_items";
DROP TABLE IF EXISTS "bills_of_material";
DROP TABLE IF EXISTS "work_order_production_logs";
DROP TABLE IF EXISTS "quality_checks";
DROP TABLE IF EXISTS "work_orders";
DROP TABLE IF EXISTS "production_plans";
DROP TABLE IF EXISTS "project_budget_items";
DROP TABLE IF EXISTS "project_resources";
DROP TABLE IF EXISTS "project_tasks";
DROP TABLE IF EXISTS "projects";
DROP TABLE IF EXISTS "cash_receipts";
DROP TABLE IF EXISTS "cash_expenses";
DROP TABLE IF EXISTS "bank_receipts";
DROP TABLE IF EXISTS "bank_expenses";
DROP TABLE IF EXISTS "checks";
DROP TABLE IF EXISTS "journal_entry_lines";
DROP TABLE IF EXISTS "journal_entries";
DROP TABLE IF EXISTS "disciplinary_warnings";
DROP TABLE IF EXISTS "resignations";
DROP TABLE IF EXISTS "administrative_decisions";
DROP TABLE IF EXISTS "warning_notices";
DROP TABLE IF EXISTS "leave_requests";
DROP TABLE IF EXISTS "overtime";
DROP TABLE IF EXISTS "attendance_records";
DROP TABLE IF EXISTS "employee_settlements";
DROP TABLE IF EXISTS "payrolls";
DROP TABLE IF EXISTS "employee_deductions";
DROP TABLE IF EXISTS "employee_allowances";
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
DROP TABLE IF EXISTS "products";
DROP TABLE IF EXISTS "categories";
DROP TABLE IF EXISTS "employees";
DROP TABLE IF EXISTS "suppliers";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "bank_accounts";
DROP TABLE IF EXISTS "chart_of_accounts";
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "company_settings";
DROP TABLE IF EXISTS "subscription_renewal_requests";
DROP TABLE IF EXISTS "subscription_requests";
DROP TABLE IF EXISTS "tenant_module_subscriptions";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "tenants";


-- =============================================
-- SECTION 1: SYSTEM ADMINISTRATION & SAAS TABLES
-- =============================================

-- Table for tenants (companies)
CREATE TABLE "tenants" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true,
    "is_configured" boolean DEFAULT false NOT NULL,
	"subscription_end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"phone" varchar(50),
	"address" text,
	"vat_number" varchar(50),
    "country" varchar(10),
	CONSTRAINT "tenants_email_unique" UNIQUE("email")
);
COMMENT ON TABLE "tenants" IS 'Stores information about each tenant (company) using the system.';

-- Table for system-wide roles (Super Admin, Tenant Admin, etc.)
CREATE TABLE "roles" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
COMMENT ON TABLE "roles" IS 'Defines user roles and their associated permissions across the system.';

-- Table for all users across all tenants
CREATE TABLE "users" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"role_id" varchar(256) NOT NULL,
    "tenant_id" varchar(256), -- Can be NULL for Super Admins
	"status" varchar(50) DEFAULT 'نشط' NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
COMMENT ON TABLE "users" IS 'Stores user accounts for both system administrators and tenant users.';

-- Table linking tenants to their subscribed modules
CREATE TABLE "tenant_module_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar(256) NOT NULL,
	"module_key" varchar(100) NOT NULL,
	"subscribed" boolean DEFAULT false NOT NULL
);
CREATE UNIQUE INDEX "tenant_module_unique_idx" ON "tenant_module_subscriptions" ("tenant_id","module_key");
COMMENT ON TABLE "tenant_module_subscriptions" IS 'Tracks which modules each tenant is subscribed to.';

-- Table for new customer subscription requests
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
COMMENT ON TABLE "subscription_requests" IS 'Stores initial subscription requests from new companies.';

-- Table for subscription renewal/upgrade requests from existing tenants
CREATE TABLE "subscription_renewal_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "tenant_id" varchar(256) NOT NULL,
    "user_id" varchar(256) NOT NULL,
    "selected_modules" jsonb,
    "billing_cycle" varchar(50) NOT NULL,
    "total_amount" numeric(10, 2) NOT NULL,
    "payment_proof" text,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "created_at" timestamp DEFAULT now()
);
COMMENT ON TABLE "subscription_renewal_requests" IS 'Tracks renewal or upgrade requests from existing tenants.';

-- Table for tenant-specific company settings
CREATE TABLE "company_settings" (
	"id" varchar(256) PRIMARY KEY NOT NULL, -- This will be the tenantId
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
COMMENT ON TABLE "company_settings" IS 'Stores tenant-specific configurations like company name, logo, VAT rate, etc.';

-- Table for user notifications
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
COMMENT ON TABLE "notifications" IS 'Stores system notifications for users.';


-- ========================================
-- SECTION 2: TENANT-SPECIFIC CORE TABLES
-- ========================================

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
	"manager_id" varchar(256),
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
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);

CREATE TABLE "categories" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text
);


-- =========================================
-- SECTION 3: TRANSACTIONAL & OPERATIONAL TABLES
-- =========================================

-- Sales
CREATE TABLE "quotations" ( "id" varchar(256) PRIMARY KEY NOT NULL, "customer_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "expiry_date" timestamp NOT NULL, "numeric_total_amount" numeric(10, 2) NOT NULL, "status" varchar(50) NOT NULL, "notes" text );
CREATE TABLE "quotation_items" ( "id" serial PRIMARY KEY NOT NULL, "quote_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL );
CREATE TABLE "sales_orders" ( "id" varchar(256) PRIMARY KEY NOT NULL, "quote_id" varchar(256), "customer_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "delivery_date" timestamp NOT NULL, "numeric_total_amount" numeric(10, 2) NOT NULL, "status" varchar(50) NOT NULL, "notes" text );
CREATE TABLE "sales_order_items" ( "id" serial PRIMARY KEY NOT NULL, "so_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL );
CREATE TABLE "sales_invoices" ( "id" varchar(256) PRIMARY KEY NOT NULL, "order_id" varchar(256), "customer_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "due_date" timestamp NOT NULL, "numeric_total_amount" numeric(10, 2) NOT NULL, "paid_amount" numeric(10, 2) DEFAULT '0', "status" varchar(50) NOT NULL, "is_deferred_payment" boolean DEFAULT false, "source" varchar(50), "discount_type" varchar(20) DEFAULT 'amount', "discount_value" numeric(10, 2) DEFAULT '0', "session_id" varchar(256), "payment_method" varchar(50), "notes" text );
CREATE TABLE "sales_invoice_items" ( "id" serial PRIMARY KEY NOT NULL, "invoice_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL );
CREATE TABLE "sales_returns" ( "id" varchar(256) PRIMARY KEY NOT NULL, "customer_id" varchar(256) NOT NULL, "invoice_id" varchar(256), "date" timestamp NOT NULL, "numeric_total_amount" numeric(10, 2) NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "notes" text );
CREATE TABLE "sales_return_items" ( "id" serial PRIMARY KEY NOT NULL, "return_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL, "reason" text );

-- Purchases
CREATE TABLE "purchase_orders" ( "id" varchar(256) PRIMARY KEY NOT NULL, "supplier_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "expected_delivery_date" timestamp NOT NULL, "notes" text, "total_amount" numeric(10, 2) NOT NULL, "status" varchar(50) NOT NULL );
CREATE TABLE "purchase_order_items" ( "id" serial PRIMARY KEY NOT NULL, "po_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL );
CREATE TABLE "supplier_invoices" ( "id" varchar(256) PRIMARY KEY NOT NULL, "po_id" varchar(256), "supplier_id" varchar(256) NOT NULL, "invoice_date" timestamp NOT NULL, "due_date" timestamp NOT NULL, "total_amount" numeric(10, 2) NOT NULL, "paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL, "status" varchar(50) NOT NULL, "notes" text );
CREATE TABLE "supplier_invoice_items" ( "id" serial PRIMARY KEY NOT NULL, "invoice_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "total" numeric(10, 2) NOT NULL );
CREATE TABLE "purchase_returns" ( "id" varchar(256) PRIMARY KEY NOT NULL, "supplier_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "original_invoice_id" varchar(256), "notes" text, "total_amount" numeric(10, 2) NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "purchase_return_items" ( "id" serial PRIMARY KEY NOT NULL, "return_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text, "quantity" integer NOT NULL, "unit_price" numeric(10, 2) NOT NULL, "reason" text, "total" numeric(10, 2) NOT NULL );

-- HR & Payroll
CREATE TABLE "departments" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL UNIQUE );
CREATE TABLE "job_titles" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL UNIQUE );
CREATE TABLE "leave_types" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL UNIQUE );
CREATE TABLE "allowance_types" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL UNIQUE, "expense_account_id" varchar(256) NOT NULL );
CREATE TABLE "deduction_types" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL UNIQUE, "liability_account_id" varchar(256) NOT NULL );
CREATE TABLE "employee_allowances" ( "id" serial PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "type_id" varchar(256) NOT NULL, "description" varchar(256) NOT NULL, "amount" numeric(10, 2) NOT NULL, "type" varchar(50) NOT NULL );
CREATE TABLE "employee_deductions" ( "id" serial PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "type_id" varchar(256) NOT NULL, "description" varchar(256) NOT NULL, "amount" numeric(10, 2) NOT NULL, "type" varchar(50) NOT NULL );
CREATE TABLE "payrolls" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "month_year" varchar(50) NOT NULL, "basic_salary" numeric(10, 2) NOT NULL, "allowances" jsonb, "deductions" jsonb, "net_salary" numeric(10, 2), "payment_date" timestamp, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "notes" text );
CREATE TABLE "employee_settlements" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "employee_id" varchar(256) NOT NULL, "settlement_type" varchar(100) NOT NULL, "account_id" varchar(256) NOT NULL, "amount" numeric(10, 2) NOT NULL, "description" text NOT NULL, "payment_method" varchar(100) NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "reference" varchar(256) );
CREATE TABLE "attendance_records" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "check_in" timestamp, "check_out" timestamp, "status" varchar(50) DEFAULT 'حاضر' NOT NULL, "notes" text, "hours" varchar(10) );
CREATE TABLE "overtime" ( "id" serial PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "hours" numeric(5, 2) NOT NULL, "rate" numeric(4, 2) DEFAULT '1.5' NOT NULL, "amount" numeric(10, 2), "notes" text, "status" varchar(50) DEFAULT 'pending' NOT NULL );
CREATE TABLE "leave_requests" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "leave_type" varchar(100) NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "reason" text, "status" varchar(50) DEFAULT 'مقدمة' NOT NULL, "days" integer );
CREATE TABLE "warning_notices" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "reason" varchar(256) NOT NULL, "details" text NOT NULL, "issuing_manager" varchar(256) NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "administrative_decisions" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "decision_date" timestamp NOT NULL, "decision_type" varchar(256) NOT NULL, "details" text NOT NULL, "issuing_authority" varchar(256) NOT NULL, "effective_date" timestamp NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "resignations" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "submission_date" timestamp NOT NULL, "last_working_date" timestamp NOT NULL, "reason" text NOT NULL, "manager_notified_date" timestamp, "status" varchar(50) DEFAULT 'مقدمة' NOT NULL );
CREATE TABLE "disciplinary_warnings" ( "id" varchar(256) PRIMARY KEY NOT NULL, "employee_id" varchar(256) NOT NULL, "warning_date" timestamp NOT NULL, "warning_type" varchar(100) NOT NULL, "violation_details" text NOT NULL, "action_taken" text, "issuing_manager" varchar(256) NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL );

-- Accounting
CREATE TABLE "journal_entries" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "description" text NOT NULL, "total_amount" numeric(15, 2) NOT NULL, "status" varchar(50) NOT NULL, "source_module" varchar(100), "source_document_id" varchar(256) );
CREATE TABLE "journal_entry_lines" ( "id" serial PRIMARY KEY NOT NULL, "journal_entry_id" varchar(256) NOT NULL, "account_id" varchar(256) NOT NULL, "debit" numeric(15, 2) DEFAULT '0' NOT NULL, "credit" numeric(15, 2) DEFAULT '0' NOT NULL, "description" text );
CREATE TABLE "checks" ( "id" varchar(256) PRIMARY KEY NOT NULL, "check_number" varchar(100) NOT NULL, "issue_date" timestamp NOT NULL, "due_date" timestamp NOT NULL, "bank_account_id" varchar(256) NOT NULL, "beneficiary_name" varchar(256) NOT NULL, "amount" numeric(10, 2) NOT NULL, "currency" varchar(10) DEFAULT 'SAR' NOT NULL, "purpose" text NOT NULL, "notes" text, "status" varchar(50) DEFAULT 'صادر' NOT NULL );
CREATE TABLE "bank_expenses" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "bank_account_id" varchar(256) NOT NULL, "expense_account_id" varchar(256) NOT NULL, "beneficiary" varchar(256) NOT NULL, "description" text NOT NULL, "amount" numeric(10, 2) NOT NULL, "reference_number" varchar(256), "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "bank_receipts" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "bank_account_id" varchar(256) NOT NULL, "revenue_account_id" varchar(256) NOT NULL, "payer_name" varchar(256) NOT NULL, "customer_id" varchar(256), "description" text NOT NULL, "amount" numeric(10, 2) NOT NULL, "reference_number" varchar(256), "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "cash_expenses" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "cash_account_id" varchar(256) NOT NULL, "expense_account_id" varchar(256) NOT NULL, "beneficiary" varchar(256) NOT NULL, "description" text NOT NULL, "amount" numeric(10, 2) NOT NULL, "voucher_number" varchar(256), "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "cash_receipts" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "cash_account_id" varchar(256) NOT NULL, "revenue_account_id" varchar(256) NOT NULL, "payer_name" varchar(256) NOT NULL, "customer_id" varchar(256), "description" text NOT NULL, "amount" numeric(10, 2) NOT NULL, "reference_number" varchar(256), "status" varchar(50) DEFAULT 'مسودة' NOT NULL );

-- Projects
CREATE TABLE "projects" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL, "client_id" varchar(256) NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "budget" numeric(15, 2) DEFAULT '0' NOT NULL, "status" varchar(50) DEFAULT 'مخطط له' NOT NULL, "progress" integer DEFAULT 0, "manager_id" varchar(256) NOT NULL, "notes" text );
CREATE TABLE "project_tasks" ( "id" varchar(256) PRIMARY KEY NOT NULL, "project_id" varchar(256) NOT NULL, "name" varchar(256) NOT NULL, "assignee_id" varchar(256) NOT NULL, "due_date" timestamp NOT NULL, "status" varchar(50) DEFAULT 'مخطط لها' NOT NULL, "priority" varchar(50) DEFAULT 'متوسطة' NOT NULL, "notes" text );
CREATE TABLE "project_resources" ( "id" varchar(256) PRIMARY KEY NOT NULL, "project_id" varchar(256) NOT NULL, "employee_id" varchar(256) NOT NULL, "role" varchar(256) NOT NULL, "allocation" integer DEFAULT 100, "notes" text );
CREATE TABLE "project_budget_items" ( "id" varchar(256) PRIMARY KEY NOT NULL, "project_id" varchar(256) NOT NULL, "item" varchar(256) NOT NULL, "allocated" numeric(15, 2) DEFAULT '0' NOT NULL, "spent" numeric(15, 2) DEFAULT '0' NOT NULL, "notes" text );

-- Production
CREATE TABLE "work_orders" ( "id" varchar(256) PRIMARY KEY NOT NULL, "product_id" varchar(256) NOT NULL, "quantity" integer NOT NULL, "produced_quantity" integer DEFAULT 0, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "status" varchar(50) DEFAULT 'مجدول' NOT NULL, "progress" integer DEFAULT 0, "notes" text );
CREATE TABLE "work_order_production_logs" ( "id" serial PRIMARY KEY NOT NULL, "work_order_id" varchar(256) NOT NULL, "date" timestamp NOT NULL, "quantity_produced" integer NOT NULL, "notes" text );
CREATE TABLE "bills_of_material" ( "id" varchar(256) PRIMARY KEY NOT NULL, "product_id" varchar(256) NOT NULL, "version" varchar(50) NOT NULL, "last_updated" timestamp );
CREATE TABLE "bill_of_material_items" ( "id" serial PRIMARY KEY NOT NULL, "bom_id" varchar(256) NOT NULL, "material_id" varchar(256) NOT NULL, "quantity" numeric(10, 4) NOT NULL );
CREATE TABLE "production_plans" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL, "start_date" timestamp NOT NULL, "end_date" timestamp NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "notes" text );
CREATE TABLE "quality_checks" ( "id" varchar(256) PRIMARY KEY NOT NULL, "work_order_id" varchar(256) NOT NULL, "check_point" varchar(256) NOT NULL, "result" varchar(50) NOT NULL, "date" timestamp NOT NULL, "inspector_id" varchar(256) NOT NULL, "notes" text );

-- Inventory Control
CREATE TABLE "warehouses" ( "id" varchar(256) PRIMARY KEY NOT NULL, "name" varchar(256) NOT NULL, "location" text );
CREATE TABLE "stocktakes" ( "id" varchar(256) PRIMARY KEY NOT NULL, "stocktake_date" timestamp NOT NULL, "warehouse_id" varchar(256) NOT NULL, "responsible_person" varchar(256) NOT NULL, "status" varchar(50) DEFAULT 'مجدول' NOT NULL, "notes" text );
CREATE TABLE "inventory_adjustments" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "product_id" varchar(256) NOT NULL, "type" varchar(50) NOT NULL, "quantity" integer NOT NULL, "reason" varchar(256) NOT NULL, "notes" text, "status" varchar(50) DEFAULT 'مسودة' NOT NULL );
CREATE TABLE "inventory_transfers" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "from_warehouse_id" varchar(256) NOT NULL, "to_warehouse_id" varchar(256) NOT NULL, "product_id" varchar(256) NOT NULL, "quantity" integer NOT NULL, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "notes" text );
CREATE TABLE "stock_issue_vouchers" ( "id" varchar(256) PRIMARY KEY NOT NULL, "date" timestamp NOT NULL, "warehouse_id" varchar(256) NOT NULL, "recipient" varchar(256) NOT NULL, "reason" text NOT NULL, "notes" text, "status" varchar(50) DEFAULT 'مسودة' NOT NULL, "issued_by" varchar(256) );
CREATE TABLE "stock_issue_voucher_items" ( "id" serial PRIMARY KEY NOT NULL, "voucher_id" varchar(256) NOT NULL, "product_id" varchar(256) NOT NULL, "quantity_issued" integer NOT NULL, "notes" text );
CREATE TABLE "goods_received_notes" ( "id" varchar(256) PRIMARY KEY NOT NULL, "po_id" varchar(256), "supplier_id" varchar(256) NOT NULL, "grn_date" timestamp NOT NULL, "notes" text, "status" varchar(50) NOT NULL, "received_by" varchar(256) );
CREATE TABLE "goods_received_note_items" ( "id" serial PRIMARY KEY NOT NULL, "grn_id" varchar(256) NOT NULL, "item_id" varchar(256) NOT NULL, "description" text, "ordered_quantity" integer, "received_quantity" integer NOT NULL, "notes" text );
CREATE TABLE "stock_requisitions" ( "id" varchar(256) PRIMARY KEY NOT NULL, "request_date" timestamp NOT NULL, "requesting_department_or_person" varchar(256) NOT NULL, "required_by_date" timestamp NOT NULL, "overall_justification" text, "status" varchar(50) DEFAULT 'جديد' NOT NULL, "approved_by" varchar(256), "approval_date" timestamp );
CREATE TABLE "stock_requisition_items" ( "id" serial PRIMARY KEY NOT NULL, "requisition_id" varchar(256) NOT NULL, "product_id" varchar(256) NOT NULL, "quantity_requested" integer NOT NULL, "justification" text );

-- POS
CREATE TABLE "pos_sessions" ( "id" varchar(256) PRIMARY KEY NOT NULL, "user_id" varchar(256) NOT NULL, "opening_time" timestamp NOT NULL, "closing_time" timestamp, "opening_balance" numeric(10, 2) NOT NULL, "closing_balance" numeric(10, 2), "expected_balance" numeric(10, 2), "cash_sales" numeric(10, 2), "card_sales" numeric(10, 2), "difference" numeric(10, 2), "status" varchar(50) NOT NULL );

-- Inventory Log
CREATE TABLE "inventory_movement_log" ( "id" serial PRIMARY KEY NOT NULL, "product_id" varchar(256) NOT NULL, "quantity" integer NOT NULL, "type" varchar(10) NOT NULL, "date" timestamp DEFAULT now() NOT NULL, "source_type" varchar(50), "source_id" varchar(256) );


-- ===================================
-- SECTION 4: FOREIGN KEY CONSTRAINTS
-- ===================================

DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "tenant_module_subscriptions" ADD CONSTRAINT "tenant_module_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quote_id_quotations_id_fk" FOREIGN KEY ("quote_id") REFERENCES "quotations"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quote_id_quotations_id_fk" FOREIGN KEY ("quote_id") REFERENCES "quotations"("id") ON DELETE set null ON UPDATE no action;
 ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_order_id_sales_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE set null ON UPDATE no action;
 ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE set null ON UPDATE no action;
 ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_return_id_sales_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "sales_returns"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "sales_return_items" ADD CONSTRAINT "sales_return_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE set null ON UPDATE no action;
 ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_return_id_purchase_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "purchase_returns"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "allowance_types" ADD CONSTRAINT "allowance_types_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "deduction_types" ADD CONSTRAINT "deduction_types_liability_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("liability_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_type_id_allowance_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "allowance_types"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_dedctions_type_id_deduction_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "deduction_types"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "employee_settlements" ADD CONSTRAINT "employee_settlements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "employee_settlements" ADD CONSTRAINT "employee_settlements_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "overtime" ADD CONSTRAINT "overtime_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "warning_notices" ADD CONSTRAINT "warning_notices_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "administrative_decisions" ADD CONSTRAINT "administrative_decisions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "resignations" ADD CONSTRAINT "resignations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "disciplinary_warnings" ADD CONSTRAINT "disciplinary_warnings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "checks" ADD CONSTRAINT "checks_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bank_expenses" ADD CONSTRAINT "bank_expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bank_expenses" ADD CONSTRAINT "bank_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_revenue_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_cash_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_cash_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_revenue_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "cash_receipts" ADD CONSTRAINT "cash_receipts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_customers_id_fk" FOREIGN KEY ("client_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "project_budget_items" ADD CONSTRAINT "project_budget_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "work_order_production_logs" ADD CONSTRAINT "work_order_production_logs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "bills_of_material" ADD CONSTRAINT "bills_of_material_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_bom_id_bills_of_material_id_fk" FOREIGN KEY ("bom_id") REFERENCES "bills_of_material"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "stock_issue_vouchers" ADD CONSTRAINT "stock_issue_vouchers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "stock_issue_voucher_items" ADD CONSTRAINT "stock_issue_voucher_items_voucher_id_stock_issue_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "stock_issue_vouchers"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "stock_issue_voucher_items" ADD CONSTRAINT "stock_issue_voucher_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "goods_received_note_items" ADD CONSTRAINT "goods_received_note_items_grn_id_goods_received_notes_id_fk" FOREIGN KEY ("grn_id") REFERENCES "goods_received_notes"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "goods_received_note_items" ADD CONSTRAINT "goods_received_note_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "stock_requisitions" ADD CONSTRAINT "stock_requisitions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_requisition_id_stock_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "stock_requisitions"("id") ON DELETE cascade ON UPDATE no action;
 ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
 ALTER TABLE "inventory_movement_log" ADD CONSTRAINT "inventory_movement_log_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


-- ===================================
-- SECTION 5: INITIAL DATA (SEEDING)
-- ===================================

-- Note: You might want to populate some base data here.
-- This is just an example for the main schema roles and a super admin user.
INSERT INTO roles (id, name, description, permissions) VALUES
('ROLE_SUPER_ADMIN', 'Super Admin', 'صلاحيات كاملة على النظام وإدارة الشركات.', '["admin.manage_tenants", "admin.manage_modules", "admin.manage_billing", "admin.manage_requests", "settings.view", "help.view"]'),
('ROLE001', 'مدير النظام', 'صلاحيات كاملة على النظام.', '["accounting.view", "accounting.create", "accounting.edit", "accounting.delete", "accounting.approve", "sales.view", "sales.create", "sales.edit", "sales.delete", "sales.send_quote", "inventory.view", "inventory.create", "inventory.edit", "inventory.delete", "inventory.adjust_stock", "hr.view", "hr.create_employee", "hr.edit_employee", "hr.run_payroll", "reports.view_financial", "reports.view_sales", "reports.view_inventory", "reports.view_hr", "settings.view", "settings.edit_general", "settings.manage_users", "settings.manage_roles", "settings.manage_subscription", "projects.view", "projects.create", "projects.edit", "projects.delete", "production.view", "production.create", "production.edit", "production.delete", "pos.use", "help.view"]'),
('ROLE002', 'محاسب', 'صلاحيات على وحدات الحسابات والمالية.', '["accounting.view", "accounting.create", "accounting.edit", "reports.view_financial", "help.view"]'),
('ROLE003', 'موظف مبيعات', 'صلاحيات على وحدة المبيعات وعروض الأسعار.', '["sales.view", "sales.create", "reports.view_sales", "help.view"]'),
('ROLE004', 'مدير مخزون', 'صلاحيات على وحدة المخزون والمستودعات.', '["inventory.view", "inventory.create", "inventory.edit", "reports.view_inventory", "inventory.adjust_stock", "help.view"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, role_id, password_hash) VALUES
('super_admin', 'Super Admin', 'super@admin.com', 'ROLE_SUPER_ADMIN', 'hashed_superadmin_password')
ON CONFLICT (id) DO NOTHING;

-- You can add default data for a specific tenant (e.g., T001) in a separate script
-- or include it here if this schema is for a single tenant setup.

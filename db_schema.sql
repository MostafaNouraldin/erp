-- This script is generated based on the Drizzle ORM schema.
-- It's recommended to use Drizzle Kit for migrations in a real project.

-- System Administration & Settings Tables
CREATE TABLE IF NOT EXISTS "tenants" (
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

CREATE TABLE IF NOT EXISTS "roles" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"role_id" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'نشط' NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "tenant_module_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar(256) NOT NULL,
	"module_key" varchar(100) NOT NULL,
	"subscribed" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscription_requests" (
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

CREATE TABLE IF NOT EXISTS "company_settings" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Core Tenant-Specific Tables
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

-- Sales & Purchases Tables
CREATE TABLE IF NOT EXISTS "quotations" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"customer_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"numeric_total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "quotation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "sales_orders" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"quote_id" varchar(256),
	"customer_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"delivery_date" timestamp NOT NULL,
	"numeric_total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "sales_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"so_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL
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

-- HR & Payroll Tables
CREATE TABLE IF NOT EXISTS "departments" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "job_titles" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "job_titles_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "leave_types" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "leave_types_name_unique" UNIQUE("name")
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

CREATE TABLE IF NOT EXISTS "payrolls" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"month_year" varchar(50) NOT NULL,
	"basic_salary" numeric(10, 2) NOT NULL,
	"allowances" jsonb,
	"deductions" jsonb,
	"net_salary" numeric(10, 2),
	"payment_date" timestamp,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"notes" text
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
	"notes" text,
	"hours" varchar(10)
);

CREATE TABLE IF NOT EXISTS "leave_requests" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"leave_type" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"status" varchar(50) DEFAULT 'مقدمة' NOT NULL,
	"days" integer
);

CREATE TABLE IF NOT EXISTS "warning_notices" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"reason" varchar(256) NOT NULL,
	"details" text NOT NULL,
	"issuing_manager" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "administrative_decisions" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"decision_date" timestamp NOT NULL,
	"decision_type" varchar(256) NOT NULL,
	"details" text NOT NULL,
	"issuing_authority" varchar(256) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "resignations" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"submission_date" timestamp NOT NULL,
	"last_working_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"manager_notified_date" timestamp,
	"status" varchar(50) DEFAULT 'مقدمة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "disciplinary_warnings" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"employee_id" varchar(256) NOT NULL,
	"warning_date" timestamp NOT NULL,
	"warning_type" varchar(100) NOT NULL,
	"violation_details" text NOT NULL,
	"action_taken" text,
	"issuing_manager" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

-- Accounting Tables
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

-- Projects Tables
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

-- Production Tables
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

-- Inventory Control Tables
CREATE TABLE IF NOT EXISTS "warehouses" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"location" text
);

CREATE TABLE IF NOT EXISTS "stocktakes" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"stocktake_date" timestamp NOT NULL,
	"warehouse_id" varchar(256) NOT NULL,
	"responsible_person" varchar(256) NOT NULL,
	"status" varchar(50) DEFAULT 'مجدول' NOT NULL,
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

CREATE TABLE IF NOT EXISTS "stock_issue_vouchers" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"warehouse_id" varchar(256) NOT NULL,
	"recipient" varchar(256) NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL,
	"issued_by" varchar(256)
);

CREATE TABLE IF NOT EXISTS "stock_issue_voucher_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" varchar(256) NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity_issued" integer NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "goods_received_notes" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"po_id" varchar(256),
	"supplier_id" varchar(256) NOT NULL,
	"grn_date" timestamp NOT NULL,
	"notes" text,
	"status" varchar(50) NOT NULL,
	"received_by" varchar(256)
);

CREATE TABLE IF NOT EXISTS "goods_received_note_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"grn_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"ordered_quantity" integer,
	"received_quantity" integer NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "stock_requisitions" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"request_date" timestamp NOT NULL,
	"requesting_department_or_person" varchar(256) NOT NULL,
	"required_by_date" timestamp NOT NULL,
	"overall_justification" text,
	"status" varchar(50) DEFAULT 'جديد' NOT NULL,
	"approved_by" varchar(256),
	"approval_date" timestamp
);

CREATE TABLE IF NOT EXISTS "stock_requisition_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_id" varchar(256) NOT NULL,
	"product_id" varchar(256) NOT NULL,
	"quantity_requested" integer NOT NULL,
	"justification" text
);

CREATE TABLE IF NOT EXISTS "purchase_returns" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"supplier_id" varchar(256) NOT NULL,
	"date" timestamp NOT NULL,
	"original_invoice_id" varchar(256),
	"notes" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'مسودة' NOT NULL
);

CREATE TABLE IF NOT EXISTS "purchase_return_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"return_id" varchar(256) NOT NULL,
	"item_id" varchar(256) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"reason" text,
	"total" numeric(10, 2) NOT NULL
);

-- Foreign Key Constraints
DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'users_role_id_roles_id_fk') THEN
   ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'tenant_module_subscriptions_tenant_id_tenants_id_fk') THEN
   ALTER TABLE "tenant_module_subscriptions" ADD CONSTRAINT "tenant_module_subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_id_suppliers_id_fk') THEN
   ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'quotations_customer_id_customers_id_fk') THEN
   ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'quotation_items_quote_id_quotations_id_fk') THEN
   ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quote_id_quotations_id_fk" FOREIGN KEY ("quote_id") REFERENCES "quotations"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'quotation_items_item_id_products_id_fk') THEN
   ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_customer_id_customers_id_fk') THEN
   ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_items_so_id_sales_orders_id_fk') THEN
   ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_so_id_sales_orders_id_fk" FOREIGN KEY ("so_id") REFERENCES "sales_orders"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_items_item_id_products_id_fk') THEN
   ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_items_invoice_id_sales_invoices_id_fk') THEN
   ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "sales_invoices"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'sales_invoice_items_item_id_products_id_fk') THEN
   ALTER TABLE "sales_invoice_items" ADD CONSTRAINT "sales_invoice_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_orders_supplier_id_suppliers_id_fk') THEN
   ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_po_id_purchase_orders_id_fk') THEN
   ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_order_items_item_id_products_id_fk') THEN
   ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoices_supplier_id_suppliers_id_fk') THEN
   ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoice_items_invoice_id_supplier_invoices_id_fk') THEN
   ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_invoice_id_supplier_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "supplier_invoices"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'supplier_invoice_items_item_id_products_id_fk') THEN
   ALTER TABLE "supplier_invoice_items" ADD CONSTRAINT "supplier_invoice_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'employee_allowances_employee_id_employees_id_fk') THEN
   ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'employee_deductions_employee_id_employees_id_fk') THEN
   ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'payrolls_employee_id_employees_id_fk') THEN
   ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'employee_settlements_employee_id_employees_id_fk') THEN
   ALTER TABLE "employee_settlements" ADD CONSTRAINT "employee_settlements_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'employee_settlements_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "employee_settlements" ADD CONSTRAINT "employee_settlements_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'attendance_records_employee_id_employees_id_fk') THEN
   ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'leave_requests_employee_id_employees_id_fk') THEN
   ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'warning_notices_employee_id_employees_id_fk') THEN
   ALTER TABLE "warning_notices" ADD CONSTRAINT "warning_notices_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'administrative_decisions_employee_id_employees_id_fk') THEN
   ALTER TABLE "administrative_decisions" ADD CONSTRAINT "administrative_decisions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'resignations_employee_id_employees_id_fk') THEN
   ALTER TABLE "resignations" ADD CONSTRAINT "resignations_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'disciplinary_warnings_employee_id_employees_id_fk') THEN
   ALTER TABLE "disciplinary_warnings" ADD CONSTRAINT "disciplinary_warnings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'journal_entry_lines_journal_entry_id_journal_entries_id_fk') THEN
   ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'journal_entry_lines_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'checks_bank_account_id_bank_accounts_id_fk') THEN
   ALTER TABLE "checks" ADD CONSTRAINT "checks_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bank_expenses_bank_account_id_bank_accounts_id_fk') THEN
   ALTER TABLE "bank_expenses" ADD CONSTRAINT "bank_expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bank_expenses_expense_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "bank_expenses" ADD CONSTRAINT "bank_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bank_receipts_bank_account_id_bank_accounts_id_fk') THEN
   ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bank_receipts_revenue_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_revenue_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bank_receipts_customer_id_customers_id_fk') THEN
   ALTER TABLE "bank_receipts" ADD CONSTRAINT "bank_receipts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'cash_expenses_cash_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_cash_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'cash_expenses_expense_account_id_chart_of_accounts_id_fk') THEN
   ALTER TABLE "cash_expenses" ADD CONSTRAINT "cash_expenses_expense_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("expense_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_customers_id_fk') THEN
   ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_customers_id_fk" FOREIGN KEY ("client_id") REFERENCES "customers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'projects_manager_id_employees_id_fk') THEN
   ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'project_tasks_project_id_projects_id_fk') THEN
   ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'project_tasks_assignee_id_employees_id_fk') THEN
   ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'project_resources_project_id_projects_id_fk') THEN
   ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'project_resources_employee_id_employees_id_fk') THEN
   ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'project_budget_items_project_id_projects_id_fk') THEN
   ALTER TABLE "project_budget_items" ADD CONSTRAINT "project_budget_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'work_orders_product_id_products_id_fk') THEN
   ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'work_order_production_logs_work_order_id_work_orders_id_fk') THEN
   ALTER TABLE "work_order_production_logs" ADD CONSTRAINT "work_order_production_logs_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bills_of_material_product_id_products_id_fk') THEN
   ALTER TABLE "bills_of_material" ADD CONSTRAINT "bills_of_material_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bill_of_material_items_bom_id_bills_of_material_id_fk') THEN
   ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_bom_id_bills_of_material_id_fk" FOREIGN KEY ("bom_id") REFERENCES "bills_of_material"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'bill_of_material_items_material_id_products_id_fk') THEN
   ALTER TABLE "bill_of_material_items" ADD CONSTRAINT "bill_of_material_items_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'quality_checks_work_order_id_work_orders_id_fk') THEN
   ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stocktakes_warehouse_id_warehouses_id_fk') THEN
   ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'inventory_adjustments_product_id_products_id_fk') THEN
   ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'inventory_transfers_product_id_products_id_fk') THEN
   ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stock_issue_vouchers_warehouse_id_warehouses_id_fk') THEN
   ALTER TABLE "stock_issue_vouchers" ADD CONSTRAINT "stock_issue_vouchers_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stock_issue_voucher_items_voucher_id_stock_issue_vouchers_id_fk') THEN
   ALTER TABLE "stock_issue_voucher_items" ADD CONSTRAINT "stock_issue_voucher_items_voucher_id_stock_issue_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "stock_issue_vouchers"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stock_issue_voucher_items_product_id_products_id_fk') THEN
   ALTER TABLE "stock_issue_voucher_items" ADD CONSTRAINT "stock_issue_voucher_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'goods_received_notes_supplier_id_suppliers_id_fk') THEN
   ALTER TABLE "goods_received_notes" ADD CONSTRAINT "goods_received_notes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'goods_received_note_items_grn_id_goods_received_notes_id_fk') THEN
   ALTER TABLE "goods_received_note_items" ADD CONSTRAINT "goods_received_note_items_grn_id_goods_received_notes_id_fk" FOREIGN KEY ("grn_id") REFERENCES "goods_received_notes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'goods_received_note_items_item_id_products_id_fk') THEN
   ALTER TABLE "goods_received_note_items" ADD CONSTRAINT "goods_received_note_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stock_requisition_items_requisition_id_stock_requisitions_id_fk') THEN
   ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_requisition_id_stock_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "stock_requisitions"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'stock_requisition_items_product_id_products_id_fk') THEN
   ALTER TABLE "stock_requisition_items" ADD CONSTRAINT "stock_requisition_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_returns_supplier_id_suppliers_id_fk') THEN
   ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_return_items_return_id_purchase_returns_id_fk') THEN
   ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_return_id_purchase_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "purchase_returns"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
 END;
$$;

DO $$
 BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'purchase_return_items_item_id_products_id_fk') THEN
   ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "products"("id") ON DELETE no action ON UPDATE no action;
  END IF;
 END;
$$;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_module_unique_idx" ON "tenant_module_subscriptions" ("tenant_id","module_key");
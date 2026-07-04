-- DELAR ERP DOMAIN BLUEPRINT
-- NO aplicar directamente en producción. Adaptar a migraciones del repositorio.

create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  timezone text not null default 'America/Monterrey',
  base_currency char(3) not null default 'MXN',
  created_at timestamptz not null default now()
);

create table organization_members (
  organization_id uuid not null references organizations(id),
  user_id uuid not null,
  status text not null check (status in ('invited','active','suspended')),
  primary key (organization_id, user_id)
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  code text not null,
  name text not null,
  unique (organization_id, code)
);

create table permissions (
  code text primary key,
  description text not null
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_code text not null references permissions(code),
  primary key (role_id, permission_code)
);

create table member_roles (
  organization_id uuid not null references organizations(id),
  user_id uuid not null,
  role_id uuid not null references roles(id),
  primary key (organization_id, user_id, role_id)
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  active boolean not null default true,
  unique (organization_id, code)
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  branch_id uuid references branches(id),
  code text not null,
  name text not null,
  active boolean not null default true,
  unique (organization_id, code)
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  warehouse_id uuid not null references warehouses(id),
  parent_id uuid references locations(id),
  code text not null,
  name text not null,
  location_type text not null check (location_type in ('storage','receiving','shipping','quarantine','quality','production','scrap','transit','customer','vendor')),
  active boolean not null default true,
  unique (warehouse_id, code)
);

create table uoms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  code text not null,
  name text not null,
  dimension text not null check (dimension in ('count','mass','volume','length','time','other')),
  precision_scale integer not null default 6,
  unique (organization_id, code)
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  unique (organization_id, code)
);

create table product_families (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  category text not null,
  unique (organization_id, code)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  brand_id uuid references brands(id),
  family_id uuid references product_families(id),
  code text not null,
  name text not null,
  supply_type text not null check (supply_type in ('resale','manufactured','co_manufactured','repacked','kit','service')),
  active boolean not null default true,
  unique (organization_id, code)
);

create table skus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  product_id uuid not null references products(id),
  sku text not null,
  name text not null,
  base_uom_id uuid not null references uoms(id),
  net_content numeric(20,6),
  net_content_uom_id uuid references uoms(id),
  track_lot boolean not null default true,
  expiry_required boolean not null default true,
  quality_required boolean not null default false,
  tax_category text,
  active boolean not null default true,
  unique (organization_id, sku)
);

create table sku_packagings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  sku_id uuid not null references skus(id),
  code text not null,
  name text not null,
  quantity_in_base numeric(20,6) not null check (quantity_in_base > 0),
  ean text,
  dun text,
  is_sales_default boolean not null default false,
  is_purchase_default boolean not null default false,
  unique (organization_id, sku_id, code)
);

create table price_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  name text not null,
  currency char(3) not null default 'MXN',
  valid_from date,
  valid_to date,
  status text not null check (status in ('draft','approved','active','expired','archived')),
  unique (organization_id, code, valid_from)
);

create table price_list_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  price_list_id uuid not null references price_lists(id),
  sku_id uuid not null references skus(id),
  packaging_id uuid references sku_packagings(id),
  min_quantity numeric(20,6) not null default 0,
  min_order_amount numeric(20,4),
  unit_price numeric(20,4) not null check (unit_price >= 0),
  case_price_override numeric(20,4),
  unique (price_list_id, sku_id, packaging_id, min_quantity, min_order_amount)
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  legal_name text not null,
  tax_id text,
  active boolean not null default true,
  unique (organization_id, code)
);

create table vendor_skus (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  vendor_id uuid not null references vendors(id),
  sku_id uuid not null references skus(id),
  vendor_code text,
  purchase_packaging_id uuid references sku_packagings(id),
  lead_time_days integer not null default 0,
  minimum_order_quantity numeric(20,6) not null default 0,
  last_price numeric(20,4),
  unique (vendor_id, sku_id, purchase_packaging_id)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  code text not null,
  legal_name text not null,
  tax_id text,
  default_price_list_id uuid references price_lists(id),
  credit_limit numeric(20,4),
  payment_terms_code text,
  active boolean not null default true,
  unique (organization_id, code)
);

create table lots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  sku_id uuid not null references skus(id),
  lot_number text not null,
  supplier_lot text,
  manufactured_at timestamptz,
  expires_at timestamptz,
  quality_status text not null check (quality_status in ('quarantine','pending','released','conditional','rejected','expired','recalled')),
  unit_cost numeric(20,6),
  unique (organization_id, sku_id, lot_number)
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  sku_id uuid not null references skus(id),
  lot_id uuid references lots(id),
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  quantity_base numeric(20,6) not null check (quantity_base > 0),
  movement_type text not null,
  document_type text not null,
  document_id uuid not null,
  idempotency_key text not null,
  occurred_at timestamptz not null default now(),
  posted_by uuid,
  reversal_of uuid references inventory_movements(id),
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id, idempotency_key)
);

create index inventory_movements_trace_idx
  on inventory_movements (organization_id, sku_id, lot_id, occurred_at);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  correlation_id text not null,
  reason text,
  diff jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_entity_idx
  on audit_events (organization_id, entity_type, entity_id, created_at desc);

create table outbox_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','dead_letter')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- Agregar por migraciones posteriores: documentos de venta/compra, POS, producción,
-- calidad, aprobaciones, journal entries y attachments. Mantener invariantes y RLS.

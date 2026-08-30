-- ========================================
-- CHATURTHI ENTERPRISES - COMPLETE SCHEMA
-- Run this in Supabase SQL Editor
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- DROP (for fresh start)
-- =====================
DROP TABLE IF EXISTS daily_entry_items CASCADE;
DROP TABLE IF EXISTS daily_entries CASCADE;
DROP TABLE IF EXISTS product_ranges CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS route_managers CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- =====================
-- ORGANIZATIONS
-- =====================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROUTE MANAGERS
-- =====================
CREATE TABLE route_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SHOPS (now linked to route_manager)
-- =====================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  route_manager_id UUID REFERENCES route_managers(id),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PRODUCT RANGES
-- =====================
CREATE TABLE product_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  label TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  litres_per_unit NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DAILY ENTRIES
-- =====================
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  shop_id UUID REFERENCES shops(id),
  entry_date DATE NOT NULL,
  total_litres NUMERIC DEFAULT 0,
  total_units NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, entry_date)
);

-- =====================
-- DAILY ENTRY ITEMS
-- =====================
CREATE TABLE daily_entry_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_entry_id UUID REFERENCES daily_entries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_range_id UUID REFERENCES product_ranges(id),
  count NUMERIC DEFAULT 0,
  unit_quantity NUMERIC,
  unit TEXT,
  litres_per_unit_snapshot NUMERIC,
  litres NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entry_items ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (V1 - no auth required)
CREATE POLICY "anon_all_organizations" ON organizations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_route_managers" ON route_managers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_shops" ON shops FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_product_ranges" ON product_ranges FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_daily_entries" ON daily_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_daily_entry_items" ON daily_entry_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Authenticated users
CREATE POLICY "auth_all_organizations" ON organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_route_managers" ON route_managers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_shops" ON shops FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_product_ranges" ON product_ranges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_daily_entries" ON daily_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_daily_entry_items" ON daily_entry_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

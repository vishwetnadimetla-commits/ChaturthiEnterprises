-- ============================================
-- CHATURTHI ENTERPRISES - SEED DATA
-- Run AFTER schema.sql
-- ============================================

-- 1. Organization
INSERT INTO organizations (id, name, is_active)
VALUES ('11111111-0000-0000-0000-000000000001', 'Chaturthi Enterprises', true);

-- 2. Route Managers (2 default routes — populate actual names later)
INSERT INTO route_managers (id, organization_id, name, is_active, sort_order) VALUES
  ('22220000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Route A', true, 1),
  ('22220000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Route B', true, 2);

-- 3. Products
INSERT INTO products (id, organization_id, name, short_name, sort_order) VALUES
  ('33330000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Toned Milk',        'TM',   1),
  ('33330000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Standardised Milk', 'SM',   2),
  ('33330000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Full Cream Milk',   'FCM',  3),
  ('33330000-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', 'Curd',              'CURD', 4),
  ('33330000-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Taak',              'TAAK', 5);

-- 4. Product Ranges (exact pack sizes provided)
-- TM: 140ML, 250ML
INSERT INTO product_ranges (id, product_id, label, quantity, unit, litres_per_unit, sort_order) VALUES
  ('44440000-0000-0000-0001-000000000001', '33330000-0000-0000-0000-000000000001', '140 ml', 140, 'ML', 0.140, 1),
  ('44440000-0000-0000-0001-000000000002', '33330000-0000-0000-0000-000000000001', '250 ml', 250, 'ML', 0.250, 2);

-- SM: 250ML, 500ML
INSERT INTO product_ranges (id, product_id, label, quantity, unit, litres_per_unit, sort_order) VALUES
  ('44440000-0000-0000-0002-000000000001', '33330000-0000-0000-0000-000000000002', '250 ml', 250, 'ML', 0.250, 1),
  ('44440000-0000-0000-0002-000000000002', '33330000-0000-0000-0000-000000000002', '500 ml', 500, 'ML', 0.500, 2);

-- FCM: 250ML, 500ML
INSERT INTO product_ranges (id, product_id, label, quantity, unit, litres_per_unit, sort_order) VALUES
  ('44440000-0000-0000-0003-000000000001', '33330000-0000-0000-0000-000000000003', '250 ml', 250, 'ML', 0.250, 1),
  ('44440000-0000-0000-0003-000000000002', '33330000-0000-0000-0000-000000000003', '500 ml', 500, 'ML', 0.500, 2);

-- CURD: 100GM, 500GM
INSERT INTO product_ranges (id, product_id, label, quantity, unit, litres_per_unit, sort_order) VALUES
  ('44440000-0000-0000-0004-000000000001', '33330000-0000-0000-0000-000000000004', '100 gm', 100, 'GM', 0.100, 1),
  ('44440000-0000-0000-0004-000000000002', '33330000-0000-0000-0000-000000000004', '500 gm', 500, 'GM', 0.500, 2);

-- TAAK: 400ML
INSERT INTO product_ranges (id, product_id, label, quantity, unit, litres_per_unit, sort_order) VALUES
  ('44440000-0000-0000-0005-000000000001', '33330000-0000-0000-0000-000000000005', '400 ml', 400, 'ML', 0.400, 1);

-- 5. Shops (seeded with placeholder — replace with actual shops from Google Form responses)
-- Assign to Route A initially. Update route_manager_id once you know your actual routes.
INSERT INTO shops (id, organization_id, route_manager_id, name, code, is_active, sort_order) VALUES
  ('55550000-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22220000-0000-0000-0000-000000000001', 'Gopi Kishan Traders',   'GKT', true, 1),
  ('55550000-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22220000-0000-0000-0000-000000000001', 'Masan Kirana',           'MK',  true, 2),
  ('55550000-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '22220000-0000-0000-0000-000000000002', 'Adam Kirana',            'AK',  true, 3);

-- NOTE: More shops will be imported from Google Form responses once provided.

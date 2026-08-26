-- Shop product catalog READ permission (Phase 1C.5.x)
-- Run in Supabase SQL editor after scripts/86-commerce-pos-foundation.sql
-- Does NOT grant product create/edit (shop:products).
-- Does NOT change products.stock or stock-by-location.

INSERT INTO permissions (key, module, action, description) VALUES
  ('shop:products_view', 'shop', 'products_view', 'Read product catalog for POS and staff lookups (no create/edit)')
ON CONFLICT (key) DO NOTHING;

-- Admin receives all new shop permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key = 'shop:products_view'
ON CONFLICT DO NOTHING;

-- Salesperson: catalog READ for POS (not shop:products management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'salesperson'
  AND p.key = 'shop:products_view'
ON CONFLICT DO NOTHING;

-- Inventory managers already have shop:products; grant explicit view as well
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'inventory_manager'
  AND p.key = 'shop:products_view'
ON CONFLICT DO NOTHING;

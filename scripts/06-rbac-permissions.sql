-- Phase 2 RBAC: roles, permissions, and role-permission mapping
-- Run after scripts/00-create-users-table.sql

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS permissions_module_idx ON permissions (module);
CREATE INDEX IF NOT EXISTS role_permissions_role_idx ON role_permissions (role_id);

-- Seed permissions (aligned with lib/admin/permissions.ts)
INSERT INTO permissions (key, module, action, description) VALUES
  ('admin:access', 'admin', 'access', 'Access admin panel'),
  ('reports:view', 'reports', 'view', 'View dashboard reports'),
  ('users:view', 'users', 'view', 'View users'),
  ('users:create', 'users', 'create', 'Create users'),
  ('users:edit', 'users', 'edit', 'Edit users'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('users:activate', 'users', 'activate', 'Activate/deactivate users'),
  ('users:assign_role', 'users', 'assign_role', 'Assign roles and permissions'),
  ('applications:view', 'applications', 'view', 'View applications'),
  ('applications:approve', 'applications', 'approve', 'Approve applications'),
  ('applications:manage', 'applications', 'manage', 'Manage application status'),
  ('shop:products', 'shop', 'products', 'Manage shop products'),
  ('shop:orders', 'shop', 'orders', 'Manage shop orders'),
  ('shop:categories', 'shop', 'categories', 'Manage shop categories'),
  ('learning:programs', 'learning', 'programs', 'Manage learning programs'),
  ('learning:students', 'learning', 'students', 'Manage students/enrollments'),
  ('content:announcements', 'content', 'announcements', 'Manage announcements'),
  ('content:services', 'content', 'services', 'Manage services'),
  ('support:tickets', 'support', 'tickets', 'Manage support tickets'),
  ('payments:view', 'payments', 'view', 'View submitted payment receipts'),
  ('payments:approve', 'payments', 'approve', 'Approve or reject manual payments'),
  ('settings:manage', 'settings', 'manage', 'Manage system settings')
ON CONFLICT (key) DO NOTHING;

-- Seed system roles
INSERT INTO roles (slug, name, description, is_system) VALUES
  ('admin', 'Super Admin', 'Full platform access', true),
  ('instructor', 'Instructor', 'Learning and student management', true),
  ('mentor', 'Mentor', 'Career and mentorship modules', true),
  ('support_staff', 'Support Engineer', 'Support tickets and applications', true),
  ('engineer', 'Engineer', 'Engineering support access', true)
ON CONFLICT (slug) DO NOTHING;

-- Grant all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
ON CONFLICT DO NOTHING;

-- Grant admin users full permissions JSONB (app also resolves via role)
UPDATE users
SET permissions = (
  SELECT COALESCE(jsonb_agg(key ORDER BY key), '[]'::jsonb)
  FROM permissions
)
WHERE role = 'admin'
  AND (permissions IS NULL OR permissions = '[]'::jsonb OR jsonb_array_length(permissions) = 0);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_public_roles" ON roles;
CREATE POLICY "deny_public_roles" ON roles FOR SELECT USING (false);

DROP POLICY IF EXISTS "deny_public_permissions" ON permissions;
CREATE POLICY "deny_public_permissions" ON permissions FOR SELECT USING (false);

DROP POLICY IF EXISTS "deny_public_role_permissions" ON role_permissions;
CREATE POLICY "deny_public_role_permissions" ON role_permissions FOR SELECT USING (false);

NOTIFY pgrst, 'reload schema';

-- Seed or reset platform administrator
-- Uses bcryptjs-compatible hash (NOT pgcrypto crypt — that breaks app login)
--
-- Login at /auth/login:
--   Email: admin@energyandlogics.com
--   Password: password
--   Role: Administrator (admin)
--
-- Change this password immediately after first login.

INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'admin@energyandlogics.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Platform',
  'Admin',
  'admin',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = 'admin',
  status = 'active';

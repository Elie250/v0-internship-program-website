-- Seed platform administrator (run AFTER 00-create-users-table.sql)
-- bcryptjs-compatible hash for password: password
--
-- Login at /auth/login:
--   Email:    admin@energyandlogics.com
--   Password: password
--   Role:     Administrator (admin)

-- Remove any broken rows from earlier pgcrypto attempts
DELETE FROM users WHERE lower(email) = lower('admin@energyandlogics.com');

INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'admin@energyandlogics.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Platform',
  'Admin',
  'admin',
  'active'
);

-- Verify (should return 1 row, role admin, status active)
SELECT email, role, status, left(password_hash, 7) AS hash_type
FROM users
WHERE lower(email) = lower('admin@energyandlogics.com');

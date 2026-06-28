-- Seed administrator matching the ORIGINAL working site credentials
-- Run AFTER scripts/00-create-users-table.sql
--
-- Login at /auth/login:
--   Email:    eliebisamaza@gmail.com
--   Password: admin123
--   Role:     Administrator (admin)
--
-- Uses plain password in password_hash for compatibility (app accepts bcrypt OR plain legacy values)

DELETE FROM users WHERE lower(email) = lower('eliebisamaza@gmail.com');

INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'eliebisamaza@gmail.com',
  'admin123',
  'Elie',
  'Admin',
  'admin',
  'active'
);

SELECT email, role, status FROM users
WHERE lower(email) = lower('eliebisamaza@gmail.com');

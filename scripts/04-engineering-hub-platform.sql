-- Engineering Hub Platform Schema
-- Run in Supabase SQL Editor after existing scripts

-- Extend users role constraint (if users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('student', 'registered', 'mentor', 'lecturer', 'instructor', 'engineer', 'support_staff', 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('learning', 'shop', 'support', 'career')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  background_image TEXT,
  cta_primary_label TEXT,
  cta_primary_url TEXT,
  cta_secondary_label TEXT,
  cta_secondary_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'premium')),
  benefits JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  price NUMERIC(10,2),
  billing_period TEXT,
  cta_label TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'event',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  image_url TEXT,
  is_past BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  thumbnail TEXT,
  instructor_id UUID,
  difficulty TEXT,
  duration TEXT,
  pricing NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'document', 'link', 'download')),
  content_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  stock INT DEFAULT 0,
  images JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES support_categories(id) ON DELETE SET NULL,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES internships(id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cv_url TEXT,
  documents JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'interview_scheduled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  meeting_link TEXT,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentorship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  mentor_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Align announcements table if it exists with different columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message TEXT;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'news';
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
  END IF;
END $$;

-- Align services table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    ALTER TABLE services ADD COLUMN IF NOT EXISTS portal TEXT;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =============================================================================
-- Align LEGACY tables (created before this script) with new column names
-- =============================================================================

DO $$
BEGIN
  -- courses: legacy uses is_published; new schema uses status
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id UUID;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty TEXT;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS pricing NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'is_published'
    ) THEN
      UPDATE courses SET status = 'published' WHERE is_published = true;
      UPDATE courses SET status = 'draft' WHERE is_published = false AND status IS NULL;
    END IF;

    UPDATE courses SET status = 'draft' WHERE status IS NULL;
  END IF;

  -- products: legacy from 02-create-academy-tables.sql uses category, image_url, in_stock
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'in_stock'
    ) THEN
      UPDATE products SET status = 'published' WHERE in_stock = true AND status IS NULL;
      UPDATE products SET status = 'draft' WHERE in_stock = false;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
    ) THEN
      UPDATE products
      SET images = jsonb_build_array(image_url)
      WHERE image_url IS NOT NULL
        AND (images IS NULL OR images = '[]'::jsonb);
    END IF;

    UPDATE products SET status = 'published' WHERE status IS NULL;
    UPDATE products SET stock = 0 WHERE stock IS NULL;
  END IF;

  -- announcements: ensure status exists for RLS policy
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'is_published'
    ) THEN
      UPDATE announcements SET status = 'published' WHERE is_published = true;
      UPDATE announcements SET status = 'draft' WHERE is_published = false AND status IS NULL;
    END IF;

    UPDATE announcements SET status = 'published' WHERE status IS NULL;
  END IF;
END $$;

-- =============================================================================
-- ROW LEVEL SECURITY (enable on ALL platform tables)
-- In Supabase SQL Editor: choose "Enable RLS" when prompted, then run this script.
-- Service-role server routes bypass RLS; anon/authenticated clients use policies below.
-- =============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent policy helper: drop then create
DO $$ BEGIN
  DROP POLICY IF EXISTS "public_read_published_categories" ON categories;
  CREATE POLICY "public_read_published_categories" ON categories FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_active_hero" ON site_hero;
  CREATE POLICY "public_read_active_hero" ON site_hero FOR SELECT USING (is_active = true);

  DROP POLICY IF EXISTS "public_read_published_plans" ON membership_plans;
  CREATE POLICY "public_read_published_plans" ON membership_plans FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_events" ON events;
  CREATE POLICY "public_read_published_events" ON events FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_courses" ON courses;
  CREATE POLICY "public_read_published_courses" ON courses FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_course_content" ON course_content;
  CREATE POLICY "public_read_published_course_content" ON course_content FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses c WHERE c.id = course_content.course_id AND c.status = 'published')
  );

  DROP POLICY IF EXISTS "public_read_published_products" ON products;
  CREATE POLICY "public_read_published_products" ON products FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_support_categories" ON support_categories;
  CREATE POLICY "public_read_published_support_categories" ON support_categories FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_internships" ON internships;
  CREATE POLICY "public_read_published_internships" ON internships FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_webinars" ON webinars;
  CREATE POLICY "public_read_published_webinars" ON webinars FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_workshops" ON workshops;
  CREATE POLICY "public_read_published_workshops" ON workshops FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_published_mentorship" ON mentorship_programs;
  CREATE POLICY "public_read_published_mentorship" ON mentorship_programs FOR SELECT USING (status = 'published');

  DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
  CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT USING (true);

  -- Tickets/applications: no public SELECT; inserts handled by service-role API routes
  DROP POLICY IF EXISTS "deny_anon_select_support_tickets" ON support_tickets;
  CREATE POLICY "deny_anon_select_support_tickets" ON support_tickets FOR SELECT USING (false);

  DROP POLICY IF EXISTS "deny_anon_select_internship_applications" ON internship_applications;
  CREATE POLICY "deny_anon_select_internship_applications" ON internship_applications FOR SELECT USING (false);
END $$;

-- Ensure services/announcements have RLS if they pre-exist without it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "public_read_published_services" ON services;
    CREATE POLICY "public_read_published_services" ON services FOR SELECT USING (is_published = true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
    ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "public_read_published_announcements" ON announcements;
    CREATE POLICY "public_read_published_announcements" ON announcements FOR SELECT USING (
      status = 'published' OR is_featured = true
    );
  END IF;
END $$;

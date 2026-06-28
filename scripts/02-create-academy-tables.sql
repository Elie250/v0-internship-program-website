-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  max_students INTEGER,
  duration_options VARCHAR(255), -- Store as JSON or comma-separated: "Weekend,Evening,Customized,Online"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE, -- Links to Supabase Auth
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  gender VARCHAR(50),
  date_of_birth DATE,
  national_id_passport VARCHAR(100),
  location_province VARCHAR(100),
  location_district VARCHAR(100),
  location_sector VARCHAR(100),
  address TEXT,
  school_university VARCHAR(255),
  field_of_study VARCHAR(255),
  current_level VARCHAR(50), -- L3, L4, L5, Graduate
  year_of_study VARCHAR(50),
  enrollment_date DATE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive, Graduated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Align legacy students table (older schema used username/password only)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'students'
  ) THEN
    ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS national_id_passport VARCHAR(100);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS location_province VARCHAR(100);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS location_district VARCHAR(100);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS location_sector VARCHAR(100);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS school_university VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(255);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS current_level VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50);
    ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
    ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'username'
    ) THEN
      UPDATE students
      SET full_name = COALESCE(full_name, username)
      WHERE full_name IS NULL AND username IS NOT NULL;
    END IF;

    UPDATE students SET status = 'Active' WHERE status IS NULL;
  END IF;
END $$;

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
  preferred_duration VARCHAR(100),
  sponsorship_type VARCHAR(50), -- 'Self-Sponsored' or 'Sponsored'
  sponsor_name VARCHAR(255),
  sponsor_phone VARCHAR(20),
  sponsor_email VARCHAR(255),
  sponsor_relationship VARCHAR(100),
  parent_guardian_name VARCHAR(255),
  parent_guardian_phone VARCHAR(20),
  parent_guardian_email VARCHAR(255),
  motivation TEXT,
  agreement_confirmed BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Declined, Enrolled, Completed
  application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  decision_date TIMESTAMP WITH TIME ZONE,
  decision_made_by UUID, -- Admin user_id who made the decision
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Paid, Refunded
  payment_method VARCHAR(100), -- Mobile Money, Bank Transfer, Cash, etc.
  payment_date TIMESTAMP WITH TIME ZONE,
  receipt_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID, -- Admin user_id
  published_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT TRUE,
  target_audience VARCHAR(100) DEFAULT 'All', -- 'All', 'Students', 'Specific Program'
  target_program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE RESTRICT,
  certificate_number VARCHAR(100) UNIQUE,
  issue_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table (for engineering store)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100), -- Arduino, Sensors, Motors, PLC, Kits
  image_url VARCHAR(500),
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table (for engineering store)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Shipped, Completed, Cancelled
  delivery_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table (items in an order)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Align legacy child tables (may exist with flat internship/application schema)
DO $$
BEGIN
  -- applications: legacy uses full_name/email/program text fields (see app/apply/actions.ts)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'applications'
  ) THEN
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS student_id UUID;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS program_id UUID;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS preferred_duration VARCHAR(100);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS sponsorship_type VARCHAR(50);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(255);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS sponsor_phone VARCHAR(20);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS sponsor_email VARCHAR(255);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS sponsor_relationship VARCHAR(100);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS parent_guardian_name VARCHAR(255);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS parent_guardian_phone VARCHAR(20);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS parent_guardian_email VARCHAR(255);
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS motivation TEXT;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS agreement_confirmed BOOLEAN DEFAULT FALSE;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS decision_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS decision_made_by UUID;
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'duration'
    ) THEN
      UPDATE applications
      SET preferred_duration = COALESCE(preferred_duration, duration)
      WHERE preferred_duration IS NULL AND duration IS NOT NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'agreed_to_terms'
    ) THEN
      -- Legacy agreed_to_terms may be TEXT; agreement_confirmed is BOOLEAN
      UPDATE applications
      SET agreement_confirmed = CASE
        WHEN pg_typeof(agreed_to_terms)::text = 'boolean' THEN agreed_to_terms::boolean
        WHEN lower(trim(agreed_to_terms::text)) IN ('true', 't', '1', 'yes') THEN true
        ELSE false
      END
      WHERE agreement_confirmed IS NULL AND agreed_to_terms IS NOT NULL;
    END IF;

    UPDATE applications SET status = COALESCE(status, 'Pending') WHERE status IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_id UUID;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS application_id UUID;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    UPDATE payments SET status = 'Pending' WHERE status IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'certificates'
  ) THEN
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_id UUID;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_id UUID;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_number VARCHAR(100);
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issue_date DATE;
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_id UUID;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    UPDATE orders SET status = 'Pending' WHERE status IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'announcements'
  ) THEN
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience VARCHAR(100) DEFAULT 'All';
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_program_id UUID;
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    UPDATE announcements SET is_published = TRUE WHERE is_published IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create website_content table (for CMS)
CREATE TABLE IF NOT EXISTS website_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50), -- 'text', 'html', 'json'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS students_email_idx ON students(email);
CREATE INDEX IF NOT EXISTS students_user_id_idx ON students(user_id);
CREATE INDEX IF NOT EXISTS applications_student_id_idx ON applications(student_id);
CREATE INDEX IF NOT EXISTS applications_program_id_idx ON applications(program_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);
CREATE INDEX IF NOT EXISTS payments_student_id_idx ON payments(student_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS announcements_published_idx ON announcements(is_published);
CREATE INDEX IF NOT EXISTS certificates_student_id_idx ON certificates(student_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS orders_student_id_idx ON orders(student_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- Enable RLS on new tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (can be refined later)
DROP POLICY IF EXISTS "public_select_programs" ON programs;
CREATE POLICY "public_select_programs" ON programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_select_announcements" ON announcements;
CREATE POLICY "public_select_announcements" ON announcements FOR SELECT USING (is_published = true);

-- Note: More restrictive policies will be added for students, applications, payments, etc.
-- Admin policies will need to be implemented with proper auth checks

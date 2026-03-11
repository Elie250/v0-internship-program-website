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
CREATE POLICY "public_select_programs" ON programs FOR SELECT USING (true);
CREATE POLICY "public_select_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_select_announcements" ON announcements FOR SELECT USING (is_published = true);

-- Note: More restrictive policies will be added for students, applications, payments, etc.
-- Admin policies will need to be implemented with proper auth checks

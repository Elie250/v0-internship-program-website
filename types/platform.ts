export type UserRole =
  | 'guest'
  | 'registered'
  | 'mentor'
  | 'instructor'
  | 'support_staff'
  | 'admin'

/** Legacy roles still stored in DB */
export type LegacyRole = 'student' | 'lecturer' | 'engineer' | 'admin'

export const ROLE_LABELS: Record<string, string> = {
  registered: 'Registered User',
  student: 'Registered User',
  mentor: 'Mentor',
  instructor: 'Instructor',
  lecturer: 'Instructor',
  support_staff: 'Engineering Support',
  engineer: 'Engineering Support',
  admin: 'Administrator',
}

export type ContentStatus = 'draft' | 'published' | 'archived'

export type TicketStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed'

export type CategoryType = 'learning' | 'shop' | 'support' | 'career'

export interface Category {
  id: string
  name: string
  slug: string
  type: CategoryType
  description?: string | null
  status: ContentStatus
}

export interface HeroContent {
  id: string
  title: string
  subtitle: string | null
  background_image: string | null
  cta_primary_label: string | null
  cta_primary_url: string | null
  cta_secondary_label: string | null
  cta_secondary_url: string | null
  is_active: boolean
}

export interface MembershipPlan {
  id: string
  name: string
  plan_type: 'free' | 'premium'
  benefits: string[]
  features: string[]
  price: number | null
  billing_period: string | null
  cta_label: string | null
  cta_url: string | null
  status: ContentStatus
  sort_order: number
}

export interface Service {
  id: string
  title: string
  description: string
  category: string
  image_url: string | null
  portal: string | null
  is_published: boolean
}

export interface Announcement {
  id: string
  title: string
  message: string
  type: string
  image_url: string | null
  is_featured: boolean
  status: ContentStatus
  created_at: string
}

export interface EventItem {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string | null
  end_date: string | null
  location: string | null
  image_url: string | null
  is_past: boolean
  status: ContentStatus
}

export interface Course {
  id: string
  title: string
  description: string | null
  category_id: string | null
  thumbnail: string | null
  instructor_id: string | null
  difficulty: string | null
  duration: string | null
  pricing: number | null
  status: ContentStatus
  program_start_date?: string | null
  program_end_date?: string | null
  default_access_days?: number | null
  max_seats?: number | null
  category?: Category | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string | null
  sku: string | null
  price: number
  discount: number | null
  stock: number
  low_stock_threshold?: number | null
  images: string[]
  specifications: Record<string, string>
  status: ContentStatus
  category?: Category | null
}

export interface SupportTicket {
  id: string
  user_id: string | null
  title: string
  description: string
  category_id: string | null
  assigned_to: string | null
  status: TicketStatus
  attachments: string[]
  created_at: string
}

export interface Internship {
  id: string
  title: string
  description: string | null
  requirements: string | null
  deadline: string | null
  status: ContentStatus
}

export interface SiteSetting {
  key: string
  value: string
}

export interface ShopOrderItem {
  id: string
  product_id: string
  product_name?: string | null
  quantity: number
  unit_price: number
  line_total?: number | null
}

export interface ShopOrder {
  id: string
  order_number?: string | null
  customer_name?: string | null
  customer_email?: string | null
  customer_phone?: string | null
  fulfillment_type?: 'pickup' | 'delivery' | string | null
  delivery_address?: string | null
  notes?: string | null
  total_amount: number
  status: string
  created_at: string
  items?: ShopOrderItem[]
}

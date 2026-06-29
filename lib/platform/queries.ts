import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type {
  Announcement,
  Category,
  Course,
  EventItem,
  HeroContent,
  Internship,
  MembershipPlan,
  Product,
  Service,
} from '@/types/platform'
import {
  attachCourseCategories,
  isCoursePublished,
  normalizeCourseRow,
} from '@/lib/platform/courses'
import type { ProgramType } from '@/lib/enrollment/program-types'

function db() {
  if (!supabaseAdmin) return null
  return supabaseAdmin
}

export async function getActiveHero(): Promise<HeroContent | null> {
  const client = db()
  if (!client) return null
  const { data } = await client
    .from('site_hero')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('membership_plans')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  return (data ?? []).map((plan) => ({
    ...plan,
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    features: Array.isArray(plan.features) ? plan.features : [],
  }))
}

export async function getPublishedServices(): Promise<Service[]> {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('services')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getPublishedAnnouncements(limit = 6): Promise<Announcement[]> {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('announcements')
    .select('*')
    .or('status.eq.published,is_featured.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((item) => ({
    ...item,
    message: item.message ?? item.content ?? '',
  }))
}

export async function getPublishedEvents(past?: boolean): Promise<EventItem[]> {
  const client = db()
  if (!client) return []
  let query = client.from('events').select('*').eq('status', 'published')
  if (past !== undefined) query = query.eq('is_past', past)
  const { data } = await query.order('start_date', { ascending: false })
  return data ?? []
}

export async function getCategories(type: Category['type']): Promise<Category[]> {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('categories')
    .select('*')
    .eq('type', type)
    .eq('status', 'published')
    .order('name')
  return data ?? []
}

export async function getPublishedCourses(
  categorySlug?: string,
  options?: { programType?: ProgramType; programTypes?: ProgramType[] }
): Promise<Course[]> {
  const client = db()
  if (!client) return []

  let query = client.from('courses').select('*')
  if (categorySlug) {
    const { data: cat } = await client
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (options?.programType) {
    query = query.eq('program_type', options.programType)
  } else if (options?.programTypes?.length) {
    query = query.in('program_type', options.programTypes)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) {
    console.error('getPublishedCourses:', error.message)
    return []
  }

  const published = (data ?? [])
    .map((row) => normalizeCourseRow(row as Record<string, unknown> & { id: string; title: string }))
    .filter(isCoursePublished)

  return attachCourseCategories(client, published)
}

export async function getCourseById(id: string): Promise<Course | null> {
  const client = db()
  if (!client) return null
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const course = normalizeCourseRow(data as Record<string, unknown> & { id: string; title: string })
  if (!isCoursePublished(course)) return null

  const [withCategory] = await attachCourseCategories(client, [course])
  return withCategory ?? null
}

export async function getPublishedProducts(categorySlug?: string, search?: string): Promise<Product[]> {
  const client = db()
  if (!client) return []
  let query = client
    .from('products')
    .select('*, category:categories(*)')
    .eq('status', 'published')
  if (categorySlug) {
    const { data: cat } = await client
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
  }
  const { data } = await query.order('created_at', { ascending: false })
  let products = (data ?? []).map((p) => {
    const images = Array.isArray(p.images)
      ? p.images
      : p.image_url
        ? [p.image_url]
        : []
    return {
      ...p,
      images,
      specifications: p.specifications ?? {},
    }
  })
  if (search) {
    const q = search.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    )
  }
  return products
}

export async function getProductById(id: string): Promise<Product | null> {
  const client = db()
  if (!client) return null
  const { data } = await client
    .from('products')
    .select('*, category:categories(*)')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (!data) return null
  const images = Array.isArray(data.images)
    ? data.images
    : data.image_url
      ? [data.image_url]
      : []
  return {
    ...data,
    images,
    specifications: data.specifications ?? {},
  }
}

export async function getPublishedInternships(): Promise<Internship[]> {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('internships')
    .select('*')
    .eq('status', 'published')
    .order('deadline', { ascending: true })
  return data ?? []
}

export async function getCareerItems() {
  const client = db()
  if (!client) return { webinars: [], workshops: [], mentorship: [] }
  const [webinars, workshops, mentorship] = await Promise.all([
    client.from('webinars').select('*').eq('status', 'published').order('scheduled_at'),
    client.from('workshops').select('*').eq('status', 'published').order('scheduled_at'),
    client.from('mentorship_programs').select('*').eq('status', 'published').order('created_at'),
  ])
  return {
    webinars: webinars.data ?? [],
    workshops: workshops.data ?? [],
    mentorship: mentorship.data ?? [],
  }
}

export async function getSupportCategories() {
  const client = db()
  if (!client) return []
  const { data } = await client
    .from('support_categories')
    .select('*')
    .eq('status', 'published')
    .order('name')
  return data ?? []
}

export async function getSiteSetting(key: string, fallback = '') {
  const client = db()
  if (!client) return fallback
  const { data } = await client.from('site_settings').select('value').eq('key', key).maybeSingle()
  return data?.value ?? fallback
}

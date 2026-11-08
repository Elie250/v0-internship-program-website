import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import {
  listActivePackages,
  normalizePackageMoneyFields,
  PACKAGE_CURRENCY,
  serializeStudentPackageOption,
  type CoursePricingPackageRow,
  type StudentPackageOption,
} from '@/lib/enrollment/packages'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const PACKAGE_COLUMNS =
  'id, course_id, name, description, benefits, currency, list_price, discount_amount, final_price, is_active, sort_order, created_at, updated_at, updated_by'

const MIGRATION_MESSAGE =
  'Course pricing packages are not ready. Run scripts/99-course-pricing-packages.sql then scripts/100-enrollment-package-snapshot.sql.'

export type AdminCoursePackage = {
  id: string
  courseId: string
  name: string
  description: string | null
  benefits: string | null
  currency: typeof PACKAGE_CURRENCY
  listPrice: number
  discountAmount: number
  finalPrice: number
  isActive: boolean
  sortOrder: number
  updatedAt: string | null
}

function storageMessage(message: string): string | null {
  if (/relation .* does not exist|could not find the table|could not find the .* column|column .* does not exist|schema cache/i.test(message)) {
    return MIGRATION_MESSAGE
  }
  return null
}

function denied(error: unknown): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : 'Forbidden'
  if (message === 'Unauthorized' || message === 'Forbidden') return { ok: false, error: message }
  return { ok: false, error: message || 'Pricing packages are temporarily unavailable.' }
}

async function authorize() {
  const session = await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
  if (!supabaseAdmin) throw new Error('Pricing packages are temporarily unavailable.')
  return { session, db: supabaseAdmin }
}

function mapAdminPackage(row: Record<string, unknown>): AdminCoursePackage {
  const option = serializeStudentPackageOption(row as unknown as CoursePricingPackageRow)
  return {
    id: option.id,
    courseId: String(row.course_id),
    name: option.name,
    description: option.description,
    benefits: option.benefits,
    currency: PACKAGE_CURRENCY,
    listPrice: option.listPrice,
    discountAmount: option.discountAmount,
    finalPrice: option.finalPrice,
    isActive: row.is_active === true,
    sortOrder: option.sortOrder,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }
}

async function ensureCourse(courseId: string) {
  const { db } = await authorize()
  const { data, error } = await db.from('courses').select('id, title, pricing, status').eq('id', courseId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Course not found.')
  return data
}

export async function listAdminCoursePackages(courseId: string): Promise<
  { ok: true; packages: AdminCoursePackage[]; warning: string | null } | { ok: false; error: string }
> {
  try {
    const { db } = await authorize()
    await ensureCourse(courseId)
    const { data, error } = await db
      .from('course_pricing_packages')
      .select(PACKAGE_COLUMNS)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) {
      const warning = storageMessage(error.message)
      if (warning) return { ok: true, packages: [], warning }
      return { ok: false, error: error.message }
    }
    return {
      ok: true,
      warning: null,
      packages: (data ?? []).map((row) => mapAdminPackage(row as Record<string, unknown>)),
    }
  } catch (error) {
    return denied(error)
  }
}

export async function previewStudentCoursePackages(courseId: string): Promise<
  | { ok: true; packages: StudentPackageOption[]; legacyPricing: number; warning: string | null }
  | { ok: false; error: string }
> {
  try {
    const { db } = await authorize()
    const course = await ensureCourse(courseId)
    const { data, error } = await db
      .from('course_pricing_packages')
      .select(PACKAGE_COLUMNS)
      .eq('course_id', courseId)
    if (error) {
      const warning = storageMessage(error.message)
      if (warning) {
        return {
          ok: true,
          packages: [],
          legacyPricing: Number(course.pricing ?? 0),
          warning,
        }
      }
      return { ok: false, error: error.message }
    }
    return {
      ok: true,
      warning: null,
      legacyPricing: Number(course.pricing ?? 0),
      packages: listActivePackages((data ?? []) as unknown as CoursePricingPackageRow[]),
    }
  } catch (error) {
    return denied(error)
  }
}

type PackageInput = {
  name?: unknown
  description?: unknown
  benefits?: unknown
  listPrice?: unknown
  discountAmount?: unknown
  isActive?: unknown
  sortOrder?: unknown
}

function parsePackageInput(input: PackageInput) {
  const name = String(input.name ?? '').trim()
  if (!name) throw new Error('Package name is required.')
  const money = normalizePackageMoneyFields({
    listPrice: input.listPrice,
    discountAmount: input.discountAmount ?? 0,
    currency: PACKAGE_CURRENCY,
  })
  return {
    name,
    description: String(input.description ?? '').trim() || null,
    benefits: String(input.benefits ?? '').trim() || null,
    currency: money.currency,
    list_price: money.listPrice,
    discount_amount: money.discountAmount,
    final_price: money.finalPrice,
    is_active: input.isActive === false ? false : true,
    sort_order: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
  }
}

export async function createCoursePackage(
  courseId: string,
  input: PackageInput
): Promise<{ ok: true; package: AdminCoursePackage } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    await ensureCourse(courseId)
    const parsed = parsePackageInput(input)
    const now = new Date().toISOString()
    const { data, error } = await db
      .from('course_pricing_packages')
      .insert({
        course_id: courseId,
        ...parsed,
        updated_at: now,
        updated_by: session.user.id,
      })
      .select(PACKAGE_COLUMNS)
      .single()
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    return { ok: true, package: mapAdminPackage(data as Record<string, unknown>) }
  } catch (error) {
    return denied(error)
  }
}

export async function updateCoursePackage(
  courseId: string,
  packageId: string,
  input: PackageInput
): Promise<{ ok: true; package: AdminCoursePackage } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    await ensureCourse(courseId)
    const parsed = parsePackageInput(input)
    const now = new Date().toISOString()
    const { data, error } = await db
      .from('course_pricing_packages')
      .update({
        ...parsed,
        updated_at: now,
        updated_by: session.user.id,
      })
      .eq('id', packageId)
      .eq('course_id', courseId)
      .select(PACKAGE_COLUMNS)
      .maybeSingle()
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Package not found for this course.' }
    return { ok: true, package: mapAdminPackage(data as Record<string, unknown>) }
  } catch (error) {
    return denied(error)
  }
}

export async function setCoursePackageActive(
  courseId: string,
  packageId: string,
  isActive: boolean
): Promise<{ ok: true; package: AdminCoursePackage } | { ok: false; error: string }> {
  try {
    const { session, db } = await authorize()
    await ensureCourse(courseId)
    const now = new Date().toISOString()
    const { data, error } = await db
      .from('course_pricing_packages')
      .update({
        is_active: isActive,
        updated_at: now,
        updated_by: session.user.id,
      })
      .eq('id', packageId)
      .eq('course_id', courseId)
      .select(PACKAGE_COLUMNS)
      .maybeSingle()
    if (error) return { ok: false, error: storageMessage(error.message) ?? error.message }
    if (!data) return { ok: false, error: 'Package not found for this course.' }
    return { ok: true, package: mapAdminPackage(data as Record<string, unknown>) }
  } catch (error) {
    return denied(error)
  }
}

/** Student/public enroll helper — active packages for a published course. */
export async function loadActivePackagesForPublishedCourse(courseId: string): Promise<{
  packages: StudentPackageOption[]
  rows: CoursePricingPackageRow[]
  missingTable: boolean
}> {
  if (!supabaseAdmin) return { packages: [], rows: [], missingTable: false }
  const { data: course } = await supabaseAdmin
    .from('courses')
    .select('id, status')
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle()
  if (!course) return { packages: [], rows: [], missingTable: false }

  const { data, error } = await supabaseAdmin
    .from('course_pricing_packages')
    .select(PACKAGE_COLUMNS)
    .eq('course_id', courseId)
  if (error) {
    if (storageMessage(error.message)) return { packages: [], rows: [], missingTable: true }
    throw new Error(error.message)
  }
  const rows = (data ?? []) as unknown as CoursePricingPackageRow[]
  return { packages: listActivePackages(rows), rows, missingTable: false }
}

export async function loadCoursePackageRows(courseId: string): Promise<{
  rows: CoursePricingPackageRow[]
  missingTable: boolean
}> {
  if (!supabaseAdmin) return { rows: [], missingTable: false }
  const { data, error } = await supabaseAdmin
    .from('course_pricing_packages')
    .select(PACKAGE_COLUMNS)
    .eq('course_id', courseId)
  if (error) {
    if (storageMessage(error.message)) return { rows: [], missingTable: true }
    throw new Error(error.message)
  }
  return { rows: (data ?? []) as unknown as CoursePricingPackageRow[], missingTable: false }
}

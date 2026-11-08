import {
  cataloguePriceLabel,
  listActivePackages,
  type CoursePricingPackageRow,
  type StudentPackageOption,
} from '@/lib/enrollment/packages'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** Student-safe package columns only — no updated_by / admin metadata. */
const STUDENT_PACKAGE_COLUMNS =
  'id, course_id, name, description, benefits, currency, list_price, discount_amount, final_price, is_active, sort_order'

function isMissingPackagesTable(message: string): boolean {
  return /relation .* does not exist|could not find the table|could not find the .* column|column .* does not exist|schema cache/i.test(
    message
  )
}

export type PublicCatalogueCoursePricing = {
  courseId: string
  packages: StudentPackageOption[]
  catalogue: ReturnType<typeof cataloguePriceLabel>
  packagesUnavailable: boolean
}

export type PublicCataloguePricingInput = {
  id: string
  pricing: number | null | undefined
}

/**
 * Batch-load active pricing packages for published catalogue courses.
 * Falls back to legacy catalogue labels when the packages table is missing.
 * Other database errors and programming errors are not swallowed.
 */
export async function loadPublicCataloguePricing(
  courses: PublicCataloguePricingInput[]
): Promise<Map<string, PublicCatalogueCoursePricing>> {
  const result = new Map<string, PublicCatalogueCoursePricing>()

  const buildEntry = (
    course: PublicCataloguePricingInput,
    packages: StudentPackageOption[],
    packagesUnavailable: boolean
  ): PublicCatalogueCoursePricing => ({
    courseId: course.id,
    packages,
    packagesUnavailable,
    catalogue: cataloguePriceLabel({
      legacyPricing: course.pricing,
      activePackages: packages,
    }),
  })

  for (const course of courses) {
    result.set(course.id, buildEntry(course, [], false))
  }

  if (courses.length === 0) return result
  if (!supabaseAdmin) return result

  const { data, error } = await supabaseAdmin
    .from('course_pricing_packages')
    .select(STUDENT_PACKAGE_COLUMNS)
    .in(
      'course_id',
      courses.map((course) => course.id)
    )
    .eq('is_active', true)

  if (error) {
    if (isMissingPackagesTable(error.message)) {
      for (const course of courses) {
        result.set(course.id, buildEntry(course, [], true))
      }
      return result
    }
    throw new Error(error.message)
  }

  const rowsByCourse = new Map<string, CoursePricingPackageRow[]>()
  for (const row of (data ?? []) as unknown as CoursePricingPackageRow[]) {
    const key = String(row.course_id)
    rowsByCourse.set(key, [...(rowsByCourse.get(key) ?? []), row])
  }

  for (const course of courses) {
    const packages = listActivePackages(rowsByCourse.get(course.id) ?? [])
    result.set(course.id, buildEntry(course, packages, false))
  }

  return result
}

/** Active packages + catalogue label for a single published course detail page. */
export async function loadPublicCourseCataloguePricing(course: PublicCataloguePricingInput): Promise<{
  packages: StudentPackageOption[]
  catalogue: ReturnType<typeof cataloguePriceLabel>
  packagesUnavailable: boolean
}> {
  const map = await loadPublicCataloguePricing([course])
  const entry = map.get(course.id)
  return {
    packages: entry?.packages ?? [],
    catalogue: entry?.catalogue ?? cataloguePriceLabel({ legacyPricing: course.pricing, activePackages: [] }),
    packagesUnavailable: entry?.packagesUnavailable ?? false,
  }
}

import { NextResponse } from 'next/server'
import { loadActivePackagesForPublishedCourse } from '@/lib/admin/course-packages'
import { cataloguePriceLabel } from '@/lib/enrollment/packages'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, pricing, status')
      .eq('id', courseId)
      .eq('status', 'published')
      .maybeSingle()

    if (error || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { packages } = await loadActivePackagesForPublishedCourse(courseId)
    const catalogue = cataloguePriceLabel({
      legacyPricing: course.pricing,
      activePackages: packages,
    })

    return NextResponse.json({
      ok: true,
      packages,
      catalogue,
      legacyPricing: Number(course.pricing ?? 0),
      requiresPackageSelection: packages.length > 0,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load packages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Nav badge counts for the student portal.
 * Keys match student sidebar nav ids.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.id || (user.role !== 'student' && user.role !== 'registered')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const [enrollmentsResult, certificatesResult, announcementsResult] = await Promise.all([
      supabaseAdmin
        .from('course_enrollments')
        .select('id, status')
        .eq('user_id', user.id)
        .in('status', ['payment_pending_review', 'rejected', 'waitlisted']),
      supabaseAdmin
        .from('student_certificates')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending_admin'),
      supabaseAdmin
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .limit(1),
    ])

    const enrollments = enrollmentsResult.data ?? []
    const pendingPayments = enrollments.filter((e) =>
      ['payment_pending_review', 'waitlisted'].includes(String(e.status))
    ).length
    const rejected = enrollments.filter((e) => e.status === 'rejected').length
    const actionItems = pendingPayments + rejected

    const certificatesPending = certificatesResult.error
      ? 0
      : (certificatesResult.data ?? []).length

    // Soft signal: show announcements badge only when there are published items
    // (no per-user read state yet) — keep at 0 to avoid noise; wire later if needed.
    void announcementsResult

    const badges: Record<string, number> = {}
    if (actionItems > 0) {
      badges.courses = actionItems
      badges.programs = actionItems
    }
    if (certificatesPending > 0) {
      badges.certificates = certificatesPending
    }

    return NextResponse.json({
      badges,
      details: {
        pendingPayments,
        rejected,
        certificatesPending,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load badges'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

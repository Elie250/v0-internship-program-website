import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requirePlatformAdmin } from '@/lib/admin/access-control'
import { approveCertificate } from '@/lib/learning/quiz'

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    let query = supabaseAdmin
      .from('student_certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (courseId) query = query.eq('course_id', courseId)

    const { data, error } = await query
    if (error) {
      if (error.message.includes('student_certificates')) return NextResponse.json([])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      (data ?? []).map((row) => ({
        id: row.id,
        certificate_code: row.certificate_code,
        student_name: row.student_name,
        program_title: row.program_title,
        final_score: row.final_score ?? null,
        is_free: row.is_free ?? false,
        status: row.status ?? 'issued',
        issued_at: row.issued_at,
        approved_at: row.approved_at ?? null,
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePlatformAdmin()

    const body = await request.json()
    const certificateId = String(body.certificateId ?? '')
    if (!certificateId) {
      return NextResponse.json({ error: 'certificateId required' }, { status: 400 })
    }

    const result = await approveCertificate({
      certificateId,
      adminUserId: session.user.id,
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ certificateCode: result.certificateCode })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

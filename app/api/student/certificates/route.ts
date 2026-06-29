import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('user_session')?.value
  if (!raw) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let userId: string
  try {
    userId = JSON.parse(raw).id
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { data, error } = await supabaseAdmin
    .from('student_certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })

  if (error) {
    if (error.message.includes('student_certificates')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

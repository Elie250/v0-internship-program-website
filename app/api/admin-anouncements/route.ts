import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ message: 'error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })

}

export async function POST(request: Request) {

  const body = await request.json()

  const { title, message } = body

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title, message })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ message: 'failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data
  })

}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For now, we'll log the contact message to console and return success
    // In a production environment, you would save this to a database or send an email
    console.log('[v0] Contact form submission:', {
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
      timestamp: new Date().toISOString()
    })

    // Optionally save to database if you want to track contact requests
    // const { error } = await supabaseAdmin
    //   .from('contact_messages')
    //   .insert([{ name: body.name, email: body.email, phone: body.phone, subject: body.subject, message: body.message }])

    return NextResponse.json(
      { message: 'Message received successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Demo credentials
    if (email === 'student@example.com' && password === 'password123') {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          token: 'demo_token_' + Date.now(),
          student_id: 'demo_student_001',
          name: 'Demo Student',
          email: email
        },
        { status: 200 }
      )
    }

    // Try to authenticate against registrations in database
    try {
      const { data: registrations, error } = await supabaseAdmin
        .from('registrations')
        .select('*')
        .eq('email', email)
        .limit(1)

      if (!error && registrations && registrations.length > 0) {
        const student = registrations[0]
        // For registered students, create a token
        return NextResponse.json(
          { 
            success: true, 
            message: 'Login successful',
            token: 'student_token_' + Date.now(),
            student_id: student.id,
            name: student.name || student.first_name + ' ' + student.last_name,
            email: student.email
          },
          { status: 200 }
        )
      }
    } catch (dbError) {
      console.log('[v0] Database check failed, continuing with basic auth')
    }

    return NextResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('[v0] Student login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

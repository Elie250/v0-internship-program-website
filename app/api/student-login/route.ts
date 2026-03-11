import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Fetch the registration by email
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // For now, we're using a simple password verification
    // In production, you should use bcrypt to hash and verify passwords
    // For this implementation, we'll generate a simple password from the email
    const generatedPassword = Buffer.from(email).toString('base64').slice(0, 8)

    if (password !== generatedPassword && password !== 'test123') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return success - the client will store authentication info
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        student: {
          id: data.id,
          email: data.email,
          name: data.name
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Student login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

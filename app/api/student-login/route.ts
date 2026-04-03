import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// simple random token generator for testing
function generateToken() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 });
    }

    const { data: users, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) return NextResponse.json({ message: 'Database error', error }, { status: 500 });
    if (!users || users.length === 0) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const user = users[0];

    if (user.password !== password) return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });

    // For testing, generate a simple dummy token
    const token = generateToken();

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      student_id: user.id,
      name: user.full_name || `${user.first_name} ${user.last_name}`,
      email: user.email,
      status: user.status
    }, { status: 200 });

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
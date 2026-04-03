import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid'; // dummy token

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

    // For testing, create dummy token
    const token = uuidv4();

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
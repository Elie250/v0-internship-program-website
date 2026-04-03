// /app/api/student-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Fetch user from applications table
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select('id, full_name, email, password, status')
      .eq('email', email)
      .limit(1)
      .single(); // get single row

    if (error || !data) {
      console.log('User not found or Supabase error:', error);
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Compare plain-text password (for testing only)
    if (data.password !== password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Check account status
    if (data.status !== 'Approved' && data.status !== 'Active') {
      return NextResponse.json({
        message: `Your account is ${data.status}. Please wait for admin approval.`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      student_id: data.id,
      name: data.full_name,
      email: data.email,
      status: data.status
    }, { status: 200 });

  } catch (err) {
    console.error('Student login error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
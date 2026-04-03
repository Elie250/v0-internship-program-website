'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Fetch user from database
    const { data: users, error } = await supabaseAdmin
      .from('applications') // Your table name
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      return NextResponse.json({ message: 'Database error', error }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Compare plain-text password (testing only)
    if (user.password !== password) {
      return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
    }

    // Return success response
    const token = generateToken(); // can just return a dummy token for testing
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      student_id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      status: user.status,
    }, { status: 200 });

  } catch (err) {
    console.error('Login API error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
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

    // Demo credentials
    if (email === 'student@example.com' && password === 'password123') {
      const token = generateToken();
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token,
        student_id: 'demo_student_001',
        name: 'Demo Student',
        email: email,
        status: 'Approved'
      }, { status: 200 });
    }

    // Check database for plain-text password
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('id, full_name, email, password, status')
      .eq('email', email)
      .limit(1);

    if (error || !applications || applications.length === 0) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const student = applications[0];

    // Compare plain-text password
    if (student.password !== password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Check account status
    if (student.status !== 'Approved' && student.status !== 'Active') {
      return NextResponse.json({ message: `Your account is ${student.status}. Please wait for admin approval.` }, { status: 403 });
    }

    const token = generateToken();
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      student_id: student.id,
      name: student.full_name,
      email: student.email,
      status: student.status
    }, { status: 200 });

  } catch (error) {
    console.error('Student login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
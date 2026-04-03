import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      gender,
      city,
      province,
      country,
      school,
      program,
      duration
    } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert([
        {
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
          email,
          password, // stored as plain text
          phone,
          gender,
          city,
          province,
          country,
          school,
          program,
          duration,
          status: 'Approved', // allow login immediately
          created_at: new Date().toISOString()
        },
      ]);

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { message: 'Failed to save registration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Register API error:', error);

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
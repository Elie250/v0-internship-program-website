import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'gender', 'nationalId', 'address', 'city', 'province',
      'postalCode', 'school', 'fieldOfStudy', 'educationLevel',
      'program', 'duration', 'password'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    // Check if email already exists in applications table
    const { data: existingUsers } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('email', body.email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ message: 'Email already registered. Please login instead.' }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);
    const studentToken = generateToken();

    // Insert into applications table
    const { data: registration, error } = await supabaseAdmin
      .from('applications')
      .insert([
        {
          full_name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          phone: body.phone,
          date_of_birth: body.dateOfBirth,
          province: body.province,
          district: body.city,
          school: body.school,
          field_of_study: body.fieldOfStudy,
          current_level: body.educationLevel,
          program: body.program,
          duration: body.duration,
          status: 'Pending',
          agreed_to_terms: body.agreedToTerms || false,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[v0] Supabase insert error:', error);
      return NextResponse.json({ message: 'Failed to save registration' }, { status: 500 });
    }

    // Also save to individual_registrations table for redundancy
    await supabaseAdmin
      .from('individual_registrations')
      .insert([
        {
          full_name: `${body.firstName} ${body.lastName}`,
          email: body.email,
          phone: body.phone,
          program: body.program,
          duration: body.duration,
          created_at: new Date().toISOString(),
        }
      ]);

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully!',
      data: registration,
      student_id: registration?.id,
      token: studentToken,
    }, { status: 201 });

  } catch (err) {
    console.error('[v0] Registration API error:', err);
    return NextResponse.json(
      { message: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}

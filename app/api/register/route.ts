import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'nationalId', 'address', 'city', 'province', 'postalCode', 'school', 'fieldOfStudy', 'educationLevel', 'program', 'duration', 'password'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('registrations')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Prepare comprehensive registration data
    const registrationData = {
      first_name: body.firstName,
      last_name: body.lastName,
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      phone: body.phone,
      date_of_birth: body.dateOfBirth,
      gender: body.gender,
      national_id: body.nationalId,
      address: body.address,
      city: body.city,
      province: body.province,
      postal_code: body.postalCode,
      country: body.country || 'Rwanda',
      school: body.school,
      field_of_study: body.fieldOfStudy,
      education_level: body.educationLevel,
      program_name: body.program,
      program: body.program,
      duration: body.duration,
      password_hash: Buffer.from(body.password).toString('base64'),
      registration_status: 'Pending',
      status: 'Pending',
      agreement_confirmed: body.agreedToTerms || false,
      created_at: new Date().toISOString(),
    };

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert([registrationData])
      .select();

    if (error) {
      console.error('[v0] Database error:', error);
      return NextResponse.json(
        { message: 'Failed to save registration. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Registration submitted successfully! Please check your email for next steps.',
        data: data?.[0],
        student_id: data?.[0]?.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

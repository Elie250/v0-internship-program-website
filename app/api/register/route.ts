// /api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender',
      'nationalId', 'address', 'city', 'province', 'postalCode', 'school',
      'fieldOfStudy', 'educationLevel', 'program', 'duration', 'password'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ message: `${field} is required` }, { status: 400 });
      }
    }

    // 2. Check if email already exists in Auth
    const { data: existingUser, error: authCheckError } = await supabaseAdmin
      .from('registrations')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    // 3. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      },
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    // 4. Insert registration data in table (without password)
    const registrationData = {
      student_id: authUser.id, // link to auth user
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
      registration_status: 'Pending',
      status: 'Pending',
      agreement_confirmed: body.agreedToTerms || false,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert([registrationData])
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({ message: 'Failed to save registration.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully!',
      data: data?.[0],
      student_id: authUser.id
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ message: 'An error occurred during registration' }, { status: 500 });
  }
}
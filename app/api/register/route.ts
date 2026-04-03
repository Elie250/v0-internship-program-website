// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Server-side validation
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
      'gender',
      'nationalId',
      'address',
      'city',
      'province',
      'postalCode',
      'school',
      'fieldOfStudy',
      'educationLevel',
      'program',
      'duration',
      'password',
      'agreedToTerms',
    ];

    for (const field of requiredFields) {
      if (!body[field] || body[field].toString().trim() === '') {
        return NextResponse.json(
          { message: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('email', body.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // ignore "no rows found" error
      return NextResponse.json({ message: fetchError.message }, { status: 500 });
    }

    if (existingApplication) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      );
    }

    // Insert new application
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert([
        {
          first_name: body.firstName,
          last_name: body.lastName,
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
          program: body.program,
          duration: body.duration,
          password: body.password, // TODO: hash for production
          agreed_to_terms: body.agreedToTerms,
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Registration successful', application: data });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { message: 'An error occurred while registering' },
      { status: 500 }
    );
  }
}
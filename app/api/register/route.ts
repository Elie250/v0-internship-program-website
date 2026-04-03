// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationalId,
      address,
      city,
      province,
      postalCode,
      country,
      school,
      fieldOfStudy,
      educationLevel,
      password,
      agreedToTerms
    } = body;

    if (
      !firstName || !lastName || !email || !phone || !dateOfBirth || !gender ||
      !nationalId || !address || !city || !province || !postalCode ||
      !school || !fieldOfStudy || !educationLevel || !password || !agreedToTerms
    ) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existingError) throw existingError;
    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to applications table
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        national_id: nationalId,
        address,
        city,
        province,
        postal_code: postalCode,
        country,
        school,
        field_of_study: fieldOfStudy,
        education_level: educationLevel,
        password: hashedPassword,
        agreed_to_terms: agreedToTerms,
        status: 'Pending', // default status
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Registration error:', error);
      return NextResponse.json({ message: 'Failed to save registration' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Registration successful' }, { status: 200 });
  } catch (err) {
    console.error('API /register error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
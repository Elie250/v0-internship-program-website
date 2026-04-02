// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getAuthUser } from '../../lib/auth';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1️⃣ Validate required fields
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

    // 2️⃣ Check if email already exists
    const existingUser = await prisma.registration.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    // 3️⃣ Get auth user (optional, for linking if using JWT)
    const { user: authUser } = await getAuthUser(req);

    // 4️⃣ Hash password
    const passwordHash = await bcrypt.hash(body.password, 10);

    // 5️⃣ Insert registration
    const registration = await prisma.registration.create({
      data: {
        student_id: authUser?.id || '', // optional link to auth user
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
        password_hash: passwordHash,
        registration_status: 'Pending',
        status: 'Pending',
        agreement_confirmed: body.agreedToTerms || false,
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully!',
      data: registration,
      student_id: registration.id,
    }, { status: 201 });

  } catch (err) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
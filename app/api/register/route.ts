// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth'; // replace with your auth helper
import { prisma } from '@/lib/prisma';    // replace with your Prisma client import

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Get authenticated user
    const authResult = await getAuthUser(req);
    // authResult is { user } or { user: null }
    if (!authResult.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const user = authResult.user;

    // 2. Insert student record
    const student = await prisma.student.create({
      data: {
        student_id: user.id, // link to auth user
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
        country: body.country,
        school: body.school,
        field_of_study: body.fieldOfStudy,
        education_level: body.educationLevel,
        program: body.program,
        duration: body.duration,
        agreed_to_terms: body.agreedToTerms,
        password_hash: body.password, // hash it in real app!
      },
    });

    return NextResponse.json({ message: 'Student registered', student_id: student.student_id });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ message: 'Registration failed' }, { status: 500 });
  }
}
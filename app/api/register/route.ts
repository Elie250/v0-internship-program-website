import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare data for database
    const registrationData: any = {
      name: body.fullName,
      email: body.email,
      phone: body.phone,
      registration_status: 'Pending',
      created_at: new Date().toISOString(),
    };

    // Add program and duration if provided
    if (body.program) {
      registrationData.program = body.program;
    }
    if (body.duration) {
      registrationData.duration = body.duration;
    }

    // Add educational information
    if (body.currentLevel) {
      registrationData.level = body.currentLevel;
    }
    if (body.school) {
      registrationData.school = body.school;
    }
    if (body.fieldOfStudy) {
      registrationData.field_of_study = body.fieldOfStudy;
    }

    // Add location information
    if (body.province) {
      registrationData.location_province = body.province;
    }
    if (body.district) {
      registrationData.location_district = body.district;
    }

    // Add personal information
    if (body.dateOfBirth) {
      registrationData.date_of_birth = body.dateOfBirth;
    }

    // Add motivation and agreement
    if (body.motivation) {
      registrationData.motivation = body.motivation;
    }
    if (body.agreedToTerms !== undefined) {
      registrationData.agreement_confirmed = body.agreedToTerms;
    }

    // Add optional message (for backwards compatibility)
    if (body.message) {
      registrationData.message = body.message;
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .insert([registrationData])
      .select();

    if (error) {
      console.error('[v0] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Registration submitted successfully',
        data: data?.[0]
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

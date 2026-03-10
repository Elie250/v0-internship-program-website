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
    const registrationData = {
      registration_type: body.registrationType,
      full_name: body.fullName,
      email: body.email,
      phone: body.phone,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Add type-specific fields
    if (body.registrationType === 'Student') {
      Object.assign(registrationData, {
        school: body.school,
        program: body.program,
        level: body.level,
        duration: body.duration,
      });
    } else if (body.registrationType === 'Individual') {
      Object.assign(registrationData, {
        profession: body.profession,
        training_program: body.trainingProgram,
        schedule: body.schedule,
      });
    }

    // Add optional message
    if (body.message) {
      Object.assign(registrationData, { message: body.message });
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

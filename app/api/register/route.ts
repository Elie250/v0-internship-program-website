// /api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
      program,
      duration,
      password
    } = body;

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into applications table
    const { data, error } = await supabaseAdmin
      .from("applications")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          date_of_birth: dateOfBirth,
          gender: gender,
          national_id: nationalId,
          address: address,
          city: city,
          province: province,
          postal_code: postalCode,
          country: country,
          school: school,
          field_of_study: fieldOfStudy,
          education_level: educationLevel,
          program: program,
          duration: duration,
          password: hashedPassword,
          status: "pending"  // Must match your check constraint exactly
        }
      ]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json(
        { message: "Failed to save registration", error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Registration successful", data },
      { status: 200 }
    );

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { message: "Registration failed", error: err },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract data
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

    // Insert into applications table
    const { data, error } = await supabaseAdmin
      .from("applications")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
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
          program,
          duration,
          password, // plain password for now
          status: "pending" // must match check constraint
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Registration successful", data });

  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Registration failed" }, { status: 500 });
  }
}
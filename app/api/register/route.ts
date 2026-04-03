import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: Request) {

  try {

    const body = await req.json()

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
    } = body

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
          password: password,
          status: "Pending"
        }
      ])
      .select()

    if (error) {

      console.error("SUPABASE ERROR:", error)

      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      )

    }

    return NextResponse.json({ success: true, data })

  } catch (err) {

    console.error("SERVER ERROR:", err)

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )

  }

}
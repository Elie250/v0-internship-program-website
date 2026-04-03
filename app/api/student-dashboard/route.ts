import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {

  const email = req.headers.get("x-student-email");

  if (!email) {
    return NextResponse.json({ message: "Missing email" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("email", email)
    .single()

  if (error || !data) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    program: data.program,
    duration: data.duration,
    status: data.status,
    progress: 0
  })

}
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  const { email, password } = await req.json();

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  if (data.password !== password) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({
    token: "student-session",
    student_id: data.id,
    name: data.full_name,
    email: data.email
  });

}
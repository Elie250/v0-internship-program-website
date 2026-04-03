import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    // For testing, just return demo user if token exists
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Replace this with actual Supabase fetch using student ID from token
    const studentData = await supabaseAdmin
      .from('applications')
      .select('id, full_name, email, program, duration, status')
      .limit(1)
      .maybeSingle();

    if (!studentData) return NextResponse.json({ message: 'Student not found' }, { status: 404 });

    return NextResponse.json({ ...studentData.data, progress: 65 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
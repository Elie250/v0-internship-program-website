import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('webinars')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching webinars:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await supabaseAdmin
      .from('webinars')
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error creating webinar:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
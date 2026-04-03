import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('webinars')
    .select('*')
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, date, time, instructor, capacity, description } = body;

  const { data, error } = await supabaseAdmin
    .from('webinars')
    .insert([{ title, date, time, instructor, capacity, description, registrations: 0, created_at: new Date() }])
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, registrations } = body;

  const { data, error } = await supabaseAdmin
    .from('webinars')
    .update({ status, registrations, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;
  const { error } = await supabaseAdmin.from('webinars').delete().eq('id', id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
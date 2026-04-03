import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, owner_id } = body;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert([{ name, description, owner_id, status: 'Pending', created_at: new Date() }])
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, progress } = body;

  const { data, error } = await supabaseAdmin
    .from('projects')
    .update({ status, progress, updated_at: new Date() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
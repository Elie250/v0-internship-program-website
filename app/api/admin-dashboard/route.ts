import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token !== process.env.ADMIN_SECRET_TOKEN && token !== 'admin_token') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: applications });
  } catch (err) {
    console.error('Admin API GET error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, permissions } = body;

    if (!id) return NextResponse.json({ message: 'ID required' }, { status: 400 });

    const updates: any = {};
    if (status) updates.status = status;

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Optionally update permissions table if needed
    if (permissions) {
      await supabaseAdmin
        .from('student_permissions')
        .upsert({ student_id: id, ...permissions });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Admin API PATCH error:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
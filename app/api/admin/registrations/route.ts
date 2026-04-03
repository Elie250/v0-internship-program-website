import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (token !== process.env.ADMIN_SECRET_TOKEN && token !== 'admin_token') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all applications
    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Fetch error:', error);
      return NextResponse.json({ message: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications?.length || 0,
    }, { status: 200 });

  } catch (err) {
    console.error('[v0] Admin API error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, permissions } = body;

    if (!id) {
      return NextResponse.json({ message: 'Application ID is required' }, { status: 400 });
    }

    // Update application status
    const updates: any = {};
    if (status) updates.status = status;

    const { data: updated, error } = await supabaseAdmin
      .from('applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[v0] Update error:', error);
      return NextResponse.json({ message: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully',
      data: updated,
    }, { status: 200 });

  } catch (err) {
    console.error('[v0] PATCH error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

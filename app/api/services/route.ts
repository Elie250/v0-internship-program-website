import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published') === 'true';

    const supabase = await createClient();

    let query = supabase.from('services').select('*');

    if (published) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[v0] Services API error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, image_url, is_published } = body;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('services')
      .insert([
        {
          title,
          description,
          category,
          image_url,
          is_published: is_published || false,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Services create error:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

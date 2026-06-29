import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const DEFAULT_LOGO = '/images/energy-logics-logo.png'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ logoUrl: DEFAULT_LOGO })
    }

    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'company_logo_url')
      .maybeSingle()

    return NextResponse.json({ logoUrl: data?.value || DEFAULT_LOGO })
  } catch {
    return NextResponse.json({ logoUrl: DEFAULT_LOGO })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseAdminConfig } from '@/lib/supabaseAdmin'
import { getSupabaseConfigStatus } from '@/lib/auth-debug'

/** Safe diagnostics — no secrets. Share this JSON when debugging login. */
export async function GET() {
  const config = getSupabaseConfigStatus()
  const report: Record<string, unknown> = {
    ok: false,
    timestamp: new Date().toISOString(),
    config,
    usersTable: { reachable: false },
    adminUsers: { count: 0, emails: [] as string[] },
  }

  if (!supabaseAdmin) {
    report.error = supabaseAdminConfig.urlValidation.valid
      ? 'supabaseAdmin is null — set SUPABASE_SERVICE_ROLE_KEY in Vercel'
      : `Invalid Supabase URL: ${supabaseAdminConfig.urlValidation.issue}`
    return NextResponse.json(report, { status: 503 })
  }

  try {
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      report.usersTable = {
        reachable: false,
        error: countError.message,
        code: countError.code,
        hint: countError.hint,
        fix:
          countError.code === 'PGRST125'
            ? 'Set NEXT_PUBLIC_SUPABASE_URL to https://YOUR_PROJECT_REF.supabase.co only (no /rest/v1). Redeploy Vercel after changing env vars.'
            : countError.code === '42P01'
              ? 'Run scripts/00-create-users-table.sql in Supabase SQL editor, then NOTIFY pgrst, \'reload schema\';'
              : undefined,
      }
      return NextResponse.json(report, { status: 500 })
    }

    report.usersTable = { reachable: true, totalUsers: count ?? 0 }

    const { data: admins, error: adminError } = await supabaseAdmin
      .from('users')
      .select('email, role, status')
      .eq('role', 'admin')

    if (adminError) {
      report.adminUsers = { error: adminError.message, code: adminError.code }
    } else {
      report.adminUsers = {
        count: admins?.length ?? 0,
        emails: admins?.map((a) => a.email) ?? [],
        statuses: admins?.map((a) => ({ email: a.email, status: a.status })) ?? [],
      }
    }

    report.ok = true
    return NextResponse.json(report)
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error)
    return NextResponse.json(report, { status: 500 })
  }
}

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { establishUserSession } from '@/lib/auth/establish-session'
import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'

const LOGIN_TTL_MS = 30 * 60 * 1000 // 30 minutes

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Public base for recruitment magic links (jobs subdomain preferred). */
export function getRecruitmentPublicUrl(): string {
  const url =
    process.env.RECRUITMENT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_RECRUITMENT_URL?.trim() ||
    'https://jobs.energyandlogics.com'
  return url.replace(/\/$/, '')
}

/**
 * Passwordless "Continue with Email" for the Talent platform.
 * Uses shared `users` identity — does not create a parallel user store.
 * New users get an unusable random password_hash (Academy password login unchanged).
 */
export async function requestRecruitmentMagicLink(email: string): Promise<{
  success: boolean
  message: string
}> {
  const trimmed = email.trim().toLowerCase()
  const generic =
    'If that email can receive mail, we sent a sign-in link. Check your inbox and spam folder.'

  if (!trimmed || !trimmed.includes('@')) {
    return { success: false, message: 'Enter a valid email address.' }
  }
  if (!supabaseAdmin) {
    return { success: false, message: 'Sign-in is temporarily unavailable. Try again later.' }
  }

  let { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, last_name, role, status, permissions')
    .ilike('email', trimmed)
    .maybeSingle()

  if (user && (user.status === 'inactive' || user.status === 'suspended')) {
    return { success: true, message: generic }
  }

  if (!user) {
    const randomSecret = crypto.randomBytes(32).toString('hex')
    const passwordHash = await bcrypt.hash(randomSecret, 10)
    const inserted = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: trimmed,
          password_hash: passwordHash,
          first_name: '',
          last_name: '',
          role: 'registered',
          status: 'active',
          permissions: [],
        },
      ])
      .select('id, email, first_name, last_name, role, status, permissions')
      .single()

    if (inserted.error || !inserted.data) {
      // Concurrent create — fetch again
      const again = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, role, status, permissions')
        .ilike('email', trimmed)
        .maybeSingle()
      if (!again.data) {
        return { success: false, message: 'Could not create your account. Please try again.' }
      }
      user = again.data
    } else {
      user = inserted.data
    }
  }

  await ensureCandidateProfile(user.id)

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expires = new Date(Date.now() + LOGIN_TTL_MS).toISOString()

  const { error: tokenError } = await supabaseAdmin.from('recruitment_login_tokens').insert([
    {
      email: trimmed,
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expires,
    },
  ])

  if (tokenError) {
    return { success: false, message: 'Could not start sign-in. Please try again.' }
  }

  const verifyUrl = `${getRecruitmentPublicUrl()}/jobs/auth/verify?token=${token}`
  const name = user.first_name ? escapeHtml(String(user.first_name)) : 'there'

  await sendEmail({
    to: user.email,
    subject: `Sign in to ${COMPANY.brandName} Talent`,
    html: emailLayout({
      title: 'Continue with Email',
      subtitle: `${COMPANY.brandName} Talent`,
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>Use the button below to sign in to Energy &amp; Logics Talent. This link expires in 30 minutes.</p>
        <p style="margin:24px 0"><a href="${verifyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Continue with Email</a></p>
        <p style="font-size:13px;color:#64748b">If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">${verifyUrl}</p>
      `,
    }),
  })

  await writeRecruitmentAudit({
    actorUserId: user.id,
    action: 'magic_link_requested',
    entityType: 'users',
    entityId: user.id,
    metadata: { email: trimmed },
  })

  return { success: true, message: generic }
}

export async function consumeRecruitmentMagicLink(token: string): Promise<{
  success: boolean
  error?: string
  redirectTo?: string
}> {
  if (!token?.trim()) return { success: false, error: 'Invalid or expired sign-in link.' }
  if (!supabaseAdmin) return { success: false, error: 'Sign-in is temporarily unavailable.' }

  const tokenHash = hashToken(token.trim())
  const { data: row, error } = await supabaseAdmin
    .from('recruitment_login_tokens')
    .select('id, user_id, email, expires_at, consumed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error || !row) return { success: false, error: 'Invalid or expired sign-in link.' }
  if (row.consumed_at) return { success: false, error: 'This sign-in link was already used.' }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { success: false, error: 'This sign-in link has expired. Request a new one.' }
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, role, first_name, last_name, status, permissions')
    .eq('id', row.user_id)
    .maybeSingle()

  if (!user || user.status === 'inactive' || user.status === 'suspended') {
    return { success: false, error: 'This account cannot sign in.' }
  }

  await supabaseAdmin
    .from('recruitment_login_tokens')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)

  await ensureCandidateProfile(user.id)
  await establishUserSession(user)

  await writeRecruitmentAudit({
    actorUserId: user.id,
    action: 'magic_link_consumed',
    entityType: 'users',
    entityId: user.id,
  })

  return { success: true, redirectTo: '/app' }
}

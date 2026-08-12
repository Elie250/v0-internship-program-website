import crypto from 'crypto'

import bcrypt from 'bcryptjs'

import { supabaseAdmin } from '@/lib/supabaseAdmin'

import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'

import { COMPANY } from '@/lib/company/constants'

import { establishUserSession } from '@/lib/auth/establish-session'

import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'

import { writeRecruitmentAudit } from '@/lib/recruitment/audit'

import { normalizeRecruitmentEmail } from '@/lib/recruitment/email-normalize'

import {

  checkRecruitmentAuthRateLimit,

  hashClientIp,

} from '@/lib/recruitment/auth-rate-limit'

import { findOrCreateRecruitmentUser, type RecruitmentUserRow } from '@/lib/recruitment/user-lookup'



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



const GENERIC_SUCCESS_MESSAGE =

  'If that email can receive mail, we sent a sign-in link. Check your inbox and spam folder.'



function safeRedirectPath(path?: string | null): string | null {

  if (!path || !path.startsWith('/') || path.startsWith('//')) return null

  return path

}



async function createRecruitmentUser(normalizedEmail: string): Promise<{

  user: RecruitmentUserRow | null

  error?: string

}> {

  if (!supabaseAdmin) return { user: null, error: 'Database not configured' }



  const randomSecret = crypto.randomBytes(32).toString('hex')

  const passwordHash = await bcrypt.hash(randomSecret, 10)

  const { data, error } = await supabaseAdmin

    .from('users')

    .insert([

      {

        email: normalizedEmail,

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



  if (error) {

    if (error.code === '23505') {

      return { user: null }

    }

    return { user: null, error: error.message }

  }



  return { user: data as RecruitmentUserRow }

}



/**

 * Passwordless "Continue with Email" for the Talent platform.

 * Uses shared `users` identity — does not create a parallel user store.

 * New users get an unusable random password_hash (Academy password login unchanged).

 */

export async function requestRecruitmentMagicLink(
  email: string,
  clientIp?: string,
  redirectAfter?: string
): Promise<{

  success: boolean

  message: string

}> {

  const normalized = normalizeRecruitmentEmail(email)



  if (!normalized) {

    return { success: false, message: 'Enter a valid email address.' }

  }

  if (!supabaseAdmin) {

    return { success: false, message: 'Sign-in is temporarily unavailable. Try again later.' }

  }



  const ip = clientIp ?? 'unknown'

  const rateLimit = await checkRecruitmentAuthRateLimit(normalized, ip)

  if (!rateLimit.allowed) {

    // Same response whether limited or sent — no email enumeration

    return { success: true, message: GENERIC_SUCCESS_MESSAGE }

  }



  const { user: resolvedUser, error: userError } = await findOrCreateRecruitmentUser(

    normalized,

    () => createRecruitmentUser(normalized)

  )



  if (userError || !resolvedUser) {

    return { success: false, message: userError ?? 'Could not create your account. Please try again.' }

  }



  const user = resolvedUser



  if (user.status === 'inactive' || user.status === 'suspended') {

    return { success: true, message: GENERIC_SUCCESS_MESSAGE }

  }



  await ensureCandidateProfile(user.id)



  const token = crypto.randomBytes(32).toString('hex')

  const tokenHash = hashToken(token)

  const expires = new Date(Date.now() + LOGIN_TTL_MS).toISOString()

  const ipHash = hashClientIp(ip)



  const tokenRow: Record<string, unknown> = {

    email: normalized,

    user_id: user.id,

    token_hash: tokenHash,

    expires_at: expires,

    request_ip_hash: ipHash,

  }



  const { error: tokenError } = await supabaseAdmin.from('recruitment_login_tokens').insert([tokenRow])



  if (tokenError) {

    // Column may be missing if hardening migration not run — retry without IP hash

    if (tokenError.message?.includes('request_ip_hash')) {

      const { error: retryError } = await supabaseAdmin.from('recruitment_login_tokens').insert([

        {

          email: normalized,

          user_id: user.id,

          token_hash: tokenHash,

          expires_at: expires,

        },

      ])

      if (retryError) {

        return { success: false, message: 'Could not start sign-in. Please try again.' }

      }

    } else {

      return { success: false, message: 'Could not start sign-in. Please try again.' }

    }

  }



  const safeRedirect = safeRedirectPath(redirectAfter)
  const verifyUrl = `${getRecruitmentPublicUrl()}/jobs/auth/verify?token=${token}${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ''}`

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

    metadata: { email: normalized },

  })



  return { success: true, message: GENERIC_SUCCESS_MESSAGE }

}



export async function consumeRecruitmentMagicLink(token: string): Promise<{

  success: boolean

  error?: string

  redirectTo?: string

}> {

  if (!token?.trim()) return { success: false, error: 'Invalid or expired sign-in link.' }

  if (!supabaseAdmin) return { success: false, error: 'Sign-in is temporarily unavailable.' }



  const tokenHash = hashToken(token.trim())

  const consumedAt = new Date().toISOString()



  // Atomic single-use consume: only one concurrent verify can succeed

  const { data: row, error } = await supabaseAdmin

    .from('recruitment_login_tokens')

    .update({ consumed_at: consumedAt })

    .eq('token_hash', tokenHash)

    .is('consumed_at', null)

    .gt('expires_at', consumedAt)

    .select('id, user_id, email')

    .maybeSingle()



  if (error || !row) {

    const { data: existing } = await supabaseAdmin

      .from('recruitment_login_tokens')

      .select('consumed_at, expires_at')

      .eq('token_hash', tokenHash)

      .maybeSingle()



    if (existing?.consumed_at) {

      return { success: false, error: 'This sign-in link was already used.' }

    }

    if (existing && new Date(existing.expires_at).getTime() <= Date.now()) {

      return { success: false, error: 'This sign-in link has expired. Request a new one.' }

    }

    return { success: false, error: 'Invalid or expired sign-in link.' }

  }



  const { data: user } = await supabaseAdmin

    .from('users')

    .select('id, email, role, first_name, last_name, status, permissions')

    .eq('id', row.user_id)

    .maybeSingle()



  if (!user || user.status === 'inactive' || user.status === 'suspended') {

    return { success: false, error: 'This account cannot sign in.' }

  }



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



import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { establishUserSession } from '@/lib/auth/establish-session'
import { ensureCandidateProfile } from '@/lib/recruitment/candidate-profile'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import { normalizeRecruitmentEmail } from '@/lib/recruitment/email-normalize'
import { checkRecruitmentAuthRateLimit, hashClientIp } from '@/lib/recruitment/auth-rate-limit'
import {
  findOrCreateRecruitmentUser,
  findUserByNormalizedEmail,
  type RecruitmentUserRow,
} from '@/lib/recruitment/user-lookup'
import { listUserMemberships } from '@/lib/recruitment/authz'
import { hasPermission, PERMISSIONS, resolvePermissions } from '@/lib/admin/permissions'
import {
  capabilitiesFromState,
  resolvePostAuthRedirect,
  safeRecruitmentRedirect,
  type RecruitmentAuthMode,
  type RecruitmentRegisterIntent,
} from '@/lib/recruitment/post-auth'
import { getRecruitmentPublicUrl } from '@/lib/recruitment/public-url'
import {
  ensureEmployerOrganizationRequest,
  getLatestOrganizationRequestForUser,
  getPendingOrganizationRequestForUser,
} from '@/lib/recruitment/organization-requests'
import { getPendingInviteForEmail } from '@/lib/recruitment/organization-invites'
import { resolveEmployerOnboardingKind } from '@/lib/recruitment/onboarding-state'
import { sendEmployerRequestConfirmationEmail } from '@/lib/recruitment/employer-onboarding-emails'

const LOGIN_TTL_MS = 30 * 60 * 1000

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export { getRecruitmentPublicUrl }

const GENERIC_SUCCESS_MESSAGE =
  'If that email can receive mail, we sent a sign-in link. Check your inbox and spam folder.'

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
    if (error.code === '23505') return { user: null }
    return { user: null, error: error.message }
  }

  return { user: data as RecruitmentUserRow }
}

function isPlatformAdminUser(user: { role: string; permissions?: unknown }): boolean {
  if (user.role === 'admin') return true
  const permissions = resolvePermissions(user.role, user.permissions)
  return hasPermission(permissions, PERMISSIONS.RECRUITMENT_ORGS_MANAGE)
}

export async function requestRecruitmentMagicLink(
  email: string,
  clientIp?: string,
  redirectAfter?: string,
  options?: {
    mode?: RecruitmentAuthMode
    registerIntent?: RecruitmentRegisterIntent
    companyName?: string
  }
): Promise<{ success: boolean; message: string }> {
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
    return { success: true, message: GENERIC_SUCCESS_MESSAGE }
  }

  const mode: RecruitmentAuthMode = options?.mode === 'register' ? 'register' : 'signin'
  let user: RecruitmentUserRow | null = null

  if (mode === 'register') {
    const created = await findOrCreateRecruitmentUser(normalized, () => createRecruitmentUser(normalized))
    if (created.error || !created.user) {
      return { success: false, message: created.error ?? 'Could not create your account. Please try again.' }
    }
    user = created.user
  } else {
    const existing = await findUserByNormalizedEmail(normalized)
    if (existing.error) {
      return { success: false, message: 'Could not start sign-in. Please try again.' }
    }
    if (!existing.user) {
      return { success: true, message: GENERIC_SUCCESS_MESSAGE }
    }
    user = existing.user
  }

  if (user.status === 'inactive' || user.status === 'suspended') {
    return { success: true, message: GENERIC_SUCCESS_MESSAGE }
  }

  if (mode === 'register') {
    await ensureCandidateProfile(user.id)
  }

  let employerVerifyRedirect = safeRecruitmentRedirect(redirectAfter)
  if (mode === 'register' && options?.registerIntent === 'employer') {
    const requestResult = await ensureEmployerOrganizationRequest({
      userId: user.id,
      email: normalized,
      companyName: options.companyName,
      sendConfirmationEmail: false,
    })
    if (requestResult.error) {
      return { success: false, message: 'Could not start employer onboarding. Please try again.' }
    }
    employerVerifyRedirect = '/employer/pending'
  }

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

  const safeRedirect =
    mode === 'register' && options?.registerIntent === 'employer'
      ? employerVerifyRedirect
      : safeRecruitmentRedirect(redirectAfter)
  const verifyParams = new URLSearchParams({ token })
  if (safeRedirect) verifyParams.set('redirect', safeRedirect)
  if (options?.registerIntent) verifyParams.set('intent', options.registerIntent)
  const verifyUrl = `${getRecruitmentPublicUrl()}/jobs/auth/verify?${verifyParams.toString()}`

  const name = user.first_name ? escapeHtml(String(user.first_name)) : 'there'
  const isRegister = mode === 'register'
  const isEmployerRegister = isRegister && options?.registerIntent === 'employer'

  if (isEmployerRegister) {
    const pending = await getPendingOrganizationRequestForUser(user.id)
    await sendEmployerRequestConfirmationEmail({
      to: normalized,
      companyName:
        pending.request?.company_name || options?.companyName?.trim() || 'your organization',
      requestType:
        pending.request?.request_type ||
        (options?.companyName?.trim() ? 'new_organization' : 'access_existing'),
      verifyUrl,
    })
  } else {
    await sendEmail({
      to: user.email,
      subject: isRegister
        ? `Confirm your ${COMPANY.brandName} account`
        : `Sign in to ${COMPANY.brandName}`,
      html: emailLayout({
        title: isRegister ? 'Confirm your account' : 'Continue with Email',
        subtitle: COMPANY.brandName,
        bodyHtml: `
        <p>Hi ${name},</p>
        <p>${
          isRegister
            ? 'Use the button below to confirm your account. This link expires in 30 minutes.'
            : 'Use the button below to sign in. This link expires in 30 minutes.'
        }</p>
        <p style="margin:24px 0"><a href="${verifyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${
          isRegister ? 'Confirm account' : 'Continue with Email'
        }</a></p>
        <p style="font-size:13px;color:#64748b">If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">${verifyUrl}</p>
      `,
      }),
    })
  }

  await writeRecruitmentAudit({
    actorUserId: user.id,
    action: isRegister ? 'account_registration_requested' : 'magic_link_requested',
    entityType: 'users',
    entityId: user.id,
    metadata: {
      email: normalized,
      mode,
      registerIntent: options?.registerIntent ?? null,
      companyName: options?.companyName?.trim().slice(0, 120) || null,
    },
  })

  return { success: true, message: GENERIC_SUCCESS_MESSAGE }
}

export async function consumeRecruitmentMagicLink(
  token: string,
  requestedRedirect?: string | null,
  registerIntent?: RecruitmentRegisterIntent | null
): Promise<{
  success: boolean
  error?: string
  redirectTo?: string
}> {
  if (!token?.trim()) return { success: false, error: 'Invalid or expired sign-in link.' }
  if (!supabaseAdmin) return { success: false, error: 'Sign-in is temporarily unavailable.' }

  const tokenHash = hashToken(token.trim())
  const consumedAt = new Date().toISOString()

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

  const memberships = await listUserMemberships(user.id)
  const isPlatformAdmin = isPlatformAdminUser(user)
  const capabilities = capabilitiesFromState({
    hasActiveEmployerMembership: memberships.length > 0,
    isPlatformAdmin,
  })

  const [{ request: pendingRequest }, { request: latestRequest }, pendingInvite] = await Promise.all([
    getPendingOrganizationRequestForUser(user.id),
    getLatestOrganizationRequestForUser(user.id),
    getPendingInviteForEmail(user.email),
  ])

  const onboardingKind = resolveEmployerOnboardingKind({
    hasActiveEmployerMembership: memberships.length > 0,
    isPlatformAdmin,
    hasPendingOrganizationRequest: Boolean(pendingRequest),
    hasPendingInvite: Boolean(pendingInvite.invite),
    latestRequestStatus: latestRequest?.status ?? null,
  })

  const redirectTo = resolvePostAuthRedirect({
    requestedRedirect,
    capabilities,
    registerIntent:
      registerIntent === 'employer' || registerIntent === 'candidate' ? registerIntent : null,
    onboardingKind,
  })

  await writeRecruitmentAudit({
    actorUserId: user.id,
    action: 'magic_link_consumed',
    entityType: 'users',
    entityId: user.id,
    metadata: {
      redirectTo,
      canUseEmployer: capabilities.canUseEmployer,
      onboardingKind,
    },
  })

  return { success: true, redirectTo }
}

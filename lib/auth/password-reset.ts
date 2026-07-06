import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail, escapeHtml, emailLayout, getAppUrl } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'

const RESET_TTL_MS = 60 * 60 * 1000 // 1 hour

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  const trimmed = email.trim().toLowerCase()
  const genericMessage =
    'If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.'

  if (!trimmed) {
    return { success: false, message: 'Email is required' }
  }

  if (!supabaseAdmin) {
    return { success: false, message: 'Password reset is temporarily unavailable. Contact support.' }
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, first_name, status')
    .eq('email', trimmed)
    .maybeSingle()

  if (!user || user.status === 'inactive' || user.status === 'suspended') {
    return { success: true, message: genericMessage }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expires = new Date(Date.now() + RESET_TTL_MS).toISOString()

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      password_reset_token: tokenHash,
      password_reset_expires: expires,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, message: 'Could not start password reset. Try again or contact support.' }
  }

  const resetUrl = `${getAppUrl()}/auth/reset-password?token=${token}`
  const name = user.first_name ? escapeHtml(String(user.first_name)) : 'there'

  await sendEmail({
    to: user.email,
    subject: `Reset your ${COMPANY.platformName} password`,
    html: emailLayout({
      title: 'Reset your password',
      subtitle: COMPANY.brandName,
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below — the link expires in 1 hour.</p>
        <p style="margin:24px 0"><a href="${resetUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
        <p style="font-size:13px;color:#64748b">If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">${resetUrl}</p>
      `,
    }),
  })

  return { success: true, message: genericMessage }
}

export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!token?.trim()) return { success: false, error: 'Invalid or expired reset link' }
  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' }
  }

  if (!supabaseAdmin) {
    return { success: false, error: 'Password reset is temporarily unavailable' }
  }

  const tokenHash = hashToken(token.trim())

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, password_reset_expires')
    .eq('password_reset_token', tokenHash)
    .maybeSingle()

  if (!user?.password_reset_expires) {
    return { success: false, error: 'Invalid or expired reset link. Request a new one.' }
  }

  if (new Date(user.password_reset_expires).getTime() < Date.now()) {
    return { success: false, error: 'This reset link has expired. Request a new one from the login page.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

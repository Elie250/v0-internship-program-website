export const ENROLLMENT_STATUS = {
  PAYMENT_PENDING: 'payment_pending_review',
  ADMITTED: 'admitted',
  PAYMENT_REJECTED: 'payment_rejected',
  WAITLISTED: 'waitlisted',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS]

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  payment_pending_review: 'Payment under review',
  applied: 'Application submitted',
  pending_payment: 'Awaiting payment',
  admitted: 'Enrolled',
  payment_rejected: 'Payment not verified',
  waitlisted: 'Waitlisted',
  cancelled: 'Cancelled',
  expired: 'Access expired',
}

export const ACCESS_STATE_LABELS = {
  pending: 'Payment under review',
  rejected: 'Payment not verified',
  waitlisted: 'On waitlist',
  cancelled: 'Cancelled',
  upcoming: 'Access starts soon',
  active: 'Active',
  expired: 'Access expired',
} as const

export type AccessState = keyof typeof ACCESS_STATE_LABELS

export const PENDING_ENROLLMENT_STATUSES = [
  'payment_pending_review',
  'applied',
  'pending_payment',
] as const

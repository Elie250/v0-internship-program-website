export { sendApplicationEmail } from '@/lib/email/notifications'
export type { ApplicationEmailParams } from '@/lib/email/notifications'
export {
  sendPaymentSubmittedToAdmin,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail,
  sendPaymentRefundedEmail,
  sendEnrollmentAdmittedEmail,
  sendEnrollmentRejectedEmail,
  sendStaffRegistrationPendingToAdmin,
  sendStaffApprovedEmail,
  sendSupportTicketCreatedToAdmin,
  sendSupportTicketResponseEmail,
  sendSupportSubscriptionActivatedEmail,
  sendSupportSubscriptionRejectedEmail,
} from '@/lib/email/notifications'

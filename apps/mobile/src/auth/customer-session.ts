/**
 * Guest shop only. There is no customer account token or password system.
 * Do not treat a staff session as a customer session.
 */
export const CUSTOMER_SESSION_KEY = 'el.customer.session.token'

export function hasCustomerSession(): boolean {
  return false
}

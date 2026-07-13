import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { EnergyLibraryItem } from '@/lib/library/items'

export type LibraryPurchaseStatus = 'pending_payment' | 'active' | 'rejected' | 'refunded'

const CHARGEABLE_UPLOADER_ROLES = new Set(['admin', 'super_admin', 'lecturer'])

export function canSetLibraryPrice(pillar: string, uploaderRole: string | null | undefined): boolean {
  if (pillar !== 'books' && pillar !== 'culture') return false
  return CHARGEABLE_UPLOADER_ROLES.has(String(uploaderRole ?? '').toLowerCase())
}

export function libraryItemRequiresPayment(item: EnergyLibraryItem): boolean {
  if (!canSetLibraryPrice(item.pillar, item.uploader_role)) return false
  return Number(item.price_rwf ?? 0) > 0
}

export function staffBypassesLibraryPaywall(role: string | null | undefined): boolean {
  const normalized = String(role ?? '').toLowerCase()
  return normalized === 'admin' || normalized === 'super_admin'
}

export async function getLibraryPurchaseForUser(
  userId: string,
  libraryItemId: string
): Promise<{ status: LibraryPurchaseStatus; paymentId: string | null } | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('library_purchases')
    .select('status, payment_id')
    .eq('user_id', userId)
    .eq('library_item_id', libraryItemId)
    .maybeSingle()

  if (error?.message?.includes('library_purchases')) return null
  if (error || !data) return null

  return {
    status: String(data.status) as LibraryPurchaseStatus,
    paymentId: data.payment_id != null ? String(data.payment_id) : null,
  }
}

export async function userHasLibraryAccess(
  userId: string | null | undefined,
  userRole: string | null | undefined,
  item: EnergyLibraryItem
): Promise<{ hasAccess: boolean; purchaseStatus?: LibraryPurchaseStatus }> {
  if (!libraryItemRequiresPayment(item)) return { hasAccess: true }
  if (staffBypassesLibraryPaywall(userRole)) return { hasAccess: true }
  if (!userId) return { hasAccess: false }

  const purchase = await getLibraryPurchaseForUser(userId, item.id)
  if (purchase?.status === 'active') return { hasAccess: true }
  if (purchase?.status === 'pending_payment') {
    return { hasAccess: false, purchaseStatus: 'pending_payment' }
  }
  return { hasAccess: false }
}

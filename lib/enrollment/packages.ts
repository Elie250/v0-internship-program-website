import { isFreeProgram } from './program-types.ts'
import { isApprovedPaymentStatus } from '../payments/status.ts'

export const PACKAGE_CURRENCY = 'RWF' as const

export type CoursePricingPackageRow = {
  id: string
  course_id: string
  name: string
  description: string | null
  benefits: string | null
  currency: string
  list_price: number | string
  discount_amount: number | string
  final_price: number | string
  is_active: boolean
  sort_order: number
}

export type StudentPackageOption = {
  id: string
  name: string
  description: string | null
  benefits: string | null
  currency: typeof PACKAGE_CURRENCY
  listPrice: number
  discountAmount: number
  finalPrice: number
  sortOrder: number
}

export type EnrollmentPackageSnapshot = {
  package_id: string
  package_name: string
  package_currency: typeof PACKAGE_CURRENCY
  package_list_price: number
  package_discount_amount: number
  package_final_price: number
  package_benefits: string | null
}

export type PricingMode =
  | { mode: 'legacy'; amountDue: number; isComplimentary: boolean }
  | {
      mode: 'package'
      packageId: string
      amountDue: number
      isComplimentary: boolean
      snapshot: EnrollmentPackageSnapshot
    }

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function asMoney(value: unknown, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return roundMoney(value)
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return roundMoney(parsed)
  }
  throw new Error(`${label} must be a valid number.`)
}

/** Server-side final price. Rejects invalid inputs; does not clamp. */
export function computeFinalPrice(listPriceInput: unknown, discountAmountInput: unknown): number {
  const listPrice = asMoney(listPriceInput, 'List price')
  const discountAmount = asMoney(discountAmountInput, 'Discount')
  if (listPrice < 0) throw new Error('List price cannot be negative.')
  if (discountAmount < 0) throw new Error('Discount cannot be negative.')
  if (discountAmount > listPrice) throw new Error('Discount cannot exceed list price.')
  const finalPrice = roundMoney(listPrice - discountAmount)
  if (finalPrice < 0) throw new Error('Final price cannot be negative.')
  return finalPrice
}

export function assertPackageCurrency(currency: unknown): asserts currency is typeof PACKAGE_CURRENCY {
  if (String(currency ?? '').trim().toUpperCase() !== PACKAGE_CURRENCY) {
    throw new Error(`Currency must be ${PACKAGE_CURRENCY}.`)
  }
}

export function normalizePackageMoneyFields(input: {
  listPrice: unknown
  discountAmount?: unknown
  currency?: unknown
}): { listPrice: number; discountAmount: number; finalPrice: number; currency: typeof PACKAGE_CURRENCY } {
  assertPackageCurrency(input.currency ?? PACKAGE_CURRENCY)
  const listPrice = asMoney(input.listPrice, 'List price')
  const discountAmount = asMoney(input.discountAmount ?? 0, 'Discount')
  const finalPrice = computeFinalPrice(listPrice, discountAmount)
  return { listPrice, discountAmount, finalPrice, currency: PACKAGE_CURRENCY }
}

export function serializeStudentPackageOption(row: CoursePricingPackageRow): StudentPackageOption {
  assertPackageCurrency(row.currency)
  const listPrice = asMoney(row.list_price, 'List price')
  const discountAmount = asMoney(row.discount_amount, 'Discount')
  const storedFinal = asMoney(row.final_price, 'Final price')
  const recomputed = computeFinalPrice(listPrice, discountAmount)
  if (storedFinal !== recomputed) {
    throw new Error('Stored package final price does not match list price and discount.')
  }
  return {
    id: String(row.id),
    name: String(row.name ?? '').trim() || 'Package',
    description: row.description != null ? String(row.description) : null,
    benefits: row.benefits != null ? String(row.benefits) : null,
    currency: PACKAGE_CURRENCY,
    listPrice,
    discountAmount,
    finalPrice: recomputed,
    sortOrder: Number(row.sort_order ?? 0),
  }
}

export function listActivePackages(rows: CoursePricingPackageRow[]): StudentPackageOption[] {
  return rows
    .filter((row) => row.is_active === true)
    .map(serializeStudentPackageOption)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export function courseHasActivePackages(rows: CoursePricingPackageRow[]): boolean {
  return rows.some((row) => row.is_active === true)
}

export function assertPackageForCourse(
  rows: CoursePricingPackageRow[],
  courseId: string,
  packageId: string | null | undefined
): CoursePricingPackageRow {
  const id = String(packageId ?? '').trim()
  if (!id) {
    throw new Error('Select a pricing package for this programme.')
  }
  const row = rows.find((entry) => String(entry.id) === id)
  if (!row) {
    throw new Error('The selected pricing package was not found.')
  }
  if (String(row.course_id) !== String(courseId)) {
    throw new Error('The selected pricing package does not belong to this programme.')
  }
  if (row.is_active !== true) {
    throw new Error('The selected pricing package is no longer available.')
  }
  assertPackageCurrency(row.currency)
  computeFinalPrice(row.list_price, row.discount_amount)
  return row
}

export function buildEnrollmentPackageSnapshot(row: CoursePricingPackageRow): EnrollmentPackageSnapshot {
  const option = serializeStudentPackageOption(row)
  return {
    package_id: option.id,
    package_name: option.name,
    package_currency: PACKAGE_CURRENCY,
    package_list_price: option.listPrice,
    package_discount_amount: option.discountAmount,
    package_final_price: option.finalPrice,
    package_benefits: option.benefits,
  }
}

/**
 * Resolve how a new enrollment should be priced.
 * Active packages force package mode even when courses.pricing is zero.
 */
export function resolveEnrollmentPricing(input: {
  courseId: string
  legacyPricing: number | null | undefined
  packages: CoursePricingPackageRow[]
  packageId?: string | null
}): PricingMode {
  if (courseHasActivePackages(input.packages)) {
    const row = assertPackageForCourse(input.packages, input.courseId, input.packageId)
    const snapshot = buildEnrollmentPackageSnapshot(row)
    return {
      mode: 'package',
      packageId: snapshot.package_id,
      amountDue: snapshot.package_final_price,
      isComplimentary: snapshot.package_final_price <= 0,
      snapshot,
    }
  }

  const amountDue = Number(input.legacyPricing ?? 0)
  return {
    mode: 'legacy',
    amountDue,
    isComplimentary: isFreeProgram(amountDue),
  }
}

export function cataloguePriceLabel(input: {
  legacyPricing: number | null | undefined
  activePackages: StudentPackageOption[]
}): { kind: 'free' | 'fixed' | 'from'; amount: number | null; label: string } {
  if (input.activePackages.length === 0) {
    const amount = Number(input.legacyPricing ?? 0)
    if (isFreeProgram(amount)) return { kind: 'free', amount: 0, label: 'Free' }
    return { kind: 'fixed', amount, label: `${amount.toLocaleString()} RWF` }
  }
  const amounts = input.activePackages.map((pkg) => pkg.finalPrice)
  const min = Math.min(...amounts)
  const allSame = amounts.every((value) => value === min)
  if (input.activePackages.length === 1 || allSame) {
    return { kind: 'fixed', amount: min, label: `${min.toLocaleString()} RWF` }
  }
  return { kind: 'from', amount: min, label: `From ${min.toLocaleString()} RWF` }
}

export function sumApprovedPayments(
  payments: Array<{ amount?: number | string | null; status?: string | null }>
): number {
  let total = 0
  for (const payment of payments) {
    if (!isApprovedPaymentStatus(payment.status)) continue
    const amount = Number(payment.amount ?? 0)
    if (!Number.isFinite(amount)) continue
    total = roundMoney(total + amount)
  }
  return total
}

export function remainingBalance(amountDue: number | null | undefined, paid: number): number {
  const due = Number(amountDue ?? 0)
  if (!Number.isFinite(due)) return 0
  return Math.max(roundMoney(due - paid), 0)
}

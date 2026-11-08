import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertPackageForCourse,
  buildEnrollmentPackageSnapshot,
  cataloguePriceLabel,
  computeFinalPrice,
  courseHasActivePackages,
  listActivePackages,
  normalizePackageMoneyFields,
  remainingBalance,
  resolveEnrollmentPricing,
  sumApprovedPayments,
  type CoursePricingPackageRow,
} from '../lib/enrollment/packages.ts'

const courseId = 'course-1'

function pkg(overrides: Partial<CoursePricingPackageRow> = {}): CoursePricingPackageRow {
  return {
    id: 'pkg-1',
    course_id: courseId,
    name: 'Standard',
    description: 'Core access',
    benefits: 'Lessons\nCertificate',
    currency: 'RWF',
    list_price: 100000,
    discount_amount: 10000,
    final_price: 90000,
    is_active: true,
    sort_order: 1,
    ...overrides,
  }
}

test('computeFinalPrice handles zero, full, and normal discounts', () => {
  assert.equal(computeFinalPrice(100000, 0), 100000)
  assert.equal(computeFinalPrice(100000, 100000), 0)
  assert.equal(computeFinalPrice(100000, 25000), 75000)
})

test('computeFinalPrice rejects invalid money inputs', () => {
  assert.throws(() => computeFinalPrice(-1, 0), /negative/i)
  assert.throws(() => computeFinalPrice(100, -1), /negative/i)
  assert.throws(() => computeFinalPrice(100, 101), /exceed/i)
  assert.throws(() => normalizePackageMoneyFields({ listPrice: 100, discountAmount: 0, currency: 'USD' }), /RWF/)
})

test('active package filtering and ownership checks', () => {
  const rows = [
    pkg({ id: 'a', is_active: true, sort_order: 2, name: 'Premium', final_price: 90000 }),
    pkg({ id: 'b', is_active: false, sort_order: 0, name: 'Hidden', final_price: 90000 }),
    pkg({
      id: 'c',
      is_active: true,
      sort_order: 1,
      name: 'Standard',
      list_price: 80000,
      discount_amount: 0,
      final_price: 80000,
    }),
  ]
  const active = listActivePackages(rows)
  assert.deepEqual(
    active.map((row) => row.id),
    ['c', 'a']
  )
  assert.equal(courseHasActivePackages(rows), true)
  assert.equal(courseHasActivePackages([pkg({ is_active: false })]), false)
  assert.throws(() => assertPackageForCourse(rows, courseId, null), /Select a pricing package/i)
  assert.throws(() => assertPackageForCourse(rows, courseId, 'missing'), /not found/i)
  assert.throws(() => assertPackageForCourse(rows, courseId, 'b'), /no longer available/i)
  assert.throws(
    () => assertPackageForCourse([pkg({ course_id: 'other' })], courseId, 'pkg-1'),
    /does not belong/i
  )
})

test('legacy pricing when no active packages exist', () => {
  const free = resolveEnrollmentPricing({
    courseId,
    legacyPricing: 0,
    packages: [pkg({ is_active: false })],
  })
  assert.equal(free.mode, 'legacy')
  if (free.mode === 'legacy') {
    assert.equal(free.isComplimentary, true)
    assert.equal(free.amountDue, 0)
  }

  const paid = resolveEnrollmentPricing({
    courseId,
    legacyPricing: 50000,
    packages: [],
  })
  assert.equal(paid.mode, 'legacy')
  if (paid.mode === 'legacy') {
    assert.equal(paid.isComplimentary, false)
    assert.equal(paid.amountDue, 50000)
  }
})

test('package pricing when active packages exist ignores legacy zero', () => {
  assert.throws(
    () =>
      resolveEnrollmentPricing({
        courseId,
        legacyPricing: 0,
        packages: [pkg()],
        packageId: null,
      }),
    /Select a pricing package/i
  )

  const priced = resolveEnrollmentPricing({
    courseId,
    legacyPricing: 0,
    packages: [pkg()],
    packageId: 'pkg-1',
  })
  assert.equal(priced.mode, 'package')
  if (priced.mode === 'package') {
    assert.equal(priced.isComplimentary, false)
    assert.equal(priced.amountDue, 90000)
    assert.equal(priced.snapshot.package_name, 'Standard')
    assert.equal(priced.snapshot.package_list_price, 100000)
    assert.equal(priced.snapshot.package_discount_amount, 10000)
    assert.equal(priced.snapshot.package_final_price, 90000)
    assert.equal(priced.snapshot.package_currency, 'RWF')
  }
})

test('snapshot stays independent of later package edits', () => {
  const original = pkg()
  const snapshot = buildEnrollmentPackageSnapshot(original)
  const edited = pkg({
    name: 'Renamed',
    list_price: 200000,
    discount_amount: 0,
    final_price: 200000,
    benefits: 'Changed',
  })
  assert.equal(snapshot.package_name, 'Standard')
  assert.equal(snapshot.package_final_price, 90000)
  assert.equal(snapshot.package_benefits, 'Lessons\nCertificate')
  assert.notEqual(snapshot.package_final_price, Number(edited.final_price))
})

test('catalogue label uses From for multiple active packages', () => {
  const active = listActivePackages([
    pkg({ id: 'a', final_price: 90000, list_price: 100000, discount_amount: 10000 }),
    pkg({
      id: 'b',
      name: 'Premium',
      list_price: 150000,
      discount_amount: 0,
      final_price: 150000,
      sort_order: 2,
    }),
  ])
  assert.equal(cataloguePriceLabel({ legacyPricing: 0, activePackages: active }).label, 'From 90,000 RWF')
  assert.equal(
    cataloguePriceLabel({
      legacyPricing: 0,
      activePackages: active.slice(0, 1),
    }).label,
    '90,000 RWF'
  )
  assert.equal(cataloguePriceLabel({ legacyPricing: 0, activePackages: [] }).label, 'Free')
})

test('approved payment totals and remaining balance', () => {
  const paid = sumApprovedPayments([
    { amount: 40000, status: 'approved' },
    { amount: 10000, status: 'Paid' },
    { amount: 50000, status: 'pending_review' },
    { amount: 50000, status: 'rejected' },
  ])
  assert.equal(paid, 50000)
  assert.equal(remainingBalance(90000, paid), 40000)
  assert.equal(remainingBalance(40000, paid), 0)
})

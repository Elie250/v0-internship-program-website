/**
 * Staff vs customer session / lock / track-order navigation.
 * Run: pnpm test:shop-session-nav
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')
const mobile = (rel) => read(join('apps/mobile', rel).replace(/\\/g, '/'))

test('Test A — staff token never becomes customer authentication', () => {
  const customer = mobile('src/auth/customer-session.ts')
  const index = mobile('app/index.tsx')
  const session = mobile('src/auth/session-store.ts')
  const secure = mobile('src/auth/secure-session.ts')
  assert.match(customer, /hasCustomerSession/)
  assert.match(customer, /return false/)
  assert.match(index, /\/customer/)
  assert.doesNotMatch(index, /token && user/)
  assert.match(secure, /el.staff.session.token/)
  assert.match(secure, /el.staff.session.locked/)
  assert.doesNotMatch(session, /CUSTOMER_SESSION_KEY|el.customer.session/)
})

test('Test B — no customer private account system', () => {
  const customer = mobile('src/auth/customer-session.ts')
  const account = mobile('app/customer/account.tsx')
  assert.match(customer, /no customer account/)
  assert.match(account, /account.guestHint/)
  assert.doesNotMatch(account, /password|customer.login/)
})

test('Test C — locked staff requires authentication', () => {
  const layout = mobile('app/staff/_layout.tsx')
  const login = mobile('app/login.tsx')
  const store = mobile('src/auth/session-store.ts')
  const requireNav = mobile('src/ui/RequireStaffNav.tsx')
  assert.match(layout, /locked/)
  assert.match(layout, /Redirect href="\/login"/)
  assert.match(login, /needsUnlock/)
  assert.match(login, /Unlock staff/)
  assert.match(store, /lock:/)
  assert.match(store, /locked && hydrated/)
  assert.match(requireNav, /locked/)
})

test('Test D — salesperson inventory remains permission-gated', () => {
  const inventory = mobile('app/staff/inventory.tsx')
  const requireNav = mobile('src/ui/RequireStaffNav.tsx')
  const perms = mobile('src/permissions.ts')
  assert.match(inventory, /RequireStaffNav/)
  assert.match(inventory, /navKey="inventory"/)
  assert.match(requireNav, /canSeeStaffNavItem/)
  assert.match(perms, /SHOP_STOCK_VIEW/)
})

test('Test E — staff routes require a staff session', () => {
  const layout = mobile('app/staff/_layout.tsx')
  assert.match(layout, /!token/)
  assert.match(layout, /Redirect href="\/login"/)
})

test('Test F — lock and sign out leave the customer shop as guest', () => {
  const settings = mobile('app/staff/settings.tsx')
  const bar = mobile('src/ui/StaffModeBar.tsx')
  const leave = mobile('src/navigation/leave-staff-for-shop.ts')
  const boundary = mobile('src/navigation/use-customer-shop-boundary.ts')
  assert.match(settings, /leaveStaffForShop/)
  assert.match(settings, /signOut/)
  assert.match(settings, /lock/)
  assert.match(bar, /Lock \/ Switch user/)
  assert.match(leave, /router.replace\('\/customer'/)
  assert.match(leave, /lock\(\)/)
  assert.match(boundary, /hardwareBackPress/)
  assert.match(boundary, /lockStaffIfPresent|token && !locked/)
})

test('Test G — Track order is not labelled Sign in', () => {
  const header = mobile('src/features/shop/ShopHeader.tsx')
  const account = mobile('app/customer/account.tsx')
  const en = mobile('src/i18n/messages/en.ts')
  assert.match(header, /nav.trackOrder/)
  assert.match(header, /\/customer\/track/)
  assert.doesNotMatch(header, /nav.signIn/)
  assert.match(account, /account.track/)
  assert.doesNotMatch(account, /account.signIn'/)
  assert.match(en, /'nav.trackOrder': 'Track order'/)
  assert.match(en, /'account.track': 'Track my order'/)
})

test('package.json exposes test:shop-session-nav', () => {
  assert.match(read('package.json'), /test:shop-session-nav/)
})

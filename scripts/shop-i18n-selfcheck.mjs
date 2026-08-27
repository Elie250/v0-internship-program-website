/**
 * Shop UI localization self-checks (EN + RW).
 * Run: pnpm test:shop-i18n
 */
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (rel) => readFileSync(join(root, rel), 'utf8')

test('i18n module files exist', () => {
  for (const rel of [
    'lib/shop/i18n/locales.ts',
    'lib/shop/i18n/messages/en.ts',
    'lib/shop/i18n/messages/rw.ts',
    'lib/shop/i18n/translate.ts',
    'lib/shop/i18n/index.ts',
    'components/shop-portal/shop-i18n-provider.tsx',
    'components/shop-portal/shop-language-selector.tsx',
  ]) {
    assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
  }
})

test('English dictionary exports shopMessagesEn and RW is Partial', () => {
  const en = read('lib/shop/i18n/messages/en.ts')
  const rw = read('lib/shop/i18n/messages/rw.ts')
  assert.match(en, /export const shopMessagesEn/)
  assert.match(en, /'nav\.dashboard': 'Dashboard'/)
  assert.match(rw, /export const shopMessagesRw/)
  assert.match(rw, /'nav\.dashboard': 'Incamake'/)
  assert.match(rw, /'nav\.products': 'Ibicuruzwa'/)
  assert.match(rw, /'nav\.staff': 'Abakozi'/)
  assert.match(rw, /'brand\.siteLabel': 'Nyanza Shop'/)
  assert.match(rw, /'role\.admin': 'Umuyobozi mukuru'/)
  // POS stays technical
  assert.match(rw, /'nav\.pos': 'POS'/)
})

test('translate falls back to English when RW key missing (source contract)', () => {
  const src = read('lib/shop/i18n/translate.ts')
  assert.match(src, /listMissingKinyarwandaKeys/)
  assert.match(src, /shopMessagesRw\[key\]/)
  assert.match(src, /shopMessagesEn\[key\]/)
})

test('provider persists locale to localStorage and cookie', () => {
  const src = read('components/shop-portal/shop-i18n-provider.tsx')
  assert.match(src, /SHOP_LOCALE_STORAGE_KEY/)
  assert.match(src, /SHOP_LOCALE_COOKIE/)
  assert.match(src, /localStorage\.setItem/)
  assert.match(src, /document\.cookie/)
})

test('language selector exposes English and Kinyarwanda', () => {
  const src = read('components/shop-portal/shop-language-selector.tsx')
  assert.match(src, /SHOP_LOCALES/)
  assert.match(src, /SHOP_LOCALE_LABELS/)
  assert.match(src, /setLocale/)
})

test('shell and login mount ShopI18nProvider and language selector', () => {
  assert.match(read('app/manage/(portal)/layout.tsx'), /ShopI18nProvider/)
  assert.match(read('app/manage/login/page.tsx'), /ShopI18nProvider/)
  assert.match(read('components/shop-portal/shop-shell.tsx'), /ShopLanguageSelector/)
  assert.match(read('components/shop-portal/shop-header.tsx'), /ShopLanguageSelector/)
  assert.match(read('components/shop-portal/shop-login-screen.tsx'), /ShopLanguageSelector/)
})

test('nav items expose labelKey for localization', () => {
  const src = read('lib/shop/portal-nav.ts')
  assert.match(src, /labelKey: 'nav\.dashboard'/)
  assert.match(src, /labelKey: 'nav\.staff'/)
  assert.match(read('components/shop-portal/shop-nav.tsx'), /t\(item\.labelKey\)/)
})

test('approved Kinyarwanda vocabulary is present for core nav and actions', () => {
  const rw = read('lib/shop/i18n/messages/rw.ts')
  const required = [
    ['Incamake', 'Dashboard'],
    ['Ibicuruzwa', 'Products'],
    ['Ububiko', 'Inventory/Stock'],
    ["'nav.sales': 'Igurisha'", 'Sales nav'],
    ['Abakozi', 'Staff'],
    ['Igenamiterere', 'Settings'],
    ['Injira', 'Login'],
    ['Sohoka', 'Logout'],
    ['Shakisha', 'Search'],
    ['Hindura', 'Edit'],
    ['Bika', 'Save'],
    ["'action.cancel': 'Reka'", 'Cancel'],
    ['Funga', 'Close'],
    ['Emeza', 'Confirm'],
    ['Umuyobozi mukuru', 'Administrator'],
    ['Umucuruzi', 'Salesperson'],
    ['Ushinzwe ububiko', 'Inventory Manager'],
    ['Ururimi', 'Language'],
    ['Ongeramo', 'Add'],
    ['Subira inyuma', 'Back'],
    ['Amafaranga', 'Cash'],
    ['Imeyili', 'Email'],
  ]
  for (const [term, label] of required) {
    assert.ok(rw.includes(term), `RW missing approved term for ${label}: ${term}`)
  }
})

test('package.json exposes test:shop-i18n', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['test:shop-i18n'], 'node --test scripts/shop-i18n-selfcheck.mjs')
})

test('glossary exists and matches approved Sales/Staff terms', () => {
  const src = read('docs/shop-localization-glossary.md')
  assert.match(src, /Igurisha/)
  assert.match(src, /Ushinzwe ububiko/)
  assert.match(src, /Nyanza Shop/)
  assert.match(src, /Do not translate/)
})

test('missing Kinyarwanda keys can be enumerated from sources', () => {
  const en = read('lib/shop/i18n/messages/en.ts')
  const rw = read('lib/shop/i18n/messages/rw.ts')
  const enKeys = [...en.matchAll(/'([a-zA-Z0-9_.]+)':\s*'/g)].map((m) => m[1])
  const rwKeys = new Set([...rw.matchAll(/'([a-zA-Z0-9_.]+)':\s*'/g)].map((m) => m[1]))
  assert.ok(enKeys.length > 50, 'expected a substantial English catalog')
  const missing = enKeys.filter((k) => !rwKeys.has(k))
  for (const key of [
    'nav.dashboard',
    'nav.products',
    'nav.inventory',
    'nav.sales',
    'nav.staff',
    'nav.settings',
    'action.signIn',
    'action.signOut',
    'common.language',
    'pos.successTitle',
    'pos.successBody',
  ]) {
    assert.equal(missing.includes(key), false, `${key} should have RW`)
  }
  // Full chrome coverage this phase; leftover keys (if any) must fall back to English.
  if (missing.length > 0) {
    console.log('Missing RW keys (English fallback):', missing.join(', '))
  }
})

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
  assert.match(src, /User-facing language principles/)
  assert.match(
    src,
    /Incamake y’imikorere y’iduka ry’i Nyanza\. Imibare ijyanye n’amakuru y’ubucuruzi\./
  )
})

function extractShopMessages(src) {
  const map = new Map()
  const re = /'([a-zA-Z0-9_.]+)':\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g
  let match
  while ((match = re.exec(src))) {
    map.set(match[1], (match[2] ?? match[3]).replace(/\\'/g, "'").replace(/\\"/g, '"'))
  }
  return map
}

const TECHNICAL_VALUE_RE =
  /\b(APIs?|servers?|databases?|endpoints?|browsers?|clients?|services?)\b|seriveri|serivisi/i

test('English and Kinyarwanda dictionaries share identical keys', () => {
  const en = extractShopMessages(read('lib/shop/i18n/messages/en.ts'))
  const rw = extractShopMessages(read('lib/shop/i18n/messages/rw.ts'))
  assert.ok(en.size > 50, 'expected a substantial English catalog')
  const missing = [...en.keys()].filter((key) => !rw.has(key))
  const extra = [...rw.keys()].filter((key) => !en.has(key))
  assert.deepEqual(missing, [], `RW missing keys: ${missing.join(', ')}`)
  assert.deepEqual(extra, [], `RW extra keys: ${extra.join(', ')}`)
})

test('staff-facing translations avoid implementation wording', () => {
  const en = extractShopMessages(read('lib/shop/i18n/messages/en.ts'))
  const rw = extractShopMessages(read('lib/shop/i18n/messages/rw.ts'))
  const offenders = []
  for (const [locale, dict] of [
    ['en', en],
    ['rw', rw],
  ]) {
    for (const [key, value] of dict) {
      if (TECHNICAL_VALUE_RE.test(value)) {
        offenders.push(`${locale}:${key}=${value}`)
      }
    }
  }
  assert.deepEqual(offenders, [], `technical wording in UI copy:\n${offenders.join('\n')}`)
  assert.doesNotMatch(en.get('products.description') ?? '', /API/i)
  assert.doesNotMatch(rw.get('products.description') ?? '', /API|serivisi|seriveri/i)
  assert.doesNotMatch(en.get('dashboard.description') ?? '', /server/i)
  assert.doesNotMatch(rw.get('dashboard.description') ?? '', /seriveri/i)
})

test('approved user-facing dashboard and POS copy is present', () => {
  const en = extractShopMessages(read('lib/shop/i18n/messages/en.ts'))
  const rw = extractShopMessages(read('lib/shop/i18n/messages/rw.ts'))
  assert.equal(
    rw.get('dashboard.description'),
    'Incamake y’imikorere y’iduka ry’i Nyanza. Imibare ijyanye n’amakuru y’ubucuruzi.'
  )
  assert.equal(
    en.get('pos.cartHint'),
    'These are preview totals. The final total will be shown when the sale is confirmed.'
  )
  assert.equal(
    rw.get('pos.cartHint'),
    'Aya ni amakuru y’agateganyo. Igiteranyo cya nyuma kizagaragara umaze kwemeza igurisha.'
  )
  assert.match(en.get('pos.paymentNote') ?? '', /Stock is updated when the sale is confirmed/)
  assert.match(rw.get('pos.paymentNote') ?? '', /Ububiko buragabanuka igurisha rimaze kwemezwa/)
  assert.match(en.get('dashboard.section.salesTodayDesc') ?? '', /recorded shop transactions/)
  assert.match(rw.get('dashboard.metric.pending') ?? '', /Ubwishyu butegerejwe/)
  assert.match(en.get('products.description') ?? '', /shop system/)
  assert.match(rw.get('products.description') ?? '', /sisitemu y’iduka/)
  assert.equal(rw.get('pos.thankYou'), 'Murakoze guhahira muri Energy & Logics.')
  assert.doesNotMatch(rw.get('pos.thankYou') ?? '', /guhaha(?!hira)/)
  assert.equal(en.get('pos.reviewSale'), 'Review Sale')
  assert.equal(en.get('pos.confirmSale'), 'Confirm Cash Sale')
  assert.equal(rw.get('pos.reviewSale'), 'Suzuma igurisha')
  assert.equal(rw.get('pos.confirmSale'), 'Emeza igurisha ry’amafaranga')
  assert.equal(rw.get('pos.remove'), 'Kuramo')
})

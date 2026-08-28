/** Energy & Logics commercial identity — matches web `--brand-navy`. */
export const colors = {
  navy: '#1e3a5f',
  navyDark: '#152a45',
  amber: '#d97706',
  amberSoft: '#fff7ed',
  green: '#15803d',
  greenSoft: '#f0fdf4',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  ink: '#0f172a',
  slate: '#334155',
  muted: '#64748b',
  line: '#e2e8f0',
  bg: '#f4f6f8',
  card: '#ffffff',
  white: '#ffffff',
} as const

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const

/** Minimum practical touch target on Galaxy M31. */
export const hitSlop = 48

export const control = {
  height: 48,
  chipHeight: 44,
  radius: 12,
} as const

export const type = {
  kicker: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.amber,
    letterSpacing: 0.4,
  },
  screenTitle: { fontSize: 20, fontWeight: '700' as const, color: colors.navy },
  heading: { fontSize: 15, fontWeight: '600' as const, color: colors.navy },
  productName: { fontSize: 16, fontWeight: '600' as const, color: colors.ink, lineHeight: 21 },
  sku: { fontSize: 12, fontWeight: '400' as const, color: colors.muted },
  sellingUnit: { fontSize: 12, fontWeight: '500' as const, color: colors.slate },
  price: { fontSize: 18, fontWeight: '700' as const, color: colors.navy },
  lineTotal: { fontSize: 17, fontWeight: '700' as const, color: colors.navy },
  quantity: { fontSize: 17, fontWeight: '700' as const, color: colors.ink },
  total: { fontSize: 32, fontWeight: '700' as const, color: colors.navy, letterSpacing: -0.6 },
  dockTotal: { fontSize: 22, fontWeight: '700' as const, color: colors.white, letterSpacing: -0.3 },
  payment: { fontSize: 16, fontWeight: '700' as const, color: colors.navy },
  button: { fontSize: 16, fontWeight: '600' as const },
  meta: { fontSize: 13, fontWeight: '400' as const, color: colors.muted, lineHeight: 18 },
  status: { fontSize: 12, fontWeight: '600' as const },
  metric: { fontSize: 26, fontWeight: '700' as const, color: colors.navy, letterSpacing: -0.4 },
  orderRef: { fontSize: 16, fontWeight: '700' as const, color: colors.navy },
  staff: { fontSize: 13, fontWeight: '500' as const, color: colors.navy },
} as const

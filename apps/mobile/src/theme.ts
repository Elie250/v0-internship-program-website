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
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const

/** Minimum practical touch target on Galaxy M31. */
export const hitSlop = 48

export const type = {
  screenTitle: { fontSize: 22, fontWeight: '800' as const, color: colors.navy },
  heading: { fontSize: 16, fontWeight: '700' as const, color: colors.navy },
  productName: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  price: { fontSize: 16, fontWeight: '800' as const, color: colors.navy },
  total: { fontSize: 28, fontWeight: '800' as const, color: colors.navy, letterSpacing: -0.4 },
  button: { fontSize: 16, fontWeight: '600' as const },
  meta: { fontSize: 13, fontWeight: '500' as const, color: colors.muted },
  kicker: { fontSize: 12, fontWeight: '700' as const, color: colors.amber, letterSpacing: 0.3 },
} as const

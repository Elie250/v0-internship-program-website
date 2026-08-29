import type { TextStyle } from 'react-native'

/**
 * Energy & Logics Staff POS design tokens.
 * Semantic system — navy/amber are brand, not a dump of repeated colors.
 */

export const font = {
  regular: 'IBMPlexSans_400Regular',
  medium: 'IBMPlexSans_500Medium',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const

const tabular: NonNullable<TextStyle['fontVariant']> = ['tabular-nums']

export const colors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F4',
  surfaceElevated: '#FFFFFF',
  primary: '#1e3a5f',
  primaryPressed: '#152A45',
  primarySubtle: '#E8EEF4',
  accent: '#d97706',
  accentPressed: '#B45309',
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#4B5563',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#CBD5E1',
  border: '#E2E8F0',
  divider: '#E2E8F0',
  success: '#15803D',
  successSurface: '#F0FDF4',
  successSubtle: '#F0FDF4',
  successBorder: '#BBF7D0',
  warning: '#B45309',
  warningSurface: '#FFF7ED',
  warningSubtle: '#FFF7ED',
  warningBorder: '#FDE68A',
  danger: '#B91C1C',
  dangerPressed: '#991B1B',
  dangerSurface: '#FEF2F2',
  dangerSubtle: '#FEF2F2',
  dangerBorder: '#FECACA',
  scrim: 'rgba(15, 23, 42, 0.46)',
  info: '#1E3A5F',
  infoSurface: '#E8EEF4',
  disabledFill: '#E2E8F0',
  disabledText: '#6B7280',
  live: '#15803D',

  /** Aliases used by existing screens — map to semantic roles. */
  navy: '#1e3a5f',
  navyDark: '#152A45',
  amber: '#d97706',
  amberSoft: '#FFF7ED',
  green: '#15803D',
  greenSoft: '#F0FDF4',
  red: '#B91C1C',
  redSoft: '#FEF2F2',
  ink: '#0F172A',
  slate: '#334155',
  muted: '#4B5563',
  line: '#E2E8F0',
  bg: '#F4F6F8',
  card: '#FFFFFF',
  white: '#FFFFFF',
} as const

export const space = {
  xs: 4,
  sm: 8,
  s12: 12,
  md: 16,
  s20: 20,
  lg: 24,
  xl: 32,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  pill: 999,
} as const

export const elevation = {
  none: {},
  dock: {
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  sheet: {
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
} as const

/** Minimum practical touch target on Galaxy M31. */
export const hitSlop = 48

export const control = {
  height: 48,
  searchHeight: 52,
  chipHeight: 44,
  tabHeight: 56,
  productRow: 76,
  thumb: 48,
  radius: 10,
} as const

const face = (family: string, size: number, _weight: '400' | '500' | '600' | '700') => ({
  fontFamily: family,
  fontSize: size,
})

export const type = {
  kicker: {
    ...face(font.semibold, 12, '600'),
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  appTitle: {
    ...face(font.bold, 28, '700'),
    color: colors.primary,
    letterSpacing: -0.4,
  },
  screenTitle: {
    ...face(font.bold, 22, '700'),
    color: colors.textPrimary,
  },
  tillTitle: {
    ...face(font.bold, 20, '700'),
    color: colors.textPrimary,
  },
  confirmTitle: {
    ...face(font.semibold, 18, '600'),
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...face(font.semibold, 15, '600'),
    color: colors.textPrimary,
  },
  heading: {
    ...face(font.semibold, 15, '600'),
    color: colors.textPrimary,
  },
  body: {
    ...face(font.regular, 16, '400'),
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyMedium: {
    ...face(font.medium, 16, '500'),
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bodyStrong: {
    ...face(font.semibold, 16, '600'),
    color: colors.textPrimary,
  },
  helper: {
    ...face(font.regular, 13, '400'),
    color: colors.textMuted,
    lineHeight: 18,
  },
  error: {
    ...face(font.medium, 13, '500'),
    color: colors.danger,
    lineHeight: 18,
  },
  productName: {
    ...face(font.semibold, 16, '600'),
    color: colors.textPrimary,
    lineHeight: 21,
  },
  productMeta: {
    ...face(font.regular, 12, '400'),
    color: colors.textMuted,
  },
  sku: {
    ...face(font.regular, 12, '400'),
    color: colors.textMuted,
    fontVariant: tabular,
  },
  metadata: {
    ...face(font.regular, 12, '400'),
    color: colors.textMuted,
    fontVariant: tabular,
  },
  price: {
    ...face(font.bold, 16, '700'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
  priceLarge: {
    ...face(font.bold, 20, '700'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
  quantity: {
    ...face(font.bold, 17, '700'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
  total: {
    ...face(font.bold, 28, '700'),
    color: colors.textPrimary,
    letterSpacing: -0.4,
    fontVariant: tabular,
  },
  checkoutTotal: {
    ...face(font.bold, 28, '700'),
    color: colors.textPrimary,
    letterSpacing: -0.4,
    fontVariant: tabular,
  },
  dockTotal: {
    ...face(font.bold, 22, '700'),
    color: colors.textOnPrimary,
    letterSpacing: -0.3,
    fontVariant: tabular,
  },
  payment: {
    ...face(font.bold, 16, '700'),
    color: colors.textPrimary,
  },
  button: {
    ...face(font.semibold, 16, '600'),
  },
  buttonSmall: {
    ...face(font.semibold, 14, '600'),
  },
  tab: {
    ...face(font.semibold, 11, '600'),
  },
  badge: {
    ...face(font.semibold, 12, '600'),
  },
  metric: {
    ...face(font.bold, 26, '700'),
    color: colors.textPrimary,
    letterSpacing: -0.4,
    fontVariant: tabular,
  },
  orderRef: {
    ...face(font.semibold, 15, '600'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
  orderReference: {
    ...face(font.semibold, 15, '600'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
  staff: {
    ...face(font.medium, 13, '500'),
    color: colors.textSecondary,
  },
  status: {
    ...face(font.semibold, 12, '600'),
  },
  meta: {
    ...face(font.regular, 13, '400'),
    color: colors.textMuted,
    lineHeight: 18,
  },
  sellingUnit: {
    ...face(font.medium, 12, '500'),
    color: colors.textSecondary,
  },
  lineTotal: {
    ...face(font.bold, 17, '700'),
    color: colors.textPrimary,
    fontVariant: tabular,
  },
}

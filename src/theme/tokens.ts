/**
 * Design tokens for StreetShelf.
 *
 * Follows the 60/30/10 rule: a warm off-white canvas carries ~60 % of every
 * screen, deep green-black ink ~30 % (text, primary buttons), and a leaf-green
 * accent the last 10 % (CTAs, active states, the one thing to notice first).
 *
 * The three transaction modes each get their own hue so a card can be read
 * at a glance without reading the label: rose for GIFT, blue for LEND, amber
 * for RENT. They are used at full strength only on small marks (badge text,
 * icon) and as a tint for backgrounds — never as a fill behind body copy.
 *
 * Spacing is an 8-point grid (4 is the half step), type is four sizes and two
 * weights, and every interactive element clears 44 pt.
 */

const palette = {
  ink900: '#17201A',
  ink600: '#4A564D',
  ink400: '#7A857D',
  ink200: '#D9DDD9',

  canvas: '#F7F5F0',
  canvasAlt: '#EFECE5',
  surface: '#FFFFFF',
  line: '#E6E3DC',

  leaf700: '#1F5C39',
  leaf600: '#2E7D4F',
  leaf100: '#E3F0E7',

  rose600: '#C2417A',
  rose100: '#FBE8F0',
  blue600: '#2F6BB0',
  blue100: '#E6EEF8',
  amber700: '#9A6412',
  amber100: '#FBF0DC',

  red600: '#B3362B',
  red100: '#F8E7E4',
} as const;

export const colors = {
  canvas: palette.canvas,
  canvasAlt: palette.canvasAlt,
  surface: palette.surface,
  border: palette.line,

  text: palette.ink900,
  textMuted: palette.ink600,
  textSubtle: palette.ink400,
  textOnDark: palette.surface,
  disabled: palette.ink200,

  /** The 30 %: primary actions and the tab bar's active icon. */
  ink: palette.ink900,
  /** The 10 %: the accent. Used sparingly, so it keeps meaning "go". */
  accent: palette.leaf600,
  accentDark: palette.leaf700,
  accentTint: palette.leaf100,

  danger: palette.red600,
  dangerTint: palette.red100,

  /** Per-mode hues; see `modeColors` for the pairing. */
  gift: palette.rose600,
  giftTint: palette.rose100,
  lend: palette.blue600,
  lendTint: palette.blue100,
  rent: palette.amber700,
  rentTint: palette.amber100,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const touchTarget = {
  min: 44,
  /** The primary CTA that sits in the thumb zone. */
  primary: 56,
} as const;

export const type = {
  family: {
    regular: 'PlusJakartaSans_400Regular',
    bold: 'PlusJakartaSans_700Bold',
  },
  size: {
    sm: 13,
    md: 15,
    lg: 20,
    xl: 28,
  },
  lineHeight: {
    sm: 18,
    md: 22,
    lg: 26,
    xl: 34,
  },
} as const;

/** Soft, canvas-tinted shadow — never a grey drop on a warm background. */
export const shadow = {
  card: {
    shadowColor: palette.ink900,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: palette.ink900,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

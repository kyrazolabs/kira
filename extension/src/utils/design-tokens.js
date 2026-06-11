// Single source of truth for all DESIGN.md (Raycast dark-canvas) tokens.
// Used by: popup (CSS vars), options (CSS vars), content script (JS inline styles)

export const colors = {
  primary: '#ffffff',
  primaryPressed: '#e8e8e8',
  onPrimary: '#000000',
  ink: '#f4f4f6',
  body: '#cdcdcd',
  charcoal: '#d3d3d4',
  mute: '#9c9c9d',
  ash: '#6a6b6c',
  stone: '#434345',
  onDark: '#ffffff',
  onDarkMute: 'rgba(255,255,255,0.72)',
  canvas: '#07080a',
  surface: '#0d0d0d',
  surfaceElevated: '#101111',
  surfaceCard: '#121212',
  buttonFg: '#18191a',
  hairline: '#242728',
  hairlineSoft: 'rgba(255,255,255,0.08)',
  hairlineStrong: 'rgba(255,255,255,0.16)',
  accentBlue: '#57c1ff',
  accentBlueSoft: 'rgba(87,193,255,0.15)',
  accentRed: '#ff6161',
  accentRedSoft: 'rgba(255,97,97,0.15)',
  accentGreen: '#59d499',
  accentGreenSoft: 'rgba(89,212,153,0.15)',
  accentYellow: '#ffc533',
  accentYellowSoft: 'rgba(255,197,51,0.15)',
  heroStripeStart: '#ff5757',
  heroStripeEnd: '#a1131a',
  keyBgStart: '#121212',
  keyBgEnd: '#0d0d0d'
}

export const typography = {
  displayXl: { fontFamily: 'Inter', fontSize: '64px', fontWeight: 600, lineHeight: 1.1, letterSpacing: 0 },
  displayLg: { fontFamily: 'Inter', fontSize: '56px', fontWeight: 500, lineHeight: 1.17, letterSpacing: '0.2px' },
  headingXl: { fontFamily: 'Inter', fontSize: '24px', fontWeight: 500, lineHeight: 1.6, letterSpacing: '0.2px' },
  headingLg: { fontFamily: 'Inter', fontSize: '22px', fontWeight: 500, lineHeight: 1.15, letterSpacing: 0 },
  headingMd: { fontFamily: 'Inter', fontSize: '20px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.2px' },
  headingSm: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.2px' },
  bodyLg: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
  bodyMd: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
  bodyStrong: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.2px' },
  bodySm: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, lineHeight: 1.6, letterSpacing: 0 },
  bodySmStrong: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.6, letterSpacing: '0.2px' },
  captionMd: { fontFamily: 'Inter', fontSize: '13px', fontWeight: 400, lineHeight: 1.4, letterSpacing: '0.1px' },
  captionSm: { fontFamily: 'Inter', fontSize: '12px', fontWeight: 400, lineHeight: 1.5, letterSpacing: '0.4px' },
  linkMd: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 500, lineHeight: 1.4, letterSpacing: '0.3px' },
  buttonMd: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.6, letterSpacing: '0.2px' }
}

export const rounded = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '16px',
  full: '9999px'
}

export const spacing = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  section: '96px'
}

// Shared font-feature-settings string — the ss03 alternate 'g' is the brand signature
export const FONT_FEATURE_SETTINGS = '"calt", "kern", "liga", "ss03"'

// Build a CSS string of all color tokens as custom properties
export function buildCSSVariables() {
  return Object.entries(colors)
    .map(([key, value]) => `--color-${toKebabCase(key)}: ${value};`)
    .join('\n')
}

// Build a CSS string for typography classes
export function buildTypographyCSS() {
  return Object.entries(typography)
    .map(([key, t]) => {
      const selector = `.type-${toKebabCase(key)}`
      const ff = FONT_FEATURE_SETTINGS
      return `${selector} {
  font-family: ${t.fontFamily}, system-ui, sans-serif;
  font-size: ${t.fontSize};
  font-weight: ${t.fontWeight};
  line-height: ${t.lineHeight};
  letter-spacing: ${t.letterSpacing || '0'};
  font-feature-settings: ${ff};
}`
    })
    .join('\n')
}

// Convert js-style names to CSS var format: surfaceElevated → surface-elevated
function toKebabCase(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

// Build a complete inline style string for a given token set — used in content script injected UI
export function styleFromTokens(tokenMap) {
  return Object.entries(tokenMap)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${cssKey}: ${value}`
    })
    .join('; ')
}

// Pre-built inline style fragments for common component states
export const componentStyles = {
  // Primary button — the white CTA pill
  buttonPrimary: styleFromTokens({
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontFamily: typography.buttonMd.fontFamily,
    fontSize: typography.buttonMd.fontSize,
    fontWeight: String(typography.buttonMd.fontWeight),
    lineHeight: String(typography.buttonMd.lineHeight),
    letterSpacing: typography.buttonMd.letterSpacing,
    borderRadius: rounded.md,
    padding: '8px 16px',
    height: '36px',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFeatureSettings: FONT_FEATURE_SETTINGS,
    transition: 'background-color 150ms ease'
  }),

  // Surface card — dark elevated panel
  surfaceCard: styleFromTokens({
    backgroundColor: colors.surface,
    border: `1px solid ${colors.hairline}`,
    borderRadius: rounded.lg,
    padding: spacing.xl
  }),

  // Surface elevated
  surfaceElevated: styleFromTokens({
    backgroundColor: colors.surfaceElevated,
    border: `1px solid ${colors.hairline}`,
    borderRadius: rounded.md,
    padding: `${spacing.lg}`
  }),

  // Text on dark surfaces
  bodyText: styleFromTokens({
    fontFamily: typography.bodyMd.fontFamily,
    fontSize: typography.bodyMd.fontSize,
    fontWeight: String(typography.bodyMd.fontWeight),
    lineHeight: String(typography.bodyMd.lineHeight),
    color: colors.body,
    fontFeatureSettings: FONT_FEATURE_SETTINGS
  }),

  // Small caption
  captionText: styleFromTokens({
    fontFamily: typography.captionMd.fontFamily,
    fontSize: typography.captionMd.fontSize,
    fontWeight: String(typography.captionMd.fontWeight),
    lineHeight: String(typography.captionMd.lineHeight),
    letterSpacing: typography.captionMd.letterSpacing,
    color: colors.mute,
    fontFeatureSettings: FONT_FEATURE_SETTINGS
  })
}

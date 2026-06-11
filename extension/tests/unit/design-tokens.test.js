import {
  colors, typography, rounded, spacing,
  FONT_FEATURE_SETTINGS, buildCSSVariables, buildTypographyCSS,
  styleFromTokens, componentStyles
} from '../../src/utils/design-tokens.js'

describe('design-tokens', () => {
  describe('colors', () => {
    it('has the canvas-dark background', () => {
      expect(colors.canvas).toBe('#07080a')
    })
    it('has the white primary CTA', () => {
      expect(colors.primary).toBe('#ffffff')
    })
    it('has the hairline border', () => {
      expect(colors.hairline).toBe('#242728')
    })
    it('has the surface ladder', () => {
      expect(colors.surface).toBe('#0d0d0d')
      expect(colors.surfaceElevated).toBe('#101111')
      expect(colors.surfaceCard).toBe('#121212')
    })
    it('has all accent colors', () => {
      expect(colors.accentYellow).toBe('#ffc533')
      expect(colors.accentRed).toBe('#ff6161')
      expect(colors.accentGreen).toBe('#59d499')
      expect(colors.accentBlue).toBe('#57c1ff')
    })
  })

  describe('typography', () => {
    it('uses Inter as the primary family', () => {
      expect(typography.bodyMd.fontFamily).toBe('Inter')
      expect(typography.displayXl.fontFamily).toBe('Inter')
    })
    it('includes ss03 in font feature settings', () => {
      expect(FONT_FEATURE_SETTINGS).toContain('ss03')
    })
    it('bodyMd has correct values', () => {
      expect(typography.bodyMd.fontSize).toBe('16px')
      expect(typography.bodyMd.fontWeight).toBe(400)
      expect(typography.bodyMd.lineHeight).toBe(1.6)
    })
  })

  describe('rounded', () => {
    it('has the correct scale', () => {
      expect(rounded.md).toBe('8px')
      expect(rounded.lg).toBe('10px')
      expect(rounded.xs).toBe('4px')
    })
  })

  describe('spacing', () => {
    it('has the correct scale', () => {
      expect(spacing.md).toBe('12px')
      expect(spacing.lg).toBe('16px')
      expect(spacing.xl).toBe('24px')
      expect(spacing.section).toBe('96px')
    })
  })

  describe('buildCSSVariables', () => {
    it('produces valid CSS custom properties', () => {
      const css = buildCSSVariables()
      expect(css).toContain('--color-canvas: #07080a;')
      expect(css).toContain('--color-primary: #ffffff;')
      expect(css).toContain('--color-surface-elevated: #101111;')
    })
  })

  describe('buildTypographyCSS', () => {
    it('generates typography utility classes', () => {
      const css = buildTypographyCSS()
      expect(css).toContain('.type-body-md')
      expect(css).toContain('font-feature-settings:')
      expect(css).toContain('ss03')
    })
  })

  describe('styleFromTokens', () => {
    it('converts token map to inline style string', () => {
      const style = styleFromTokens({
        backgroundColor: '#0d0d0d',
        borderWidth: '1px'
      })
      expect(style).toContain('background-color: #0d0d0d')
      expect(style).toContain('border-width: 1px')
    })
  })

  describe('componentStyles', () => {
    it('buttonPrimary uses white background with black text', () => {
      expect(componentStyles.buttonPrimary).toContain('background-color: #ffffff')
      expect(componentStyles.buttonPrimary).toContain('color: #000000')
    })
    it('surfaceCard uses dark background with hairline border', () => {
      expect(componentStyles.surfaceCard).toContain('background-color: #0d0d0d')
      expect(componentStyles.surfaceCard).toContain('1px solid #242728')
    })
    it('body text styles include ss03 font feature', () => {
      expect(componentStyles.buttonPrimary).toContain('ss03')
      expect(componentStyles.bodyText).toContain('ss03')
      expect(componentStyles.captionText).toContain('ss03')
    })
  })
})

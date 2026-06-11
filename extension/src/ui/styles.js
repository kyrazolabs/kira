// Injected base styles — shared CSS for all injected UI components
// Uses DESIGN.md Raycast dark-canvas tokens

import { colors, typography, rounded, spacing, FONT_FEATURE_SETTINGS } from '../utils/design-tokens.js'

let styleEl = null

export function injectBaseStyles() {
  if (styleEl && styleEl.parentNode) return

  styleEl = document.createElement('style')
  styleEl.id = 'ce-base-styles'
  styleEl.textContent = `
    /* Content Enhancer — injected UI base styles */
    .ce-container *,
    .ce-container *::before,
    .ce-container *::after {
      box-sizing: border-box;
    }

    .ce-container {
      font-family: ${typography.bodyMd.fontFamily}, system-ui, sans-serif;
      font-size: ${typography.bodyMd.fontSize};
      font-weight: ${typography.bodyMd.fontWeight};
      line-height: ${typography.bodyMd.lineHeight};
      font-feature-settings: ${FONT_FEATURE_SETTINGS};
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .ce-surface {
      background-color: ${colors.surface};
      border: 1px solid ${colors.hairline};
      border-radius: ${rounded.lg};
      box-shadow: none;
    }

    .ce-surface-elevated {
      background-color: ${colors.surfaceElevated};
      border: 1px solid ${colors.hairline};
      border-radius: ${rounded.md};
    }

    .ce-button-primary {
      background-color: ${colors.primary};
      color: ${colors.onPrimary};
      font-family: ${typography.buttonMd.fontFamily}, system-ui, sans-serif;
      font-size: ${typography.buttonMd.fontSize};
      font-weight: ${typography.buttonMd.fontWeight};
      line-height: ${typography.buttonMd.lineHeight};
      letter-spacing: ${typography.buttonMd.letterSpacing};
      font-feature-settings: ${FONT_FEATURE_SETTINGS};
      border: none;
      border-radius: ${rounded.md};
      padding: 8px 16px;
      height: 36px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background-color 150ms ease;
      white-space: nowrap;
    }

    .ce-button-primary:hover {
      background-color: ${colors.primaryPressed};
    }

    .ce-button-secondary {
      background-color: transparent;
      color: ${colors.onDark};
      font-family: ${typography.buttonMd.fontFamily}, system-ui, sans-serif;
      font-size: ${typography.buttonMd.fontSize};
      font-weight: ${typography.buttonMd.fontWeight};
      line-height: ${typography.buttonMd.lineHeight};
      letter-spacing: ${typography.buttonMd.letterSpacing};
      font-feature-settings: ${FONT_FEATURE_SETTINGS};
      border: 1px solid ${colors.hairline};
      border-radius: ${rounded.md};
      padding: 8px 16px;
      height: 36px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background-color 150ms ease;
      white-space: nowrap;
    }

    .ce-button-secondary:hover {
      background-color: ${colors.surfaceCard};
    }

    .ce-button-tertiary {
      background-color: ${colors.surfaceElevated};
      color: ${colors.onDark};
      font-family: ${typography.buttonMd.fontFamily}, system-ui, sans-serif;
      font-size: ${typography.buttonMd.fontSize};
      font-weight: ${typography.buttonMd.fontWeight};
      line-height: ${typography.buttonMd.lineHeight};
      font-feature-settings: ${FONT_FEATURE_SETTINGS};
      border: 1px solid ${colors.hairline};
      border-radius: ${rounded.md};
      padding: 6px 12px;
      height: 32px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background-color 150ms ease;
      white-space: nowrap;
    }

    .ce-button-tertiary:hover {
      background-color: ${colors.surfaceCard};
    }

    .ce-text-body {
      color: ${colors.body};
      font-size: ${typography.bodyMd.fontSize};
      line-height: ${typography.bodyMd.lineHeight};
    }

    .ce-text-caption {
      color: ${colors.mute};
      font-size: ${typography.captionMd.fontSize};
      line-height: ${typography.captionMd.lineHeight};
      letter-spacing: ${typography.captionMd.letterSpacing};
    }

    .ce-text-on-dark {
      color: ${colors.onDark};
    }

    .ce-text-on-dark-mute {
      color: ${colors.onDarkMute};
    }

    .ce-keycap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, ${colors.keyBgStart}, ${colors.keyBgEnd});
      color: ${colors.body};
      font-size: ${typography.captionMd.fontSize};
      font-weight: ${typography.captionMd.fontWeight};
      line-height: 1;
      padding: 1px 6px;
      height: 20px;
      border-radius: ${rounded.xs};
      border: 1px solid ${colors.hairlineSoft};
    }

    .ce-divider {
      border: none;
      border-top: 1px solid ${colors.hairline};
      margin: ${spacing.sm} 0;
    }

    /* Toast animations */
    @keyframes ce-slide-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes ce-slide-out {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(8px); opacity: 0; }
    }

    /* Diff view animations */
    @keyframes ce-fade-in {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `

  document.head.appendChild(styleEl)
}

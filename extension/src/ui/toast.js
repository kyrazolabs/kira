// Toast notification system — non-intrusive, auto-dismissing
// DESIGN.md: surfaceElevated bg, hairline border, no shadows

import { colors, typography, rounded, spacing, FONT_FEATURE_SETTINGS } from '../utils/design-tokens.js'

let toastContainer = null
let hideTimeout = null

export function showToast(message, type = 'success') {
  ensureContainer()

  // Clear any existing toast
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  while (toastContainer.firstChild) {
    toastContainer.firstChild.remove()
  }

  const toast = document.createElement('div')
  toast.className = 'ce-container'

  const icon = {
    success: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>',
    error:   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    info:    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  }[type] || '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>'

  const accentColor = {
    success: colors.accentGreen,
    error: colors.accentRed,
    info: colors.accentBlue
  }[type] || colors.accentBlue

  const softAccent = {
    success: colors.accentGreenSoft,
    error: colors.accentRedSoft,
    info: colors.accentBlueSoft
  }[type] || colors.accentBlueSoft

  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${spacing.sm};
    padding: ${spacing.sm} ${spacing.md};
    background-color: ${colors.surfaceElevated};
    border: 1px solid ${colors.hairline};
    border-radius: ${rounded.md};
    color: ${colors.body};
    font-size: ${typography.bodySm.fontSize};
    font-weight: ${typography.bodySm.fontWeight};
    line-height: ${typography.bodySm.lineHeight};
    font-feature-settings: ${FONT_FEATURE_SETTINGS};
    font-family: ${typography.bodySm.fontFamily}, system-ui, sans-serif;
    max-width: 360px;
    animation: ce-slide-in 200ms ease;
    box-shadow: none;
    pointer-events: auto;
  `

  // Icon
  const iconEl = document.createElement('span')
  iconEl.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: ${rounded.xs};
    background-color: ${softAccent};
    color: ${accentColor};
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    flex-shrink: 0;
  `
  iconEl.innerHTML = icon

  // Message
  const msgEl = document.createElement('span')
  msgEl.textContent = message

  toast.appendChild(iconEl)
  toast.appendChild(msgEl)

  toastContainer.appendChild(toast)

  // Auto-dismiss after 3 seconds
  hideTimeout = setTimeout(() => {
    toast.style.animation = 'ce-slide-out 150ms ease forwards'
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast)
    }, 150)
  }, 3000)
}

function ensureContainer() {
  if (toastContainer && toastContainer.parentNode) return

  toastContainer = document.createElement('div')
  toastContainer.id = 'ce-toast-container'
  toastContainer.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  `

  document.body.appendChild(toastContainer)
}

// Clean up — called if content script is re-injected
export function removeToast() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  if (toastContainer && toastContainer.parentNode) {
    toastContainer.parentNode.removeChild(toastContainer)
  }
  toastContainer = null
}

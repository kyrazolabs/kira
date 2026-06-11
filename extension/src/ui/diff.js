// Diff panel — shows original vs enhanced text side-by-side
// Actions: Accept, Retry, Keep Original, Copy

import { colors, typography, rounded, spacing, FONT_FEATURE_SETTINGS } from '../utils/design-tokens.js'

let panelEl = null
let overlayEl = null

export function showDiffPanel({ original, enhanced, onAccept, onRetry, onKeep, onCopy }) {
  hideDiffPanel()

  // Semi-transparent overlay to catch clicks outside
  overlayEl = document.createElement('div')
  overlayEl.className = 'ce-container'
  overlayEl.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background-color: rgba(0,0,0,0.6);
    animation: ce-fade-in 150ms ease;
  `
  overlayEl.addEventListener('click', () => {
    onKeep()
  })

  // Main diff panel
  panelEl = document.createElement('div')
  panelEl.className = 'ce-container'
  panelEl.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    max-height: 60vh;
    background-color: ${colors.surface};
    border-top: 1px solid ${colors.hairline};
    border-radius: ${rounded.xl} ${rounded.xl} 0 0;
    padding: ${spacing.xl} ${spacing.xl} ${spacing.lg};
    display: flex;
    flex-direction: column;
    animation: ce-fade-in 200ms ease;
    box-shadow: none;
  `

  // Header
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${spacing.lg};
    flex-shrink: 0;
  `

  const title = document.createElement('span')
  title.style.cssText = `
    color: ${colors.onDark};
    font-size: ${typography.headingSm.fontSize};
    font-weight: ${typography.headingSm.fontWeight};
    line-height: ${typography.headingSm.lineHeight};
    letter-spacing: ${typography.headingSm.letterSpacing};
    font-feature-settings: ${FONT_FEATURE_SETTINGS};
    font-family: ${typography.headingSm.fontFamily}, system-ui, sans-serif;
  `
  title.textContent = 'Review Enhancement'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'ce-button-tertiary'
  closeBtn.textContent = '×'
  closeBtn.style.cssText = `
    width: 32px;
    height: 32px;
    font-size: 18px;
  `
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onKeep()
  })

  header.appendChild(title)
  header.appendChild(closeBtn)

  // Side-by-side columns
  const columns = document.createElement('div')
  columns.style.cssText = `
    display: flex;
    gap: ${spacing.lg};
    flex: 1;
    min-height: 0;
    overflow: hidden;
  `

  // Original column
  const originalCol = createTextColumn('Original', original, 'mute')
  // Enhanced column
  const enhancedCol = createTextColumn('Enhanced', enhanced, 'onDark')

  // Add sparkle icon to enhanced header
  const enhancedHeader = enhancedCol.querySelector('[data-col-header]')
  if (enhancedHeader) {
    const sparkle = document.createElement('span')
    sparkle.textContent = ' ✨'
    sparkle.style.fontSize = '14px'
    enhancedHeader.appendChild(sparkle)
  }

  columns.appendChild(originalCol)
  columns.appendChild(enhancedCol)

  // Action buttons
  const actions = document.createElement('div')
  actions.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${spacing.sm};
    margin-top: ${spacing.lg};
    padding-top: ${spacing.md};
    border-top: 1px solid ${colors.hairline};
    flex-shrink: 0;
  `

  const acceptBtn = document.createElement('button')
  acceptBtn.className = 'ce-button-primary'
  acceptBtn.textContent = '✓ Accept Enhanced'
  acceptBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onAccept()
  })

  const retryBtn = document.createElement('button')
  retryBtn.className = 'ce-button-tertiary'
  retryBtn.textContent = '🔄 Try Again'
  retryBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onRetry()
  })

  const keepBtn = document.createElement('button')
  keepBtn.className = 'ce-button-tertiary'
  keepBtn.textContent = '✗ Keep Original'
  keepBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onKeep()
  })

  const copyBtn = document.createElement('button')
  copyBtn.className = 'ce-button-tertiary'
  copyBtn.textContent = '📋 Copy'
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onCopy()
  })

  actions.appendChild(acceptBtn)
  actions.appendChild(retryBtn)
  actions.appendChild(keepBtn)
  actions.appendChild(copyBtn)

  // Keyboard shortcut hint
  const shortcutHint = document.createElement('span')
  shortcutHint.className = 'ce-text-caption'
  shortcutHint.style.marginLeft = 'auto'
  shortcutHint.textContent = 'Press Esc to dismiss'
  actions.appendChild(shortcutHint)

  panelEl.appendChild(header)
  panelEl.appendChild(columns)
  panelEl.appendChild(actions)

  // Keyboard handling
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onKeep()
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onAccept()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  panelEl._cleanup = () => {
    document.removeEventListener('keydown', handleKeyDown)
  }

  document.body.appendChild(overlayEl)
  document.body.appendChild(panelEl)
}

export function hideDiffPanel() {
  if (panelEl) {
    if (panelEl._cleanup) panelEl._cleanup()
    if (panelEl.parentNode) panelEl.parentNode.removeChild(panelEl)
    panelEl = null
  }
  if (overlayEl) {
    if (overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl)
    overlayEl = null
  }
}

function createTextColumn(label, text, textColorKey) {
  const col = document.createElement('div')
  col.style.cssText = `
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  `

  const header = document.createElement('div')
  header.setAttribute('data-col-header', '')
  header.className = 'ce-text-caption'
  header.style.cssText = `
    margin-bottom: ${spacing.sm};
    flex-shrink: 0;
  `
  header.textContent = label

  const textArea = document.createElement('div')
  textArea.style.cssText = `
    flex: 1;
    min-height: 100px;
    max-height: 40vh;
    overflow-y: auto;
    background-color: ${colors.surfaceElevated};
    border: 1px solid ${colors.hairline};
    border-radius: ${rounded.md};
    padding: ${spacing.md};
    color: ${textColorKey === 'onDark' ? colors.body : colors.mute};
    font-size: ${typography.bodySm.fontSize};
    line-height: ${typography.bodySm.lineHeight};
    font-feature-settings: ${FONT_FEATURE_SETTINGS};
    font-family: ${typography.bodySm.fontFamily}, system-ui, sans-serif;
    white-space: pre-wrap;
    word-break: break-word;
    scrollbar-width: thin;
    scrollbar-color: ${colors.hairline} transparent;
  `
  textArea.textContent = text

  // Word/character count
  const count = document.createElement('div')
  count.className = 'ce-text-caption'
  count.style.cssText = `
    margin-top: ${spacing.xs};
    text-align: right;
  `
  count.textContent = `${text.length} characters`

  col.appendChild(header)
  col.appendChild(textArea)
  col.appendChild(count)

  return col
}

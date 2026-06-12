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
  closeBtn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>`
  closeBtn.style.cssText = `
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    enhancedHeader.innerHTML += ' <svg width="14" height="14" viewBox="0 0 24 24" style="vertical-align:-2px"><path d="M0 0h24v24H0z" fill="none"/><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M3 12c6.268 0 9-2.637 9-9c0 6.363 2.713 9 9 9c-6.287 0-9 2.713-9 9c0-6.287-2.732-9-9-9Z"/></svg>'
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
  acceptBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M5 13l4 4L19 7"/></svg> Accept Enhanced`
  acceptBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onAccept()
  })

  const retryBtn = document.createElement('button')
  retryBtn.className = 'ce-button-tertiary'
  retryBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg> Try Again`
  retryBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onRetry()
  })

  const keepBtn = document.createElement('button')
  keepBtn.className = 'ce-button-tertiary'
  keepBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><path d="M18 6L6 18M6 6l12 12"/></svg> Keep Original`
  keepBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    onKeep()
  })

  const copyBtn = document.createElement('button')
  copyBtn.className = 'ce-button-tertiary'
  copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`
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

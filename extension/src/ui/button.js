// Floating sparkle enhance button — injected near active text inputs

import { colors, rounded } from '../utils/design-tokens.js'
import { getCursorPosition } from '../utils/dom.js'

let buttonEl = null

export function injectButton(input, onEnhance) {

  buttonEl = document.createElement('div')
  buttonEl.id = 'ce-enhance-button'
  buttonEl.className = 'ce-container'
  buttonEl.setAttribute('role', 'button')
  buttonEl.setAttribute('tabindex', '0')
  buttonEl.setAttribute('aria-label', 'Enhance text (Ctrl+Shift+E)')

  buttonEl.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: ${colors.surfaceElevated};
    border: 1px solid ${colors.hairline};
    border-radius: ${rounded.md};
    cursor: pointer;
    transition: background-color 150ms ease, transform 100ms ease;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    margin: 0;
  `

  buttonEl.innerHTML = `<span style="pointer-events: none;">&#x2728;</span>`

  buttonEl.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onEnhance()
  })

  buttonEl.addEventListener('mouseenter', () => {
    buttonEl.style.backgroundColor = colors.surfaceCard
  })

  buttonEl.addEventListener('mouseleave', () => {
    buttonEl.style.backgroundColor = colors.surfaceElevated
  })

  buttonEl.addEventListener('mousedown', () => {
    buttonEl.style.transform = 'scale(0.95)'
  })

  buttonEl.addEventListener('mouseup', () => {
    buttonEl.style.transform = 'scale(1)'
  })

  // Keyboard accessibility
  buttonEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEnhance()
    }
  })

  document.body.appendChild(buttonEl)
  positionButton(input)

  // Reposition on scroll and input
  document.addEventListener('scroll', updatePosition, true)
  input.addEventListener('input', () => positionButton(input))
}

export function removeButton() {
  if (buttonEl && buttonEl.parentNode) {
    buttonEl.parentNode.removeChild(buttonEl)
  }
  buttonEl = null
  document.removeEventListener('scroll', updatePosition, true)
}

function updatePosition() {
  if (!buttonEl) return
  // Find the currently active input
  const active = document.activeElement
  if (active && (active.isContentEditable || active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    positionButton(active)
  }
}

function positionButton(input) {
  if (!buttonEl || !input) return

  const rect = input.getBoundingClientRect()
  const position = getCursorPosition(input)

  // Position at the top-right corner of the input, slightly inset
  const top = Math.max(rect.top + 8, position.top - 28)
  const left = Math.min(rect.right - 44, position.left + 4)

  // Keep within viewport
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const finalLeft = Math.max(8, Math.min(left, viewportW - 44))
  const finalTop = Math.max(8, Math.min(top, viewportH - 44))

  buttonEl.style.top = `${finalTop}px`
  buttonEl.style.left = `${finalLeft}px`
}

export function setupKeyboardShortcut(callback) {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+E or Cmd+Shift+E
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      // Don't trigger if user is in the extension's own UI
      if (e.target.closest('.ce-container')) return

      e.preventDefault()
      callback()
    }
  })
}

// Floating sparkle enhance button — injected near active text inputs

import { colors, rounded } from '../utils/design-tokens.js'
import { getCursorPosition } from '../utils/dom.js'

let buttonEl = null

export function injectButton(input, onEnhance) {
  removeButton()

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
    gap: 6px;
    height: 36px;
    width: 36px;
    min-width: 36px;
    background-color: ${colors.surfaceElevated};
    border: 1px solid ${colors.hairline};
    border-radius: ${rounded.md};
    cursor: pointer;
    transition: width 180ms ease, background-color 150ms ease, transform 100ms ease, padding 180ms ease;
    font-family: Inter, system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    color: ${colors.onDark};
    padding: 0;
    margin: 0;
    overflow: hidden;
    white-space: nowrap;
    box-sizing: border-box;
  `

  buttonEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0;pointer-events:none;color:${colors.accentYellow};position:relative;z-index:1;">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M3 12c6.268 0 9-2.637 9-9c0 6.363 2.713 9 9 9c-6.287 0-9 2.713-9 9c0-6.287-2.732-9-9-9Z"/>
    </svg>
    <span class="ce-btn-label" style="pointer-events:none;white-space:nowrap;">Enhance</span>
  `

  const textSpan = buttonEl.querySelector('.ce-btn-label')
  textSpan.style.cssText = 'pointer-events:none;white-space:nowrap;opacity:0;width:0;overflow:hidden;transition:opacity 150ms ease,width 150ms ease;'

  buttonEl.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onEnhance()
  })

  buttonEl.addEventListener('mouseenter', () => {
    buttonEl.style.backgroundColor = colors.surfaceCard
    buttonEl.style.width = 'auto'
    buttonEl.style.padding = '0 12px 0 10px'
    textSpan.style.opacity = '1'
    textSpan.style.width = 'auto'
  })

  buttonEl.addEventListener('mouseleave', () => {
    buttonEl.style.backgroundColor = colors.surfaceElevated
    buttonEl.style.width = '36px'
    buttonEl.style.padding = '0'
    textSpan.style.opacity = '0'
    textSpan.style.width = '0'
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
    buttonEl.style.opacity = '0'
    buttonEl.style.transform = 'scale(0.9)'
    buttonEl.style.transition = 'opacity 150ms ease, transform 150ms ease'
    setTimeout(() => {
      if (buttonEl && buttonEl.parentNode) {
        buttonEl.parentNode.removeChild(buttonEl)
      }
      buttonEl = null
    }, 150)
  } else {
    buttonEl = null
  }
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

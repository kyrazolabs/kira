// Floating sparkle enhance button — injected near active text inputs

import { colors, rounded } from '../utils/design-tokens.js'
import { getCursorPosition } from '../utils/dom.js'

let buttonEl = null

const BTN_SIZE = 36
const BTN_GAP = 10

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
    display: inline-flex;
    align-items: center;
    height: ${BTN_SIZE}px;
    min-width: ${BTN_SIZE}px;
    width: ${BTN_SIZE}px;
    background-color: ${colors.surfaceElevated};
    border: 1px solid ${colors.hairline};
    border-radius: ${rounded.md};
    cursor: pointer;
    user-select: none;
    font-family: Inter, system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    color: ${colors.onDark};
    padding: 0;
    margin: 0;
    white-space: nowrap;
    box-sizing: border-box;
    transition: width 180ms ease, border-radius 180ms ease, background-color 150ms ease, opacity 200ms ease, padding 180ms ease;
  `

  buttonEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0;pointer-events:none;margin:0 auto;color:${colors.accentYellow};">
      <path d="M0 0h24v24H0z" fill="none"/>
      <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M3 12c6.268 0 9-2.637 9-9c0 6.363 2.713 9 9 9c-6.287 0-9 2.713-9 9c0-6.287-2.732-9-9-9Z"/>
    </svg>
    <span class="ce-btn-label" style="display:inline-block;overflow:hidden;white-space:nowrap;max-width:0;opacity:0;transition:max-width 180ms ease,opacity 150ms ease,margin 180ms ease;">Enhance</span>
  `

  const iconSvg = buttonEl.querySelector('svg')
  const textSpan = buttonEl.querySelector('.ce-btn-label')

  // Click
  buttonEl.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onEnhance()
  })

  // Hover expand
  buttonEl.addEventListener('mouseenter', () => {
    buttonEl.style.backgroundColor = colors.surfaceCard
    buttonEl.style.width = 'auto'
    buttonEl.style.borderRadius = '20px'
    buttonEl.style.padding = '0 14px'
    iconSvg.style.margin = '0'
    textSpan.style.maxWidth = '70px'
    textSpan.style.opacity = '1'
    textSpan.style.marginLeft = '6px'
  })

  buttonEl.addEventListener('mouseleave', () => {
    buttonEl.style.backgroundColor = colors.surfaceElevated
    buttonEl.style.width = BTN_SIZE + 'px'
    buttonEl.style.borderRadius = rounded.md
    buttonEl.style.padding = '0'
    iconSvg.style.margin = '0 auto'
    textSpan.style.maxWidth = '0'
    textSpan.style.opacity = '0'
    textSpan.style.marginLeft = '0'
  })

  // Keyboard
  buttonEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onEnhance()
    }
  })

  document.body.appendChild(buttonEl)
  positionButton(input)

  document.addEventListener('scroll', updatePosition, true)
  input.addEventListener('input', () => positionButton(input))
}

export function removeButton() {
  if (buttonEl && buttonEl.parentNode) {
    buttonEl.style.opacity = '0'
    buttonEl.style.transition = 'opacity 150ms ease'
    const el = buttonEl
    buttonEl = null
    document.removeEventListener('scroll', updatePosition, true)
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 150)
  } else {
    buttonEl = null
    document.removeEventListener('scroll', updatePosition, true)
  }
}

function updatePosition() {
  if (!buttonEl) return
  const active = document.activeElement
  if (active && (active.isContentEditable || active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
    positionButton(active)
  }
}

function positionButton(input) {
  if (!buttonEl || !input) return

  const caret = getCaretScreenPosition(input)
  const viewW = window.innerWidth
  const viewH = window.innerHeight

  let left = caret.left + BTN_GAP
  let top = caret.top - BTN_SIZE / 2

  if (left + BTN_SIZE > viewW - 8) {
    left = caret.left - BTN_SIZE - BTN_GAP
  }

  left = Math.max(8, Math.min(left, viewW - BTN_SIZE - 8))
  top = Math.max(8, Math.min(top, viewH - BTN_SIZE - 8))

  buttonEl.style.top = top + 'px'
  buttonEl.style.left = left + 'px'
}

function getCaretScreenPosition(input) {
  // Prefer actual caret/selection position
  if (input.isContentEditable) {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0).cloneRange()
      range.collapse(false)
      const rect = range.getBoundingClientRect()
      if (rect.top !== 0 || rect.left !== 0) {
        return { left: rect.right, top: rect.top + rect.height / 2 }
      }
    }
  }

  if (input.selectionStart !== undefined) {
    // Create a mirror to measure text position
    const mirror = document.createElement('div')
    const style = window.getComputedStyle(input)
    mirror.style.cssText = `
      position:fixed;visibility:hidden;white-space:pre-wrap;word-wrap:break-word;
      font:${style.font};letter-spacing:${style.letterSpacing};
      width:${input.clientWidth}px;padding:${style.padding};line-height:${style.lineHeight};
    `
    const textBefore = input.value.substring(0, input.selectionEnd ?? input.value.length)
    // Detect RTL
    const isRTL = style.direction === 'rtl'
    mirror.textContent = isRTL ? textBefore : textBefore
    document.body.appendChild(mirror)
    const mirrorRect = mirror.getBoundingClientRect()
    document.body.removeChild(mirror)

    const inputRect = input.getBoundingClientRect()
    const lineHeight = parseFloat(style.lineHeight) || 20

    // Count newlines before cursor
    const linesBefore = (textBefore.match(/\n/g) || []).length
    const lastLineText = textBefore.split('\n').pop() || ''

    // Approximate x position of caret
    const charWidth = 8 // rough average
    const caretX = inputRect.left + parseFloat(style.paddingLeft || '0') + lastLineText.length * charWidth

    return {
      left: isRTL ? inputRect.right - (lastLineText.length * charWidth) - parseFloat(style.paddingRight || '0') : Math.min(caretX, inputRect.right - 8),
      top: inputRect.top + parseFloat(style.paddingTop || '0') + linesBefore * lineHeight + lineHeight / 2
    }
  }

  // Fallback: center-right of input
  const rect = input.getBoundingClientRect()
  return { left: rect.right - 40, top: rect.top + rect.height / 2 }
}

export function setupKeyboardShortcut(callback) {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
      if (e.target.closest('.ce-container')) return
      e.preventDefault()
      callback()
    }
  })
}

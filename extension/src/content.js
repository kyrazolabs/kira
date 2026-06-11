// Content script — injected into every page
// Orchestrates: platform detection → UI injection → user interaction → message passing

import { detectPlatform } from './lib/platforms.js'
import { getActivePlatform, findActiveInput, getInputText, setInputText } from './utils/dom.js'
import { injectButton, removeButton, setupKeyboardShortcut } from './ui/button.js'
import { showDiffPanel, hideDiffPanel } from './ui/diff.js'
import { showToast } from './ui/toast.js'
import { injectBaseStyles } from './ui/styles.js'

const STATE = {
  platform: null,
  activeInput: null,
  isEnhancing: false,
  lastEnhancedText: null,
  originalText: null
}

function isExtensionAlive() {
  return !!(chrome.runtime && chrome.runtime.id)
}

async function safeSendMessage(msg) {
  if (!isExtensionAlive()) {
    throw new Error('Extension reloaded — please refresh the page')
  }
  return chrome.runtime.sendMessage(msg)
}

// Initialize when the page loads
function init() {
  try {
    STATE.platform = getActivePlatform()
    injectBaseStyles()
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    setupKeyboardShortcut(handleEnhance)

    setTimeout(() => {
      const active = findActiveInput()
      if (active) onFocusIn({ target: active })
    }, 1000)
  } catch (e) {
    // Extension context may be invalid — ignore
  }
}

function onFocusIn(event) {
  const target = event.target
  if (!target) return

  // Check if focused element is a text input on our platform
  const platform = detectPlatform(new URL(window.location.href))
  const isTextInput = isPlatformInput(target, platform)

  if (isTextInput) {
    STATE.activeInput = target
    injectButton(target, handleEnhance)
  }
}

function onFocusOut(_event) {
  setTimeout(() => {
    const active = document.activeElement
    if (!active || !isPlatformInput(active, STATE.platform)) {
      removeButton()
      STATE.activeInput = null
    }
  }, 150)
}

function isPlatformInput(el, platform) {
  if (!el) return false

  const selectors = platform.inputSelector.split(', ').map(s => s.trim())
  for (const selector of selectors) {
    try {
      if (el.matches(selector)) return true
    } catch { /* invalid selector */ }
  }

  // Generic fallback
  if (el.isContentEditable) return true
  if (el.tagName === 'TEXTAREA') return true
  if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) return true

  return false
}

async function handleEnhance() {
  if (STATE.isEnhancing) return

  const input = STATE.activeInput
  if (!input) {
    showToast('Click into a text field first', 'info')
    return
  }

  const text = getInputText(input)
  if (!text || !text.trim()) {
    showToast('Type something first', 'info')
    return
  }

  STATE.originalText = text
  STATE.isEnhancing = true

  showToast('Enhancing...', 'info')

  try {
    // Get current tone from storage (via message)
    const settings = await safeSendMessage({ type: 'GET_SETTINGS' })
    const tone = settings.tone || 'casual'

    // Send to background for enhancement
    const response = await safeSendMessage({
      type: 'ENHANCE_TEXT',
      payload: {
        text,
        platform: STATE.platform.key,
        tone
      }
    })

    STATE.isEnhancing = false

    if (response.success) {
      STATE.lastEnhancedText = response.enhancedText

      showDiffPanel({
        original: text,
        enhanced: response.enhancedText,
        input,
        onAccept: () => {
          setInputText(input, response.enhancedText)
          hideDiffPanel()
          showToast('Enhanced!')
        },
        onRetry: () => {
          hideDiffPanel()
          handleEnhance()
        },
        onKeep: () => {
          hideDiffPanel()
          showToast('Kept original', 'info')
        },
        onCopy: async () => {
          await navigator.clipboard.writeText(response.enhancedText)
          showToast('Copied to clipboard')
        }
      })
    } else {
      showToast(response.error || 'Enhancement failed', 'error')
    }
  } catch (error) {
    STATE.isEnhancing = false
    showToast('Connection error. Reload the page and try again.', 'error')
    console.error('Enhance error:', error)
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// DOM helpers for finding and interacting with text inputs across platforms

import { detectPlatform } from '../lib/platforms.js'

export function getActivePlatform() {
  return detectPlatform(new URL(window.location.href))
}

export function findActiveInput() {
  const platform = getActivePlatform()
  const selector = platform.inputSelector

  // Try to find the currently focused element first
  const active = document.activeElement
  if (active && matchesPlatform(active, platform)) {
    return active
  }

  // Fall back to the first matching candidate
  const candidates = document.querySelectorAll(selector)
  for (const el of candidates) {
    if (isVisible(el)) return el
  }

  return null
}

function matchesPlatform(el, platform) {
  if (!el) return false

  // Check if the element matches any of the platform's selectors
  const selectors = platform.inputSelector.split(', ').map(s => s.trim())
  for (const selector of selectors) {
    try {
      if (el.matches(selector)) return true
    } catch {
      // Invalid selector, skip
    }
  }

  // Generic fallback for any contenteditable or textarea
  if (el.isContentEditable) return true
  if (el.tagName === 'TEXTAREA') return true
  if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) return true

  return false
}

function isVisible(el) {
  if (!el) return false
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
}

export function getInputText(input) {
  if (!input) return ''

  if (input.isContentEditable) {
    return input.textContent || ''
  }

  if (input.value !== undefined) {
    return input.value
  }

  return ''
}

export function setInputText(input, text) {
  if (!input) return

  if (input.isContentEditable) {
    input.textContent = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }

  // Use native value setter to trigger React/Angular controlled input updates
  const nativeSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input), 'value'
  )
  if (nativeSetter?.set) {
    nativeSetter.set.call(input, text)
  } else {
    input.value = text
  }

  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

export function getCursorPosition(input) {
  if (!input) return { top: 0, left: 0, bottom: 0, right: 0 }

  // For textarea and input elements
  if (input.selectionStart !== undefined) {
    const rect = input.getBoundingClientRect()
    // Approximate: position after last character
    const textBefore = input.value.substring(0, input.selectionEnd || input.value.length)
    const lines = textBefore.split('\n')
    const lineHeight = parseFloat(window.getComputedStyle(input).lineHeight) || 20

    return {
      top: rect.top + lines.length * lineHeight,
      left: rect.left + (lines[lines.length - 1].length * 8), // Approximate char width
      bottom: rect.bottom,
      right: rect.right
    }
  }

  // For contenteditable
  if (input.isContentEditable) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      return {
        top: rect.bottom + 4,
        left: rect.right + 4,
        bottom: rect.bottom + 4,
        right: rect.right + 4
      }
    }
  }

  const rect = input.getBoundingClientRect()
  return { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right }
}

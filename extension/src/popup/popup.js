// Popup UI script — tone selector, paste-to-enhance, usage display, platform detection

const elements = {}

function $(id) {
  if (!elements[id]) elements[id] = document.getElementById(id)
  return elements[id]
}

async function init() {
  // Get active tab's URL to detect platform
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const platform = detectPlatformFromUrl(tab?.url || '')

  // Get settings and usage from background
  const [settings, usage, licenseStatus] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
    chrome.runtime.sendMessage({ type: 'GET_USAGE' }),
    chrome.runtime.sendMessage({ type: 'GET_LICENSE_STATUS' })
  ])

  renderPlatform(platform)
  renderUsage(usage)
  renderTone(settings.tone)
  renderLicenseTier(licenseStatus)

  // Wire up events
  $('tone-select').addEventListener('change', onToneChange)
  $('paste-input').addEventListener('input', onPasteInput)
  $('paste-enhance-btn').addEventListener('click', onPasteEnhance)
  $('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
}

function detectPlatformFromUrl(url) {
  try {
    const u = new URL(url)
    if (/twitter\.com|x\.com/.test(u.hostname)) return { name: 'X / Twitter', key: 'twitter' }
    if (/linkedin\.com/.test(u.hostname)) return { name: 'LinkedIn', key: 'linkedin' }
    if (/reddit\.com/.test(u.hostname)) return { name: 'Reddit', key: 'reddit' }
    if (/threads\.net/.test(u.hostname)) return { name: 'Threads', key: 'threads' }
    return { name: 'Web', key: 'generic' }
  } catch {
    return { name: 'Web', key: 'generic' }
  }
}

function renderPlatform(platform) {
  const dot = platform.key === 'generic' ? '#6a6b6c' : '#59d499'
  $('platform-name').innerHTML = `
    <span class="platform-dot" style="background-color: ${dot}"></span>
    ${platform.name}
  `
}

function renderUsage(usage) {
  const { count, limit, tier } = usage
  const max = tier === 'pro' ? '∞' : limit
  $('usage-count').textContent = `${count} / ${max}`

  const fill = $('usage-fill')
  if (tier === 'pro') {
    fill.style.width = '100%'
    fill.className = 'usage-fill'
    $('usage-label').textContent = 'enhancements (Pro — unlimited)'
  } else {
    const pct = Math.min(100, (count / limit) * 100)
    fill.style.width = `${pct}%`
    fill.className = pct >= 100 ? 'usage-fill full' : pct >= 80 ? 'usage-fill warning' : 'usage-fill'
    $('usage-label').textContent = 'enhancements'
  }
}

function renderTone(tone) {
  $('tone-select').value = tone || 'casual'
}

function renderLicenseTier(status) {
  const badge = $('tier-badge')
  const upgradeBtn = $('upgrade-link')

  if (status.tier === 'pro') {
    badge.textContent = 'Pro'
    badge.className = 'badge badge-free'
    upgradeBtn.style.display = 'none'
  } else {
    badge.textContent = 'Free'
    badge.className = 'badge badge-pro'
    upgradeBtn.style.display = 'flex'
  }
}

async function onToneChange() {
  const tone = $('tone-select').value
  await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { tone } })
  chrome.runtime.sendMessage({
    type: 'TRACK_EVENT',
    payload: { event: 'tone_changed', metadata: { tone } }
  })
}

function onPasteInput() {
  const hasText = $('paste-input').value.trim().length > 0
  $('paste-enhance-btn').disabled = !hasText
}

async function onPasteEnhance() {
  const text = $('paste-input').value.trim()
  if (!text) return

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const platform = detectPlatformFromUrl(tab?.url || '')
  const tone = $('tone-select').value

  const btn = $('paste-enhance-btn')
  btn.disabled = true
  btn.textContent = 'Enhancing...'

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ENHANCE_TEXT',
      payload: { text, platform: platform.key, tone }
    })

    if (response.success) {
      $('paste-input').value = response.enhancedText
      showStatus('Enhanced! Copy the text above.', 'success')

      // Refresh usage
      const usage = await chrome.runtime.sendMessage({ type: 'GET_USAGE' })
      renderUsage(usage)
    } else {
      showStatus(response.error || 'Enhancement failed', 'error')
    }
  } catch {
    showStatus('Connection error. Try again.', 'error')
  } finally {
    btn.disabled = false
    btn.textContent = '✨ Enhance Pasted Text'
  }
}

function showStatus(message, type) {
  const el = $('status')
  el.textContent = message
  el.className = `status-message ${type}`
  el.style.display = 'block'

  setTimeout(() => {
    el.style.display = 'none'
  }, 4000)
}

document.addEventListener('DOMContentLoaded', init)

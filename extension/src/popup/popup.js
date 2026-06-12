// Popup UI script — tone selector, paste-to-enhance, usage display, platform detection, API key status

const elements = {}
let refreshTimer = null

function $(id) {
  if (!elements[id]) elements[id] = document.getElementById(id)
  return elements[id]
}

function safeText(id, text) {
  const el = $(id)
  if (el) el.textContent = text
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const platform = detectPlatformFromUrl(tab?.url || '')

  const [settings, usage] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
    chrome.runtime.sendMessage({ type: 'GET_USAGE' })
  ])

  renderPlatform(platform)
  renderUsage(usage)
  renderTone(settings.tone)
  renderConnection(settings.apiKey)
  renderLicenseTier(settings)

  $('tone-select').addEventListener('change', onToneChange)
  $('paste-input').addEventListener('input', onPasteInput)
  $('paste-enhance-btn').addEventListener('click', onPasteEnhance)
  $('options-btn').addEventListener('click', () => chrome.runtime.openOptionsPage())
  $('connect-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/login' })
  })

  // Read usage from local storage only (no API calls for poll)
  // Background updates enhancementCount after each successful enhance
  refreshTimer = setInterval(async () => {
    try {
      const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
      renderUsage({ count: settings.enhancementCount || 0, limit: 10, tier: settings.tier || 'free' })
    } catch {}
  }, 5000)

  // Listen for storage changes (background updates count)
  chrome.storage.onChanged.addListener(onStorageChanged)
}

function onStorageChanged(changes, area) {
  if (area !== 'local') return
  if (changes.enhancer_settings) {
    refreshUsage()
  }
}

async function refreshUsage() {
  try {
    const usage = await chrome.runtime.sendMessage({ type: 'GET_USAGE' })
    renderUsage(usage)
  } catch { /* popup might be closed */ }
}

// Clean up timer when popup closes
window.addEventListener('unload', () => {
  if (refreshTimer) clearInterval(refreshTimer)
  chrome.storage.onChanged.removeListener(onStorageChanged)
})

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
  if (!usage) return
  const { count, limit, tier } = usage
  const max = tier === 'pro' ? '∞' : limit
  safeText('usage-count', `${count} / ${max}`)

  const fill = $('usage-fill')
  if (!fill) return
  if (tier === 'pro') {
    fill.style.width = '100%'
    fill.className = 'usage-fill'
    safeText('usage-label', 'enhancements (Pro — unlimited)')
  } else {
    const pct = Math.min(100, (count / Math.max(limit, 1)) * 100)
    fill.style.width = `${pct}%`
    fill.className = pct >= 100 ? 'usage-fill full' : pct >= 80 ? 'usage-fill warning' : 'usage-fill'
    safeText('usage-label', 'enhancements')
  }
}

function renderTone(tone) {
  const sel = $('tone-select')
  if (sel) sel.value = tone || 'casual'
}

function renderConnection(apiKey) {
  const statusEl = $('connection-status')
  const dashBtn = $('dashboard-link')
  const connectBtn = $('connect-btn')

  if (apiKey) {
    if (statusEl) statusEl.style.display = 'flex'
    const dot = $('connection-dot')
    const text = $('connection-text')
    if (dot) { dot.className = 'connection-dot connected' }
    if (text) { text.className = 'connection-text connected'; text.textContent = 'Connected to Kira' }
    if (dashBtn) dashBtn.style.display = 'flex'
    if (connectBtn) connectBtn.style.display = 'none'
  } else {
    if (statusEl) statusEl.style.display = 'none'
    if (connectBtn) connectBtn.style.display = 'flex'
  }
}

function renderLicenseTier(settings) {
  const badge = $('tier-badge')
  const upgradeBtn = $('upgrade-link')
  if (!badge) return

  if (settings.tier === 'pro') {
    badge.textContent = 'Pro'
    badge.className = 'badge badge-free'
    if (upgradeBtn) upgradeBtn.style.display = 'none'
  } else {
    badge.textContent = 'Free'
    badge.className = 'badge badge-pro'
    if (upgradeBtn) upgradeBtn.style.display = 'flex'
  }
}

async function onToneChange() {
  const tone = $('tone-select').value
  await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { tone } })
}

function onPasteInput() {
  const hasText = $('paste-input').value.trim().length > 0
  $('paste-enhance-btn').disabled = !hasText
}

async function onPasteEnhance() {
  const text = $('paste-input').value.trim()
  if (!text) return

  const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
  if (!settings.apiKey) {
    showStatus('Add your API key in Settings first', 'error')
    return
  }

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
      showStatus('Enhanced!', 'success')
      // Immediate refresh
      await refreshUsage()
    } else {
      showStatus(response.error || 'Enhancement failed', 'error')
    }
  } catch {
    showStatus('Connection error. Try again.', 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Enhance Pasted Text'
  }
}

function showStatus(message, type) {
  const el = $('status')
  el.textContent = message
  el.className = `status-message ${type}`
  el.style.display = 'block'
  setTimeout(() => { el.style.display = 'none' }, 4000)
}

document.addEventListener('DOMContentLoaded', init)

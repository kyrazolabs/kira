// Options page script — API key, license, analytics, keyboard shortcuts

async function init() {
  const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })

  // API Key
  const apiKeyInput = document.getElementById('api-key-input')
  const apiKeyToggle = document.getElementById('api-key-toggle')
  const saveBtn = document.getElementById('save-api-key-btn')
  const statusEl = document.getElementById('api-key-status')

  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey
    statusEl.textContent = 'Connected ✓'
    statusEl.className = 'connection-status-text connected'
  }

  let visible = false
  apiKeyToggle.addEventListener('click', () => {
    visible = !visible
    apiKeyInput.type = visible ? 'text' : 'password'
    apiKeyToggle.textContent = visible ? 'Hide' : 'Show'
  })

  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim()
    if (!key) {
      statusEl.textContent = 'Enter a key'
      statusEl.className = 'connection-status-text disconnected'
      return
    }
    try {
      await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { apiKey: key } })
      await chrome.runtime.sendMessage({ type: 'SYNC_CONFIG' })
      statusEl.textContent = 'Connected ✓'
      statusEl.className = 'connection-status-text connected'
    } catch (e) {
      statusEl.textContent = 'Failed to save'
      statusEl.className = 'connection-status-text disconnected'
    }
  })

  // License
  if (settings.licenseValid) {
    showLicenseStatus('valid', 'License valid — Pro features active')
  }

  // Analytics
  document.getElementById('analytics-toggle').checked = settings.analyticsEnabled !== false
  document.getElementById('analytics-toggle').addEventListener('change', (e) => {
    const enabled = e.target.checked
    chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { analyticsEnabled: enabled } })
    showStatus(enabled ? 'Analytics enabled' : 'Analytics disabled', 'success')
  })

  document.querySelector('.version').textContent = `v${chrome.runtime.getManifest().version}`
  document.querySelector('.text-muted').textContent = `Kira v${chrome.runtime.getManifest().version}`
}

function showLicenseStatus(type, message) {
  const el = document.getElementById('license-status')
  if (!el) return
  el.textContent = message
  el.className = `license-status ${type}`
}

function showStatus(message, type) {
  const el = document.getElementById('status')
  if (!el) return
  el.textContent = message
  el.className = `status-message ${type}`
  el.style.display = 'block'
  setTimeout(() => { el.style.display = 'none' }, 4000)
}

document.addEventListener('DOMContentLoaded', init)

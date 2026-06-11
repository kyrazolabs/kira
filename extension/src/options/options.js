// Options page script — API key, license, analytics, keyboard shortcuts

async function init() {
  // Load current settings and license status for display
  const settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })

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

  // Set version
  document.querySelector('.version').textContent = `v${chrome.runtime.getManifest().version}`
  document.querySelector('.text-muted').textContent = `Content Enhancer v${chrome.runtime.getManifest().version}`
}

async function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim()
  await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', payload: { apiKey: key } })
  showStatus('API key saved', 'success')
}

async function validateLicense() {
  const email = document.getElementById('license-email').value.trim()
  const key = document.getElementById('license-key').value.trim()

  if (!email || !key) {
    showStatus('Enter both email and license key', 'error')
    return
  }

  const btn = document.getElementById('validate-license-btn')
  btn.disabled = true
  btn.textContent = 'Validating...'

  try {
    // Validate through background (which calls license module)
    const result = await chrome.runtime.sendMessage({
      type: 'VALIDATE_LICENSE',
      payload: { key, email }
    })

    if (result.valid) {
      showLicenseStatus('valid', 'License activated — Pro features unlocked')
      showStatus('License validated successfully!', 'success')
      chrome.runtime.sendMessage({
        type: 'TRACK_EVENT',
        payload: { event: 'license_validated', metadata: { tier: 'pro' } }
      })
    } else {
      showLicenseStatus('invalid', 'Invalid license key or email')
      showStatus('Invalid license. Check your email and key.', 'error')
    }
  } catch {
    showStatus('Validation failed. Try again.', 'error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Validate License'
  }
}

function showLicenseStatus(type, message) {
  const el = document.getElementById('license-status')
  el.textContent = message
  el.className = `license-status ${type}`
}

function showStatus(message, type) {
  const el = document.getElementById('status')
  el.textContent = message
  el.className = `status-message ${type}`
  el.style.display = 'block'

  setTimeout(() => {
    el.style.display = 'none'
  }, 4000)
}

document.addEventListener('DOMContentLoaded', init)

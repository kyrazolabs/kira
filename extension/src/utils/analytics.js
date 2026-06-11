// Analytics beacon — anonymous, opt-in telemetry
// Uses navigator.sendBeacon for fire-and-forget delivery

import { getStored } from './storage.js'

const ANALYTICS_ENDPOINT = 'https://api.content-enhancer.dev/v1/analytics'
let installId = null

export async function getInstallId() {
  if (installId) return installId

  installId = await getStored('installId')
  if (!installId) {
    installId = crypto.randomUUID()
    const { updateSettings } = await import('./storage.js')
    await updateSettings({ installId })
  }

  return installId
}

export async function track(event, metadata = {}) {
  const enabled = await getStored('analyticsEnabled', true)
  if (!enabled) return

  const id = await getInstallId()

  const payload = {
    event,
    installId: id,
    version: chrome.runtime.getManifest().version,
    timestamp: new Date().toISOString(),
    ...metadata
  }

  try {
    navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload))
  } catch {
    // Silently fail — analytics is best-effort
  }
}

// Pre-defined event types
export const AnalyticsEvents = {
  ENHANCE_REQUESTED: 'enhance_requested',
  ENHANCE_SUCCESS: 'enhance_success',
  ENHANCE_ERROR: 'enhance_error',
  TONE_CHANGED: 'tone_changed',
  LICENSE_VALIDATED: 'license_validated',
  EXTENSION_INSTALLED: 'extension_installed'
}

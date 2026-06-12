// Background service worker — relays enhance requests to backend API, handles config sync
import { enhanceThroughAPI, syncConfig, getTodayUsage } from './utils/api-client.js'
import { getSettings, updateSettings } from './utils/storage.js'

// Sync config from backend when extension starts
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const config = await syncConfig()
    if (config?.config) {
      await updateSettings({
        tone: config.config.defaultTone || 'casual',
        analyticsEnabled: config.config.analyticsEnabled !== false
      })
    }
    // Cache personas locally
    if (config?.personas) {
      await updateSettings({ personas: config.personas })
    }
  } catch {
    // Backend not available — use local defaults
  }
})

// Sync on startup too
syncConfig().then(config => {
  if (config?.config) {
    updateSettings({
      tone: config.config.defaultTone || 'casual',
      analyticsEnabled: config.config.analyticsEnabled !== false
    })
  }
  if (config?.personas) {
    updateSettings({ personas: config.personas })
  }
}).catch(() => {})

// Main message router
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true
})

// Handle external messages from dashboard (API key handoff)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_API_KEY' && message.key) {
    updateSettings({ apiKey: message.key })
      .then(() => syncConfig())
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false, error: e.message }))
    return true
  }
  sendResponse({ ok: false, error: 'Unknown message' })
})

async function handleMessage(message) {
  switch (message.type) {
    case 'ENHANCE_TEXT':
      return handleEnhanceText(message.payload)

    case 'GET_SETTINGS':
      return getSettings()

    case 'UPDATE_SETTINGS':
      return updateSettings(message.payload)

    case 'GET_USAGE':
      return getUsageInfo()

    case 'SYNC_CONFIG':
      try {
        const config = await syncConfig()
        if (config?.config) {
          await updateSettings({
            tone: config.config.defaultTone || 'casual',
            analyticsEnabled: config.config.analyticsEnabled !== false
          })
        }
        if (config?.personas) {
          await updateSettings({ personas: config.personas })
        }
        return { ok: true }
      } catch (e) {
        return { ok: false, error: e.message }
      }

    default:
      return { error: `Unknown message type: ${message.type}` }
  }
}

async function handleEnhanceText({ text, platform, tone }) {
  try {
    if (!text || typeof text !== 'string') {
      return { success: false, error: 'Invalid text provided.' }
    }
    const settings = await getSettings()
    const apiKey = settings.apiKey

    if (!apiKey) {
      return { success: false, error: 'No API key configured. Get one from the Kira dashboard.' }
    }

    const result = await enhanceThroughAPI({
      text, platform,
      tone: tone || settings.tone || 'casual'
    })

    // Sync usage from backend after success
    let usage = { count: 0, limit: 10, tier: 'free' }
    try {
      const data = await getTodayUsage()
      usage = { count: data.count || 0, limit: data.limit || 10, tier: 'free' }
    } catch { /* backend unreachable, use defaults */ }

    return { success: true, enhancedText: result.enhancedText, usage }
  } catch (error) {
    const msg = error.message || 'Enhancement failed. Please try again.'
    console.error('Enhance failed:', msg)
    return { success: false, error: msg }
  }
}

async function getUsageInfo() {
  try {
    const data = await getTodayUsage()
    return { count: data.count || 0, limit: data.limit || 10, tier: 'free' }
  } catch {
    return { count: 0, limit: 10, tier: 'free', error: 'Backend unreachable' }
  }
}

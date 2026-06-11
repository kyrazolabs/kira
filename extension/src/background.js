// Background service worker — relays enhance requests to backend API, handles config sync
import { enhanceThroughAPI, syncConfig, recordUsage, getTodayUsage } from './utils/api-client.js'
import { checkLicenseStatus, getEnhancementLimit } from './lib/license.js'
import { getSettings, updateSettings, getDailyCount, incrementDailyCount, FREE_TIER_LIMIT } from './utils/storage.js'

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
    const settings = await getSettings()
    const apiKey = settings.apiKey

    if (!apiKey) {
      return {
        success: false,
        error: 'No API key configured. Get one from the Kira dashboard.'
      }
    }

    // Check daily limit (enforced client-side as fallback)
    const dailyCount = await getDailyCount()
    if (dailyCount >= FREE_TIER_LIMIT) {
      return {
        success: false,
        error: `Daily limit reached: ${dailyCount}/${FREE_TIER_LIMIT} free enhancements used.`
      }
    }

    // Call backend API
    const result = await enhanceThroughAPI({
      text,
      platform,
      tone: tone || settings.tone || 'casual'
    })

    // Increment local counter
    await incrementDailyCount()

    return {
      success: true,
      enhancedText: result.enhancedText,
      usage: {
        count: await getDailyCount(),
        limit: FREE_TIER_LIMIT,
        tier: 'free'
      }
    }
  } catch (error) {
    console.error('Enhance failed:', error.message)
    return {
      success: false,
      error: error.message || 'Enhancement failed. Please try again.'
    }
  }
}

async function getUsageInfo() {
  try {
    const data = await getTodayUsage()
    return {
      count: data.count || 0,
      limit: data.limit || FREE_TIER_LIMIT,
      tier: 'free'
    }
  } catch {
    const dailyCount = await getDailyCount()
    return {
      count: dailyCount,
      limit: FREE_TIER_LIMIT,
      tier: 'free'
    }
  }
}

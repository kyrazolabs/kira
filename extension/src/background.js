// Background service worker — API calls, license checks, rate limiting, analytics
import { enhanceText } from './lib/api.js'
import { validateLicense, checkLicenseStatus, getEnhancementLimit } from './lib/license.js'
import { getSettings, updateSettings, getDailyCount, incrementDailyCount, FREE_TIER_LIMIT } from './utils/storage.js'
import { track, AnalyticsEvents } from './utils/analytics.js'

const DAILY_RESET_ALARM = 'daily-reset'

// Set up daily reset alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(DAILY_RESET_ALARM, { periodInMinutes: 1440 })
  track(AnalyticsEvents.EXTENSION_INSTALLED)
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === DAILY_RESET_ALARM) {
    updateSettings({ enhancementCount: 0, enhancementDate: new Date().toISOString().split('T')[0] })
  }
})

// Main message router
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, _sender).then(sendResponse)
  return true // Keep channel open for async response
})

async function handleMessage(message, _sender) {
  switch (message.type) {
    case 'ENHANCE_TEXT':
      return handleEnhanceText(message.payload)

    case 'GET_SETTINGS':
      return getSettings()

    case 'UPDATE_SETTINGS':
      return updateSettings(message.payload)

    case 'GET_LICENSE_STATUS':
      return checkLicenseStatus()

    case 'VALIDATE_LICENSE':
      return validateLicense(message.payload.key, message.payload.email)

    case 'GET_USAGE':
      return getUsageInfo()

    case 'TRACK_EVENT':
      track(message.payload.event, message.payload.metadata)
      return { ok: true }

    default:
      return { error: `Unknown message type: ${message.type}` }
  }
}

async function handleEnhanceText({ text, platform, tone }) {
  try {
    // Check license and rate limits
    const licenseStatus = await checkLicenseStatus()
    const limit = await getEnhancementLimit()
    const dailyCount = await getDailyCount()

    if (dailyCount >= limit) {
      return {
        success: false,
        error: licenseStatus.tier === 'free'
          ? `Daily limit reached: ${dailyCount}/${FREE_TIER_LIMIT} free enhancements used. Upgrade to Pro for unlimited.`
          : 'Enhancement limit reached.'
      }
    }

    // Call Gemini API
    const enhancedText = await enhanceText({ text, platform, tone })

    // Increment usage counter
    await incrementDailyCount()

    // Track analytics
    track(AnalyticsEvents.ENHANCE_SUCCESS, { platform, tone, textLength: text.length })

    return {
      success: true,
      enhancedText,
      usage: {
        count: await getDailyCount(),
        limit,
        tier: licenseStatus.tier
      }
    }
  } catch (error) {
    console.error('Enhance failed:', error.message)

    track(AnalyticsEvents.ENHANCE_ERROR, {
      platform,
      tone,
      errorType: error.name || 'Unknown',
      errorStatus: error.status || 'none'
    })

    return {
      success: false,
      error: error.name === 'APIError' ? error.userMessage : 'Something went wrong. Please try again.'
    }
  }
}

async function getUsageInfo() {
  const licenseStatus = await checkLicenseStatus()
  const dailyCount = await getDailyCount()
  const limit = await getEnhancementLimit()

  return {
    count: dailyCount,
    limit: licenseStatus.tier === 'pro' ? 'unlimited' : limit,
    tier: licenseStatus.tier
  }
}

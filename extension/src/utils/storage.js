// chrome.storage wrapper — sync for settings, local for secrets

const SETTINGS_KEY = 'enhancer_settings'
const DEFAULTS = {
  tone: 'casual',
  analyticsEnabled: true,
  apiKey: null,       // Bundled key stored here
  licenseKey: null,   // Pro license key
  licenseEmail: null,  // Email associated with license
  licenseValid: false,
  tier: 'free',
  enhancementCount: 0,
  enhancementDate: null, // ISO date string for daily reset
  installId: null     // Anonymous UUID for analytics
}

export async function getSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  const stored = result[SETTINGS_KEY] || {}
  return { ...DEFAULTS, ...stored }
}

export async function updateSettings(patch) {
  const current = await getSettings()
  const updated = { ...current, ...patch }
  await chrome.storage.local.set({ [SETTINGS_KEY]: updated })
  return updated
}

export async function getStored(key, defaultValue = null) {
  const settings = await getSettings()
  return key in settings ? settings[key] : defaultValue
}

export async function setStored(key, value) {
  return updateSettings({ [key]: value })
}

// Reset daily enhancement count if date has changed
export async function getDailyCount() {
  const settings = await getSettings()
  const today = new Date().toISOString().split('T')[0]

  if (settings.enhancementDate !== today) {
    await updateSettings({ enhancementCount: 0, enhancementDate: today })
    return 0
  }

  return settings.enhancementCount
}

export async function incrementDailyCount() {
  const settings = await getSettings()
  const today = new Date().toISOString().split('T')[0]

  if (settings.enhancementDate !== today) {
    await updateSettings({ enhancementCount: 1, enhancementDate: today })
    return 1
  }

  const count = (settings.enhancementCount || 0) + 1
  await updateSettings({ enhancementCount: count })
  return count
}

export const FREE_TIER_LIMIT = 10

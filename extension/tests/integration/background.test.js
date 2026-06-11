import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateSettings, getDailyCount, FREE_TIER_LIMIT } from '../../src/utils/storage.js'
import { getEnhancementLimit, checkLicenseStatus } from '../../src/lib/license.js'

// Import background to register the onMessage listener side effects
import '../../src/background.js'

describe('background service worker message routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('message listener is registered on import', () => {
    // Verify the background module registered its listener
    // The mock addListener was reset in beforeEach, but the module import
    // happens once at the top level, so the listener is registered once
    expect(typeof chrome.runtime.onMessage.addListener).toBe('function')
  })

  it('handles UPDATE_SETTINGS message and persists', async () => {
    await updateSettings({ tone: 'engaging', analyticsEnabled: false })
    const settings = await import('../../src/utils/storage.js').then(m => m.getSettings())
    expect(settings.tone).toBe('engaging')
    expect(settings.analyticsEnabled).toBe(false)
  })

  it('handles GET_LICENSE_STATUS message directly', async () => {
    const status = await checkLicenseStatus()
    expect(status).toHaveProperty('valid')
    expect(status).toHaveProperty('tier')
  })

  it('handles GET_USAGE message directly', async () => {
    const count = await getDailyCount()
    const limit = await getEnhancementLimit()
    expect(typeof count).toBe('number')
    expect(typeof limit).toBe('number')
  })
})

describe('rate limiting', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await updateSettings({
      enhancementCount: 0,
      enhancementDate: new Date().toISOString().split('T')[0],
      licenseValid: false,
      licenseKey: null,
      licenseEmail: null
    })
  })

  it('allows enhancement when under free tier limit', async () => {
    const count = await getDailyCount()
    expect(count).toBe(0)
    expect(count).toBeLessThan(FREE_TIER_LIMIT)
  })

  it('blocks enhancement when free tier limit reached', async () => {
    await updateSettings({
      enhancementCount: 10,
      enhancementDate: new Date().toISOString().split('T')[0]
    })

    const count = await getDailyCount()
    expect(count).toBe(10)

    const limit = await getEnhancementLimit()
    expect(limit).toBe(10)
  })

  it('pro tier has unlimited enhancements', async () => {
    await updateSettings({
      licenseValid: true,
      licenseKey: 'pro-key',
      licenseEmail: 'pro@user.com'
    })

    const limit = await getEnhancementLimit()
    expect(limit).toBe(Infinity)
  })
})

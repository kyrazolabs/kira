import {
  getSettings, updateSettings, getStored, setStored,
  getDailyCount, incrementDailyCount, FREE_TIER_LIMIT
} from '../../src/utils/storage.js'

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSettings', () => {
    it('returns defaults when nothing is stored', async () => {
      const settings = await getSettings()
      expect(settings.tone).toBe('casual')
      expect(settings.analyticsEnabled).toBe(true)
      expect(settings.tier).toBe('free')
      expect(settings.enhancementCount).toBe(0)
    })
  })

  describe('updateSettings', () => {
    it('merges partial updates', async () => {
      await updateSettings({ tone: 'professional' })
      const settings = await getSettings()
      expect(settings.tone).toBe('professional')
      expect(settings.analyticsEnabled).toBe(true) // unchanged
    })

    it('persists to chrome.storage.local', async () => {
      await updateSettings({ licenseKey: 'test-key-123' })
      const stored = await chrome.storage.local.get('enhancer_settings')
      expect(stored.enhancer_settings.licenseKey).toBe('test-key-123')
    })
  })

  describe('getStored / setStored', () => {
    it('gets and sets individual keys', async () => {
      await setStored('tone', 'engaging')
      const value = await getStored('tone')
      expect(value).toBe('engaging')
    })

    it('returns default for missing keys', async () => {
      const value = await getStored('nonexistent', 'fallback')
      expect(value).toBe('fallback')
    })
  })

  describe('getDailyCount', () => {
    it('returns 0 for a new day', async () => {
      const count = await getDailyCount()
      expect(count).toBe(0)
    })

    it('returns existing count for the same day', async () => {
      await updateSettings({
        enhancementCount: 5,
        enhancementDate: new Date().toISOString().split('T')[0]
      })
      const count = await getDailyCount()
      expect(count).toBe(5)
    })

    it('resets count when date is different', async () => {
      await updateSettings({
        enhancementCount: 5,
        enhancementDate: '2024-01-01' // old date
      })
      const count = await getDailyCount()
      expect(count).toBe(0)
    })
  })

  describe('incrementDailyCount', () => {
    it('increments from 0 to 1', async () => {
      const count = await incrementDailyCount()
      expect(count).toBe(1)
    })

    it('increments from 5 to 6', async () => {
      await updateSettings({ enhancementCount: 5, enhancementDate: new Date().toISOString().split('T')[0] })
      const count = await incrementDailyCount()
      expect(count).toBe(6)
    })

    it('resets on new day', async () => {
      await updateSettings({ enhancementCount: 5, enhancementDate: '2024-01-01' })
      const count = await incrementDailyCount()
      expect(count).toBe(1)
    })
  })

  describe('FREE_TIER_LIMIT', () => {
    it('is 10', () => {
      expect(FREE_TIER_LIMIT).toBe(10)
    })
  })
})

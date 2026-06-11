import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getInstallId, track, AnalyticsEvents } from '../../src/utils/analytics.js'

// Mock storage for analytics tests
vi.mock('../../src/utils/storage.js', () => {
  let store = {}
  return {
    getStored: vi.fn((key) => Promise.resolve(store[key] || null)),
    getSettings: vi.fn(() => Promise.resolve(store)),
    updateSettings: vi.fn((patch) => {
      store = { ...store, ...patch }
      return Promise.resolve(store)
    })
  }
})

describe('getInstallId', () => {
  it('generates a UUID on first call', async () => {
    const id = await getInstallId()
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(10)
  })

  it('returns same ID on subsequent calls', async () => {
    const id1 = await getInstallId()
    const id2 = await getInstallId()
    expect(id1).toBe(id2)
  })
})

describe('track', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends beacon with correct payload structure', async () => {
    // analyticsEnabled is true by default
    const { updateSettings } = await import('../../src/utils/storage.js')
    await updateSettings({ analyticsEnabled: true })

    const beaconSpy = vi.fn(() => true)
    // Override sendBeacon on the navigator object
    Object.defineProperty(navigator, 'sendBeacon', {
      value: beaconSpy,
      writable: true,
      configurable: true
    })

    await track(AnalyticsEvents.ENHANCE_REQUESTED, { platform: 'twitter', tone: 'casual' })

    expect(beaconSpy).toHaveBeenCalledTimes(1)

    const [url, body] = beaconSpy.mock.calls[0]
    expect(url).toContain('api.content-enhancer.dev')

    const payload = JSON.parse(body)
    expect(payload.event).toBe('enhance_requested')
    expect(payload.platform).toBe('twitter')
    expect(payload.tone).toBe('casual')
    expect(payload.installId).toBeDefined()
    expect(payload.version).toBe('1.0.0')
    expect(payload.timestamp).toBeDefined()
  })

  it('does not send beacon when analytics is disabled', async () => {
    const { updateSettings } = await import('../../src/utils/storage.js')
    await updateSettings({ analyticsEnabled: false })

    const beaconSpy = vi.fn(() => true)
    Object.defineProperty(navigator, 'sendBeacon', {
      value: beaconSpy,
      writable: true,
      configurable: true
    })

    await track(AnalyticsEvents.ENHANCE_REQUESTED, {})

    expect(beaconSpy).not.toHaveBeenCalled()
  })

  it('handles sendBeacon failure gracefully', async () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      value: vi.fn(() => { throw new Error('send failed') }),
      writable: true,
      configurable: true
    })

    // Should not throw
    await expect(track(AnalyticsEvents.ENHANCE_SUCCESS, {})).resolves.toBeUndefined()
  })
})

describe('AnalyticsEvents', () => {
  it('has all required event types', () => {
    expect(AnalyticsEvents.ENHANCE_REQUESTED).toBe('enhance_requested')
    expect(AnalyticsEvents.ENHANCE_SUCCESS).toBe('enhance_success')
    expect(AnalyticsEvents.ENHANCE_ERROR).toBe('enhance_error')
    expect(AnalyticsEvents.TONE_CHANGED).toBe('tone_changed')
    expect(AnalyticsEvents.LICENSE_VALIDATED).toBe('license_validated')
    expect(AnalyticsEvents.EXTENSION_INSTALLED).toBe('extension_installed')
  })
})

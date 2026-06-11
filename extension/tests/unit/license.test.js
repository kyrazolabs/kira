import { validateLicense, checkLicenseStatus, isProUser, getEnhancementLimit } from '../../src/lib/license.js'
import { updateSettings } from '../../src/utils/storage.js'

describe('validateLicense', () => {
  it('rejects empty key and email', async () => {
    const result = await validateLicense('', '')
    expect(result.valid).toBe(false)
    expect(result.tier).toBe('free')
  })

  it('rejects null key and email', async () => {
    const result = await validateLicense(null, null)
    expect(result.valid).toBe(false)
  })

  it('rejects invalid license key', async () => {
    const result = await validateLicense('invalid-key-123', 'test@example.com')
    expect(result.valid).toBe(false)
    expect(result.tier).toBe('free')
    expect(result.reason).toBeDefined()
  })

  it('updates storage on invalid license', async () => {
    await validateLicense('bad-key', 'user@test.com')
    const settings = await import('../../src/utils/storage.js').then(m => m.getSettings())
    expect(settings.licenseValid).toBe(false)
    expect(settings.tier).toBe('free')
  })
})

describe('checkLicenseStatus', () => {
  it('returns free tier when no license stored', async () => {
    const status = await checkLicenseStatus()
    expect(status.valid).toBe(false)
    expect(status.tier).toBe('free')
  })

  it('returns free tier when stored license is invalid', async () => {
    await updateSettings({ licenseValid: false, licenseKey: 'bad', licenseEmail: 'x@y.com' })
    const status = await checkLicenseStatus()
    expect(status.valid).toBe(false)
    expect(status.tier).toBe('free')
  })

  it('returns pro tier when stored license is valid', async () => {
    await updateSettings({ licenseValid: true, licenseKey: 'good-key', licenseEmail: 'pro@user.com' })
    const status = await checkLicenseStatus()
    expect(status.valid).toBe(true)
    expect(status.tier).toBe('pro')
  })
})

describe('isProUser', () => {
  it('returns false for free user', async () => {
    expect(await isProUser()).toBe(false)
  })

  it('returns true for pro user', async () => {
    await updateSettings({ licenseValid: true, licenseKey: 'pro-key', licenseEmail: 'pro@user.com' })
    expect(await isProUser()).toBe(true)
  })
})

describe('getEnhancementLimit', () => {
  it('returns 10 for free tier', async () => {
    const limit = await getEnhancementLimit()
    expect(limit).toBe(10)
  })

  it('returns Infinity for pro tier', async () => {
    await updateSettings({ licenseValid: true, licenseKey: 'pro-key', licenseEmail: 'pro@user.com' })
    const limit = await getEnhancementLimit()
    expect(limit).toBe(Infinity)
  })
})

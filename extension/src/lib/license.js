// License key validation — hash-based offline check
// Pro licenses are generated server-side from Stripe webhooks
// Validation: sha256(license_key + email) === stored_hash

import { getStored, updateSettings } from '../utils/storage.js'

// Pre-computed hashes for valid license keys (populated at build time or via remote config)
// In production, this is fetched from a CDN periodically
const VALID_HASHES = new Set()

export async function validateLicense(key, email) {
  if (!key || !email) {
    await updateSettings({ licenseKey: null, licenseEmail: null, licenseValid: false, tier: 'free' })
    return { valid: false, tier: 'free', reason: 'No license key or email provided' }
  }

  const hash = await computeHash(key + ':' + email)

  if (VALID_HASHES.has(hash) || await checkRemote(key, email)) {
    await updateSettings({
      licenseKey: key,
      licenseEmail: email,
      licenseValid: true,
      tier: 'pro'
    })
    return { valid: true, tier: 'pro' }
  }

  await updateSettings({ licenseKey: null, licenseEmail: null, licenseValid: false, tier: 'free' })
  return { valid: false, tier: 'free', reason: 'Invalid license key or email' }
}

export async function checkLicenseStatus() {
  const key = await getStored('licenseKey')
  const email = await getStored('licenseEmail')
  const isValid = await getStored('licenseValid', false)

  if (isValid && key && email) {
    return { valid: true, tier: 'pro' }
  }

  return { valid: false, tier: 'free' }
}

export async function isProUser() {
  const status = await checkLicenseStatus()
  return status.tier === 'pro'
}

export async function getEnhancementLimit() {
  const status = await checkLicenseStatus()
  if (status.tier === 'pro') return Infinity
  return 10 // Free tier daily limit
}

async function computeHash(input) {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function checkRemote(key, email) {
  try {
    const response = await fetch(
      `https://api.content-enhancer.dev/v1/license/validate?key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    )
    if (!response.ok) return false
    const data = await response.json()
    return data.valid === true
  } catch {
    // Offline — rely on local hash check
    return false
  }
}

// For build-time injection of valid hashes
export function setValidHashes(hashes) {
  VALID_HASHES.clear()
  for (const hash of hashes) {
    VALID_HASHES.add(hash)
  }
}

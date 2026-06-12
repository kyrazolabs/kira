// API client for Kira backend — used by the extension

import { getStored } from './storage.js'

const API_BASE = 'http://localhost:3001/api'

async function request(path, options = {}) {
  const apiKey = await getStored('apiKey')
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    ...options.headers
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'omit'
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function enhanceThroughAPI({ text, platform, tone }) {
  return request('/enhance', {
    method: 'POST',
    body: JSON.stringify({ text, platform, tone })
  })
}

export async function syncConfig() {
  return request('/config')
}

export async function recordUsage({ platform, tone, eventType, textLength = 0 }) {
  return request('/usage/event', {
    method: 'POST',
    body: JSON.stringify({ platform, tone, eventType, textLength })
  })
}

export async function getTodayUsage() {
  return request('/usage/today')
}

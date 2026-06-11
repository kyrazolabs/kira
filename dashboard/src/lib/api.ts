const API_BASE = '/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }

  return res.json()
}

export interface IPersona {
  _id: string
  name: string
  description: string
  platform: string
  tone: string
  systemPrompt: string
  temperature: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface IUserConfig {
  defaultPersonaId: string | null
  defaultTone: string
  analyticsEnabled: boolean
}

export interface IUsageStats {
  total: number
  thisMonth: number
  today: number
  daily: { date: string; count: number }[]
  byPlatform: { platform: string; count: number }[]
  byTone: { tone: string; count: number }[]
}

// Config API
export const configApi = {
  getFull: () => request('/config'),
  listPersonas: (): Promise<IPersona[]> => request('/config/personas'),
  createPersona: (data: Partial<IPersona>): Promise<IPersona> =>
    request('/config/personas', { method: 'POST', body: JSON.stringify(data) }),
  updatePersona: (id: string, data: Partial<IPersona>): Promise<IPersona> =>
    request(`/config/personas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePersona: (id: string) =>
    request(`/config/personas/${id}`, { method: 'DELETE' }),
  updateConfig: (data: Partial<IUserConfig>) =>
    request('/config', { method: 'PUT', body: JSON.stringify(data) })
}

// Usage API
export const usageApi = {
  getStats: (days = 30): Promise<IUsageStats> => request(`/usage/stats?days=${days}`),
  getToday: () => request('/usage/today'),
  recordEvent: (data: { platform: string; tone: string; eventType: string; textLength?: number }) =>
    request('/usage/event', { method: 'POST', body: JSON.stringify(data) })
}

import { vi, beforeEach } from 'vitest'

const storage = new Map()

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        const result = {}
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) {
          if (storage.has(key)) result[key] = storage.get(key)
        }
        return Promise.resolve(result)
      }),
      set: vi.fn((items) => {
        for (const [key, value] of Object.entries(items)) {
          storage.set(key, value)
        }
        return Promise.resolve()
      }),
      remove: vi.fn((keys) => {
        const keyList = Array.isArray(keys) ? keys : [keys]
        for (const key of keyList) storage.delete(key)
        return Promise.resolve()
      }),
      clear: vi.fn(() => {
        storage.clear()
        return Promise.resolve()
      })
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve())
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve()),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      name: 'Content Enhancer'
    })),
    onInstalled: {
      addListener: vi.fn()
    }
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  },
  alarms: {
    create: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    onAlarm: {
      addListener: vi.fn()
    }
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([{ id: 1, url: 'https://x.com' }]))
  },
  action: {
    setBadgeText: vi.fn(() => Promise.resolve()),
    setBadgeBackgroundColor: vi.fn(() => Promise.resolve())
  }
}

beforeEach(() => {
  storage.clear()
  vi.clearAllMocks()
})

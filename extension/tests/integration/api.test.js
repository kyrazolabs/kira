import { describe, it, expect, beforeEach, vi } from 'vitest'
import { enhanceText, APIError } from '../../src/lib/api.js'

// Mock storage
vi.mock('../../src/utils/storage.js', () => ({
  getStored: vi.fn((key) => {
    if (key === 'apiKey') return Promise.resolve('test-api-key-mock')
    return Promise.resolve(null)
  })
}))

describe('enhanceText', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const mockGeminiResponse = (text, blockReason = null) => {
    const response = {
      candidates: [{ content: { parts: [{ text }] } }]
    }
    if (blockReason) {
      response.candidates = []
      response.promptFeedback = { blockReason }
    }
    return response
  }

  it('returns enhanced text on successful API call', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse('Enhanced version of the text'))
      })
    )

    const result = await enhanceText({
      text: 'Original text',
      platform: 'twitter',
      tone: 'casual'
    })

    expect(result).toBe('Enhanced version of the text')
  })

  it('trims whitespace from response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse('  padded response  \n'))
      })
    )

    const result = await enhanceText({
      text: 'Test',
      platform: 'generic',
      tone: 'casual'
    })

    expect(result).toBe('padded response')
  })

  it('throws APIError with status 429 on rate limit', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        text: () => Promise.resolve('RATE_LIMIT_EXCEEDED')
      })
    )

    await expect(
      enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })
    ).rejects.toThrow(APIError)

    try {
      await enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect(error.status).toBe(429)
      expect(error.userMessage).toContain('Too many requests')
    }
  })

  it('throws APIError with status 403 on invalid key', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        text: () => Promise.resolve('INVALID_KEY')
      })
    )

    try {
      await enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })
    } catch (error) {
      expect(error.status).toBe(403)
      expect(error.userMessage).toContain('API key is invalid')
    }
  })

  it('throws APIError on content block', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse('', 'SAFETY'))
      })
    )

    try {
      await enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })
    } catch (error) {
      expect(error.status).toBe(422)
      expect(error.userMessage).toContain('Content could not be generated')
    }
  })

  it('throws APIError on network failure', async () => {
    global.fetch = vi.fn(() => Promise.reject(new TypeError('fetch')))

    try {
      await enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect(error.status).toBe(0)
      expect(error.userMessage).toContain('Network error')
    }
  })

  it('throws on empty text', async () => {
    await expect(
      enhanceText({ text: '', platform: 'twitter', tone: 'casual' })
    ).rejects.toThrow('No text provided')
  })

  it('throws on whitespace-only text', async () => {
    await expect(
      enhanceText({ text: '   ', platform: 'twitter', tone: 'casual' })
    ).rejects.toThrow('No text provided')
  })

  it('sends correct request payload to Gemini API', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse('Enhanced'))
      })
    )

    await enhanceText({ text: 'Test', platform: 'twitter', tone: 'casual' })

    const callArgs = global.fetch.mock.calls[0]
    const url = callArgs[0]
    const options = callArgs[1]

    expect(url).toContain('generativelanguage.googleapis.com')
    expect(url).toContain('gemini-2.0-flash')
    expect(url).toContain('key=test-api-key-mock')

    const body = JSON.parse(options.body)
    expect(body.contents[0].parts[0].text).toBeDefined()
    expect(body.generationConfig.temperature).toBe(0.8)
    expect(body.generationConfig.maxOutputTokens).toBe(1024)
  })
})

describe('APIError', () => {
  it('has user-friendly messages for each status', () => {
    expect(new APIError(429, '').userMessage).toContain('Too many requests')
    expect(new APIError(403, '').userMessage).toContain('API key is invalid')
    expect(new APIError(422, '').userMessage).toContain('Content could not be generated')
    expect(new APIError(0, '').userMessage).toContain('Network error')
    expect(new APIError(500, '').userMessage).toContain('Something went wrong')
  })
})

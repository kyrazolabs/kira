import { detectPlatform, getPlatform, PLATFORMS } from '../../src/lib/platforms.js'

describe('detectPlatform', () => {
  it('detects X/Twitter from x.com URL', () => {
    const url = new URL('https://x.com/compose/post')
    const result = detectPlatform(url)
    expect(result.key).toBe('twitter')
    expect(result.name).toBe('X / Twitter')
  })

  it('detects X/Twitter from twitter.com URL', () => {
    const url = new URL('https://twitter.com/home')
    const result = detectPlatform(url)
    expect(result.key).toBe('twitter')
  })

  it('detects LinkedIn from linkedin.com URL', () => {
    const url = new URL('https://www.linkedin.com/feed/')
    const result = detectPlatform(url)
    expect(result.key).toBe('linkedin')
    expect(result.name).toBe('LinkedIn')
  })

  it('detects Reddit from reddit.com URL', () => {
    const url = new URL('https://www.reddit.com/r/programming/comments/xyz')
    const result = detectPlatform(url)
    expect(result.key).toBe('reddit')
    expect(result.name).toBe('Reddit')
  })

  it('detects Threads from threads.net URL', () => {
    const url = new URL('https://www.threads.net/@username/post/123')
    const result = detectPlatform(url)
    expect(result.key).toBe('threads')
    expect(result.name).toBe('Threads')
  })

  it('falls back to generic for unknown domains', () => {
    const url = new URL('https://example.com')
    const result = detectPlatform(url)
    expect(result.key).toBe('generic')
    expect(result.name).toBe('Web')
  })

  it('falls back to generic for empty hostname', () => {
    const url = new URL('about:blank')
    const result = detectPlatform(url)
    expect(result.key).toBe('generic')
  })

  it('returns maxLength for each platform', () => {
    expect(detectPlatform(new URL('https://x.com')).maxLength).toBe(280)
    expect(detectPlatform(new URL('https://linkedin.com')).maxLength).toBe(3000)
    expect(detectPlatform(new URL('https://reddit.com')).maxLength).toBe(10000)
    expect(detectPlatform(new URL('https://threads.net')).maxLength).toBe(500)
    expect(detectPlatform(new URL('https://example.com')).maxLength).toBe(10000)
  })
})

describe('getPlatform', () => {
  it('returns platform config by name', () => {
    const platform = getPlatform('twitter')
    expect(platform.name).toBe('X / Twitter')
    expect(platform.maxLength).toBe(280)
  })

  it('falls back to generic for unknown name', () => {
    const platform = getPlatform('nonexistent')
    expect(platform.name).toBe('Web')
  })
})

describe('PLATFORMS', () => {
  it('has all 5 platform entries', () => {
    expect(Object.keys(PLATFORMS)).toHaveLength(5)
    expect(PLATFORMS.twitter).toBeDefined()
    expect(PLATFORMS.linkedin).toBeDefined()
    expect(PLATFORMS.reddit).toBeDefined()
    expect(PLATFORMS.threads).toBeDefined()
    expect(PLATFORMS.generic).toBeDefined()
  })

  it('each platform has required properties', () => {
    for (const platform of Object.values(PLATFORMS)) {
      expect(platform).toHaveProperty('match')
      expect(typeof platform.match).toBe('function')
      expect(platform).toHaveProperty('inputSelector')
      expect(typeof platform.inputSelector).toBe('string')
      expect(platform).toHaveProperty('name')
      expect(typeof platform.name).toBe('string')
      expect(platform).toHaveProperty('maxLength')
      expect(typeof platform.maxLength).toBe('number')
    }
  })
})

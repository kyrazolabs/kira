import { buildPrompt, TONES, PLATFORM_RULES } from '../../src/lib/prompts.js'

describe('buildPrompt', () => {
  const sampleText = 'I made a tool that converts audio to text. It works offline.'

  it('includes platform-specific rules for Twitter', () => {
    const prompt = buildPrompt('twitter', 'casual', sampleText)
    expect(prompt).toContain('Keep under 280 characters')
    expect(prompt).toContain('expert content writer for X / Twitter')
  })

  it('includes platform-specific rules for LinkedIn', () => {
    const prompt = buildPrompt('linkedin', 'professional', sampleText)
    expect(prompt).toContain('Tell a story in 3 short paragraphs')
    expect(prompt).toContain('LinkedIn')
  })

  it('includes platform-specific rules for Reddit', () => {
    const prompt = buildPrompt('reddit', 'engaging', sampleText)
    expect(prompt).toContain('No marketing speak whatsoever')
  })

  it('includes platform-specific rules for Threads', () => {
    const prompt = buildPrompt('threads', 'casual', sampleText)
    expect(prompt).toContain('like texting a close friend')
  })

  it('includes fallback rules for generic platform', () => {
    const prompt = buildPrompt('generic', 'professional', sampleText)
    expect(prompt).toContain('Make it clear, concise, and engaging')
  })

  it('includes tone-specific instruction for casual', () => {
    const prompt = buildPrompt('twitter', 'casual', sampleText)
    expect(prompt).toContain('Rewrite this in a casual, conversational tone')
  })

  it('includes tone-specific instruction for professional', () => {
    const prompt = buildPrompt('linkedin', 'professional', sampleText)
    expect(prompt).toContain('Rewrite this professionally')
  })

  it('includes tone-specific instruction for engaging', () => {
    const prompt = buildPrompt('reddit', 'engaging', sampleText)
    expect(prompt).toContain('maximize engagement')
  })

  it('falls back to casual for unknown tone', () => {
    const prompt = buildPrompt('twitter', 'nonexistent', sampleText)
    expect(prompt).toContain('Rewrite this in a casual, conversational tone')
  })

  it('includes the original text in the prompt', () => {
    const prompt = buildPrompt('twitter', 'casual', sampleText)
    expect(prompt).toContain(sampleText)
  })

  it('includes "Return ONLY the enhanced text" directive', () => {
    const prompt = buildPrompt('generic', 'professional', 'test')
    expect(prompt).toContain('Return ONLY the enhanced text')
    expect(prompt).toContain('no explanations')
  })

  it('handles empty text gracefully', () => {
    const prompt = buildPrompt('generic', 'casual', '')
    expect(prompt).toBeDefined()
    expect(typeof prompt).toBe('string')
  })

  it('produces distinct prompts for different tones on same platform', () => {
    const casual = buildPrompt('twitter', 'casual', sampleText)
    const professional = buildPrompt('twitter', 'professional', sampleText)
    const engaging = buildPrompt('twitter', 'engaging', sampleText)

    expect(casual).not.toBe(professional)
    expect(professional).not.toBe(engaging)
    expect(casual).not.toBe(engaging)
  })
})

describe('TONES', () => {
  it('has exactly 3 tones', () => {
    expect(Object.keys(TONES)).toHaveLength(3)
  })

  it('each tone has instruction and label', () => {
    for (const tone of Object.values(TONES)) {
      expect(tone).toHaveProperty('instruction')
      expect(tone).toHaveProperty('label')
      expect(typeof tone.instruction).toBe('string')
      expect(typeof tone.label).toBe('string')
    }
  })
})

describe('PLATFORM_RULES', () => {
  it('has rules for all 5 platforms', () => {
    expect(Object.keys(PLATFORM_RULES)).toHaveLength(5)
    expect(PLATFORM_RULES.twitter).toBeDefined()
    expect(PLATFORM_RULES.linkedin).toBeDefined()
    expect(PLATFORM_RULES.reddit).toBeDefined()
    expect(PLATFORM_RULES.threads).toBeDefined()
    expect(PLATFORM_RULES.generic).toBeDefined()
  })

  it('each platform has non-empty rules', () => {
    for (const rules of Object.values(PLATFORM_RULES)) {
      expect(rules.length).toBeGreaterThan(0)
    }
  })
})

import { Elysia, t } from 'elysia'
import type { Auth } from '../auth'
import { apiKeyAuth, sessionAuth } from '../middleware/auth'
import { callGemini, GeminiError } from '../lib/gemini'
import { Persona } from '../models/persona'
import { UserConfig } from '../models/config'
import { UsageEvent } from '../models/usage'

const enhanceBody = t.Object({
  text: t.String({ minLength: 1, maxLength: 10000 }),
  platform: t.String(),
  tone: t.Optional(t.String())
})

function buildPrompt(platform: string, tone: string, personaPrompt: string | null, text: string): string {
  const rules: Record<string, string> = {
    twitter: 'Keep under 280 characters. Use line breaks for readability. One strong hook, one punchline. No hashtag spam (max 1).',
    linkedin: 'Tell a story in 3 short paragraphs. Start with a bold claim or personal anecdote. End with a thought-provoking question.',
    reddit: 'Be direct and genuinely valuable. No marketing speak. No self-promotion. Write like a smart friend giving advice.',
    threads: 'Conversational tone, like texting a close friend. Short lines. One thought per post.',
    generic: 'Make it clear, concise, and engaging. Remove filler words.'
  }

  const tones: Record<string, string> = {
    casual: 'Rewrite this in a casual, conversational tone. Keep it short and punchy.',
    professional: 'Rewrite this professionally. Clear, confident, no fluff.',
    engaging: 'Rewrite this to maximize engagement. Hook first, emotional language, strong call to action.'
  }

  const platformLabel: Record<string, string> = {
    twitter: 'X / Twitter', linkedin: 'LinkedIn', reddit: 'Reddit',
    threads: 'Threads', generic: 'the web'
  }

  const base = personaPrompt || [
    `You are an expert content writer for ${platformLabel[platform] || 'the web'}.`,
    '',
    rules[platform] || rules.generic,
    '',
    tones[tone] || tones.casual
  ].join('\n')

  return [
    base,
    '',
    'Original text:',
    '"""',
    text,
    '"""',
    '',
    'Return ONLY the enhanced text — no explanations, no quotes around it.'
  ].join('\n')
}

export function enhanceRoutes(auth: Auth) {
  return new Elysia({ prefix: '/api/enhance' })
    .use(apiKeyAuth(auth))

    .post('/', async ({ userId, body, set }) => {
      if (!userId) {
        set.status = 401
        return { error: 'Authentication required' }
      }
      try {
        // Load user's default persona and config
        const [config, defaultPersona] = await Promise.all([
          UserConfig.findOne({ userId }).lean(),
          Persona.findOne({ userId, isDefault: true }).lean()
        ])

        const tone = body.tone || config?.defaultTone || 'casual'
        const platform = body.platform || 'generic'

        // Build prompt with user's persona if available
        const prompt = buildPrompt(platform, tone, defaultPersona?.systemPrompt || null, body.text)

        // Call Gemini
        const enhancedText = await callGemini(prompt, defaultPersona?.temperature ?? 0.8)

        // Record usage
        await UsageEvent.create({
          userId,
          apiKeyId: 'api-key',
          platform,
          tone,
          eventType: 'enhance_success',
          textLength: body.text.length
        })

        return { enhancedText }

      } catch (error) {
        console.error('Enhance error:', error instanceof Error ? error.message : error)
        console.error('Full error:', error)
        // Record error
        await UsageEvent.create({
          userId,
          apiKeyId: 'api-key',
          platform: body.platform || 'generic',
          tone: body.tone || 'casual',
          eventType: 'enhance_error',
          textLength: body.text.length,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })

        if (error instanceof GeminiError) {
          const messages: Record<number, string> = {
            429: 'Rate limited. Please wait a moment.',
            403: 'AI service unavailable.',
            422: 'Content could not be generated. Try rewording.'
          }
          return new Response(JSON.stringify({
            error: messages[error.status] || error.message
          }), { status: error.status || 500 })
        }

        throw error
      }
    }, {
      auth: true,
      body: enhanceBody
    })
}

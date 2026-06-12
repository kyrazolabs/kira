import { Elysia, t } from 'elysia'
import type { Auth } from '../auth'
import { sessionAuth } from '../middleware/auth'
import { callGemini, GeminiError } from '../lib/gemini'
import { buildEnhancePrompt } from '../lib/prompts'
import { Persona } from '../models/persona'
import { UserConfig } from '../models/config'
import { UsageEvent } from '../models/usage'

const enhanceBody = t.Object({
  text: t.String({ minLength: 1, maxLength: 10000 }),
  platform: t.String(),
  tone: t.Optional(t.String())
})

export function enhanceRoutes(auth: Auth) {
  return new Elysia({ prefix: '/api/enhance' })
    .use(sessionAuth(auth))

    // Health check — verifies Gemini connectivity
    .get('/health', async () => {
      try {
        const key = process.env.GEMINI_API_KEY
        if (!key || key === 'your-gemini-api-key') {
          return { status: 'error', message: 'GEMINI_API_KEY not configured' }
        }
        await callGemini('respond with just the word ok', 0)
        return { status: 'ok' }
      } catch (e: any) {
        return { status: 'error', message: e.message || 'Gemini unreachable' }
      }
    })

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
        const prompt = buildEnhancePrompt(platform, tone, defaultPersona?.systemPrompt || null, body.text)

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
            403: 'AI service unavailable. Check your GEMINI_API_KEY.',
            422: 'Content could not be generated. Try rewording.'
          }
          return new Response(JSON.stringify({
            error: messages[error.status] || error.message, code: 'GEMINI_ERROR'
          }), { status: error.status || 500 })
        }

        return new Response(JSON.stringify({
          error: 'Enhancement failed. Please try again.', code: 'SERVER_ERROR'
        }), { status: 500 })
      }
    }, {
      auth: true,
      body: enhanceBody
    })
}

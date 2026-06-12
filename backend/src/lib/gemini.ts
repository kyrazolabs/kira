const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export async function callGemini(prompt: string, temperature = 0.8): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 1024, topP: 0.95 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    })
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const status = response.status
    if (status === 429) throw new GeminiError(429, 'Rate limited. Please wait a moment.')
    if (status === 403) throw new GeminiError(403, 'AI service unavailable. Check API key.')
    throw new GeminiError(status, text || 'AI service error')
  }

  const data = await response.json() as any

  if (!data.candidates?.length) {
    const reason = data.promptFeedback?.blockReason || 'unknown'
    throw new GeminiError(422, `Content blocked: ${reason}`)
  }

  return (data.candidates[0]?.content?.parts?.[0]?.text || '').trim()
}

export class GeminiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'GeminiError'
  }
}

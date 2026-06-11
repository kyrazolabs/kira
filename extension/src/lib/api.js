// Gemini 2.0 Flash API client
// Called exclusively from the background service worker

import { buildPrompt } from './prompts.js'
import { getStored } from '../utils/storage.js'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
const DEFAULT_API_KEY = '' // Bundled key placeholder — set via environment or post-build injection

export async function enhanceText({ text, platform, tone }) {
  const apiKey = await getStored('apiKey') || DEFAULT_API_KEY

  if (!apiKey) {
    throw new Error('No API key configured. Add one in extension options.')
  }

  if (!text || !text.trim()) {
    throw new Error('No text provided to enhance.')
  }

  const prompt = buildPrompt(platform, tone, text)

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
          topP: 0.95
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      })
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new APIError(response.status, errorBody)
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      const blockReason = data.promptFeedback?.blockReason || 'unknown'
      throw new APIError(422, `Content blocked: ${blockReason}`)
    }

    const content = data.candidates[0]?.content?.parts?.[0]?.text || ''
    return content.trim()
  } catch (error) {
    if (error instanceof APIError) throw error

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new APIError(0, 'Network error. Check your internet connection.')
    }

    throw error
  }
}

export class APIError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'APIError'
    this.status = status
  }

  get userMessage() {
    if (this.status === 429) return 'Too many requests. Please wait a moment and try again.'
    if (this.status === 403) return 'API key is invalid or expired. Check your settings.'
    if (this.status === 422) return 'Content could not be generated. Try rewording your text.'
    if (this.status === 0) return 'Network error. Check your connection and try again.'
    return `Something went wrong (${this.status}). Please try again.`
  }
}

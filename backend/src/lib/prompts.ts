// Shared prompt rules — sync with extension/src/lib/prompts.js

export const TONES: Record<string, { instruction: string; label: string }> = {
  casual: {
    instruction: 'Rewrite this in a casual, conversational tone. Keep it short and punchy.',
    label: 'Casual'
  },
  professional: {
    instruction: 'Rewrite this professionally. Clear, confident, no fluff.',
    label: 'Professional'
  },
  engaging: {
    instruction: 'Rewrite this to maximize engagement. Hook first, emotional language, strong call to action.',
    label: 'Engaging'
  }
}

export const PLATFORM_RULES: Record<string, string> = {
  twitter: 'Keep under 280 characters. Use line breaks for readability. One strong hook, one punchline. No hashtag spam (max 1).',
  linkedin: 'Tell a story in 3 short paragraphs. Start with a bold claim or personal anecdote. End with a thought-provoking question. Avoid corporate jargon.',
  reddit: 'Be direct and genuinely valuable. No marketing speak whatsoever. No self-promotion. Write like a smart friend giving advice. Format: quick answer first, then details.',
  threads: 'Conversational tone, like texting a close friend. Short lines. One thought per post. No corporate tone.',
  generic: 'Make it clear, concise, and engaging. Remove filler words. Keep the original meaning.'
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'X / Twitter', linkedin: 'LinkedIn', reddit: 'Reddit',
  threads: 'Threads', generic: 'the web'
}

export function buildEnhancePrompt(platform: string, tone: string, personaPrompt: string | null, text: string): string {
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.generic
  const toneConfig = TONES[tone] || TONES.casual
  const label = PLATFORM_LABELS[platform] || PLATFORM_LABELS.generic

  const base = personaPrompt || [
    `You are an expert content writer for ${label}.`,
    '',
    rules,
    '',
    toneConfig.instruction
  ].join('\n')

  return [base, '', 'Original text:', '"""', text, '"""', '',
    'Return ONLY the enhanced text — no explanations, no quotes around it.'].join('\n')
}

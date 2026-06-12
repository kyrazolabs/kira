// Platform-aware prompt builder — the core IP
// SYNCED: Keep in sync with backend/src/lib/prompts.ts

const TONES = {
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

const PLATFORM_RULES = {
  twitter: 'Keep under 280 characters. Use line breaks for readability. One strong hook, one punchline. No hashtag spam (max 1 hashtag if natural).',
  linkedin: 'Tell a story in 3 short paragraphs. Start with a bold claim or personal anecdote. End with a thought-provoking question. Avoid corporate jargon. No emojis unless it fits a professional personal brand.',
  reddit: 'Be direct and genuinely valuable. No marketing speak whatsoever. No self-promotion. Write like a smart friend giving unfiltered advice. Format: quick answer or punchline first, then supporting details. Sound human.',
  threads: 'Conversational tone, like texting a close friend. Short lines. One thought per post. No corporate tone. Authentic and slightly raw.',
  generic: 'Make it clear, concise, and engaging. Remove filler words. Keep the original meaning but make it sharper.'
}

export function buildPrompt(platform, tone, text) {
  const toneConfig = TONES[tone] || TONES.casual
  const rules = PLATFORM_RULES[platform] || PLATFORM_RULES.generic

  return [
    `You are an expert content writer for ${platformLabel(platform)}.`,
    '',
    rules,
    '',
    toneConfig.instruction,
    '',
    'Original text:',
    '"""',
    text,
    '"""',
    '',
    'Return ONLY the enhanced text — no explanations, no quotes around it.'
  ].join('\n')
}

function platformLabel(platform) {
  const labels = {
    twitter: 'X / Twitter',
    linkedin: 'LinkedIn',
    reddit: 'Reddit',
    threads: 'Threads',
    generic: 'the web'
  }
  return labels[platform] || labels.generic
}

export { TONES, PLATFORM_RULES }

# Spec: Content Enhancer — Browser Extension

## Objective

A Chrome Extension (Manifest V3) that enhances writing in any text field on social platforms using Gemini 2.0 Flash AI. One click, platform-aware, inline. $4.99/month.

**User stories:**
- As a user on X, I select my draft text, click the sparkle button, and get a punchy, hook-first rewrite in ~1.5s
- As a user on LinkedIn, I write a post, press Ctrl+Shift+E, and get a 3-paragraph story with a bold opening
- As a user on Reddit, I click enhance and get a direct, valuable rewrite without marketing speak
- As a free-tier user, I get 10 enhancements/day on X/LinkedIn/Reddit with Casual tone
- As a Pro user ($4.99/mo), I get unlimited enhancements across all platforms with all 3 tones

**What we're NOT building in v1:** AI replies, thread generation, hashtag suggestions, image captions, analytics, scheduling, multi-language, custom prompts, team features, mobile support.

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Platform | Chrome Extension Manifest V3 | latest |
| Language | JavaScript (ES2022+) | — |
| Bundler | esbuild | ^0.24 |
| AI API | Gemini 2.0 Flash (free tier) | v1beta |
| Auth/Storage | chrome.storage.local + chrome.storage.sync | — |
| Payments | Stripe (webhook → license activation) | — |
| Linting | ESLint | ^9 |
| Testing | Vitest + jsdom + @anthropic-ai/sdk mocks | ^2 |
| Design System | Raycast dark-canvas (DESIGN.md) | — |

## Commands

```bash
# Development
cd content-enhancer && npm run dev          # Watch + rebuild on changes

# Build
cd content-enhancer && npm run build        # Production bundle

# Test
cd content-enhancer && npm test             # Run all tests
cd content-enhancer && npm test -- --coverage  # With coverage

# Lint
cd content-enhancer && npm run lint         # ESLint check
cd content-enhancer && npm run lint -- --fix # Auto-fix

# Type check (if TS migration happens later)
cd content-enhancer && npx tsc --noEmit
```

## Project Structure

```
content-enhancer/
├── manifest.json                  # Extension manifest (MV3)
├── package.json
├── esbuild.config.mjs             # Build config
├── src/
│   ├── content.js                 # Content script — injected on all pages
│   ├── background.js              # Service worker — API calls + auth
│   ├── popup/
│   │   ├── popup.html             # Extension popup UI
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html           # Settings page (API key, license)
│   │   ├── options.js
│   │   └── options.css
│   ├── lib/
│   │   ├── platforms.js           # Platform detection + selectors
│   │   ├── prompts.js             # Per-platform + per-tone prompts
│   │   ├── api.js                 # Gemini API client
│   │   └── license.js             # License key validation
│   ├── ui/
│   │   ├── button.js              # Floating enhance button (injected)
│   │   ├── diff.js                # Original vs enhanced view (injected)
│   │   └── toast.js               # Success/error notifications (injected)
│   └── utils/
│       ├── storage.js             # chrome.storage wrapper
│       ├── dom.js                 # DOM selectors for each platform
│       └── design-tokens.js       # DESIGN.md tokens as CSS variables + JS constants
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/
│   ├── unit/
│   │   ├── platforms.test.js
│   │   ├── prompts.test.js
│   │   ├── license.test.js
│   │   └── storage.test.js
│   ├── integration/
│   │   ├── api.test.js
│   │   └── background.test.js
│   └── setup.js                   # Test environment setup (jsdom, chrome API mocks)
└── README.md
```

## Code Style

```javascript
// Prefer named exports
export function detectPlatform(url) {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (platform.match(url)) return { key, ...platform };
  }
  return { key: 'generic', ...PLATFORMS.generic };
}

// Use async/await, never raw Promise chains
export async function enhanceText({ text, platform, tone }) {
  const prompt = buildPrompt(platform, tone, text);
  const response = await callGemini({ prompt, maxTokens: 1024 });
  return response.trim();
}

// chrome.storage wrapper pattern
export async function getStored(key, defaultValue) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? defaultValue;
}
```

**Conventions:**
- 2-space indentation
- Single quotes for strings
- No semicolons (ASI style)
- No trailing commas
- `camelCase` for variables/functions, `UPPER_SNAKE` for constants
- No comments unless the code is genuinely surprising
- One export per module unless functions are tightly coupled
- Vanilla DOM manipulation — no framework

## Testing Strategy

**Framework:** Vitest with jsdom environment for DOM testing, `chrome` API mocks.

**Coverage expectations:**
- Unit tests: `lib/`, `utils/` modules — 90%+ coverage
- Integration tests: API client (mock Gemini responses), background message routing
- No E2E tests in v1 (requires real browser + Gemini key)

**Test locations:**
```
tests/unit/        → Pure logic: platforms, prompts, license, storage
tests/integration/ → API client with mocked fetch, background message routing
```

**Key test patterns:**
```javascript
// Platform detection
describe('detectPlatform', () => {
  it('detects X/Twitter from x.com URL', () => {
    const url = new URL('https://x.com/compose/post');
    expect(detectPlatform(url).key).toBe('twitter')
  })
  it('falls back to generic for unknown domains', () => {
    const url = new URL('https://example.com');
    expect(detectPlatform(url).key).toBe('generic')
  })
})

// Prompt building
describe('buildPrompt', () => {
  it('includes platform-specific rules for Twitter', () => {
    const prompt = buildPrompt('twitter', 'casual', 'Hello world')
    expect(prompt).toContain('Keep under 280 characters')
  })
  it('returns only enhanced text directive', () => {
    const prompt = buildPrompt('generic', 'professional', 'test')
    expect(prompt).toContain('Return ONLY the enhanced text')
  })
})
```

## Boundaries

**Always do:**
- Run `npm test` before committing
- Follow naming conventions from Code Style section
- Validate user input (text length, API key presence) before API calls
- Use chrome.storage.local for sensitive data (API keys, license keys)
- Apply DESIGN.md tokens (colors, spacing, typography) — never use arbitrary values
- Enable `font-feature-settings: "calt", "kern", "liga", "ss03"` on all UI
- Handle error states (network failure, API rate limits, quota exceeded)
- Keep the content script lightweight — no heavy computations in injected code

**Ask first:**
- Adding new npm dependencies beyond esbuild and vitest
- Changing the manifest.json permissions (host_permissions, content_scripts matches)
- Modifying the AI prompt strategy (it's the core IP)
- Changing the pricing model or license validation approach
- Adding support for a new platform not in IDEA.md

**Never do:**
- Commit API keys, license secrets, or `.env` files to git
- Log user text content to console (privacy)
- Use `innerHTML` with unsanitized data (XSS risk)
- Ship the extension without the Chrome Web Store review checklist complete
- Expose Gemini API key in content scripts (must stay in background service worker)
- Use drop shadows in UI (DESIGN.md: elevation from surface ladder, not shadows)
- Introduce a light mode (DESIGN.md: dark-only system)

## Success Criteria

- [ ] Sparkle button appears on X, LinkedIn, Reddit, Threads text inputs within 500ms of focus
- [ ] Enhance flow completes end-to-end in < 3s (click → enhanced text displayed)
- [ ] Keyboard shortcut Ctrl+Shift+E works on all 4 supported platforms
- [ ] Free tier enforces 10 enhancements/day with a counter visible in popup
- [ ] Pro license validation works offline with no phone-home on every request
- [ ] All 3 tones (Casual, Professional, Engaging) produce distinctly different outputs per platform
- [ ] Diff view allows Accept / Retry / Keep Original / Copy
- [ ] Error states visible: network failure, API quota exceeded, invalid license
- [ ] Popup, options page, and injected UI all match DESIGN.md Raycast dark-canvas system
- [ ] Zero console errors in production build
- [ ] All unit and integration tests pass with 90%+ coverage on lib/ and utils/

## Decisions

1. **API Key:** Bundled free-tier key — ships with the extension. Simplest UX, no setup friction.
2. **Keyboard Shortcut:** Hardcoded `Ctrl+Shift+E` as `suggested_key` in manifest. Users can override in `chrome://extensions/shortcuts`.
3. **Analytics:** Anonymous, opt-in analytics pings to track enhancement counts and platform usage. Enabled by default, can be disabled in options. Uses a lightweight beacon API.

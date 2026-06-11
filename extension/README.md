# Kira — Content Enhancer — Chrome Extension

AI-powered content enhancement for social platforms. One click, platform-aware, inline.

## Quick Start

```bash
npm install
npm test        # 91 tests
npm run build   # Production bundle in dist/
```

Load the `dist/` directory as an unpacked extension in `chrome://extensions`.

## Architecture

```
src/
├── content.js          # Content script — injected into pages
├── background.js       # Service worker — Gemini API + rate limiting + license
├── lib/
│   ├── platforms.js    # X, LinkedIn, Reddit, Threads detection
│   ├── prompts.js      # Platform-aware AI prompts (core IP)
│   ├── api.js          # Gemini 2.0 Flash client
│   └── license.js      # Hash-based license validation
├── ui/
│   ├── styles.js       # Base styles (DESIGN.md Raycast dark-canvas)
│   ├── button.js       # Floating sparkle enhance button
│   ├── diff.js         # Original vs enhanced comparison view
│   └── toast.js        # Non-intrusive notifications
├── utils/
│   ├── design-tokens.js # DESIGN.md tokens → CSS vars + JS constants
│   ├── storage.js       # chrome.storage wrapper
│   ├── dom.js           # DOM selection + text manipulation
│   └── analytics.js     # Anonymous opt-in telemetry
├── popup/              # Extension popup (tone selector, paste-to-enhance)
└── options/            # Settings page (API key, license, analytics)
```

## Supported Platforms

| Platform | Selector | Max Length |
|----------|----------|------------|
| X / Twitter | `[data-testid="tweetTextarea_0"]` | 280 |
| LinkedIn | `.ql-editor[contenteditable]` | 3000 |
| Reddit | `textarea, [contenteditable]` | 10000 |
| Threads | `[contenteditable][role="textbox"]` | 500 |
| Generic | `textarea, [contenteditable]` | 10000 |

## Tones

- **Casual** — Conversational, short, punchy
- **Professional** — Clear, confident, no fluff
- **Engaging** — Hook-first, emotional, strong CTA

## Design System

Built to the [DESIGN.md](../../DESIGN.md) Raycast dark-canvas specification:
- Dark-only surface mode (#07080a canvas, #0d0d0d surface, #101111 elevated)
- White CTA pill (#ffffff) — the universal primary action
- Inter typography with ss03 stylistic set enabled site-wide
- Hairline 1px borders (#242728) — no drop shadows
- Surface-color ladder for elevation (not shadows)

## Pricing

| Tier | Price | Enhancements | Platforms | Tones |
|------|-------|-------------|-----------|-------|
| Free | $0 | 10/day | 4 platforms | Casual only |
| Pro | $4.99/mo | Unlimited | All + generic | All 3 |

## License

MIT

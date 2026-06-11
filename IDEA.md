# Content Enhancer — Browser Extension MVP Plan

> **Stack:** Chrome Extension (Manifest V3) + Gemini 2.0 Flash (free tier)  
> **Goal:** A browser extension that enhances your writing on any social platform — one click, platform-aware, $4.99/month

---

## The Problem

Everyone posts. Almost nobody writes well.

- **On X:** Your tweet is boring. You stare at it for 5 minutes, delete it, try again.
- **On LinkedIn:** You sound like a robot. "I'm thrilled to announce..." — nobody reads that.
- **On Reddit:** You write a novel. Gets 2 upvotes. Someone else writes 2 sentences. 500 upvotes.

Existing tools are either:
- **Too broad** (Grammarly fixes grammar, not engagement)
- **Too narrow** (TweetAI works only on X)
- **Too expensive** (Jasper = $49/month, Monica = $10/month)
- **Platform-ignorant** (they don't know a LinkedIn post needs different structure than a tweet)

**The gap:** A tool that knows WHERE you're posting, WHAT works there, and enhances your content accordingly — inline, one click, no copy-paste.

---

## MVP Scope — What To Build (3 Weeks)

### Core Features (v1)

| # | Feature | Why |
|---|---|---|
| 1 | **Platform detection** | Auto-detect X, LinkedIn, Reddit, Threads, any textarea |
| 2 | **Inline enhance button** | Small sparkle icon appears near cursor when typing |
| 3 | **One-click enhance** | Select text (or all text in field), click enhance, get result |
| 4 | **Platform-aware prompts** | Different rewriting strategy per platform |
| 5 | **3 tone options** | Casual, Professional, Engaging (per-platform defaults) |
| 6 | **Keyboard shortcut** | Ctrl+Shift+E to enhance selected text instantly |
| 7 | **Diff view** | Show original vs enhanced side-by-side, click to accept |

### What NOT to Build in v1

- ❌ AI reply generation (just content enhancement for now)
- ❌ Thread/post series generation
- ❌ Hashtag suggestion
- ❌ Image/video caption generation
- ❌ Analytics (which posts performed better)
- ❌ Scheduling / auto-posting
- ❌ Multi-language translation
- ❌ Custom AI prompts per user
- ❌ Team/shared prompt libraries
- ❌ Mobile support (desktop Chrome only)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Extension framework** | Chrome Manifest V3 | Works on Chrome, Edge, Brave, Arc, Opera — 90% of desktop users |
| **Content script** | Vanilla JS (no framework) | Lightweight, injected into every page, no React overhead |
| **AI API** | Gemini 2.0 Flash | **Free tier** = 1,500 requests/day. $0 at launch. |
| **Backend** | None | Extension calls Gemini API directly. Zero infra cost. |
| **Auth / License** | Simple key check | Hash-based offline validation, stored in `chrome.storage.local` |
| **Storage** | `chrome.storage.sync` | Settings sync across user's devices |
| **Build** | Plain JS + esbuild (optional) | No framework needed. One `content.js`, one `background.js`. |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Chrome Extension                    │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │   Content Script      │  │   Service Worker     │ │
│  │   (injected per tab)  │  │   (background)       │ │
│  │                       │  │                      │ │
│  │  - Detect platform    │  │  - API key storage   │ │
│  │  - Find text inputs   │  │  - Call Gemini API   │ │
│  │  - Inject UI button   │  │  - Rate limiting     │ │
│  │  - Show diff/enhance  │  │  - License check     │ │
│  │  - Handle clicks      │  │                      │ │
│  └──────┬───────────────┘  └──────┬───────────────┘ │
│         │  chrome.runtime         │                  │
│         │  .sendMessage()         │                  │
│         └─────────────────────────┘                  │
│                                                      │
│  ┌──────────────────────┐                           │
│  │   Popup (icon click)  │                           │
│  │                       │                           │
│  │  - Tone selector      │                           │
│  │  - License status     │                           │
│  │  - Usage count        │                           │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
         │
         │  HTTPS
         ▼
┌─────────────────┐
│  Gemini 2.0     │
│  Flash API      │
│  (free tier)    │
└─────────────────┘
```

---

## Project Structure

```
content-enhancer/
├── manifest.json               # Extension manifest (Manifest V3)
├── src/
│   ├── content.js              # Content script — injected on all pages
│   ├── background.js            # Service worker — API calls + auth
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   ├── popup.js
│   │   └── popup.css
│   ├── lib/
│   │   ├── platforms.js         # Platform detection + selectors
│   │   ├── prompts.js           # Per-platform + per-tone prompts
│   │   ├── api.js               # Gemini API client
│   │   └── license.js           # License key validation
│   ├── ui/
│   │   ├── button.js            # Floating enhance button
│   │   ├── diff.js              # Original vs enhanced view
│   │   └── toast.js             # Success/error notifications
│   └── utils/
│       ├── storage.js           # chrome.storage wrapper
│       └── dom.js               # DOM selectors for each platform
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── package.json
└── README.md
```

---

## Platform Detection Logic

```javascript
// platforms.js
const PLATFORMS = {
  twitter: {
    match: (url) => /twitter\.com|x\.com/.test(url.hostname),
    inputSelector: '[data-testid="tweetTextarea_0"], [contenteditable="true"][role="textbox"]',
    name: 'X / Twitter',
    maxLength: 280, // or 25000 for X Premium
  },
  linkedin: {
    match: (url) => /linkedin\.com/.test(url.hostname),
    inputSelector: '.ql-editor[contenteditable="true"], [role="textbox"][contenteditable="true"]',
    name: 'LinkedIn',
    maxLength: 3000,
  },
  reddit: {
    match: (url) => /reddit\.com/.test(url.hostname),
    inputSelector: 'textarea, [contenteditable="true"]',
    name: 'Reddit',
    maxLength: 10000,
  },
  threads: {
    match: (url) => /threads\.net/.test(url.hostname),
    inputSelector: '[contenteditable="true"][role="textbox"], textarea',
    name: 'Threads',
    maxLength: 500,
  },
  generic: {
    match: () => true, // fallback for any textarea
    inputSelector: 'textarea, [contenteditable="true"]',
    name: 'Web',
    maxLength: 10000,
  },
};
```

---

## AI Prompts — What Makes This Different

The core IP: **platform-aware prompting.** Each platform gets different rewriting rules.

```javascript
// prompts.js
function buildPrompt(platform, tone, text) {
  const baseInstruction = {
    casual: "Rewrite this in a casual, conversational tone. Keep it short and punchy.",
    professional: "Rewrite this professionally. Clear, confident, no fluff.",
    engaging: "Rewrite this to maximize engagement. Hook first, emotional language, strong CTA.",
  }[tone];

  const platformRules = {
    twitter: "Keep under 280 characters. Use line breaks for readability. One strong hook, one punchline. No hashtag spam (max 1).",
    linkedin: "Tell a story in 3 short paragraphs. Start with a bold claim or personal anecdote. End with a question. No emojis unless it fits a professional brand.",
    reddit: "Be direct and valuable. No marketing speak. No self-promotion. Write like a smart friend giving advice. Format: quick answer first, then details.",
    threads: "Conversational, like texting a friend. Short lines. One thought per post. No corporate tone.",
    generic: "Make it clear, concise, and engaging. Remove filler words. Keep the original meaning.",
  };

  return `
You are an expert ${platform} content writer.

${platformRules[platform] || platformRules.generic}

${baseInstruction}

Original text:
"""
${text}
"""

Return ONLY the enhanced text — no explanations, no quotes around it.
`;
}
```

---

## UI Components (What the User Sees)

### 1. The Sparkle Button
```
┌──────────────────────────────────┐
│  [What's on your mind?]      ✨  │
│                              │    │
│  The floating sparkle button │    │
│  appears when the user's     │    │
│  cursor is in a text input.  │    │
│                              │    │
│  Click → enhance all text.   │    │
└──────────────────────────────────┘
```

### 2. After Enhancement — Diff View
```
┌──────────────────────────────────────────────┐
│  ORIGINAL                    ENHANCED        │
│  ┌─────────────────────┐ ┌─────────────────┐ │
│  │ I am writing to     │ │ I built a tool   │ │
│  │ announce that I     │ │ that turns audio │ │
│  │ have built a tool   │ │ into text.       │ │
│  │ that converts audio │ │ Offline. $10.    │ │
│  │ files into text     │ │ Here's why:      │ │
│  │ documents. It works │ │                  │ │
│  │ offline... (boring) │ │ (punchy, hook)   │ │
│  └─────────────────────┘ └─────────────────┘ │
│                                                │
│  [✓ Accept Enhanced]  [✗ Keep Original]       │
│  [🔄 Try Again]  [📋 Copy]                    │
└──────────────────────────────────────────────┘
```

### 3. Popup (when clicking extension icon)
```
┌──────────────────────────┐
│  ✨ Content Enhancer      │
│                          │
│  Tone: [Casual     ▼]    │
│  Platform: X/Twitter      │
│                          │
│  Today: 7 / 10 free      │
│                          │
│  ┌────────────────────┐  │
│  │ Paste text here...  │  │
│  │                     │  │
│  │              ✨     │  │
│  └────────────────────┘  │
│                          │
│  [Upgrade to Pro — $4.99/mo]  │
└──────────────────────────┘
```

---

## Build Order (Week-by-Week)

### Week 1: Extension Skeleton + Platform Detection

- [ ] Create Manifest V3 extension scaffold
- [ ] Build `platforms.js` — URL matching + input selectors for 4 platforms
- [ ] Build `content.js` — detects platform, finds text inputs
- [ ] Inject floating sparkle button near active text input
- [ ] Handle focus/blur — show/hide button appropriately
- [ ] Test on: twitter.com, linkedin.com, reddit.com, threads.net
- [ ] **Deliverable:** Button appears when you start typing on any of 4 platforms

### Week 2: Gemini API Integration + Enhancement

- [ ] Get Gemini API key from Google AI Studio (free)
- [ ] Build `api.js` — call Gemini 2.0 Flash, handle streaming
- [ ] Build `prompts.js` — platform-aware prompts for 4 platforms × 3 tones
- [ ] Build `background.js` — service worker relays content script → Gemini
- [ ] Wire: click sparkle → send text to background → get enhanced text back
- [ ] Build diff view: show original vs enhanced side-by-side
- [ ] Accept / Retry / Keep Original buttons
- [ ] **Deliverable:** Full enhance flow works on X/Twitter

### Week 3: Polish + License + Publish

- [ ] Build keyboard shortcut: `Ctrl+Shift+E` to enhance selected text
- [ ] Build popup UI: tone selector, paste-to-enhance, usage counter
- [ ] Build license system: hash-based offline key validation
- [ ] Free tier limit: 10 enhancements/day, count in storage
- [ ] Error handling: API rate limits, network errors, unsupported inputs
- [ ] Build options page: API key input, license key input
- [ ] Package and submit to Chrome Web Store
- [ ] Create landing page: single HTML page with demo GIF
- [ ] Price: **$4.99/month or $39/year** — Stripe subscription → activate license
- [ ] **Deliverable:** Live on Chrome Web Store, ready for users

---

## Why NOT One-Time Purchase

This product has **recurring API costs per user.** Every time someone clicks "Enhance," you pay the AI provider. One-time pricing = you lose money on active users.

| One-Time Model | Monthly Model |
|---|---|
| User pays $9 once, enhances 10x/day × 365 days = 3,650 API calls | User pays $4.99/mo × 12 = $59.88/year |
| You burn ~$0.36/user/year on API costs (at $0.0001/call) | Revenue covers API costs + healthy margin |
| 1,000 users = you lose money keeping the lights on | 1,000 users = $4,990 MRR, ~$150/mo API cost = 97% margin |

---

## Monetization

| Tier | Price | Enhancements | Platforms | Tones |
|---|---|---|---|---|
| **Free** | $0 | 10/day | X + LinkedIn + Reddit | Casual only |
| **Pro** | **$4.99/month** | Unlimited | All 4 + generic | All 3 (Casual, Professional, Engaging) |
| **Pro Annual** | **$39/year** ($3.25/mo) | Unlimited | All 4 + generic | All 3 |

**Pricing psychology:**
- Half the price of Monica ($9.90/mo)
- Less than Grammarly Premium ($12/mo)
- A fraction of Jasper ($49/mo)
- $4.99 is impulse-buy territory — "less than a coffee"
- Annual discount hooks long-term users

**License system:** Stripe subscription → webhook activates license → extension checks `license` key in `chrome.storage` → no phone-home needed except on payment events.

---

## Revenue Math

| Stage | Users | Conversion | Pro Users | MRR | Annual |
|---|---|---|---|---|---|
| Launch (m1) | 500 | 5% | 25 | $124 | $1,488 |
| Traction (m3) | 2,000 | 5% | 100 | $499 | $5,988 |
| Growth (m6) | 5,000 | 5% | 250 | $1,247 | $14,970 |
| Scale (m12) | 15,000 | 5% | 750 | $3,742 | $44,910 |
| Optimized (m18) | 30,000 | 7% | 2,100 | $10,479 | $125,748 |

**API cost at scale:**
- 750 Pro users × 20 enhancements/day = 15,000 calls/day
- GPT-4o-mini: $0.0001/call × 15,000 = $1.50/day = $45/month
- Even at 2,100 Pro users: ~$126/month API cost
- Margin stays above 95% at all scales

---

## Competition Recap

| Tool | Price | Platforms | Monthly? | Platform-Aware? |
|---|---|---|---|---|
| Grammarly | $12/mo | Any text | ✅ | ❌ (grammar only) |
| Monica | $9.90/mo | Any text | ✅ | ❌ (generic rewrite) |
| HARPA | $12/mo | Any text | ✅ | ❌ (automation) |
| Jasper | $49/mo | Chrome ext | ✅ | 🟡 (marketing teams) |
| TweetAI | Free/? | X only | ? | ✅ (1 platform) |
| **Your Extension** | **$4.99/mo** | **4+ platforms** | ✅ | ✅ (all platforms) |

---

## What Success Looks Like (Week 3)

You're on X, writing a tweet. It's boring. You select the text, press `Ctrl+Shift+E`. 1.5 seconds later, the right panel shows a punchy, hook-first version with line breaks. You click "Accept." Tweet sent. 10x more engagement than your usual posts.

You're on Reddit, drafting a comment. You click the sparkle button. The extension rewrites it: direct, valuable, no fluff. You post it. 500 upvotes.

Someone DMs you: *"What extension is that? I've been looking for something like this forever."*

That's it. That's the MVP.

---

## Common Pitfalls

| Mistake | Fix |
|---|---|
| "Let's support all 8 platforms in v1" | Start with 4: X, LinkedIn, Reddit, Threads. Add Instagram/Facebook/TikTok/YouTube in v2. |
| "We need our own AI model" | No. Gemini free tier is your unfair advantage. Switch to paid models only when forced. |
| "Add reply generation too" | v2. Content enhancement alone is a full product. |
| "Make it a web app too" | No. Browser extension IS the product. Being inline, where you type, is the entire value prop. |
| "Build a fancy landing page" | Ship the extension first. A 60-second demo GIF on the Chrome Web Store is enough. |
| "Wait until it's perfect" | Chrome Web Store review takes 2-3 days. Submit on Day 14, iterate after approval. |

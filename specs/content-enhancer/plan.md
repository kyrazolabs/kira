# Implementation Plan: Content Enhancer Browser Extension

## Overview

Build a Chrome Extension (Manifest V3) that injects a floating "enhance" button into text inputs on social platforms (X, LinkedIn, Reddit, Threads). Clicking it sends the user's text to Gemini 2.0 Flash, applies platform-aware rewriting, and shows the result in an inline diff view. 3-week build split into 5 phases.

## Architecture Decisions

- **Content script → Service worker → Gemini:** Content script detects platform and handles UI injection. Service worker holds the API key, calls Gemini, enforces rate limits, validates licenses. Content scripts never see the API key.
- **No build framework:** Plain JS modules bundled by esbuild. IIFE bundles for content scripts (isolated per tab), ES module for background service worker.
- **CSS via injected `<style>` tags:** No separate CSS files in content scripts. Inline styles built from DESIGN.md tokens to avoid CSP issues and file bloat.
- **License validation:** Hash-based offline check. Stripe webhook generates license key → user enters key in options → sha256(license + email) compared against stored hash. No phone-home on every request.
- **Analytics beacon:** Simple `navigator.sendBeacon()` to a lightweight endpoint. Anonymous UUID, opt-in only, payload: `{ event, platform, tone, timestamp }`.
- **DESIGN.md adherence:** All UI (popup, options, injected button/diff/toast) uses dark-canvas tokens: `#07080a` canvas, `#0d0d0d` surface, `#101111` surface-elevated, `#ffffff` primary CTA, Inter+ss03, hairline borders (`#242728`), no drop shadows.

## Dependency Graph

```
design-tokens.js (CSS vars + JS constants)
    │
    ├── storage.js (chrome.storage wrapper)
    │       │
    │       ├── license.js (key validation)
    │       │       │
    │       │       └── popup.js / options.js (license status display)
    │       │
    │       └── background.js (reads API key, license, settings)
    │
    ├── platforms.js (URL matching + selectors)
    │       │
    │       ├── dom.js (DOM helpers using platform selectors)
    │       │       │
    │       │       └── button.js / diff.js / toast.js (injected UI)
    │       │
    │       └── content.js (orchestrates injection + messaging)
    │
    └── prompts.js (per-platform + per-tone prompt builder)
            │
            └── api.js (Gemini client, uses prompts)
                    │
                    └── background.js (calls api.js)
```

## Task List

### Phase 1: Foundation — Project Scaffold + Design Tokens + Storage

- [ ] **Task 1: Initialize project with esbuild + manifest + assets**
  - Acceptance: `npm run build` produces `dist/` with manifest + bundled JS. Extension loads in `chrome://extensions` unpacked.
  - Verify: `npm run build` succeeds, extension icon appears in toolbar
  - Files: `package.json`, `esbuild.config.mjs`, `manifest.json`, `assets/`
  - Dependencies: None
  - Scope: Medium

- [ ] **Task 2: Implement design-tokens.js — CSS variables + JS constants from DESIGN.md**
  - Acceptance: Single source of truth for all colors, typography, spacing, radii. Both CSS (for popup/options) and JS (for injected UI inline styles).
  - Verify: `npm test -- --grep "design-tokens"` — all token values match DESIGN.md
  - Files: `src/utils/design-tokens.js`, `tests/unit/design-tokens.test.js`
  - Dependencies: None
  - Scope: Small

- [ ] **Task 3: Implement storage.js — chrome.storage wrapper**
  - Acceptance: `getStored(key, default)`, `setStored(key, value)`, `getSettings()`, `updateSettings(patch)`. Handles chrome.storage.local for keys/license, chrome.storage.sync for settings.
  - Verify: `npm test -- --grep "storage"` — all read/write/sync/default tests pass
  - Files: `src/utils/storage.js`, `tests/unit/storage.test.js`
  - Dependencies: None (mock chrome API in tests)
  - Scope: Small

### Checkpoint: Foundation
- [ ] `npm run build` succeeds
- [ ] `npm test` passes for all Unit tests
- [ ] Extension icon visible in toolbar (unpacked load)
- [ ] Design tokens correct against DESIGN.md

### Phase 2: Core Logic — Platforms + Prompts + API Client

- [ ] **Task 4: Implement platforms.js — platform detection + selectors**
  - Acceptance: `detectPlatform(url)` returns correct platform for all 4 sites + generic fallback. Each platform has `.match()`, `.inputSelector`, `.name`, `.maxLength`.
  - Verify: `npm test -- --grep "platforms"` — all 4 platforms detected, generic fallback works, URL edge cases handled
  - Files: `src/lib/platforms.js`, `tests/unit/platforms.test.js`
  - Dependencies: None
  - Scope: Small

- [ ] **Task 5: Implement prompts.js — platform-aware prompt builder**
  - Acceptance: `buildPrompt(platform, tone, text)` returns a complete Gemini prompt with platform rules + tone instruction + original text. All 4 platforms × 3 tones produce distinctly different prompts.
  - Verify: `npm test -- --grep "prompts"` — verify prompt structure, platform rules, tone differentiation
  - Files: `src/lib/prompts.js`, `tests/unit/prompts.test.js`
  - Dependencies: None
  - Scope: Small

- [ ] **Task 6: Implement api.js — Gemini API client**
  - Acceptance: `callGemini({ prompt, maxTokens })` calls Gemini 2.0 Flash, returns text. Handles errors (rate limit, network, invalid key). Uses bundled API key from storage.
  - Verify: `npm test -- --grep "api"` — mock fetch, test success/error/timeout paths
  - Files: `src/lib/api.js`, `tests/integration/api.test.js`
  - Dependencies: Task 5 (prompts), Task 3 (storage for API key)
  - Scope: Medium

- [ ] **Task 7: Implement license.js — license key validation**
  - Acceptance: `validateLicense(key, email)` performs hash-based validation. `checkLicenseStatus()` reads from storage and returns `{ valid, tier, expiry }`. Free tier detection when no license present.
  - Verify: `npm test -- --grep "license"` — valid/invalid/expired/free tier states all tested
  - Files: `src/lib/license.js`, `tests/unit/license.test.js`
  - Dependencies: Task 3 (storage)
  - Scope: Small

### Checkpoint: Core Logic
- [ ] All 4 platform detection tests pass
- [ ] All 12 prompt combinations (4×3) verified
- [ ] API client handles all error states
- [ ] License validation works offline
- [ ] `npm test` all green, `npm run build` succeeds

### Phase 3: Background + Content Script Scaffold

- [ ] **Task 8: Implement background.js — service worker orchestration**
  - Acceptance: Listens for `ENHANCE_TEXT` messages, calls Gemini, enforces rate limits (10/day free, unlimited Pro), validates license, returns result. Handles `GET_SETTINGS`, `UPDATE_SETTINGS`, `VALIDATE_LICENSE`, `ANALYTICS_PING` messages.
  - Verify: `npm test -- --grep "background"` — test message routing, rate limiting, license gates
  - Files: `src/background.js`, `tests/integration/background.test.js`
  - Dependencies: Tasks 3, 6, 7
  - Scope: Medium

- [ ] **Task 9: Implement dom.js — DOM selector + mutation helpers**
  - Acceptance: `findActiveInput()` finds the focused text input. `getActivePlatform()` returns platform info for current page. `getInputText(input)` and `setInputText(input, text)` work across contenteditable and textarea.
  - Verify: Manual test: load on x.com, `findActiveInput()` returns the tweet composer. Load on generic page with textarea, works.
  - Files: `src/utils/dom.js`
  - Dependencies: Task 4 (platforms)
  - Scope: Small

- [ ] **Task 10: Implement content.js — content script orchestrator**
  - Acceptance: On page load, detects platform, injects UI (button + styles), sets up focus listeners, handles keyboard shortcut, manages message passing to background.
  - Verify: Load on x.com — sparkle button appears when textarea focused, disappears on blur
  - Files: `src/content.js`
  - Dependencies: Tasks 3, 4, 9
  - Scope: Medium

### Checkpoint: Skeleton Working
- [ ] Extension loads on x.com, linkedin.com, reddit.com, threads.net
- [ ] Content script detects platform correctly on each
- [ ] Message passing roundtrip works (content → background → content)
- [ ] Rate limiting enforced in background
- [ ] `npm test` all green, `npm run build` succeeds

### Phase 4: Injected UI — Button + Diff + Toast

- [ ] **Task 11: Implement button.js — floating sparkle button**
  - Acceptance: Button appears near focused text input. Shows sparkle icon (✨ or SVG). Click dispatches enhance. Keyboard shortcut Ctrl+Shift+E triggers enhance. Positioned absolute relative to the textarea.
  - Verify: Manual test on x.com — button visible on focus, hidden on blur, positioned correctly
  - Files: `src/ui/button.js`
  - Dependencies: Task 9 (dom), Task 10 (content)
  - Scope: Small

- [ ] **Task 12: Implement diff.js — original vs enhanced view**
  - Acceptance: Panel slides in showing original text (left) and enhanced text (right) side-by-side. 4 action buttons: Accept (replaces text), Retry (re-enhance), Keep Original (dismiss), Copy (copy enhanced to clipboard). Matches DESIGN.md styling (surface background, hairline borders, Inter+ss03).
  - Verify: Manual end-to-end test — type text on x.com, click sparkle, diff appears, click Accept → text replaces input
  - Files: `src/ui/diff.js`
  - Dependencies: Task 11 (button triggers it), Task 10 (content passes data)
  - Scope: Medium

- [ ] **Task 13: Implement toast.js — notification system**
  - Acceptance: Non-intrusive toast notifications for success ("Enhanced!"), error ("API quota exceeded"), info ("10/10 free enhancements used today"). 3s auto-dismiss. Matches DESIGN.md (surface-elevated bg, hairline border).
  - Verify: Trigger each toast type, verify styling, verify auto-dismiss
  - Files: `src/ui/toast.js`
  - Dependencies: Task 10 (content orchestrates)
  - Scope: Small

### Checkpoint: Full Enhance Flow
- [ ] Full flow works on X: focus → button appears → click → diff shows → accept → text replaced
- [ ] Keyboard shortcut Ctrl+Shift+E triggers enhance
- [ ] Toast notifications appear for success/error/quota
- [ ] UI matches DESIGN.md: dark canvas, surface ladder, hairline borders, Inter+ss03, no shadows
- [ ] `npm test` all green, `npm run build` succeeds

### Phase 5: Popup + Options + Analytics + Polish

- [ ] **Task 14: Implement popup UI (HTML + JS + CSS)**
  - Acceptance: Popup shows: tone selector (Casual/Professional/Engaging dropdown), current platform (detected from active tab), today's usage count ("7/10 free"), paste-to-enhance textarea with sparkle button, "Upgrade to Pro — $4.99/mo" link. All DESIGN.md styled (canvas bg, Inter+ss03, white CTA pill, hairline borders).
  - Verify: Click extension icon → popup opens, tone selector changes stored preference, usage count accurate, paste-to-enhance works
  - Files: `src/popup/popup.html`, `src/popup/popup.js`, `src/popup/popup.css`
  - Dependencies: Tasks 3, 4, 8
  - Scope: Medium

- [ ] **Task 15: Implement options page (HTML + JS + CSS)**
  - Acceptance: Options page shows: API key input (pre-filled with bundled key), license key input with validation status, analytics opt-in toggle, keyboard shortcut reference. DESIGN.md styled.
  - Verify: Open options page, enter license key, validation status updates, analytics toggle persists
  - Files: `src/options/options.html`, `src/options/options.js`, `src/options/options.css`
  - Dependencies: Tasks 3, 7, 8
  - Scope: Small

- [ ] **Task 16: Implement analytics beacon**
  - Acceptance: Anonymous UUID generated on first install. `navigator.sendBeacon()` pings on enhancement events (event type, platform, tone, timestamp). Respects opt-in toggle. No PII or content text sent.
  - Verify: `npm test -- --grep "analytics"` — beacon payload structure correct, opt-in/opt-out respected
  - Files: `src/utils/analytics.js`, `tests/unit/analytics.test.js`
  - Dependencies: Task 3 (storage for UUID + settings)
  - Scope: Small

- [ ] **Task 17: Final polish — error handling, CSP, accessibility**
  - Acceptance: All error states handled gracefully (no white screens). Content Security Policy configured. ARIA labels on all interactive injected elements. Keyboard navigation works for diff view actions.
  - Verify: Audit: test network offline, test rate limit hit, test on all 4 platforms, run axe-core on popup/options
  - Files: `manifest.json` (CSP), `src/ui/*.js` (ARIA), `src/popup/*`, `src/options/*`
  - Dependencies: All prior tasks
  - Scope: Medium

### Checkpoint: Complete
- [ ] All acceptance criteria from spec met
- [ ] Full test suite passes with 90%+ coverage on lib/ + utils/
- [ ] `npm run build` produces clean production bundle
- [ ] Extension loadable as unpacked, all features functional
- [ ] DESIGN.md compliance verified across all UI surfaces
- [ ] Ready for Chrome Web Store submission

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini free tier changes or is deprecated | High | Abstract API layer — swap to Claude/OpenAI with config change. Track Google AI announcements. |
| Content script conflict with site's JS | Medium | Use isolated IIFE, no global pollution, Shadow DOM for injected UI if needed |
| Chrome Web Store rejects for "single purpose" or AI content policy | High | Submit early (Week 2-3), iterate on feedback. Positioning: "writing assistant" not "AI content generator" |
| Platform DOM changes break selectors | Medium | Use multiple fallback selectors per platform. Generic textarea fallback always works. |
| Rate limit abuse (users share API key) | Low | Free tier 10/day cap enforced server-side in background. Pro keys are individual. |
| XSS via enhanced AI output | Medium | Text sanitization before injection. Enhanced text is plain text — never interpreted as HTML. |

## Parallelization Opportunities

- Tasks 4, 5, 7 can be built in parallel (no dependencies on each other)
- Tasks 11, 12, 13 can be built in parallel after Task 10
- Tasks 14, 15 can be built in parallel after their dependencies
- Unit tests can be written in parallel with implementation by a second agent

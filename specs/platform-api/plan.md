# Implementation Plan: Platform API + Dashboard

## Overview

Build a full-stack platform: Express backend with Better Auth (Google OAuth + MongoDB + Stripe + API Keys) and a React dashboard for managing API keys, AI personas, usage analytics, and subscriptions. DESIGN.md Raycast dark-canvas throughout.

## Architecture Decisions

- **Express ESM** — Using `"type": "module"` and `.ts` with `tsx` for dev
- **Better Auth on `/api/auth/*`** — handles all OAuth, sessions, Stripe webhooks, API key endpoints
- **Custom routes for `/api/config`, `/api/usage`** — Express routes behind session middleware
- **MongoDB** — single database with Better Auth collections + 3 custom collections (personas, usage_events, ai_configs)
- **Tailwind DESIGN.md theme** — extend `tailwind.config` with all color, typography, spacing, radius tokens from DESIGN.md
- **Vite proxy** — dashboard dev server proxies `/api` to backend, no CORS issues in dev
- **API key flow** — extension gets key from dashboard → sends as `Authorization: Bearer <key>` → validated by Better Auth API key plugin

## Task List

### Phase 1: Foundation — Monorepo + Backend Skeleton + Auth

- [ ] **Task 1: Initialize monorepo structure**
  - Acceptance: Root `package.json` with workspaces. `backend/` and `dashboard/` directories with `package.json`. ESLint + TypeScript shared config.
  - Verify: `npm install` from root installs all deps
  - Files: `package.json`, `backend/package.json`, `dashboard/package.json`, `tsconfig.base.json`
  - Dependencies: None
  - Scope: Medium

- [ ] **Task 2: MongoDB connection + Better Auth setup**
  - Acceptance: `db.ts` exports connected MongoDB client. `auth.ts` creates Better Auth instance with MongoDB adapter, Google OAuth, Stripe plugin, API Key plugin. `npx @better-auth/cli migrate` creates collections.
  - Verify: `GET /api/auth/ok` returns `{ status: "ok" }`
  - Files: `backend/src/db.ts`, `backend/src/auth.ts`, `backend/.env.example`
  - Dependencies: Task 1
  - Scope: Medium

- [ ] **Task 3: Express server + Better Auth mount**
  - Acceptance: Express app on port 3001. `toNodeHandler(auth)` mounted at `/api/auth/*`. CORS configured. `GET /api/auth/ok` works. Google OAuth sign-in flow works end-to-end.
  - Verify: `curl localhost:3001/api/auth/ok` → `{"status":"ok"}`
  - Files: `backend/src/index.ts`, `backend/src/routes/auth.ts`
  - Dependencies: Task 2
  - Scope: Small

### Checkpoint: Auth Flow Working
- [ ] MongoDB connected
- [ ] Better Auth running
- [ ] Google OAuth sign-in works (browser test)
- [ ] Session cookies set correctly

### Phase 2: Custom Data Models + API Routes

- [ ] **Task 4: Persona + Config + Usage Mongoose models**
  - Acceptance: Three Mongoose schemas with validation. Persona (userId, name, platform, tone, systemPrompt, temperature). Config (userId, defaultPersonaId, freeTierUsed). UsageEvent (userId, apiKeyId, platform, tone, eventType, timestamp).
  - Verify: Models can be imported and used to create documents
  - Files: `backend/src/models/persona.ts`, `backend/src/models/config.ts`, `backend/src/models/usage.ts`
  - Dependencies: Task 2
  - Scope: Small

- [ ] **Task 5: Session middleware + API config routes**
  - Acceptance: Middleware extracts session from request headers. `GET/POST/PUT/DELETE /api/config/personas` — full CRUD for user's personas. `GET /api/config` — returns user's full AI config (personas + settings). Zod validation on all inputs.
  - Verify: `curl -H "Cookie: ..." localhost:3001/api/config/personas` returns user's personas
  - Files: `backend/src/middleware/auth.ts`, `backend/src/routes/config.ts`
  - Dependencies: Tasks 3, 4
  - Scope: Medium

- [ ] **Task 6: Usage tracking routes**
  - Acceptance: `POST /api/usage/event` — records enhancement event (authenticated via API key or session). `GET /api/usage/stats` — returns daily/weekly counts grouped by platform/tone. `GET /api/usage/today` — returns today's count for rate limiting.
  - Verify: Post event, query stats, verify counts match
  - Files: `backend/src/routes/usage.ts`
  - Dependencies: Tasks 4, 5
  - Scope: Small

### Checkpoint: API Working
- [ ] Persona CRUD works via curl/Postman
- [ ] Usage events recorded and queryable
- [ ] Session auth enforces user ownership

### Phase 3: Dashboard Foundation + Auth UI

- [ ] **Task 7: Vite + React + Tailwind scaffold**
  - Acceptance: `npm run dev` serves dashboard on :5173. Tailwind works with DESIGN.md theme extension. Better Auth client configured. Vite proxy to backend.
  - Verify: Dashboard loads, Tailwind classes render, auth client initialized
  - Files: `dashboard/vite.config.ts`, `dashboard/tailwind.config.ts`, `dashboard/src/main.tsx`, `dashboard/src/lib/auth-client.ts`
  - Dependencies: Task 1
  - Scope: Medium

- [ ] **Task 8: DESIGN.md component library**
  - Acceptance: Button, Card, Input, Select, Badge, Toast, Toggle, Keycap components. All styled to DESIGN.md tokens (colors, typography with ss03, spacing, radii). No drop shadows. Surface ladder for elevation.
  - Verify: Storybook or component test rendering each variant
  - Files: `dashboard/src/components/ui/*.tsx` (8 files)
  - Dependencies: Task 7
  - Scope: Medium

- [ ] **Task 9: Login page + auth flow**
  - Acceptance: `/login` page with Google sign-in button styled per DESIGN.md (white CTA pill on dark canvas). Redirects to dashboard on success. Session persistence across refreshes.
  - Verify: Click "Sign in with Google" → OAuth flow → redirected to dashboard
  - Files: `dashboard/src/pages/Login.tsx`, `dashboard/src/App.tsx`
  - Dependencies: Tasks 7, 8, 3
  - Scope: Small

- [ ] **Task 10: Layout — Nav + Sidebar**
  - Acceptance: Dark nav bar (56px, #07080a canvas, hairline bottom border) with logo + user avatar + sign out. Sidebar with navigation links (Dashboard, Personas, Usage, Billing, Settings). Responsive: collapses to hamburger at 768px.
  - Verify: Navigate between pages, sidebar highlights active route, mobile hamburger works
  - Files: `dashboard/src/components/layout/Nav.tsx`, `Sidebar.tsx`, `Footer.tsx`
  - Dependencies: Tasks 8, 9
  - Scope: Medium

### Checkpoint: Dashboard Skeleton
- [ ] Login flow works
- [ ] Navigation between all 5 pages
- [ ] DESIGN.md styling consistent across all components
- [ ] Responsive at 768px and mobile

### Phase 4: Feature Pages

- [ ] **Task 11: Dashboard home page**
  - Acceptance: Stats grid (enhancements today, API keys count, personas count, subscription tier). Quick-action cards (Create API Key, New Persona, Upgrade to Pro). Recent activity list. All styled DESIGN.md.
  - Verify: Dashboard shows real user stats, empty states when no data
  - Files: `dashboard/src/pages/Dashboard.tsx`, `dashboard/src/components/features/StatsGrid.tsx`
  - Dependencies: Tasks 10, 6
  - Scope: Medium

- [ ] **Task 12: API Key management (page + card component)**
  - Acceptance: List of API keys (prefix + created date + status). Create button generates new key (shown once, copyable). Delete key with confirmation. Better Auth client API key methods used.
  - Verify: Create key → copy → delete → list updates
  - Files: `dashboard/src/components/features/ApiKeyCard.tsx`
  - Dependencies: Tasks 10, 5
  - Scope: Small

- [ ] **Task 13: Persona manager page**
  - Acceptance: List of user personas with edit/delete. Create persona form: name, description, platform dropdown, tone dropdown, system prompt textarea, temperature slider. Default persona toggle. Per-platform prompt template selection.
  - Verify: CRUD all operations, list updates, default toggles
  - Files: `dashboard/src/pages/Personas.tsx`, `dashboard/src/components/features/PersonaEditor.tsx`, `PersonaList.tsx`
  - Dependencies: Tasks 10, 5
  - Scope: Medium

- [ ] **Task 14: Usage analytics page**
  - Acceptance: Line chart (daily enhancements over last 30 days). Bar chart (by platform breakdown). Stats cards (total, this month, today, most used tone). Table of recent events. Recharts for charts styled to dark theme.
  - Verify: Charts render with real data, empty state when no usage
  - Files: `dashboard/src/pages/Usage.tsx`, `dashboard/src/components/features/UsageChart.tsx`
  - Dependencies: Tasks 10, 6
  - Scope: Medium

- [ ] **Task 15: Billing page**
  - Acceptance: Current plan display with tier name + price + limits. Upgrade button opens Stripe checkout (Better Auth `.subscription.upgrade()`). Billing portal link. Subscription status (active/past_due/canceled). Pricing tier cards (Free / Pro) styled DESIGN.md.
  - Verify: Click upgrade → Stripe checkout → complete → status updates
  - Files: `dashboard/src/pages/Billing.tsx`, `dashboard/src/components/features/PlanCard.tsx`
  - Dependencies: Tasks 10, 2 (Stripe plugin)
  - Scope: Medium

- [ ] **Task 16: Settings page**
  - Acceptance: Account info (name, email, avatar from Google). Delete account option. Analytics opt-in toggle. Theme confirmation (dark only, with info text).
  - Verify: Toggles persist, account info reflects Google profile
  - Files: `dashboard/src/pages/Settings.tsx`
  - Dependencies: Task 10
  - Scope: Small

### Checkpoint: Full Feature Set
- [ ] All 6 pages functional
- [ ] API keys created and usable by extension
- [ ] Personas created and editable
- [ ] Usage charts rendering real data
- [ ] Stripe checkout flow works

### Phase 5: Extension Integration + Polish

- [ ] **Task 17: Update extension to use platform API**
  - Acceptance: Extension `background.js` updated to call `/api/usage/event` for tracking, `/api/config` for syncing personas/tones. API key auth replaces bundled key. Free tier uses API-reported count.
  - Verify: Extension installed, API key entered → enhancements tracked on dashboard
  - Files: `extension/src/background.js` (update), `extension/src/utils/api.js` (new)
  - Dependencies: Tasks 5, 6, 12
  - Scope: Medium

- [ ] **Task 18: Error handling + loading states + empty states**
  - Acceptance: Every page has: skeleton loading state, error state with retry, empty state with CTA. API errors show toast notifications. 404 page.
  - Verify: Test all states by mocking API failures, empty responses
  - Files: All page components (updates)
  - Dependencies: All feature tasks
  - Scope: Small

- [ ] **Task 19: Tests + final polish**
  - Acceptance: Backend: 80%+ coverage on routes/models. Dashboard: 70%+ coverage on components/pages. ESLint clean. All DESIGN.md tokens verified in Tailwind config.
  - Verify: `npm test` passes everywhere, `npm run lint` clean, `npm run build` succeeds
  - Files: `backend/tests/*`, `dashboard/tests/*`, `dashboard/tailwind.config.ts`
  - Dependencies: All tasks
  - Scope: Medium

### Checkpoint: Production Ready
- [ ] Full test suite passing
- [ ] Lint clean
- [ ] Build succeeds (backend + dashboard)
- [ ] Extension integration verified
- [ ] DESIGN.md compliance audited

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Better Auth MongoDB adapter edge cases | High | Test thoroughly. MongoDB adapter is newer than SQL adapters. |
| Stripe webhook not reaching localhost | Medium | Use Stripe CLI for local dev. Document setup clearly. |
| Tailwind v4 API changes | Low | Pin exact Tailwind version. Check docs before upgrading. |
| Extension content script conflicts with dashboard host | Low | Dashboard on separate port/domain, no content scripts injected there. |
| Vite proxy not forwarding cookies correctly | Medium | Configure proxy with cookie domain rewrite. Test early. |

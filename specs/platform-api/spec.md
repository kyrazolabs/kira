# Spec: Platform API + Dashboard

## Objective

Backend API and management dashboard for the Content Enhancer browser extension. Users sign in with Google, manage API keys for the extension, configure AI personas/prompts/tones, track usage, and manage Stripe subscriptions. All following the DESIGN.md Raycast dark-canvas system.

**User stories:**
- As a user, I sign in with Google and land on my dashboard showing usage stats and API key
- As a user, I create/manage API keys to connect the browser extension to my account
- As a user, I create custom AI personas with platform-specific prompt rules and tone configurations
- As a user, I view my enhancement usage over time (daily/weekly/monthly charts)
- As a user, I upgrade to Pro via Stripe ($4.99/mo) and see my subscription status
- As the extension, I authenticate via API key, sync user config, and report usage events

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Backend framework | Express.js (ESM) | ^4.21 |
| Auth | Better Auth | latest |
| Database | MongoDB | ^7 |
| DB adapter | @better-auth/mongo-adapter | latest |
| Payments | Stripe + @better-auth/stripe | ^22 / latest |
| API keys | @better-auth/api-key | latest |
| Frontend | React + Vite | ^19 / ^6 |
| CSS | Tailwind CSS | ^4 |
| Design | DESIGN.md Raycast dark-canvas | — |
| Testing | Vitest + supertest | ^2 |

## Commands

```bash
# Development
npm run dev              # Start backend + frontend concurrently
cd backend && npm run dev  # Backend only (Express + tsx watch)
cd dashboard && npm run dev # Frontend only (Vite)

# Build
npm run build            # Build both
cd backend && npm run build  # TypeScript compile
cd dashboard && npm run build # Vite production build

# Test
npm test                 # All tests
cd backend && npm test   # Backend tests (Vitest + supertest)
cd dashboard && npm test # Frontend tests (Vitest + React Testing Library)

# Lint
npm run lint             # ESLint across both packages

# DB
cd backend && npx @better-auth/cli migrate  # Apply auth schema
```

## Project Structure

```
spark/                          # Monorepo root
├── AGENTS.md
├── DESIGN.md
├── IDEA.md
├── package.json                # Workspace root
├── specs/
│   └── platform-api/
│       ├── spec.md             # This file
│       └── plan.md             # Implementation plan
├── extension/                  # Browser extension (already built)
├── backend/                    # Express API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts            # Express app entry
│   │   ├── auth.ts             # Better Auth instance + plugins
│   │   ├── db.ts               # MongoDB connection
│   │   ├── routes/
│   │   │   ├── auth.ts         # Better Auth mount
│   │   │   ├── config.ts       # AI config CRUD (personas, prompts, tones)
│   │   │   ├── usage.ts        # Usage tracking + stats
│   │   │   └── subscription.ts # Subscription status
│   │   ├── models/
│   │   │   ├── persona.ts      # AI persona schema
│   │   │   ├── config.ts       # User AI config schema
│   │   │   └── usage.ts        # Usage event schema
│   │   └── middleware/
│   │       └── auth.ts         # Session + API key auth middleware
│   └── tests/
│       ├── setup.ts
│       ├── auth.test.ts
│       ├── config.test.ts
│       ├── usage.test.ts
│       └── api-key.test.ts
└── dashboard/                  # React management UI
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── index.html
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── lib/
    │   │   ├── auth-client.ts  # Better Auth client
    │   │   └── api.ts          # API client for custom endpoints
    │   ├── components/
    │   │   ├── ui/             # DESIGN.md component library
    │   │   │   ├── Button.tsx
    │   │   │   ├── Card.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── Select.tsx
    │   │   │   ├── Badge.tsx
    │   │   │   ├── Toast.tsx
    │   │   │   ├── Toggle.tsx
    │   │   │   └── Keycap.tsx
    │   │   ├── layout/
    │   │   │   ├── Nav.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   └── Footer.tsx
    │   │   └── features/
    │   │       ├── ApiKeyCard.tsx
    │   │       ├── UsageChart.tsx
    │   │       ├── PersonaEditor.tsx
    │   │       ├── PersonaList.tsx
    │   │       ├── PlanCard.tsx
    │   │       └── StatsGrid.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx    # Overview: stats, API key, quick actions
    │   │   ├── Personas.tsx     # AI persona manager
    │   │   ├── Usage.tsx        # Usage analytics + charts
    │   │   ├── Billing.tsx      # Subscription management
    │   │   ├── Settings.tsx     # Account + preferences
    │   │   └── Login.tsx        # Google OAuth sign-in
    │   └── styles/
    │       └── globals.css      # Tailwind + DESIGN.md tokens
    └── tests/
        ├── setup.ts
        ├── Dashboard.test.tsx
        ├── Personas.test.tsx
        └── components.test.tsx
```

## Code Style

```typescript
// backend/src/models/persona.ts
import mongoose from 'mongoose'

export interface IPersona {
  userId: string
  name: string
  description: string
  platform: 'twitter' | 'linkedin' | 'reddit' | 'threads' | 'generic' | 'all'
  tone: 'casual' | 'professional' | 'engaging'
  systemPrompt: string
  temperature: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const personaSchema = new mongoose.Schema<IPersona>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  platform: { type: String, enum: ['twitter', 'linkedin', 'reddit', 'threads', 'generic', 'all'], default: 'all' },
  tone: { type: String, enum: ['casual', 'professional', 'engaging'], default: 'casual' },
  systemPrompt: { type: String, required: true },
  temperature: { type: Number, default: 0.8, min: 0, max: 2 },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true })

export const Persona = mongoose.model<IPersona>('Persona', personaSchema)
```

**Conventions:**
- TypeScript strict mode, explicit return types on public functions
- 2-space indentation, single quotes
- Named exports only, no default exports
- `camelCase` variables/functions, `PascalCase` types/components
- Express routes: validate with Zod, respond with typed JSON
- React: functional components, hooks, no class components
- Tailwind: extend the theme with DESIGN.md tokens, use semantic classes

## Testing Strategy

**Backend (Vitest + supertest):**
- Unit: models, utility functions, Zod schemas
- Integration: API endpoints with real MongoDB (test database)
- Auth: session creation, API key verification, permission checks

**Dashboard (Vitest + React Testing Library):**
- Component: render tests for UI components, accessibility checks
- Page: integration tests for full page flows (login, CRUD)
- Visual: DESIGN.md token adherence tests

**Coverage targets:** 80% backend, 70% frontend

## Boundaries

**Always do:**
- Validate all inputs with Zod schemas
- Run `npm test` before committing
- Use DESIGN.md tokens via Tailwind theme — never raw hex values
- Enable Inter+ss03 font feature on all dashboard text
- Hash/encrypt API keys at rest (Better Auth handles this)
- Rate limit auth endpoints
- Use TypeScript strict mode

**Ask first:**
- Adding new npm dependencies
- Changing the MongoDB schema
- Modifying the Stripe plan configuration
- Adding new OAuth providers beyond Google
- Changing the API key format or prefix

**Never do:**
- Commit `.env` files or secrets
- Return raw API keys in list endpoints (show prefix only, key shown once on create)
- Use drop shadows in UI (DESIGN.md: surface ladder elevation)
- Introduce a light mode
- Store user content/text from enhancements (only metadata: count, platform, tone, timestamp)

## Success Criteria

- [ ] User can sign in with Google OAuth in < 2 seconds
- [ ] Dashboard loads session in < 500ms
- [ ] User can create/view/delete API keys
- [ ] Extension can authenticate via API key and sync config
- [ ] User can create/edit/delete AI personas with custom prompts
- [ ] Usage events are recorded and displayed as daily/weekly charts
- [ ] Stripe checkout creates Pro subscription, webhook updates status
- [ ] Free tier: 10 enhancements/day limit enforced
- [ ] All API endpoints return typed JSON, errors follow RFC 7807
- [ ] Dashboard fully matches DESIGN.md dark-canvas (colors, typography, spacing, components)
- [ ] 80%+ backend test coverage, 70%+ frontend test coverage

## Decisions

1. **Monorepo** — `backend/` and `dashboard/` in one repo with root `package.json` workspaces
2. **Local-first** — develop against localhost, deploy later (environment variable driven)
3. **Per-user AI config** — each user manages their own personas, prompts, and tone configs
4. **Google OAuth only** — no email/password, no username registration
5. **MongoDB adapter** — `@better-auth/mongo-adapter` for all auth tables + custom collections for config/usage/personas

# Kira

Kira is an open-source writing assistant for social platforms. A Chromium extension rewrites the text you are already typing — on X, LinkedIn, Reddit, Threads, or any other text field — with a platform-aware prompt. A small API and dashboard handle sign-in, personas, usage, and optional billing.

The extension is one click, inline, and tone-aware. The API calls Gemini. The dashboard is where you manage personas and see what you have used.

## What you get

- **Extension** — detects the site, offers Casual, Professional, and Engaging tones, and shows the original next to the rewrite before you accept it. Shortcut: `Ctrl+Shift+E` (`Command+Shift+E` on macOS).
- **API** — Elysia on Bun. Google sign-in, persona and usage routes, and `POST /api/enhance`.
- **Dashboard** — React app for personas, usage, billing, and settings.
- **Billing** — optional Stripe Pro plan. Leave the Stripe keys empty and the API runs without it.

Version 1.5.0. Licensed under [MIT](LICENSE).

## Repository layout

```
kira/
├── extension/     Chromium extension (Manifest V3, vanilla JS, esbuild)
├── backend/       API (Bun, Elysia, MongoDB, Better Auth)
├── dashboard/     Web app (React, Vite, Tailwind)
├── docker-compose.yml
├── skills/        Agent workflows used while building this repo
└── specs/         Feature specs and plans
```

`package.json` at the root sets `"private": true` so this app is not published to npm. That flag does not affect the MIT license. The source is free to use, modify, and redistribute.

## Prerequisites

- [Bun](https://bun.sh) 1.x for the API
- Node.js 22 for the dashboard and the extension
- MongoDB 7, local or in Docker
- A Chromium browser (Chrome, Edge, Brave, Arc, Opera) to load the extension
- A [Gemini API key](https://aistudio.google.com/apikey)
- A Google OAuth client if you want to sign in on the dashboard
- Docker with Compose, only if you want the full stack in containers

## Quick start

Run the three parts separately for day-to-day development. Each has its own install step.

### 1. MongoDB

```bash
docker run -d --name kira-mongo -p 27017:27017 mongo:7
```

### 2. API

```bash
cp backend/.env.example backend/.env
# Set GEMINI_API_KEY, BETTER_AUTH_SECRET, and the Google OAuth values.

cd backend
bun install
bun run dev
```

The API listens on [http://localhost:3001](http://localhost:3001). `GET /api/health` returns `{ "status": "ok" }`.

### 3. Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the API, so you do not need a dashboard env file for local development.

### 4. Extension

```bash
cd extension
npm install
npm test
npm run build
```

In the browser, open `chrome://extensions`, turn on Developer mode, choose **Load unpacked**, and select `extension/dist`. The extension talks to `http://localhost:3001/api`. Put the extension ID into `EXTENSION_ID` in `backend/.env` and restart the API so CORS accepts it.

## Docker Compose

Compose starts MongoDB, the API, and the dashboard. Copy the root env file first. Compose reads `.env` from this directory, and that file stays untracked.

```bash
cp .env.example .env
# Fill in DB_PASSWORD, BETTER_AUTH_SECRET, Google, and Gemini.

docker compose up --build
```

- Dashboard: [http://localhost](http://localhost)
- API: [http://localhost:3001](http://localhost:3001)

The Compose file includes [Coolify](https://coolify.io) labels used by the hosted deployment. They are ignored by a plain `docker compose up`.

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | `backend/.env` | Local API database. Defaults to `mongodb://localhost:27017/content-enhancer`. |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Root `.env` | MongoDB credentials for Compose. |
| `BETTER_AUTH_SECRET` | Both | Session signing secret. Use at least 32 random characters. |
| `BETTER_AUTH_URL` | Both | Public URL of the API. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Both | Google sign-in. |
| `GEMINI_API_KEY` | Both | Text enhancement. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` | Both | Pro billing. Empty disables Stripe. |
| `EXTENSION_ID` | Both | Chrome extension ID allowed by CORS. |
| `VITE_API_URL` | Dashboard build | API base for the production dashboard. Compose sets it to `/api`. |

Templates: [`backend/.env.example`](backend/.env.example) for local API development, [`.env.example`](.env.example) for Compose. Do not commit `.env` or `.env.production`.

## Commands

From each package directory:

| Command | Where | What it does |
|---|---|---|
| `bun run dev` | `backend/` | API with reload on port 3001 |
| `bun test` | `backend/` | API tests |
| `bun run build` | `backend/` | Bundle the API |
| `npm run dev` | `dashboard/` | Vite on port 5173 |
| `npm run build` | `dashboard/` | Typecheck and production build |
| `npm run dev` | `extension/` | Rebuild the extension on change |
| `npm test` | `extension/` | Extension unit and integration tests |
| `npm run build` | `extension/` | Production bundle in `extension/dist` |

From the repo root, `npm run dev` starts the API, waits three seconds, then starts the dashboard. Install dependencies in `backend/` and `dashboard/` first.

## Architecture

```
Browser page
    │  content script detects the field and injects the enhance button
    ▼
Extension service worker
    │  POST /api/enhance  { text, platform, tone }
    ▼
API (Elysia)
    │  session or API key → persona + prompt → Gemini
    ▼
MongoDB
    users, sessions, personas, config, usage events
```

The dashboard uses the same API for account, personas, usage, and billing. Platform prompts live in `backend/src/lib/prompts.ts`. The extension can also call Gemini directly with a key stored in the extension options. That path is documented in [`extension/README.md`](extension/README.md).

Design tokens for the dark UI are in [`DESIGN.md`](DESIGN.md). Product intent and the original MVP scope are in [`IDEA.md`](IDEA.md).

### API surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | No | Process is up |
| `GET` | `/api/enhance/health` | Yes | Gemini key is configured and reachable |
| `POST` | `/api/enhance` | Yes | Rewrite `{ text, platform, tone? }` |
| `GET`, `PUT` | `/api/config` | Yes | Default tone, persona, analytics |
| `*` | `/api/config/personas` | Yes | Persona library |
| `POST` | `/api/usage/event` | Yes | Record an enhance event |
| `GET` | `/api/usage/today` | Yes | Usage for the current UTC day |
| `GET` | `/api/usage/stats` | Yes | Usage totals over a date range |
| `*` | `/api/auth/*` | — | Better Auth (Google sign-in, sessions, Stripe) |

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branches, commit messages, and how to send a change.

## License

[MIT](LICENSE) © 2026 Kyrazo LLC

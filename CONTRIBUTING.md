# Contributing to Kira

Thanks for wanting to improve Kira. This file is the short version of how changes land in the repo. Issues and pull requests are welcome on [github.com/kyrazolabs/kira](https://github.com/kyrazolabs/kira).

## Ways to help

- Bug reports with the page or site, the steps, and what you expected
- Fixes for the extension, API, or dashboard
- Docs that make setup or behavior clearer
- Tests for a path that is not covered yet

Open a GitHub issue before starting a large feature, so the scope is agreed before the code is written.

## Security

If you find a vulnerability, do not open a public issue and do not paste secrets into a pull request. Use **Security → Report a vulnerability** on the GitHub repository so the report stays private.

## Setup

Follow the [Quick start](README.md#quick-start) in the README. You need Bun, Node.js 22, MongoDB, and a Gemini API key. Copy `backend/.env.example` to `backend/.env` for API work. Copy `.env.example` to `.env` only when you run Docker Compose.

Install and test the package you are changing:

```bash
# API
cd backend && bun install && bun test

# Dashboard — no test suite yet; typecheck with a production build
cd dashboard && npm install && npm run build

# Extension
cd extension && npm install && npm test
```

Load `extension/dist` as an unpacked extension after `npm run build` in `extension/`. The extension calls `http://localhost:3001` in development.

## Branches

`main` stays deployable. Branch from it and keep the branch short-lived.

```
feature/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

## Commits

Each commit does one thing. The subject line says why the change exists, in the imperative, and stays under about 72 characters.

```
feat: add persona temperature to the enhance request

The dashboard already stores temperature. The API was ignoring it,
so every persona ran at the default.
```

Use these prefixes when they fit: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

Before you commit:

- Look at `git diff` and confirm the change is only what you meant to include
- Confirm no `.env`, `.env.production`, API keys, or tokens are staged
- Run the tests for the package you touched

Do not commit `node_modules/`, `dist/`, or env files. Those are gitignored. `backend/.env.example` and `.env.example` are the only env files that belong in git, and they contain placeholders.

## Pull requests

- Describe what changed and how you checked it
- Link the issue if there is one
- Keep the diff focused. A refactor and a feature should be two pull requests
- Include screenshots or a short clip when the dashboard or extension UI changes

A maintainer will review. Small, tested changes are the easiest to merge.

## Project conventions

- API routes live under `backend/src/routes/`. Shared prompt text lives in `backend/src/lib/prompts.ts`. Do not duplicate prompts inside the route handler.
- The dashboard follows the dark-canvas tokens in `DESIGN.md`.
- Extension source is plain JavaScript in `extension/src/`. The build output is `extension/dist/`.
- Prefer a failing test first when you are fixing a bug that can be reproduced in the existing Vitest suites.
- Agent skills in `skills/` describe how coding agents work in this repo. Change a skill only when the workflow itself should change.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).

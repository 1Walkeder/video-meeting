@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The `@AGENTS.md` import above is generated and kept up to date by `next dev` itself — do not edit `AGENTS.md` by hand. It points at breaking-change docs bundled in `node_modules/next/dist/docs/` because this Next.js version postdates this model's training data; read it before writing any Next.js code.

## Commands

```bash
pnpm dev         # next dev
pnpm build       # next build
pnpm start       # next start (serve production build)
pnpm lint        # eslint
pnpm typecheck   # next typegen && tsc --noEmit
```

## Architecture

- Next.js App Router under `src/app` (currently just the root scaffold: `layout.tsx` + `page.tsx` from `create-next-app`).
- Path alias `@/*` -> `./src/*` (`tsconfig.json`).
- Styling is Tailwind CSS v4 via the `@tailwindcss/postcss` plugin (`postcss.config.mjs`), not a `tailwind.config.*` file.
- ESLint uses the flat config format (`eslint.config.mjs`) composed from `eslint-config-next`'s `core-web-vitals` and `typescript` rule sets.
- UI library is **HeroUI v3** (`@heroui/react` + `@heroui/styles`, Tailwind v4 + React Aria; no provider needed, compound components like `<Card><Card.Header>`). Styles are pulled in via `@import '@heroui/styles'` in `src/app/globals.css` right after `@import 'tailwindcss'`. A project skill (`.agents/skills/heroui-react`) can fetch component docs — consult it before using a component.
- Backend calls go through `src/lib/api.ts` to same-origin `/api/*`, which `next.config.ts` rewrites to the NestJS API (`API_URL`, default `http://localhost:4000`) — this avoids CORS (the API doesn't enable it). Pages: `/register` (`src/app/register`) and `/login` (`src/app/login`) post to `/api/auth/register` / `/api/auth/login`. These are Route Handlers (`src/app/api/auth/*`, via `src/lib/auth-proxy.ts`) that take precedence over the `/api/*` rewrite: they proxy to the API and put the returned JWT into an **httpOnly** `accessToken` cookie (SameSite=Lax, 1h) instead of returning it to JS; `/api/auth/logout` clears it (called by `src/components/logout-button.tsx`, shown in the header of `/`). The home page `/` is a Server Component that redirects to `/login` when the `accessToken` cookie is absent (or the API answers 401), and lists the user's meetings: «Последние встречи» (`GET /meetings/recent`) and «Все встречи» (`GET /meetings`), fetched server-side directly from `API_URL` with a Bearer token via `src/lib/meetings.ts` and rendered with `src/components/meeting-card.tsx`. Other `/api/*` calls go through the rewrite and carry the cookie automatically. Forms show a focusable-by-link error summary (`src/components/form-error-summary.tsx`) in addition to inline field errors. Both share `src/components/auth-shell.tsx` (full-screen gradient with a centered card), `src/components/password-field.tsx` (show/hide password) and Russian validation messages from `src/lib/validation.ts` (passed via `validate` on HeroUI `TextField`, so native English browser messages never show).

## Definition of done for UI changes

Any change to the UI (new or edited pages, components, styles, copy, layout) is **not done** until both steps below are completed:

1. **Visual check in a real browser.** Run the dev server and exercise the change with the browser tools (Playwright MCP / Claude in Chrome): open the affected pages, take screenshots at desktop (≈1280px) and mobile (≈375px) widths, and walk through the actual flows, including error, empty, loading and success states and keyboard navigation. Typecheck/lint passing is not enough.
2. **UX review with the `ui-ux-pro-max` skill** (`.claude/skills/ui-ux-pro-max`). Run its searches relevant to the change (e.g. `--domain ux` for forms/accessibility/touch, `--stack nextjs`) and verify the result against its rules: accessibility (contrast ≥ 4.5:1, labels, focus, keyboard), touch targets, forms and feedback, responsive layout. Fix every finding and re-check in the browser.

Report what was checked and what was fixed when handing the task back.

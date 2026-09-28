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
- A project skill for **HeroUI v3** (`.agents/skills/heroui-react`, Tailwind v4 + React Aria components) is installed but `@heroui/react` is not yet a dependency — it's the intended UI library for when components are built out.

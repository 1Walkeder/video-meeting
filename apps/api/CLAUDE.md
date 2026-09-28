# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # nest start --watch (listens on $PORT, default 4000)
pnpm build          # nest build -> dist/
pnpm start:prod     # node dist/main
pnpm lint           # oxlint src/ test/
pnpm typecheck       # tsc --noEmit -p tsconfig.json
pnpm test           # vitest run (unit specs: **/*.spec.ts)
pnpm test:watch     # vitest (watch mode)
pnpm test:cov       # vitest run --coverage
pnpm test:e2e       # vitest run --config ./vitest.config.e2e.ts (**/*.e2e-spec.ts)
```

Run a single test file: `pnpm exec vitest run src/app.controller.spec.ts`. Filter by test name: `pnpm exec vitest run -t "test name"`.

## Architecture

- Standard NestJS module structure: `AppModule` (`src/app.module.ts`) wires `AppController` + `AppService`. No feature modules exist yet — new features should follow the Nest convention of `*.module.ts` / `*.controller.ts` / `*.service.ts` per domain.
- **This package is ESM** (`"type": "module"` in `package.json`, `module`/`moduleResolution: "nodenext"` in `tsconfig.json`). Relative imports must include the `.js` extension even though the source files are `.ts` (e.g. `import { AppService } from './app.service.js'`).
- Test runner is **vitest**, not the Jest setup NestJS scaffolds by default — unit specs (`*.spec.ts`) and e2e specs (`*.e2e-spec.ts`, under `test/`) use separate configs (`vitest.config.ts` vs `vitest.config.e2e.ts`) because they use different `include` globs.
- Linting is **oxlint**, not ESLint; rules live in `oxlint.json`.

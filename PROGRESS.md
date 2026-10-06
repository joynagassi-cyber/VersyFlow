# PROGRESS — VersyFlow Senior Rescue (2026-10-06)

## Phase 0 — Discovery & Stack Detection

| Item | Value |
|---|---|
| Framework | Ionic React 7 + React 18 (function components, hooks) |
| Bundler | Vite (`npm run build` = `tsc -b tsconfig.build.json && vite build`) |
| Package manager | npm (lockfile: package-lock.json) |
| Test tooling | Vitest (`npm test` = `vitest run`) |
| i18n | i18next 24 + 44 locales (src/i18n/locales/*.ts) |
| State | Zustand v5 (src/store/*) + Capacitor persist |
| Targets | **Web + Capacitor mobile (Android + iOS)** — NO Electron desktop, NO Next.js. Skill's Phase 4 "Render deploy" does not apply; substitute = verify `vite build` green. |
| SSoT | `.claude/CLAUDE.md` (architecture rules, domains, non-negotiables), `docs/28-constitution.md`, `docs/09-architecture.md`, `docs/30-domain-rulebook.md`, `docs/31-ui-rulebook.md` |
| Domain layering | `app/`+`src/components/` → `src/hooks/` → `src/services/` → `src/domains/` (pure) → `src/infrastructure/` (I/O). Violations forbidden. |

### Baseline health (2026-10-06)
| Gate | Result |
|---|---|
| typecheck (`npx tsc --noEmit`) | ✅ 0 errors |
| lint (`npx eslint app src --ext .ts,.tsx`) | ✅ 0 errors (exit 0) |
| tests (`npx vitest run`) | ⚠️ **3 failed / 1184 passed (1187)** — 2 test files failing; failing test names identified next |
| prod build | baseline: previously PASS ~65s (re-verify after fixes) |

### Untracked working-tree items (not committed)
- `PROGRESS.md` (this file)
- ~28 `data/bible/raw/*/` USFM source dirs (build inputs, expected untracked)
- `docs/bible/reports/eb-target-*.txt` (research notes)
- `out/`, `scripts/bible/__pycache__/` (build/debris artifacts)
- `supabase/migrations/034_powersync_rls_strictness.sql` ← **uncommitted migration; audit item P-034**
- `tsconfig.build.tsbuildinfo` (incremental build state, tracked but dirty — candidate for .gitignore)

### Plan skeleton (to be filled in Phase 1)
- P0 baseline green (typecheck/lint/tests) — [ ]
- P1… — [ ]

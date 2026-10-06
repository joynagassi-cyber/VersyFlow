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

### Baseline health (2026-10-06, updated)
| Gate | Result |
|---|---|
| typecheck (`npx tsc --noEmit`) | ✅ 0 errors |
| lint (`npx eslint app src --ext .ts,.tsx`) | ✅ 0 errors (exit 0) |
| tests (`npx vitest run`) | ✅ **1187/1187 passed (110 files)** after P1+P2 fixes |
| prod build | PASS previously ~65s; re-verify after fixes |

### Fixed (commits)
- **P1 i18n parity failure** — 6 `auth.*` keys (identify, identifySubtitle, name,
  continue, ready, readySubtitle) used by the new frictionless-identify
  screens existed only in fr.ts; added to en.ts → `3a488ff`
- **P2 catalog audit drift** — `bible-translation-names-audit.test.ts` pinned
  to the 48-dataset ground truth; updated to 57 (no pending stubs remain) and
  extended the expected language tail with the 9 CC-BY-SA reader-language
  groups → `3a488ff`
- **P3 migration 034 tracking** — `supabase/migrations/034_powersync_rls_strictness.sql`
  was uncommitted while already applied live (2 `v_` views + FORCE RLS on 5
  business tables confirmed live via supabase-versyflow MCP 2026-10-06).
  Tracked → `51a0299`

### Untracked working-tree items (not committed, assessed)
- ~28 `data/bible/raw/*/` USFM source dirs — build inputs, intentionally untracked
- `docs/bible/reports/eb-target-*.txt` — research notes, keep untracked
- `out/`, `scripts/bible/__pycache__/` — debris; `.gitignore` candidate (P4)
- `tsconfig.build.tsbuildinfo` — tracked but dirty on every build; `.gitignore` candidate (P4)

### Plan (Phases 1-2 findings, to be extended when subagent API recovers)
- P0 baseline green — [x] (1187/1187)
- P1 i18n parity — [x] 3a488ff
- P2 catalog audit — [x] 3a488ff
- P3 migration 034 — [x] 51a0299
- P4 .gitignore: `out/`, `__pycache__/`, `tsconfig.build.tsbuildinfo` — [x] (added `/out/` +
  `scripts/bible/__pycache__/`; `*.tsbuildinfo` already covered since 2026-09 root cleanup)
- P5 senior-rescue 6-dimension audit (dead-code / doc-drift / security /
  test-coverage / perf / ops) — [ ] **BLOCKED: subagent API ECONNREFUSED
  all 6 audit agents (workflow wf_4f83b20b-5fb, 0/6 completed); re-run when
  connection recovers via `Workflow({scriptPath, resumeFromRunId})`**

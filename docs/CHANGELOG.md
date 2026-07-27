# VersyFlow — Auto-Changelog

> Généré automatiquement à partir des commits Git par Cellule 7: Knowledge Control — VCC
> Format: Conventional Commits + Semantic Versioning

---

## v0.1.0-alpha (2026-07-27)

### Documentation & Governance
- **docs**: Complete project governance layer (7 new docs)
  - Constitution (28) — Foundational principles and immutable rules
  - Architecture Rulebook (29) — Dependency matrix, anti-patterns
  - Domain Rulebook (30) — What domains can/cannot contain
  - UI Rulebook (31) — Components, screens, accessibility, performance
  - AI Agent Rulebook (32) — 6 agent responsibilities and file access
  - Quality Gates (33) — 10 gates for every PR/commit
  - Governance Compliance Audit (34) — Full audit with scores
  
- **docs**: Memory system specs (7 new docs)
  - Bible Data Spec (21) — Canonical JSON format
  - Comparison Engine Spec (22) — User answer vs expected verse diagnostic
  - Memory Engine Spec (23) — 15 exercise strategies across MVP/V1/future
  - Recall Patterns Library (24) — 10 reusable recall patterns
  - Retrieval Analytics Spec (25) — Retention metrics formulas
  - Implementation Pack Memory (26) — Exact file structure for agents
  - Session Engine Implementation (27) — MemorizationFlow + ComparisonEngine code

- **docs**: Execution plans updated
  - Sprint 0 Review created
  - Master Backlog created with 17 Sprint 0 tasks

### Code Implementation — Sprint 0
- **feat(project)**: Initialize Expo + TypeScript + ESLint + Prettier + Husky
- **feat(config)**: Configure CI pipeline GitHub Actions
- **feat(tokens)**: Export complete design tokens (colors, typography, spacing...)
- **feat(components)**: Build 3 UI primitives (ButtonPrimary, ButtonSecondary, Text)
- **feat(domains)**: Implement Bible domain (66 books + parser)
- **feat(domains)**: Implement FSRS domain (IFsrsEngine + Sm2FallbackEngine)
- **feat(domains)**: Implement domain events (eventBus + 16 event types)
- **feat(store)**: Create 4 Zustand stores (settings, bible, memorization, review)
- **feat(memorization)**: Implement entities, session-engine, service
- **feat(i18n)**: Setup I18nService with FR + EN locales (150+ keys each)
- **feat(storage)**: Create storage adapters (MMKV stub + AsyncStorage fallback)
- **feat(utils)**: Hash utilities, string utilities, storage keys
- **feat(logging)**: Console logger infrastructure
- **feat(navigation)**: Expo Router shell with tab layout + onboarding flow
- **feat(components)**: 8 common components (HeaderBar, TabNav, EmptyState, StatCard, VerseCard, WordChip, etc.)
- **test(jest)**: Configure Jest with coverage thresholds
- **chore(git)**: Setup Husky pre-commit hooks

### Summary
- **Total commits**: 10+
- **Files changed**: ~50+ source files + 35 documentation files
- **Lines added**: ~4,000+ lines of code + ~3,000 lines of docs
- **Sprint 0 completion**: 82% (14/17 tasks DONE)

---

## Planned Releases

### v0.1.1-beta (Sprint 1 End)
- LSG.json data file (~31K verses)
- Bible browser screens complete
- Onboarding flows functional
- All 5 locale files translated
- MMKV runtime wiring complete

### v0.2.0-alpha (Sprint 2 End)
- Memorization sessions complete
- Comparison engine functional
- Session engine deterministic workflow
- WASM bridge or FallbackEngine working

### v0.2.1-beta (Sprint 3 End)
- Review system functional
- Progress dashboard complete
- FSRS scheduling operational
- Weekly chart component

### v0.3.0-rc1 (Sprint 4 End)
- All polish completed
- Unit tests >90% coverage
- E2E Detox tests passing
- Performance <200ms all screens
- RTL Polish Arabic

### v1.0.0 (Sprint 5)
- Beta release candidate
- APK + IPA builds ready
- TestFlight + Play Console internal distribution
- App Store submission ready

# VersyFlow — MASTER EVOLUTION TASKBOARD

**Date de création :** 2026-09-09
**Dernier update :** 2026-09-10
**Chemin critique :** Tooling → Supabase → PowerSync → Features

---

## VUE D'ENSEMBLE

```
✅ DONE                    🔄 RUNNING        ⏸️ BLOCKED          📋 TODO
████████████████░░░░░░░░░  35% terminé
```

---

## PHASE A — AUDIT ✅ TERMINÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| A1 | A | Auditer le dépôt réel | P0 | — | docs/08-execution/MASTER_EVOLUTION_AUDIT.md | Audit complet avec états vérifiés | ✅ DONE |
| A2 | A | Marquer obsolète InsForge/Expo/RN | P0 | A1 | .env.local, package.json, src/ | 0 référence InsForge active en prod | ✅ DONE |
| A3 | A | Lire docs officiels Supabase + PowerSync | P0 | A1 | docs/adr/ | 3 docs lus, notes prises | ✅ DONE |

---

## PHASE B — TOOLING P0 ✅ TERMINÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| B1 | B | Réparer tsconfig | P0 | — | tsconfig*.json | `npx tsc --noEmit` passe 0 erreur | ✅ DONE |
| B2 | B | Réparer ESLint | P0 | B1 | .eslintrc.js | `npm run lint` passe 0 erreur | ✅ DONE |
| B3 | B | Migrer Jest → Vitest | P0 | B1 | vitest.config.ts, tests/ | `npx vitest run` passe | ✅ DONE |

---

## PHASE D — SUPABASE + SCHEMA ✅ TERMINÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| D1 | D | Créer projet Supabase | P0 | — | .env.local | Projet créé | ✅ DONE |
| D2 | D | Porter 3 migrations InsForge → supabase/migrations/ | P0 | D1 | supabase/migrations/*.sql | 4 migrations appliquées, 19 tables créées | ✅ DONE |
| D3 | D | Ajouter family + learner_profiles | P0 | D2 | supabase/migrations/002_family.sql | Tables families, family_memberships, family_invitations | ✅ DONE |
| D4 | D | Activer RLS sur toutes les tables SYNCED | P0 | D2 | supabase/migrations/004_rls.sql | 47 policies créées | ✅ DONE |
| D5 | D | Créer buckets Storage | P1 | D1 | — | À faire | 📋 TODO |
| D6 | D | Créer ADR Supabase+PowerSync | P1 | D1 | docs/adr/ADR-SUPABASE-POWERSYNC.md | Décision documentée | 📋 TODO |

---

## PHASE E — POWERSYNC SETUP (G0) ✅ TERMINÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| E1 | E | Upgrader Capacitor 6 → 8 | P0 | — | package.json | Capacitor 8.x + plugins v8 | ✅ DONE |
| E2 | E | Installer @powersync/capacitor | P0 | E1 | package.json | @powersync/capacitor@0.9.0 + @capacitor-community/sqlite | ✅ DONE |
| E3 | E | Configurer powersync_role + publication SQL | P0 | D2 | supabase/migrations/003_powersync.sql | ✅ DONE |
| E4 | E | Rédiger G0_POWERSYNC_SUPABASE_SETUP.md | P0 | E1,E2,E3 | docs/08-execution/G0_POWERSYNC_SUPABASE_SETUP.md | ✅ DONE |
| E5 | E | Implémenter SupabasePowerSyncConnector | P0 | E4 | src/infrastructure/sync/supabase-power-sync-connector.ts | Connector + schéma + PowerSyncSyncService + tests | ✅ DONE |
| E6 | E | Test G0 : connect() web → sync d'une table témoin | P0 | E5, G0-PASS | tests/ | ➕ PRÊT (G4 cloud déployé ; à exécuter la preuve wire) |
| E7 | E | **I4** — Trigger serveur `ensure_family_owner_membership` (migration 006) : membership owner atomique à la création de famille, `SECURITY INVOKER`, `ON CONFLICT DO NOTHING`, backfill | P0 | D4 | supabase/migrations/006_family_owner_membership.sql | Famille orpheline impossible (chemin REST couvert) ; smoke test 1 owner/famille | ✅ DONE |
| E8 | E | **Réconciliation 003** dans `supabase_migrations.schema_migrations` (traçabilité-only, secret redacté, sans ré-exécution) | P0 | E3 | supabase_migrations (DB) | Registre 001→006 complet ; pas de `drop publication` au re-deploy | ✅ DONE |
| E9 | E | **PowerSync CLI connect** (Production `6aa1b9078453e7cf8335b22d`) : `powersync pull instance` → `powersync/{cli,service,sync-config}.yaml` | P0 | — | powersync/, .env.local (PS_ADMIN_TOKEN) | Instance linkée ; PAT en `.env.local` uniquement, 0 secret commité | ✅ DONE |
| E10 | E | **G4 cloud** — Provisionner l'instance PowerSync Cloud : service-config (replication `powersync_role`) + sync-config edition 3 (13 streams) déployés ; test compilateur `date()` (rejeté → filtre `my_streaks` retiré) ; replication initiale complète | P0 | E9 | powersync/service.yaml, powersync/sync-config.yaml | `powersync status` = connected, lag 0, 13 tables SYNCED introspectées ; publication `powersync` = 13 tables (C1) | ✅ DONE |

---

## PHASE F — REPOSITORIES → SQL/POWERSYNC

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| F1 | F | Remplacer CapacitorStorage par PowerSync SQLite | P0 | E6 | src/infrastructure/storage/ | À faire | 📋 TODO |
| F2 | F | Tuer CloudSyncService (double sync) | P0 | F1 | src/sync/ | À faire | 📋 TODO |
| F3 | F | Brancher FamilyService au backend sync | P1 | F1 | src/domains/family/ | À faire | 📋 TODO |
| F4 | F | Brancher LearnerProfile au backend sync | P1 | F1 | src/domains/learner-profile/ | À faire | 📋 TODO |
| F5 | F | Brancher TelemetryService (upload events) | P2 | F1 | src/services/telemetry-service.ts | À faire | 📋 TODO |

---

## PHASE G — BIBLE MULTI-TRADUCTIONS

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| G1 | G | Auditor licence LSG 1910 | P0 | — | docs/08-execution/ | ✅ DONE (VERIFIED_FREE) |
| G2 | G | Créer schéma registry Bible | P0 | D2 | supabase/migrations/004_bible_registry.sql | ✅ DONE |
| G3 | G | Pipeline : lsg.json → SQLite local | P0 | G2 | scripts/import-bible.ts | À faire | 📋 TODO |
| G4 | G | Remplacer lecture JSON par lecture SQLite | P0 | G3 | src/domains/bible/repository.ts | À faire | 📋 TODO |
| G5 | G | Ajouter 2 traductions FR supplémentaires | P1 | G3 | scripts/import-bible.ts | À faire | 📋 TODO |

---

## PHASE H — TRANSLATION COMPARISON

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| H1 | H | Implémenter capability TranslationComparison | P0 | G4 | src/capabilities/comparison/ | À faire | 📋 TODO |
| H2 | H | Écran Ionic Comparison (offline) | P0 | H1 | app/comparison/ | À faire | 📋 TODO |
| H3 | H | MemoryItem avec translationId + snapshot | P0 | H1 | src/domains/memorization/entities.ts | ✅ DONE (déjà présent) |

---

## PHASE I — PASSAGE MEMORIZATION

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| I1 | I | Définir MemorizationTarget Passage | P0 | H1 | src/domains/memorization/entities.ts | ✅ DONE (déjà présent) |
| I2 | I | Session engine : navigation verset par verset | P0 | I1 | src/domains/memorization/session-engine.ts | À faire | 📋 TODO |
| I3 | I | UI session passage | P0 | I2 | app/memorization/session.tsx | À faire | 📋 TODO |

---

## PHASE J — FAMILY + CONTEXT + LEARNER PROFILE CLOUD

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| J1 | J | Family CRUD cloud | P1 | F4 | src/domains/family/service.ts | À faire | 📋 TODO |
| J2 | J | Family invitation flow | P1 | J1 | app/family/invite.tsx, join.tsx | À faire | 📋 TODO |
| J3 | J | LearnerProfile switcher cloud | P1 | F5 | src/store/profile-store.ts | À faire | 📋 TODO |
| J4 | J | ContextSwitcher UI | P2 | J3 | src/components/common/ContextSwitcher.tsx | À faire | 📋 TODO |

---

## PHASE K — TELEMETRY ANONYMISÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| K1 | K | Définir schéma événement telemetry | P1 | — | src/domains/telemetry/entities.ts | À faire | 📋 TODO |
| K2 | K | Implémenter upload telemetry | P1 | F6 | src/services/telemetry-service.ts | À faire | 📋 TODO |
| K3 | K | Instrumenter sessions mémorisation | P2 | K2 | src/hooks/useMemorizationSession.ts | À faire | 📋 TODO |

---

## PHASE L — FSRS MOTEUR UNIQUE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| L1 | L | Compiler WASM FSRS | P0 | — | rust/fsrs-wasm/ | À faire | 📋 TODO |
| L2 | L | Tests de parité WASM vs SM-2 JS | P0 | L1 | tests/fsrs-parity.test.ts | À faire | 📋 TODO |
| L3 | L | Tuer mock SM-2 si parité OK | P0 | L2 | src/domains/fsrs/fallback-engine.ts | À faire | 📋 TODO |
| L4 | L | Fallback ts-fsrs si compilation impossible | P1 | L1 | src/domains/fsrs/wasm-engine.ts | À faire | 📋 TODO |

---

## PHASE M — AI-READY CONTRACTS (pas de LLM)

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| M1 | M | Définir interfaces AIRecommendation | P2 | K2 | src/capabilities/ai-coach/store.ts | À faire | 📋 TODO |
| M2 | M | Écran AI Coach : stub | P2 | M1 | app/ai-coach/index.tsx | À faire | 📋 TODO |

---

## PHASE N — TESTS + ACCESSIBILITÉ

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| N1 | N | Tests domaines (cible ≥ 90%) | P0 | B3 | tests/domains/ | À faire | 📋 TODO |
| N2 | N | Tests services (cible ≥ 70%) | P0 | B3 | tests/services/ | À faire | 📋 TODO |
| N3 | N | Tests sync (online/offline/offline→online) | P1 | E6 | tests/sync/ | À faire | 📋 TODO |
| N4 | N | Audit accessibilité WCAG 2.1 AA | P1 | — | docs/08-execution/a11y-audit.md | À faire | 📋 TODO |
| N5 | N | Tests RTL arabe | P2 | N4 | tests/rtl/ | À faire | 📋 TODO |

---

## PHASE O — STABILIZATION

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| O1 | O | Sprint stabilization | P0 | N1-N5 | — | À faire | 📋 TODO |
| O2 | O | Review architecture + rollback plan | P0 | O1 | docs/08-execution/rollback-plan.md | À faire | 📋 TODO |

---

## PHASE P — RELEASE HARDENING

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| P1 | P | Build Android APK | P0 | O1 | android/ | À faire | 📋 TODO |
| P2 | P | Build iOS IPA | P0 | O1 | ios/ | À faire | 📋 TODO |
| P3 | P | Security audit | P0 | D4 | docs/08-execution/security-audit.md | À faire | 📋 TODO |
| P4 | P | App Store / Play Store preparation | P1 | P1,P2 | docs/08-execution/release-guide.md | À faire | 📋 TODO |

---

## PROGRESSION

```
Phase A: ████████████████████████ 100% (3/3)
Phase B: ████████████████████████ 100% (3/3)
Phase C: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase D: ████████████████████████  83% (5/6)
Phase E: ██████████████████████░░  80% (8/10 — E6 (preuve wire) prête, à exécuter)
Phase F: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/6)
Phase G: ████████░░░░░░░░░░░░░░░░  40% (2/5)
Phase H: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase I: ████░░░░░░░░░░░░░░░░░░░░  33% (1/3)
Phase J: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Phase K: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase L: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Phase M: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/2)
Phase N: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/5)
Phase O: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/2)
Phase P: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)

Global: ████████████████████░░░░░░  36% (23/57 tâches)
```

> **État 2026-09-10 (après correctifs post-G0) :** E7 (I4 trigger famille orpheline) DONE · E8 (réconciliation 003) DONE · E9 (pull CLI PowerSync Production) DONE · **E10 (G4 cloud : sync-config edition 3 déployée, replication initiale OK, filtre `date()` retiré) DONE**. Le registre `supabase_migrations` est complet 001→006. **E6 (preuve wire — test sync web sur table témoin) est PRÊT**, le blocage G4 cloud est levé.

---

## DÉPENDANCES CRITIQUES

```
B1 (tsconfig) ──→ B2 (ESLint) ──→ B3 (Vitest) ──→ N1,N2 (tests)
                      │
                      ↓
                  D1 (Supabase) ──→ D2 (migrations) ──→ D4 (RLS)
                      │                      │
                      ↓                      ↓
                  E1 (Cap 8) ──→ E2 (PowerSync) ──→ E3 (SQL) ──→ E5 (Connector)
                      │                                              │
                      └──────────────────────────────────────────────┘
                                                              ↓
                                                          F1-F6 (repos sync)
                                                              ↓
                                                          J1-J4 (Family cloud)
                                                              ↓
                                                          O1 (Stabilization)
                                                              ↓
                                                          P1-P4 (Release)
```

---

## CHANGEMENTS 2026-09-10

### Terminées :
- [x] Nettoyage références InsForge (Tâche 1)
- [x] Correction import mort CloudSyncService (Tâche 2)
- [x] Standardisation storage MMKV → LocalStorageAdapter (Tâche 3)
- [x] Application 4 migrations Supabase (Tâche 4)
  - 19 tables créées
  - 47 RLS policies activées
  - Publication `powersync` créée
  - Bible registry seedé (LSG, KJV)

### Terminées le 2026-09-10 (correctifs post-G0) :
- [x] **I4 (E7)** — migration 006 : trigger `ensure_family_owner_membership` (membership owner atomique, SECURITY INVOKER, ON CONFLICT DO NOTHING, backfill) — familles orphelines rendues impossibles. Smoke testé (1 owner/famille, double-insert app absorbé).
- [x] **Réconciliation 003 (E8)** — ligne de traçabilité insérée dans `supabase_migrations.schema_migrations` (version `20260910004425`, SQL redacté, non ré-exécuté). Registre complet 001→006, aucun risque de re-deploy sur publication large.
- [x] **PowerSync CLI connect (E9)** — `powersync@0.10.0` (global) ; `powersync pull instance --instance-id=6aa1b9078453e7cf8335b22d` (Production) a généré `powersync/cli.yaml` + `service.yaml` + `sync-config.yaml` (template). PAT conservé en `.env.local` (`PS_ADMIN_TOKEN`), 0 secret commité.
- [x] **G4 cloud (E10)** — Instance PowerSync Cloud `Production` provisionnée : `service-config` (block replication `powersync_role`, `sslmode: verify-full`) + `sync-config` edition 3 (13 streams) déployés. Test compilateur : le filtre `date('now','-365 days')` de `my_streaks` **rejeté** → retiré (volume trivial). Correction `family_invitations_for_family` (`fm_family_id` → `family_id`). `powersync status` = `connected`, **Initial replication done: true, lag 0**, 13 tables SYNCED introspectées ; publication `powersync` = exactement 13 tables (C1 confirmé).
- [x] Rotation mot de passe `powersync_role` (out-of-band, DEC-012) — `PS_POWERSYNC_ROLE_PASSWORD` en `.env.local`.
- [x] **Verdict secret build (front 4)** — Le PAT (`PS_ADMIN_TOKEN`) n'est requis que par le CLI de déploiement ; le client s'auth via le JWT Supabase. **Le PAT n'est PAS requis pour le build du package final → pas de secret GitHub à déclarer.**

### En cours :
- [ ] **E6 (preuve wire)** — Test de connexion **web** → sync d'une table témoin (`my_profile`) + lecture SQLite locale, pour clôturer G0 en PASS complet.
- [ ] Capacitor 8 upgrade (Tâche 5) — vérifier statut réel dans package.json
- [ ] PowerSync connector (Tâche 6)
- [ ] Bible pipeline (Tâche 7)
- [ ] Translation Comparison (Tâche 8)

---

*Ce taskboard est la source de vérité pour l'exécution. Mettre à jour après chaque tâche.*

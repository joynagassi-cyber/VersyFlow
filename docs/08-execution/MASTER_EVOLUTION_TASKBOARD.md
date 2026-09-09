# VersyFlow — MASTER EVOLUTION TASKBOARD

**Date de création :** 2026-09-09
**Dernier update :** 2026-09-09
**Chemin critique :** Tooling → Supabase → PowerSync → Features

---

## VUE D'ENSEMBLE

```
✅ DONE                    🔄 RUNNING        ⏸️ BLOCKED          📋 TODO
████████████░░░░░░░░░░░░░  20% terminé
```

---

## PHASE A — AUDIT ✅ TERMINÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| A1 | A | Auditer le dépôt réel | P0 | — | docs/08-execution/MASTER_EVOLUTION_AUDIT.md | Audit complet avec états vérifiés | ✅ DONE (mis à jour) |
| A2 | A | Marquer obsolète InsForge/Expo/RN | P0 | A1 | .env.local, package.json, src/ | 0 référence InsForge active en prod | ✅ DONE (partiel) |
| A3 | A | Lire docs officiels Supabase + PowerSync | P0 | A1 | docs/adr/ | 3 docs lus, notes prises | 🔄 IN_PROGRESS |

---

## PHASE B — TOOLING P0

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| B1 | B | Réparer tsconfig (inclure tests/, vite.config) | P0 | — | tsconfig*.json | `npx tsc --noEmit` passe 0 erreur | 📋 TODO |
| B2 | B | Réparer ESLint (243 erreurs → 0) | P0 | B1 | .eslintrc.js, tsconfig | `npm run lint` passe 0 erreur | 📋 TODO |
| B3 | B | Migrer Jest → Vitest (compatibilité Vite) | P0 | B1 | jest.config.js → vitest.config.ts, tests/ | `npm test` : 0 échec, coverage rapportée | 📋 TODO |
| B4 | B | Configurer CI baseline (lint + typecheck + test + build) | P1 | B1,B2,B3 | .github/workflows/ | CI verte sur main | 📋 TODO |

---

## PHASE C — CAPABILITY ARCHITECTURE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| C1 | C | Définir Feature Manifest déclaratif | P1 | B3 | docs/08-execution/feature-manifest.md | 17 capabilities listées, rien de runtime | 📋 TODO |
| C2 | C | Trancher i18n (simple vs v2) | P1 | B3 | src/i18n/ | Une seule implémentation, l'autre marquée OBSOLÈTE | 📋 TODO |
| C3 | C | Trancher FSRS (WASM vs ts-fsrs) | P1 | B3 | src/domains/fsrs/ | Un seul moteur, le mock supprimé | 📋 TODO |

---

## PHASE D — SUPABASE + SCHEMA

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| D1 | D | Créer projet Supabase (nouveau, pas InsForge) | P0 | — | .env.local (SUPABASE_URL, SUPABASE_ANON_KEY) | Projet créé, URL récupérée | 📋 TODO |
| D2 | D | Porter 3 migrations InsForge → supabase/migrations/ | P0 | D1 | supabase/migrations/*.sql | Migration 001 applyée, 8 tables créées, RLS actif | 📋 TODO |
| D3 | D | Ajouter family + learner_profiles si absents du SQL | P0 | D2 | supabase/migrations/003_family.sql | Tables families, family_memberships, family_invitations, learner_profiles | 📋 TODO |
| D4 | D | Activer RLS sur toutes les tables SYNCED | P0 | D2 | supabase/migrations/004_rls.sql | Chaque table a POLICY select/insert/update/delete par user_id | 📋 TODO |
| D5 | D | Créer buckets Storage (avatars, exports) | P1 | D1 | — | 2 buckets créés, RLS storage actif | 📋 TODO |
| D6 | D | Créer ADR Supabase+PowerSync | P1 | D1 | docs/adr/ADR-SUPABASE-POWERSYNC.md | Décision documentée, justification, rollback | 📋 TODO |

---

## PHASE E — POWERSYNC SETUP (G0)

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| E1 | E | Upgrader Capacitor 6 → 8 | P0 | — | package.json, capacitor.config.ts | `npx cap init` passe, version 8.x | 📋 TODO |
| E2 | E | Installer @powersync/capacitor + @capacitor-community/sqlite | P0 | E1 | package.json | `npm install` passe, versions compatibles | 📋 TODO |
| E3 | E | Configurer powersync_role + publication SQL | P0 | D2 | supabase/migrations/005_powersync.sql | Role créé, publication pour tables SYNCED | 📋 TODO |
| E4 | E | Rédiger G0_POWERSYNC_SUPABASE_SETUP.md | P0 | E1,E2,E3 | docs/08-execution/G0_POWERSYNC_SUPABASE_SETUP.md | Checklist complétée, conclusion PASS/FAIL | 📋 TODO |
| E5 | E | Implémenter SupabasePowerSyncConnector | P0 | E4 | src/infrastructure/sync/supabase-power-sync-connector.ts | fetchCredentials() + uploadData() implémentés | 📋 TODO |
| E6 | E | Test G0 : connect() web → sync d'une table témoin | P0 | E5 | tests/ | Table témoin syncée, données visibles | 📋 TODO |

---

## PHASE F — REPOSITORIES → SQL/POWERSYNC

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| F1 | F | Remplacer CapacitorStorage par PowerSync SQLite pour SYNCED | P0 | E6 | src/infrastructure/storage/ | Read/Write local via SQLite, sync auto | 📋 TODO |
| F2 | F | Tuer CloudSyncService (double sync) | P0 | F1 | src/sync/ | CloudSyncService supprimé, importés remplacés | 📋 TODO |
| F3 | F | Remplacer InsForgeAuthService par Supabase Auth | P0 | D1 | src/auth/ | signIn/signUp/signOut fonctionnels avec Supabase | 📋 TODO |
| F4 | F | Brancher FamilyService au backend sync | P1 | F1 | src/domains/family/ | CRUD family via PowerSync | 📋 TODO |
| F5 | F | Brancher LearnerProfile au backend sync | P1 | F1 | src/domains/learner-profile/ | CRUD profile via PowerSync | 📋 TODO |
| F6 | F | Brancher TelemetryService (upload events) | P2 | F1 | src/services/telemetry-service.ts | Events uploadés via supabase-js (user JWT) | 📋 TODO |

---

## PHASE G — BIBLE MULTI-TRADUCTIONS

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| G1 | G | Auditor licence LSG 1910 actuelle | P0 | — | docs/08-execution/ | Licence vérifiée, statut documenté | 📋 TODO |
| G2 | G | Créer schéma registry Bible (languages, translations, verses) | P0 | D2 | supabase/migrations/006_bible_registry.sql | Tables créées, indexes POSIX | 📋 TODO |
| G3 | G | Pipeline : lsg.json → SQLite local | P0 | G2 | scripts/import-bible.ts | 31k versets importés, checksum validé | 📋 TODO |
| G4 | G | Remplacer lecture JSON par lecture SQLite | P0 | G3 | src/domains/bible/repository.ts | BibleRepository lit depuis SQLite | 📋 TODO |
| G5 | G | Ajouter 2 traductions FR supplémentaires (Ostervald, Darby) | P1 | G3 | scripts/import-bible.ts | Registry contient 3 traductions FR | 📋 TODO |

---

## PHASE H — TRANSLATION COMPARISON

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| H1 | H | Implémenter capability TranslationComparison | P0 | G4 | src/capabilities/comparison/ | Interface ITranslationComparison, engine | 📋 TODO |
| H2 | H | Écran Ionic Comparison (offline) | P0 | H1 | app/comparison/ | UI affiche 3 traductions côte à côte | 📋 TODO |
| H3 | H | MemoryItem avec translationId + snapshot | P0 | H1 | src/domains/memorization/entities.ts | MemoryItem contient translationId | 📋 TODO |

---

## PHASE I — PASSAGE MEMORIZATION

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| I1 | I | Définir MemorizationTarget Passage | P0 | H1 | src/domains/memorization/entities.ts | Type Passage avec versets + transitions | 📋 TODO |
| I2 | I | Session engine : navigation verset par verset | P0 | I1 | src/domains/memorization/session-engine.ts | Passage fluide, retour arrière | 📋 TODO |
| I3 | I | UI session passage | P0 | I2 | app/memorization/session.tsx | Écran supporte passage complet | 📋 TODO |

---

## PHASE J — FAMILY + CONTEXT + LEARNER PROFILE CLOUD

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| J1 | J | Family CRUD cloud | P1 | F4 | src/domains/family/service.ts | Create/Read/Update/Delete via PowerSync | 📋 TODO |
| J2 | J | Family invitation flow | P1 | J1 | app/family/invite.tsx, join.tsx | Invitation par code, acceptation | 📋 TODO |
| J3 | J | LearnerProfile switcher cloud | P1 | F5 | src/store/profile-store.ts | Switch profil syncé | 📋 TODO |
| J4 | J | ContextSwitcher UI | P2 | J3 | src/components/common/ContextSwitcher.tsx | Switch Personal/Family visible | 📋 TODO |

---

## PHASE K — TELEMETRY ANONYMISÉE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| K1 | K | Définir schéma événement telemetry | P1 | — | src/domains/telemetry/entities.ts | EventType versionné, pas de PII | 📋 TODO |
| K2 | K | Implémenter upload telemetry (supabase-js user JWT) | P1 | F6 | src/services/telemetry-service.ts | Events uploadés batch, retry | 📋 TODO |
| K3 | K | Instrumenter sessions mémorisation | P2 | K2 | src/hooks/useMemorizationSession.ts | Événements emités à chaque action | 📋 TODO |

---

## PHASE L — FSRS MOTEUR UNIQUE

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| L1 | L | Compiler WASM FSRS (GitHub Actions / WSL) | P0 | — | rust/fsrs-wasm/ | fsrs-wasm.pkg.wasm dans public/wasm/ | 📋 TODO |
| L2 | L | Tests de parité WASM vs SM-2 JS | P0 | L1 | tests/fsrs-parity.test.ts | 100% parité sur 100 cas tests | 📋 TODO |
| L3 | L | Tuer mock SM-2 si parité OK | P0 | L2 | src/domains/fsrs/fallback-engine.ts | Mock supprimé, WASM utilisé | 📋 TODO |
| L4 | L | Fallback ts-fsrs si compilation WASM impossible | P1 | L1 | src/domains/fsrs/wasm-engine.ts | ts-fsrs installé, intégré | 📋 TODO |

---

## PHASE M — AI-READY CONTRACTS (pas de LLM)

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| M1 | M | Définir interfaces AIRecommendation | P2 | K2 | src/capabilities/ai-coach/store.ts | Interface vide, contrats définis | 📋 TODO |
| M2 | M | Écran AI Coach : stub (pas de LLM) | P2 | M1 | app/ai-coach/index.tsx | Écran existe, message "Bientôt" | 📋 TODO |

---

## PHASE N — TESTS + ACCESSIBILITÉ

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| N1 | N | Tests domaines (cible ≥ 90%) | P0 | B3 | tests/domains/ | 90% coverage domaines purs | 📋 TODO |
| N2 | N | Tests services (cible ≥ 70%) | P0 | B3 | tests/services/ | 70% coverage services | 📋 TODO |
| N3 | N | Tests sync (online/offline/offline→online) | P1 | E6 | tests/sync/ | 3 scénarios tests | 📋 TODO |
| N4 | N | Audit accessibilité WCAG 2.1 AA | P1 | — | docs/08-execution/a11y-audit.md | Rapport avec corrections | 📋 TODO |
| N5 | N | Tests RTL arabe | P2 | N4 | tests/rtl/ | Layout correct en RTL | 📋 TODO |

---

## PHASE O — STABILIZATION

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| O1 | O | Sprint stabilization (pas de feature neuve) | P0 | N1-N5 | — | 0 bug critique, 0 regression | 📋 TODO |
| O2 | O | Review architecture + rollback plan | P0 | O1 | docs/08-execution/rollback-plan.md | Plan documenté | 📋 TODO |

---

## PHASE P — RELEASE HARDENING

| ID | Phase | Tâche | Priority | Dependencies | Files | Acceptance Criteria | Status |
|----|-------|-------|----------|-------------|-------|---------------------|--------|
| P1 | P | Build Android APK | P0 | O1 | android/ | APK générée, installable | 📋 TODO |
| P2 | P | Build iOS IPA | P0 | O1 | ios/ | IPA générée, signable | 📋 TODO |
| P3 | P | Security audit (RLS, secrets, tokens) | P0 | D4 | docs/08-execution/security-audit.md | 0 vulnérabilité critique | 📋 TODO |
| P4 | P | App Store / Play Store preparation | P1 | P1,P2 | docs/08-execution/release-guide.md | Screenshots, descriptions, assets | 📋 TODO |

---

## PROGRESSION

```
Phase A: ████████████████████████ 100% (3/3)
Phase B: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Phase C: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase D: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/6)
Phase E: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/6)
Phase F: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/6)
Phase G: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/5)
Phase H: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase I: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase J: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Phase K: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/3)
Phase L: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)
Phase M: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/2)
Phase N: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/5)
Phase O: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/2)
Phase P: ░░░░░░░░░░░░░░░░░░░░░░░   0% (0/4)

Global: ████░░░░░░░░░░░░░░░░░░░░  6% (3/57 tâches)
```

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

*Ce taskboard est la source de vérité pour l'exécution. Mettre à jour après chaque tâche.*

---

## MISE À JOUR 2026-09-09

### Phase A — COMPLÈTE
- [x] Audit dépôt réel terminé
- [x] Documentation obsolète marquée (InsForge, Expo, RN)
- [x] Rapport G0 rédigé

### Phase B — PARTIELLEMENT COMPLÈTE
- [x] Tsconfig réparé (0 erreur)
- [x] Migration Jest → Vitest (362 tests passing)
- [ ] ESLint: 4000+ erreurs à corriger (priorité basse)
- [ ] CI baseline configuré

### Phase D — EN COURS
- [x] Projet Supabase identifié
- [x] Credentials configurés (.env.local + GitHub secrets)
- [x] 3 migrations SQL créées
- [ ] **À faire: Appliquer les migrations sur Supabase**
- [ ] RLS policies à valider
- [x] SupabaseAuthService implémenté

### Phase E — EN ATTENTE
- [ ] Capacitor upgrade 6→8 (bloqué par Docker non dispo)
- [ ] PowerSync setup (bloqué par migrations non appliquées)

### Résumé migration InsForge → Supabase
- [x] @insforge/sdk supprimé de package.json
- [x] 4 références InsForge supprimées du code
- [x] SupabaseAuthService implémenté
- [x] 5 secrets GitHub obsolètes supprimés
- [x] 6 secrets Supabase ajoutés
- [x] CI/CD GitHub Workflows créés
- [ ] Migrations SQL à appliquer
- [ ] PowerSync à configurer

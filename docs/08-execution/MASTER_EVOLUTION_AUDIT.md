# VersyFlow — MASTER EVOLUTION AUDIT

**Date :** 2026-09-09
**Version du rapport :** 1.0
**Auteur :** Master Execution Orchestrator
**Dépôt :** C:\Users\joyda\ZCodeProject\VersyFlow

---

## 1. RAPPEL DE LA MISSION

Transformer VersyFlow en application offline-first multi-plateforme avec :
- **Backend** : Supabase + PowerSync Cloud (Abandon InsForge)
- **Frontend** : Ionic React + Capacitor (déjà fait)
- **DB locale** : SQLite via PowerSync
- **Bible** : Corpus local multi-traductions
- **FSRS** : Moteur unique (WASM ou ts-fsrs)
- **Offline-first** : Read local → Write local → Sync async

---

## 2. ÉTAT RÉEL DU DÉPÔT (re-vérifié)

### 2.1 Stack actuelle

| Élément | Version | Status |
|---------|---------|--------|
| Ionic React | 7.0.0 | ✅ Installé |
| Capacitor | 6.2.0 | ✅ Installé — **upgrade nécessaire** pour PowerSync 8+ |
| Vite | 6.0.0 | ✅ Installé |
| React | 18.3.1 | ✅ |
| React Router DOM | 6.28.0 | ✅ |
| Zustand | 5.0.0 | ✅ |
| Ionicons | 7.0.0 | ✅ |
| Supabase JS | — | ❌ Non installé |
| PowerSync | — | ❌ Non installé |
| @capacitor-community/sqlite | — | ❌ Non installé |
| react-native-mmkv | — | ❌ Ne PAS installer |

### 2.2 Migration Ionic/Capacitor — TERMINÉE

| Élément | Status |
|---------|--------|
| capacitor.config.ts | ✅ Créé |
| ionic.config.json | ✅ Créé |
| vite.config.ts | ✅ Créé |
| tsconfig.app.json / node.json | ✅ Créés |
| index.html | ✅ Créé |
| package.json (mise à jour) | ✅ Fait |
| src/main.tsx | ✅ Créé (entry point Ionic) |
| src/theme/IonicThemeProvider.tsx | ✅ Créé |
| src/theme/useColorScheme.ts | ✅ Créé |
| src/hooks/useIonicNavigation.ts | ✅ Créé |
| src/components/navigation/IonicRouterProvider.tsx | ✅ Créé |
| src/infrastructure/storage/capacitor-storage.ts | ✅ Créé (localStorage) |
| src/components/ui/Primitives.tsx | ✅ Créé (adaptateur RN→Web) |
| Build Vite `www/` | ✅ Fonctionne (4.4 MB) |

### 2.3 Références obsolètes encore présentes

| Type | Count | Détails |
|------|-------|---------|
| `@insforge/sdk` | 4 refs | auth-store, InsForgeAuthService, CloudSyncService, .env |
| `react-native` | 27 refs | Commentaires, Primitives.tsx (intentionnel), 2-3 imports résiduels |
| `expo-*` | 0 refs | ✅ Toutes retirées |
| `react-native-mmkv` | 0 refs | ✅ Jamais installé |
| `expo-router` | 0 refs | ✅ Toutes retirées |

### 2.4 Tests — Cassés

| Config | Status | Détail |
|--------|--------|--------|
| Jest | ❌ 52 suites fail | `jest-expo` preset commenté, transformIgnorePatterns outdated |
| ESLint | ❌ 243 erreurs | `tsconfig.json` n'inclut pas `tests/` ni `vite.config.ts` |
| Coverage | 0% | Aucun test ne passe |
| tsconfig | ⚠️ Partiel | Réécrit pour Vite mais pas complet |

### 2.5 Migrations SQL — Prêtes mais non déployées

| Fichier | Tables | Status |
|---------|--------|--------|
| `migrations/001_initial-schema.sql` | 8 tables + RLS + seed achievements | ✅ Prêt (insForge format) |
| `migrations/002_align-schema.sql` | Même schéma, camelCase + bigint | ✅ Prêt (insForge format) |
| `migrations/20260809_add-missing-tables.sql` | word_performance, streaks, collections, etc. | ✅ Prêt |

⚠️ **Attention** : Ces fichiers utilisent `auth.uid()` et `uuid_generate_v4()` — à adapter pour Supabase.

### 2.6 FSRS — Mock JS

| Fichier | Status |
|---------|--------|
| `src/domains/fsrs/wasm-engine.ts` | Mock JS (commentaire indique WASM prêt) |
| `rust/fsrs-wasm/` | Rust source existant, pkg/ absent |
| `src/services/fsrs-factory.ts` | Tente WASM → fallback SM-2 |

### 2.7 i18n — Double implémentation

| Fichier | Status |
|---------|--------|
| `src/services/i18n-service.ts` | **Stub** (retourne clés brutes) |
| `src/domains/i18n/` | Config + service-simple + service-v2 |
| `src/i18n/locales/*.ts` | 5 fichiers (fr, en, ar, de, zh) — Contenu à vérifier |

### 2.8 Domaines existants

| Domaine | Fichiers | Status cloud |
|---------|----------|-------------|
| bible | entities, schema, repository, parser, service | ✅ Local-only (JSON) |
| fsrs | engine, entities, fallback, wasm, index | ⚠️ Mock JS |
| memorization | entities, service, session-engine, storage-adapter, fatigue, strategy-recommendor, comparison, tracker | ✅ Local |
| family | entities, service, repository, permissions | ⚠️ Local-only |
| family-invitation | entities, repository, service | ⚠️ Local-only |
| learner-profile | entities, service, repository | ⚠️ Local-only |
| progress | entities | ⚠️ Incomplet |
| telemetry | entities | ⚠️ Interface `it telemetry.ts` (nom bizarre) |
| i18n | config, simple, v2 | ⚠️ Double impl |

### 2.9 Services existants

| Service | Dépendance | Status |
|---------|-----------|--------|
| `InsForgeAuthService` | @insforge/sdk | ❌ Backend 503 |
| `CloudSyncService` | @insforge/sdk + @capacitor/network | ⚠️ Branché sur InsForge mort |
| `BibleService` | local JSON | ✅ Fonctionnel |
| `FSRSFactory` | WASM mock + SM-2 | ⚠️ Mock |
| `ReviewQueueService` | local FSRS | ✅ Fonctionnel |
| `TelemetryService` | local | ⚠️ Local-only |

### 2.10 Stores Zustand existants

| Store | Persist | Storage actuel |
|-------|---------|----------------|
| auth-store | ✅ | CapacitorStorage (localStorage) |
| settings-store | ✅ | CapacitorStorage |
| profile-store | ✅ | CapacitorStorage |
| memorization-store | ✅ | CapacitorStorage |
| family-store | ✅ | CapacitorStorage |
| review-store | ✅ | CapacitorStorage |
| bible-store | ✅ | CapacitorStorage |
| context-store | ✅ | CapacitorStorage |

Tous les stores utilisent CapacitorStorage (→ localStorage sur web). C'est fonctionnel mais **local-only**.

---

## 3. OBSOLESCENCE MARQUÉE

| Concept | Statut | Action |
|---------|--------|--------|
| InsForge comme backend | 🔴 OBSOLÈTE | Supprimer URL/keys, remplacer par Supabase |
| @insforge/sdk | 🔴 OBSOLÈTE | Retirer des dépendances |
| Expo / Expo Router | ✅ DÉJÀ RETIRÉ | — |
| react-native | ✅ DÉJÀ MIGRÉ | Primitives.tsx fait le pont |
| react-native-mmkv | ✅ NE PAS INSTALLER | localStorage suffît pour web, Capacitor Storage pour natif |
| CloudSyncService InsForge | 🔴 OBSOLÈTE | Remplacer par PowerSync |
| AI Coach LLM | ✅ NE PAS IMPLEMENTER | Écran vide laissé tel quel |
| Migrations InsForge (503) | 🔴 OBSOLÈTE | Porter vers Supabase SQL |

---

## 4. ÉCARTS IDENTIFIÉS

### 4.1 Écart critique : Pas de backend

| Élément | Attendu | Réel |
|---------|---------|------|
| Auth | Supabase Auth | InsForge (503) |
| Database | Supabase Postgres | Aucune |
| Sync | PowerSync Cloud | Aucun |
| Storage | Supabase Storage | Aucun |

**Impact** : Zéro fonctionnalité cloud ne fonctionne. L'application est 100% local.

### 4.2 Écart moyen : Capacitor 6 vs PowerSync 8+

| Élément | Requis | Actuel |
|---------|--------|--------|
| Capacitor | ≥ 8 | 6.2.0 |
| @powersync/capacitor | ≥ 1.x | Non installé |
| @capacitor-community/sqlite | ≥ 6 | Non installé |

**Impact** : PowerSync ne fonctionnera pas sur Capacitor 6. Upgrade nécessaire.

### 4.3 Écart moyen : Double i18n

| Élément | Attendu | Réel |
|---------|--------|------|
| i18n | Une implémentation | Stub + simple + v2 |
| Locales | AR/DE/ZH complètes | À valider |

### 4.4 Écart faible : FSRS mock

Le moteur FSRS actuel est un mock JS. Le vrai WASM existe dans `rust/fsrs-wasm/` mais n'a pas été compilé (wasm-pack bloqué sur Windows via WSL).

### 4.5 Écart faible : ESLint/Jest cassés

243 erreurs ESLint et 52 échecs Jest bloquent toute validation qualité.

---

## 5. FICHIERS CLÉS À CONSULTER

### Lecture obligatoire avant toute modification
1. `package.json` — Dépendances actuelles
2. `capacitor.config.ts` — Config Capacitor
3. `vite.config.ts` — Config build Vite
4. `tsconfig.app.json` — Config TypeScript app
5. `src/main.tsx` — Entry point
6. `src/components/navigation/IonicRouterProvider.tsx` — Routing
7. `src/infrastructure/storage/capacitor-storage.ts` — Storage
8. `src/theme/IonicThemeProvider.tsx` — Thème
9. `migrations/001_initial-schema.sql` — Schéma InsForge
10. `migrations/002_align-schema.sql` — Schéma aligné

### À lire pour compréhension métier
11. `docs/28-constitution.md` — Lois fondamentales
12. `docs/29-architecture-rulebook.md` — Règles architecture
13. `docs/30-domain-rulebook.md` — Règles domaines
14. `docs/31-ui-rulebook.md` — Règles UI
15. `src/domains/memorization/entities.ts` — Entités métier
16. `src/domains/fsrs/entities.ts` — Entités FSRS
17. `src/domains/family/entities.ts` — Entités famille

---

## 6. DÉCISIONS À PRENDRE

| # | Question | Recommandation | Blocant ? |
|---|----------|---------------|-----------|
| D1 | InsForge vs Supabase | **Supabase** — InsForge 503, décision produit | ✅ Oui |
| D2 | Capacitor 6 → 8 pour PowerSync | **Oui**, sinon pas de sync | ✅ Oui |
| D3 | FSRS : WASM compilé vs ts-fsrs | **wasm-pack** dans GitHub Actions / WSL | ⚠️ Moyen |
| D4 | i18n simple vs v2 | **simple** (plus léger, déjà utilisé) | ⚠️ Moyen |
| D5 | Test framework | **Vitest** au lieu de Jest (Vite natif) | ⚠️ Moyen |
| D6 | ESLint config | **Corriger tsconfig** pour inclure tests/ | ✅ Oui |

---

## 7. CHAMP CRITIQUE (chemin critique)

```
1. Tooling (tsconfig + ESLint + tests)        ← P0 bloquant
2. Supabase projet + migrations SQL           ← P0 bloquant
3. Capacitor 8 upgrade                        ← P0 bloquant PowerSync
4. PowerSync setup (G0)                       ← P0 sync
5. Connector Supabase→PowerSync              ← P0 sync
6. Translation de CloudSyncService → PowerSync
7. Translation de InsForgeAuthService → Supabase Auth
8. Bible registry multi-traduction            ← P1 offline
9. Family/Profile cloud                       ← P1
10. Telemetry anonymisée                      ← P2
```

---

*Audit réalisé le 2026-09-09. Le dépôt réel fait foi — tout écart avec ce rapport sera corrigé en lisant le code.*

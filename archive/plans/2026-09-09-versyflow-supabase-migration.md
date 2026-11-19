# VersyFlow Migration Plan — Phases B à P

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrer VersyFlow d'InsForge (503) vers Supabase + PowerSync, avec Bible multi-traductions locale, sans réécrire l'UI Ionic existante.

**Architecture:** Ionic React (déjà migré) → PowerSync SQLite local ↔ Supabase Postgres. Bible locale uniquement. FSRS unique. Family/Profile cloud.

**Tech Stack:** Supabase, PowerSync Cloud, Capacitor 8, Ionic React 7, Vite 6, TypeScript, Vitest, SQLite (via PowerSync)

---

## SPRINT 1 — Tooling P0 (3-4 jours)

**Objectif:**avoir un outillage fonctionnel avant toute migration data.

### S1-T1: Réparer tsconfig
**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`
- Modify: `tsconfig.node.json`

**Steps:**
1. `tsconfig.app.json` doit inclure `"include": ["src", "app", "tests", "vite.config.ts", "env.d.ts"]`
2. `tsconfig.json` doit referencer `tsconfig.app.json` et `tsconfig.node.json`
3. Supprimer `"extends": "expo/tsconfig.base"` s'il traîne
4. Vérifier: `npx tsc --noEmit` doit passer avec 0 erreur

### S1-T2: Réparer ESLint (243 erreurs)
**Files:**
- Modify: `.eslintrc.js`
- Modify: `tsconfig.app.json` (ajouter `tests/` dans include)

**Steps:**
1. Ajouter `tests/` et `vite.config.ts` dans `tsconfig.app.json` include
2. Ajouter `tests/` dans `.eslintrc.js` `ignorePatterns`
3. Corriger les 243 erreurs une par une (généralement: imports non résolus, types any)
4. Vérifier: `npm run lint` → 0 erreur

### S1-T3: Migrer Jest → Vitest
**Files:**
- Create: `vitest.config.ts`
- Create: `vite-env.d.ts`
- Modify: `package.json` (scripts, deps)
- Modify: `jest.config.js` → archive dans `docs/legacy/`

**Steps:**
1. `npm install -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`
2. Créer `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```
3. Créer `tests/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```
4. Mettre à jour `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
},
"devDependencies": {
  "vitest": "^3.0.0",
  "@vitest/ui": "^3.0.0",
  "@vitest/coverage-v8": "^3.0.0",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "jsdom": "^25.0.0"
}
```
5. Supprimer `jest-expo`, `@testing-library/jest-native` de package.json
6. Vérifier: `npm test` → 0 échec

### S1-T4: Configurer CI baseline
**Files:**
- Create: `.github/workflows/ci.yml`

**Steps:**
1. Créer workflow GitHub Actions:
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
      - run: npm run build
```
2. Vérifier: push sur main → CI verte

---

## SPRINT 2 — Supabase + Schema (4-5 jours)

**Objectif:** Backend Supabase opérationnel avec auth, schema, RLS.

### S2-T1: Créer projet Supabase
**Files:**
- Modify: `.env.local`
- Modify: `.env.example`

**Steps:**
1. Créer projet sur https://supabase.com/dashboard
2. Récupérer `SUPABASE_URL` et `SUPABASE_ANON_KEY`
3. Mettre à jour `.env.local`:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
INSFORGE_URL=https://wypi8tgf.eu-central.insforge.app  # OBSOLÈTE - garder pour rollback
INSFORGE_ANON_KEY=...  # OBSOLÈTE
```
4. Créer `.env.example` (sans secrets)

### S2-T2: Porter migration 001 → Supabase
**Files:**
- Create: `supabase/migrations/001_create_core_tables.sql`

**Steps:**
1. Lire `migrations/001_initial-schema.sql` et `002_align-schema.sql`
2. Créer `supabase/migrations/001_create_core_tables.sql`:
   - Utiliser `auth.uid()` pour RLS (pas `CURRENT_USER`)
   - Utiliser `UUID` pour IDs (pas VARCHAR)
   - Utiliser `TIMESTAMPTZ` pour timestamps (pas BIGINT)
   - Tables: users, memorization_records, review_logs, word_performance, streaks, collections, collection_verses, achievements, user_achievements, settings
   - RLS policies pour chaque table
   - Seed achievements
3. Appliquer via Supabase Dashboard SQL Editor
4. Vérifier: SELECT * from memorization_records retourne 0 ligne

### S2-T3: Migration family + learner_profiles
**Files:**
- Create: `supabase/migrations/002_add_family_and_profiles.sql`

**Steps:**
1. Créer tables: learner_profiles, families, family_memberships, family_invitations
2. RLS policies pour chaque table
3. Apply via SQL Editor
4. Vérifier: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` → toutes les tables présentes

### S2-T4: RLS security review
**Files:**
- Modify: `supabase/migrations/003_rls_security.sql`

**Steps:**
1. Review chaque policy RLS
2. Tester négativement: user A ne peut pas lire user B's data
3. Tester: user peut lire/mettre à jour ses propres données
4. Documenter dans `docs/adr/ADR-SUPABASE-POWERSYNC.md`

### S2-T5: Storage buckets
**Files:**
- Via Supabase Dashboard → Storage → Create bucket
- Buckets: `avatars` (private), `exports` (private)

---

## SPRINT 3 — PowerSync Setup (G0) (3-4 jours)

**Objectif:** Connecter PowerSync Cloud à Supabase.

### S3-T1: Upgrader Capacitor 6 → 8
**Files:**
- Modify: `package.json`
- Modify: `capacitor.config.ts`

**Steps:**
1. `npm install @capacitor/core@^8.0.0 @capacitor/cli@^8.0.0`
2. `npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/network`
3. `npx cap init` (confirmer overwrite)
4. Vérifier: `npx cap doctor` → tout vert

### S3-T2: Installer PowerSync
**Files:**
- Modify: `package.json`

**Steps:**
1. `npm install @powersync/capacitor @capacitor-community/sqlite @powersync/web @supabase/supabase-js`
2. `npx cap sync`
3. Vérifier: `ls node_modules/@powersync` existe

### S3-T3: SQL PowerSync (powersync_role + publication)
**Files:**
- Create: `supabase/migrations/004_powersync_setup.sql`

**Steps:**
1. Créer role `powersync_role` avec REPLICATION + BYPASSRLS
2. GRANT SELECT sur toutes les tables SYNCED
3. CREATE PUBLICATION powersync FOR TABLE memorization_records, review_logs, learner_profiles, families, family_memberships, family_invitations, streaks, collections, user_achievements, settings
4. **Jamais** ALL TABLES — lister explicitement
5. password stocké dans Supabase secrets (jamais dans le code)

### S3-T4: G0 Rapport
**Files:**
- Create: `docs/08-execution/G0_POWERSYNC_SUPABASE_SETUP.md`

**Steps:**
1. Documenter: Supabase URL, migrations appliquées, RLS, role powersync, publication
2. Test: premier connect() web → vérifier sync d'une table témoin
3. Conclusion: PASS ou FAIL

### S3-T5: Implémenter SupabasePowerSyncConnector
**Files:**
- Create: `src/infrastructure/sync/SupabasePowerSyncConnector.ts`

**Steps:**
1. Implémenter interface `PowerSyncDataSource`:
```typescript
import { PowerSyncDatabase } from '@powersync/capacitor';
import { Schema, Table, column } from '@powersync/web';

export class SupabasePowerSyncConnector {
  private db: PowerSyncDatabase | null = null;
  
  async connect(supabase: SupabaseClient) {
    // fetchCredentials: supabase.auth.getSession() → JWT
    // uploadData: supabase-js with user JWT
  }
  
  async fetchCredentials() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return {
      endpoint: POWERSYNC_URL,
      token: session?.access_token || '',
    };
  }
  
  async uploadData(transaction: CrudTransaction) {
    // Batch insert/update/delete via supabase-js
  }
}
```
2. Gérer erreurs RLS, retry, network
3. Ne JAMAIS utiliser service-role dans le client

---

## SPRINT 4 — Migration Auth + Sync (3-4 jours)

**Objectif:** Remplacer InsForge AuthService et CloudSyncService.

### S4-T1: SupabaseAuthService
**Files:**
- Create: `src/auth/SupabaseAuthService.ts`
- Modify: `src/auth/index.ts`

**Steps:**
1. Implémenter interface `IAuthService`:
```typescript
export class SupabaseAuthService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }
  async signOut() {
    return this.supabase.auth.signOut();
  }
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }
  async getSession() {
    return this.supabase.auth.getSession();
  }
}
```
2. Mettre à jour `src/auth/index.ts` exports
3. **Garder** `InsForgeAuthService.ts` dans `docs/legacy/auth/` pour traçabilité

### S4-T2: Mettre à jour auth-store
**Files:**
- Modify: `src/store/auth-store.ts`

**Steps:**
1. Remplacer `InsForgeAuthService` par `SupabaseAuthService`
2. Remplacer CapacitorStorage persist par Supabase sync (via PowerSync)
3. Mapper `UserProfile` vers schema Supabase `users`
4. Vérifier: login → redirect vers tabs

### S4-T3: Tuer CloudSyncService
**Files:**
- Archive: `src/sync/CloudSyncService.ts` → `docs/legacy/sync/`
- Delete: `src/sync/CloudSyncService.ts`

**Steps:**
1. Supprimer toutes les imports de CloudSyncService
2. Remplacer par PowerSync (déjà implémenté dans S3-T5)
3. Vérifier: 0 référence à CloudSyncService

### S4-T4: Brancher FamilyService au backend
**Files:**
- Modify: `src/domains/family/service.ts`
- Modify: `src/domains/family/repository.ts`

**Steps:**
1. Repository implémente queries PowerSync SQLite
2. CRUD family, members, invitations
3. Vérifier: create family → visible dans SQLite local → sync vers Supabase

---

## SPRINT 5 — Bible Multi-Traductions (3-4 jours)

**Objectif:** Registry Bible multi-traductions, SQLite local.

### S5-T1: Auditor licence LSG 1910
**Files:**
- Create: `docs/08-execution/BIBLE_LICENSE_AUDIT.md`

**Steps:**
1. Vérifier licence LSG 1910 (Louis Segond 1910)
2. Statut: PUBLIC DOMAIN (US) / domaine public France
3. Documenter dans le rapport

### S5-T2: Schéma registry Bible
**Files:**
- Create: `supabase/migrations/005_bible_registry.sql`
- Create: `src/domains/bible/registry.ts`

**Steps:**
1. Tables: languages, translations, bible_books, bible_verses, translation_texts, versification_maps
2. Registry TypeScript:
```typescript
export interface BibleTranslation {
  id: string;
  languageId: string;
  name: string;
  year: number;
  license: { status: 'VERIFIED_FREE' | 'LICENSE_REQUIRED'; name: string; url: string };
  canon: string[];  // ['gen','exo',...]
  versification: string;  // 'protestant' | 'catholic'
  direction: 'ltr' | 'rtl';
}
```

### S5-T3: Pipeline import Bible
**Files:**
- Create: `scripts/import-bible.ts`
- Modify: `src/domains/bible/repository.ts`

**Steps:**
1. Script lit `www/data/bible/lsg.json`
2. Valide schema Zod
3. Inser dans SQLite local (via PowerSync schema)
4. Vérifie checksum
5. Met à jour registry translations
6. Vérifier: `SELECT COUNT(*) FROM bible_verses` → 31102

### S5-T4: Remplacer lecture JSON par SQLite
**Files:**
- Modify: `src/domains/bible/repository.ts`

**Steps:**
1. BibleRepository lit depuis SQLite local (pas fetch JSON)
2. Indexes sur (book_id, chapter, verse)
3. Vérifier: performance < 10ms pour getVerse()

---

## SPRINT 6 — Translation Comparison + Passage (4-5 jours)

### S6-T1: Translation Comparison engine
**Files:**
- Create: `src/capabilities/comparison/translation-comparison-engine.ts`
- Modify: `src/capabilities/comparison/store.ts`

**Steps:**
1. Compare N translations d'un même verset
2. MemoryItem = reference + translationId + snapshot
3. FSRS ne se transfère pas entre traductions

### S6-T2: Écran Comparison Ionic
**Files:**
- Modify: `app/comparison/result.tsx`

**Steps:**
1. Affiche 2-3 traductions côte à côte
2. Bouton "Mémoriser cette formulation"
3. Offline, ne charge que les versets demandés

### S6-T3: Passage memorization
**Files:**
- Modify: `src/domains/memorization/entities.ts`
- Modify: `src/domains/memorization/session-engine.ts`

**Steps:**
1. MemorizationTarget: SingleVerse | Passage
2. Passage = array de versets + transitions
3. Session engine gère navigation verset par verset

---

## SPRINT 7 — FSRS Moteur Unique (2-3 jours)

### S7-T1: Compiler WASM (GitHub Actions)
**Files:**
- Create: `.github/workflows/build-wasm.yml`
- Modify: `rust/fsrs-wasm/Cargo.toml`

**Steps:**
1. Workflow GitHub Actions:
```yaml
name: Build WASM
on: [push]
jobs:
  wasm:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustwasm/wasm-pack-action@v0.4
      - run: cd rust/fsrs-wasm && wasm-pack build --target web --out-dir ../../public/wasm
      - uses: actions/upload-artifact@v4
        with: { name: wasm, path: public/wasm/ }
```
2. Fallback: si compilation échoue, utiliser ts-fsrs

### S7-T2: Tests parité
**Files:**
- Create: `tests/fsrs-parity.test.ts`

**Steps:**
1. 100 cas tests: même input → même output WASM vs JS
2. Seuil: 100% parité
3. Si échec: fallback ts-fsrs

### S7-T3: Tuer mock SM-2
**Files:**
- Modify: `src/domains/fsrs/wasm-engine.ts`
- Archive: `src/domains/fsrs/fallback-engine.ts` → `docs/legacy/fsrs/`

---

## SPRINT 8 — Telemetry + Tests Complets (4-5 jours)

### S8-T1: Schéma telemetry
**Files:**
- Modify: `src/domains/telemetry/entities.ts`

**Steps:**
1. EventType versionné: 'session_start', 'verse_memorized', 'review_completed'
2. Champs: exerciseType, targetType, language, translation, wordCount, sessionDuration, ratings, intervals
3. Pas de PII, anonymousLearnerId

### S8-T2: Upload telemetry
**Files:**
- Modify: `src/services/telemetry-service.ts`

**Steps:**
1. Batch upload via supabase-js (user JWT)
2. Retry 3x, exponential backoff
3. Local queue si offline

### S8-T3: Tests domaines (≥90%)
**Files:**
- Create: `tests/domains/bible.test.ts`
- Create: `tests/domains/fsrs.test.ts`
- Create: `tests/domains/memorization.test.ts`
- Create: `tests/domains/family.test.ts`

### S8-T4: Tests services (≥70%)
**Files:**
- Create: `tests/services/bible-service.test.ts`
- Create: `tests/services/review-queue-service.test.ts`
- Create: `tests/services/telemetry-service.test.ts`

---

## SPRINT 9 — Stabilization + Release (3-4 jours)

### S9-T1: Sprint stabilization
- 0 bug critique
- 0 regression
- Tous les tests verts

### S9-T2: Audit sécurité
- RLS policies review
- Secrets: Supabase URL/Key dans .env.local uniquement
- Pas de service-role côté client

### S9-T3: Build Android
- `npx cap add android` (si pas fait)
- `npx cap sync`
- `npx cap open android`
- Générer APK

### S9-T4: Build iOS
- `npx cap add ios`
- `npx cap sync`
- `npx cap open ios`
- Générer IPA

### S9-T5: Final report
**Files:**
- Create: `docs/08-execution/MASTER_EVOLUTION_FINAL_REPORT.md`
- Update: `docs/08-execution/MASTER_EVOLUTION_TASKBOARD.md`

---

## PROGRESSION CIBLE

| Sprint | Durée | Blocant |
|--------|-------|---------|
| S1 Tooling | 3-4j | ✅ Débloque tout |
| S2 Supabase | 4-5j | ✅ Requiert compte Supabase |
| S3 PowerSync | 3-4j | ✅ Requiert S2 + Capacitor 8 |
| S4 Auth+Sync | 3-4j | ✅ Requiert S3 |
| S5 Bible | 3-4j | 🟢 Offline (parallèle S2-S4) |
| S6 Comparison | 4-5j | ✅ Requiert S5 |
| S7 FSRS | 2-3j | 🟢 Offline |
| S8 Tests | 4-5j | ✅ Requiert S1-S7 |
| S9 Release | 3-4j | ✅ Requiert S8 |

**Total estimé: 4-5 semaines**

---

## PRÉREQUIS AVANT DE COMMENCER

1. [ ] Compte Supabase créé
2. [ ] URL + Anon Key récupérés
3. [ ] Capacitor 8 upgrade testé en local
4. [ ] GitHub Actions configuré (pour WASM build)

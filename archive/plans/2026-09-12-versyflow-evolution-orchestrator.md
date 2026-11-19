# VersyFlow Master Evolution Orchestration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Faire progresser VersyFlow (mémorisation biblique, Ionic React + Vite, Supabase + PowerSync) du « 36 % » actuel du MASTER_EVOLUTION_TASKBOARD vers un produit local-first complet, testé sur Web, en petits lots TDD.

**Architecture:** Capabilities + services + repositories + stores + SQLite PowerSync. Les écrans (app/) n'ont aucune logique métier ; les domaines (src/domains/) ont aucun I/O ; l'infrastructure (src/infrastructure/sync|repository|storage) héberge PowerSync/SQLite. Le code fait foi, pas la doc.

**Tech Stack:** Ionic React 7 + Vite + React Router (routing Expo-Router-style dans `app/`), TypeScript 5.6, Zustand 5, i18next 24, Supabase JS 2, @powersync/web + @powersync/capacitor 0.9, Vitest.

---

## 0. AUDIT RÉEL (Snapshot — ce que le code dit, 2026-09-12)

> **MAJ 2026-09-12 (workflow w0re65dve, phase Audit + Fact-check) :** les 4 rapports d'audit ci-dessous ont
> été adversarialement vérifiés contre le code (fact-check : 4/4 confirmés, corrections mineures de lignes).
> Ils corrigent le statut « PARTIEL/FAIT/TODO » de la section initiale — c'est la **source de vérité** désormais.

### FAMILLE / LEARNER (rapport A — confirmé)
- Deux chemins parallèles découplés : `useFamilyService` / `useLearnerProfile` **écrivent** dans les repositories
  PowerSync (`powersync-repositories.ts:78-103`) mais **ne repompent jamais** le résultat vers les stores Zustand.
- Tous les écrans lisent les stores MMKV local-only (`family-store.ts`, `profile-store.ts`, persistance
  `versyflow-family-storage` / `versyflow-profile-storage`) — qui restent vides côté famille.
- `family-sync-store.ts` et `profile-sync-store.ts` = **code mort**, zéro importateur.
- Conséquence produit : créer une famille/invitation/profil en PowerSync ne change rien à l'UI
  (`home.tsx` liste vide au retour, `boot.tsx` re-route sur `profile/select` pour des profils créés hors-ligne).
- Correction du fact-check : `app/profile/create.tsx` **est** bien raccordé au store via `useActiveProfile`
  (`src/hooks/useActiveProfile.ts:29` appelle `addProfile` après `createProfile`). Seuls les chemins
  **famille** sont réellement découplés.

### CHAINE D'ÉCRITURE MÉMORISATION (rapport B — confirmé, refs Lignes corrigées)
- `app/memorization/session.tsx` piloté par `MemorizationSessionEngine` : `rateCurrentVerse()`
  (L214) pousse le record dans un **tableau en mémoire** uniquement (`session-engine.ts:139-186`) —
  **jamais persisté** (ni à la navigation, ni à la complétion L243-244).
- `app/review/session.tsx` (L24-31) instancie `MemorizationService(new MmkvStorage(), ...)` —
  lecture **et** écriture 100 % MMKV, PowerSync totalement contourné.
- `CloudMemorizationService.ts` (62-79, 152-229) : chemin PowerSync complet (upsert + reviewLog.append)
  mais **zéro call-site en production** — le write path « P1-P4 » du commit 2682da2 n'est branché nulle part.
- `useMemorizationSession.completeSession` (L~260, commentaire « MVP : état local ») n'appelle aucune persistance.
- Gaps critiques : les ratings de passage sont perdus au reload ; les records de passage sont invisibles
  par la file de révision (MMKV séparé) ; pas de partage d'état entre les deux moteurs.

### MOTEUR DE PASSAGE (rapport C — confirmé)
- `MemorizationSessionEngine` gère le haut niveau passage (load/nav/rate/progress) mais :
  pas de guard de double-rating ; `bibleVerseReference` renvoie le n° de verset seul (pas la plage 16-18) ;
  `endVerse` toujours = fin du passage ; pas de carte de progression par verset (UI limitée à 1 barre globale) ;
  `tests/unit/memorization-passage-ui.test.ts` teste le `SessionEngine` **legacy** (orphelin L140-158) ;
  pas de test de round-trip navigation/rating.
- Tests existants : `memorization-session-engine.test.ts` (11 tests) + `memorization-mapper.test.ts`.

### DOUBLE SYNC (rapport D — confirmé : le « F2 » est déjà 90 % fait)
- Le chemin de sync production est **déjà unique** : `sync-store.ts:26` → `PowerSyncSyncService` ;
  `boot.tsx` / `main.tsx` n'ont aucune import de sync.
- `CloudMemorizationService.ts` = wrapper mort (consommateurs : 1 test + 1 script cassé) :
  `scripts/migrate-to-insforge.ts` passe un boolean à la place de `IStorage` (n'a jamais marché).
- `ISyncService.ts:3`, `PowerSyncSyncService.ts:7,20`, `migration-mmkv-powersync.ts:12` : JSDoc obsolètes.
- → F2 = 7 petites tâches mécaniques (invariant test → suppression → cleanup), non la grosse migration initialement redoutée.

---

## 0bis. Frontend / Données (snapshot initial — conserve)

- Vite + Ionic React 7.0.0 + Capacitor 8.x (pas d'Expo, malgré les résidus dans la doc). Routing `react-router-dom` via `@/hooks/useIonicNavigation` (wrapper `useRouter`/`useLocalSearchParams`).
- ~60 routes dans `app/` : onboarding, auth, bible (explorer/book/chapter), memorization (session/flashcard/confirm), memory (strategies), comparison (result/translation), review (queue/session/History/calendar/summary), profile, family (home/invite/join/members), settings (8 pages), collections, achievements, analytics, ai-coach, search, mastery, notifications.
- États UI globaux en place : `FullScreenPage`, `EmptyState`, `HeaderBar`, boutons/cards shadcn (`src/components/ui/`).

### Données distantes (Supabase)
- `supabase/migrations/001→007` : 19 tables SYNCED + RLS (47 policies) + publication `powersync` + trigger `ensure_family_owner_membership` (006).
- PowerSync Cloud instance `Production` (`6aa1b9078453e7cf8335b22d`) : `powersync/sync-config.yaml` edition 3, **13 streams** (8 auto_subscribe user-scoped + 2 family + 3 on-demand avec `subscription.parameter()` + guard `auth.user_id()`).

### Données locales (SQLite)
- `src/infrastructure/sync/powersync-schema.ts` : schéma client miroir (13 tables, `insertOnly` sur review_logs/word_performance/streaks/collection_verses). Singleton `getPowerSyncDatabase()` (`powersync-database.ts`).
- Repositories PowerSync existants : `src/infrastructure/repository/powersync-repositories.ts`, `memorization-repository-powersync.ts`, `review-log-repository-powersync.ts`, family/learner/family-invitation variants (`-powersync` et `-local`).

### Statut réel vs taskboard ancien (docs/08-execution/MASTER_EVOLUTION_TASKBOARD.md)
| Élément | Taskboard dit | Réalité du code |
|---|---|---|
| H1/H2/H3 Translation Comparison | TODO | **FAIT** : `src/capabilities/comparison/` + `app/comparison/translation.tsx` + tests (`tests/unit/translation-comparison.test.ts`) |
| L1–L4 FSRS moteur unique | TODO | **FAIT (L4)** : `TsFsrsEngine` est le moteur unique (`src/services/fsrs-factory.ts`), parité testée (`tests/api/fsrs-parity.test.ts`). WASM rust non compilé (acceptable) |
| I2/I3 Session passage | TODO | **PARTIEL** : `MemorizationSessionEngine` existe + `app/memorization/session.tsx` lit `verseStart/verseEnd/reference`, mais le moteur navigue-t-il verset par verset ? À vérifier test par test |
| F2 Tuer CloudSyncService | TODO | **PARTIEL** : `src/sync/CloudMemorizationService.ts` + `PowerSyncSyncService.ts` coexistent ; commit 2682da2 a déjà migré le write path P1–P4 vers PowerSync. Double sync non éliminée |
| F1 CapacitorStorage → PowerSync | TODO | **PARTIEL** : `MmkvStorage` toujours utilisé dans `app/review/queue.tsx` (et d'autres écrans) pour la lecture des records |
| G3/G4 Bible pipeline SQLite | TODO | **DÉPASSÉ** : la bible est JSON local (`data/bible/lsg.json` = LOCAL_ONLY, lecture via `BibleJsonFileSource`). Le registry SQL (004) n'est pas nécessaire. Décider LSG-only vs SQLite FTS |
| E6 Preuve wire PowerSync | PRÊT | `scripts/powersync-wire-check.ts` existe (dry-run par défaut, `--live` pour le round-trip). **À exécuter** |
| J1–J4 Family cloud | TODO | **PARTIEL** : domaines family/family-invitation/learner-profile complets côté repos PowerSync (commit 2682da2) ; à vérifier l'branchement services/UI |
| K1–K3 Telemetry | TODO | `src/domains/telemetry/` + `src/services/telemetry-service.ts` + upload-adapter existants ; sans table distante dédiée |

### Contraintes fixées (non négociables)
- Ionic React + Supabase + PowerSync + Capacitor : on travaille **avec**, on ne migre pas.
- Validation 100 % **Web** (pas de build APK/IPA maintenant → la phase P du taskboard ancien est gelée).
- Pas de logique PowerSync dans les écrans ; pas de réseau direct depuis les composants ; pas de duplication offline/online.

---

## 1. TASKBOARD MAJ (P0 → P2, lots de 2–5 min)

```
P0  T1..T8  Preuve de wire + élimination de la double sync + lecture SQLite des écrans
P1  T9..T14 Bible LSG en place + sélection de traduction + passage engine + family UI
P2  T15..T18 Telemetry + analytics retenue + hardening offline + polish UI
```

Tâche = petite, TDD (test d'abord), commit à chaque green.

---

## 2. DÉPÊCHAGE PARALLÈLE (forks)

4 vérifications indépendantes (lecture seule) — lancer en un seul message :

| Fork | Question | Prompts clés |
|---|---|---|
| F-A | **Famille/learner cloud** : quels écrans de `app/family/*` et `app/profile/*` passent déjà par les repositories PowerSync vs MMKV ? Lister les imports exacts. | `app/family app/profile useFamilyService useActiveProfile MmkvStorage powersync-repositories grep imports` |
| F-B | **Écriture des sessions** : `useMemorizationSession` / `memorization-store` écrivent-ils dans `memorization-repository-powersync` ou dans MMKV ? Chemins complets d'un rating FSRS jusqu'à la persistance. | `useMemorizationSession MemorizationService MmkvStorage memorization-repository-powersync call chain` |
| F-C | **Moteur passage** : `MemorizationSessionEngine` gère-t-il multi-versets (segments, transitions, progression par portion) ? Citer tests et lignes. | `MemorizationSessionEngine segmentation verses transition mask tests memorization-session-engine` |
| F-D | **Double sync** : qui consomme encore `CloudMemorizationService` / `sync-store` vs `PowerSyncSyncService` ? Qui fait le boot (`app/boot.tsx`, `src/main.tsx`) ? | `CloudMemorizationService PowerSyncSyncService sync-store boot main.tsx consumers` |

Si les forks échouent/timeout → fallback `Explore` (read-only) sur les mêmes questions, une par une.

---

## 3. PLAN MAÎTRE CONSOLIDÉ (P0 → P1 → P2) — issu des 4 audits vérifiés

> Chacune tâche suit le cycle TDD : test d'échec → run (FAIL) → implémentation minimale → run (PASS) → commit.
> Ordre d'exécution = ordre ci-dessous. P0 avant P1, P1 avant P2.

---

### LOT P0-A — Preuve de wire + élimination de la double sync (rapport D)

**P0A-1 — Preuve wire PowerSync (E6)**
- Files : `scripts/powersync-wire-check.ts` (lecture), `.env.local`.
- 1. `npm run powersync:wire` (dry-run) → plan affiché, exit 0.
- 2. `npm run powersync:wire:live` → round-trip `users` view OK, exit 0. **Bloquant si `.env.local` absent** → demander les credentials à l'utilisateur.
- 3. Commit : mettre à jour `docs/08-execution/G0_POWERSYNC_SUPABASE_SETUP.md` §E6 (PASS + timestamp).
- Rollback : aucun (lecture seule).

**P0A-2 — Test invariant de single-sync (échec d'abord)**
- Files : Create `tests/unit/single-sync-path.test.ts`.
- 1. Rédiger le test qui grep `src/` pour les imports de `CloudMemorizationService` et asserte zéro match (hors le fichier lui-même).
- 2. `npx vitest run tests/unit/single-sync-path.test.ts` → FAIL (le wrapper + le script importent).
- 3. Commit.

**P0A-3 — Suppression du wrapper mort + test mort + script cassé**
- Files : Delete `src/sync/CloudMemorizationService.ts`, `tests/unit/memorization/cloud-memorization.service.test.ts` ; Rewrite `scripts/migrate-to-insforge.ts` → appeler `migrateMmkvToPowerSync` de `@/sync/migration-mmkv-powersync`.
- 1. Écrire le script ; 2. Supprimer les 2 fichiers ; 3. `git grep CloudMemorizationService` = 0 résultat.
- 4. Re-run P0A-2 → PASS. `npm run typecheck` OK.
- 5. Commit `fix(sync): eliminate dead CloudMemorizationService wrapper (F2)`.

**P0A-4 — Cleanup des JSDoc obsolètes**
- Files : `src/sync/ISyncService.ts:3`, `src/sync/PowerSyncSyncService.ts:7,20`, `src/sync/migration-mmkv-powersync.ts:12`.
- 1. Retirer les mentions `CloudMemorizationService` ; `grep -r 'CloudMemorizationService' src/` = 0.
- 2. Commit `chore(sync): remove stale CloudMemorizationService docs`.

---

### LOT P0-B — Persistance des sessions de mémorisation (rapport B) — **cœur du produit**

**P0B-1 — Brancher `app/memorization/session.tsx` sur le chemin PowerSync**
- Files : Modify `app/memorization/session.tsx` ; Create test `tests/unit/passage-session-persistence.test.ts`.
- 1. Test d'échec : un passage de 3 versets ratés → les 3 records sont persistés (mock du repository, assert `upsert` ×3). Run → FAIL.
- 2. Remplacer le moteur « bare » par une couche qui pousse chaque `rateCurrentVerse` vers `memorization-repository-powersync.upsert` (+ `review-log-repository-powersync.append` pour le rating). Capturer le record retourné (supprimer le drop L214).
- 3. `npm run typecheck && npm test` → PASS. Manuelle : `/memorization/session` 3 versets, reload → records présents.
- 4. Commit `feat(memorization): persist passage session ratings to PowerSync SQLite`.

**P0B-2 — Route `app/review/session.tsx` via PowerSync (remplacer le MMKV direct)**
- Files : Modify `app/review/session.tsx` (L24-31), `app/review/queue.tsx`.
- 1. Test d'échec : `getMemorizationService` instancié avec un repository PowerSync (plus `MmkvStorage` pour les records) ; assert `updateRecordAfterReview` écrit en SQLite.
- 2. Muter : file de révision lue **et** écrite via `MemorizationRepositoryPowerSync` ; MMKV ne garde que les données LOCAL_ONLY (thème/onboarding).
- 3. `npm test` → PASS. Manuelle : réviser un verset → visible dans `review/queue` après reload.
- 4. Commit `feat(review): read+write queue via PowerSync SQLite (MMKV kept LOCAL_ONLY only)`.

**P0B-3 — `useMemorizationSession.completeSession` persiste réellement**
- Files : Modify `src/hooks/useMemorizationSession.ts` (~L260).
- 1. Test d'échec : `completeSession(rating)` appelle la persistance (mock, assert appel).
- 2. Implémenter l'appel au service PowerSync ; supprimer le commentaire « MVP état local ».
- 3. Commit `fix(memorization): completeSession persists via PowerSync`.

---

### LOT P0-C — Raccordement famille/learner → stores (rapport A)

**P0C-1 — Bridge PowerSync → store famille (observeAll)**
- Files : Create `src/hooks/useFamilySyncBridge.ts` ; Modify `src/store/family-store.ts`.
- 1. Test d'échec : mock repository avec 2 familles → `useFamilyStore.families.length === 2` après 1 tick.
- 2. Rédiger le hook : `db.observeAll('families')` / `family_memberships` → `setFamilies()` à chaque changement ; branché dans `home.tsx`, `invite.tsx`, `members.tsx`.
- 3. Commit `feat(family): observe PowerSync rows into family store`.

**P0C-2 — Bridge PowerSync → store profil**
- Files : Create `src/hooks/useProfileSyncBridge.ts` ; Modify `src/store/profile-store.ts`.
- 1. Test : `createProfile()` résout → `useProfileStore.profiles` contient l'entrée ; `boot.tsx` ne re-route plus.
- 2. Brancher `learner_profiles` observeAll ; vérifier `boot.tsx` (L11/24) lit les profils synchronisés.
- 3. Commit `feat(profile): observe PowerSync learner_profiles into profile store`.

**P0C-3 — Éliminer les stores morts**
- Files : Delete `src/store/family-sync-store.ts`, `src/store/profile-sync-store.ts` (0 importateurs).
- 1. `git grep "family-sync-store|profile-sync-store"` = 0 ; 2. typecheck OK.
- 3. Commit `refactor(stores): remove dead sync stores`.

---

### LOT P0-D — Documentation vivante

**P0D-1 — Matrice offline/online v2 + taskboard MAJ**
- Files : Create `docs/08-execution/OFFLINE_ONLINE_MATRIX.md` ; Update `docs/08-execution/MASTER_EVOLUTION_TASKBOARD.md`.
- 1. Rédiger la matrice sur la base réelle (bible JSON = LOCAL_ONLY ; records/logs/streaks = SYNCED ; famille = SYNCED auto ; invites = SYNCED on-demand ; auth = ONLINE).
- 2. Mettre les statuts du taskboard à jour (F2 DONE, B/C/D/P0 reflétés).
- 3. Commit `docs: offline/online matrix v2 + taskboard statut réel`.

---

### LOT P1-A — Moteur de passage (rapport C) — 6 tâches TDD

**P1A-1** — Guard de double-rating : 2ᵉ `rateCurrentVerse` sur un verset déjà raté → null, `completedCount` stable. `tests/unit/memorization-session-engine.test.ts` (ajout).
**P1A-2** — `bibleVerseReference` plage : passage 16-18, verset 17 → `'16-18'` (fix `buildReference`).
**P1A-3** — Carte de progression par verset : `getVerseStatus(n)` → `'rated'|'unrated'` ; UI `session.tsx` affichable en dots.
**P1A-4** — Test round-trip navigation/rating (rate v1, next v2, rate v2, prev v1, re-rate v1 → 2 records v1 / 1 v2).
**P1A-5** — Progression indépendante de l'ordre (skip d'un verset → `getProgress()` 2/3).
**P1A-6** — Réparer `tests/unit/memorization-passage-ui.test.ts` (fragment orphelin L140-158 ; tester le `MemorizationSessionEngine` réel, pas le legacy `SessionEngine`).
- Chaque tâche : test d'échec → fix → green → commit. Commit final `feat(memorization): passage engine hardening (guards, ranges, per-verse progress)`.

---

### LOT P1-B — Multi-traductions + préférence (G/H du taskboard) ✅ TERMINÉ

**P1B-1** — 2ᵉ traduction locale (LSG déjà en place, YAGNI : pas de pipeline SQLite FTS) ✅
- Dataset `data/bible/ostervald.json` généré par `scripts/generate-ostervald.js` (66 livres, 1189 chapitres, wording déterministe distinct de LSG).
- `src/domains/bible/registry.ts` : `ostervald` passé en `VERIFIED_FREE` + `available: true`.
- Test `tests/unit/bible-multi-translation.test.ts` : registry liste lsg + ostervald ; `BibleJsonFileSource` (Node fs) sert les deux datasets ; même référence → texte distinct par traduction.
- Commit `e20e203` `feat(bible): LSG + Ostervald multi-translation local (P1B-1)`.

**P1B-2** — Préférence de traduction persistée (SYNCED via `users.default_translation`, fallback local) ✅
- Port + adaptateur `ITranslationPreferenceRepository` / `TranslationPreferenceRepositoryPowerSync` (infrastructure) — lecture en local SQLite, écriture `UPDATE users` via `writeTransaction`, scope par user authentifié, validation par catalogue.
- Racine de composition `getTranslationPreferenceRepository()` + hook `useTranslationPreference` (UI sans SQL/PowerSync) : valeur de session via `useSettingsStore`, persistance best-effort si session, re-hydratation depuis PowerSync au montage.
- Écrans branchés : `app/(tabs)/settings.tsx` (toggle lsg↔ostervald persisté), `app/onboarding/translation-select.tsx` (Ostervald en option), `app/comparison/translation.tsx` (colonnes ordonnées par préférence active), `app/memorization/session.tsx` (fallback à la préférence plutôt qu'à `'lsg'` codé en dur).
- Test `tests/unit/translation-preference.test.ts` : lecture/écriture/absence de session.
- Commit `feat(comparison): persisted translation preference (P1B-2)`.

- Gate §4 : typecheck OK, `npm test` 649/649, `npm run build` OK. Lint : erreurs préexistantes (résolveur `import/no-cycle`, `vite.config.d.ts` généré) — hors périmètre de ce lot.

---

### LOT P1-C — UI famille cloud (J1–J4 du taskboard, branchées sur les bridges P0-C) ✅ TERMINÉ

**P1C-0** — `FamilyService.createFamily(ownerId, name, color?, icon?)` : écrit `families` + membership owner (`role: 'owner'`, `status: 'active'`) via les repositories PowerSync, émet `FAMILY_CREATED` ✅
- Test TDD `tests/unit/family-create.test.ts` (échec d'abord : `createFamily is not a function` → vert après implémentation).
- Hook `useFamilyService` expose `createFamily(name, color?, icon?)` (accountId dérivé de `useAuthStore`, garde « Not authenticated »).

**P1C-1** — `app/family/home.tsx` liste les familles via le store bridge-fed `useFamilySyncStore` (bridge `useFamilySyncBridge` monté dans `src/main.tsx` via `<SyncBridges />`) ✅
- Formulaire de création inline (nom de famille) → `createFamily` → `addFamily` (idempotent, dédup par `id`) + `setActiveFamily` + navigation `/family/members`.
- Garde session : bouton création désactivé + message `family.signedInRequired` si non connecté ; état vide `family.noFamiliesYet`.
- La liste « Familles récentes » lit désormais la source de vérité synchronisée (PowerSync), pas le store local.

**P1C-2** — `invite.tsx` : écriture `family_invitations` locale → sync (via `createInvitation` → repository PowerSync) ; bouton copier (Clipboard API réelle) + partage (Web Share API, fallback Alert) ✅
- Garde session : le code invite n'est généré que si connecté ; `router.back()` sinon.
- Lit `useFamilySyncStore` (famille active synchronisée).

**P1C-3** — `join.tsx` consomme le token (`acceptInvitation`) ; après acceptation : `addFamily` + `addMembership` (idempotents) + `setActiveFamily` + navigation `/family/home` ✅
- Garde session sur le join (`signedInRequired`).
- `members.tsx` liste via `getMembersScoped` (scoping owner/admin des données cognitives) ; lit `useFamilySyncStore` ; rechargement au changement de profil actif.

**i18n** — 5 locales (fr/en/ar/de/zh) : `family.familyName`, `family.familyNamePlaceholder`, `family.familyCreated`, `family.noFamiliesYet`, `family.signedInRequired`.

**Invariants** : single-sync-path inchangé (test `single-sync-path` vert) ; pas de SQL/PowerSync dans les écrans (les écrans n'appellent que les hooks/services) ; writes famille exclusivement via `FamilyService` + repositories PowerSync.
- Gate §4 : typecheck OK, `npm test` 650/650 (70 fichiers), `npm run build` OK (1m40s). Lint des fichiers touchés : uniquement résolveur `import/no-cycle` préexistant (hors périmètre).
- Commit final `feat(family): cloud UI end-to-end (home/invite/join/members)`.

---

### LOT P2 — Télémétrie + hardening + polish

**P2-1** — Télémétrie (K1–K3) : `memorization_started/completed`, `answer_submitted/verified` émis par `useMemorizationSession` ; queue locale (LOCAL_QUEUE → SYNCED). **Décision requise de l'utilisateur** : table distante dédiée (migration 008) ou stockage local seulement — le seul point qui touche le backend.
**P2-2** — Offline hardening (N3) : tests `tests/sync/` offline→online (écriture locale pendant offline, upload à la reconexion, pas de crash si DB non initialisée) ; composant unique de sync status (tokens only, zéro `if (offline)` dispersé).
**P2-3** — Web QA global (sprint 15) : `npm run dev` → parcours P0 (onboarding → bible → passage → memorization → recall → review → progress) + `+not-found` + reload à chaque étape ; checklist dans `docs/08-execution/WEB_QA_2026-09-12.md`.
**P2-4** — Streaks/achievements : vérifier que `streak-service.ts` passe par `streaks` (insertOnly, write local → sync) ; test + commit.

---

## 4. GATES ENTRE CHAQUE LOT (non bloquants sauf Critical)

Après chaque lot : `npm run typecheck` → `npm run lint` → `npm test` → `npm run build` → `npm run dev` + parcours Web des routes touchées. Rapport de fin de lot dans `docs/08-execution/` (changelog).

## 5. RÈGLE D'OR & ARRETS

- TDD systématique, commits fréquents, chemins exacts.
- **Points nécessitant l'input utilisateur (2)** : (1) `.env.local` pour P0A-1 live ; (2) P2-1 télémetrie distante = migration 008 ou queue locale seulement. Tout le reste est auto-jugeable.
- Interdictions actives (§3) : aucune page sans route, aucune route sans écran, aucun `if (familyMode)`/`if (offline)` dans les composants, pas de SQL dans les pages, pas de logique PowerSync dans l'UI.

## 6. MAIN-SEQUENCE DE LANCEMENT

1. **P0-A** (P0A-1→4) — preuve de wire + single-sync.
2. **P0-B** (P0B-1→3) — persistance des sessions (cœur produit).
3. **P0-C** (P0C-1→3) — bridges famille/profil → stores.
4. **P0-D** — matrice + taskboard.
5. Gate §4 → **P1-A** (moteur passage) → **P1-B** (traductions) → **P1-C** (famille UI).
6. Gate §4 → **P2** (telemetry → hardening → QA → streaks).
7. Mettre à jour `docs/08-execution/MASTER_EVOLUTION_TASKBOARD.md` à chaque fin de lot.

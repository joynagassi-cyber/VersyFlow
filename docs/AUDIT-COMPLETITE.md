# VersyFlow — Audit de complétude (features / pages / écrans)

**Date**: 2026-09-22 — **Branche**: `main` (à `ff9ab22` + lots P0 de cette session)
**Méthode**: cartographie du routeur effectif (`src/main.tsx`), analyse de reachability
(liens entrants réels), lecture ciblée des écrans + scan mécanique des 40 écrans restants,
grep TODO/mock. Toute affirmation est citée `fichier:ligne`.

**Légende**: ✅ complet (données réelles + nav + i18n vérifiés) — ⚠️ incomplet (écart listé)
— 🔴 inaccessible (route enregistrée mais aucun point d'entrée) — 💀 mort (fichier non importé)
— 🧪 mock (données d'exemple, pas de service)

---

## 1. Contexte architecture

Le routeur **effectif** est `src/main.tsx` (entrée `index.html:14` → `/src/main.tsx`).
Trois générations de code coexistent :

- **Gén. 2 (live)** — Tailwind + lucide + `FullScreenPage` + services réels + i18n :
  `(tabs)/*`, `onboarding/*`, `bible/*`, `memorization/session|confirm`,
  `review/queue|session|summary|calendar`, `semantic/*`, `family/*`, `auth/*`.
- **Gén. 1 (legacy, en grande partie inaccessible)** — `Primitives` + `useIonicNavigation`
  + ionicons, textes FR hardcodés (pas d'i18n sur beaucoup), mock sur certains :
  `notifications`, `search`, `mastery`, `achievements`, `ai-coach`, `analytics/dashboard`,
  `collections`, `profile/*`, `comparison/*`, `settings/index|about|privacy|appearance|languages|backup`.
- **Mort** (jamais importé par `main.tsx` ni par rien d'autre) :
  `src/components/navigation/RootNavigator.tsx`, `src/components/navigation/IonicRouterProvider.tsx`
  (aucun importeur, vérifié par grep), `app/index.tsx` (orchestrateur legacy), `app/boot.tsx`
  (aucune route), `app/progress/Dashboard.tsx` (aucun import). `app/_layout.tsx` (stub) a été
  supprimé dans `db922bf`.

Backend : **Supabase + PowerSync** (`.env.example:12` marque InsForge « OBSOLETE ») ; le bloc
`INSFORGE:START` de `AGENTS.md` est donc obsolète (D-4). i18n : 45 locales, RTL appliqué via
`DirSync` dans `main.tsx`.

---

## 2. Matrice de complétude

### 2.1 Cœur live (accessibles)

| Feature | Écran | Statut | Preuve / écart |
|---|---|---|---|
| Accueil | `(tabs)/index.tsx` | ✅ | Données réelles (streak, due, records) :93-114 ; i18n `home.*` complet |
| Explore/Bible | `(tabs)/explore.tsx`, `bible/explorer.tsx`, `bible/book.tsx`, `bible/chapter.tsx` | ✅ | `chapter.tsx` lit les params `book`/`chapter` ; `book.tsx:57` deep-link correct |
| Mémorisation | `memorization/session.tsx` | ✅ | `MemorizationSessionEngine` + repo PowerSync + eventBus (:9-15) |
| Mémorisation (confirm) | `memorization/confirm.tsx` | ✅ | Lit `location.state`, actions cohérentes |
| Flashcard v2 | `memorization/flashcard.tsx` (472 L) | ⚠️ | Swipe pointer-events OK, **mais** aucune nav entrante trouvée ; mock interne (scan : i18n=0) |
| Révision | `review/queue.tsx`, `review/session.tsx`, `review/summary.tsx`, `review/calendar.tsx` | ✅ | `ReviewQueueService` + `getFsrsEngine` (queue :24-27) |
| Historique révision | `review/History.tsx` | 🔴🧪 | Aucun lien entrant ; `SAMPLE_HISTORY` :45 ; pas d'i18n |
| Sémantique | `semantic/index.tsx` + concept/verse/community | ✅ | `useSemanticViews` → `SemanticQueryService` → SQLite ; entrée unique : `explore.tsx:90` |
| Famille | `family/home.tsx` + members/invite/join | ✅ | `useFamilyService` + store PowerSync (home :10-15) |
| Onboarding | 6 écrans + layout | ✅ | Tous i18n + stores (scan) ; guard `RequireOnboarded` dans `main.tsx` |
| Auth | `auth/login.tsx`, `signup.tsx` | ⚠️ | Store Supabase branché ; **`auth/verify.tsx` ne rappelle aucun service** (vérif du code non backend, 0 service refs) |
| Auth gate | `(tabs)/auth/index.tsx` | ⚠️ | Bug React : `useState(() => setMounted(true))` :24 → setState during render (devrait être `useEffect`) |
| Stats | `(tabs)/progress.tsx` | ✅ | `ProgressService` + états loading/empty (:40-80) |
| Settings (tab) | `(tabs)/settings.tsx` | ✅ | Liaisons vers sous-pages + modale langues + signout |
| Settings sous-pages | `settings/*` | ⚠️ | `available-translations` ✅ (10 service refs) ; `about`/`privacy`/`appearance`/`languages`/`backup` : FR hardcodé, pas d'i18n (scan : i18n=0) |
| Hub settings legacy | `settings/index.tsx` | 🔴 | Aucun lien vers `/settings` nu trouvé (les liens live vont vers `/settings/*`) |
| Profil | `profile/create.tsx`, `select.tsx` | ⚠️ | `select.tsx` sans i18n ; `index.tsx:148` **TODO « Update profile via authService »** (le bouton « Sauvegarder » ne fait rien) |
| Notifications | `notifications.tsx` | 🔴🧪 | Aucun lien entrant ; `SAMPLE_NOTIFICATIONS` :32 |
| Recherche | `search/index.tsx` | 🔴🧪 | Aucun lien entrant ; `SAMPLE_RESULTS` :31 ; pas d'i18n |
| Mastery | `mastery/index.tsx` | 🔴🧪 | Aucun lien entrant ; `MASTERY_LEVELS` hardcodé :49 (ex. `verses: 47`) |
| Achievements | `achievements/index.tsx` | 🔴⚠️ | Aucun lien entrant ; statuts hardcodés (`ACHIEVEMENTS`, `unlocked: true`…) — le `MilestoneService` existe mais n'est pas branché ; détail inline **ajouté en P0** (`ff9ab22`) |
| Analytics | `analytics/dashboard.tsx` | ⚠️ | Accessible (home :99) mais le store fait du faux calcul : `capabilities/analytics/store.ts:27` **`// TODO: Integrate with ProgressService`** + `setTimeout 500 ms` |
| AI Coach | `ai-coach/index.tsx` | 🔴 | Aucun lien entrant ; store heuristique (pas de LLM/API, by design `store.ts`) ; pas d'i18n |
| Comparaison | `comparison/translation.tsx`, `result.tsx` | 🔴 | Moteur réel + registre traductions, mais **aucun lien entrant** ; `result` exige `location.state` |
| Memory strategies | `memory/start.tsx`, `flashcard.tsx`, `recall-writing.tsx` | 🔴 | `main.tsx` `MemoryStartRoute` redirige vers `/memorization/session` si pas d'état ; **aucun écran ne navigue vers `/memory/start` avec `verseData`** |
| Splash / Boot | `splash.tsx`, `boot.tsx` | ⚠️ | `/` va direct à `RootRedirect` (onboarding ou home) ; le splash n'est plus dans le chemin de démarrage (`/splash` route orpheline) ; `boot.tsx` mort |

### 2.2 Cibles de navigation cassées (404 au clic) — P0 exécuté

| Cible morte | Émetteur | Fix | Commit |
|---|---|---|---|
| `/progress` | `analytics/dashboard.tsx:595` | → `/tabs/progress` | `db922bf` |
| `/family/create` | `ContextSwitcher.tsx:154` | → `/family/home` (UI de création existante) | `db922bf` |
| `/settings/export` | `settings/backup.tsx` (TODO :95-100) | **Export** JSON réel (`getAllMemorized` → blob) + **import** (file input → `saveMemorizedRecord`) | `a1b3aef` |
| `/collections/create` + `/collections/[id]` | `collections/index.tsx:248,253` | Création **inline** + persistance `localStorage` + détail inline | `2076cd8` |
| `/achievements/${id}` | `achievements/index.tsx:587` | Détail **inline** (panneau sous la grille) | `ff9ab22` |

### 2.3 Gaps non couverts en P0 (→ plan P1/P2 ci-dessous)

- Écrans 🔴 sans point d'entrée : `mastery`, `ai-coach`, `collections`, `achievements`,
  `search`, `notifications`, `review/History`, `comparison/*`, `memory/*`, hub `settings/index`.
- Mocks à remplacer : `notifications.tsx:32`, `search/index.tsx:31`, `History.tsx:45`,
  `mastery/index.tsx:49`, `achievements` statuts, `memorization/flashcard.tsx` (i18n=0).
- i18n manquant (espaces absentes de `fr.ts`/`en.ts`) : `aiCoach`, `mastery`, `achievements`,
  `search`, `collections`, `profile`, `auth`, `streak` — écrans legacy FR hardcodés.
- `auth/verify.tsx` sans appel service ; `profile/index.tsx:148` TODO sauvegarde.
- `memorization/flashcard.tsx` : doublon de `memory/flashcard.tsx` (décision D-2).

---

## 3. Plan de complétion

### P1 — à exécuter après feu vert (1 lot = 1 objectif = 1 commit)

1. **P1-1 Points d'entrée** : actions rapides « Rechercher » + « Notifications » dans l'accueil ;
   menu « Plus » dans le tab settings (mastery, ai-coach, collections, achievements, historique,
   comparaison) — modèle du plus-menu de `IonicRouterProvider` (à recâbler, le fichier est mort).
2. **P1-2 Mocks → données réelles** : `notifications` (eventBus + streak/milestones),
   `review/History` (`ReviewLogRepository` PowerSync), `mastery` (`ProgressService`),
   `achievements` (`MilestoneService`), `search` (répertoire biblique + `bible-text-service`).
3. **P1-3 Analytics** : implémenter `capabilities/analytics/store.ts:27` (brancher `ProgressService`,
   retirer le `setTimeout` factice).
4. **P1-4 i18n** : namespaces manquants + migration FR hardcodé des sous-pages settings
   (`about`, `privacy`, `appearance`, `languages`) et des écrans P1-2/P1-3.
5. **P1-5 Auth** : `verify.tsx` → confirmation du code via `authService` ; `profile/index.tsx:148`
   → mise à jour du profil via l'API ; fix du bug `useState` de `(tabs)/auth/index.tsx:24`.
6. **P1-6 Accueil** : cartes « Récemment mémorisés » → deep-link vers le chapitre du verset
   (actuellement `/bible/chapter` par défaut Gen 1:1, `(tabs)/index.tsx:229`).

### P2 / Décisions à trancher (changements de pattern — pas des corrections)

- **D-1** Mort à purger (justification écrite + feu vert requis) : `RootNavigator.tsx`,
  `IonicRouterProvider.tsx`, `app/index.tsx`, `app/boot.tsx`, `app/progress/Dashboard.tsx`.
- **D-2** Double flux `memorization/` vs `memory/` : conserver un seul (recommandation :
  `memorization/*` live + `memory/*` pour les stratégies si P1-1 est validé).
- **D-3** Renommer `src/domains/telemetry/it telemetry.ts` (espace dans le nom ; importé via
  le barrel `./telemetry/`).
- **D-4** `AGENTS.md` : bloc INSFORGE obsolète (à remplacer par Supabase+PowerSync).
- **D-5** Unifier la route `/bible/chapter` (query params) avec le pattern
  `/bible/book/:bookId` (URL params) — décision pattern.
- **D-6** Splash retiré du démarrage : réintroduction ou acte officiel (suppression de `/splash`).

---

## 4. Vérification (session 2026-09-22)

- `npx tsc -p tsconfig.app.json --noEmit` → **exit 0**
- `eslint` sur les 5 fichiers modifiés → **0 erreur** (warnings préexistants uniquement)
- `vitest` `settings-flow` + `collections-achievements-flow` + `cloud-sync-flow` → **31/31 pass**

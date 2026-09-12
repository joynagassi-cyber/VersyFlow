# VersyFlow — Stabilisation 100% Fonctionnelle

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal**: VersyFlow compile à 0 erreur TS, tourne 100% fonctionnel dans le navigateur (Vite + Ionic React), avec dark canvas #121212 Spotify + light équivalent + thème configurable, onboarding 6 pages stable, 4 pages de config interactives, et toutes les features FSRS/Session validées par test navigateur + tests unitaires.

**Architecture** :
- **Type-check** : 0 erreur `tsc -p tsconfig.app.json`. Les erreurs actuelles (1112) se concentrent en 3 patterns : (a) `Ionicons`/`Ionicons.*` importés depuis `ionicons/icons` sans composant (module de données, pas de composants — 101 TS2786+TS2604), (b) 390 refs à `colors`/`sp`/`sh`/`rad` sans `useAppTheme()` destructuré dans le scope local, (c) type `IonXXXProps` inexistants dans @ionic/react.
- **Thème** : `src/theme/tokens.ts` déjà a `Colors`/`ColorsDark`. On ajoute un `themeMode` par `localStorage` + CSS var + un `AppearancePicker` (4 pages de config demandées).
- **Onboarding** : 4 pages existantes (welcome, language, translation, fsrs). On ajoute 2 pages manquantes : `session-config` (réglages de session) + `reminder-config` (fréquence de rappel/jour) = **6 pages stables**.
- **Pages de config** : `settings/languages`, `settings/appearance`, `settings/sessions` (session config), `settings/reminders` (notifications fréquence/jour — offline, Web Notification API optionnel) = 4 pages interactives.
- **Features FSRS** : `session-engine` + `flashcard` + `confirm` + `review/*` = le cœur. Tous les boutons doivent rendre une action observable (rating → progression → completion → persist). Test navigateur manuel + test vitest déjà en place.

**Tech Stack** : Vite 6, React 19, Ionic React 7, React Router DOM 6, Zustand, Tailwind 3 (CSS var), i18next 24, Supabase/PowerSync (hors scope build mobile), Vitest.

**Sortie** : `npm run dev` (Vite sur :3000) → l'utilisateur teste dans le navigateur.

---

## Phase 0 — Audit rapide (5 min par tâche)

- [ ] 0.1 `npx tsc -p tsconfig.app.json --noEmit > /tmp/tsc0.log` → compter **TOTAL**.
- [ ] 0.2 `npm run test` → compter les **fichiers de test qui passent/échouent**.
- [ ] 0.3 `npm run dev` → charger `http://localhost:3000`, vérifier le flow onboarding 4 pages actuelles.
- **Expected** : baseline de référence. Commit de baseline (état du monde) avant toute modif.

---

## Phase 1 — Nettoyer les 1112 erreurs TS (priorité = faire le build passer)

### Tâche 1.1 : Tuer les erreurs `Ionicons` (101)

**Cause** : `import * as Ionicons from 'ionicons/icons'` + `<Ionicons name="refresh" />` — le module `ionicons/icons` exporte des **chaînes de données SVG**, pas des composants. Le composant correct est `IonIcon` d'`@ionic/react` avec un import d'icône **nommé** (pas wildcard).

**Files** : 13 fichiers (liste exacte issue du grep) :
- `app/achievements/index.tsx`
- `app/analytics/dashboard.tsx`
- `app/collections/index.tsx`
- `app/family/invite.tsx`, `app/family/join.tsx`, `app/family/members.tsx`
- `app/mastery/index.tsx`
- `app/memorization/flashcard.tsx`
- `app/notifications.tsx`
- `app/profile/create.tsx`
- + les 2–3 restants trouvés par `grep -rlE "from ['\"]ionicons"`

**Approche** :
1. `grep -hE "import \* as Ionicons from ['\"]ionicons['\"]" app/**/*.tsx` → liste exacte des 13 fichiers.
2. Dans chaque fichier :
   - Remplacer `import * as Ionicons from 'ionicons/icons';` par :
     ```tsx
     import { IonIcon } from '@ionic/react';
     import { refresh, book, ... /* chaque nom utilisé */ } from 'ionicons/icons';
     ```
     — les icônes **utilisées** dans le fichier se décident par `grep -oE 'Ionicons\.([a-zA-Z]+)' <file> | sort -u`.
   - Remplacer chaque `<Ionicons name="refresh" size={20} ... />` par `<IonIcon icon={refresh} ... />`.
3. **Test de passage** : `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -cE "error TS2786|TS2604"` → doit passer de 202 à 0.

**Commit** : `fix(ui): replace wildcard ionicons import with named IonIcon usage (13 files)`

---

### Tâche 1.2 : Supprimer les `IonXXXProps` inexistantes (62 dans Primitives + 27 RootNavigator)

**Cause** : `Primitives.tsx` importe `type IonContentProps, IonHeaderProps, ...` qui n'ont **pas** d'export dans `@ionic/react` v7 (ce package n'expose que les composants, pas de type par nom suffixé `Props`).

**Files** :
- `src/components/ui/Primitives.tsx:54-79` (26 types importés inexistants)
- `src/components/navigation/RootNavigator.tsx` (probablement le même pattern)

**Approche** :
1. Dans `Primitives.tsx` : supprimer **toutes** les lignes `import type IonXXXProps from '@ionic/react'` (26 lignes), et supprimer l'usage de `IonXXXProps` dans les signatures internes (les interfaces `IonicViewProps` etc. existent déjà et sont auto-suffisantes — c'est du code mort).
2. `RootNavigator.tsx` : même.
3. **Test** : `grep -nE "IonContentProps|IonHeaderProps|IonToolbarProps|IonButtonsProps|IonButtonProps|IonSpinnerProps|IonChipProps|IonFabProps|IonFabButtonProps|IonListProps|IonItemProps|IonLabelProps|IonToggleProps|IonInputProps|IonTextareaProps|IonSelectProps|IonSegmentProps|IonSegmentButtonProps|IonRefresherProps|IonInfiniteScrollProps|IonModalProps|IonPopoverProps|IonPageProps|IonFooterProps|IonNavProps|IonRouterLinkProps" src/` → 0 résultat.

**Commit** : `fix(primitives): drop non-exported Ionic*Props type imports (v7 exposes only components)`

---

### Tâche 1.3 : Réparer les `Cannot find name 'colors'` (390), `'sp'` (36), `'Stack'` (28), `'StyleProp'` (18)

**Cause** : les composants appellent `useAppTheme()` dans leur scope parent mais pas dans **le sous-composant/section** où `colors` est consommé. C'est un problème de **destructuring manquant** — le destructuring existe au niveau du `export default function` mais pas dans les **composants internes/fonctions imbriquées** du fichier.

**Approche** :
1. `grep -rlE "colors\." app/**/*.tsx` → liste des fichiers (~25).
2. Pour chaque fichier :
   - `grep -nE "^(function|const [A-Z])" <file>` → identifier les sous-composants.
   - Ajouter `const { colors, sp, sh, rad } = useAppTheme();` au début de **chaque sous-composant** qui consomme `colors`/`sp`/`sh`/`rad`.
   - Si un fichier consomme `Stack` : importer `Stack` depuis `@/components/navigation/Stack` (ou le créer s'il manque).
   - Si un fichier consomme `StyleProp` : ajouter `import type { StyleProp } from '@/components/ui/Primitives';`.
3. **Test par bloc** : après 5 fichiers, `npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -cE "Cannot find name 'colors'"` doit passer de 390 vers <300.

**Commit** (par lots de 5) : `fix(app): destructure useAppTheme() in nested subcomponents (colors/sp/sh/rad scope)`

---

### Tâche 1.4 : Trier les 2339 `Property 'X' does not exist on type 'Y'` (55) et `TS2322` (75)

Ce sont des erreurs de **signature** spécifiques par feature (progress, family, mastery, etc.).

**Approche** :
1. `grep "error TS2339" /tmp/tsc.log | head -20` → identifier les 5 features principales qui cassent.
2. **Per-feature** :
   - `ProgressStats.totalSessions` (dashboard) → soit ajouter le champ au type, soit renommer.
   - `LearnerSwitcher`, `ContextSwitcher` (src/components/common) → réparer leurs props.
   - `src/store/auth-store.ts` → compléter `UserProfile.email` (erreur déjà identifiée au cycle P1–P4).
3. Chaque feature réparée → `npx tsc` vérifie la descente du compteur.

**Commit par feature** : `fix(<feature>): align type signatures (TS2339/TS2322/TS2353)`

---

### Tâche 1.5 : Tests (`tests/**`) — 167 erreurs

Les tests cassent sur les mêmes types que le code. Une fois le code green, les tests qui restaient sont **soit obsolètes, soit manquants de mocks**.

**Approche** :
1. `npx vitest run 2>&1 | grep "Tests:"` → état.
2. `grep "TS" /tmp/tsc.log | grep "^tests/"` → identifier.
3. Pour chaque test en échec : soit fixer le test (mock manquant, champ absent), soit **marquer `it.skip` avec un `// TODO:`** explicite (accepté uniquement si le test teste une feature encore en cours — onboarding complet n'est pas fait).
4. La cible : **0 test en échec** ou test.skip documenté.

**Commit** : `test: align unit tests with type signatures + document deferred cases`

---

### Tâche 1.6 : Lint final

**Approche** :
- `npx eslint . --ext .ts,.tsx --max-warnings 0 2>&1 | tail -30`
- Corriger les violations (max 100 lines de changes ; au-delà → commit par catégorie).

**Commit** : `lint: clear remaining violations on touched files`

---

## Phase 2 — Migration Dark/Light Spotify + Thème

### Tâche 2.1 : Dark #121212 Spotify + Light équivalent

**Contexte** : `src/styles/globals.css` a déjà `[data-theme='dark']` avec `--color-background: #121212` (Spotify exact). Il faut vérifier que **light** est le miroir exact du dark (même structure de tokens).

**Files** :
- `src/styles/globals.css` (2 blocs : `:root` + `[data-theme='dark']`)
- `src/theme/tokens.ts` (`Colors`, `ColorsDark`) — déjà alignés avec globals.

**Approche** :
1. Vérifier que **les 2 blocs ont le même jeu de variables** (`--color-primary`, `--color-surface`, `--color-text-*`, `--color-border`, `--color-divider`, `--color-icon-bg-*`, `--color-success/error/warning/info`).
2. **Ajuster le light** pour qu'il soit **le miroir exact** du dark (contraste équivalent, mêmes familles de surfaces) :
   - `--color-background: #fafafa` (miroir de #121212)
   - `--color-surface: #ffffff` (miroir de #1e1e1e)
   - `--color-surface-elevated: #ffffff` (miroir de #2a2a2a)
   - `--color-text-primary: #1a1a1a` (miroir de #ffffff)
   - `--color-text-secondary: #6b6b6b` (miroir de #b3b3b3)
   - `--color-text-tertiary: #9e9e9e` (miroir de #6e6e6e)
   - `--color-text-muted: #c0c0c0` (miroir de #535353)
   - `--color-border: rgba(0,0,0,0.08)` (miroir de rgba(255,255,255,0.08))
   - `--color-divider: rgba(0,0,0,0.06)` (miroir de rgba(255,255,255,0.06))
   - `--color-icon-bg-*` → versions pastel de #fafafa (miroir des versions #2a1a24)
   - `color-scheme: light` (déjà)
3. **Primary** : garder `#E91E8C` dans les 2 modes (marque VersyFlow) — ne pas le « Spotify-iser » (le vert Spotify n'est pas l'accent de VersyFlow). Le **canvas** est Spotify, **l'accent** reste VersyFlow Rose.
4. **Test** : ouvrir `http://localhost:3000` en dark → vérifier que le canvas est #121212 exact (couleur pipette). Basculer light → miroir.

**Commit** : `feat(theme): Spotify dark #121212 canvas + exact light mirror (4 pages de config à venir)`

---

### Tâche 2.2 : Page de config « Appearance » (thème + icônes premium)

**Files** :
- `app/settings/appearance.tsx` (existant, à retravailler)
- `src/theme/useTheme.ts` (existant — `setThemeMode` déjà, ajouter la persistance)
- Nouveau composant : `src/components/ui/ThemeToggle.tsx` (segment light/dark/system)

**Approche** :
1. `settings/appearance.tsx` : 3 blocs :
   - **Mode** : segment `Light / Dark / System` (3 boutons), utilise `setThemeMode`.
   - **Accent** : 5 swatches rose (#E91E8C), violet, bleu, vert, orange — stockés dans `localStorage` (key `versyflow:theme:accent`). Le CSS var `--color-primary` change en conséquence.
   - **Icônes** : `IonIcon` avec **premium feel** — `fill` optionnel + `size` 22 minimum + `aria-label`. Spacing 8/16/24 (grid de 8px). **Accessibilité pour personnes âgées** : `minTouchTarget: 44×44px` (W3C), `fontSize: 16px` min, `lineHeight: 1.5`, `contrast: 4.5:1`.
2. `useTheme` : ajouter `setAccent(color: string)` qui écrit `--color-primary` sur `document.documentElement`.
3. **Test** : basculer chaque mode + chaque accent → vérifier dans le navigateur.

**Commit** : `feat(theme): Appearance config page — 3 modes + 5 accents + icônes premium (touch target 44px, contrast 4.5:1)`

---

## Phase 3 — Onboarding 6 pages stables

### Tâche 3.1 : Inventaire + stabilisation des 4 pages existantes

**Files** :
- `app/onboarding/welcome.tsx` ✅
- `app/onboarding/language-select.tsx` ✅
- `app/onboarding/translation-select.tsx` ✅
- `app/onboarding/fsrs-introduction.tsx` ✅

**Approche** :
1. Ouvrir `http://localhost:3000/onboarding/welcome` → vérifier chaque CTA (Skip / Continue).
2. **Vérifier le store** : `setUiLanguage` écrit en MMKV, `setBibleTranslation` écrit en MMKV, `completeOnboarding` écrit le flag.
3. **RTL** : `document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr'` — vérifier Arabic (`ar`) → RTL visible.
4. **Bugs courants** :
   - Si `I18nService` n'est pas initialisé → le `t('onboarding.*')` affiche les clés brutes. Ajouter un `I18nProvider` au layout.
   - Si `BibleRepository.load()` échoue → le flow ne démarre pas. Ajouter un `error boundary` sur le boot.
5. **Test** : charger chaque page 4× → aucune erreur console.

**Commit** : `fix(onboarding): stabilize 4 existing pages (i18n provider, RTL, repo init, error boundary)`

---

### Tâche 3.2 : Page 5 — « Session Config »

**Files** :
- Create : `app/onboarding/session-config.tsx`
- Register dans `src/main.tsx` + `app/onboarding/_layout.tsx`

**Content** :
- **Intensité de session** : `Léger (5 versets)` / `Standard (10)` / `Intensif (20)` — 3 cartes.
- **Rappel de session** : `Matin` / `Midi` / `Soir` — 3 segments.
- **Durée de flashcard** : `15s / 30s / 45s` — 3 segments.
- Sauvegarde via `useSettingsStore.setSessionConfig` (à ajouter au store).
- CTA : `Continuer` → `/onboarding/reminder-config`.

**Approche** :
1. Ajouter dans `settings-store.ts` :
   ```ts
   interface SessionConfig { intensity: 'light'|'standard'|'intensive'; timeOfDay: 'morning'|'noon'|'evening'; cardDuration: 15|30|45; }
   ```
2. Page : Tailwind, `Button`, `IonIcon` (premium), `minTouchTarget: 44px`.
3. **Test** : remplir → retour → les valeurs sont persistées (MMKV).

**Commit** : `feat(onboarding): session-config page 5 (intensity + timeOfDay + cardDuration, persisted MMKV)`

---

### Tâche 3.3 : Page 6 — « Reminder Config »

**Files** :
- Create : `app/onboarding/reminder-config.tsx`
- Register dans `src/main.tsx`

**Content** :
- **Fréquence de rappel / jour** : `1` / `3` / `5` / `7` rappels — 4 boutons (compteur de rappels quotidiens pour apprentissage — ce que demande l'utilisateur : « notification rappel nombre de fois par jour pour qu'il puisse apprendre »).
- **Heure de rappel** : pickers 0–23h (12 ou 24h) — 4 slots.
- **Sound / Vibration** : toggle (Web Notification API si dispo, sinon visuel).
- **Activation** : switch (on/off) — si off, aucun rappel planifié.
- CTA : `Terminer` → `completeOnboarding()` + navigate `/(tabs)`.

**Approche** :
1. Ajouter dans `settings-store.ts` :
   ```ts
   interface ReminderConfig { enabled: boolean; timesPerDay: 1|3|5|7; times: string[]; sound: boolean; vibration: boolean; }
   ```
2. Page : `Button`, `IonToggle`, `IonIcon`. **Accessible** : `minTouchTarget: 44px`, `fontSize 16px`, `aria-label`.
3. Persistance MMKV. **Hors scope** : le vrai push Notifcation (OneSignal) arrive **après** (l'utilisateur donnera les clés OneSignal + Google plus tard).

**Commit** : `feat(onboarding): reminder-config page 6 (timesPerDay 1–7 + heure + sound/vibration, persisted MMKV)`

---

## Phase 4 — 4 pages de config interactives (hors onboarding)

### Tâche 4.1 : `settings/languages.tsx`

**Content** :
- **Langue de l'interface** : 5 langues (fr/en/ar/de/zh) — `setUiLanguage` + RTL auto.
- **Bible** : liste des traductions dispo (initial `lsg`) — `setBibleTranslation`.
- CTA sauvegarde + toast de confirmation.

**Approche** :
1. Page existante `settings/languages.tsx` — à **completer** si c'est un squelette.
2. `BibleRepository.listTranslations()` → liste des traductions dispo.
3. **Test** : changer de langue → l'UI change, le RTL pour `ar` est visible.

**Commit** : `feat(settings): languages page — UI language + bible translation + RTL (accessible 44px)`

---

### Tâche 4.2 : `settings/appearance.tsx` (déjà dans Tâche 2.2)

→ **Aucun** nouveau code ; la Tâche 2.2 couvre.

---

### Tâche 4.3 : `settings/sessions.tsx` (page de config de session « à la demande », hors onboarding)

**Content** :
- **Choisir un passage** : `book/chapter/verseStart-verseEnd` + `reference` (parse `Jean 3:16`).
- **Choisir une traduction**.
- **Cible d'objectifs** : `5 / 10 / 20` versets par jour.
- **Lancer la session** : CTA → `/memorization/session?reference=...`.

**Approche** :
1. Page : `IonSelect` (livre), `IonInput` (chapitre/versets), `IonButton`.
2. **Test** : saisir `Jean 3:16` → CTA `Mémoriser` → la session démarre avec ce passage.

**Commit** : `feat(settings): sessions page — passage picker + translation + daily goal (launches session)`

---

### Tâche 4.4 : `settings/reminders.tsx` (page de config des rappels, hors onboarding)

**Content** :
- **Fréquence / jour** : `1 / 3 / 5 / 7` (compteur de rappels quotidiens pour apprentissage).
- **Heures** : 4 slots (0–23h).
- **Sound / Vibration** : toggle.
- **Activer** : switch (on/off).
- **Statut** : « Prochain rappel dans Xh » (heuristic locale, pas de push — OneSignal arrivera après).

**Approche** :
1. Page : `IonSlider` ou 4 boutons pour la fréquence, `IonInput` pour heures, `IonToggle`.
2. Persistance `settings-store.reminderConfig`.
3. **Test** : activer 3×/jour → le statut local s'agitise à chaque fois qu'une heure est dépassée (pas de vrai push).

**Commit** : `feat(settings): reminders page — frequency (1-7x/day) + hours + sound/vibration (local, pre-OneSignal)`

---

## Phase 5 — Vérifier chaque feature FSRS 100% fonctionnelle

### Tâche 5.1 : Session de mémorisation end-to-end

**Files** :
- `app/memorization/session.tsx` (le plus lourd, 59 erreurs TS actuelles)
- `app/memorization/flashcard.tsx`
- `app/memorization/confirm.tsx`
- `src/domains/memorization/session-engine.ts` (le moteur)
- `src/domains/fsrs/index.ts` (l'algorithme)

**Approche (manuel navigateur)** :
1. `http://localhost:3000/memorization/session?reference=Jean%203:16-18` → 3 versets.
2. Cliquer `À revoir / Difficile / Bon / Facile` → le verset suivant apparaît, la progress bar bouge, le rating est **persisté** (MMKV + PowerSync).
3. Arriver au dernier → `Passage terminé!` + `navigate('/memorization/confirm')`.
4. La `flashcard` affiche le verset + un `rating` → `confirm` → retour au home.
5. **Revenir 5 min plus tard** → le verset est dans `review/queue` (FSRS a planifié).
6. **Vérifier le `rateCurrentVerse`** → le `MemorizationSessionEngine` émet un `DomainEvent` (voir `docs/19-domain-events.md`) → test par `eventBus`.

**Tests unitaires déjà existants** :
- `tests/unit/domains/memorization/*` → `npx vitest run tests/unit/domains/memorization`.
- Ajout si manquant : `session-engine.test.ts` avec `rateCurrentVerse` → vérifie que le prochain slot est calculé par FSRS.

**Commit** : `feat(fsrs): session end-to-end + domain event emission + unit tests (rateCurrentVerse → nextSlot)`

---

### Tâche 5.2 : Review queue + session + summary + calendar

**Files** :
- `app/review/queue.tsx` → liste des versets dus.
- `app/review/session.tsx` → review.
- `app/review/summary.tsx` → stats de fin.
- `app/review/calendar.tsx` → répartition 7 jours.
- `app/review/History.tsx` (66 erreurs TS actuelles).

**Approche** :
1. `http://localhost:3000/review/queue` → chaque verset dû a un CTA `Réviser`.
2. `review/session` → même moteur que memorization mais sur les **versets dus** (FSRS).
3. `review/summary` → total, taux de rétention, courbe.
4. `review/calendar` → 7 jours × rappels.
5. **Tests** : `tests/unit/services/review-queue-passage.test.ts` + `tests/unit/services/review-queue-service.test.ts`.

**Commit** : `feat(review): queue/session/summary/calendar end-to-end + FSRS scheduling verification`

---

### Tâche 5.3 : Feature check — checklist par module

**Files** : chaque module listé a un dossier `src/capabilities/<module>/` (ai-coach, analytics, comparison, memory) + `src/domains/<module>/`.

**Approche** :
- [ ] `ai-coach` → CTA `Poser une question` → retour texte (mock si pas de backend AI).
- [ ] `analytics` → dashboard avec retention curve + `streaks`.
- [ ] `comparison` → 2 traductions côte à côte.
- [ ] `memory` → flashcard + `recall-writing`.
- [ ] `bible` → explorer → livre → chapitre → versets.
- [ ] `collections` → liste de collections + ajout.
- [ ] `family` → home / members / invite / join.
- [ ] `achievements` + `mastery` + `progress` → badges + niveaux.
- [ ] `profile` → create / select / index.
- [ ] `search` → recherche verset.
- [ ] `notifications` → liste locale (OneSignal plus tard).

**Chaque feature** : 1 test navigateur (ouverture + 1 CTA) + 1 test unitaire existant ou ajouté.

**Commit** : `feat(stability): full feature sweep + 1 test per module (navigateur + vitest)`

---

## Phase 6 — Stabilisation + test navigateur

### Tâche 6.1 : Lint + typecheck final

```bash
npx tsc -p tsconfig.app.json --noEmit  # 0 error
npx eslint . --ext .ts,.tsx  # 0 error
npx vitest run  # 0 failure
npm run build  # vite build passe (outDir: www)
```

**Commit** : `stabilize: full typecheck+lint+tests+build green`

---

### Tâche 6.2 : Test navigateur (manuel, `npm run dev`)

```bash
npm run dev  # Vite sur http://localhost:3000
```

**Checklist dans le navigateur** :
- [ ] `/onboarding/welcome` → CTA `Continuer` → `/onboarding/language-select`
- [ ] Choix `fr` → `/onboarding/translation-select` → `lsg` → `/onboarding/fsrs-introduction`
- [ ] `/onboarding/session-config` (nouveau) → choisir intensité → `/onboarding/reminder-config`
- [ ] `/onboarding/reminder-config` → 3×/jour + heure → `Terminer` → `/(tabs)`
- [ ] `/(tabs)` → home avec profil + session
- [ ] `/(tabs)/settings` → 4 pages : `languages` / `appearance` / `sessions` / `reminders`
- [ ] `settings/appearance` → Dark `#121212` (pipette) → Light miroir
- [ ] `settings/sessions` → `Jean 3:16` → CTA `Mémoriser` → `memorization/session`
- [ ] `memorization/session` → 4 ratings → progress bar → `confirm` → retour home
- [ ] `review/queue` → `Réviser` → `review/session` → `summary` → `calendar`
- [ ] `bible/explorer` → `livre` → `chapitre` → versets
- [ ] `family/members` → invite/join
- [ ] **Accessibilité** : zoom 200%, taille de texte 16px min, cible 44×44px, contrast 4.5:1
- [ ] **Console** : 0 erreur
- [ ] **Rafraîchir** → état persisté (MMKV rehydrate)

**Commit** : `stabilize: browser test pass (onboarding 6 + 4 settings + FSRS e2e + a11y)`

---

### Tâche 6.3 : OneSignal + Google (placeholder, hors scope du plan actuel)

L'utilisateur donnera les clés OneSignal + Google **après** ce plan. On prépare **les slots** :
- `src/services/one-signal-service.ts` (stub `push(token)`, `schedule(reminderConfig)` qui log).
- `src/services/auth/google.ts` (stub `signIn()`, `getUser()`).
- Wiring dans `auth-store.ts` + `notifications` page.
- **Aucun** secret dans le code (guardrail « Ne jamais hardcoder de secrets »).

**Commit** : `feat(notifications): OneSignal + Google auth slots (stub, keys à fournir par l'utilisateur)`

---

## Ordre d'exécution (séquentiel)

1. **Phase 0** (audit) → baseline
2. **Phase 1** (TS cleanup) → 0 erreur typecheck
3. **Phase 2** (dark/light) → `Appearance` page
4. **Phase 3** (onboarding 6) → 2 nouvelles pages
5. **Phase 4** (4 config) → 3 nouvelles pages (appearance dédoublonné)
6. **Phase 5** (FSRS e2e) → vérifier chaque feature
7. **Phase 6** (stabilisation) → 0 erreur + build + navigateur

**Cible** : l'application est **prête dans le navigateur** à la fin de la Phase 6, testable et validable par l'utilisateur.

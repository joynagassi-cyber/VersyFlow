# VersyFlow

<div align="center">

  <img src="docs/assets/versyflow-banner.svg" alt="VersyFlow — Mémorisation biblique" width="100%"/>

  **Mémorisation biblique intuitive — Science · Élégance · Foi**

  [![CI/CD](https://github.com/joynagassi-cyber/VersyFlow/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/joynagassi-cyber/VersyFlow/actions/workflows/ci-cd.yml)
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8.x-023c69?style=flat-square&logo=android&logoColor=fff)](https://capacitorjs.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=fff)](https://supabase.com)
  [![PowerSync](https://img.shields.io/badge/PowerSync-Realtime%20Sync-F5A623?style=flat-square)](https://powersync.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📖 À propos

**VersyFlow** est une application mobile de mémorisation des versets bibliques, conçue comme un vrai produit « scientific-first » : le calendrier de révisions est piloté par un **moteur FSRS** (Free Spaced Repetition Scheduler) pour que chaque verset soit revu au bon moment, ni avant ni après.

Le cœur de l'application :

- **Offline-first** — toutes les données applicatives vivent localement (SQLite PowerSync) et se synchronisent en temps réel quand le réseau le permet.
- **Multilingue par design** — la langue de l'interface (fr, en, ar avec RTL, de, zh) est **indépendante** de la traduction biblique choisie (34 datasets dans `data/bible/`).
- **Multiplateforme** — un seul codebase (Ionic React + Capacitor) : web, Android, iOS.

> « La science de la mémorisation au service de la Parole. »

## ✨ Fonctionnalités

| Domaine | Ce que l'app fait |
|---|---|
| **Mémorisation** | Sessions interactives (flashcards : verset masqué, vérification, notation), stratégie de mémorisation paramétrable, confirmation de session |
| **Révisions FSRS** | File de révisions, calendrier de révisions, historique, niveaux de maîtrise par verset |
| **Bible** | Navigateur Livre → Chapitre → Verset, recherche, multi-traductions, collection de versets |
| **Progression** | Streaks, succès (achievements), tableau analytique, coach IA |
| **Famille** | Partage de mémorisation entre membres, invitations, rejoint par code |
| **Profil** | Onboarding complet (langue UI, traduction biblique, intro FSRS, config de session, rappels) |
| **Réglages** | Langues, traductions disponibles, apparence (thème Rose & Frais + mode sombre), sauvegarde, rappels, confidentialité |

Roadmap v1+ : notifications intelligentes, mode audio, personnalisation des thèmes, fonctionnalités sociales élargies.

## 🧩 Stack technique

| Couche | Technologie |
|---|---|
| Langage | TypeScript 5.6 (strict) |
| UI | React 18 + **Ionic React 7** + Radix UI + Tailwind CSS 3.4 (design system « Rose & Frais », tokens + `ThemeProvider`) |
| Routing / pages | React Router 6, pages lazy-loadées (`app/`) |
| Build / dev | Vite 6 (output `www/`), alias `@/` |
| Native | **Capacitor 8** (Android shell dans `android/`, iOS à générer) |
| État | Zustand 5 |
| i18n | i18next + react-i18next (`src/i18n/`, 5 locales UI) |
| Backend | **Supabase** (Postgres + RLS, Auth GoTrue, Storage) |
| Synchronisation | **PowerSync** (`@powersync/web` + `@powersync/capacitor`) — SQLite local + streams temps réel |
| Moteur FSRS | `ts-fsrs` (moteur TS actif) + moteur Rust/WASM optionnel (`rust/fsrs-wasm/`) + fallback |
| Tests | Vitest + Testing Library (jsdom), coverage ≥ 70 % |
| Qualité | ESLint + Prettier + husky/lint-staged, Conventional Commits |

## 🏗️ Architecture

### Structure du dépôt

```
versy-flow/
├── app/                    # Pages de routes (lazy) : tabs, bible, memorization, review,
│                           #   family, onboarding, settings, achievements, analytics…
├── src/
│   ├── components/        # UI : ui/, shared/, bible/, auth/, layout/, navigation/
│   ├── domains/           # Couche domaine : bible, fsrs, memorization, family,
│   │                      #   family-invitation, progress, streaks, learner-profile, telemetry
│   ├── capabilities/      # Capacités métier composable : memory (+strategies),
│   │                      #   comparison, analytics, ai-coach
│   ├── services/          # Services métier (pattern Repository)
│   ├── infrastructure/    # Bible adapters, storage, repository, sync (PowerSync),
│   │                      #   telemetry, logging, migration
│   ├── sync/              # PowerSyncSyncService + migration MMKV → PowerSync
│   ├── auth/              # SupabaseAuthService (GoTrue)
│   ├── store/  hooks/     # Zustand, hooks custom
│   ├── i18n/              # Locales UI (fr, en, ar, de, zh)
│   ├── theme/  tokens/    # Design system (tokens, ThemeProvider, dark mode)
│   └── main.tsx           # Entrée : IonApp, routes lazy, Suspense
├── data/bible/            # 34 datasets bibliques statiques (JSON) + dataset-catalog.json
├── rust/fsrs-wasm/        # Moteur FSRS Rust → WASM (optionnel)
├── supabase/              # Migrations SQL 001→008 + guides de migration
├── powersync/             # Config PowerSync Cloud : cli.yaml, service.yaml, sync-config.yaml
├── scripts/               # Scripts : datasets bible, diagnostics PowerSync,
│                          #   patch du worker, seeds
├── android/               # Shell natif Android (Capacitor)
├── www/                   # Build web (Vite) consommé par Capacitor
├── tests/                 # unit/, integration/, api/, auth/, sync/, e2e/, fixtures/
└── docs/                  # Documentation produit/tech (01 → 22)
```

### Flux de données

```
UI (React/Ionic)
  → capabilities / domains (règles métier, stratégie mémoire)
  → services (repositories)
  → PowerSync local (SQLite, hors-ligne d'abord)
        ⇄ PowerSync Cloud (streams édition 3, abonnement auto + à la demande)
              ⇄ Supabase Postgres (RLS, rôle de réplication powersync_role)

Auth / CRUD direct / Stockage → @supabase/supabase-js (GoTrue + RLS)
Datasets bibliques statiques  → Supabase Storage (bucket bible-datasets)
```

Voir [docs/09-architecture.md](docs/09-architecture.md) et [docs/10-data-model.md](docs/10-data-model.md) pour le détail.

## ☁️ Backend : Supabase + PowerSync

VersyFlow repose sur [Supabase](https://supabase.com) comme backend principal et [PowerSync](https://powersync.com) comme couche de synchronisation temps réel.

- **Auth** : GoTrue via `@supabase/supabase-js`. Le câblage `auth.users` → `public.users` est assuré par les triggers `handle_new_user` / `handle_user_updated` (migration 005) ; les policies RLS référencent `auth.uid()`.
- **Synchronisation** : PowerSync Cloud lit la réplication logique via le rôle dédié `powersync_role` (password stocké comme secret Cloud, jamais commité). Les clients authentifiés s'abonnent avec leur JWT Supabase (`client_auth.supabase: true`).
- **Streams** : `powersync/sync-config.yaml` (édition 3) — données user-scoped `auto_subscribe: true` (profil, records de mémorisation, collections, streaks, familles) + abonnements à la demande (logs de révision, invitations) avec garde d'auth. Les données `LOCAL_ONLY` (catalogue d'achievements, `bible_*`, schemas internes) ne sont **jamais** synchronisées.
- **Patterns d'usage** :
  - Les inserts Supabase prennent un tableau : `insert([{ ... }])`.
  - Pour les uploads Storage, persister les deux champs `url` **et** `key` retournés par l'API.
  - Les datasets statiques (Bible) sont distribués via le bucket Storage `bible-datasets`, pas via la publication PowerSync.

### Migrations (ordre d'application 001 → 008)

| # | Migration | Contenu |
|---|---|---|
| 001 | `create_core_tables` | Tables cœur + RLS + seed achievements |
| 002 | `family_and_profiles` | Familles, memberships, learner profiles |
| 003 | `powersync_setup` | Rôle `powersync_role` + publication de réplication |
| 004 | `bible_registry` | Tables de registre bible (accès public) |
| 005 | `auth_wiring_policies_publication` | Triggers auth → users, policies, publication PowerSync |
| 006 | `family_owner_membership` | Membership propriétaire |
| 007 | `family_invitation_accept_rls` | RLS acceptation d'invitation |
| 008 | `telemetry_events` | Événements de télémétrie |

Guide d'application (dashboard SQL ou CLI) : [supabase/MIGRATION_GUIDE.md](supabase/MIGRATION_GUIDE.md).

## 🚀 Démarrage

### Prérequis

| Outil | Version | Pour quoi |
|---|---|---|
| Node.js | ≥ 18.x | Dev web + build |
| npm | ≥ 9.x | Gestion des dépendances |
| JDK 17 + Android SDK | API 26+ | Shell Android (`android/`) |
| Xcode ≥ 15 | — | Shell iOS (`npm run cap:add:ios`) |
| Projet Supabase | — | Backend (voir plus bas) |

### 1. Cloner et installer

```bash
git clone https://github.com/joynagassi-cyber/VersyFlow.git
cd VersyFlow
npm install
# Le postinstall exécute scripts/patch-powersync-worker.cjs
# (patch du worker PowerSync pour Vite, idempotent)
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

| Variable | Exposé au client ? | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Clé anon Supabase (sécurisée par RLS) |
| `VITE_POWERSYNC_URL` | ✅ | URL de l'instance PowerSync Cloud |
| `SUPABASE_SECRET_KEY` | ❌ (local dev) | Service role — scripts locaux uniquement |
| `SUPABASE_JWKS_URL` | ❌ (local dev) | URL JWKS pour validation des JWT |
| `PS_POWERSYNC_ROLE_PASSWORD` | ❌ | Mot de passe du rôle de réplication — secret PowerSync Cloud |
| `PS_ADMIN_TOKEN` | ❌ | PAT PowerSync CLI (`powersync link/pull/deploy`) |

> Les variables serveur (4 dernières) vivent **uniquement** dans `.env.local` (git-ignored). Ne JAMAIS committer les clés.

### 3. Lancer en dev (web)

```bash
npm run dev        # Vite sur http://localhost:3000
```

### 4. Run natif (Capacitor)

```bash
npm run build            # tsc -b + vite build → www/
npm run cap:sync         # copie www/ dans le shell natif
npm run cap:run:android  # Android (JDK 17 + SDK requis)
npm run cap:run:ios      # iOS (macOS + Xcode requis)
```

### 5. Backend (une fois par environnement)

```bash
# 1. Appliquer les migrations supabase/001→008 (SQL Editor ou CLI)
#    — changer le mot de passe de powersync_role (voir MIGRATION_GUIDE.md)

# 2. Déployer la config PowerSync Cloud
npx powersync pull     # (nécessite PS_ADMIN_TOKEN dans .env.local)
npx powersync deploy

# 3. Publier les datasets bibliques (bucket bible-datasets)
npm run bible:deploy
```

### Vérifier le câblage PowerSync

```bash
npm run powersync:wire        # check statique du schéma de sync
npm run powersync:wire:live   # + test live contre l'instance
```

## 🧪 Tests

```bash
npm test                 # vitest run (unit + integration)
npm run test:watch       # mode watch
npm run test:coverage    # coverage v8 (seuil 70 % : statements/branches/functions/lines)
npm run typecheck        # tsc --noEmit
npm run lint             # eslint
```

Structure : `tests/unit/`, `tests/integration/`, `tests/api/`, `tests/auth/`, `tests/sync/`, `tests/e2e/`, `tests/fixtures/` (setup : `tests/setup.ts` + polyfills). Stratégie détaillée dans [docs/18-test-strategy.md](docs/18-test-strategy.md).

## 📜 Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Dev server Vite (port 3000) |
| `npm run build` | Build web (`tsc -b` + Vite → `www/`) |
| `npm run preview` | Prévisualisation du build |
| `npm run typecheck` / `lint` / `test` | Qualité code |
| `npm run cap:sync` | Synchronise `www/` vers les shells natifs |
| `npm run cap:run:android` / `cap:run:ios` | Lancer sur appareil/émulateur |
| `npm run cap:add:android` / `cap:add:ios` | (Re)générer le shell natif |
| `npm run bible:build` | Compiler les datasets bible (USFM → JSON) |
| `npm run bible:verify` | Vérifier les datasets multi-traductions |
| `npm run bible:deploy` | Publier les datasets dans Supabase Storage |
| `npm run powersync:wire[:live]` | Vérifier (en live) le câblage PowerSync |

## 🌍 Internationalisation

- **Langues de l'interface** : `fr`, `en`, `ar` (RTL), `de`, `zh` — `src/i18n/locales/`
- **Traductions bibliques** : 34 datasets (LSG et plus), catalogués dans `data/bible/dataset-catalog.json`, distribués via Supabase Storage.
- Les deux dimensions sont **indépendantes** : un utilisateur francophone peut mémoriser en LSG, un utilisateur arabe peut lire une traduction européenne, etc.

Voir [docs/12-internationalization.md](docs/12-internationalization.md).

## 🤖 CI/CD & build

Un pipeline unique (`.github/workflows/ci-cd.yml`) remplace tous les anciens workflows :

```
quality-gate (typecheck / lint / tests — matrice parallèle)
   → build-web (Vite → artifact www/)
      ├─ build-android        (APK debug, sans secrets)
      └─ build-android-release (APK signé, secrets KEYSTORE*, sur push main)
```

| Déclencheur | Résultat |
|---|---|
| PR → `main` | Gates + build web + APK debug |
| Push `main` / `develop` | Idem (+ APK signé sur `main`) |
| `workflow_dispatch` | Options `build_release`, `version` |

Secrets requis (JAMAIS dans le repo) : `.github/secrets-checklist.md` + modèle `.github/ci-secrets.example.env`. Guides complets : [BUILD-GUIDE.md](BUILD-GUIDE.md), [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md), [.github/CICD-README.md](.github/CICD-README.md).

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [01-vision-produit.md](docs/01-vision-produit.md) | Vision, cible, différenciation |
| [02-principes-produit.md](docs/02-principes-produit.md) | Principes architecturaux non négociables |
| [03-prd.md](docs/03-prd.md) | Product Requirements Document |
| [04-user-flows.md](docs/04-user-flows.md) | Parcours utilisateur |
| [05-features.md](docs/05-features.md) | Fonctionnalités MVP/V1/Futur |
| [06-design-system.md](docs/06-design-system.md) / [07-design-tokens.md](docs/07-design-tokens.md) | Design System « Rose & Frais » |
| [09-architecture.md](docs/09-architecture.md) / [10-data-model.md](docs/10-data-model.md) | Architecture technique + modèle de données |
| [11-bible-domain.md](docs/11-bible-domain.md) / [13-fsrs-domain.md](docs/13-fsrs-domain.md) | Domaines bible et FSRS |
| [18-test-strategy.md](docs/18-test-strategy.md) / [19-domain-events.md](docs/19-domain-events.md) / [20-domain-use-cases.md](docs/20-domain-use-cases.md) | Tests, événements, use-cases |
| [16-ai-dev-guide.md](docs/16-ai-dev-guide.md) | Guide de développement (AGENTS.md, AI_RULES.md à la racine) |

## 📝 Conventions

- **Git** : Conventional Commits (`feat:`, `fix:`, `docs:`, …) ; husky + lint-staged.
- **Code** : TypeScript strict, PascalCase pour les composants, camelCase pour hooks/variables, UPPER_CASE pour les constantes.
- **Architecture** : Clean Architecture / dependency inversion — `domains/` ne dépend pas de `infrastructure/`.

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`feature/nouvelle-fonctionnalite`)
3. Committer (`feat: ...`), faire passer `npm test` et `npm run typecheck`
4. Pousser et ouvrir une Pull Request

Pour le contexte de développement, lire [AGENTS.md](AGENTS.md), [AI_RULES.md](AI_RULES.md) et [docs/16-ai-dev-guide.md](docs/16-ai-dev-guide.md).

## 📄 Licence

[MIT](LICENSE)

---

<div align="center">

**VersyFlow** — *La science de la mémorisation au service de la Parole*

</div>

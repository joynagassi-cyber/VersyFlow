# VersyFlow — Decision Log

> Document généré par le CEO Multi-Agent
> Chaque décision architecturale ou produit majeure est enregistrée ici.
> Pour modifier une décision existante: marquer comme OBSOLETE avec date et raison.

---

## Décisions Enregistrées

### DEC-001: Stack Technique
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de specs V1)
**Contexte**: Choix technologique pour le MVP
**Décision**: React Native + Expo + TypeScript + Rust (FSRS) + MMKV + Zustand + Reanimated
**Justification**:
- Expo: OTA updates, ecosystem mature, community support
- TypeScript: strict mode for type safety
- Rust WASM: FSRS needs precision SM-2 can't provide
- MMKV: fastest JS storage for React Native
- Zustand: lightweight state management
- Reanimated: smooth animations at 60fps
**Alternatives rejetees**:
- Flutter → rejeté: team knowns React Native, Expo ecosystem superior
- Redux → rejeté: Zustand is lighter and sufficient for MVP scope
- SQLite → rejected: MMKV sufficient for MVP data volume (~250KB for 500 verses)
**Statut**: ACTIVE

### DEC-002: Default Bible Translation = LSG (Louis Segond 1910)
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de Vision + PRD)
**Contexte**: Quelle traduction biblique au MVP?
**Décision**: LSG uniquement au MVP
**Justification**: Most widely used French translation, public domain, poetic yet accessible
**Alternatives rejetees**:
- KJV → English only, not French MVP audience
- NIV → Copyright restrictions
- Darby → Too theological for general audience
**Statut**: ACTIVE

### DEC-003: Architecture Clean avec 4 couches
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de 09-architecture.md)
**Contexte**: Structure du codebase
**Décision**: UI → Services → Domains → Infrastructure (dépendances unidirectionnelles)
**Justification**: Separation of concerns, testability, extensibility without refactor
**Alternatives rejetees**:
- MVC → tight coupling between view and model
- MVVM → extra layer unnecessary for MVP complexity
- Feature-based folder structure → harder to enforce dependency rules
**Statut**: ACTIVE

### DEC-004: FSRS via WASM avec fallback SM-2 JS
**Date**: Sprint 2 Jour 1
**Décidé par**: CEO (sur base de 13-fsrs-domain.md)
**Contexte**: Comment intégrer l'algorithme FSRS Rust dans React Native
**Décision**: Compiler en WASM + loader asynchrone + fallback SM-2 JS si échec
**Justification**:
- WASM: FSRS math requires precision and performance only Rust provides
- Fallback SM-2: ensures app works even if WASM fails (offline-first principle)
- Async loading: doesn't block UI startup
**Alternatives rejetees**:
- Pure JavaScript FSRS → too slow, less accurate, no access to optimized fsrs-rs crate
- React Native native module → adds complexity to build process, harder to maintain
- Web worker → not available in React Native
**Statut**: ACTIVE

### DEC-005: 5 Langues UI au MVP (FR, EN, AR, DE, ZH)
**Date**: Sprint 1 Jour 1
**Décidé par**: CEO (sur base de 12-internationalization.md)
**Contexte**: Combien de langues pour le MVP?
**Décision**: 5 langues: FR, EN, AR, DE, ZH
**Justification**: Covers major Christian populations (Francophone, Anglophone, Arabophone, Germanophone, Sino-phone). Arabic provides RTL testing.
**Alternatives rejetees**:
- 3 langues (FR, EN, AR) → insufficient international coverage
- 10+ langues → too much translation work delays MVP
**Statut**: ACTIVE

### DEC-006: Stockage local UNIQUE (MMKV), pas de cloud sync au MVP
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO (sur base de 09-architecture.md section Offline-First)
**Contexte**: Sync vs offline-only
**Décision**: 100% local storage, no network dependency
**Justification**: Offline-first is a core principle. Cloud sync adds complexity, backend cost, privacy concerns. Can be added post-MVP.
**Statut**: ACTIVE

### DEC-007: 6 Agents avec ownership exclusif de dossiers
**Date**: Sprint 0 Jour 1
**Décidé par**: CEO
**Contexte**: Organisation du développement multi-agent
**Décision**: 6 agents (Forge, Anvil, Herald, Scribe, Translator, Guardian) avec chaque fichier attribué à UN seul agent
**Justification**: Eliminate git conflicts entirely. Each agent has a clear scope. Reading is free, writing is exclusive.
**Alternatives rejetees**:
- 3 agents généralistes → plus de conflits Git, moins de parallelisation
- 10+ agents spécialisés → overhead de coordination trop élevé
**Statut**: ACTIVE

### DEC-008: Câblage auth.users → public.users via trigger (I3/C3)
**Date**: 2026-09-10
**Décidé par**: Anvil (sur instruction du product owner, suite audit C3/I3)
**Contexte**: Aucune liaison entre Supabase Auth (`auth.users`) et le profil applicatif (`public.users`). `public.users.id` était un `uuid_generate_v4()`, donc **jamais** égal à `auth.uid()`. Or toutes les policies RLS et tous les streams PowerSync filtrent sur `auth.uid() = user_id`. Sans câblage, chaque utilisateur réel obtiendrait 0 ligne partout → streams muets.
**Décision**: Triggers `AFTER INSERT`/`AFTER UPDATE` sur `auth.users` (`public.handle_new_user` / `public.handle_user_updated`, `SECURITY DEFINER`) insérant/maillant `public.users` avec **`id = new.id`** (= `auth.uid()`). `email` nullable dans `auth.users` → `coalesce(new.email, 'anonymous-' || id)`.
**Justification**:
- Garantit l'invariant `public.users.id = auth.uid()` requis par toute la RLS et les streams.
- `SECURITY DEFINER` + `SET search_path = public` car le trigger s'exécute en `postgres` et la table est RLS-enabled.
- Backfill idempotent pour toute ligne existante.
**Alternatives rejetées**:
- FK `public.users.id → auth.users.id` + `default` : moins portable (FK vers le schema `auth` fragile sur Supabase), et ne résout pas la création de la ligne.
- Edge function à l'inscription : ajouterait une dépendance réseau + un second chemin d'écriture, là où le trigger est atomique et sans code serveur.
**Statut**: ACTIVE (migration 005, smoke testé)

### DEC-009: Publication PowerSync resserrée aux 13 tables SYNCED (C1/I1/C6)
**Date**: 2026-09-10
**Décidé par**: Anvil
**Contexte**: La publication live `powersync` était `FOR ALL TABLES` (51 tables, dont `auth.*`, `storage.*`, `realtime.*`, `vault.secrets`). `powersync_role` a `BYPASSRLS` : la publication **est** la frontière de sécurité de la réplication.
**Décision**: `DROP PUBLICATION` + `CREATE PUBLICATION powersync FOR TABLE` sur les **13** tables SYNCED (users, learner_profiles, memorization_records, review_logs, word_performance, streaks, collections, collection_verses, user_achievements, settings, families, family_memberships, family_invitations). Grants `SELECT` de `powersync_role` révoqués sur `achievements` + `bible_*` + `versification_maps`.
**Justification**:
- Concretise la classification des données (LOCAL_ONLY / SYNCED) côté Postgres, pas seulement dans la doc.
- `BYPASSRLS` rend la publication le seul garde-fou — une table excédentaire y exposerait toute donnée.
**Alternatives rejetées**:
- Garder `FOR ALL TABLES` et filtrer côté stream : récurrent, laisse les données internes Supabase répliquées en inutile, risque de fuite.
**Statut**: ACTIVE (migration 005, vérifié `puballtables=false`)

### DEC-010: Catalogue achievements = LOCAL_ONLY, hors sync (I8)
**Date**: 2026-09-10
**Décidé par**: Product owner (tranché dans la YAML edition 3)
**Contexte**: `achievements` est un catalogue statique partagé (5 lignes seed), défini côté app. Syncer une table quasi-immuable consommée par tous est du poids inutile ; le catalogue doit être embarqué dans le binaire (comme la Bible).
**Décision**: `achievements` **exclu** de la publication et de tout stream. `user_achievements` (progression individuelle) reste SYNCED. Le catalogue embarqué vit dans le code/app (à créer en Phase F/G).
**Justification**: Coherence avec la règle « ne pas syncer le contenu statique » ; réduit le bucket de 1 table ; évite de dupliquer un registre qui fait partie du produit, pas de l'état utilisateur.
**Alternatives rejetées**:
- Syncer `achievements` « parce que c'est public » : aucun gain (lecture locale suffit), cout de bucket + de maintenance.
**Statut**: ACTIVE (exclusion codée migration 005)

### DEC-011: settings synchronisé tel quel, thème y compris (I9)
**Date**: 2026-09-10
**Décidé par**: Product owner
**Contexte**: `settings.theme` est classé EPHEMERAL (à vivre dans Capacitor Preferences, jamais MMKV). Question : faut-il l'exclure du sync ?
**Décision**: La table `settings` est **synchronisée telle quelle** (dont `theme`). Le champ thème est le seed/backup de préférence ; l'app lit l'état courant de Capacitor Preferences et ne doit pas dépendre du sync pour son thème.
**Justification**: Unicité de la source de préférences persistentes ; éviter une double écriture ; le sync ne bloque jamais le rendu (offline-first).
**Alternatives rejetées**:
- Chopper `settings.theme` hors sync : complexité sans bénéfice, et perd la préférence par défaut multi-appareils.
**Statut**: ACTIVE

### DEC-012: Rotation du mot de passe powersync_role (C2)
**Date**: 2026-09-10
**Décidé par**: Anvil
**Contexte**: `powersync_role` portait le mot de passe de migration `powersync_secret_CHANGE_THIS`. Le rôle a `REPLICATION` + accès réplication direct : exposition critique si la valeur circule dans git.
**Décision**: `ALTER ROLE powersync_role WITH PASSWORD '<fort>'` appliqué **out-of-band** (jamais dans une migration commitée). Nouveau mot de passe stocké **uniquement** dans `.env.local` (`PS_POWERSYNC_ROLE_PASSWORD`, git-ignoré). À reconfigurer sur la connexion PowerSync Cloud au provisioning (G4).
**Justification**: Respecte la règle « ne jamais hardcoder de secrets » ; la migration reste traçable mais le secret ne transite pas par l'historique git.
**Statut**: ACTIVE (à re-sauvegarder dans le panneau PowerSync Cloud à G4)

### DEC-013: Membership owner atomique côté serveur (I4)
**Date**: 2026-09-10
**Décidé par**: Anvil (sur instruction du product owner, suite audit I4)
**Contexte**: Un appel direct à l'API REST Supabase (`POST /families` via postgrest) bypassait le service de domaine `family.create` (line 15-18 de `src/domains/family/service.ts`), qui insère l'owner membership **après** la famille. Résultat : famille orpheline, RLS famille/breaking, et tous les PowerSync streams filtrant sur `family_memberships` (notamment `my_family_memberships` et `family_invitations_for_family`) voyaient une famille sans owner.
**Décision**: Trigger `AFTER INSERT ON public.families` (`public.ensure_family_owner_membership`) qui insère atomiquement `family_memberships(family_id, user_id=owner_id, role='owner', status='active', joined_at=now()) ON CONFLICT (family_id,user_id) DO NOTHING`. Backfill pour les familles orphelines existantes.
**Justification**:
- `SECURITY INVOKER` (défaut) : le trigger s'exécute en tant que le rôle appelant et est **fully sujet à la RLS** `family_memberships` (`families.owner_id = auth.uid()`). Aucun bypass RLS, respecte la règle « jamais d'écriture mobile qui bypass RLS ».
- Idempotent vis-à-vis du chemin app (`FamilyService.create` = insert famille + addMember owner) : le second insert (l'app) retombe sur la ligne créée par le trigger → `ON CONFLICT DO NOTHING` l'absorbe. Pas de race, pas de double row.
- Atomique avec la création de famille : la transaction n'engage la famille que si la membership owner est insérée. Un appel REST direct qui créerait une famille sans membership retombe sur la policy RLS d'insert `families` (`auth.uid() = owner_id`) et échoue → pas d'orpheline possible.
- Filtre `ON CONFLICT (family_id,user_id)` exploite la contrainte unique existante.
**Alternatives rejetées**:
- Un **RPC/edge function** à appeler côté app : protège le chemin app mais pas le chemin REST direct (l'app n'est pas l'unique client). Le trigger couvre **tous** les chemins d'insertion `families` (app, REST, Data API, SQL ad-hoc, migration).
- Option de laisser le YAML filtrer `family_memberships OR families.owner_id = auth.user_id()` : fait diverger le stream du RLS → divergence difficile à tracer (préconisation du product owner).
- Un trigger **SECURITY DEFINER** qui bypass RLS : rejette par la règle « jamais d'écriture qui bypass RLS ». Le SECURITY INVOKER est correct car la membership est déjà autorisée par RLS au moment où le trigger s'exécute (insert `families` a déjà passé sa policy → owner = auth.uid()).
**Preuves live**:
- Trigger présent : `families` count 1 (vérifié)
- Smoke test : insert 1 famille seule (chemin REST) → exactement 1 owner membership. Insert famille + insert membre owner identique (chemin app) → exactement 1 owner membership (le second est absorbé par ON CONFLICT).
- Backfill : aucune famille orpheline existante → 0 inserts.
**Statut**: ACTIVE (migration 006, appliquée 2026-09-10)

### DEC-014: Réconciliation de la migration 003 (traceability)
**Date**: 2026-09-10
**Décidé par**: Anvil
**Contexte**: La migration `003_powersync_setup` n'était pas tracée dans `supabase_migrations.schema_migrations` (seuls 001, 002, 004, 005 y figuraient). Ses effets étaient live (publication `powersync` initiale + grants `powersync_role`), mais un `supabase migration repair` ou un déploiement futur aurait ré-appliqué 003 → `drop publication powersync` + `create publication ... FOR TABLE` (liste non-resserrée) + `grant select on all tables` → **perte de C1/C6** (publication resserrée) et de **REPLICA IDENTITY FULL**.
**Décision**: Insérer **uniquement** la ligne de traçabilité (`version`, `name`, `created_by`, `statements` redacté, **sans ré-exécuter le SQL**) dans `schema_migrations`, ce qui est l'équivalent exact de `supabase migration repair --create-missing-migrations` côté table de versionnage.
**Justification**:
- **Ne pas ré-exécuter le SQL 003** : `create role ... with password '<historique>'` serait un no-op (le rôle existe déjà, mais `do $$ if not exists` est défensif), par contre `grant select on all tables in schema public to powersync_role` et `drop publication` + `create publication` ré-appliquent la publication **large** d'origine, annulant C1 (resserrée à 13 tables par 005). Le secret historique serait re-hardcodé dans la table d'audit.
- **Ne pas laisser la 003 orpheline** : une future `supabase db push` ou un outil de migration qui compare le registre au dossier `supabase/migrations/` verrait 003 comme « manquante » et tenterait de l'appliquer.
- **Ligne redactée** : le `statements` de la 003 inséré est le SQL original avec le mot de passe remplacé par `<REDACTED_ROTATED_2026-09-10>` (DEC-012).
**Preuves live**:
- Avant : 5 versions (001, 002, 004, 005, 006) — 003 absente.
- Après : 6 versions ordonnées (`001 → 002 → 003 → 004 → 005 → 006`), 003 présente avec `has_statements=true`.
**Statut**: ACTIVE (insertion directe dans `supabase_migrations.schema_migrations` le 2026-09-10, version `20260910004425`)

---

## Format pour Nouvelles Décisions

Lorsqu'une nouvelle décision doit être prise durant le développement:

```
DEC-XXX: [Titre court]
Date: [jour sprint]
Décidé par: [Agent/Ceo/Humain]
Contexte: [Pourquoi cette décision est nécessaire]
Décision: [Quoi]
Justification: [Pourquoi ce choix]
Alternatives rejetées: [Ce qui aurait pu être fait sinon]
Statut: ACTIVE | OBSOLETE (remplacée par DEC-XXX le JJ/MM/AAAA)
```

---

*Ce document est maintenu par Guardian. Toute décision modifiant l'architecture, le scope MVP, ou les principes product nécessite une entrée ici.*

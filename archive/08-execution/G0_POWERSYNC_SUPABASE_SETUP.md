# G0 — PowerSync + Supabase Setup

**Date :** 2026-09-10
**Projet :** VersyFlow
**Statut :** ✅ PASS — G4 atteint le 2026-09-10 : instance PowerSync Cloud `Production` provisionnée, sync-config edition 3 (13 streams) déployée, replication initiale complète (lag 0), publication C1 confirmée. Voir § « G4 — PowerSync Cloud (2026-09-10) ».

---

## Checklist

- [x] Projet Supabase créé (dspqvyesfngxuwqhceog)
- [x] Migration 001 appliquée : 10 tables core + RLS + triggers
- [x] Migration 002 appliquée : 3 tables family + RLS
- [x] Migration 003 appliquée : publication `powersync` créée (à l'origine `FOR ALL TABLES` — resserrée par la migration 005)
- [x] Migration 004 appliquée : 5 tables Bible + seed languages/translations/books
- [x] RLS activé sur chaque table SYNCED + policies testées
- [x] `powersync_role` créé avec `replication bypassrls`
- [x] Publication `powersync` resserrée aux 13 tables SYNCED (migration 005)
- [x] Capacitor 8.5.1 installé — `@powersync/capacitor` + `@capacitor-community/sqlite` présents dans package.json (ancienne note « Capacitor 6.2.0 » obsolète)

---

## Tables créées (19)

| Table | Category | RLS |
|-------|----------|-----|
| users | AUTH | ✅ |
| learner_profiles | SYNCED | ✅ |
| memorization_records | SYNCED | ✅ |
| review_logs | SYNCED | ✅ |
| word_performance | SYNCED | ✅ |
| streaks | SYNCED | ✅ |
| collections | SYNCED | ✅ |
| collection_verses | SYNCED | ✅ |
| achievements | LOCAL_ONLY | ✅ (read-only) |
| user_achievements | SYNCED | ✅ |
| settings | SYNCED | ✅ |
| families | SYNCED | ✅ |
| family_memberships | SYNCED | ✅ |
| family_invitations | SYNCED | ✅ |
| bible_languages | LOCAL_ONLY | ✅ (read-only) |
| bible_translations | LOCAL_ONLY | ✅ (read-only) |
| bible_books | LOCAL_ONLY | ✅ (read-only) |
| bible_verses | LOCAL_ONLY | ✅ (read-only) |
| versification_maps | LOCAL_ONLY | ✅ (read-only) |

---

## Publication PowerSync

- **Nom :** `powersync`
- **Mode :** liste explicite de **13 tables SYNCED** (migration 005, 2026-09-10) — avant correction : `FOR ALL TABLES` (51 tables, dont `auth.*`, `storage.*`, `realtime.*`, `vault.secrets`)
- **Tables :** users, learner_profiles, memorization_records, review_logs, word_performance, streaks, collections, collection_verses, user_achievements, settings, families, family_memberships, family_invitations
- **Exclues (décision I8 + classification) :** `achievements` (catalogue embarqué), `bible_*`, `versification_maps` (LOCAL_ONLY)
- **Role :** `powersync_role` avec `replication bypassrls login`
- **Mot de passe :** roté le 2026-09-10 (out-of-band, migration 005 §6). Valeur stockée dans `.env.local` (`PS_POWERSYNC_ROLE_PASSWORD`), à réutiliser pour la connexion PowerSync Cloud. L'ancienne valeur `powersync_secret_CHANGE_THIS` est obsolète.
- **REPLICA IDENTITY FULL** sur les 13 tables (requis PowerSync pour les DELETE).

---

## Correctifs post-G0 (migration 005 — 2026-09-10)

Références : `docs/08-execution/DB_AUDIT_POWERSYNC_STREAMS.md` (C1–C6, I1–I13).

| Finding | Correctif | Preuve |
|---------|----------|--------|
| C1/I1 | Publication resserrée de ALL TABLES aux 13 tables SYNCED | `puballtables=false`, 13 tables |
| C2 | Mot de passe `powersync_role` roté (out-of-band, secret non commité) | `ALTER ROLE` exécuté 2026-09-10 |
| C3/I3 | Triggers `auth.users → public.users` (`handle_new_user` / `handle_user_updated`), `public.users.id = auth.uid()` | Smoke test : INSERT `auth.users` → ligne miroir `public.users` (testé + nettoyé) |
| I5 | Policy UPDATE ajoutée sur `word_performance` (3 policies) | `pg_policies` = 3 |
| I6 | Policy INSERT ajoutée sur `user_achievements` (3 policies) | `pg_policies` = 3 |
| I4 | **Trigger serveur `ensure_family_owner_membership`** (`AFTER INSERT ON public.families`) : insère atomiquement la `family_memberships(owner, active)` pour chaque famille. `SECURITY INVOKER` (pas de bypass RLS), `ON CONFLICT DO NOTHING` (idempotent face au double-insert app). Backfill familles orphelines. | Migration 006, smoke testé (1 owner membership / famille) |
| — | `REPLICA IDENTITY FULL` sur les 13 tables SYNCED | `pg_class.relreplident='f'` |
| — | Grants Data API `authenticated` vérifiés : déjà présents sur toutes les tables public (projet post-30/05/2026) | `information_schema` |

### Réconciliation de la traçabilité (migration 003)

- **Avant** : `supabase_migrations.schema_migrations` ne traçait que `001, 002, 004, 005` (puis `006`). La migration `003_powersync_setup` n'y figurait pas, alors que ses effets étaient live.
- **Risk** : une `supabase migration repair` ou un re-deploy aurait **ré-appliqué** le SQL 003 → `drop publication` + `create publication` (liste non-resserrée) + `grant select on all tables` → perte de **C1** (publication resserrée par 005) et de **REPLICA IDENTITY FULL**.
- **Correctif (2026-09-10)** : insertion **traçabilité-only** d'une ligne `003_powersync_setup` (version `20260910004425`) dans `schema_migrations`, avec le SQL original **redacté** (mot de passe `powersync_role` remplacé par `<REDACTED_ROTATED_2026-09-10>`, DEC-012) et **sans ré-exécution**. Equivalent de `supabase migration repair --create-missing-migrations` côté table de versionnage.
- **Après** : registre complet et ordonné `001 → 002 → 003 → 004 → 005 → 006`, toutes `has_statements=true`.

### PowerSync CLI — connect (2026-09-10)

- CLI `powersync@0.10.0` (global, `PS_ADMIN_TOKEN` non-interactif).
- `powersync pull instance --instance-id=6aa1b9078453e7cf8335b22d` (Production) a généré `powersync/cli.yaml` (link cloud : org `6aa1b8d504e93a0007fc8974`, project `6aa1b9052e21dd00078b02ba`, instance `6aa1b9078453e7cf8335b22d`), `powersync/service.yaml` (config cloud : `client_auth.supabase=true`, block `replication` à compléter au G4 avec le mot de passe `powersync_role`) et `powersync/sync-config.yaml` (template — la YAML edition 3 n'est **pas encore** déployée au cloud).
- **Aucun secret commité** : le PAT est en `.env.local` (`PS_ADMIN_TOKEN`, git-ignoré) ; vérifié l'absence de `jpt_…`/`PS_ADMIN_TOKEN` dans le dossier `powersync/`.

---

## G4 — PowerSync Cloud (2026-09-10)

Instance Cloud Production `6aa1b9078453e7cf8335b22d` (org `6aa1b8d504e93a0007fc8974`, project `6aa1b9052e21dd00078b02ba`).

### Deploy service-config → sync-config

- `powersync deploy service-config --deploy-timeout=300` → ✅ succès. Connexion PostgreSQL directe `db.dspqvyesfngxuwqhceog.supabase.co:5432` (`powersync_role`, `sslmode: verify-full`), mot de passe fourni via Cloud secret (`secret_ref: default_password` = `PS_POWERSYNC_ROLE_PASSWORD`).
- `powersync deploy sync-config --deploy-timeout=300` → ✅ succès, 13 streams edition 3.

### Résultat du test compilateur G4 (décision pré-annoncée)

> « Si le compilateur Sync Streams rejette `date()`, on retire simplement le filtre. »

Le premier `deploy sync-config` **a échoué** avec `[error] Unknown function` sur `my_streaks`
(`AND streak_date > date('now','-365 days')`). **Le filtre `date()` a été retiré** :
volume trivial (~1 ligne/jour/utilisateur). La stream `my_streaks` sync désormais l'ensemble des
streaks du user (`SELECT * FROM streaks WHERE user_id = auth.user_id()`). Documenté en tête de
`powersync/sync-config.yaml`.

Autres correctifs apportés avant le re-deploy réussi :

- **Alias principaux** (`cv`/`f`/`fm`…) supprimés sur les tables cibles pour que le nom de table
  côté client reste `collection_verses` / `families` / `family_memberships` (un alias sur la table
  principale renomme la table syncée et zéro les lectures client).
- `family_invitations_for_family` : correction `SELECT fm_family_id FROM family_memberships fm_family`
  → `SELECT family_id FROM family_memberships` (`fm_family_id` n'existe pas — aurait levé une erreur
  au runtime). Warnings d'introspection « table not found in source schema » = effet transitoire de
  l'introspection initiale post service-config ; toutes les tables existent réellement (cf. `list_tables`).

### État de la replication (vérifié via `powersync status`)

- Connection `default` : **Status: connected**.
- Sync slot `production` : **Initial replication done: true**, **Replication lag: 0 bytes**.
- Les 13 tables SYNCED sont introspectées (`replication_id` + colonnes confirmées).
- Publication `powersync` (Supabase) : **exactement les 13 tables SYNCED** (C1 confirmé, vérifié en direct
  via `pg_publication_tables`). Exclusions : `achievements`, `bible_*`, `versification_maps`.

### Secret du build (verdict front 4)

Le seul identifiant exposé au bundle est **`VITE_POWERSYNC_URL`** (endpoint public
`https://6aa1b9078453e7cf8335b22d.powersync.journeyapps.com`). Le **PAT (`PS_ADMIN_TOKEN`) n'est
référencé que dans `.env.local`** (git-ignoré) — absent de `src/`, `package.json`, `.github/`.
Le client s'authentifie au flux sync via le **JWT Supabase**, pas le PAT.
→ **Le PAT n'est PAS requis pour le build du package final, donc PAS besoin de le déclarer en
secret GitHub.** Il ne servirait qu'à un éventuel pipeline CI qui déploierait le sync-config
(absent du dépôt). Le mot de passe `powersync_role` reste un secret Cloud (jamais dans le client).

---

## Prochaines étapes

1. **G1** : ~~Upgrader Capacitor 6 → 8~~ — déjà fait (8.5.1 dans package.json)
2. **G2** : ~~Installer `@powersync/capacitor` + `@capacitor-community/sqlite`~~ — déjà installés (`^0.9.0` / `^8.1.1`)
3. **G3** : Implémenter `SupabasePowerSyncConnector` (`fetchCredentials` + `uploadData`)
4. **G4** : ~~Provisionner l'instance PowerSync Cloud~~ — **DÉPLOYÉ le 2026-09-10** (sync-config edition 3, 13 streams, replication initiale OK, lag 0). Reste : test de connexion **web** → sync d'une table témoin (`my_profile`)
5. **E6** : Preuve wire — synchroniser une table témoin sur un client web et confirmer la lecture SQLite locale (clôture de G0 en PASS complet)

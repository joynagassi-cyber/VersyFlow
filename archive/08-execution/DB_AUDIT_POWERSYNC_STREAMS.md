# Audit base de données — VersyFlow (Supabase)

> **Objet** : rapport autonome de la base Postgres (Supabase) destinée à la configuration
> des **PowerSync Sync Streams**. Toute information ci-dessous est issue de requêtes SQL
> exécutées directement sur la base live (2026-09-10) + lecture des migrations locales
> `supabase/migrations/001…004`. Rien n'est inventé : les zones incertaines sont listées
> dans **Points d'incertitude**.
>
> **Base** : Supabase projet `dspqvyesfngxuwqhceog` (schema `public`).
> **Volumes globaux** : base quasi vide (`public.users` = 0, `auth.users` = 0) ; seuls des
> données de catalogue/seed sont présentes (66 livres, 7 langues, 2 traductions, 5 achievements).

---

## ⚠️ Constats critiques (à traiter AVANT de configurer les streams)

> **MàJ 2026-09-10** — C1, C2, C3/I3, C6, I5, I6 sont **résolus** par la migration 005
> (`supabase/migrations/005_auth_wiring_policies_publication.sql`, appliquée + vérifiée live).
> C4, C5 restent ouverts (décisions produit). Statuts en gras.

| # | Constat | Gravité | Statut |
|---|---------|---------|---------|
| C1 | La publication live `powersync` est `FOR ALL TABLES` (`puballtables = true`). Couvre aussi `auth.*`, `storage.*`, `realtime.*`, `vault.secrets`. `powersync_role` a `BYPASSRLS` : la RLS ne le protège pas. | **Haute** | ✅ **RÉSOLU** (migration 005) — publication resserrée aux 13 tables SYNCED ; `puballtables=false` vérifié. |
| C2 | Le mot de passe du rôle `powersync_role` était probablement toujours `powersync_secret_CHANGE_THIS`. | **Haute** | ✅ **RÉSOLU** (out-of-band 2026-09-10) — `ALTER ROLE powersync_role WITH PASSWORD '…'` exécuté ; nouveau mot de passe stocké dans `.env.local` (`PS_POWERSYNC_ROLE_PASSWORD`), jamais commité. |
| C3 | **Aucun câblage Auth** : pas de trigger ni FK reliant `auth.users` → `public.users` ; `public.users.id` non égal à `auth.uid()`. Sans câblage, toutes les policies renverront 0 ligne pour les vrais utilisateurs. | **Haute** | ✅ **RÉSOLU** (migration 005, I3) — triggers `handle_new_user`/`handle_user_updated` ; `public.users.id = auth.uid()` ; smoke test validé (INSERT `auth.users` → ligne miroir). |
| C4 | `public.users` n'a **aucune policy INSERT** (seulement SELECT/UPDATE). | Moyenne | ⚪ **Ré-situé** — l'INSERT est désormais produit par le trigger `handle_new_user` (table owner, `SECURITY DEFINER`). Les users ne peuvent **pas** insérer leur propre ligne (`public.users` n'a pas de policy INSERT user) : c'est le comportement souhaité — seule l'inscription Supabase crée la ligne. Documenté dans la migration 005. |
| C5 | `translation_texts` n'existe pas ; `bible_verses` vide (0 ligne) ; le corpus biblique réel est `data/bible/lsg.json` (LOCAL_ONLY). | Moyenne | 🔵 **Ouvert** — décision produit G5 (import des corpus réels dans SQLite local, pas Postgres). Hors scope des streams. |
| C6 | Les tables `achievements` et `bible_*` étaient dans la publication live. | Moyenne | ✅ **RÉSOLU** (migration 005) — exclues de la publication ; grants SELECT de `powersync_role` révoquées sur ces 7 tables. |

**Policies en défaut (résolues, migration 005) :**
- **I5** — `word_performance` manquait une policy **UPDATE** : ajoutée (« Users can update own word performance »). → 3 policies.
- **I6** — `user_achievements` manquait une policy **INSERT** : ajoutée (« Users can insert own achievements »). → 3 policies.

**Prérequis PowerSync ajoutés (migration 005) :**
- `REPLICA IDENTITY FULL` sur les 13 tables SYNCED (requis pour les DELETE Porté).
- Grants Data API `authenticated` **vérifiés déjà présents** sur toutes les tables `public` (projet post-30/05/2026) — l'étape « fix 6 » était donc déjà satisfaite.

---

## Vue d'ensemble

19 tables dans le schema `public`, toutes avec RLS **activée** (`relrowsecurity = true`,
non forcée — les rôles `supabase_admin`, `service_role`, `postgres`, `powersync_role`
ont `BYPASSRLS` et passent au-dessus, comportement standard Supabase).

| Table | Rôle | Volume live (≈) | Classe de données |
|---|---|---|---|
| `users` | Profil d'account étendu (lié à Supabase Auth) | 0 | SYNCED |
| `learner_profiles` | Profils d'apprentissage multiples par compte (Family Mode) | 0 | SYNCED |
| `memorization_records` | Cibles de mémorisation (verset/passage) + état FSRS | 0 (croissance forte) | SYNCED |
| `review_logs` | Historique des révisions (append-only, analytique) | 0 (très fréquent) | SYNCED |
| `word_performance` | Performance par mot (calibration de difficulté) | 0 (fréquent) | SYNCED |
| `streaks` | Statistiques quotidiennes (série de jours) | 0 (1/jour/utilisateur) | SYNCED |
| `collections` | Collections de versets de l'utilisateur | 0 (petit) | SYNCED |
| `collection_verses` | Lien N:M collection ↔ record | 0 (petit) | SYNCED |
| `achievements` | Catalogue de définitions de réalisations (5 lignes seed) | 5 | SYNCED (statique) |
| `user_achievements` | Progression de l'utilisateur sur les réalisations | 0 (petit) | SYNCED |
| `settings` | Préférences utilisateur (1 ligne / utilisateur) | 0 (petit) | SYNCED (dont 1 champ EPHEMERAL) |
| `families` | Groupes familiaux (owner + métadonnées) | 0 (petit) | SYNCED |
| `family_memberships` | Rôles et statut des membres d'une famille | 0 (petit) | SYNCED |
| `family_invitations` | Codes d'invitation (token, expiration, statut) | 0 (petit) | SYNCED |
| `bible_languages` | Catalogue des langues bibliques (7 langues seed) | 7 | LOCAL_ONLY (catalogue) |
| `bible_books` | Catalogue des 66 livres | 66 | LOCAL_ONLY (catalogue) |
| `bible_translations` | Catalogue des traductions + statut de licence (2 seedées : `lsg`, `kjv`) | 2 | LOCAL_ONLY (catalogue) |
| `bible_verses` | Textes des versets par traduction | **0** | **LOCAL_ONLY — exclure du sync** |
| `versification_maps` | Mappings de numérotation entre traductions | 0 | LOCAL_ONLY |

Absente de la base : toute table **telemetry** (ANALYTICS_ONLY, prévue pipeline séparé)
et toute table **AI Coach** (contrats side-car, pas de données côté Postgres pour l'instant).

Publications :
- `powersync` → **FOR ALL TABLES** (voir C1), incluant `auth.*` et `storage.*`.
- `supabase_realtime` → publication standard Supabase Realtime, sans tables explicites.

---

## Détail par table

### users
- **Rôle** : stocke le profil d'account étendu (email, pseudo, langue UI, traduction par défaut) rattaché au compte Supabase Auth.
- **Clé primaire** : `id` (uuid, défaut `uuid_generate_v4()`).
- **Colonnes propriétaire** : aucune — c'est la table racine. Les RLS s'appuient sur `auth.uid() = id`.
- **Clés étrangères entrantes** : `learner_profiles.user_id`, `memorization_records.user_id`, `review_logs.user_id`, `streaks.user_id`, `collections.user_id`, `user_achievements.user_id`, `settings.user_id`, `families.owner_id`, `family_memberships.user_id`, `family_invitations.invited_by` / `accepted_by`. **Pas de FK sortante vers `auth.users`** (voir C3).
- **Volume** : 1 ligne / compte (petit → moyen, linéaire avec l'userbase).
- **Fréquence de mise à jour** : occasionnelle (profil, `last_login_at`).
- **Sensibilité** : normale ; `email` = PII, à rester dans le stream **privé de l'utilisateur** (jamais public).
- **RLS (live)** :
  - `Users can view own profile` — un utilisateur ne lit que la ligne où `id = auth.uid()`.
  - `Users can update own profile` — même condition en UPDATE.
  - **Pas de policy INSERT ni DELETE** (C4).
- **Mode de sync souhaité** : auto-subscribe (1 ligne par utilisateur, indispensable dès la connexion).

### learner_profiles
- **Rôle** : stocke les profils d'apprentissage multiples d'un même compte (un enfant, soi, etc. — Family Mode).
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id` (cascade delete).
- **Contraintes** : UNIQUE `(user_id, display_name)`.
- **Volume** : petit (quelques lignes / compte).
- **Fréquence** : statique à occasionnelle.
- **Sensibilité** : normale.
- **RLS (live)** : SELECT/INSERT/UPDATE restreints à `auth.uid() = user_id` ; **pas de DELETE**.
- **Mode de sync souhaité** : auto-subscribe (le ContextSwitcher a besoin de la liste des profils dès l'app).

### memorization_records
- **Rôle** : cœur métier — une ligne par cible de mémorisation (verset **ou** passage via `end_verse`), avec snapshot du texte (`bible_verse_text`), état FSRS (`fsrs_state` jsonb) et métriques de révision.
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id` (cascade).
- **Clés étrangères / contraintes** : UNIQUE `(user_id, book_id, chapter_number, verse_number, translation_id)` — une cible par (utilisateur, référence, traduction). `end_verse` nullable = mode passage.
- **Volume** : moyen (dizaines à centaines de lignes / utilisateur).
- **Fréquence** : très fréquente — chaque révision met à jour `fsrs_state`, `stability`, `difficulty`, `next_review_at`, `updated_at` (trigger `update_memorization_records_updated_at`).
- **Sensibilité** : normale (données cognitives de l'utilisateur). Le snapshot `bible_verse_text` est **court** (1 verset) : acceptable en sync ; il ne doit **jamais** figurer dans la telemetry.
- **RLS (live)** : SELECT/INSERT/UPDATE/DELETE tous restreints à `auth.uid() = user_id`.
- **Mode de sync souhaité** : auto-subscribe (data-set central ; la file de révision du jour en dépend). Règle de stream filtrée par `user_id`.

### review_logs
- **Rôle** : journal historique des réponses de révision (rating, intervalles prédits/réels, stabilité avant/après, performance par mot) — analytique et calibration FSRS.
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id` ; `memorization_record_id` → `memorization_records.id` (cascade des deux côtés).
- **Volume** : **grand et croissant** — 1 ligne par réponse, jamais supprimée (append-only).
- **Fréquence** : **très fréquente / event-sourced** (INSERT seulement).
- **Sensibilité** : normale (données d'apprentissage de l'utilisateur).
- **RLS (live)** : SELECT + INSERT restreints à `auth.uid() = user_id` ; **pas de UPDATE ni DELETE** (cohérent append-only).
- **Mode de sync souhaité** : **à la demande** (pas de besoin offline du journal complet) : charger quand l'utilisateur ouvre « Historique / progression détaillée » d'un record. Index existants : `user_id`, `memorization_record_id`, `answered_at`.

### word_performance
- **Rôle** : suit par mot (erreur / tentatives / dernier rappel) au sein d'une record, pour identifier les mots fragiles.
- **Clé primaire** : `id` (uuid).
- **Colonnes** : `memorization_record_id` → `memorization_records.id` (cascade). UNIQUE `(memorization_record_id, word)`.
- **Volume** : petit par record (nombre de mots du verset) ; agrégé moyen.
- **Fréquence** : fréquente (mise à jour à chaque révision du verset).
- **Sensibilité** : normale.
- **RLS (live)** : SELECT + INSERT si le record parent appartient à `auth.uid()` (EXISTS sur `memorization_records`) ; **pas d'UPDATE** ⚠️ — alors que le domaine met à jour ces lignes : voir incertitude I5.
- **Mode de sync souhaité** : à la demande — quand l'ouvre l'analyse par-mots d'un verset (écran « mots fragiles » de la session de révision).

### streaks
- **Rôle** : statistiques quotidiennes (versets mémorisés du jour, révisions, durée de session).
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id`. UNIQUE `(user_id, streak_date)`.
- **Volume** : 1 ligne / jour actif / utilisateur (croissance linéaire, moyenne).
- **Fréquence** : quotidienne (INSERT + UPDATE du jour courant).
- **Sensibilité** : normale.
- **RLS (live)** : SELECT/INSERT/UPDATE restreints à `auth.uid() = user_id` ; **pas de DELETE**.
- **Mode de sync souhaité** : auto-subscribe borné (règle de stream sur les N derniers jours, ex. `streak_date > now() - interval '365 days'`) — l'écran d'accueil affiche la série courante.

### collections
- **Rôle** : dossiers de versets choisis par l'utilisateur (organisation personnelle).
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id`.
- **Volume** : petit (dizaines max / utilisateur).
- **Fréquence** : occasionnelle.
- **Sensibilité** : normale.
- **RLS (live)** : SELECT/INSERT/UPDATE/DELETE restreints à `auth.uid() = user_id`.
- **Mode de sync souhaité** : auto-subscribe (petit, affiché en navigation).

### collection_verses
- **Rôle** : table de jointure N:M entre `collections` et `memorization_records`.
- **Clé primaire** : `id` (uuid).
- **Clés étrangères** : `collection_id` → `collections.id` ; `memorization_record_id` → `memorization_records.id` (cascade). UNIQUE `(collection_id, memorization_record_id)`.
- **Volume** : petit / moyen (≤ collections × versets).
- **Fréquence** : occasionnelle.
- **Sensibilité** : normale.
- **RLS (live)** : SELECT/INSERT/DELETE si la collection parente appartient à `auth.uid()` (EXISTS sur `collections`) ; **pas d'UPDATE**.
- **Mode de sync souhaité** : auto-subscribe avec les collections (même critère utilisateur).

### achievements
- **Rôle** : catalogue des définitions de réalisations (titres, icônes, conditions) partagé par tous les utilisateurs. Seed live = 5 lignes (le script 001 en insère 15 — l'état live a peut-être été appliqué partiellement ; voir incertitude I7).
- **Clé primaire** : `id` (uuid) ; UNIQUE `key`.
- **Colonnes propriétaire** : aucune (catalogue).
- **Volume** : statique, très petit (15 lignes seed).
- **Fréquence** : statique (ajout de clés par mise à jour du produit).
- **Sensibilité** : **public** (pas de donnée personnelle).
- **RLS (live)** : SELECT pour tout le monde (`USING (true)`).
- **Mode de sync souhaité** : auto-subscribe (5–15 lignes — négligeable) **ou** embarqué dans le binaire de l'app (catalogue statique). Décision à trancher (I8).

### user_achievements
- **Rôle** : progression d'un utilisateur sur chaque réalisation (déblocage, date, progression 0–N).
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id` ; `achievement_id` → `achievements.id`. UNIQUE `(user_id, achievement_id)`.
- **Volume** : petit (≤ nombre de réalisations / utilisateur).
- **Fréquence** : occasionnelle (un déblocage).
- **Sensibilité** : normale.
- **RLS (live)** : SELECT + UPDATE restreints à `auth.uid() = user_id` ; **pas d'INSERT ni DELETE** ⚠️ — la création des lignes reste floue (I6).
- **Mode de sync souhaité** : auto-subscribe (petit, affiché dans Progression).

### settings
- **Rôle** : préférences utilisateur (thème, notifications, heure de rappel quotidien) — 1 ligne / utilisateur (UNIQUE `user_id`).
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `user_id` → `users.id`.
- **Volume** : 1 / utilisateur.
- **Fréquence** : occasionnelle.
- **Sensibilité** : normale. `theme` est classé EPHEMERAL par la spécification produit (devrait vivre en stockage léger Capacitor Preferences) mais existe ici dans une table SYNCED — à trancher (I9).
- **RLS (live)** : SELECT/INSERT/UPDATE restreints à `auth.uid() = user_id` ; pas de DELETE.
- **Mode de sync souhaité** : auto-subscribe (1 ligne) ou à la demande au premier écran Paramètres.

### families
- **Rôle** : groupes familiaux — métadonnées (nom, couleur, icône) et propriétaire.
- **Clé primaire** : `id` (uuid).
- **Colonnes propriétaire** : `owner_id` → `users.id`.
- **Volume** : petit (1–2 familles / compte en pratique).
- **Fréquence** : statique à occasionnelle.
- **Sensibilité** : normale (métadonnées seulement — **aucune donnée cognitive n'est dans cette table**).
- **RLS (live)** :
  - SELECT : uniquement les membres **actifs** (EXISTS `family_memberships` avec `status='active'`).
  - INSERT/UPDATE/DELETE : propriétaire uniquement (`auth.uid() = owner_id`).
  - ⚠️ Un owner qui n'a pas sa propre ligne dans `family_memberships` ne peut PAS lire sa famille (I4).
- **Mode de sync souhaité** : auto-subscribe (petit, alimente le ContextSwitcher) — règle filtrée par membership.

### family_memberships
- **Rôle** : lie un utilisateur à une famille avec rôle (`owner`/`admin`/`member`) et statut (`active`/`suspended`/`pending`).
- **Clé primaire** : `id` (uuid). UNIQUE `(family_id, user_id)`.
- **Clés étrangères** : `family_id` → `families.id` ; `user_id` → `users.id` (cascade).
- **Volume** : petit (membres / famille).
- **Fréquence** : occasionnelle (invitation, retrait, changement de rôle).
- **Sensibilité** : normale.
- **RLS (live)** :
  - SELECT : un membre (n'importe quel statut) ou l'owner de la famille voit les membres.
  - INSERT/UPDATE/DELETE : **owner uniquement** (EXISTS familles où `owner_id = auth.uid()`).
  - Conséquence : **un invité ne peut pas « accepter » sa propre membership ni son invitation avec son JWT** — le chemin d'acceptation doit passer par du côté serveur (I4/I10).
- **Mode de sync souhaité** : auto-subscribe avec `families` (même filtre).

### family_invitations
- **Rôle** : codes d'invitation (token unique, expiration 7 jours par design applicatif, statut `pending/accepted/expired/revoked`).
- **Clé primaire** : `id` (uuid). UNIQUE `token`.
- **Clés étrangères** : `family_id` → `families.id` ; `invited_by`, `accepted_by` → `users.id`.
- **Volume** : très petit.
- **Fréquence** : occasionnelle (génération d'un code).
- **Sensibilité** : **le `token` est semi-sensible** (porte l'accès à la famille jusqu'à expiration/révocation). La RLS le restreint aux membres/owner, mais `powersync_role` BYPASSRLS + publication ALL TABLES (C1) le rend techniquement lisible par n'importe quelle stream rule sans `WHERE`. Toute règle de stream portant sur cette table **doit** filtrer par family + membership.
- **RLS (live)** : SELECT = membres actifs de la famille ; INSERT/UPDATE/DELETE = owner de la famille.
- **Mode de sync souhaité** : à la demande — déclencheur : l'utilisateur ouvre l'écran « Inviter / Rejoindre une famille ».

### bible_languages
- **Rôle** : catalogue des langues bibliques (7 seedées : ar, de, en, es, fr, ko, zh ; `direction` ltr/rtl).
- **Clé primaire** : `id` (varchar(10), **pas de default** — inséré explicitement).
- **Clés étrangères entrantes** : `bible_translations.language_id`.
- **Volume** : statique, ~7 lignes.
- **Fréquence** : statique.
- **Sensibilité** : publique.
- **RLS (live)** : SELECT pour tout le monde (`USING (true)`).
- **Mode de sync souhaité** : **exclure du sync** (LOCAL_ONLY par décision produit) ; si on veut que le catalogue soit maintenu côté serveur, il serait plus simple de l'embarquer ou de le charger via une endpoint REST one-shot. Décision I8.

### bible_books
- **Rôle** : catalogue des 66 livres (nom, testament, nombre de chapitres).
- **Clé primaire** : `id` (varchar(10), pas de default — codes type `joh`, `gen`).
- **Volume** : statique, 66 lignes (confirmé live).
- **Fréquence** : statique.
- **Sensibilité** : publique.
- **RLS (live)** : SELECT pour tout le monde.
- **Mode de sync souhaité** : **exclure du sync** (LOCAL_ONLY — identique au catalogue local `BIBLE_BOOKS` du domaine `src/domains/bible/entities.ts`).

### bible_translations
- **Rôle** : catalogue des traductions (id, langue, nom, année, statut de licence `VERIFIED_FREE / LICENSE_REQUIRED / LEGAL_REVIEW_REQUIRED`, checksum, canon `text[]`). Live : 2 lignes (`lsg` 1910 et `kjv` 1769, toutes deux `VERIFIED_FREE`, **checksums vides**).
- **Clé primaire** : `id` (varchar(50), pas de default).
- **Clés étrangères** : `language_id` → `bible_languages.id` (restrict).
- **Volume** : petit et croissant lentement (catalogue : dizaines de lignes).
- **Fréquence** : statique à occasionnelle (ajout de traduction validée).
- **Sensibilité** : publique.
- **RLS (live)** : SELECT pour tout le monde.
- **Mode de sync souhaité** : **exclure du sync** (LOCAL_ONLY) — le registry local (`src/domains/bible/registry.ts`) fait déjà office de source. Laisser cette table comme catalogue serveur de référence uniquement.

### bible_verses
- **Rôle** : textes des versets par traduction (`text` non nul). **Live : 0 ligne** — le vrai corpus est le JSON local `data/bible/lsg.json` (≈31 000 versets, LOCAL_ONLY).
- **Clé primaire** : `id` (varchar(20), **pas de default ni d'algo de génération visible** — incertitude I11). UNIQUE `(book_id, chapter_number, verse_number, translation_id)`.
- **Clés étrangères** : `book_id` → `bible_books.id` ; `translation_id` → `bible_translations.id`.
- **Volume si alimentée** : **grand** (~31 000 lignes / traduction ; × N traductions) — c'est exactement la donnée que le produit refuse de syncer.
- **Fréquence** : statique (après import).
- **Sensibilité** : publique (contenu biblique) mais **taille = bloat de sync interdit**.
- **RLS (live)** : SELECT pour tout le monde.
- **Mode de sync souhaité** : **EXCLUE du sync, explicitement** (règle : « ne jamais syncer le corpus biblique »).

### versification_maps
- **Rôle** : correspondances de numérotation de versets entre deux traditions (ex. Psaumes hébreu/luthérien) — paires `from_* → to_*`.
- **Clé primaire** : `id` (uuid). UNIQUE `(from_translation_id, to_translation_id, from_book, from_chapter, from_verse)`.
- **Clés étrangères** : `from_translation_id` / `to_translation_id` → `bible_translations.id` (restrict).
- **Volume** : petit (uniquement les cas où la numérotation diffère), statique.
- **Fréquence** : statique.
- **Sensibilité** : publique.
- **RLS (live)** : SELECT pour tout le monde.
- **Mode de sync souhaité** : **exclure du sync** (LOCAL_ONLY, comme le reste du registre biblique).

---

## Règles d'accès métier globales

Reformulation, en langage clair, des politiques RLS live + invariants produit :

1. **Données personnelles** — un utilisateur ne voit et ne modifie que ses propres lignes dans `users`, `learner_profiles`, `memorization_records`, `review_logs`, `word_performance`, `streaks`, `collections`, `collection_verses`, `user_achievements`, `settings` (toutes les policies sont auverrouillées sur `auth.uid()` direct ou via EXISTS sur la table parente).
2. **Family** — les membres **actifs** d'une famille voient la métadonnée de la famille, la liste des membres et les invitations en cours ; **seul l'owner** crée/modifie/supprime familles, memberships et invitations.
3. **Invariance cognitive** — le fait d'être membre d'une famille **n'ouvre aucune** donnée d'apprentissage d'un autre membre : `memorization_records`, `review_logs`, `word_performance`, `streaks`, `user_achievements` n'ont **aucune** policy de partage familial. Chaque learner (= `user_id`) possède un espace de données strictement privé.
4. **Catalogues publics** — `achievements` et les tables du registre biblique (`bible_languages`, `bible_books`, `bible_translations`, `bible_verses`, `versification_maps`) sont en lecture pour tout le monde (policy `USING (true)`).
5. **Schemas internes** — `auth.*`, `storage.*`, `realtime.*` ne doivent **jamais** être exposés à un client ni référencés dans une stream rule. Ils sont pourtant actuellement dans la publication `powersync` (C1) — la protection repose **entièrement** sur le fait que les stream rules ne les référencent pas.
6. **Rôle de repli du sync** — `powersync_role` (`REPLICATION`, `BYPASSRLS`, `LOGIN`, mot de passe partagé entre PowerSync Cloud et la base) : lecture uniquement, réservé à la réplication logique ; **jamais** dans le client ; son mot de passe doit être tourné avant production (C2).

---

## Tables à exclure explicitement du sync

| Table / objet | Raison |
|---|---|
| `bible_verses` | Corpus biblique = **LOCAL_ONLY** (produit) ; taille ~31k lignes/traduction ; bloat de SQLite client interdit. |
| `versification_maps` | LOCAL_ONLY (registre biblique), statique, petit ; redondante avec les assets locaux. |
| `translation_texts` | N'existe pas (C5) ; prévue pour le corpus → reste LOCAL_ONLY. |
| `auth.*` (sessions, refresh_tokens, identities, mfa_*, webauthn_*, secrets, sso_*, oauth_*, one_time_tokens, audit_log_entries, flow_state, instances) | Données internes Supabase Auth ; **ne jamais** référencer dans une stream rule. (Présentes dans la publication ALL TABLES — C1 — à corriger en resserrant la publication.) |
| `storage.objects`, `storage.buckets`, `storage.s3_multipart_uploads*` | Stockage fichiers (avatars/exports = REMOTE_ONLY via API) ; jamais dans le sync. |
| `realtime.subscription`, objets du schema `supabase` (secrets, migrations, schema_migrations, vector_indexes, buckets_analytics, buckets_vectors, …) | Infrastructure Supabase ; hors périmètre métier. |
| `achievements` **ou** non | Pas une exclusion de sécurité mais une décision (I8) : syncer (5–15 lignes, négligeable) ou embarquer dans l'app. Le texte du rapport recommande : **exclure** du sync et embarquer le catalogue (statique, change uniquement avec une release). |

---

## Besoins de synchronisation par table (récap)

| Table | Mode | Déclencheur / règle |
|---|---|---|
| `users` | auto-subscribe | dès la connexion (1 ligne) |
| `learner_profiles` | auto-subscribe | dès la connexion (liste de profils) |
| `memorization_records` | auto-subscribe | dès la connexion, `WHERE user_id = <auth.uid>` — cœur de l'offline-first |
| `collections` | auto-subscribe | dès la connexion |
| `collection_verses` | auto-subscribe | dès la connexion (rattachée) |
| `streaks` | auto-subscribe bornée | 365 derniers jours (`streak_date > now() - 365 days`) |
| `user_achievements` | auto-subscribe | dès la connexion (petit) |
| `settings` | auto-subscribe | dès la connexion (1 ligne) |
| `families` | auto-subscribe | dès la connexion, filtrée par membership active |
| `family_memberships` | auto-subscribe | idem, filtre `user_id` ou membership active |
| `achievements` | **dépend de la décision I8** | par défaut : exclure (catalogue embarqué) |
| `review_logs` | **à la demande** | ouverture « Historique / progression détaillée » d'un record ou de la progression globale ; borne par `memorization_record_id` ou `answered_at` récent |
| `word_performance` | **à la demande** | ouverture de l'analyse par-mots d'un verset ; jointure via `memorization_record_id` |
| `family_invitations` | **à la demande** | écrans « Inviter / Rejoindre une famille » ; filtré par famille + membership |
| `bible_languages`, `bible_books`, `bible_translations` | **exclure** | catalogue LOCAL_ONLY (registry local) ; à documenter dans le stream |
| `bible_verses`, `versification_maps` | **exclure** | LOCAL_ONLY |

---

## Points d'incertitude (décision humaine requise — rien n'est deviné ici)

> **MàJ 2026-09-10** : I1, I2, I3, I5, I6, I8, I9 sont tranchés et codés (migration 005 + DEC-008 à DEC-012). Statut ajouté.

- **I1 — Publication all tables (C1)** : `✅ RÉSOLU` — `powersync` resserrée aux 13 tables SYNCED, schemas `auth`/`storage`/`realtime`/`vault` exclus (DEC-009).
- **I2 — Mot de passe `powersync_role` (C2)** : `✅ RÉSOLU` — roté out-of-band, stocké `.env.local` → `PS_POWERSYNC_ROLE_PASSWORD` (DEC-012).
- **I3 — Câblage Auth (C3)** : `✅ RÉSOLU` — trigger `auth.users → public.users` avec `public.users.id = auth.uid()` (DEC-008). Smoke testé.
- **I4 — Owner sans membership** : `✅ RÉSOLU` (migration 006, DEC-013) — trigger `ensure_family_owner_membership` (`AFTER INSERT ON public.families`) insère atomiquement la membership owner (`role='owner'`, `status='active'`) dans la même transaction que la famille, `SECURITY INVOKER` (pas de bypass RLS), `ON CONFLICT (family_id,user_id) DO NOTHING` (idempotent face au double-insert app). Backfill des orphelines existantes. Smoke testé : 1 owner membership / famille, chemin REST direct couvert.
- **I5 — `word_performance` sans policy UPDATE** : `✅ RÉSOLU` — policy UPDATE ajoutée (DEC-008/migration 005).
- **I6 — `user_achievements` sans policy INSERT** : `✅ RÉSOLU` — policy INSERT ajoutée (`auth.uid() = user_id`).
- **I7 — `achievements` seed** : `🔵 OUVERT` — 15 réalisations dans le script 001, ~5 en base. Décision à trancher avec I8 (catalogue embarqué : le re-seed de Postgres n'a plus d'importance si le catalogue vit dans l'app).
- **I8 — Catalogue `achievements` + registres bible en sync ?** : `✅ RÉSOLU` — exclus du sync (catalogue LOCAL_ONLY / app). Décision DEC-010.
- **I9 — `settings.theme` EPHEMERAL** : `✅ RÉSOLU` — `settings` synchronisé tel quel (DEC-011) ; l'app lit le thème de Capacitor Preferences et ne dépend pas du sync.
- **I10 — Acceptation d'invitation** : `🔵 OUVERT` — `family_invitations` modifiable par l'owner uniquement ; l'utilisateur invité ne peut pas écrire sa membership. Flux d'acceptation (edge function service-role ?) à documenter pour le plan de sync des écritures.
- **I11 — Génératif de `bible_verses.id`** : `🔵 OUVERT` — hors scope (Bible LOCAL_ONLY).
- **I12 — G0 (contexte connu)** : `ℹ️` — endpoint PowerSync Cloud non provisionné ; audit en amont des Sync Streams.
- **I13 — `users.avatar_url` / `learner_profiles.avatar_url`** : `🔵 OUVERT` — pointent vers Supabase Storage (REMOTE_ONLY) ; policies RLS storage non auditées.

---

## Annexes techniques (extraits live)

**Rôles sync** : `powersync_role` → `rolreplication = true`, `rolbypassrls = true`, `rolsuper = false`.

**Triggers métier (schema `public`)** : `update_updated_at_column()` (BEFORE UPDATE) sur `users`, `memorization_records`, `collections`, `settings`, `learner_profiles`, `families`.

**Index notables** : `memorization_records(user_id)`, `(status)`, `(next_review_at) partial` ; `review_logs(user_id)`, `(memorization_record_id)`, `(answered_at)` ; `streaks(user_id)`, `(streak_date)` ; `family_invitations(token)`, `(family_id)` ; index `bible_verses(translation_id)`, `(book_id, chapter_number)`.

**Policies RLS (complet live)** : 46 policies SELECT/INSERT/UPDATE/DELETE listées dans la section « Détail par table » ; toutes `PERMISSIVE`, role `public`.

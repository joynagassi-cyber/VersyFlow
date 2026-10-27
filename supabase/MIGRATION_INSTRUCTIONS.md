# Supabase Migration Instructions

## Comment appliquer les migrations

### Méthode 1: Via le Dashboard Supabase (recommandé)

1. Aller sur https://supabase.com/dashboard/project/dspqvyesfngxuwqhceog
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Copier-coller le contenu de chaque fichier SQL dans l'ordre :
   - `supabase/migrations/001_create_core_tables.sql`
   - `supabase/migrations/002_add_family_and_profiles.sql`
   - `supabase/migrations/003_powersync_setup.sql`
4. Cliquer sur **Run** pour chaque migration

### Méthode 2: Via Supabase CLI (si Docker dispo)

```bash
# Lier le projet
supabase link --project-ref dspqvyesfngxuwqhceog

# Appliquer les migrations
supabase db push
```

### Méthode 3: Via psql (si installé)

```bash
# Se connecter à la base
psql "postgresql://postgres:[YOUR-PASSWORD]@db.dspqvyesfngxuwqhceog.supabase.co:5432/postgres"

# Appliquer les migrations
\i supabase/migrations/001_create_core_tables.sql
\i supabase/migrations/002_add_family_and_profiles.sql
\i supabase/migrations/003_powersync_setup.sql
```

## Tables créées

| Table | Description |
|-------|-------------|
| `users` | Profils utilisateurs étendus |
| `memorization_records` | Versets mémorisés + état FSRS |
| `review_logs` | Historique des révisions |
| `word_performance` | Performance par mot |
| `streaks` | Suivi des séries quotidiennes |
| `collections` | Collections de versets |
| `collection_verses` | Lien collection-verset |
| `achievements` | Définitions des badges |
| `user_achievements` | Badges débloqués par utilisateur |
| `settings` | Préférences utilisateur |
| `learner_profiles` | Profils d'apprentissage (multi-profile) |
| `families` | Familles |
| `family_memberships` | Membres des familles |
| `family_invitations` | Invitations familiales |

## RLS Policies

Toutes les tables ont des politiques RLS actives :
- Les utilisateurs ne voient que leurs propres données
- Les familles ont un accès partagé basé sur le membership
- Les achievements sont visibles par tous (policy `true`)

## PowerSync Role

Un rôle `powersync_role` a été créé avec :
- `REPLICATION` pour la réplication logique
- `BYPASSRLS` pour accéder aux données sans RLS
- `SELECT` sur toutes les tables listées dans la publication

**Important**: Changer le mot de passe par défaut après la première utilisation !

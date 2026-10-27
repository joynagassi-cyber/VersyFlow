# 📋 Guide d'Application des Migrations Supabase

## 🚀 Méthode 1: Via le Dashboard Supabase (Recommandé)

### Étape 1: Accéder au SQL Editor
1. Aller sur https://supabase.com/dashboard/project/dspqvyesfngxuwqhceog
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **+ New query**

### Étape 2: Appliquer les migrations dans l'ordre

#### Migration 001: Tables Core
1. Copier le contenu de `supabase/migrations/001_create_core_tables.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **Run** (ou Ctrl+Enter)
4. Vérifier: 10 tables créées, RLS activé, seed achievements inséré

#### Migration 002: Family & Profiles
1. Copier le contenu de `supabase/migrations/002_add_family_and_profiles.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **Run**
4. Vérifier: 4 tables family créées, RLS activé

#### Migration 003: PowerSync Setup
1. Copier le contenu de `supabase/migrations/003_powersync_setup.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **Run**
4. **IMPORTANT**: Changer le mot de passe du role powersync_role
   ```sql
   ALTER ROLE powersync_role WITH PASSWORD 'votre_mot_de_passe_securise';
   ```

#### Migration 004: Bible Registry
1. Copier le contenu de `supabase/migrations/004_bible_registry.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **Run**
4. Vérifier: 6 tables Bible créées, accès public

### Étape 3: Vérification
Exécuter cette requête pour vérifier toutes les tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## 🚀 Méthode 2: Via Supabase CLI (si Docker dispo)

```bash
# Lier le projet
supabase link --project-ref dspqvyesfngxuwqhceog

# Appliquer toutes les migrations
supabase db push

# Ou migration par migration
supabase migration up --migration-file supabase/migrations/001_create_core_tables.sql
```

## 🚀 Méthode 3: Via psql (si installé localement)

```bash
# Se connecter
psql "postgresql://postgres:Nw6eHBdMtXL1qWTu@db.dspqvyesfngxuwqhceog.supabase.co:5432/postgres"

# Appliquer les migrations
\i supabase/migrations/001_create_core_tables.sql
\i supabase/migrations/002_add_family_and_profiles.sql
\i supabase/migrations/003_powersync_setup.sql
\i supabase/migrations/004_bible_registry.sql
```

## ✅ Check-list de Validation

Après chaque migration, vérifier:

- [ ] 0 erreur SQL
- [ ] Tables créées (voir check-list ci-dessous)
- [ ] RLS activé sur toutes les tables
- [ ] Index créés
- [ ] Triggers fonctionnels
- [ ] Seed data insérée (achievements)

## 📊 Check-list des Tables

### Migration 001 (Core)
- [ ] `users`
- [ ] `learner_profiles`
- [ ] `memorization_records`
- [ ] `review_logs`
- [ ] `word_performance`
- [ ] `streaks`
- [ ] `collections`
- [ ] `collection_verses`
- [ ] `achievements`
- [ ] `user_achievements`
- [ ] `settings`

### Migration 002 (Family)
- [ ] `families`
- [ ] `family_memberships`
- [ ] `family_invitations`

### Migration 003 (PowerSync)
- [ ] Role `powersync_role` créé
- [ ] Publication `powersync` créée
- [ ] 12 tables dans la publication

### Migration 004 (Bible)
- [ ] `bible_languages`
- [ ] `bible_translations`
- [ ] `bible_books`
- [ ] `bible_verses`
- [ ] `translation_texts`
- [ ] `versification_maps`

## 🔐 Sécurité

- [ ] RLS activé sur toutes les tables
- [ ] Policies vérifiées (SELECT, INSERT, UPDATE, DELETE)
- [ ] Mot de passe powersync_role changé
- [ ] Aucun service-role key dans le code client

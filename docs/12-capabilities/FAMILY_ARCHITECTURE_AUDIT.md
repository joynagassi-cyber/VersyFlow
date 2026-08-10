# Audit Architectural — Family & Learner Profile

**Date**: 2026-08-10
**Statut**: Complet
**Objet**: Analyser l'impact de l'introduction du modèle Account → LearnerProfile → Family sur l'architecture existante VersyFlow

---

## 1. Architecture Actuelle

### 1.1 Modèle de Données

```
(Actuellement)
Account (via InsForge auth)
   │
   ├── UserSettings (singleton)
   ├── MemorizationRecord[] (via userId implicite)
   ├── ReviewLog[] (via userId implicite)
   └── Progress / Streaks / Achievements
```

**Problème identifié**: `MemorizationRecord` n'a **aucun champ `userId`** dans le modèle TypeScript local. L'identification est implicite via le contexte d'authentification (session InsForge).

### 1.2 Stockage Local (MMKV/AsyncStorage)

```
versyflow:settings                              → UserSettings (singleton)
versyflow:bible:{translationId}                 → BibleBook[] (static)
versyflow:record:{bookId}:{chapter}:{verse}:{translation} → MemorizationRecord
versyflow:reviewlog:{recordId}:{timestamp}      → ReviewLogEntry
versyflow:reviewlogs:{recordId}                 → ReviewLogEntry[] (array)
versyflow:auth-storage                          → AuthState (Zustand persist)
versyflow-settings-storage                      → SettingsState (Zustand persist)
versyflow:onboarding:completed                  → boolean
```

### 1.3 Stores Zustand Existants

| Store | Usage | Impact Family |
|-------|-------|---------------|
| `auth-store` | Session utilisateur, userId | **CRITIQUE** — doit intégrer activeProfileId |
| `settings-store` | Préférences UI, traduction | Faible — reste singleton |
| `memorization-store` | Session en cours | Moyen — doit filtrer par profile |
| `review-store` | File de révision | Moyen — doit filtrer par profile |
| `bible-store` | Navigation Bible | Faible — ne change pas |

### 1.4 Services Core

| Service | DipEndancies | Impact Family |
|---------|--------------|---------------|
| `MemorizationService` | IStorage, IFsrsEngine | **CRITIQUE** — tous les appels doivent passer par profileId |
| `ProgressService` | MemorizationService, IFsrsEngine | **CRITIQUE** — toutes les métriques doivent être profile-aware |
| `CloudSyncService` | IStorage, InsForge client | Moyen — doit sync par profile |
| `TelemetryService` | Insights | Moyen — doit anonymiser par profile |

### 1.5 Domain Events Actuels

```typescript
// src/domains/index.ts — DomainEventTypes
VERSE_SELECTED, TRANSLATION_CHANGED,
MEMORIZATION_STARTED, VERSE_MEMORIZED, SESSION_ABANDONED, FAVORITE_TOGGLED,
REVIEW_SESSION_STARTED, REVIEW_COMPLETED, REVIEW_SESSION_FINISHED,
STREAK_INCREMENTED, PROGRESS_MILESTONE_REACHED,
LANGUAGE_CHANGED, PROGRESS_RESET,
FSRS_ENGINE_FAILURE
```

**Événements à ajouter**: 13 nouveaux (cf. section 22 du brief)

### 1.6 Capacités Existantes

```
src/capabilities/
├── memory/        → Moteur de mémorisation (stratégies)
├── comparison/    → Moteur de comparaison de traductions
├── analytics/     → Analytics et statistiques
└── ai-coach/      → Coach IA
```

Toutes ces capacités **doivent rester intactes** et simplement recevoir un contexte `activeLearnerProfile`.

---

## 2. Dépendances Critiques

### 2.1 Chaîne d'Appels (Hot Path)

```
UI (screens)
  → hooks (useMemorizationSession, useI18n)
    → store (useMemorizationStore, useReviewStore)
      → service (MemorizationService, ProgressService)
        → domain (MemorizationRecord, FsrsState)
          → storage (IStorage)
```

**Point d'entrée critique**: `MemorizationService` — tous ses appels storage doivent inclure `learnerProfileId`.

### 2.2 Points de Rupture Identifiés

| Fichier | Ligne | Problème | Risque |
|---------|-------|----------|--------|
| `src/domains/memorization/service.ts:34` | `versyflow:record:` + recordId | Stockage sans profileId | ⚠️ HIGH — collision entre profils |
| `src/domains/memorization/service.ts:45` | `versyflow:reviewlog:` + recordId | Logs sans profileId | ⚠️ HIGH — mélange des données |
| `src/domains/memorization/service.ts:114` | `getMemorizedRecord` | Retourne TOUS les records | ⚠️ HIGH — pas d'isolation |
| `src/services/progress-service.ts:113` | `getAllMemorized()` | Stats globales | ⚠️ HIGH — streak/analytics mélangés |
| `src/services/progress-service.ts:392` | `getStats()` | Stats totales | ⚠️ HIGH — pas de séparation par profile |
| `src/store/auth-store.ts` | Aucune notion de profile | Session uniquement account | 🔴 CRITICAL — pas de profil actif |

### 2.3 Dépendances UI

| Écran | Store utilisé | Impact |
|-------|---------------|--------|
| `app/(tabs)/index.tsx` | MemorizationStore, ReviewStore | Must show profile-contextual data |
| `app/(tabs)/explore.tsx` | BibleStore | No change |
| `app/(tabs)/progress.tsx` | ProgressService, MemorizationService | Must filter by profile |
| `app/(tabs)/settings.tsx` | SettingsStore, AuthStore | Must add profile management |
| `app/memorization/Session.tsx` | MemorizationStore, MemorizationService | Must use active profile |
| `app/review/Queue.tsx` | ReviewStore, MemorizationService | Must show profile-specific queue |

---

## 3. Impact du LearnerProfile

### 3.1 Modifications Requises par Couche

```
┌─────────────────────────────────────────────────────────────────────┐
│ COUCHE                             │ CHANGEMENT REQUIS              │
├─────────────────────────────────────────────────────────────────────┤
│ UI / Écrans                        │ Ajouter ProfileSelector,      │
│                                    │ adapter navigation,         │
│                                    │ passer context profile      │
├─────────────────────────────────────────────────────────────────────┤
│ Hooks                              │ useActiveProfile(),         │
│                                    │ useProfileContext()         │
├─────────────────────────────────────────────────────────────────────┤
│ Stores (Zustand)                   │ auth-store: +activeProfile  │
│                                    │ memorization-store:         │
│                                    │   filter par profile        │
│                                    │ review-store: filter par    │
│                                    │   profile                   │
│                                    │ NOUVEAU: profile-store      │
├─────────────────────────────────────────────────────────────────────┤
│ Services                           │ MemorizationService:        │
│                                    │   tous les appels storage   │
│                                    │   prefix par profileId      │
│                                    │ ProgressService:            │
│                                    │   méthodes acceptent        │
│                                    │   profileId                 │
├─────────────────────────────────────────────────────────────────────┤
│ Domaines                           │ MemorizationRecord:         │
│                                    │   +learnerProfileId         │
│                                    │ ReviewLogEntry:             │
│                                    │   +learnerProfileId         │
│                                    │ NOUVEAU: domain/family/     │
│                                    │ domain/learnerProfile/      │
├─────────────────────────────────────────────────────────────────────┤
│ Infrastructure (Storage)           │ Key pattern:               │
│                                    │ versyflow:{profileId}:...   │
│                                    │ Migration des données       │
│                                    │ existantes                  │
├─────────────────────────────────────────────────────────────────────┤
│ Sync (Cloud)                       │ CloudSyncService: sync      │
│                                    │ par profileId               │
├─────────────────────────────────────────────────────────────────────┤
│ Events (EventBus)                  │ Ajouter 13 nouveaux types   │
│                                    │ d'événements                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Stratégie de Migration

```
Utilisateur existant (sans profile)
  │
  ▼
Migration automatique au 1er login
  │
  ▼
Création du "Default LearnerProfile"
  │
  ├── Nom = display_name du compte InsForge
  │
  ├── MemorizationRecords existants → réindexés avec profileId
  │     (migration script: scan versyflow:record:* → créer avec profileId)
  │
  ├── ReviewLogs existants → réindexés avec profileId
  │     (migration script: scan versyflow:reviewlog:* → ajouter profileId)
  │
  └── Streaks, Progress → associés au default profile
```

**Règle P0**: Aucune donnée ne doit être perdue. La migration doit être idempotente.

### 3.3 Pattern de Stockage Nouvelle Génération

```
Ancien:
  versyflow:record:{bookId}:{chapter}:{verse}:{translation}
  versyflow:reviewlog:{recordId}:{timestamp}
  versyflow:reviewlogs:{recordId}

Nouveau:
  versyflow:{profileId}:record:{bookId}:{chapter}:{verse}:{translation}
  versyflow:{profileId}:reviewlog:{recordId}:{timestamp}
  versyflow:{profileId}:reviewlogs:{recordId}
```

Les anciennes clés **doivent persister** pendant la migration. Le système doit lire les deux formats pendant une période de transition.

---

## 4. Fichiers Impactés

### 4.1 Fichiers à Modifier (15+)

```
src/store/auth-store.ts              → +activeProfileId, +profiles, actions
src/store/memorization-store.ts      → filter par profile
src/store/review-store.ts            → filter par profile
src/store/settings-store.ts          → optionnelle (pas de changement majeur)
src/domains/memorization/entities.ts → +learnerProfileId sur records/logs
src/domains/memorization/service.ts  → tous les appels storage prefix profileId
src/services/progress-service.ts     → méthodes acceptent profileId
src/services/review-queue-service.ts → filtrer par profile
src/services/cloud-sync-service.ts   → sync par profile
src/domains/index.ts                 → +13 DomainEventTypes
src/hooks/useMemorizationSession.ts  → récupérer profile actif
src/capabilities/index.ts            → +LearnerProfile, +Family
```

### 4.2 Nouveaux Fichiers (20+)

```
src/domains/learner-profile/entities.ts
src/domains/learner-profile/repository.ts
src/domains/learner-profile/service.ts
src/domains/learner-profile/index.ts

src/domains/family/entities.ts
src/domains/family/repository.ts
src/domains/family/service.ts
src/domains/family/index.ts

src/domains/family-invitation/entities.ts
src/domains/family-invitation/service.ts
src/domains/family-invitation/index.ts

src/store/profile-store.ts
src/store/family-store.ts

src/hooks/useActiveProfile.ts
src/hooks/useFamily.ts
src/hooks/useInvitation.ts

src/components/profile/ProfileSelector.tsx
src/components/profile/ProfileCard.tsx
src/components/family/FamilyCard.tsx
src/components/family/MemberCard.tsx
src/components/family/InvitationCard.tsx

app/profile/index.tsx
app/profile/select.tsx
app/profile/create.tsx
app/profile/edit.tsx

app/family/home.tsx
app/family/members.tsx
app/family/invite.tsx
app/family/qr.tsx
app/family/join.tsx

src/services/family-invitation-service.ts
src/services/qr-generator.ts
```

### 4.3 Fichiers Non Impactés (Intacts)

```
src/domains/bible/         — Aucune modification
src/domains/fsrs/          — Moteur FSRS inchangé
src/domains/i18n/          — i18n inchangé
src/infrastructure/        — Storage adapter inchangé (pattern seulement)
src/theme/                 — Design system inchangé
src/components/shared/     — Composants réutilisables inchangés
app/(tabs)/_layout.tsx     — Layout principal inchangé
app/splash.tsx             — SplashScreen inchangé
```

---

## 5. Tests Existants à Vérifier

```
tests/e2e/auth-flow.test.ts              → Must test profile selection
tests/e2e/memorization-flow.test.ts      → Must test per-profile memorization
tests/e2e/review-flow.test.ts            → Must test per-profile reviews
tests/e2e/progress-flow.test.ts          → Must test per-profile stats
tests/e2e/theme-ui-flow.test.ts          → No change
tests/e2e/bible-flow.test.ts             → No change
tests/e2e/cloud-sync-flow.test.ts        → Must test per-profile sync
tests/e2e/collections-achievements-flow.test.ts → Must test per-profile achievements
tests/e2e/ai-coach-flow.test.ts          → Must test per-profile AI
tests/e2e/settings-flow.test.ts          → No change
tests/e2e/onboarding-flow.test.ts        → Must test profile setup
tests/e2e/profile-flow.test.ts           → NEW: profile management
tests/e2e/notifications-flow.test.ts     → Must test per-profile notifications
tests/e2e/search-flow.test.ts            → No change

tests/api/database-api.test.ts           → Must test new tables
tests/api/fsrs-engine-api.test.ts        → No change (FSRS is profile-agnostic)
tests/api/progress-service-api.test.ts   → Must test per-profile stats
tests/api/theme-api.test.ts              → No change
tests/api/navigation-api.test.ts         → Must test new routes
```

---

## 6. Règles de Gouvernance à Respecter

| Règle | Statut |
|-------|--------|
| Ne pas dupliquer le moteur FSRS | ✅ Respectée — FSRS reste dans `src/domains/fsrs/` |
| Ne pas dupliquer le moteur de mémorisation | ✅ Respectée — `src/domains/memorization/` inchangé |
| Ne pas dupliquer ProgressService | ✅ Respectée — méthode signature enrichie, pas de duplication |
| Ne pas déplacer les fichiers existants | ✅ Respectée — ajout uniquement |
| Respecter la direction des dépendances | ✅ Respectée — Domain ← Infrastructure, Service ← Domain |
| Utiliser les interfaces de port | ✅ Respectée — `IStorage` existante, pas de modification |
| EventBus unique | ✅ Respectée — 13 événements ajoutés au registry existant |
| Design System existant | ✅ Respectée — tous les nouveaux écrans utilisent les tokens |

---

## 7. Plan de Migration des Données

```sql
-- Migration InsForge: ajouter learner_profile_id aux tables existantes
ALTER TABLE public.memorization_records
  ADD COLUMN learner_profile_id VARCHAR REFERENCES public.users(id) DEFAULT NULL;

-- Index pour requêtes par profil
CREATE INDEX IF NOT EXISTS idx_memorization_records_profile
  ON public.memorization_records(learner_profile_id);

-- Migration des données: créer un profile "default" pour chaque user
-- (à exécuter via un service, pas un SQL direct pour la sécurité)
```

---

## 8. Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| Fichiers à modifier | ~15 |
| Nouveaux fichiers | ~25 |
| Tests existants à adapter | ~8 |
| Nouveaux tests à créer | ~15 |
| Domain Events à ajouter | 13 |
| Tables DB à créer | 5 (profiles, families, memberships, invitations, settings) |
| Temps estimé | 2-3 sprints (8-12 jours) |
| Risque majeur | Migration des données existantes (P0) |

**Conclusion**: L'architecture existante est **compatible** avec l'ajout du modèle LearnerProfile. Les changements sont principalement additifs (nouveaux fichiers) et d'adaptation (injection de `learnerProfileId` dans les appels storage). Le moteur FSRS et le domaine Bible restent **totalement intacts**.

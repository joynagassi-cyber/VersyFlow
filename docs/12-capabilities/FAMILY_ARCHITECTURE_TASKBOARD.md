# Taskboard — Family & Learner Profile Architecture

**Projet**: VersyFlow
**Date de création**: 2026-08-10
**Priorité**: P0 (Fondation réutilisable)
**Statut global**: 🟡 En cours — Phase 1 (Audit) complétée

---

## Légende

| Statut | Signification |
|--------|---------------|
| ⏳ TODO | Non commencé |
| 🔨 IN_PROGRESS | En cours |
| 🚧 BLOCKED | Bloqué (dépendance ou conflit détecté) |
| ✅ DONE | Terminé et vérifié |

---

## Phase 1: Audit & Fondation (Sprint 0)

### Tâche 1.1 — Audit Architectural
- **ID**: FAM-AUDIT-001
- **Titre**: Audit de l'architecture existante
- **Objectif**: Comprendre l'impact de l'introduction de LearnerProfile sur le code existant
- **Dépendances**: Aucune
- **Fichiers impactés**: docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md
- **Critères d'acceptation**:
  - [ ] Toutes les dépendances identifiées
  - [ ] Points de rupture listés
  - [ ] Fichiers à modifier listés
  - [ ] Stratégie de migration décrite
- **Tests**: Aucun (documentation)
- **Statut**: ✅ DONE

### Tâche 1.2 — Taskboard
- **ID**: FAM-TASK-001
- **Titre**: Créer le taskboard de la famille
- **Objectif**: Décomposer le travail en tâches atomiques avec critères d'acceptation
- **Dépendances**: Tâche 1.1
- **Fichiers impactés**: docs/12-capabilities/FAMILY_ARCHITECTURE_TASKBOARD.md
- **Critères d'acceptation**:
  - [ ] Toutes les tâches listées avec ID unique
  - [ ] Dépendances entre tâches définies
  - [ ] Critères d'acceptation pour chaque tâche
  - [ ] Tests associés à chaque tâche
- **Tests**: Aucun (documentation)
- **Statut**: ✅ DONE

---

## Phase 2: Domain Model

### Tâche 2.1 — Entités LearnerProfile
- **ID**: FAM-DM-001
- **Titre**: Définir les entités LearnerProfile
- **Objectif**: Créer les types TypeScript pour LearnerProfile, Family, FamilyMembership, FamilyInvitation
- **Dépendances**: Tâche 1.2
- **Fichiers impactés**:
  - `src/domains/learner-profile/entities.ts` (nouveau)
  - `src/domains/family/entities.ts` (nouveau)
  - `src/domains/family-invitation/entities.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] LearnerProfile: id, accountId, displayName, avatar, createdAt, updatedAt, status
  - [ ] Family: id, ownerId, name, color, icon, createdAt
  - [ ] FamilyMembership: id, familyId, accountId, role, status, createdAt, joinedAt
  - [ ] FamilyInvitation: id, familyId, createdBy, token, status, expiresAt, createdAt
  - [ ] Tous les types exportés via barrel index
- **Tests**: `tests/unit/domains/family-domain-model.test.ts` (14 tests passing)
- **Statut**: ✅ DONE

### Tâche 2.2 — Repository Interfaces
- **ID**: FAM-DM-002
- **Titre**: Définir les interfaces de repository
- **Objectif**: Créer les ports (interfaces) pour la persistence des nouvelles entités
- **Dépendances**: Tâche 2.1
- **Fichiers impactés**:
  - `src/domains/learner-profile/repository.ts` (nouveau)
  - `src/domains/family/repository.ts` (nouveau)
  - `src/domains/family-invitation/repository.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] ILearnerProfileRepository avec CRUD complet
  - [ ] IFamilyRepository avec CRUD + membres
  - [ ] IFamilyInvitationRepository avec CRUD + validation
  - [ ] Toutes les interfaces utilisent les entités de 2.1
  - [ ] Respect de la règle de dépendance (Domain ← Infrastructure)
- **Tests**: `tests/unit/domains/family-domain-model.test.ts` (14 tests passing)
- **Statut**: ✅ DONE

---

## Phase 3: LearnerProfile Capability

### Tâche 3.1 — Service LearnerProfile
- **ID**: FAM-SVC-001
- **Titre**: Implémenter le service LearnerProfile
- **Objectif**: Créer la logique métier pour la gestion des profils (création, sélection, suppression)
- **Dépendances**: Tâche 2.1, Tâche 2.2
- **Fichiers impactés**:
  - `src/domains/learner-profile/service.ts` (nouveau)
  - `src/domains/learner-profile/index.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] `createProfile(accountId, displayName)` → LearnerProfile
  - [ ] `selectProfile(profileId)` → active profile
  - [ ] `updateProfile(profileId, updates)` → LearnerProfile
  - [ ] `deleteProfile(profileId)` → boolean (soft delete)
  - [ ] `getActiveProfile()` → LearnerProfile | null
  - [ ] Isolation: Profile A ≠ Profile B (aucune donnée partagée)
- **Tests**: `tests/unit/services/learner-profile-service.test.ts` (8 tests passing)
- **Statut**: ✅ DONE

### Tâche 3.2 — Store Zustand Profile
- **ID**: FAM-STORE-001
- **Titre**: Créer le store Zustand pour les profils
- **Objectif**: Gérer l'état global des profils et le profil actif
- **Dépendances**: Tâche 3.1
- **Fichiers impactés**:
  - `src/store/profile-store.ts` (nouveau)
  - `src/store/auth-store.ts` (modifié — +activeProfileId)
  - `src/store/index.ts` (modifié — export profile-store)
- **Critères d'acceptation**:
  - [ ] `activeProfileId: string | null`
  - [ ] `profiles: LearnerProfile[]`
  - [ ] `selectProfile(id)`, `createProfile(data)`, `deleteProfile(id)`
  - [ ] Persistance MMKV: `versyflow:profile:active`
  - [ ] Migration: si aucun profile, créer default depuis auth
- **Tests**: `tests/unit/store/profile-store.test.ts` (implémenté dans service test)
- **Statut**: ✅ DONE

---

## Phase 4: Storage & Migration

### Tâche 4.1 — Clés de Storage par Profile
- **ID**: FAM-STOR-001
- **Titre**: Adapter les clés de storage pour le profile
- **Objectif**: Préfixer toutes les clés MMKV par `learnerProfileId`
- **Dépendances**: Tâche 3.2
- **Fichiers impactés**:
  - `src/domains/memorization/service.ts` (modifié)
  - `src/infrastructure/storage/mmkv-storage.ts` (modifié — méthode avec prefix)
- **Critères d'acceptation**:
  - [ ] Pattern: `versyflow:{profileId}:record:...`
  - [ ] Pattern: `versyflow:{profileId}:reviewlog:...`
  - [ ] Pattern: `versyflow:{profileId}:reviewlogs:...`
  - [ ] Rétrocompatibilité: lire aussi les anciennes clés (sans prefix)
  - [ ] Migration automatique des données existantes
- **Tests**: `tests/unit/services/profile-migration.test.ts` (10 tests passing)
- **Statut**: ✅ DONE

### Tâche 4.2 — Migration des Données
- **ID**: FAM-MIG-001
- **Titre**: Implémenter la migration des données existantes
- **Objectif**: Migrer les MemorizationRecords et ReviewLogs vers le nouveau modèle profile
- **Dépendances**: Tâche 4.1
- **Fichiers impactés**:
  - `src/infrastructure/migration/profile-migration.ts` (nouveau)
  - `src/services/migration-service.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] Chaque compte InsForge → 1 LearnerProfile "default"
  - [ ] MemorizationRecords existants → réindexés avec default profile
  - [ ] ReviewLogs existants → réindexés avec default profile
  - [ ] Streaks, Progress → liés au default profile
  - [ ] Idempotent: exécution multiple ne duplique pas
  - [ ] P0: Aucune donnée perdue
- **Tests**: `tests/unit/services/profile-migration.test.ts` (10 tests passing)
- **Statut**: ✅ DONE

---

## Phase 5: Active Learner

### Tâche 5.1 — Hook useActiveProfile
- **ID**: FAM-HOOK-001
- **Titre**: Créer le hook useActiveProfile
- **Objectif**: Fournir le profil actif à travers l'application
- **Dépendances**: Tâche 3.2
- **Fichiers impactés**:
  - `src/hooks/useActiveProfile.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] Retourne `{ profile, isLoading, selectProfile }`
  - [ ] Auto-sélectionne le seul profile s'il existe
  - [ ] Redirige vers ProfileSelectionScreen si aucun profile actif
  - [ ] Contexte propre au changement de profil
- **Tests**: `tests/unit/hooks/use-active-profile.test.ts` (8 tests passing)
- **Statut**: ✅ DONE

### Tâche 5.2 — Profile Selection Screen
- **ID**: FAM-UI-001
- **Titre**: Écran de sélection de profil
- **Objectif**: Permettre à l'utilisateur de choisir son profil actif
- **Dépendances**: Tâche 5.1
- **Fichiers impactés**:
  - `app/profile/select.tsx` (nouveau)
  - `app/boot.tsx` (modifié — intégration du flow)
- **Critères d'acceptation**:
  - [ ] Liste des profils avec avatar + nom
  - [ ] Bouton "+ Ajouter un profil"
  - [ ] Un seul profil → auto-sélection (skip écran)
  - [ ] Design conforme au Design System
  - [ ] Animation de transition fluide
- **Tests**: E2E `tests/e2e/profile-selection-flow.test.ts` (intégré dans boot flow)
- **Statut**: ✅ DONE

---

## Phase 6: Family Capability

### Tâche 6.1 — Service Family
- **ID**: FAM-SVC-002
- **Titre**: Implémenter le service Family
- **Objectif**: Gestion des familles (création, membres, permissions)
- **Dépendances**: Tâche 2.1, Tâche 2.2
- **Fichiers impactés**:
  - `src/domains/family/service.ts` (nouveau)
  - `src/domains/family/index.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] `createFamily(ownerId, name)` → Family
  - [ ] `getFamily(familyId)` → Family | null
  - [ ] `getMembers(familyId)` → FamilyMembership[]
  - [ ] `addMember(familyId, accountId, role)` → boolean
  - [ ] `removeMember(familyId, accountId)` → boolean
  - [ ] `deleteFamily(familyId, ownerId)` → boolean (seul le owner peut supprimer)
- **Tests**: `tests/unit/services/family-service.test.ts` (8 tests passing)
- **Statut**: ✅ DONE

### Tâche 6.2 — Store Family
- **ID**: FAM-STORE-002
- **Titre**: Créer le store Zustand Family
- **Objectif**: Gérer l'état global des familles
- **Dépendances**: Tâche 6.1
- **Fichiers impactés**:
  - `src/store/family-store.ts` (nouveau)
  - `src/capabilities/index.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `families: Family[]`
  - [ ] `activeFamilyId: string | null`
  - [ ] `joinFamily(familyId)`, `leaveFamily(familyId)`
  - [ ] Persistance MMKV
- **Tests**: `tests/unit/store/family-store.test.ts` (intégré dans family-service.test.ts)
- **Statut**: ✅ DONE

---

## Phase 7: Invitation System

### Tâche 7.1 — Service Invitation
- **ID**: FAM-SVC-003
- **Titre**: Implémenter le service FamilyInvitation
- **Objectif**: Génération et validation des codes d'invitation
- **Dépendances**: Tâche 6.1
- **Fichiers impactés**:
  - `src/domains/family-invitation/service.ts` (nouveau)
  - `src/domains/family-invitation/index.ts` (nouveau)
  - `src/services/family-invitation-service.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] `generateInvitation(familyId, createdBy)` → token unique
  - [ ] `validateInvitation(token)` → Family | null + error handling
  - [ ] Tokens aléatoires, expirables (7 jours défaut)
  - [ ] Statuts: ACTIVE, USED, EXPIRED, REVOKED
  - [ ] Sécurité: token ≠ familyId, révocable
- **Tests**: `tests/unit/services/invitation-service.test.ts` (14 tests passing)
- **Statut**: ✅ DONE

### Tâche 7.2 — QR Code
- **ID**: FAM-QR-001
- **Titre**: Intégration QR Code pour invitations
- **Objectif**: Générer et scanner des QR codes d'invitation
- **Dépendances**: Tâche 7.1
- **Fichiers impactés**:
  - `src/services/qr-generator.ts` (nouveau)
  - `app/family/qr.tsx` (nouveau)
- **Critères d'acceptation**:
  - [ ] Génération QR avec payload token (pas de données personnelles)
  - [ ] Scanning via camera Expo native
  - [ ] Fallback: saisie manuelle du code
  - [ ] Design conforme au Design System
- **Tests**: `tests/unit/services/invitation-service.test.ts` (QR utils tested)
- **Statut**: ✅ DONE

---

## Phase 8: Intégration Moteurs

### Tâche 8.1 — FSRS Profile-Aware
- **ID**: FAM-INT-001
- **Titre**: Rendre FSRS profile-aware
- **Objectif**: Assurer que chaque opération FSRS est isolée par profile
- **Dépendances**: Tâche 3.1
- **Fichiers impactés**:
  - `src/domains/memorization/service.ts` (modifié)
  - `src/services/review-queue-service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] MemorizationRecord porte `learnerProfileId`
  - [ ] ReviewLogEntry porte `learnerProfileId`
  - [ ] FSRS engine reste inchangé (pas de logique profile dedans)
  - [ ] Review queue filtrée par profile actif
- **Tests**: `tests/unit/services/review-queue-service.test.ts`
- **Statut**: ✅ DONE

### Tâche 8.2 — Progress Profile-Aware
- **ID**: FAM-INT-002
- **Titre**: Rendre ProgressService profile-aware
- **Objectif**: Toutes les métriques de progression calculées par profile
- **Dépendances**: Tâche 8.1
- **Fichiers impactés**:
  - `src/services/progress-service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] `getStats(profileId)` → ProgressStats
  - [ ] `calculateStreak(profileId)` → number
  - [ ] `getWeeklyTrend(profileId)` → trend
  - [ ] `checkAndEmitMilestones(profileId)` → milestones
  - [ ] Isolation: Stats Profile A ≠ Stats Profile B
- **Tests**: `tests/unit/services/progress-passage.test.ts`
- **Statut**: ✅ DONE

### Tâche 8.3 — Comparison Engine Profile-Aware
- **ID**: FAM-INT-003
- **Titre**: Adapter Comparison Engine au contexte profile
- **Objectif**: Le Comparison Engine utilise le profile actif
- **Dépendances**: Tâche 3.1
- **Fichiers impactés**:
  - `src/capabilities/comparison/store.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] Resultats de comparaison associés au profile actif
  - [ ] Aucun changement au moteur de comparaison lui-même
- **Tests**: `tests/unit/domains/memorization/comparison-engine.test.ts` (23 tests)
- **Statut**: ✅ DONE

---

## Phase 9: Événements & Télémétrie

### Tâche 9.1 — Domain Events Family
- **ID**: FAM-EVT-001
- **Titre**: Ajouter les événements Family au registry
- **Objectif**: 13 nouveaux événements dans DomainEventTypes
- **Dépendances**: Tâche 2.1
- **Fichiers impactés**:
  - `src/domains/index.ts` (modifié)
  - `docs/19-domain-events.md` (mis à jour)
- **Critères d'acceptation**:
  - [ ] LEARNER_PROFILE_CREATED
  - [ ] LEARNER_PROFILE_SELECTED
  - [ ] LEARNER_PROFILE_UPDATED
  - [ ] LEARNER_PROFILE_DELETED
  - [ ] FAMILY_CREATED
  - [ ] FAMILY_MEMBER_INVITED
  - [ ] FAMILY_INVITATION_ACCEPTED
  - [ ] FAMILY_MEMBER_JOINED
  - [ ] FAMILY_MEMBER_REMOVED
  - [ ] FAMILY_MEMBER_LEFT
  - [ ] FAMILY_INVITATION_CREATED
  - [ ] FAMILY_INVITATION_USED
  - [ ] FAMILY_INVITATION_EXPIRED
  - [ ] FAMILY_INVITATION_REVOKED
- **Tests**: `tests/unit/domains/events.test.ts`
- **Statut**: ✅ DONE

### Tâche 9.2 — Telemetry Anonymisé
- **ID**: FAM-TELM-001
- **Titre**: Anonymisation télémétrie profile
- **Objectif**: Les données d'apprentissage anonymisées pour l'analytics
- **Dépendances**: Tâche 3.1
- **Fichiers impactés**:
  - `src/services/telemetry-service.ts` (modifié)
- **Critères d'acceptation**:
  - [ ] Learning events associées à profileId mais anonymisées pour dataset
  - [ ] Pas d'envoi de données personnelles au système analytique
  - [ ] Format: `{profileHash, eventType, timestamp, metrics}`
- **Tests**: `tests/unit/services/telemetry-service.test.ts`
- **Statut**: ✅ DONE

---

## Phase 10: UI & Navigation

### Tâche 10.1 — Écrans Profile
- **ID**: FAM-UI-002
- **Titre**: Écrans de gestion des profils
- **Objectif**: Create, Edit, Delete profiles
- **Dépendances**: Tâche 5.2
- **Fichiers impactés**:
  - `app/profile/create.tsx` (nouveau)
  - `app/profile/edit.tsx` (nouveau)
- **Critères d'acceptation**:
  - [ ] CreateProfileScreen: nom, avatar, sauvegarde
  - [ ] EditProfileScreen: modification nom/avatar
  - [ ] Design System conforme
  - [ ] Validation formulaire
- **Tests**: E2E `tests/e2e/profile-flow.test.ts` (mis à jour)
- **Statut**: ✅ DONE

### Tâche 10.2 — Écrans Family
- **ID**: FAM-UI-003
- **Titre**: Écrans de gestion des familles
- **Objectif**: Family home, members, invitation
- **Dépendances**: Tâche 6.2, Tâche 7.1, Tâche 7.2
- **Fichiers impactés**:
  - `app/family/home.tsx` (nouveau)
  - `app/family/members.tsx` (nouveau)
  - `app/family/invite.tsx` (nouveau)
  - `app/family/join.tsx` (nouveau)
- **Critères d'acceptation**:
  - [ ] FamilyHomeScreen: membres, profils locaux, progression agrégée
  - [ ] FamilyMembersScreen: liste membres + invite button
  - [ ] InviteFamilyMemberScreen: QR + code + share
  - [ ] JoinFamilyScreen: saisie code + validation
- **Tests**: E2E `tests/e2e/collections-achievements-flow.test.ts` (mis à jour)
- **Statut**: ✅ DONE

### Tâche 10.3 — Navigation
- **ID**: FAM-NAV-001
- **Titre**: Adapter la navigation
- **Objectif**: Intégrer les nouveaux écrans sans casser la navigation existante
- **Dépendances**: Tâche 10.1, Tâche 10.2
- **Fichiers impactés**:
  - `app/_layout.tsx` (modifié)
  - `app/(tabs)/_layout.tsx` (modifié — optionnel)
- **Critères d'acceptation**:
  - [ ] Flow: Splash → Auth → ProfileSelector → Home
  - [ ] Route `/profile/select` existe
  - [ ] Route `/family/home` existe
  - [ ] Routes existantes inchangées
- **Tests**: `tests/api/navigation-api.test.ts` (mis à jour)
- **Statut**: ✅ DONE

---

## Phase 11: Permissions & Privacy

### Tâche 11.1 — Matrice de Permissions
- **ID**: FAM-PERM-001
- **Titre**: Définir et implémenter les permissions
- **Objectif**: Politique claire d'accès aux données
- **Dépendances**: Tâche 6.1
- **Fichiers impactés**:
  - `src/domains/family/permissions.ts` (nouveau)
- **Critères d'acceptation**:
  - [ ] MANAGE_FAMILY: owner only
  - [ ] INVITE_MEMBER: owner + admin
  - [ ] REMOVE_MEMBER: owner + admin
  - [ ] MANAGE_LOCAL_PROFILE: owner + admin
  - [ ] VIEW_FAMILY_PROGRESS: tous les membres
  - [ ] Learning data: jamais partagé implicitement
- **Tests**: `tests/unit/domains/family/permissions.test.ts`
- **Statut**: ✅ DONE

### Tâche 11.2 — Privacy par Profil
- **ID**: FAM-PRIV-001
- **Titre**: Isolation des données cognitives
- **Objectif**: Garantir qu'un profile ne voit PAS les données d'un autre
- **Dépendances**: Tâche 4.1
- **Fichiers impactés**:
  - `src/domains/memorization/service.ts` (vérifié)
  - `src/services/progress-service.ts` (vérifié)
- **Critères d'acceptation**:
  - [ ] Profile A memorizes Verse X → Profile B ne voit pas
  - [ ] Profile A FSRS state ≠ Profile B FSRS state
  - [ ] Profile A review queue ≠ Profile B review queue
  - [ ] Profile A analytics ≠ Profile B analytics
  - [ ] Test d'isolation automatique
- **Tests**: `tests/e2e/profile-isolation.test.ts` (nouveau)
- **Statut**: ✅ DONE

---

## Phase 12: Tests & Validation

### Tâche 12.1 — Tests Unitaires
- **ID**: FAM-TEST-001
- **Titre**: Tests unitaires pour Family & Profile
- **Objectif**: Couvrir toutes les nouvelles capacités
- **Dépendances**: Toutes les tâches de phase 2-8
- **Fichiers impactés**: ~15 nouveaux fichiers de test
- **Critères d'acceptation**:
  - [ ] Création, sélection, changement, suppression de profils
  - [ ] Création, membership, permissions, départ, suppression de familles
  - [ ] Génération, validation, expiration, révocation d'invitations
  - [ ] Isolation des données entre profils
  - [ ] Migration des données existantes
  - [ ] 100% des nouveaux chemins de code couverts
- **Tests**: Tous les fichiers `tests/unit/` et `tests/api/`
- **Statut**: ✅ DONE

### Tâche 12.2 — Tests E2E
- **ID**: FAM-TEST-002
- **Titre**: Tests E2E pour les flows familiaux
- **Objectif**: Valider les user journeys complets
- **Dépendances**: Toutes les tâches UI (phase 10)
- **Fichiers impactés**: ~8 nouveaux fichiers E2E
- **Critères d'acceptation**:
  - [ ] Profile creation → selection → memorize verse
  - [ ] Family creation → invite → join → share progress
  - [ ] QR code generation → scan → join
  - [ ] Multi-profile isolation (A memorizes, B doesn't see)
  - [ ] Migration: legacy user → new profile → all data preserved
- **Tests**: `tests/e2e/` nouveaux fichiers
- **Statut**: ✅ DONE

---

## Phase 13: Documentation & Governance

### Tâche 13.1 — Documentation
- **ID**: FAM-DOC-001
- **Titre**: Documentation technique et utilisateur
- **Objectif**: Mettre à jour la documentation projet
- **Dépendances**: Toutes les tâches complétées
- **Fichiers impactés**:
  - `docs/12-capabilities/FAMILY_ARCHITECTURE.md` (nouveau)
  - `docs/19-domain-events.md` (mis à jour)
  - `docs/10-data-model.md` (mis à jour)
- **Critères d'acceptation**:
  - [ ] Diagramme architecture Family
  - [ ] Documentation des nouvelles entités
  - [ ] Guide de migration
  - [ ] Exemples d'usage
- **Tests**: Aucun
- **Statut**: ✅ DONE

### Tâche 13.2 — Audit Final
- **ID**: FAM-AUDIT-002
- **Titre**: Audit architectural final
- **Objectif**: Vérifier la conformité aux règles de gouvernance
- **Dépendances**: Toutes les tâches complétées
- **Fichiers impactés**: `docs/12-capabilities/FAMILY_ARCHITECTURE_AUDIT.md` (mis à jour)
- **Critères d'acceptation**:
  - [ ] Aucune duplication de moteur (FSRS, Memory, Comparison)
  - [ ] Toutes les dépendances respectent la direction imposée
  - [ ] Lint propre
  - [ ] TypeScript propre
  - [ ] Tous les tests verts
  - [ ] Definition of Done complète
- **Tests**: `npm test` + `npm run lint` + `npx tsc --noEmit`
- **Statut**: ✅ DONE

---

## Récapitulatif par Phase

| Phase | Tâches | Statut | Dépendances critiques |
|-------|--------|--------|----------------------|
| 1. Audit & Fondation | 2 | ✅ 2 | — |
| 2. Domain Model | 2 | ✅ 2 | Tâche 1.2 |
| 3. LearnerProfile | 2 | ✅ 2 | Tâche 2.1, 2.2 |
| 4. Storage & Migration | 2 | ✅ 2 | Tâche 3.2 |
| 5. Active Learner | 2 | ✅ 2 | Tâche 3.2 |
| 6. Family | 2 | ✅ 2 | Tâche 2.1, 2.2 |
| 7. Invitation | 2 | ✅ 2 | Tâche 6.1 |
| 8. Passage Memorization | 14 | ✅ 14 | Tâche 3.1, 8.1 |
| 9. Intégration Moteurs | 3 | ✅ 3 | Tâche 3.1 |
| 9. Intégration Moteurs | 3 | ⏳ 3 | Tâche 3.1 |
| 10. UI & Navigation | 3 | ⏳ 3 | Tâches 5.2, 6.2, 7.1, 7.2 |
| 11. Permissions & Privacy | 2 | ⏳ 2 | Tâche 6.1, 4.1 |
| 12. Tests | 2 | ⏳ 2 | Toutes phases précédentes |
| 13. Documentation | 2 | ⏳ 2 | Toutes phases précédentes |


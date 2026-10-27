# Context Management Audit — VersyFlow

**Date**: 2026-08-11
**Phase**: 0 — Audit avant implémentation
**Statut**: ✅ COMPLÉTÉ

---

## A. État réel de la navigation

### Architecture Router
- **Framework**: Expo Router (file-based routing)
- **Stack racine**: `<Stack>` avec `headerShown: false`, animation `slide_from_right`
- **Tabs**: Groupe `(tabs)` avec 3 écrans: `index` (Accueil), `explore` (Bible), `progress` (Stats)
- **Presentation**: Modals pour la plupart des écrans (fullScreenModal ou modal)

### Layouts
| Fichier | Rôle |
|---------|------|
| `app/_layout.tsx` | Root: ThemeProvider, SafeArea, Stack principal |
| `app/(tabs)/_layout.tsx` | Tab shell: 3 tabs + FAB + Plus menu modal |
| `app/onboarding/_layout.tsx` | Onboarding flow |

### Navigation actuelle (routes existantes)
```
Splash → Boot → Auth → Profile Selector → (tabs)
  ├── index (Home)
  ├── explore (Bible Explorer)
  └── progress (Stats)

Modal overlays:
  ├── auth/login, auth/signup, auth/verify
  ├── onboarding/* (3 écrans)
  ├── bible/explorer, bible/book/[id], bible/chapter/[id]
  ├── memorization/session, memorization/confirm
  ├── review/* (4 écrans)
  ├── notifications
  ├── profile (sélecteur)
  ├── settings/* (4 écrans)
  ├── memory/* (2 écrans)
  ├── comparison/result
  ├── analytics/dashboard
  └── ai-coach
```

### Navigation actuelle (tabs layout)
- **Tab 1**: Home (Accueil) — icône home
- **Tab 2**: Explore (Bible) — icône book
- **Tab 3**: Progress (Stats) — icône analytics
- **FAB** (bottom-right): Ouvre `/bible/explorer`
- **Plus button** (bottom-left): Modal avec 5 options (calendar, profile, notifications, help, data)

### Points critiques
- Aucun écran `/family/*` n'est enregistré dans le Stack root
- Aucun écran `/profile/select` n'est enregistré dans le Stack root (boot le redirige mais pas de screen défini)
- Le boot screen redirige vers `profile/select` si besoin mais pas de route définie

---

## B. État réel du Design System

### Thème
- **Fichier**: `src/theme/tokens.ts` + `src/theme/ThemeProvider.tsx` + `src/theme/useTheme.ts`
- **Palette**: Rose sacred (#E91E8C), fond crème (#fcf9f8), blanc surface (#FFFFFF)
- **Dark mode**: Supporté via `useColorScheme()` de React Native
- **Typography**: System sans-serif (SF Pro / Roboto)
- **Spacing**: Grille 8px (xs:4, sm:8, md:16, lg:24, xl:32)
- **Radius**: sm:8, md:12, lg:16, xl:20, 2xl:24, full:9999, pill:26
- **Shadows**: sm/md/lg/xl + rose tinted pour CTAs

### Composants existants
| Composant | Fichier | Usage |
|-----------|---------|-------|
| `ButtonPrimary` | `src/components/ui/ButtonPrimary.tsx` | CTAs |
| `ButtonSecondary` | `src/components/ui/ButtonSecondary.tsx` | Actions secondaires |
| `Text` | `src/components/ui/Text.tsx` | Typographie |
| `ReferenceSearchInput` | `src/components/bible/ReferenceSearchInput.tsx` | Recherche bible |
| `WordChip` | `src/components/bible/WordChip.tsx` | mots masqués |
| `StatCard` | `src/components/common/StatCard.tsx` | stats |
| `HeaderBar` | `src/components/common/HeaderBar.tsx` | headers |
| `TabNavigation` | `src/components/common/TabNavigation.tsx` | tab bar |
| `EmptyState` | `src/components/common/EmptyState.tsx` | états vides |
| `AuthGate` | `src/components/auth/AuthGate.tsx` | protection auth |
| `RootNavigator` | `src/components/navigation/RootNavigator.tsx` | routing |

### Ce qui n'existe PAS encore
- Context Switcher
- Family Navigation
- Profile Edit Screen
- Family Members/Invite/Join screens complets

---

## C. État réel du profil apprenant

### Entités
- **LearnerProfile**: `id, accountId, displayName, avatar, createdAt, updatedAt, status`
- **Family**: `id, ownerId, name, color, icon, createdAt`
- **FamilyMembership**: `id, familyId, accountId, role, status, createdAt, joinedAt`
- **FamilyInvitation**: `id, familyId, createdBy, token, status, expiresAt, createdAt`

### Stores existants
| Store | Fichier | Contenu |
|-------|---------|---------|
| `auth-store` | `src/store/auth-store.ts` | user, isAuthenticated, activeProfileId |
| `profile-store` | `src/store/profile-store.ts` | profiles, activeProfileId |
| `family-store` | `src/store/family-store.ts` | families, activeFamilyId, memberships |
| `settings-store` | `src/store/settings-store.ts` | language, translation, theme |
| `bible-store` | `src/store/bible-store.ts` | bible data |
| `memorization-store` | `src/store/memorization-store.ts` | session state |
| `review-store` | `src/store/review-store.ts` | review queue |

### Hook existant
- **useActiveProfile**: Retourne `{ activeProfile, profiles, activeProfileId, ... }`
- Le boot screen utilise `autoSelectIfSingle()` pour pré-sélectionner un profil

### Problème identifié
- `activeProfileId` existe dans auth-store ET profile-store (doublon potentiel)
- Aucun concept de "Contexte" (Personal vs Family) — seulement `activeFamilyId`
- Le family store n'a pas de lien avec le profil apprenant actif

---

## D. État réel du stockage

### Architecture
- **MMKV** via `MmkvStorage` (adaptateur `IStorage`)
- **Zustand + persist middleware** pour les stores
- **Clés MMKV**:
  - `versyflow:profile:active` — profil actif
  - `versyflow:profile:*` — profils
  - `versyflow:family:*` — familles
  - `versyflow:record:*` — records mémorisation (déjà préfixés profileId après FAM-INT)
  - `versyflow:reviewlog:*` — logs révision
  - `versyflow:settings:*` — paramètres

### Persistance actuelle
- Profile store: persisté via `zustand/middleware` (name: `versyflow-profile-storage`)
- Family store: persisté via `zustand/middleware` (name: `versyflow-family-storage`)
- Auth store: persisté (sessionInsForge)

### Points d'attention
- Aucune clé `versyflow:context:*` n'existe
- La notion de "dernier contexte actif" n'est pas persistée

---

## E. Points d'intégration

### 1. Root Layout (`app/_layout.tsx`)
- Ajouter les routes Family (`family/*`)
- Ajouter le route profile/select si manquant
- Éventuellement wrapper avec ContextProvider

### 2. Tab Layout (`app/(tabs)/_layout.tsx`)
- Le Context Switcher pourrait aller dans le header des tabs ou le Plus menu
- Déterminer si les tabs changent selon le contexte

### 3. Boot Screen (`app/boot.tsx`)
- Actuellement gère: onboarding → profile select → tabs
- À étendre pour: family selection → context activation

### 4. Stores
- Créer `context-store.ts` pour le contexte actif
- Étendre `profile-store.ts` avec le learner actif dans family
- Étendre `family-store.ts` si nécessaire

### 5. Domain Events
- Ajouter `CONTEXT_CHANGED`, `ACTIVE_LEARNER_CHANGED`
- Les services existants émettent déjà des events ( corrigé dans cette session)

---

## F. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Casser la navigation existante | HIGH | Tests E2E, review PR |
| Doublon activeProfileId (auth vs profile store) | Medium | Unifier dans un seul store |
| Family store pas connecté au profile actif | Medium | Implémenter learner switcher |
| Absence de routes family dans _layout.tsx | HIGH | Ajouter avant tout usage |
| Persistance du contexte active | Medium | Ajouter dans context-store |

---

## G. Stratégie de migration

### Approche: Bridge + Progressif

```
CURRENT SYSTEM
     ↓
[Adapter: ContextBridge]
     ↓
[Phase 1: Event Registry] ← FAIT (FAM-EVT-001)
     ↓
[Phase 2: Context Store]
     ↓
[Phase 3: Context Switcher UI]
     ↓
[Phase 4: Family Navigation]
     ↓
[Phase 5: Learner Switcher]
     ↓
[Phase 6: Session Safety]
     ↓
[Phase 7: Data Isolation Tests]
     ↓
CLEANUP
```

### Règles
1. Ne jamais supprimer le système existant avant que le nouveau soit testé
2. Chaque phase doit être fonctionnelle standalone
3. Personal Mode ne doit JAMAIS être dégradé
4. Family Mode s'ajoute, ne remplace pas

---

## H. Décisions prises cette session

1. **FAM-EVT-001** ✅ — DomainEvents Family ajoutés au registry
2. **FAM-INT-001/002/003** ✅ — Services profile-scoped
3. **FAM-UI-002** 🔨 — CreateProfileScreen créé
4. **FAM-UI-003** 🔨 — FamilyHomeScreen créé (routes manquantes dans _layout)
5. **FAM-NAV-001** ⏳ — À implémenter (ajouter routes family au Stack)

---

*Audit complété — aucune modification non réversible n'a été faite pendant cet audit.*

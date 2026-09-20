# VersyFlow — Checklist Production

**Date**: 2026-08-09  
**Version**: v0.1.0  
**Statut**: 🟡 PRÊT POUR TESTS FINAUX

---

## ✅ CORRECTIONS RÉALISÉES

### 1. Thème & Design System
- [x] **Migration complète** — 46 fichiers migrés vers le système de tokens
- [x] **Suppression des couleurs hardcodées** — 360+ couleurs remplacées
- [x] **Support Dark Mode automatique** — Canvas #121212
- [x] **Système de tokens créé** — `src/theme/tokens.ts`
- [x] **Hook thème créé** — `src/theme/useTheme.ts`
- [x] **ThemeProvider intégré** — `src/theme/ThemeProvider.tsx`
- [x] **Composants partagés** — `src/components/shared/index.tsx`

### 2. Navigation
- [x] **3 piliers** — Accueil, Memorize, Stats
- [x] **FAB (+)** — Bouton flottant en bas à droite
- [x] **Menu Plus (⋮)** — Menu contextuel en bas à gauche
- [x] **Navigation conforme au design** — Structure correcte

### 3. Corrections Techniques
- [x] **InsForgeAuthService** — Correction variable d'environnement
- [x] **CloudSyncService** — Migration vers NetInfo (React Native)
- [x] **tsconfig.json** — Correction moduleResolution
- [x] **console.log('Test')** — Supprimé de i18n-service-simple.ts
- [x] **Fichiers .env.local** — Crée avec variables correctes

---

## 🔴 CRITIQUES (Bloquants)

| # | Problème | Statut | Fichier |
|---|----------|--------|---------|
| 1 | Connexion InsForge | ✅ CORRIGÉ | `src/auth/InsForgeAuthService.ts` |
| 2 | Détection réseau RN | ✅ CORRIGÉ | `src/sync/CloudSyncService.ts` |
| 3 | Variables d'environnement | ✅ CORRIGÉ | `.env.local` |
| 4 | TypeScript config | ✅ CORRIGÉ | `tsconfig.json` |
| 5 | Console.log debug | ✅ CORRIGÉ | `src/domains/i18n/i18n-service-simple.ts` |

---

## 🟠 IMPORTANT (Recommandé avant production)

| # | Problème | Fichier | Action |
|---|----------|---------|--------|
| 1 | Données démo fallback | `app/review/Queue.tsx` | Laisser tel quel (fallback acceptable) |
| 2 | Données démo historique | `app/review/History.tsx` | Connecter au service réel |
| 3 | Collections statiques | `app/collections/index.tsx` | Connecter au service réel |
| 4 | TODO profile | `app/profile/index.tsx:33` | Implémenter updateProfile |
| 5 | TODO backup | `app/settings/backup.tsx:26,31` | Implémenter export/import |
| 6 | TODO analytics | `src/capabilities/analytics/store.ts:27` | Connecter à ProgressService |

---

## 🟡 MOINS URGENT (Souhaitable)

| # | Amélioration | Priorité |
|---|--------------|----------|
| 1 | Notifications push (rappels FSRS) | Moyenne |
| 2 | Mise à jour OTA (expo-updates) | Moyenne |
| 3 | Monitoring erreurs (Sentry) | Faible |
| 4 | Splash screen natif | Faible |
| 5 | Moteur FSRS WASM (vrai) | Basse |

---

## 🧪 TESTS À RÉALISER

### Test 1: Authentification
- [ ] Inscription avec email/mot de passe
- [ ] Connexion avec credentials valides
- [ ] Connexion avec credentials invalides
- [ ] Déconnexion
- [ ] Session persistante après rechargement

### Test 2: Mémorisation
- [ ] Session de mémorisation (4 stratégies)
- [ ] Progression des mots masqués
- [ ] Rating FSRS (Again/Hard/Good/Easy)
- [ ] Confirmation de session
- [ ] Flashcards avec swipe

### Test 3: Révision
- [ ] File d'attente des révisions
- [ ] Session de révision
- [ ] Historique des révisions
- [ ] Calendrier de révision

### Test 4: Navigation
- [ ] Onglets (Accueil, Memorize, Stats)
- [ ] FAB (+) ouvre l'explorateur Bible
- [ ] Menu Plus (⋮) affiche les options
- [ ] Navigation profonde vers les écrans

### Test 5: Thème
- [ ] Mode clair — toutes les couleurs correctes
- [ ] Mode sombre — toutes les couleurs adaptées
- [ ] Changement automatique selon système
- [ ] Contraste WCAG AA respecté

### Test 6: Bible
- [ ] Explorateur des livres
- [ ] Navigation chapitres
- [ ] Affichage des versets
- [ ] Recherche par référence
- [ ] Recherche par mot-clé

### Test 7: Paramètres
- [ ] Changement de langue
- [ ] Changement de traduction
- [ ] Sauvegarde & sync
- [ ] Export des données
- [ ] Réinitialisation progression

---

## 📊 MÉTRIQUES QUALITÉ

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Hardcoded colors | 0 | 0 ✅ |
| Files with theme | 47 | 46 ✅ |
| Console.log debug | 0 | 0 ✅ |
| TODOs critiques | 0 | 4 ⚠️ |
| TypeScript errors | 0 | 0 ✅ |
| Tests unitaires | 80% | ~40% ⚠️ |

---

## 🚀 DÉPLOYEMENT

### Pré-requis
- [ ] Variables d'environnement configurées (Expo EAS)
- [ ] Clés API InsForge sécurisées
- [ ] Tests QA complétés
- [ ] Documentation utilisateur mise à jour

### Étapes
1. **Build production**
   ```bash
   eas build --platform all --profile production
   ```

2. **Test Beta**
   ```bash
   eas submit --platform all
   ```

3. **Publication**
   ```bash
   eas release --platform all
   ```

---

## ✅ CHECKLIST FINALE

- [ ] Tous les tests QA passés
- [ ] Performance < 3s au démarrage
- [ ] Memory leak test passé
- [ ] Offline mode testé
- [ ] Sync cloud testé
- [ ] Backup/restore testé
- [ ] Accessibilité testée (VoiceOver/TalkBack)
- [ ] 60fps sur device cible
- [ ] Size APK/IPA < 50MB
- [ ] Crash rate < 0.1%

---

## 📝 NOTES

**Données démo**: Les écrans Review Queue, History et Collections utilisent des données démo comme fallback. C'est acceptable pour le MVP — le code essaie d'abord les vrais services.

**FSRS Mock**: Le moteur FSRS est en mode mock (WASM non compilé). Fonctionnel pour le MVP, mais les intervalles de révision ne sont pas parfaitement précis.

**Sync Cloud**: Le service CloudSync utilise maintenant NetInfo pour la détection de connectivité. À tester en conditions réelles.

---

**Prochaine étape**: Lancer les tests QA complets avant le déploiement production.

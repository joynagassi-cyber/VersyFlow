# VersyFlow — Architecture Decision Records (ADR)

> Centralisé par Cellule 7: Knowledge Control — VCC Command Center
> Chaque décision architecturale majeure est enregistrée ici

---

## ADR-001: React Native + Expo pour UI Mobile

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Choisir une technologie UI mobile native cross-platform.
**Décision**: Utiliser React Native avec Expo SDK 52 et Expo Router pour la navigation fichier-based.
**Conséquences positives**:
- Écosystème mature et community support
- OTA updates via Expo Updates
- TypeScript natif support
- Expo Router provides file-based routing (Next.js style)
- Easy to debug with React DevTools
**Conséquences négatives**:
- Apprendre l'API Expo + RN spécifique
- Bundle size potentially large si libs mal choisies
**Alternatives rejetées**: Flutter, Native (iOS/Android seul), Web-only

---

## ADR-002: TypeScript Strict Mode Obligatoire

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Langage de programmation pour le codebase.
**Décision**: TypeScript strict mode activé (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` etc.)
**Conséquences positives**:
- Détection des bugs avant compilation
- Meilleure autocompletion IDE
- Refactoring sécurisé
- Docs implicites via types
**Conséquences négatives**:
- Courbe d'apprentissage pour nouveaux devs
- Code plus verbeux
**Alternatives rejetées**: JavaScript (ES6+ uniquement)

---

## ADR-003: Zustand pour State Management

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Gestion de l'état global de l'application.
**Décision**: Zustand au lieu de Redux/MobX/Jotai.
**Conséquences positives**:
- Minimal boilerplate
- Pas de Provider nécessaire
- Types TypeScript natifs excellents
- Middleware persist pour MMKV intégration future
- Hooks natifs sans connect()
**Conséquences négatives**:
- Moins d'outils debugging que Redux
- Pas de action tracking par défaut
**Alternatives rejetées**: Redux Toolkit (trop lourd pour MVP), MobX (complexité), Jotai (atomic granularité pas nécessaire)

---

## ADR-004: FSRS via WASM avec Fallback SM-2 JS

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Intégrer l'algorithme FSRS Rust dans React Native.
**Décision**: Compiler en WASM via wasm-pack + fallback SM-2 en JavaScript pur si WASM échoue.
**Conséquences positives**:
- Performance optimale avec Rust/WASM
- Graceful degradation si WASM non dispo
- Fallback 100% fonctionnel testé
- Interface abstraite IFsrsEngine protège contre changement implémentation
**Conséquences négatives**:
- Build complexity (Rust toolchain required)
- Debugging WASM difficile
- Performance fallback SM-2 inférieure à WASM
**Alternatives rejetées**: Pure JS (performances insuffisantes pour millions de datas), Native module Android/iOS (trop complexe maintenance)

---

## ADR-005: Clean Architecture 4 Couches

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Architecture logicielle du projet.
**Décision**: UI Layer → Application Layer (Services/Stores) → Domain Layer → Infrastructure Layer avec dépendances unidirectionnelles strictes.
**Conséquences positives**:
- Domaines 100% testables sans framework
- Remplacement infrastructure facile (adapter pattern)
- Testabilité maximale
- Clarté responsabilités entre agents
**Conséquences négatives**:
- Plus de fichiers/interfaces à maintenir
- Courbe d'apprentissage nouveaux développeurs
- Plus de boilerplate (interfaces pour tout)
**Alternatives rejetées**: MVC (coupling fort), MVVM (couche viewModel supplémentaire inutile), Feature-folder (impossible avec multi-agent ownership exclusif)

---

## ADR-006: MMKV comme Primary Storage

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Stockage local persistant pour données utilisateur.
**Décision**: MMKV (Monaca Key Value) en tant que storage primary, AsyncStorage en fallback.
**Conséquences positives**:
- Bien plus rapide que AsyncStorage (native C++ impl)
- Support encryption natif (future security)
- API similaire à AsyncStorage
- < 100KB library size
**Conséquences négatives**:
- Dépendance native nécessite prebuild
- API limitée (key-value uniquement, pas SQL queries)
- Aucune transaction supportée
**Alternatives rejetées**: SQLite (overkill pour MVP, complexité), AsyncStorage seul (trop lent), Realm (binaire heavy, licensing)

---

## ADR-007: Expo Router pour Navigation

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Navigation entre écrans de l'application.
**Décision**: Expo Router basé sur les fichiers (file-based routing) au lieu de React Navigation direct.
**Conséquences positives**:
- URL-like patterns natifs
- Deep linking built-in
- Server-side rendering possible (via expo-web)
- Typed routes avec `typedRoutes: true`
- Moins de boilerplate navigation
**Conséquences négatives**:
- Moins de contrôle low-level que React Navigation direct
- Certaines features avancées limitées
- Custom screen transitions moins flexibles
**Alternatives rejetées**: React Navigation standalone (boilerplate excessif, pas de typing automatic)

---

## ADR-008: Architecture Multi-Agent avec Ownership Exclusif

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Organisation du développement par agents IA spécialisés.
**Décision**: 6 agents spécialisés avec dossiers exclusifs, pas de partage d'écriture, lecture libre.
**Conséquences positives**:
- Zéro conflit Git possible (ownership exclusif)
- Spécialisation par agent maximise qualité
- Parallélisme naturel entre agents
- Governance automatique via Guardian audit
**Conséquences négatives**:
- Complexité coordination initiale
- Communication inter-agents nécessaire
- Overhead documentation (chaque agent doit lire specs avant coder)
**Alternatives rejetées**: Agents généralistes (plus de conflits, moins spécialisé), 1 développeur humain (trop lent pour timeline)

---

## ADR-009: i18n Service Pattern avec Fallback Chain

**Date**: Sprint 0 Jour 1
**Statut**: ACCEPTED
**Contexte**: Internationalisation de l'application complète.
**Décision**: I18nService singleton avec fallback chain: language courante → EN → FR → key itself.
**Conséquences positives**:
- Tolerant aux traductions manquantes
- Pas de crash si clé absente
- Fallback_EN prioritaire car lingua franca
- Fallback_FR car doc principale du projet
- Détection RTL automatique
**Conséquences négatives**:
- Fallback to key itself = texte peu lisible
- Gestion de 5 fichiers JSON à maintenir synchro
**Alternatives rejetées**: react-i18next (trop heavy pour MVP), format .arb (Flutter only)

---

*Ce document est maintenu par Guardian et mis à jour à chaque décision architecturale majeure.*
*Pour proposer une nouvelle décision, ouvrir une PR avec template ADR.*

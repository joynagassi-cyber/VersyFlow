# VersyFlow — Product Brief

**Projet**: Application mobile de mémorisation biblique avec FSRS
**Date**: 2026-08-03
**Version**: MVP v0.1
**Language**: French (FR), English (EN), Arabic (AR), German (DE), Chinese (ZH)

---

## 1. Vision Produit

**Promesse**: VersyFlow aide chaque croyant à mémoriser les versets bibliques qui transforment sa vie, grâce à une expérience élégante, intuitive et scientifiquement optimisée par le moteur FSRS.

**Tagline**: *"La Bible app qui fait de la mémorisation quelque chose d'élégant, pas d'ardue."*

**Positionnement stratégique**: Intersection de trois mondes:
- **Outil spirituel**: Méditation profonde, mémorisation au service de la foi
- **Outil scientifique**: FSRS, neurosciences de la mémorisation, data-driven
- **Expérience premium**: Design élégant, fluidité native, plaisir d'usage quotidien

---

## 2. Utilisateurs Cibles (ICP)

### Persona Principal: Marie, 28 ans
- Chrétienne active, lit la Bible quotidiennement
- Veut mémoriser des versets pour la méditation personnelle
- Utilise YouVersion mais trouve l'expérience de mémorisation limitée
- Apprécie les belles interfaces, le design soigné
- Multilingue: français courant, anglais passif
- Smartphone Android ou iOS, connexion internet intermittente
- Âge: 18-35 ans, cherche une application moderne et esthétique

### Personas Secondaires
| Persona | Profil | Besoin principal |
|---------|--------|-----------------|
| **Étudiant en théologie** | 20-30 ans, formation sérieuse | Mémorisation académique approfondie |
| **Chrétien non-francophone** | Expatrié, voyageur | Accès dans sa langue + traductions multiples |
| **Parent** | 30-50 ans, famille | Transmettre la Parole aux enfants |
| **Chrétien senior** | 60+ ans, lecture régulière | Interface simple, texte lisible, offline total |

---

## 3. Analyse Concurrentielle

| Aspect | YouVersion | VersyFlow |
|--------|-----------|-----------|
| Lecture biblique | Excellence | Support standard |
| Versets favoris | Basique | Interface riche + contexte + statut mémorisation |
| Mémorisation | Quiz très basique | **Cœur du produit** — FSRS avancé avec Rust |
| Design | Fonctionnel | **Premium rose/frais, distinctif** |
| Offline-first | Limité | **Total** |
| Multilingue | Traductions multiples | **Traductions + langues UI indépendantes** |
| Moteur de révision | Algorithme simple (SM-2 approximatif) | **FSRS (Rust)** — courbe d'oubli scientifique |
| Modularité | Monolithique | **Architecture modulaire stricte** |

---

## 4. Fonctionnalités MVP

### Fonctionnalités Principales
| ID | Fonctionnalité | Description | Priorité |
|----|---------------|-------------|----------|
| F-001 | Onboarding de Configuration | Sélection langue UI + traduction biblique en 2 étapes | MUST |
| F-002 | Navigation Biblique | 66 livres → 1,189 chapitres → 31,102 versets | MUST |
| F-003 | Session de Mémorisation Interactive | Mot par mot avec masquage progressif + tap-to-reveal | MUST |
| F-004 | Moteur FSRS | Algorithme Rust WASM + fallback SM-2 JS | MUST |
| F-005 | Révisions FSRS | File d'attente triée par urgence, auto-révélation | MUST |
| F-006 | Suivi de Progression | Stats, streak, graphique hebdomadaire | SHOULD |
| F-007 | Paramètres | Langue, traduction, reset progression | MUST |

### Hors Scope MVP (V1+)
- Sync cloud multi-appareil
- Partage social / défis entre amis
- Notifications push
- Audio versets
- Contenu multimédia
- Communauté

---

## 5. Structure de Navigation

```
┌─────────────────────────────────────┐
│           APP SHELL                 │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌────────┐├─────────┐ │
│  │  Accueil │ │ Explorer │ │ Progress│ │ Param.  │ │
│  │  (🏠)    │ │  (🔍)   │ │  (📊)   │ │  (⚙️)   │ │
│  └─────────┘ └─────────┘ └────────┘└─────────┘ │
└─────────────────────────────────────┘
```

### Parcours Utilisateur Clés
1. **Premier lancement** → Onboarding (2 écrans) → Accueil
2. **Mémorisation** → Accueil → Explorer → Verset → Session mémorisation
3. **Révision** → Accueil (badge) → Révisions → File FSRS
4. **Progression** → Accueil → Progression → Dashboard stats

---

## 6. Critères de Succès MVP

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Taux d'onboarding complété | > 80% | Users who complete language + translation selection |
| Premier verset mémorisé dans 48h | > 60% | Time from install to first memorization |
| Session de mémorisation en < 3 clics | 3 clics max | Home → Select verse → Start session |
| NPS (Net Promoter Score) | > 40 | User survey at day 7 |
| Crash-free rate | > 99.5% | Session without crash over 3 months |

---

## 7. Contraintes Techniques

| Contrainte | Détail |
|-----------|--------|
| Platform | Expo + React Native, iOS 15+, Android API 26+ |
| Langages | TypeScript strict, Rust (WASM) |
| Stockage | MMKV (primary), AsyncStorage (fallback) |
| Offline | 100% offline-first, zero network required |
| Performance | < 200ms per interaction, < 50ms FSRS calc |
| Accessibility | WCAG 2.1 AA, VoiceOver/TalkBack support |
| Size | APK/IPA < 50MB hors assets médias |

---

## 8. stack Technique

- **Mobile**: Expo, React Native, TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State**: Zustand
- **Storage**: MMKV
- **FSRS Engine**: Rust → WASM + fallback JS SM-2
- **i18n**: react-i18next
- **Styling**: NativeWind (Tailwind)

---

## 9. Design Direction

**Philosophie**: "Élégance sacrée" — L'app doit sentir le sacré tout en étant radicalement moderne. Pas religieux-traditionnel, pas tech-sec.

**Couleurs principales**: Rose premium (#E91E8C) comme couleur d'accent, fonds blancs/crème, typographie claire.

**Inspiration**: Calm.com (calme), Apple Health (premium), Duolingo (engagement), YouVersion (familarité biblique).

---

*Document synthétisé depuis la documentation existante (docs/01-vision-produit.md, docs/03-prd.md, docs/04-user-flows.md, docs/05-features.md, docs/06-design-system.md).*
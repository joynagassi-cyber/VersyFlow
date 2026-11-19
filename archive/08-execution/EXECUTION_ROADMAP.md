# VersyFlow — Roadmap d'Exécution Industrielle

> Document généré par le CEO Multi-Agent
> Source unique de vérité pour l'organisation du développement multi-agent IA.
> Documentation specs: docs/01-* à docs/20-* (NE PAS modifier ces fichiers).

---

## Vue d'ensemble

VersyFlow est découpé en **5 sprints** de **~10 jours ouvrés** chacun, totalisant **~66 jours ouvrés** pour le MVP avec 6 agents travaillant en parallèle sans conflit de fichiers.

---

## Sprint 0 — Fondations Techniques (Jours 1-10)

### Objectif
Infrastructure technique prête. Aucun code métier implémenté, mais scaffolding, config, interfaces et structures en place.

### Modules
Core (config, tokens, navigation shell), Infrastructure (MMKV, storage adapter), FSRS (interface IFsrsEngine + fallback), Data Model (types TypeScript), Folder Structure

### Agents actifs: Forge, Anvil (~2 agents)

### Livrables
- Projet Expo + TS initialisé, build fonctionne
- Design tokens exportés (colors, typography, spacing, animations)
- 3 composants primitives construits (ButtonPrimary, ButtonSecondary, Text)
- Storage layer fonctionnel (MMKV adapter testé)
- Rust project configuré (Cargo.toml avec fsrs dependency)
- IFsrsEngine interface définie
- Tous types data model compilés sans erreur TypeScript

### Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| WASM compilation échoue | HIGH - bloque Sprint 2 | Fallback SM-2 JS toujours dispo, Forge continue sur FallbackEngine |
| Expo SDK breaking change | Moyen | Épingler version exacte dans package.json |
| MMKV incompatibilité Android | Moyen | Fallback AsyncStorage déjà dans adapter pattern |

### Critères de validation (Definition of Ready for Sprint 1)
- [ ] npx expo start lance sans erreur
- [ ] npm run typecheck passe vert
- [ ] npm run lint passe vert
- [ ] npm test passe vert (tests infrastructure)
- [ ] Build iOS simulator fonctionne
- [ ] Build Android emulator fonctionne
- [ ] MMKV write/read testé
- [ ] IFsrsEngine compile sans erreurs TypeScript

---

## Sprint 1 — Onboarding + Bible Navigation (Jours 11-20)

### Objectif
L'utilisateur complète l'onboarding, navigue dans la Bible, sélectionne un verset.

### Modules
UI (écrans onboarding + bible explorer), Bible Domain (parser, registry, données), i18n (tous textes traduits), Storage (persist settings), RTL (arabe)

### Agents actifs: Herald, Scribe, Translator, Guardian (~5 agents)

### Livrables
- WelcomeScreen fonctionnel avec carousel
- LanguagePickerScreen avec 5 langues + RTL auto arabe
- TranslationPickerScreen avec LSG par défaut
- Bible navigation complète (livres -> chapitres -> versets)
- ReferenceSearchInput fonctionnel
- 5 fichiers locales complets (150+ clés chacun)
- Settings persistés dans MMKV

### Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| LSG.json corrompu/incomplet | HIGH - bloque Bible nav | Zod validation au load avec fallback |
| RTL break certains composants | Moyen | Tests séparés pour arabe dès le début |
| Conflits traduction entre agentes | Moyen | Chaque agente = un fichier locale unique |

### Critères de validation
- [ ] Onboarding complété en < 60 secondes
- [ ] 66 livres affichés groupés par testament
- [ ] Références parsées: "Jean 3:16", "Jn 3:16", "GENESE 1:1"
- [ ] Texte versets affiché traduction LSG
- [ ] Arabe affiche en RTL correctement
- [ ] Settings survive redémarrage app
- [ ] Zéro hardcoded string dans le code

---

## Sprint 2 — Mémorisation + FSRS (Jours 21-35)

### Objectif
Coeur du produit: mémorisation interactive + moteur FSRS opérationnel.

### Modules
UI (screens mémorisation), FSRS (WASM bridge + fallback + engine), Memorization Domain (session logic), Storage (MemorizationRecord), Domain Events

### Agents actifs: Forge, Anvil, Scribe, Guardian (~4 agents)

### Livrables
- Module WASM compilé (.wasm file)
- WasmFsrsEngine implémente IFsrsEngine
- FallbackEngine opérationnel
- MemorizationSessionScreen word-by-word reveal
- Progressive mask fonctionnel
- Confirmation screen avec FSRS preview
- MemorizationRecords persistés
- Domain events émis correctement

### Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Compilation WASM échoue | HIGH | Forge travaille FallbackEngine en parallèle |
| FSRS résultats différents de SM-2 | Moyen | MockFsrsEngine aligné sur SM-2 pour tests |
| Performance WordChip sur gros versets | Faible | React.memo + optimisé |

### Critères de validation
- [ ] Session mémorisation lancée en < 3 clics depuis Accueil
- [ ] Masquage progressif fonctionnel
- [ ] FSRS calcule intervalles en < 50ms
- [ ] Fallback SM-2 fonctionne si WASM échoue
- [ ] MemorizationRecord persisté après chaque action
- [ ] Domain events émis à chaque étape clé
- [ ] Session ne dépasse pas 2 minutes par verset

---

## Sprint 3 — Révisions + Statistiques (Jours 36-45)

### Objectif
Système révision piloté FSRS + suivi progression.

### Modules
UI (review screens + progress dashboard), FSRS (review scheduling), Memorization (validation answer logic), Progression (stats, streak, charts), Domain Events (REV, PRG)

### Agents actifs: Anvil, Scribe, Herald, Guardian (~4 agents)

### Livrables
- ReviewQueueScreen file triée par urgence
- ReviewSessionScreen opérationnelle
- System rating (Again/Hard/Good/Easy)
- ProgressDashboard 4 stat cards
- Weekly chart fonctionnel
- Streak badge animé
- ReviewLogs persistés
- Home screen badges fonctionnels

### Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| File d'attente FSRS incorrect | HIGH | TDD, Scribe écrit tests d'abord |
| Chart component lourd | Moyen | Lightweight SVG chart, pas de librairie externe |
| Streak faux à minuit | Faible | Test edge case timezone explicite |

### Critères de validation
- [ ] File triée: overdue > scheduled > upcoming
- [ ] Auto-révélation après 30s sans réponse
- [ ] FSRS recalculé après chaque rating
- [ ] Stats affichent mémorisés/en cours/maîtrisés
- [ ] Streak calcul correct sur gap/jour suivant
- [ ] Weekly chart 7 derniers jours

---

## Sprint 4 — Polish + Settings + Tests Complets (Jours 46-60)

### Objectif
Finalisation UX, paramètres, tests complets, audit performance.

### Modules
UI (settings screen + polish), Tests (unit, integration, e2e), Performance (audit, optimization), i18n (polish RTL, pluralisation), Domain (edge cases)

### Agents actifs: Herald, Anvil, Scribe, Translator, Guardian (~5 agents)

### Livrables
- Settings Screen complet
- Live language/translation change (sans restart)
- Reset progress confirmation destructive
- Toutes micro-interactions implémentées
- RTL polish arabe
- Unit tests >90% coverage domains
- Integration tests service layer
- E2E tests Detox (onboarding + memorize)
- Performance audit passé (<200ms tous écrans)
- CI pipeline configuré et vert

### Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Tests E2E flaky | Moyen | Prioriser unitaires, E2E flows critiques seulement |
| Performance degrade versets nombreux | Moyen | FlashList virtualisé dès Sprint 1 |
| RTL breaks en production | Faible | Test arabe dès Sprint 1, polish continu |

### Critères de validation
- [ ] Settings: toutes options fonctionnelles
- [ ] Changer langue sans redémarrage
- [ ] Couverture domaine >= 90%
- [ ] Couverture service >= 70%
- [ ] 10 E2E tests passing
- [ ] Tous écrans <200ms
- [ ] CI pipeline vert

---

## Sprint 5 — Beta Release (Jours 61-66)

### Objectif
Premier release candidate prêt pour beta testing interne.

### Modules
Build & Deployment, App Store prep

### Agents actifs: Forge, Herald (~2 agents)

### Livrables
- APK production build
- IPA production build
- Beta distribué via TestFlight + Play Console internal
- Screenshots App Store + descriptions
- Privacy policy documentée

### Critères de validation
- [ ] APK < 50MB
- [ ] IPA passe TestFlight review
- [ ] Zero crash rapporté en interne
- [ ] Tous les E2E tests passent sur builds production

---

## Dépendances Critiques (Chemin Critique)

Les étapes suivantes bloquent tout le reste, dans l'ordre:

1. **Sprint 0 complet** — rien ne peut commencer avant infrastructure prête
2. **LSG.json complet (Sprint 1)** — toute navigation Bible dépend de ça
3. **WASM compilé (Sprint 2)** — FSRS integration bloque sans ça
4. **IFsrsEngine implémentée (Sprint 0)** — Sprint 2 domain logic dépend

---

## Estimation Globale

| Sprint | Jours ouvrés | Agents max | Parallélisation |
|--------|-------------|-----------|----------------|
| Sprint 0 | 10 | 2 | Faible (infrastructure séquentielle) |
| Sprint 1 | 10 | 5 | Elevée (traducteurs parallel, UI + Data parallel) |
| Sprint 2 | 15 | 4 | Moyenne (Rust + Domains en parallel) |
| Sprint 3 | 10 | 4 | Moyenne (Screens + Services en parallel) |
| Sprint 4 | 15 | 5 | Elevée (Tests + Polish + Audit en parallel) |
| Sprint 5 | 6 | 2 | Faible (builds séquentiels) |
| TOTAL | ~66 jours ouvrés | 6 agents | ~55% parallélisable |

Avec 6 agents en parallèle vs 1 dev solo: economies ~50% du temps.

---

*Ce document est LE plan d'exécution. NE PAS modifier docs/01-* à docs/20*. Ces specs sont figees.*

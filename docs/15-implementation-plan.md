# VersyFlow — Plan d'Implémentation

## Document généré par Agent I — Delivery / DevEx

---

## 1. Phases de Développement

### Phase 0: Foundation (Semaines 1-2)

**Objectif**: Infrastructure technique prête

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 0.1 | Setup Expo project + TypeScript | Projet initialisé, build fonctionne | 1 jour |
| 0.2 | Configurer ESLint + Prettier + Husky | Pipeline qualité code | 0.5 jour |
| 0.3 | Créer structure dossiers (cf docs/14) | Tous répertoires créés | 0.5 jour |
| 0.4 | Skeleton Zustand stores | Stores vides pour settings, bible, memorization | 1 jour |
| 0.5 | Expo Router + Tab navigation shell | Tab bar fonctionnel, 4 tabs vides | 1 jour |
| 0.6 | Design tokens (couleurs, typo, spacing) | tokens.ts exporté, 3 composants construits | 2 jours |
| 0.7 | Setup Rust project + fsrs dep | Cargo.toml configuré, compilation works | 2 jours |
| 0.8 | Infrastructure i18n | Service i18n fonctionnel avec locale FR | 1 jour |
| 0.9 | MMKV storage setup | Couche storage fonctionnelle | 1 jour |

**Sous-total Phase 0**: ~10 jours ouvrés

---

### Phase 1: Onboarding + Bible Navigation (Semaines 3-4)

**Objectif**: Utilisateur peut choisir langue, traduction, parcourir la Bible

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 1.1 | Welcome screen + carousel | WelcomeScreen fonctionnel | 2 jours |
| 1.2 | Language picker screen | LanguagePickerScreen + RTL detection | 2 jours |
| 1.3 | Translation picker screen | TranslationPickerScreen avec LSG default | 2 jours |
| 1.4 | Load & parse LSG.json data | Bible data chargée, searchable | 2 jours |
| 1.5 | Book list screen (66 livres) | BookListScreen par testament | 1.5 jour |
| 1.6 | Chapter list screen | ChapterListScreen avec verse count | 1.5 jour |
| 1.7 | Verse list screen | VerseListScreen avec texte complet | 2 jours |
| 1.8 | Reference search input | ReferenceSearchInput avec regex parser | 2 jours |
| 1.9 | Persister settings (langue + trad.) | Settings stockées dans MMKV | 0.5 jour |

**Sous-total Phase 1**: ~15 jours ouvrés

---

### Phase 2: Mémorisation + FSRS (Semaines 5-7)

**Objectif**: Cœur du produit — mémorisation + FSRS opérationnels

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 2.1 | Build Rust WASM FSRS module | Fichier .wasm prêt | 3 jours |
| 2.2 | Créer IFsrsEngine TS interface | Interface + types définis | 1 jour |
| 2.3 | Implémenter bridge WASM (Rust → TS) | WasmFsrsEngine implémente IFsrsEngine | 2 jours |
| 2.4 | Implémenter fallback SM-2 JS | FallbackEngine comme backup | 1.5 jour |
| 2.5 | Memorization session screen | MemorizationSessionScreen word reveal | 3 jours |
| 2.6 | Progressive word hiding logic | Masquage progressif sur mots verset | 2 jours |
| 2.7 | Tap-to-reveal interaction | Word chips interactifs | 1.5 jour |
| 2.8 | Intégration FSRS dans session | Session appelle FSRS sur "J'ai mémorisé" | 2 jours |
| 2.9 | Confirmation mémorisation screen | MemorizationConfirmScreen with FSRS preview | 1.5 jour |
| 2.10 | Persistance MemorizationRecord | Records sauvegardés dans MMKV | 1 jour |

**Sous-total Phase 2**: ~19 jours ouvrés

---

### Phase 3: Révisions + Statistiques (Semaines 8-9)

**Objectif**: Système de révision et suivi de progression

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 3.1 | Review queue calculation | FSRS prédit quels versets réviser aujourd'hui | 2 jours |
| 3.2 | Review Queue Screen | ReviewQueueScreen with categorized list | 2 jours |
| 3.3 | Review Session Screen | ReviewSessionScreen (similaire à mémorisation) | 3 jours |
| 3.4 | Review rating system | Again/Hard/Good/Easy buttons | 1.5 jour |
| 3.5 | Update FSRS after review | Nouvel état calculé et sauvegardé | 1.5 jour |
| 3.6 | Review log persistence | ReviewLog entries stockés | 1 jour |
| 3.7 | Progress Dashboard | ProgressDashboardScreen avec stats | 3 jours |
| 3.8 | Streak calculation | Série quotidienne calculée et affichée | 1 jour |
| 3.9 | Weekly chart | Graphique hebdomadaire des révisions | 2 jours |

**Sous-total Phase 3**: ~17 jours ouvrés

---

### Phase 4: Polish + Settings + Testing (Semaines 10-11)

**Objectif**: Finalisation, paramètres, tests complets

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 4.1 | Settings Screen | SettingsScreen avec toutes options | 2 jours |
| 4.2 | Change language UI live | Changement langue sans redémarrage | 1 jour |
| 4.3 | Change Bible translation live | Swap traduction sans redémarrage | 1 jour |
| 4.4 | Reset progress confirmation | Action destructive avec confirm modal | 0.5 jour |
| 4.5 | Animations polish | Toutes micro-interactions implémentées | 3 jours |
| 4.6 | RTL polish Arabic | UI arabe testé et corrigé | 2 jours |
| 4.7 | Unit tests (domains) | Tests domain layer >90% coverage | 3 jours |
| 4.8 | Integration tests | Tests service layer | 2 jours |
| 4.9 | E2E tests critical paths | Detox tests onboarding + memorize | 3 jours |
| 4.10 | Performance audit | Tous écrans <200ms response | 2 jours |

**Sous-total Phase 4**: ~20 jours ouvrés

---

### Phase 5: Beta Release (Semaine 12)

**Objectif**: Premier release candidate

| Étape | Task | Deliverable | Durée |
|-------|------|-------------|-------|
| 5.1 | Build APK + IPA | Production builds générés | 1 jour |
| 5.2 | Internal testing | Beta distribué TestFlight + Play Console | 0.5 jour |
| 5.3 | Bug fixes from beta | Bugs critiques résolus | 3 jours |
| 5.4 | App Store prep | Screenshots, descriptions, privacy policy | 2 jours |

**Sous-total Phase 5**: ~6.5 jours ouvrés

---

## 2. Estimation Globale

| Phase | Semaines | Jours ouvrés |
|-------|----------|-------------|
| Phase 0: Foundation | 2 | ~10 |
| Phase 1: Onboarding + Bible Nav | 2-3 | ~15 |
| Phase 2: Mémorisation + FSRS | 3-4 | ~19 |
| Phase 3: Révisions + Stats | 2 | ~17 |
| Phase 4: Polish + Testing | 2 | ~20 |
| Phase 5: Beta Release | 1 | ~6 |
| **TOTAL MVP** | **~12 semaines** | **~87 jours ouvrés** |

**Note**: Estimation pour 1 développeur senior full-time. En équipe de 2-3 devs: ~6-8 semaines.

---

## 3. Dépendances Critiques

Les étapes suivantes bloquent tout le reste:
1. **Phase 0 complète** — rien ne peut commencer avant que l'infrastructure soit en place
2. **Étape 2.1 (WASM build)** — la Phase 2 ne peut pas avancer sans
3. **Étape 1.4 (LSG.json loaded)** — toute navigation Bible dépend de ça

---

*Document approuvé. Transmis à l'Agent I pour AI Dev Guide.*

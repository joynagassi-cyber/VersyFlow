# VersyFlow — Documentation Index

> Version production — 20 documents

Cette page indexe toute la documentation du projet VersyFlow. Chaque document est autonome et peut être lu indépendamment.

## Production v1 Docs (Core)

| # | Document | Agent | Résumé |
|---|----------|-------|--------|
| 01 | [01-vision-produit.md](./01-vision-produit.md) | A | Vision, personas, différenciation vs YouVersion, métriques succès MVP |
| 02 | [02-principes-produit.md](./02-principes-produit.md) | B | 10 principes architecturaux + 3 principes produit + contraintes techniques |
| 03 | [03-prd.md](./03-prd.md) | B | PRD complet: 4 problèmes, 4 cas d'usage, 6 user stories, 8 NF, MoSCoW |
| 04 | [04-user-flows.md](./04-user-flows.md) | C | 7 user flows avec diagrammes ASCII et cas d'erreur |
| 05 | [05-features.md](./05-features.md) | B | 7 features MVP détaillées, 4 V1, 4 futur avec sous-fonctionnalités |
| 06 | [06-design-system.md](./06-design-system.md) | D | Direction artistique, 9 composants UI, 6 micro-interactions, accessibilité WCAG |
| 07 | [07-design-tokens.md](./07-design-tokens.md) | D | Couleurs rose, typo, espacement, radius, shadows, animations, dark mode |
| 08 | [08-ui-screens.md](./08-ui-screens.md) | D | 11 écrans avec structures hiérarchiques, états, transitions |
| 09 | [09-architecture.md](./09-architecture.md) | E | 4 couches Clean Architecture, adapter pattern, offline-first, Rust integration |
| 10 | [10-data-model.md](./10-data-model.md) | E | 7 entités TypeScript, relations, schéma MMKV, format JSON bible |
| 11 | [11-bible-domain.md](./11-bible-domain.md) | F | 66 livres, parser référence, translation registry, agnosticisme linguistique |
| 12 | [12-internationalization.md](./12-internationalization.md) | G | 5 langues, structure fichiers, hook useI18n, RTL, fallback chain |
| 13 | [13-fsrs-domain.md](./13-fsrs-domain.md) | H | Formules mathématiques, IFsrsEngine interface, WASM bridge, fallback SM-2 |
| 14 | [14-folder-structure.md](./14-folder-structure.md) | I | Arborescence complète + règles directionnelles + conventions nommage |
| 15 | [15-implementation-plan.md](./15-implementation-plan.md) | I | 5 phases, ~87 jours, dépendances critiques pour 1 dev senior |
| 16 | [16-ai-dev-guide.md](./16-ai-dev-guide.md) | I | Règles IA, template prompt, anti-patterns, checklist validation |
| 17 | [17-workflows-systeme.md](./17-workflows-systeme.md) | I | 10 workflows système: doc gen, consistency check, Rust integration, CI/CD... |

## Production v2 Docs (Audit P0)

| # | Document | Résumé |
|---|----------|--------|
| 18 | [18-test-strategy.md](./18-test-strategy.md) | Stratégie testing complète: unit tests par domaine, mocking strategy, E2E Detox scenarios, Rust tests, coverage minimums, CI gates |
| 19 | [19-domain-events.md](./19-domain-events.md) | 16 domain events catalogués avec déclencheurs, payload, conséquences: Bible, Memorization, Review, Progression, Settings, Error events |
| 20 | [20-domain-use-cases.md](./20-domain-use-cases.md) | 6 domain use cases formels avec préconditions, postconditions, règles métier, séquences détaillées, erreurs: Memorize, Review, ResolveReference, ChangeLanguage, CalculateStreak, PredictInterval |

---

## Matrice de Cohérence

### Dépendances entre documents

```
01-vision-produit.md ──┐
                        ├──→ 03-prd.md (inhère vision + principes)
                        │
02-principes-produit.md ─┘
                        ├──→ 09-architecture.md (applique principes)
                        ├──→ 16-ai-dev-guide.md (anti-dérive basée sur principes)

03-prd.md ──┬──→ 05-features.md (détaille PRD en features)
            ├──→ 04-user-flows.md (flows pour user stories)
            └──→ 15-implementation-plan.md (plan basé sur scope PRD)

04-user-flows.md ──→ 08-ui-screens.md (écrans pour chaque flow)
05-features.md ──→ 08-ui-screens.md (écrans listés par feature)

06-design-system.md ──→ 07-design-tokens.md (tokens for system components)
06-design-system.md ──→ 08-ui-screens.md (screens use design system components)

09-architecture.md ──→ 10-data-model.md (data model fits architecture layers)
09-architecture.md ──→ 11-bible-domain.md (bible domain spec)
09-architecture.md ──→ 13-fsrs-domain.md (FSRS domain spec)

11-bible-domain.md ──→ 10-data-model.md (entities match data model)
13-fsrs-domain.md ──→ 10-data-model.md (FsrsState embedded in MemorizationRecord)

12-internationalization.md ──→ 07-design-tokens.md (RTL affects layout tokens)

14-folder-structure.md ──→ 09-architecture.md (folder mirrors architecture)

18-test-strategy.md ──→ ALL domain docs (tests defined per domain)

19-domain-events.md ──→ 09-architecture.md (events in domain layer)
20-domain-use-cases.md ──→ 05-features.md (use cases implement features)
```

### Cohérences Vérifiées

- [x] Le MVP scope est identique dans 03-prd.md, 05-features.md, 15-implementation-plan.md
- [x] Les entités data model (10) correspondent aux domaines Bible (11) et FSRS (13)
- [x] Les composants UI screens (08) utilisent uniquement les composants du design system (06)
- [x] Les features (05) couvrent toutes les user stories du PRD (03)
- [x] Les screens (08) couvrent tous les flows du user flows (04)
- [x] Le folder structure (14) respecte la séparation des couches (09)
- [x] Les principes PA-1 à PA-10 sont enforceés dans l'AI dev guide (16)
- [x] L'i18n (12) supporte le RTL mentionné dans les principles (02)
- [x] Les tests (18) couvrent tous les domaines listés dans architecture (09)
- [x] Les domain events (19) correspondent aux triggers des use cases (20)
- [x] Le workflow system (17) intègre les checks du AI dev guide (16)

---

## Guide de Lecture

### Pour un nouvel agent IA de développement

1. Commencer par **02-principes-produit.md** — constraints non négociables
2. Lire **09-architecture.md** — structure du codebase
3. Lire **14-folder-structure.md** — où créer ses fichiers
4. Lire **16-ai-dev-guide.md** — comment proposer des modifications
5. Consulter **05-features.md** pour comprendre quelle feature implémenter
6. Consulter **20-domain-use-cases.md** pour les règles métier spécifiques
7. Consulter **18-test-strategy.md** pour savoir quels tests écrire

### Pour un audit d'architecture

1. **02-principes-produit.md** — comparer code vs principes
2. **16-ai-dev-guide.md** — section anti-patterns
3. **17-workflows-systeme.md** — section anti-dérive
4. **19-domain-events.md** — vérifier que les events sont bien émis

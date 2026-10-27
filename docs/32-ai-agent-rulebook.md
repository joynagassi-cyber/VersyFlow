# VersyFlow — AI Agent Governance Rulebook

> Règles strictes pour le fonctionnement des agents IA
> Application: docs/08-execution/AGENT_ASSIGNMENTS.md, docs/16-ai-dev-guide.md

---

## 1. Les 6 Agents et Leurs Règles

### Forge (Infrastructure & Build)

**Responsabilités:**
- Initialiser le projet Expo + TS
- Configurer ESLint/Prettier/Husky
- Compiler Rust WASM
- CI/CD pipeline
- Builds production

**Fichiers autorisés:**
- package.json, tsconfig.json, .eslintrc.js, .prettierrc
- app.json, babel.config.js, metro.config.js
- .github/workflows/ci.yml
- rust/Cargo.toml, rust/src/**
- src/tokens/index.ts
- src/components/ui/ButtonPrimary.tsx, ButtonSecondary.tsx, Text.tsx

**Fichiers interdits:**
- app/** (ecrans)
- src/domains/**
- src/services/**
- src/store/**
- src/hooks/**
- src/i18n/**
- data/bible/*.json
- docs/** (sauf 08-execution/)
- tests/**

**Limits:**
- Ne peut pas créer d'ecrans
- Ne peut pas modifier les domaines métier
- Ne peut pas ajouter de nouvelles dependances npm sans validation

**Definition of Done:**
- [ ] Build passe sans erreur
- [ ] Tests passent
- [ ] Lint passe

---

### Anvil (Domaines & Data & Tests)

**Responsabilités:**
- Domaines (Bible, FSRS, Memorization)
- Services (BibleService, SettingsService, etc.)
- Stores Zustand
- Infrastructure storage
- Tests unitaires/integration/e2e
- Utils et Types

**Fichiers autorisés:**
- src/domains/**
- src/services/**
- src/store/**
- src/infrastructure/storage/**
- src/types/**
- src/utils/**
- tests/**
- src/infrastructure/logging/**

**Fichiers interdits:**
- app/** (ecrans)
- src/components/**
- src/hooks/**
- src/i18n/locales/*.json
- data/bible/*.json (lecture seule)
- rust/** (lecture seule)
- docs/**

**Limits:**
- Ne peut pas creer d'ecrans
- Ne peut pas modifier les composants UI
- Ne peut pas ecrire dans les fichiers de traduction

**Definition of Done:**
- [ ] TypeScript compile
- [ ] ESLint passe
- [ ] Tests passent
- [ ] Couverture ≥ seuil minimum

---

### Herald (UI & Navigation)

**Responsabilités:**
- Tous les ecrans Expo Router
- Composants UI (après les 3 premiers de Forge)
- Hooks custom
- Animations/micro-interactions

**Fichiers autorisés:**
- app/**
- src/components/** (apres primitives initiales)
- src/hooks/**

**Fichiers interdits:**
- src/domains/** (lecture seule)
- src/services/** (lecture seule, utilisation uniquement)
- src/store/** (lecture seule)
- src/infrastructure/**
- data/bible/*.json
- rust/**
- docs/**
- tests/** (sait comment tester, ne WRITE pas)

**Limits:**
- Ne peut pas modifier la logique metier
- Ne peut pas importer depuis src/domains/
- Ne peut pas appeler directement le storage

**Definition of Done:**
- [ ] Navigation fonctionne
- [ ] Textes traduits via t()
- [ ] Accessibilite verifyee
- [ ] Animations selon design tokens

---

### Scribe (Bible Data & FSRS Service Orchestrator)

**Responsabilités:**
- data/bible/lsg.json (fichier COMPLET LSG)
- src/services/fsrs-service.ts
- src/services/progress-service.ts
- src/infrastructure/rust/** (wasm-loader.ts)

**Fichiers autorisés:**
- data/bible/lsg.json
- src/services/fsrs-service.ts
- src/services/progress-service.ts
- src/infrastructure/rust/wasm-loader.ts
- src/infrastructure/rust/fsrs-wasm-bindings.ts

**Fichiers interdits:**
- app/**
- src/components/**
- src/domains/** (ne MODIFIE pas engine.ts ni entities.ts)
- src/store/** (ne MODIFIE pas)
- src/i18n/locales/*.json
- rust/** (lecture seule, Forge compile le WASM)
- data/bible/kjv.json (pas au MVP)
- docs/**

**Limits:**
- Ne peut pas modifier les interfaces IFsrsEngine
- Ne peut pas changer les types de donnees domain

**Definition of Done:**
- [ ] LSG.json valide par Zod
- [ ] FsrsService orchestre correctement
- [ ] ProgressService calcule stats correctement

---

### Translator (Internationalisation)

**Responsabilités:**
- Fichiers de traduction (.json)
- Structure i18n (config, directions)
- Service I18n

**Fichiers autorisés:**
- src/i18n/locales/fr.json
- src/i18n/locales/en.json
- src/i18n/locales/ar.json
- src/i18n/locales/de.json
- src/i18n/locales/zh.json
- src/i18n/config.ts
- src/i18n/directions.ts
- src/i18n/i18n-service.ts

**Fichiers interdits:**
- app/** (ne MODIFIE pas les ecrans)
- src/components/**
- src/domains/**
- src/services/**
- src/store/**
- src/infrastructure/**
- data/**
- rust/**
- docs/**

**Limits:**
- Ne peut pas modifier la structure des clefs de traduction
- Doit maintenir l'alignement entre tous les fichiers de locale

**Definition of Done:**
- [ ] Toutes les clés presentes dans les 5 fichiers
- [ ] Fallback chain fonctionne
- [ ] RTL detection correcte pour arabe

---

### Guardian (Quality Auditor & Domain Events)

**Responsabilités:**
- Event bus (src/domains/index.ts)
- DomainEventTypes enum
- Audits qualite
- Governance docs (docs/08-execution/)

**Fichiers autorisés:**
- src/domains/index.ts (eventBus singleton + DomainEventTypes enum)
- docs/08-execution/** (modifie UNIQUEMENT ce dossier)

**Fichiers interdits:**
- app/** (lecture seule pour audit)
- src/components/** (lecture seule)
- src/services/** (lecture seule)
- src/store/** (lecture seule)
- src/infrastructure/**
- data/**
- rust/**
- src/i18n/locales/*.json
- docs/ (sauf 08-execution/)

**Limits:**
- Ne peut PAS modifier le code des autres agents
- Ne peut QUE lire, auditor, et produire des rapports
- Sauf event bus et domaine events qui sont sa responsabilite directe

**Definition of Done:**
- [ ] Audit complet rapporte dans docs/08-execution/
- [ ] Tous les DomainEvents emis correctement
- [ ] Zero violation architecture detectee

---

## 2. Regles de Communication Inter-Agents

### Finish Notification
Quand un agent termine une tache:
```
[Forge] Tâche terminée: Build WASM module — fichiers: rust/pkg/*.wasm
```

### Block Notification
Quand un agent est bloque:
```
[Herald] BLOQUÉ sur MemorizationSessionScreen — besoin d'Anvil pour expose r MemorizationRecord type
```

### Audit Finding
Guardian signale une violation:
```
[Guardian] Trouvé: Logique metier dans VerseCard.tsx — requis par PA-1 (02-principes-produit.md)
```

### Translation Sync
Translator informe Herald des nouvelles clés:
```
[Translator] Nouvelles clés ajoutées: review.summary, review.easy — Herald mettre à jour t() calls
```

---

## 3. Politique de Résolution de Conflits

### Conflict Resolution Hierarchy
1. **Consult docs/08-execution/MODULE_OWNERSHIP.md** — Verifier l'owner du fichier
2. **Demande au propriétaire** — Si besoin modification, demander explicitement
3. **Escalade à Guardian** — Si conflit persistant
4. **Decision finale** — CEO (humain si disponible, sinon consensus entre agents)

### Merge Policy
- Un merge est AUTORISE si:
  - CI passe (typecheck + lint + tests)
  - Code review passe (Guardian approuve)
  - Aucun fichier dual-owner modifie

- Un merge est INTERDIT si:
  - CI echoue
  - Code review non approuve
  - Fichier modifie par un autre agent

---

*Cette rulebook est immuable. Elle complement les documents d'exécution dans docs/08-execution/*.

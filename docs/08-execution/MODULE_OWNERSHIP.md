# VersyFlow — Matrice de Propriété des Modules

> Chaque fichier appartient à UN SEUL agent. Aucun partage.

---

## Matrice Complète

| Dossier | Agent Propriétaire | Type d'accès autres agents |
|---------|-------------------|---------------------------|
| **Configuration Project** | | |
| package.json | Forge | Lecture seule |
| tsconfig.json | Forge | Lecture seule |
| .eslintrc.js | Forge | Lecture seule |
| .prettierrc | Forge | Lecture seule |
| app.json | Forge | Lecture seule |
| babel.config.js | Forge | Lecture seule |
| metro.config.js | Forge | Lecture seule |
| .github/** | Forge | Lecture seule |
| Husky/config | Forge | Lecture seule |
| **Tokens & Primitives** | | |
| src/tokens/index.ts | Forge | Herald lit pour styles |
| src/components/ui/ButtonPrimary.tsx | Forge | Herald complète après |
| src/components/ui/ButtonSecondary.tsx | Forge | Herald complète après |
| src/components/ui/Text.tsx | Forge | Herald complète après |
| **Domain Layer** | | |
| src/domains/bible/entities.ts | Anvil | — |
| src/domains/bible/parser.ts | Anvil | — |
| src/domains/bible/translator.ts | Anvil | — |
| src/domains/bible/repository.ts | Anvil | — |
| src/domains/bible/index.ts | Anvil | — |
| src/domains/fsrs/entities.ts | Anvil | — |
| src/domains/fsrs/engine.ts | Anvil | — |
| src/domains/fsrs/fallback-engine.ts | Anvil | — |
| src/domains/fsrs/calculator.ts | Anvil | — |
| src/domains/fsrs/index.ts | Anvil | — |
| src/domains/memorization/entities.ts | Anvil | — |
| src/domains/memorization/session.ts | Anvil | — |
| src/domains/memorization/validator.ts | Anvil | — |
| src/domains/memorization/index.ts | Anvil | — |
| src/domains/i18n/config.ts | Translator | — |
| src/domains/i18n/directions.ts | Translator | — |
| src/domains/i18n/i18n-service.ts | Translator | — |
| src/domains/index.ts (eventBus) | Guardian | — |
| **Services** | | |
| src/services/bible-service.ts | Anvil | — |
| src/services/fsrs-service.ts | Scribe | — |
| src/services/settings-service.ts | Anvil | — |
| src/services/progress-service.ts | Scribe | — |
| src/services/index.ts | Anvil | — |
| **Store (Zustand)** | | |
| src/store/settings-store.ts | Anvil | — |
| src/store/bible-store.ts | Anvil | — |
| src/store/memorization-store.ts | Anvil | — |
| src/store/review-store.ts | Anvil | — |
| src/store/index.ts | Anvil | — |
| **Hooks** | | |
| src/hooks/useI18n.ts | Herald | — |
| src/hooks/useTheme.ts | Herald | — |
| src/hooks/useSettings.ts | Herald | — |
| src/hooks/useBibleNavigation.ts | Herald | — |
| src/hooks/useMemorizationSession.ts | Herald | — |
| src/hooks/useReviewQueue.ts | Herald | — |
| **Components UI** | | |
| src/components/ui/** (compléments) | Herald | — |
| src/components/common/** | Herald | — |
| src/components/bible/** | Herald | — |
| **Infrastructure** | | |
| src/infrastructure/storage/** | Anvil | — |
| src/infrastructure/rust/wasm-loader.ts | Scribe | Forge met le .wasm à disposition |
| src/infrastructure/rust/fsrs-wasm-bindings.ts | Scribe | — |
| src/infrastructure/logging/logger.ts | Anvil | — |
| **Utils** | | |
| src/utils/** | Anvil | — |
| **Types** | | |
| src/types/globals.d.ts | Anvil | — |
| src/types/navigation.d.ts | Anvil | — |
| **i18n Locales** | | |
| src/i18n/locales/fr.json | Translator | Herald vérifie coverage |
| src/i18n/locales/en.json | Translator | Herald vérifie coverage |
| src/i18n/locales/ar.json | Translator | Herald vérifie coverage |
| src/i18n/locales/de.json | Translator | Herald vérifie coverage |
| src/i18n/locales/zh.json | Translator | Herald vérifie coverage |
| **Data** | | |
| data/bible/lsg.json | Scribe | Anvil valide avec Zod |
| **App (Screens)** | | |
| Tous les fichiers sous app/** | Herald | — |
| **Tests** | | |
| tests/unit/** | Anvil | Guardian audit coverage |
| tests/integration/** | Anvil | Guardian audit coverage |
| tests/e2e/** | Anvil | Guardian audit coverage |
| tests/mocks/** | Anvil | — |
| **Rust** | | |
| rust/Cargo.toml + rust/src/** | Forge | Anvil lit interface |
| rust/pkg/*.wasm | Forge (sortie) | — |
| **Docs** | | |
| docs/01-*/ à docs/20-* | N/A (specs figées) | Lecture seule pour TOUS |
| docs/08-execution/** | Guardian | Tous (lecture seule) |

---

## Règles de Propriété

1. **Un fichier = un seul propriétaire**. Jamais deux agents écrivent dans le même fichier.
2. **Lecture libre**: Tous les agents peuvent LIRE n'importe quel fichier pour comprendre le contexte.
3. **Écriture exclusive**: Seul le propriétaire MODIFIE son dossier.
4. **Si un agent a besoin qu'un autre modifie un fichier**: il demande explicitement au propriétaire.
5. **Les specs (docs/01-* à docs/20-*) sont figées**: Personne ne les modifie. Si une contradiction est trouvée, le Guardian produit un rapport dans docs/08-execution/CONFLICT_REPORT.md.

---

*Cette matrice est immuable durant tout le développement.*

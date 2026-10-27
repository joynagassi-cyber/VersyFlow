# VersyFlow — Workflows Système

> Ce document définit les processus industriels de développement qui orchestrent les agents IA, la validation de cohérence, et l'exécution des étapes critiques du projet VersyFlow.

---

## 1. Workflow: Génération de Documents par Agents

### Objectif
Générer un document de documentation de manière structurée, en assignant le bon agent au bon document, avec validation de cohérence.

### Processus

```
[Demande de doc]
    ↓
[Identifier l'agent responsable (cf. matrice section 7)]
    ↓
[Envoyer brief avec contrainte de structure à l'agent]
    ↓
[L'agent produit le markdown brut]
    ↓
[Validation format: le doc suit-il la structure définie?]
    ├─ NON → [Retour à l'agent avec feedback précis]
    └─ OUI → [Accepté]
    ↓
[Check cohérence croisée avec docs existants]
    ├─ Conflit détecté → [Signaler + proposer résolution]
    └─ Pas de conflit → [Document validé]
```

### Matrice Agent → Document

| Document | Agent | Validation croisée |
|----------|-------|-------------------|
| Vision produit | Agent A | Auto |
| Principes produit | Agent B | Agent A cross-check |
| PRD | Agent B | Agent A cross-check |
| User flows | Agent C | Agent B cross-check |
| Features | Agent B | Agent C cross-check |
| Design system | Agent D | Agent D auto-review |
| Design tokens | Agent D | Agent D auto-review |
| UI screens | Agent D | Agent C cross-check |
| Architecture | Agent E | Agent E peer-review |
| Data model | Agent E | Agent E peer-review |
| Bible domain | Agent F | Agent F auto |
| i18n | Agent G | Agent G auto |
| FSRS domain | Agent H | Agent H auto |
| Folder structure | Agent I | Agent E cross-check |
| Implementation plan | Agent I | Agent E cross-check |
| AI dev guide | Agent I | Agent I self-validate |
| Workflows système | Agent I | Tous agents cross-check |

---

## 2. Workflow: Validation de Cohérence entre Documents

### Objectif
Assurer qu'aucune contradiction n'existe entre les documents produits.

### Vérifications Automatisées

**Check 1: Terminologie cohérente**
- Le terme "FSRS" apparaît de manière identique dans tous les docs
- Les noms d'entités (MemorizationRecord, FsrsState) identiques partout
- Les acronymes définis une seule fois puis utilisés uniformément

**Check 2: Scope cohérent**
- Les features listées dans 05-features.md correspondent aux user stories du 03-prd.md
- Les écrans du 08-ui-screens.md couvrent tous les user flows du 04-user-flows.md
- Le scope MVP des docs 03, 05, 15 sont alignés

**Check 3: Architecture vs Domaines**
- Les entités définies dans 10-data-model.md correspondent aux domaines de 11 et 13
- L'architecture de 09-architecture supporte les contraintes de 02-principes

### Processus de Validation

```
[Scanner tous les docs]
    ↓
[Extraire glossaire centralisé]
    ↓
[Vérifier présence/incohérence terme par terme]
    ↓
[Extraire scope MVP de chaque doc]
    ↓
[Cross-check scopes entre docs]
    ↓
[Vérifier couverture screens ↔ flows ↔ features]
    ↓
[Générer rapport d'incohérences]
    ↓
{Incohérences trouvées?}
    ├─ OUI → [Corriger + rescan]
    └─ NON → [Pipeline continue]
```

---

## 3. Workflow: Création des Écrans UI à Partir du Design System

### Objectif
Générer les écrans React Native à partir des specs Design System + UI Screens.

### Processus

```
[Prendre un écran du 08-ui-screens.md]
    ↓
[Identifier les composants requis (du 06-design-system.md)]
    ↓
[Vérifier que tous les composants existent dans src/components/]
    ├─ Existant → [Réutiliser]
    └─ Nouveau → [Créer d'abord le composant, puis l'écran]
    ↓
[Appliquer les tokens du 07-design-tokens.md]
    ↓
[Implémenter l'écran avec structure hiérarchique respectée]
    ↓
[Assurer i18n sur tous les textes]
    ↓
[Ajouter state management hook dédié]
    ↓
[Intégrer dans Expo Router]
    ↓
[Validator: aucun hardcoded, respect architecture, tests]
```

### Template de génération d'écran

```typescript
// NO lógica de negocio aquí — solo presentación
// La lógica va en el hook personalizado

import { useMemoizationSession } from '@/hooks/useMemorizationSession';
import { ButtonPrimary } from '@/components/ui/ButtonPrimary';
import { CardVerse } from '@/components/common/CardVerse';

export function MemorizationSessionScreen() {
  const { state, actions } = useMemoorizationSession();
  
  // View ONLY — no business logic
  return (
    <SafeAreaView>
      <CardVerse reference={state.verse.reference} text={state.verse.text} />
      <ButtonPrimary
        title={t('session.memorize')}
        onPress={actions.onMemorize}
      />
    </SafeAreaView>
  );
}
```

---

## 4. Workflow: Intégration FSRS (Rust → App)

### Objectif
Intégrer le moteur FSRS écrit en Rust dans l'application React Native.

### Processus

```
[Phase 1: Setup Rust]
    ↓
cargo init --lib rust/
ajouter fsrs = "3.x" dans Cargo.toml
    ↓
[Phase 2: Exposer en WASM]
    ↓
Écrire les fonctions #[wasm_bindgen] dans rust/src/lib.rs
Configurer wasm-pack ou napi-rs pour compilation
Compiler: wasm-pack build --target web
    ↓
[Phase 3: Bridge TypeScript]
    ↓
Créer IFsrsEngine interface dans src/domains/fsrs/engine.ts
Implémenter WasmFsrsEngine qui appelle le .wasm
Implémenter FallbackEngine (SM-2 JS) comme fallback
    ↓
[Phase 4: Intégration app]
    ↓
Créer FsrsService qui utilise IFsrsEngine (inversion de dépendance)
Connecter FsrsService aux MemorizationRecord et ReviewLog
Tester: charger WASM → appeler newState() → vérifier résultat
    ↓
[Phase 5: Graceful degradation]
    ↓
Si WASM échoue: catcher error → switcher fallback SM-2
Logger l'événement pour debugging
Afficher telemetry metrics
```

### Points de vigilance
- WASM loading est ASYNCHRONE → pas bloquer le render
- Fallback DOIT être testé en parallèle pendant dev
- Les poids FSRS doivent être optimisés avec des données réelles (post-MVP)
- Ne JAMAIS exposer les détails d'implémentation Rust dans le code TS

---

## 5. Workflow: Ajout de Nouvelles Langues (i18n)

### Objectif
Ajouter une nouvelle langue à l'interface sans impact zero sur le code existant.

### Processus

```
[Étape 1: Créer le fichier de locale]
    ↓
Copier src/i18n/locales/en.json → src/i18n/locales/{code}.json
Traduire TOUS les valeurs (ne pas laisser vide — fallback géré)
    ↓
[Étape 2: Enregistrer la langue]
    ↓
Ajouter dans la liste SUPPORTED_LANGUAGES dans config.ts
Si RTL: marquer rtl: true dans la config de la langue
    ↓
[Étape 3: Vérifier RTL/LTR]
    ↓
Tester l'affichage en langue cible
Si RTL: vérifier que tous les composants mirror-correctly
    ↓
[Étape 4: Valider]
    ↓
Tous les textos de l'API ont une traduction?
Pas de texte hardcodé manqué?
Direction du texte correcte?
```

### Règles
- Jamais de texte hardcodé dans le code
- Toujours utiliser `t('key.path')`
- Clés de traduction: hiérarchiques (`screen.feature.action`)
- Fallback: EN → FR → clé elle-même

---

## 6. Workflow: Ajout de Nouvelles Traductions Bibliques

### Objectif
Ajouter une nouvelle traduction biblique (ex: KJV, NIV) sans modifier le code existant.

### Processus

```
[Étape 1: Obtenir/Créer le fichier JSON de traduction]
    ↓
Structure: { id, name, year, language, books: [...] }
Chaque livre: { id, name: { fr: "...", en: "..." }, chapters: [{ number, verses: [{ number, text }] }] }
    ↓
[Étape 2: Placer dans data/bible/]
    ↓
data/bible/kjv.json
    ↓
[Étape 3: Register la traduction]
    ↓
AUCUN CODE À MODIFIER! Le registry de BibleDomain scanne data/bible/*.json
La traduction apparaît automatiquement dans TranslationPickerScreen
    ↓
[Étape 4: Valider]
    ↓
66 livres présents?
Tous les chapitres et versets présents?
Noms de livres localisés?
```

### Points de vigilance
- Le format JSON est STANDARDISÉ (cf docs/11-bible-domain.md)
- Le registry scanne les fichiers à runtime — zero code change
- Validation du schéma JSON au load (schéma JSON Schema ou zod)
- LSG reste la traduction par défaut (par ordre alphabétique d'id)

---

## 7. Workflow: Structuration du Projet Expo

### Objectif
Maintenir la structure de projet propre et cohérente durant tout le développement.

### Règles d'ajout de fichier

| Type de fichier | Où le créer |
|-----------------|-------------|
| Écran (route) | `app/[feature]/[name].tsx` |
| Composant UI pur | `src/components/[category]/[Name].tsx` |
| Hook React | `src/hooks/use[Name].ts` |
| Service métier | `src/services/[name]-service.ts` |
| Entité domaine | `src/domains/[domain]/entities.ts` |
| Interface domaine | `src/domains/[domain]/repository.ts` |
| Infrastructure | `src/infrastructure/[type]/[name].ts` |
| Utility pure | `src/utils/[name]-utils.ts` |
| Fichier données | `data/[type]/[name].json` |
| Code Rust | `rust/src/[name].rs` |

### Règles d'import
```
✅ CORRECT: components ← hooks ← services ← domains
❌ FAUX: domains importent depuis services
❌ FAUX: components importent depuis services ou domains
❌ FAUX: infrastructure importe depuis n'importe quoi
```

---

## 8. Workflow: Développement Assisté par IA (AI Dev Loop)

### Objectif
Maximiser l'efficacité du développement avec des agents IA tout en maintenant la qualité.

### Loop type

```
[Développeur: "Ajoute un écran de statistiques avancées"]
    ↓
[Agent IA: Lit 05-features.md, 06-design-system.md, 08-ui-screens.md, 09-architecture.md]
    ↓
[Agent IA: Propose architecture de la feature]
    ↓
[Développeur: "Go — mais ajoute d'abord les tests"]
    ↓
[Agent IA: Génère tests unitaires en premier (TDD)]
    ↓
[Agent IA: Génère le code d'implémentation]
    ↓
[Agent IA: Run lint + typecheck + tests]
    ↓
{Tout passe?}
    ├─ OUI → [Commit + PR]
    └─ NON → [Fix erreurs → retry → Boucle jusqu'à vert]
```

### Règles d'interaction IA
1. Toujours commencer par les tests (TDD)
2. Toujours lire le code existant avant de modifier
3. Toujours proposer une modification à la fois
4. Toujours valider avant de commit
5. Si l'agent échoue 3 fois de suite → escalader à un humain

---

## 9. Workflow: Review et Anti-Dérive Architecture

### Objectif
Empêcher la dérive architecturale au fil du temps.

### Mécanisme hebdomadaire

```
[Chaque dimanche à 18h → trigger architecture audit]
    ↓
[Agent IA scanne TOUS les fichiers src/ et app/]
    ↓
[Check list automatique:]
    ├─ Logique métier dans composants?
    ├─ Hardcoded strings?
    ├─ Traductions codées en dur?
    ├─ Imports violant la directionnalité?
    ├─ Fichiers sans tests associés?
    └─ Components sans i18n?
    ↓
[Générer rapport d'audit]
    ↓
{Violations critiques trouvées?}
    ├─ OUI → [Créer tickets de correction prioritaires]
    └─ NON → [Archiver rapport "clean"]
```

### Mécanisme PR

```
[PR ouverte]
    ↓
[Check automatique CI:]
    ├─ TypeScript compile?
    ├─ ESLint passe?
    ├─ Tests passent?
    ├─ Structure respectée?
    └─ Pas d'anti-pattern?
    ↓
{Check passes?}
    ├─ OUI → [Approval requise: 1 humain OU 1 agent IA senior]
    └─ NON → [Feedback automatique avec détails]
```

### Template de PR

```
## Type de modification
- [ ] Nouvelle feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Style (formatage, pas de changement logique)
- [ ] Test (ajout/modification)

## Documents impactés
- [ ] 02-principes-produit.md
- [ ] 03-prd.md
- [ ] 06-design-system.md
- [ ] 09-architecture.md
- [ ] Autre: ___

## Checklist architecturale
- [ ] Aucun code métier dans les composants UI
- [ ] Nouvelles entités ajoutées dans src/domains/
- [ ] Nouvelles interfaces définies comme ports (préfixe I)
- [ ] i18n sur tous les textes visibles
- [ ] Pas de traductions bibliques codées en dur
- [ ] Respect de la directionnalité des imports
```

---

## 10. Workflows Opérationnels

### Workflow de Build

```
npm run build
    ↓
[Expo prebuild → génere dossiers ios/ android/]
    ↓
[TypeScript compile]
    ↓
[Assets bundled]
    ↓
[WASM module copied to assets/]
    ↓
{Build réussi?}
    ├─ OUI → artefacts prêts dans dist/
    └─ NON → error log détaillé
```

### Workflow de Test

```
npm run test:unit
    ↓
[Run Jest sur src/ et tests/unit/]
    ↓
[Coverage report généré]
    ↓
{Couverture > 80%?}
    ├─ OUI → test:unit passé
    └─ NON → échec avec zones à couvrir

npm run test:e2e
    ↓
[Run Detox sur émulateurs]
    ↓
[Test: onboarding → Bible nav → memorization → review]
    ↓
{Tous passes?}
    ├─ OUI → test:e2e passé
    └─ NON → rapports visuels + logs
```

### Workflow de Deployment

```
[Push sur main]
    ↓
[GitHub Actions trigger: CI + build]
    ↓
[Build APK + IPA]
    ↓
[Upload TestFlight (iOS) + Internal Testing (Android)]
    ↓
[Notification équipe]
    ↓
{Testés OK?}
    ├─ OUI → [Promote to Production]
    └─ NON → [Rollback + bug fix loop]
```

---

*Document approuvé. Tous les 17 documents sont complétés.*

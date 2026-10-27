# VersyFlow — Guide de Développement Assisté par IA

## Document généré par Agent I — Delivery / DevEx

---

## 1. Philosophie de Développement

VersyFlow utilise l'IA comme partenaire de développement systématique. Ce guide définit comment les agents IA doivent interagir avec le codebase pour maintenir qualité et cohérence.

---

## 2. Règles d'Or pour les Agents IA

### R-AI-1: Toujours lire AVANT d'écrire
Tout agent IA DOIT lire les fichiers existants pertinents AVANT de proposer une modification. Ne jamais modifier du code que vous n'avez pas lu.

### R-AI-2: Respecter la séparation des couches
- **Composants UI**: ZÉRO logique métier
- **Hooks**: ZÉRO logique métier (rediriger vers services)
- **Services**: orchestrent les domaines
- **Domaines**: logique métier pure, aucun code React

### R-AI-3: Suivre les conventions de nommage
| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants | PascalCase | `MemorizationSessionScreen` |
| Hooks | camelCase + `use` préfixe | `useMemorizationSession` |
| Services | camelCase + `Service` suffixe | `FsrsService` |
| Entités domaine | PascalCase | `MemorizationRecord` |
| Interfaces | préfixe `I` | `IFsrsEngine` |
| Constantes | UPPER_SNAKE_CASE | `DEFAULT_RETENTION` |
| Variables/functions | camelCase | `calculateInterval` |
| Types | PascalCase | `FsrsState`, `Rating` |

### R-AI-4: Toujours commenter le POURQUOI, pas le QUOI
Les commentaires expliquent le pourquoi d'une décision, jamais ce que fait le code (le code se suffit).

### R-AI-5: Proposer des modifications incrémentales
Une PR = une responsabilité. Ne pas modifier 3 fichiers dans 3 couches différentes dans la même PR.

---

## 3. Template de Prompt pour les Agents IA

Quand un agent IA intervient sur le code VersyFlow, il DOIT utiliser ce template:

```
## Contexte
[Fichier(s) concerné(s), couche architecturale]

## Modification demandée
[Décrire la modification en terme de comportement, jamais d'implémentation]

## Vérifications préliminaires
- [ ] J'ai lu le(s) fichier(s) concerné(s)
- [ ] Je respecte la séparation des couches
- [ ] Je n'ajoute PAS de logique métier dans les composants UI
- [ ] Je respecte les conventions de nommage
- [ ] Je ne modifie PAS les fichiers du domaine sans justifier

## Proposition
[Code avec commentaires de POURQUOI]

## Tests associés
[Quels tests doivent être ajoutés/modifiés]
```

---

## 4. Anti-Dérive Architecturale

### Mécanismes de garde

| Mécanisme | Comment | Qui exécute |
|-----------|---------|-------------|
| ESLint rules | Configuré pour interdire import de domaine dans components/ | CI automatique |
| Dependency graph check | Script Node vérifie que les imports respectent les règles | Pre-commit hook |
| Code review checklist | Checklist architecturale dans PR template | Humain |
| Weekly architecture audit | Script automatique scanne les violations | Agent IA semanal |

### Anti-patterns critiques à NE JAMAIS produire

```typescript
// ❌ INTERDIT: Logique métier dans composant
function VerseCard({ verse }) {
  const status = calculateStatus(verse.fsrsState); // DOMAIN LOGIC IN COMPONENT!
  return <View>{/* ... */}</View>;
}

// ❌ INTERDIT: Traduction codée en dur
const BIBLE_TEXT = "Au commencement Dieu créa les cieux et la terre.";

// ❌ INTERDIT: Appel direct au storage depuis un composant
const [data, setData] = useState(null);
useEffect(() => {
  AsyncStorage.getItem('versyflow:settings').then(setData);
}, []);

// ❌ INTERDIT: Import cyclique potentiel
// src/domains/bible/ importing from src/services/
```

---

## 5. Critères de Validation d'une Modification

Chaque modification de code DOIT passer cette checklist:

- [ ] TypeScript compile sans erreur ni warning
- [ ] ESLint passe vert
- [ ] Tests unitaires existants toujours verts
- [ ] Tests unitaires nouveaux ajoutés pour nouvelle logique
- [ ] Pas de logique métier dans composant UI
- [ ] Nommage conforme aux conventions
- [ ] Commentaires ajoutés pour décisions architecturales
- [ ] i18n: tous les textes visibles ont une clé de traduction
- [ ] Pas de hardcoded strings dans le code
- [ ] Pas de traduction biblique codée en dur
- [ ] Respect de la directionnalité des imports

---

## 6. Workflow de Développement Quotidien avec IA

### Cycle typique

```
1. Développeur décrit la feature/bug fix en langage naturel
        ↓
2. Agent IA lit le code existant pertinent
        ↓
3. Agent IA propose le code selon le template
        ↓
4. Développeur review et approuve
        ↓
5. Agent IA applique + ajoute tests
        ↓
6. Agent IA execute lint + typecheck + tests
        ↓
7. Agent IA génère le commit message conventionnel
        ↓
{Tout vert?}
    ├─ OUI → Push + PR
    └─ NON → Fix → Retry (max 3 fois) → Escalade humain
```

---

## 7. Commandes IA Utilitaires

### Prompt templates pour actions courantes

**"Refactor ce hook pour extraire la logique FSRS"**
> Analyser `[fichier-hook]`. Extraire toute logique qui appelle FsrsDomain ou calcule intervalles/stabilité/difficulté vers FsrsService. Le hook ne doit contenir QUE de la logique UI (state, event handlers, effect).

**"Add i18n key for [text]"**
> Ajouter une clé i18n pour "[texte visible]" dans toutes les locales de `src/i18n/locales/*.json`. Remplacer le texte hardcodé par `t('key.path')`. Fallback EN si pas de traduction.

**"Create component for [description]"**
> Créer un composant presentational React Native pour "[description]". Le composant ne doit contenir AUCUNE logique métier. Recevoir toutes les données en props. Utiliser les tokens de design.

---

*Document approuvé. Transmis à l'Agent I pour Workflows Système.*

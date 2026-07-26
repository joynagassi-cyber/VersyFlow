# VersyFlow — Architecture Rulebook

> Définit les règles d'architecture non négociables
> Document complémentaire à docs/09-architecture.md

---

## 1. Dépendances Autorisées

### Règle de Direction

```
app/ ←── src/components/
   ↑
src/hooks/ ←── src/services/
   ↑
src/domains/  ←── src/infrastructure/
   ↑
data/ static files
```

**Toutes dépendances doivent aller vers le haut (↑).**

### Matrice Complète

| De | Vers | Status | Raison |
|----|------|--------|--------|
| app/ | components/ | ✅ | Présentation uniquement |
| app/ | hooks/ | ✅ | UI glue logique |
| app/ | store/ | ✅ | State consumption only |
| hooks/ | services/ | ✅ | Orchestration layer |
| hooks/ | store/ | ✅ | Zustand consumption |
| hooks/ | domains/ | ❌ | Trop bas niveau |
| services/ | domains/ | ✅ | Business logic orchestration |
| services/ | infrastructure/ | ✅ | Adapter pattern |
| services/ | components/ | ❌ | Coupling architectural |
| services/ | apps/ | ❌ | Inversion de contrôle |
| domains/ | infrastructure/ | ✅ | Port/Adapter pattern |
| domains/ | components/ | ❌ | Pure domain logic |
| domains/ | app/ | ❌ | Domaines doivent être framework-agnostic |
| infrastructure/ | anything else | ❌ | Last layer, no dependencies |

---

## 2. Structure des Couches

### Couche UI (`app/`, `src/components/`)

**Responsabilités**: Rendu, navigation, events utilisateur
**Interdits**: Logique métier, accès storage direct, calculs FSRS

### Couche Application (`src/services/`, `src/store/`)

**Responsabilités**: Orchestration, state management, adaptation
**Interdits**: Logic métier directe, presentation details

### Couche Domaine (`src/domains/`)

**Responsabilités**: Entités pures, règles métier, interfaces de ports
**Interdits**: I/O, React, frameworks externes

### Couche Infrastructure (`src/infrastructure/`)

**Responsabilités**: Implémentations concrètes des ports, logging, WASM
**Interdits**: Logique métier, UI, navigation

---

## 3. Règles de Découpage

### Taille Max des Fichiers
- Domaines: ≤ 300 lignes
- Services: ≤ 200 lignes
- Components: ≤ 150 lignes
- Hooks: ≤ 100 lignes

### Regroupement Logique
Chaque feature doit avoir ses propres sous-dossiers:
```
src/domains/{domain}/
├── entities.ts       // Types purs
├── service.ts        // Interface/port
├── repository.ts     // Repository interface
└── index.ts          // Barrel exports
```

---

## 4. Injection de Dépendances

### Pattern Requis
```typescript
// ✅ CORRECT — Constructor injection
class MyService {
  constructor(
    private storage: IStorage,
    private engine: IFsrsEngine
  ) {}
}

// ❌ INCORRECT — Singleton direct
const storage = new MmkvStorage(); // Coupling concret
```

### Interface Obligatoire
Tout module consommateur doit utiliser une interface, jamais une implémentation concrète.

---

## 5. Anti-Patterns Interdits

| Anti-Pattern | Exemple | Pourquoi Interdit |
|--------------|---------|-------------------|
| Logic in Component | `calculateStatus()` dans JSX | Violaite PA-1 |
| Hardcoded Translation | "Au commencement..." | Violaite PA-2 |
| Direct Storage Access | `AsyncStorage.getItem()` | Violaite Coupling |
| Circular Dependency | A→B→C→A | Impossible à résoudre |
| God Object | Class > 500 lignes | Illisible, non testable |
| Mixed Concerns | Component with setState + fetch | Violation SRP |

---

## 6. Exceptions Autorisées

### Exception 1: Barrel Exports
Barrel exports peuvent ré-exporter des implementations concrètes pour simplifier les imports publics.

### Exception 2: Mocks in Tests
Les mocks peuvent violer les règles d'injection pour faciliter les tests.

### Exception 3: Static Mappings
Mapping statiques de couleurs ou de labels sont autorisés dans les composants.

---

*Cette règlebook est immuable. Toute modification nécessite une mise à jour de docs/02-principes-produit.md et docs/09-architecture.md.*

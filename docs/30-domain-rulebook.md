# VersyFlow — Domain Rulebook

> Règles strictes pour la couche domaine
> Application: docs/11-bible-domain.md, docs/13-fsrs-domain.md, docs/20-domain-use-cases.md

---

## 1. Qu'est-ce qu'un Domaine

Un domaine est un module encapsulé qui contient **uniquement de la logique métier pure**.

### Règle Fondamentale
**Un domaine ne fait JAMAIS d'I/O.** Pas de file system, pas de network, pas de storage, pas de UI.

---

## 2. Contenu Autorisé dans un Domaine

| Élément | Permission |
|---------|-----------|
| Entités TypeScript | ✅ Interfaces, types purs |
| Valeurs statiques constants | ✅ Enums, constantes |
| Fonctions pures | ✅ Pure functions sans side effects |
| Interfaces de ports | ✅ IFsrsEngine, IStorage |
| Validation de données | ✅ Schema validation |
| Calculs métier | ✅ FSRS calculations, Bible parsing |
| Domain Events | ✅ EventBus.emit() |

---

## 3. Contenu Interdit dans un Domaine

| Élément | Raison |
|---------|--------|
| Accès filesystem | I/O violation |
| Appels network | I/O violation |
| Appel AsyncStorage/MMKV | I/O violation |
| Utiliser React hooks | Framework coupling |
| Importer de `src/components/` | Coupling inversé |
| Importer de `src/hooks/` | Coupling inversé |
| Importer de `app/` | Coupling inversé |

---

## 4. Structure Requise d'un Domaine

```
src/domains/{domain-name}/
├── entities.ts          // Types purs (interfaces)
├── rules.ts             // Règles métier (pure functions)
├── events.ts            // Domain events definitions
├── index.ts             // Barrel exports PUBLICS uniquement
└── [test].ts            // Tests unitaires (optionnel mais recommandé)
```

---

## 5. Règles des Entités

### Règle D-ENT-1: Pure Data Structures
Les entités sont des data structures. Elles ne contiennent PAS de méthodes qui modifient l'état.

```typescript
// ✅ CORRECT
interface MemorizationRecord {
  id: string;
  status: MemorizationStatus;
}

// ❌ INCORRECT — Méthode qui modifie l'état
class MemorizationRecord {
  save(): Promise<void> { /* I/O! */ }
}
```

### Règle D-ENT-2: Immutable After Creation
Les entités sont créées immutables. Aucune mutation directe.

```typescript
// ✅ CORRECT — Nouvel objet créé
const updated = { ...record, status: 'mastered' };

// ❌ INCORRECT — Mutation directe
record.status = 'mastered';
```

---

## 6. Règles des Value Objects

Les Value Objects sont des entités sans identité propre — ils sont comparés par valeur.

```typescript
interface BibleReference {
  bookId: string;
  chapter: number;
  verse?: number;
}

// Deux BibleReference sont égaux si leurs champs sont identiques
```

---

## 7. Règles des Domain Events

### Création d'un Event
```typescript
interface DomainEvent {
  id: string;              // UUID v4
  type: string;            // Nom qualifié: "bible.verse_selected"
  timestamp: number;       // Unix ms
  payload: Record<string, unknown>;
}
```

### Émission
Toujours utiliser le EventBus singleton:
```typescript
eventBus.emit({
  id: crypto.randomUUID(),
  type: DomainEventTypes.VERSE_MEMORIZED,
  timestamp: Date.now(),
  payload: { recordId: 'xxx', ... },
});
```

---

## 8. Règles des Services de Domaine

Les services de domaine orchestrent les règles et les entités:

```typescript
class BibleService {
  constructor(
    private storage: IStorage,     // Port abstraction
    private repository: IBibleRepository  // Port abstraction
  ) {}
  
  async getVerse(ref: string): Promise<BibleVerse | null> {
    const parsed = this.parseReference(ref);
    return this.repository.findByReference(parsed);
  }
}
```

Règle: Toujours passer par des ports (interfaces), jamais par des implémentations concrètes.

---

## 9. Règles des Factories

### Pattern Factory pour Entités Complexes
```typescript
class MemorizationRecordFactory {
  static create(params: {
    bookId: string;
    chapterNumber: number;
    verseNumber: number;
    translationId: string;
    verseText: string;
    referenceDisplay: string;
  }): MemorizationRecord {
    return {
      id: `${params.bookId}:${params.chapterNumber}:${params.verseNumber}`,
      bookId: params.bookId,
      chapterNumber: params.chapterNumber,
      // ... autres fields with defaults
    };
  }
}
```

---

*Ce rulebook complète docs/09-architecture.md Section 4. Il s'applique à TOUS les domaines du projet.*

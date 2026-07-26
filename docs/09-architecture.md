# VersyFlow — Architecture Technique

## Document généré par Agent E — Architecture

---

## 1. Vue d'ensemble Architecturale

VersyFlow suit une **Architecture en couches séparées** inspirée de Clean Architecture et Hexagonal Architecture, adaptée à React Native + Expo + TypeScript + Rust.

### Principes architecturaux

1. **Les domaines sont autonomes** — Bible, FSRS, i18n sont des modules独立 sans dépendances circulaires
2. **Les composants UI ne contiennent AUCUNE logique métier** — présentation uniquement
3. **Le flux de données va toujours vers l'intérieur** — UI → Services → Domaines → Storage
4. **Inversion de dépendances** — les couches externes dépendent des couches internes via interfaces
5. **Le moteur FSRS (Rust) est accessible via une interface d'abstraction pure TypeScript**

### Diagramme de haut niveau

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Screens  │  │Components│  │  Hooks   │  │ Navigation │  │
│  │(Expo Router)│ (React    │  │ (UI glue │  │  (Router)  │  │
│  │          │  │ Native)  │  │  only)   │  │            │  │
│  └────┬─────┘  └──────────┘  └──────────┴─  └────────────┘  │
│       │                                                      │
├───────┼──────────────────────────────────────────────────────┤
│       ▼                                                      │
│                   APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Services (Orchestration)                 │   │
│  │  BibleService │ FsrsService │ SettingsService        │   │
│  │  ProgressService │ MemoryStore (Zustand)             │   │
│  └──────┬─────────────┬──────────────┬─────────────────┘   │
│         │             │              │                       │
├─────────┼─────────────┼──────────────┼───────────────────────┤
│         ▼             ▼              ▼                       │
│                     DOMAIN LAYER                               │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Bible     │ │   FSRS     │ │  i18n    │ │ Memoriz-   │  │
│  │  Domain    │ │  Domain    │ │  Domain  │ │ ation      │  │
│  │            │ │            │ │          │ │  Domain    │  │
│  │ entities/  │ │ entities/  │ │ locales/ │ │  entities/ │  │
│  │ parser.ts  │ │ engine.ts  │ │ config.ts│ │ session.ts │  │
│  │ translat.  │ │ calculator │ │ direction│ │ validator  │  │
│  │ repository │ │ index.ts   │ │ index.ts │ │ index.ts   │  │
│  └────┬───────┘ └────┬───────┘ └──────────┘ └────────────┘  │
│       │              │                                       │
├───────┼──────────────┼───────────────────────────────────────┤
│       ▼              ▼                                       │
│                INFRASTRUCTURE LAYER                           │
│  ┌──────────────────┐ ┌──────────────────────────────┐      │
│  │   Storage Adapters│ │   Rust WASM Bridge           │      │
│  │  MMKV │ AsyncStorage│ │  WasmLoader │ FallbackSM2  │      │
│  └──────────────────┘ └──────────────────────────────┘      │
│  ┌──────────────────┐ ┌──────────────────────────────┐      │
│  │   Logging/Telemetry│ │   Future: Network/Sync      │      │
│  └──────────────────┘ └──────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Couche UI (`app/` + `src/components/`)

### Responsabilités
- Rendus visuels uniquement
- Navigation entre écrans
- Réception d'événements utilisateur (tap, scroll, swipe)
- Appel de hooks → qui appellent services → qui appellent domaines

### Ce qu'elle NE FAIT PAS
- ❌ Aucune logique métier
- ❌ Aucune transformation de données
- ❌ Aucun appel direct au storage
- ❌ Aucune règle de validation complexe

### Exemple: COMPOSANT CORRECT
```typescript
// ✅ CORRECT — Composant purement présentational
function VerseCard({ reference, text, status, onPress }: VerseCardProps) {
  const statusColor = statusColors[status]; // static mapping
  
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        <Text style={styles.reference}>{reference}</Text>
        <Text style={styles.text}>{text}</Text>
        <StatusChip status={status} />
      </View>
    </TouchableOpacity>
  );
}
```

### Exemple: ANTI-PATTERN (À NE JAMAIS FAIRE)
```typescript
// ❌ INCORRECT — Logique métier dans le composant
function VerseCard({ verse }: { verse: BibleVerse }) {
  const status = calculateMemorizationStatus(verse); // DOMAIN LOGIC!
  const nextReview = fsrs.predictNextReview(verse.fsrsState); // SERVICE LOGIC!
  
  return <View>{/* ... */}</View>;
}
```

---

## 3. Couche Application (`src/services/`)

### Responsabilités
- Orchestration de plusieurs domaines
- Gestion d'état global (Zustand stores)
- Adaptation des données domaine pour la consommation UI
- Déclenchement de domain events

### Architecture des Services
```typescript
// src/services/bible-service.ts
import { BibleDomain } from '@/domains/bible';
import { IStorage } from '@/infrastructure/storage';

export class BibleService {
  constructor(private storage: IStorage) {}
  
  async getBookById(bookId: string): Promise<BibleBook> {
    const cached = await this.storage.get('bible:' + bookId);
    if (cached) return cached;
    
    const book = await BibleDomain.loadBook(bookId);
    await this.storage.set('bible:' + bookId, book);
    return book;
  }
  
  async searchByReference(ref: string): Promise<BibleVerse | null> {
    return BibleDomain.resolveReference(ref);
  }
}

// src/services/fsrs-service.ts
import { FsrsDomain, IFsrsEngine } from '@/domains/fsrs';

export class FsrsService {
  constructor(private engine: IFsrsEngine) {}
  
  scheduleNextReview(record: MemorizationRecord): number {
    const newState = this.engine.review(
      record.fsrsState,
      record.lastRating
    );
    record.fsrsState = newState;
    return newState.nextReviewAt; // unix timestamp
  }
}
```

---

## 4. Couche Domaine (`src/domains/`)

### Responsabilités
- Entités pures (data structures without I/O)
- Règles de domaine (calculs, validation, parsing)
- Interfaces de ports (abstractions vers infrastructure)
- Domain events (communication inter-domaine)

### Structure par domaine

```
src/domains/bible/
├── entities.ts      → BibleBook, BibleChapter, BibleVerse (types purs)
├── parser.ts        → ReferenceResolver ("Jean 3:16" → parsed object)
├── translator.ts    → TranslationRegistry (register/load translations)
├── repository.ts    → IBibleRepository (interface port)
└── index.ts         → barrel exports

src/domains/fsrs/
├── entities.ts      → FsrsState, Rating enum, ReviewLog (types purs)
├── engine.ts        → IFsrsEngine (interface port)
├── rust-engine.ts   → WasmFsrsEngine implements IFsrsEngine
├── fallback-engine.ts → Sm2FallbackEngine implements IFsrsEngine
├── calculator.ts    → Pure math helpers for FSRS formulas
└── index.ts         → barrel exports
```

### Domain Events
```typescript
// Event system for cross-domain communication
interface DomainEvent {
  type: string;
  timestamp: number;
  payload: Record<string, unknown>;
}

// Examples
const verseMemorized: DomainEvent = {
  type: 'verse.memorized',
  timestamp: Date.now(),
  payload: { bookId: 'joh', chapter: 3, verse: 16 },
};

const reviewCompleted: DomainEvent = {
  type: 'review.completed',
  timestamp: Date.now(),
  payload: { recordId: 'xxx', rating: 'good', newStability: 4.2 },
};
```

---

## 5. Couche Infrastructure (`src/infrastructure/`)

### Responsabilités
- Implémentations concrètes des ports définis en domaine
- Persistance (MMKV, AsyncStorage)
- Intégration externe (WASM Rust loader)
- Logging et telemetry

### Architecture adapter pattern
```
Domaine définit l'interface (port):
  interface IStorage { get(key: string): Promise<any>; set(...): Promise<void>; }

Infrastructure implémente:
  class MmkvStorage implements IStorage { /* MMKV concrete */ }
  class AsyncStorageAdapter implements IStorage { /* AsyncStorage concrete */ }

Service utilise l'interface, pas l'implémentation:
  class BibleService { constructor(private storage: IStorage) {} }
  
  // Dependency Injection — swap implementation easily
  const service = new BibleService(new MmkvStorage());
```

---

## 6. Stratégie de Stockage

### Primaire: MMKV (Performance)
- Settings utilisateur
- Versets mémorisés + état FSRS
- Historique révisions
- Recherche index locale

### Secondaire: AsyncStorage (Fallback premier lancement)
- Préférences temporaires
- Migration automatique vers MMKV au premier accès

### Base biblique: Fichier JSON statique
- LSG.json dans `data/bible/lsg.json` (~2-5MB compressé)
- Chargé au premier lancement, stocké en mémoire
- Accès en lecture seule (pas de modification)

---

## 7. Intégration Rust (FSRS Engine)

### Stack d'intégration
```
TypeScript App (FsrsService)
    ↓ abstraction
IFsrsEngine (domain interface)
    ↓ implementation
WasmFsrsEngine
    ↓ bridge
@wasm-tool/wasm-bindgen
    ↓ FFI
Rust Library (fsrs crate)
    ↓ compile
.wasm module
```

### Stratégie de chargement
1. WASM module chargé de manière asynchrone au démarrage app
2. Si WASM succès → WasmFsrsEngine actif
3. Si WASM échoue → fallback SM-2 JS automatique
4. Health check à chaque lancement, retry avec backoff exponentiel
5. Journalisation de l'état du moteur (WASM vs Fallback)

### Interface TypeScript abstraite
```typescript
export enum Rating {
  AGAIN = 1,
  HARD = 2,
  GOOD = 3,
  EASY = 4,
}

export interface FsrsState {
  stability: number;
  difficulty: number;
  recallProbability: number;
  lastInterval: number;
  nextInterval: number;
  elapsedDays: number;
  repetitions: number;
}

export interface IFsrsEngine {
  newState(state: FsrsState | null, requests: number): FsrsState;
  review(state: FsrsState, rating: Rating): FsrsReview;
}

export interface FsrsReview {
  state: FsrsState;
  due: Date;
  stability: number;
  scheduledDays: number;
}
```

---

## 8. Offline-First Strategy

### Principe fondamental
Toutes les données sont d'abord stockées localement. Aucune opération ne nécessite de réseau.

### Implications architecturales
- 0 dépendance network pour fonctionnalité MVP
- Structure de données auto-suffisante côté client
- Future sync layer serait ADDITIVE (couche au-dessus), pas fondamentale
- Toutes les opérations de read/write sont synchro ou locale-asynchrone (MMKV)

### Pattern de code offline-first
```typescript
// ✅ CORRECT — Opération 100% locale
async function memorizeVerse(verse: BibleVerse, rating: Rating) {
  const newRecord = bibleDomain.createRecord(verse);
  const fsrsReview = fsrsService.review(newRecord.fsrsState, rating);
  newRecord.fsrsState = fsrsReview.state;
  await storage.save('memorized:' + newRecord.id, newRecord);
  emitEvent('verse.memorized', { id: newRecord.id });
}

// ❌ INCORRECT — Dépendance réseau dans MVP
async function memorizeVerse(verse) {
  await api.post('/memorize', { verseId: verse.id }); // NO NETWORK in MVP
  await storage.save(...);
}
```

---

## 9. Stratégie d'Extensibilité

### Ajouter une traduction biblique = ZÉRO code change
1. Placer fichier JSON dans `data/bible/{translation-id}.json`
2. Le registry scanne automatiquement `data/bible/*.json` au runtime
3. Nouvelle traduction apparaît dans le picker

### Ajouter une langue UI = ZÉRO code change
1. Créer `src/i18n/locales/{code}.json`
2. Ajouter dans SUPPORTED_LANGUAGES config
3. RTL détecté automatiquement si nécessaire

### Ajouter un futur domaine = plug-and-play
1. Créer dossier `src/domains/{new-domain}/`
2. Définir interfaces de ports
3. Implémenter en infrastructure
4. Ordonnancer depuis services
5. Existing code n'est jamais modifié (principe open/closed)

---

*Document approuvé. Transmis à l'Agent E pour Data Model.*

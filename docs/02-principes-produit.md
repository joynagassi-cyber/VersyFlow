# VersyFlow — Principes Produit

## Document généré par Agent B — Principes

---

## 1. Principes Architecturaux

### PA-1 : Aucune logique métier dans les composants UI

Les composants React Native sont des **fonctions pures de rendu**. Ils reçoivent des props en entrée et produisent du JSX en sortie. Toute logique métier doit vivre dans les hooks ou services.

**❌ WRONG — Logic in component:**
```typescript
function VerseCard({ verse }: { verse: BibleVerse }) {
  // ❌ Domain logic here!
  const status = memorizationDomain.calculateStatus(verse);
  const nextReview = fsrsEngine.predictNext(verse.fsrsState);
  
  return <View>...</View>;
}
```

**✅ CORRECT — Logic extracted:**
```typescript
// Hook contains all business logic
function useVerseCard(verse: BibleVerse) {
  const status = memorizationDomain.calculateStatus(verse);
  const nextReview = fsrsEngine.predictNext(verse.fsrsState);
  return { verse, status, nextReview };
}

// Component is pure presentation
function VerseCard({ verse, status, nextReview }: VerseCardProps) {
  return <View>...</View>;
}
```

### PA-2 : Aucune traduction biblique codée en dur

Tous les textes bibliques proviennent de fichiers JSON chargés dynamiquement. Le code ne contient JAMAIS de verset littéral.

**❌ WRONG:**
```typescript
const text = "Au commencement Dieu créa les cieux et la terre.";
```

**✅ CORRECT:**
```typescript
// Data-driven loading from registered translation
const verse = await bibleService.getVerse('gen', 1, 1);
// verse.text comes from data/bible/lsg.json at runtime
```

### PA-3 : Agnosticisme linguistique total

La langue de l'interface ET la traduction biblique sont deux dimensions orthogonales et complètement indépendantes.

```typescript
interface UserSettings {
  uiLanguage: string;    // 'fr' — how the APP speaks
  bibleTranslation: string; // 'lsg' — which BIBLICAL TEXT to show
  // These two can be ANY combination:
  // FR UI + KJV Bible → Interface française, versets anglais KJV
  // EN UI + LSG Bible → English interface, French verses LSG
  // AR UI + LSG Bible → RTL Arabic interface, French verses LSG
}
```

### PA-4 : FSRS isolé dans une couche dédiée

Le moteur FSRS est contenu entièrement dans `src/domains/fsrs/`. Aucun autre module ne connaît son existence directe. La communication se fait exclusivement via l'interface `IFsrsEngine`.

```
UI Layer → Services (FsrsService) → Domains (IFsrsEngine port) → Infrastructure (WasmFsrsEngine / FallbackEngine)
```

### PA-5 : Architecture modulaire stricte

Dépendances autorisées UNIQUEMENT dans cette direction:

```
app/ ←── src/components/
   ↑
src/hooks/ ←── src/services/
   ↑
src/domains/  ←── src/infrastructure/
   ↑
data/ static files
```

Règle absolue: jamais d'import en sens inverse.

### PA-6 : Offline-first

Toutes les opérations fonctionnent SANS connexion. Le stockage local est la source de vérité unique au MVP.

- Lecture: toujours depuis MMKV/local d'abord
- Écriture: toujours en local d'abord
- Sync (future): additive, never blocking

### PA-7 : UI purement déclarative

Les composants ne mutablent JAMAIS d'état métier directement. Ils communiquent via:

1. Props descendantes (data down)
2. Callbacks montantes (events up)
3. Store global via Zustand pour l'état partagé

### PA-8 : Extensibilité sans refactor

Principe ouvert/fermé:

- Nouveau traduction biblique = ajouter fichier JSON, zéro code changé
- Nouvelle langue UI = ajouter fichier locale + config entry, zéro code UI changé
- Nouveau domaine = nouveau dossier dans domains/, interfaces dans ports, zéro code existant touché

### PA-9 : Séparation stricte Domaine/UI/Infrastructure

| Couche | Responsabilité | Ne fait PAS |
|--------|---------------|-------------|
| Domaine | Règles métier pures, entités, calculs | I/O, React, framework |
| Application | Orchestration, state management | Logique métier directe |
| UI | Rendu visuel uniquement | Calculs, règles, transformation |
| Infrastructure | Stockage, réseau, WASM, logging | Règles métier |

### PA-10 : Simplicité fonctionnelle

Le MVP fait UNE chose et la fait parfaitement: mémorisation de versets bibliques avec FSRS. Chaque fonctionnalité ajoutée doit passer la question: "Est-ce que ça sert DIRECTEMENT la mémorisation?" Si non → V1+.

---

## 2. Principes Produit

### PP-1 : Moins de 3 clics pour mémoriser

Depuis l'accueil, un utilisateur doit pouvoir lancer une session de mémorisation en au maximum 3 interactions:

1. Accueil → Explorer (1)
2. Explorer → Sélectionner verset (2)
3. Verset → "Mémoriser" (3)

### PP-2 : Beauté au service du sacré

Le design rose/frais premium n'est pas un choix décoratif — il communique le respect dû au contenu biblique. Chaque pixel doitHonorer le texte sacré.

### PP-3 : Performance perçue instantanée

- Tous les écrans doivent charger en < 200ms
- Aucune animation ne doit bloquer l'interaction utilisateur
- Les transitions doivent être fluides (60fps sur cible)

---

## 3. Contraintes Techniques Non Négociables

| Contrainte | Détail |
|-----------|--------|
| TypeScript strict mode | `noImplicitAny: true`, `strict: true` |
| React Native conventions | Functional components, hooks pattern |
| Rust FFI safety | Tous les appels WASM wrapped dans try/catch |
| Expo Updates | Code modifications compatibles OTA where possible |
| Memory budget | App footprint < 50MB, JS heap < 100MB |
| Accessibility | WCAG 2.1 AA minimum, VoiceOver/TalkBack labels |

---

*Document approuvé. Transmis à l'Agent C pour UX Flows.*

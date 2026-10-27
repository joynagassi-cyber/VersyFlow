# VersyFlow — Development Guidelines

## Code Quality Standards

### ESLint Rules (Enforced)
- `@typescript-eslint/no-explicit-any`: **error** (except rest args) — never use `any`
- `@typescript-eslint/consistent-type-imports`: **error** — always use `import type` for type-only imports
- `@typescript-eslint/no-unused-vars`: **error** — prefix intentionally unused vars with `_`
- `@typescript-eslint/no-floating-promises`: **error** — always handle or `void` promises
- `@typescript-eslint/restrict-template-expressions`: **error** — no untyped values in template literals
- `import/no-cycle`: **error** (maxDepth: 3) — no circular imports
- `no-console`: **warn** — only `console.warn` and `console.error` allowed

### TypeScript Strictness
All strict flags are enabled. Every file must satisfy:
- `noImplicitAny` — all parameters and variables must be typed
- `strictNullChecks` — handle `null`/`undefined` explicitly
- `strictFunctionTypes` — function parameter types are contravariant
- No `as any` casts; use proper type narrowing or Zod validation

## Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| React components | PascalCase | `VerseCard`, `SessionScreen` |
| Hooks | camelCase with `use` prefix | `useMemorizationSession` |
| Stores | camelCase with `use` prefix | `useMemorizationStore` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_FSRS_STATE`, `ROLE_PERMISSIONS` |
| Enums | PascalCase (name) + UPPER_SNAKE_CASE (values) | `enum Rating { AGAIN = 1 }` |
| Interfaces | PascalCase, no `I` prefix | `FsrsState`, `BibleBook` |
| Domain functions | camelCase, verb-first | `hasPermission`, `resolveBookId` |
| Files | kebab-case | `i18n-service.ts`, `session-engine.ts` |
| Domain modules | kebab-case folders | `src/domains/family/` |

## File & Module Structure

### Domain Module Pattern
Every domain in `src/domains/<name>/` follows this structure:
```
entities.ts     — Pure types, interfaces, enums, constants (no I/O)
repository.ts   — Repository interface (abstract, no implementation)
service.ts      — Domain service (business logic only)
index.ts        — Public barrel export
```

### File Header Convention
Domain files use JSDoc headers with spec reference:
```typescript
/**
 * Family Permissions Module
 * Defines access control policies for family operations
 * FAM-PERM-001
 */
```

### Barrel Exports
Every domain and major module exposes a public API via `index.ts`. Import from the barrel, not from internal files:
```typescript
// ✅ Correct
import { FamilyRole, hasPermission } from '@/domains/family';

// ❌ Wrong
import { FamilyRole } from '@/domains/family/permissions';
```

## Architectural Patterns

### Clean Architecture Dependency Rule
Dependencies flow inward only:
```
app/ (screens) → hooks → store → services → domains → (no deps)
                                           ↓
                                     infrastructure/
```
- **Domains** must never import from `services/`, `store/`, `hooks/`, or `app/`
- **Services** may import from `domains/` and `infrastructure/` only
- **Components** must never call services directly — use hooks or store

### Zustand Store Pattern
```typescript
// Interface defines state + actions together
interface MyState {
  value: string;
  setValue: (v: string) => void;
}

// create<T>() with set/get
export const useMyStore = create<MyState>((set, get) => ({
  value: '',
  setValue: (v) => set({ value: v }),
}));
```
- State and actions are co-located in the same interface
- Use `set((state) => ...)` for updates that depend on previous state
- Use `get()` for computed values (like `getProgress()`)
- Stores are named `use<Name>Store` and exported as hooks

### Enum + Record Permission Pattern
```typescript
export enum FamilyRole { OWNER = 'owner', ADMIN = 'admin', MEMBER = 'member' }
export enum FamilyPermission { MANAGE_FAMILY = 'manage_family', ... }

export const ROLE_PERMISSIONS: Record<FamilyRole, FamilyPermission[]> = { ... };

export function hasPermission(role: FamilyRole, permission: FamilyPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
```
- Permissions are data-driven via `Record<Role, Permission[]>`
- Specific helper functions wrap `hasPermission` for readability
- Use `??` nullish coalescing for safe fallbacks

### Singleton Service Pattern (Stub-safe)
```typescript
export const I18nService = {
  getInstance: () => ({
    setLanguage: () => {},
    getLanguage: () => 'fr',
    t: (k: string) => k,
    isRTL: () => false,
  }),
};
```
- Services expose a `getInstance()` factory
- Stubs/fallbacks return the same interface shape for type safety

### FSRS Engine Factory Pattern
- `src/domains/fsrs/engine.ts` defines the abstract interface
- `wasm-engine.ts` implements with Rust/WASM (production)
- `fallback-engine.ts` implements in pure TypeScript (dev/test)
- `src/services/fsrs-factory.ts` selects implementation at runtime

## Localization Patterns

### Multilingual Entity Fields
```typescript
export interface BibleBook {
  name: Record<string, string>; // { fr: 'Genèse', en: 'Genesis', ar: 'التكوين' }
}
```
- Localized strings stored as `Record<string, string>` keyed by locale code
- UI language and Bible translation are **completely independent** settings

### i18n Usage
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// t('key') returns translated string
```
- Use `useI18n` hook from `src/hooks/useI18n.ts` for app-level i18n access
- Never hardcode user-facing strings; always use translation keys

## Import Conventions

### Path Aliases (always use over relative paths)
```typescript
import { BibleBook } from '@/domains/bible';
import { useMemorizationStore } from '@/store/memorization-store';
import { tokens } from '@/tokens';
import { useTheme } from '@/hooks/useTheme';
```

### Type-only Imports
```typescript
// ESLint enforces consistent-type-imports
import type { FsrsState } from '@/domains/fsrs';
import { Rating } from '@/domains/fsrs'; // value import
```

## Testing Standards

- **Coverage threshold**: 70% branches/functions/lines/statements
- **Test environment**: Node (not jsdom) — no DOM APIs in unit tests
- **Test location**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **E2E setup**: Detox with `device.resetBackend()` + `device.launchDevice()` in `beforeAll`
- Domain logic (entities, permissions, engines) must have unit tests
- Stores and services should have integration tests

## Code Style (Prettier)

- See `.prettierrc` for formatting rules
- Single quotes for strings
- Trailing commas in multi-line structures
- 2-space indentation
- Semicolons required

## Domain Events

Domain events are defined in `src/domains/events.ts` and emitted by services:
```typescript
// Emit events for cross-domain communication
// Never import one domain service from another — use events instead
```

## Anti-Patterns to Avoid

- ❌ `any` type — use `unknown` + type guards or Zod schemas
- ❌ Direct `console.log` — use `console.warn`/`console.error` or the logging infrastructure
- ❌ Circular imports between domains — use domain events
- ❌ Business logic in components — move to hooks or services
- ❌ Relative imports crossing module boundaries — use `@/` aliases
- ❌ Floating promises — always `await` or `void` async calls
- ❌ Hardcoded user-facing strings — always use i18n keys

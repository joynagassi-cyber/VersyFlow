# VersyFlow — AI Rules

## Tech Stack

- **React 18** with **TypeScript** (strict mode) and **Vite** as the build tool
- **Ionic React** (`@ionic/react`, `@ionic/react-router`) for mobile-first UI primitives, tab navigation, and native-feel components (headers, cards, lists)
- **React Router v6** (`react-router-dom`) for web routing — routes are defined in `src/main.tsx`
- **Zustand** (`zustand`) for global client-side state management — one store per capability domain
- **Supabase** (`@supabase/supabase-js`) for authentication and cloud sync via PowerSync (`@powersync/web`, `@powersync/capacitor`)
- **Capacitor** (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, plus plugins) for native mobile bridges
- **i18next + react-i18next** for internationalization — locales live in `src/i18n/locales/` (fr, en, ar, de, zh)
- **ts-fsrs** for spaced-repetition scheduling (FSRS algorithm via WebAssembly with a JS fallback)
- **Zod** for runtime input validation and schema definitions
- **Tailwind CSS** for styling — primary utility-first approach across all new components
- **Lucide React** for iconography
- **Shadcn/ui** components are pre-installed — prefer these over custom-built equivalents whenever they exist

## Layer Architecture

The app follows Clean Architecture with strict unidirectional dependencies:

```
UI Layer (app/ + src/components/)
    ↓ imports from
Hooks (src/hooks/) + Stores (src/store/)
    ↓ imports from
Services (src/services/) + Capabilities (src/capabilities/)
    ↓ imports from
Domains (src/domains/)
    ↓ implements ports from
Infrastructure (src/infrastructure/)
```

**Hard rules:**
- `domains/` never imports from `services/`, `components/`, or `infrastructure/`
- `components/` never imports from `services/`, `domains/`, or `infrastructure/` directly — they consume state via hooks and stores
- `infrastructure/` implements interfaces defined in `domains/`

## File Organization

| Type | Location |
|------|----------|
| Page / screen (route) | `app/[feature]/[name].tsx` |
| Shared component | `src/components/[category]/[Name].tsx` |
| React hook (UI glue) | `src/hooks/use[Name].ts` |
| Store (Zustand) | `src/store/[name]-store.ts` |
| Capability (complex feature) | `src/capabilities/[name]/store.ts` |
| Domain entity | `src/domains/[domain]/entities.ts` |
| Domain interface (port) | `src/domains/[domain]/repository.ts` or `engine.ts` |
| Infrastructure adapter | `src/infrastructure/[type]/[name].ts` |
| Service (orchestration) | `src/services/[name]-service.ts` |
| Utility function | `src/utils/[name].ts` |
| Locale file | `src/i18n/locales/[code].ts` |
| Static data | `data/[type]/[name].json` |

## Library Selection Rules

### Styling
- **Use Tailwind CSS** for all layout, spacing, colors, and responsive design
- **Use Shadcn/ui** (`@/components/ui/*`) for complex interactive primitives (dialog, select, slider, toast, etc.) — do not rebuild what already exists
- **Use Ionic components** (`@ionic/react`) for tab bars, headers, lists, and mobile navigation patterns
- Do not write custom CSS files — all styles go in Tailwind classes
- Do not use inline `style={{ }}` except for dynamic values that cannot be expressed with Tailwind

### Icons
- **Use Lucide React** (`lucide-react`) for all icons — never add a new icon library

### Navigation
- **React Router** for route definitions and programmatic navigation (`useNavigate`)
- **Ionic `<IonRouterOutlet>`** wraps the router; do not replace it
- Use `useIonicNavigation()` hook for back-button and transition handling

### State Management
- **Zustand** for all global state — one store per logical domain (`auth-store`, `bible-store`, etc.)
- Do not use React `useState`/`useReducer` for cross-component state
- Keep stores thin — they hold state and actions only, no business logic

### Internationalization
- **i18next + react-i18next** for all user-facing strings
- Translate keys live in `src/i18n/locales/[code].ts`
- Never hardcode strings in components — always use the translation hook
- RTL is auto-detected for Arabic (`ar`) — apply `dir="rtl"` via the i18n context

### Validation
- **Zod** for all form schemas and runtime data validation
- Define schemas in the same file as the form or service that uses them
- Never validate with manual `if` chains — use Zod `.parse()` or `.safeParse()`

### Database & Sync
- **PowerSync** is the single source of truth for local-first data
- **Supabase** handles auth and real-time sync — use the Supabase client from `src/auth/`
- Do not bypass PowerSync for writes; all mutations go through the sync layer

### Spaced Repetition
- **ts-fsrs** is the FSRS engine — wrap it behind `src/domains/fsrs/engine.ts` interface
- The WASM engine is primary; the JS fallback (`fallback-engine.ts`) activates on failure
- Never call the FSRS library directly from components — go through the domain service

### Storage
- **MMKV** for hot-path local storage (settings, memorization records)
- **Capacitor Storage** as the Capacitor-backed adapter
- Abstract behind `IStorage` interface in `src/infrastructure/storage/`

### Testing
- **Vitest** for unit and integration tests
- **React Testing Library** for component tests
- Test files go next to source: `src/domains/fsrs/__tests__/engine.test.ts`

## Conventions

- **PascalCase** for components and entities: `VerseCard`, `MemorizationRecord`
- **camelCase + `use` prefix** for hooks: `useMemorizationSession`
- **camelCase + `Service` suffix** for services: `BibleService`
- **Interface prefix `I`**: `IFsrsEngine`, `IBibleRepository`
- **UPPER_SNAKE_CASE** for constants: `DEFAULT_LANGUAGE`, `MAX_STREAK`
- **Barrel exports** (`index.ts`) from every domain and capability folder
- **Lazy load** all route pages in `src/main.tsx` with `React.lazy()`
- **Never import from `infrastructure/` or `domains/` inside `components/`** — go through hooks and stores

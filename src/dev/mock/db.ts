/**
 * MockDB — the in-browser database used in mock mode.
 *
 * A tiny, synchronous, localStorage-backed document store. It replaces the
 * PowerSync SQLite replica for frontend-only sessions:
 *
 *   - one JSON blob per app (small data set, easy to snapshot / export /
 *     reset from the Dev panel),
 *   - collections named after the PowerSync tables so the mock adapters can
 *     mirror the real repository semantics,
 *   - a change bus (`subscribe`) so hooks can re-render when a write lands,
 *   - cross-tab synchronisation through the `storage` event.
 *
 * It is intentionally dependency-free and typed as `unknown[]` per
 * collection: the domain adapters in `./repositories.ts` do the casting.
 */

export const MOCK_DB_STORAGE_KEY = 'versyflow:mock:db:v1';
export const MOCK_DB_VERSION = 1;

export const MOCK_COLLECTIONS = [
  'users',
  'learner_profiles',
  'memorization_records',
  'review_logs',
  'streaks',
  'families',
  'family_memberships',
  'family_invitations',
  'translation_preferences',
  'telemetry_events',
  'test_events',
] as const;

export type MockCollectionName = (typeof MOCK_COLLECTIONS)[number];

export interface MockDbState {
  version: number;
  updatedAt: number;
  /** The mock account currently "signed in" (see `identity.ts`). */
  activeUserId: string | null;
  collections: Record<MockCollectionName, unknown[]>;
}

export interface MockDbSnapshot extends MockDbState {
  /** Row count per collection, handy for the Dev panel. */
  counts: Record<MockCollectionName, number>;
}

type Listener = (state: MockDbState) => void;

function emptyCollections(): Record<MockCollectionName, unknown[]> {
  const collections = {} as Record<MockCollectionName, unknown[]>;
  for (const name of MOCK_COLLECTIONS) collections[name] = [];
  return collections;
}

function emptyState(): MockDbState {
  return {
    version: MOCK_DB_VERSION,
    updatedAt: Date.now(),
    activeUserId: null,
    collections: emptyCollections(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clone<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export class MockDb {
  private state: MockDbState;
  private listeners = new Set<Listener>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private memoryOnly = false;

  constructor() {
    this.state = this.read() ?? emptyState();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key !== MOCK_DB_STORAGE_KEY) return;
        const next = this.read();
        if (!next) return;
        this.state = next;
        this.emit();
      });
    }
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------

  private read(): MockDbState | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(MOCK_DB_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || !isRecord(parsed.collections)) return null;
      const collections = emptyCollections();
      for (const name of MOCK_COLLECTIONS) {
        const rows = parsed.collections[name];
        collections[name] = Array.isArray(rows) ? rows : [];
      }
      return {
        version: typeof parsed.version === 'number' ? parsed.version : MOCK_DB_VERSION,
        updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
        activeUserId:
          typeof parsed.activeUserId === 'string' ? parsed.activeUserId : null,
        collections,
      };
    } catch {
      return null;
    }
  }

  private persist(): void {
    if (this.memoryOnly) return;
    try {
      if (typeof localStorage === 'undefined') throw new Error('no localStorage');
      localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Quota exceeded / private mode: keep working in memory for this tab so
      // manual testing never breaks on a storage error.
      this.memoryOnly = true;
      console.warn('[mock-db] localStorage indisponible — stockage en mémoire.');
    }
  }

  private schedulePersist(): void {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, 60);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.warn('[mock-db] listener error', error);
      }
    }
  }

  private touch(): void {
    this.state.updatedAt = Date.now();
    this.schedulePersist();
    this.emit();
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  list<T>(name: MockCollectionName): T[] {
    return clone(this.state.collections[name] as T[]);
  }

  /** Replace an entire collection (used by the seeder / snapshot import). */
  replace<T>(name: MockCollectionName, rows: T[]): void {
    this.state.collections[name] = clone(rows);
    this.touch();
  }

  /** Insert or replace a row, keyed on `id` by default. */
  put<T extends { id: string }>(name: MockCollectionName, row: T): T {
    const rows = this.state.collections[name] as T[];
    const index = rows.findIndex((r) => r.id === row.id);
    if (index >= 0) rows[index] = clone(row);
    else rows.push(clone(row));
    this.touch();
    return clone(row);
  }

  /** Patch a row by id; returns the updated row (or null when absent). */
  patch<T extends { id: string }>(
    name: MockCollectionName,
    id: string,
    updates: Partial<T>,
  ): T | null {
    const rows = this.state.collections[name] as T[];
    const index = rows.findIndex((r) => r.id === id);
    if (index < 0) return null;
    const next = { ...rows[index], ...updates } as T;
    rows[index] = next;
    this.touch();
    return clone(next);
  }

  /** Remove every row matching the predicate. Returns the removed count. */
  removeWhere<T>(name: MockCollectionName, predicate: (row: T) => boolean): number {
    const rows = this.state.collections[name] as T[];
    const kept = rows.filter((row) => !predicate(row));
    const removed = rows.length - kept.length;
    if (removed > 0) {
      this.state.collections[name] = kept;
      this.touch();
    }
    return removed;
  }

  clearCollection(name: MockCollectionName): void {
    this.state.collections[name] = [];
    this.touch();
  }

  get activeUserId(): string | null {
    return this.state.activeUserId;
  }

  setActiveUserId(userId: string | null): void {
    if (this.state.activeUserId === userId) return;
    this.state.activeUserId = userId;
    this.touch();
  }

  counts(): Record<MockCollectionName, number> {
    const counts = {} as Record<MockCollectionName, number>;
    for (const name of MOCK_COLLECTIONS) {
      counts[name] = this.state.collections[name].length;
    }
    return counts;
  }

  snapshot(): MockDbSnapshot {
    return {
      ...clone(this.state),
      counts: this.counts(),
    };
  }

  /** Restore a snapshot (import / Dev panel). */
  restore(snapshot: MockDbState): void {
    this.state = {
      version: MOCK_DB_VERSION,
      updatedAt: Date.now(),
      activeUserId: snapshot.activeUserId ?? null,
      collections: {
        ...emptyCollections(),
        ...(snapshot.collections ?? {}),
      },
    };
    this.persist();
    this.emit();
  }

  /** Wipe everything (all collections + active user). */
  reset(): void {
    this.state = emptyState();
    this.persist();
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** App-wide singleton. */
export const mockDb = new MockDb();

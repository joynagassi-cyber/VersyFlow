/**
 * Local test backend client.
 *
 * In mock mode the app never talks to Supabase. Instead, every meaningful
 * interaction (login, memorization, review rating, navigation, settings
 * change, error…) is spooled here and pushed to the tiny local API in
 * `server/mock-api.mjs` — which stores it as JSONL and renders a dashboard.
 * That is the "collect manual test data" half of the frontend-only mode.
 *
 * Design constraints:
 *   - never break the UI : every failure is swallowed and the event stays
 *     queued for the next flush,
 *   - offline-safe : the queue is persisted in localStorage, so closing the
 *     tab (or running without the API server) loses nothing,
 *   - same-origin : the base URL is a *relative* path (`/api`) proxied by
 *     Vite, so it also works behind the sandbox HTTPS preview where
 *     `localhost` is not reachable from the browser.
 */

import { isMockMode } from './mode';
import type { MockDbSnapshot } from './mock/db';

export const OUTBOX_STORAGE_KEY = 'versyflow:mock:outbox:v1';
const SESSION_STORAGE_KEY = 'versyflow:mock:session-id';
const MAX_QUEUE = 500;
const FLUSH_INTERVAL_MS = 3_000;
const FLUSH_DEBOUNCE_MS = 500;

export interface TestEvent {
  id: string;
  /** Dotted event name, e.g. `review.rated`, `nav.visit`, `auth.login`. */
  type: string;
  at: number;
  sessionId: string;
  payload?: Record<string, unknown>;
}

export type BackendHealth = 'unknown' | 'online' | 'offline';

export interface LocalBackendStats {
  health: BackendHealth;
  baseUrl: string;
  queued: number;
  sent: number;
  failed: number;
  lastSentAt: number | null;
  lastError: string | null;
  enabled: boolean;
}

function readEnv(): Record<string, string | undefined> {
  try {
    return (
      (import.meta as unknown as { env?: Record<string, string | undefined> })
        .env ?? {}
    );
  } catch {
    return {};
  }
}

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = `sess_${randomId().slice(0, 8)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return 'sess_unknown';
  }
}

/**
 * Base URL of the local API.
 * `VITE_MOCK_API_URL` lets you point at a remote collector; the default is
 * the Vite-proxied `/api` path (see `vite.config.ts` → `server.proxy`).
 */
export function localBackendBaseUrl(): string {
  const env = readEnv();
  return (env.VITE_MOCK_API_URL || '/api').replace(/\/$/, '');
}

/**
 * Collection is only active in mock mode (never in live/cloud builds), and
 * can be disabled explicitly with `VITE_MOCK_API=off`.
 */
export function localBackendEnabled(): boolean {
  if (!isMockMode()) return false;
  const env = readEnv();
  if (env.VITE_MOCK_API === 'off' || env.VITE_MOCK_API === 'false') return false;
  return true;
}

type StatsListener = (stats: LocalBackendStats) => void;

class LocalBackendClient {
  private queue: TestEvent[] = [];
  private listeners = new Set<StatsListener>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private session = sessionId();

  private stats: LocalBackendStats = {
    health: 'unknown',
    baseUrl: localBackendBaseUrl(),
    queued: 0,
    sent: 0,
    failed: 0,
    lastSentAt: null,
    lastError: null,
    enabled: localBackendEnabled(),
  };

  constructor() {
    this.loadQueue();
    if (typeof window === 'undefined') return;
    this.interval = setInterval(() => {
      if (this.queue.length > 0) void this.flush();
    }, FLUSH_INTERVAL_MS);
    // Best-effort last push when the tab is closed / reloaded.
    window.addEventListener('pagehide', () => {
      if (this.queue.length === 0) return;
      void this.flush({ useBeacon: true });
    });
  }

  // ------------------------------------------------------------------
  // Queue persistence
  // ------------------------------------------------------------------

  private loadQueue(): void {
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.queue = parsed.filter(
          (e): e is TestEvent =>
            typeof e === 'object' &&
            e !== null &&
            typeof (e as TestEvent).type === 'string',
        );
      }
    } catch {
      this.queue = [];
    }
    this.stats.queued = this.queue.length;
  }

  private persistQueue(): void {
    try {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(this.queue));
    } catch {
      /* quota — the in-memory queue is still usable */
    }
    this.stats.queued = this.queue.length;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.stats });
      } catch {
        /* ignore */
      }
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer || !this.stats.enabled) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /** Record an event. Never throws. */
  record(type: string, payload?: Record<string, unknown>): void {
    if (!this.stats.enabled) return;
    this.queue.push({
      id: randomId(),
      type,
      at: Date.now(),
      sessionId: this.session,
      payload,
    });
    if (this.queue.length > MAX_QUEUE) {
      this.queue.splice(0, this.queue.length - MAX_QUEUE);
      this.stats.failed += 1;
      this.stats.lastError = 'File saturée — événements les plus anciens abandonnés.';
    }
    this.persistQueue();
    this.emit();
    this.scheduleFlush();
  }

  /** Push everything that is queued. Safe to call concurrently. */
  async flush(options: { useBeacon?: boolean } = {}): Promise<{ sent: number }> {
    if (!this.stats.enabled || this.flushing || this.queue.length === 0) {
      return { sent: 0 };
    }
    this.flushing = true;
    const batch = this.queue.slice(0, 100);
    const url = `${this.stats.baseUrl}/events`;

    try {
      if (options.useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ events: batch })], {
          type: 'application/json',
        });
        navigator.sendBeacon(url, blob);
        // Beacon gives no receipt: treat as delivered to avoid duplicates.
        this.dequeue(batch.length);
        this.stats.sent += batch.length;
        this.stats.lastSentAt = Date.now();
        this.stats.health = 'online';
        this.emit();
        return { sent: batch.length };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.dequeue(batch.length);
      this.stats.sent += batch.length;
      this.stats.lastSentAt = Date.now();
      this.stats.health = 'online';
      this.stats.lastError = null;
      this.emit();
      if (this.queue.length > 0) this.scheduleFlush();
      return { sent: batch.length };
    } catch (error) {
      this.stats.health = 'offline';
      this.stats.failed += batch.length;
      this.stats.lastError =
        error instanceof Error ? error.message : 'API locale injoignable';
      this.emit();
      return { sent: 0 };
    } finally {
      this.flushing = false;
    }
  }

  private dequeue(count: number): void {
    this.queue.splice(0, count);
    this.persistQueue();
  }

  /** Send a full snapshot of the mock database to the collector. */
  async pushSnapshot(snapshot: MockDbSnapshot): Promise<boolean> {
    if (!this.stats.enabled) return false;
    try {
      const response = await fetch(`${this.stats.baseUrl}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, sessionId: this.session }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.stats.health = 'online';
      this.stats.lastError = null;
      this.emit();
      return true;
    } catch (error) {
      this.stats.health = 'offline';
      this.stats.lastError =
        error instanceof Error ? error.message : 'API locale injoignable';
      this.emit();
      return false;
    }
  }

  /** Probe `GET /health` (used by the Dev panel). */
  async checkHealth(): Promise<BackendHealth> {
    if (!this.stats.enabled) {
      this.stats.health = 'offline';
      this.emit();
      return 'offline';
    }
    try {
      const response = await fetch(`${this.stats.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      this.stats.health = response.ok ? 'online' : 'offline';
      this.stats.lastError = response.ok ? null : `HTTP ${response.status}`;
    } catch (error) {
      this.stats.health = 'offline';
      this.stats.lastError =
        error instanceof Error ? error.message : 'API locale injoignable';
    }
    this.emit();
    return this.stats.health;
  }

  /** Read the latest events stored by the collector (for the Dev panel). */
  async recentEvents(limit = 15): Promise<TestEvent[]> {
    if (!this.stats.enabled) return [];
    try {
      const response = await fetch(
        `${this.stats.baseUrl}/events?limit=${limit}&order=desc`,
        { headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (typeof body !== 'object' || body === null) return [];
      const events = (body as { events?: unknown }).events;
      return Array.isArray(events) ? (events as TestEvent[]) : [];
    } catch (error) {
      this.stats.lastError =
        error instanceof Error ? error.message : 'API locale injoignable';
      this.stats.health = 'offline';
      this.emit();
      return [];
    }
  }

  clearQueue(): void {
    this.queue = [];
    this.persistQueue();
    this.emit();
  }

  getStats(): LocalBackendStats {
    return { ...this.stats };
  }

  /** The dashboard URL (proxied by Vite under `/mock-dashboard`). */
  dashboardUrl(): string {
    const env = readEnv();
    return env.VITE_MOCK_DASHBOARD_URL || '/mock-dashboard/';
  }

  subscribe(listener: StatsListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.stats });
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Stop the background timers (tests / hot-reload cleanup). */
  dispose(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.interval = null;
    this.flushTimer = null;
    this.listeners.clear();
  }
}

export const localBackend = new LocalBackendClient();

/** Fire-and-forget event capture. Never throws, never blocks the UI. */
export function recordTestEvent(
  type: string,
  payload?: Record<string, unknown>,
): void {
  localBackend.record(type, payload);
}

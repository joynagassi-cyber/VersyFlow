/**
 * SyncUserIdProvider — Port for resolving the authenticated user id.
 *
 * The PowerSync repositories need a stable `user_id` to scope local writes
 * (sync invariant: "local writes MUST set user_id ownership"). The domain
 * and infrastructure layers must not import the concrete
 * `SupabaseAuthService` — they consume this narrow port, which a
 * composition root wires to `SupabaseAuthService.getCurrentUser()`.
 *
 * `resolveUserId()` returns the current user's `id` (UUID) or `null` when no
 * session is active (offline first-launch, before login). Repositories that
 * write local rows must fail fast when it is `null`, because an unowned row
 * would break RLS and the upsert uniqueness constraint.
 */
export interface ISyncUserIdProvider {
  /**
   * Resolve the current user id. `null` means no authenticated session —
   * callers must not write to a PowerSync table in that case.
   */
  resolveUserId(): Promise<string | null>;
}

/**
 * Adapter that delegates to an async `() => Promise<string | null>` — the
 * shape of `SupabaseAuthService.getCurrentUser()?.id`.
 *
 * Thin so that tests can stub it with an in-memory closure without pulling
 * in Supabase.
 */
export class CachingSyncUserIdProvider implements ISyncUserIdProvider {
  private lastId: string | null = null;

  constructor(private readonly resolve: () => Promise<string | null>) {}

  /**
   * Resolve the user id. The last successful value is cached in-memory so
   * that repeated writes within a session do not hit `getSession()` every
   * time. A `null` result clears the cache (logout detection).
   */
  async resolveUserId(): Promise<string | null> {
    const id = await this.resolve();
    this.lastId = id ?? null;
    return this.lastId;
  }

  /**
   * Clear the cache — call on logout or session invalidation.
   */
  invalidate(): void {
    this.lastId = null;
  }
}

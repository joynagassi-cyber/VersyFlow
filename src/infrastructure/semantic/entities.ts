/**
 * `@semantic-verse/entities` — shared structural result types for the
 * semantic layer (Stage B).
 *
 * Consumed by `src/infrastructure/semantic/db.ts` (the in-app / build
 * driver-side validator). Mirrored as plain row types in
 * `src/infrastructure/semantic/types.ts` when the semantic domain lands
 * in-app (Stage C+).
 */

/** Result of a single deterministic invariant check (Stage H style). */
export interface CheckResult {
  /** Stable, human-readable check name (e.g. 'no-self-loops:concept_relations'). */
  name: string;
  /** Whether the invariant held. */
  passed: boolean;
  /** One-line detail — 'ok' when passed, otherwise a count / ratio. */
  detail: string;
}

/** Aggregate summary of a whole validation run. */
export interface ValidationSummary {
  /** Every check that was executed, in declaration order. */
  checks: CheckResult[];
  /** True only when every check passed. */
  passed: boolean;
}

/**
 * LLM port — documented no-op hook (decision: LLM deferred entirely).
 *
 * No `ollama` binary or model exists on this box, and a JS-quantized small
 * LLM via transformers.js would add a multi-MB runtime dep and CPU-bound
 * latency to an offline-first mobile app. So every LLM call site in the
 * pipeline (Stage E ambiguous-band role, Stage G community naming) is
 * routed through this port instead of a concrete model.
 *
 * `NoopLlmPort` returns `null` for every request. Both call sites are
 * already coded to treat `null` as "keep the deterministic fallback /
 * mark unresolved", so the whole pipeline ships deterministic-only with a
 * clean seam to plug in Ling or any provider later:
 *
 *   - Stage E: a verse with a single candidate concept in the 0.6–0.8
 *     confidence band asks the port for a role; `null` → status stays
 *     'unresolved', surfaced for user confirmation.
 *   - Stage G: a structurally-validated community asks the port for a name;
 *     `null` → the deterministic label (top anchor concept's
 *     `canonicalLabel`) is used instead.
 *
 * Constraints any real implementation MUST honor (enforced at the call
 * sites, not here):
 *   - `nameCommunity`: name ≤ 6 words, reuses at least one anchor concept's
 *     label verbatim, introduces no entity absent from the community.
 *   - `assignRole`: may only CONTRAST / lower confidence via user
 *     confirmation — never auto-accept CONTRAST.
 */

import type { ConceptRole } from './helpers';

export interface CommunityNamingInput {
  /** Structurally-validated community (Stage G step 1 already ran). */
  community: {
    id: string;
    size: number;
    coherence: number;
    /** Top-3 anchor concepts, deterministically ranked by degree. */
    anchorConcepts: Array<{ key: string; label: string; degree: number }>;
    /** Labels of every concept in the community (constraint check). */
    memberLabels: string[];
  };
}

export interface RoleAssignmentInput {
  verseId: string;
  verseText?: string;
  conceptKey: string;
  conceptLabel: string;
  /** Deterministic single-best score in [0,1] (0.6–0.8 band to trigger). */
  confidence: number;
}

/**
 * LLM port. Implementations must be deterministic-friendly (pure or
 * injectable clock) and return `null` on ANY failure — callers keep the
 * deterministic fallback.
 */
export interface ILlmPort {
  /**
   * Propose a name for a structurally-validated community.
   * Returns `null` when no acceptable name can be produced (the caller
   * then uses the deterministic label).
   */
  nameCommunity(input: CommunityNamingInput): Promise<string | null>;

  /**
   * Assign a verse↔concept role in the ambiguous confidence band.
   * Returns `null` when uncertain — the row stays 'unresolved'.
   */
  assignRole(input: RoleAssignmentInput): Promise<ConceptRole | null>;
}

/**
 * The shipped no-op port. Every call resolves to `null` immediately,
 * keeping the app fully offline-first with zero model payload.
 */
export class NoopLlmPort implements ILlmPort {
  async nameCommunity(_input: CommunityNamingInput): Promise<string | null> {
    return null;
  }

  async assignRole(_input: RoleAssignmentInput): Promise<ConceptRole | null> {
    return null;
  }
}

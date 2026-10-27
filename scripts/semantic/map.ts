/**
 * Stage E — Map (DETERMINISTIC with an LLM fallback ONLY).
 *
 * Attaches NEUU / seed verse references to concepts with a role:
 *
 *  - PRIMARY: the verse is the concept's head verse in the dataset.
 *  - SECONDARY: a supporting verse listed under the concept.
 *  - RELATED:  the verse reaches the concept via a shared crossref edge.
 *  - CONTRAST: only ever from a dataset contradiction flag (the current
 *    datasets carry none, so CONTRAST stays LLM-only).
 *
 * The ONLY LLM trigger in the whole pipeline (decision phase): a verse in
 * the user's active memorization set matches exactly one candidate concept
 * whose deterministic score sits in the ambiguous 0.6–0.8 band AND no role
 * was assigned by the rules above. The LLM port (default: `NoopLlmPort`,
 * documented no-op) may answer PRIMARY / SECONDARY / RELATED / CONTRAST; a
 * CONTRAST answer or a confidence drop below 0.6 marks the row
 * 'unresolved' for user confirmation — CONTRAST is never auto-accepted.
 * No LLM call is made at all when the deterministic score is ≥ 0.8
 * (PRIMARY/SECONDARY accepted as-is) or when zero candidates exist.
 */

import type { ConceptRole } from './helpers';
import type { ILlmPort } from './llm-port';
import { detUuid } from './helpers';

export interface MapInput {
  /** conceptKey → its deterministic verse attachments. */
  refs: Array<{
    conceptKey: string;
    verseId: string;
    /** 'head' → PRIMARY rule; 'support' → SECONDARY rule; 'xref' → RELATED rule. */
    refKind: 'head' | 'support' | 'xref';
    confidence: number;
  }>;
  /** User's active memorization set (canonical verse keys). */
  activeVerses?: string[];
  /**
   * Candidate matches for active verses: verseId → exactly-one best
   * candidate (the ambiguous-band case). Keys that are absent from this
   * map never trigger an LLM call.
   */
  candidates?: Record<string, { conceptKey: string; score: number }>;
}

export interface MapRow {
  id: string;
  verseId: string;
  conceptKey: string;
  role: ConceptRole;
  confidence: number;
  source: string;
  /** 'rule' = deterministic, 'llm' = LLM-assigned, 'unresolved' = needs user. */
  status: 'accepted' | 'unresolved';
  llmAsked: boolean;
}

export interface MapResult {
  rows: MapRow[];
  llmCalls: number;
  unresolved: number;
  autoAccepted: number;
  stats: Record<string, number>;
}

const ROLE_BY_REF_KIND: Record<MapInput['refs'][number]['refKind'], ConceptRole> = {
  head: 'PRIMARY',
  support: 'SECONDARY',
  xref: 'RELATED',
};

/** Score threshold above which the deterministic answer is accepted as-is. */
const HIGH_SCORE = 0.8;
/** Lower edge of the ambiguous band (LLM may be consulted above this). */
const BAND_LOW = 0.6;

/**
 * Deterministic pass + LLM fallback. Pure: no clock, no I/O; the LLM port
 * is injected and its async results awaited by the caller (`run.ts` is
 * async; tests call the inner `mapDeterministic` directly for sync checks).
 */
export async function mapVerseRoles(input: MapInput, port: ILlmPort, now: string): Promise<MapResult> {
  const active = new Set(input.activeVerses ?? []);
  const rows: MapRow[] = [];
  let llmCalls = 0;
  let unresolved = 0;
  let autoAccepted = 0;

  for (const ref of input.refs) {
    const role = ROLE_BY_REF_KIND[ref.refKind];
    const id = detUuid(`stage-e-vc:${ref.conceptKey}:${ref.verseId}:${role}`);
    const deterministic = ref.confidence >= HIGH_SCORE;

    if (ref.refKind === 'head') {
      // Head verses always accept PRIMARY deterministically.
      rows.push({
        id,
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        role,
        confidence: Math.max(ref.confidence, HIGH_SCORE),
        source: 'stage-E:rule',
        status: 'accepted',
        llmAsked: false,
      });
      autoAccepted++;
      continue;
    }

    // Non-head refs: deterministic accept when score is high, or when the
    // verse is not in the active memorization set (no user in the loop).
    if (deterministic || !active.has(ref.verseId)) {
      rows.push({
        id,
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        role,
        confidence: ref.confidence,
        source: 'stage-E:rule',
        status: deterministic ? 'accepted' : 'unresolved',
        llmAsked: false,
      });
      if (deterministic) autoAccepted++;
      else unresolved++;
      continue;
    }

    // Active verse, score in the ambiguous band (or below). Only the
    // exactly-one-candidate case may ask the LLM.
    const candidate = input.candidates?.[ref.verseId];
    const singleBest =
      candidate &&
      candidate.conceptKey === ref.conceptKey &&
      candidate.score >= BAND_LOW &&
      candidate.score < HIGH_SCORE;

    if (singleBest) {
      llmCalls++;
      const answer = await port.assignRole({
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        conceptLabel: candidate.conceptKey,
        confidence: candidate.score,
      });
      if (answer === 'CONTRAST' || answer === null || candidate.score < BAND_LOW) {
        // CONTRAST is never auto-accepted; low confidence also defers.
        rows.push({
          id,
          verseId: ref.verseId,
          conceptKey: ref.conceptKey,
          role,
          confidence: candidate.score,
          source: 'stage-E:llm',
          status: 'unresolved',
          llmAsked: true,
        });
        unresolved++;
      } else {
        rows.push({
          id,
          verseId: ref.verseId,
          conceptKey: ref.conceptKey,
          role: answer ?? role,
          confidence: candidate.score,
          source: 'stage-E:llm',
          status: 'accepted',
          llmAsked: true,
        });
        autoAccepted++;
      }
    } else {
      // No LLM trigger (zero or multiple candidates, or score out of band).
      rows.push({
        id,
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        role,
        confidence: ref.confidence,
        source: 'stage-E:rule',
        status: 'unresolved',
        llmAsked: false,
      });
      unresolved++;
    }
  }

  return {
    rows,
    llmCalls,
    unresolved,
    autoAccepted,
    stats: {
      refs: input.refs.length,
      llm_calls: llmCalls,
      auto_accepted: autoAccepted,
      unresolved,
    },
  };
}

/**
 * Synchronous, LLM-free subset of `mapVerseRoles` (used by unit tests and
 * by the deterministic-only path when no candidates are supplied).
 *
 * A row is 'accepted' when its role came from a deterministic rule at
 * high confidence (≥ 0.8) or from the head-verse rule; otherwise it stays
 * 'unresolved' for user confirmation (no LLM involved in this function).
 */
export function mapDeterministic(input: MapInput, now: string): MapResult {
  void now;
  const active = new Set(input.activeVerses ?? []);
  const rows: MapRow[] = [];
  let unresolved = 0;
  let autoAccepted = 0;

  for (const ref of input.refs) {
    const role = ROLE_BY_REF_KIND[ref.refKind];
    const id = detUuid(`stage-e-vc:${ref.conceptKey}:${ref.verseId}:${role}`);
    const headRule = ref.refKind === 'head';
    const highConfidence = ref.confidence >= HIGH_SCORE;
    if (headRule || highConfidence || !active.has(ref.verseId)) {
      const accepted = headRule || highConfidence;
      rows.push({
        id,
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        role,
        confidence: ref.confidence,
        source: 'stage-E:rule',
        status: accepted ? 'accepted' : 'unresolved',
        llmAsked: false,
      });
      if (accepted) autoAccepted++;
      else unresolved++;
    } else {
      rows.push({
        id,
        verseId: ref.verseId,
        conceptKey: ref.conceptKey,
        role,
        confidence: ref.confidence,
        source: 'stage-E:rule',
        status: 'unresolved',
        llmAsked: false,
      });
      unresolved++;
    }
  }

  return {
    rows,
    llmCalls: 0,
    unresolved,
    autoAccepted,
    stats: { refs: input.refs.length, llm_calls: 0, auto_accepted: autoAccepted, unresolved },
  };
}

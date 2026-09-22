/**
 * Stage D — Lexical equivalence table (DETERMINISTIC, no LLM).
 *
 * Hand-curated synonym families that Jaccard similarity alone cannot fold:
 * the variants share little surface text ("lowliness" vs "humility" has
 * Jaccard 0, yet they are the same concept family in the source
 * concordance datasets). Each entry names the canonical winner label plus
 * the variant labels that must fold onto it.
 *
 * Matching is done on the normalized form `casefold(stripDiacritics(label))`
 * — the exact same normalization Stage B uses — so accents and case never
 * escape the table. Groups are structurally disjoint (no label appears in
 * two entries; see the invariant check below), which is what keeps the
 * Stage D pass total: one label maps to at most one canonical term.
 *
 * Confidence / source policy (mirrors the schema convention that every
 * `concept_relations` / `verse_concepts` row carries both):
 *   - confidence: 0.9, stamped by the caller (`EQUIVALENCE_CONFIDENCE`)
 *   - source:     'manual-equivalence-table'
 * The table itself stores no confidence — it is pure data. Provenance
 * (the original terms) is preserved by the caller, not dropped here.
 */

import { casefold, stripDiacritics } from './helpers';

export interface EquivalenceEntry {
  /** The winner label a merge should keep (display form). */
  canonicalTerm: string;
  /** Variant labels that fold onto `canonicalTerm` (display forms). */
  variants: string[];
}

/**
 * The curated table. Keep it sorted by `canonicalTerm` (case-insensitive)
 * — determinism and reviewability both depend on the order being stable.
 */
export const EQUIVALENCE_TABLE: EquivalenceEntry[] = [
  {
    canonicalTerm: 'Grace',
    variants: ['Favor', 'Grace of God'],
  },
  {
    canonicalTerm: 'Humility',
    variants: ['Humbleness', 'Lowliness', 'Meekness'],
  },
  {
    canonicalTerm: 'Love',
    variants: ['Agape', 'Charity'],
  },
  {
    canonicalTerm: 'Repentance',
    variants: ['Repent', 'Penitence', 'Metanoia'],
  },
  {
    canonicalTerm: 'Worship',
    variants: ['Worshipping', 'Adoration'],
  },
];

// ---------------------------------------------------------------------------
// Invariants (run once at module load — a corrupt table is a build error,
// not a silent mis-merge)
// ---------------------------------------------------------------------------

/** Normalize a label the way the rest of Stage D does. */
export function normalizeEquivalenceTerm(label: string): string {
  return stripDiacritics(casefold(String(label).trim()));
}

function assertTableInvariants(table: EquivalenceEntry[]): void {
  const seen = new Map<string, string>();
  for (const e of table) {
    const all = [e.canonicalTerm, ...e.variants];
    for (const raw of all) {
      const n = normalizeEquivalenceTerm(raw);
      if (n.length === 0) {
        throw new Error(`[equivalence] empty label in entry "${e.canonicalTerm}"`);
      }
      const owner = seen.get(n);
      if (owner !== undefined && owner !== e.canonicalTerm) {
        throw new Error(
          `[equivalence] label "${raw}" appears in two entries ("${owner}" and ` +
            `"${e.canonicalTerm}") — groups must be disjoint`
        );
      }
      seen.set(n, e.canonicalTerm);
    }
  }
}

assertTableInvariants(EQUIVALENCE_TABLE);

// ---------------------------------------------------------------------------
// Lookup index (normalized label → entry). Built once; every lookup is a
// hash, so the Stage D pass stays O(n).
// ---------------------------------------------------------------------------

const INDEX = new Map<string, EquivalenceEntry>();
for (const e of EQUIVALENCE_TABLE) {
  const canon = normalizeEquivalenceTerm(e.canonicalTerm);
  INDEX.set(canon, e);
  for (const v of e.variants) {
    INDEX.set(normalizeEquivalenceTerm(v), e);
  }
}

/**
 * Resolve a label to its equivalence entry, or null when the label is not
 * part of any family. Pure — safe to call in hot loops.
 */
export function lookupEquivalence(label: string): EquivalenceEntry | null {
  const n = normalizeEquivalenceTerm(label);
  return INDEX.get(n) ?? null;
}

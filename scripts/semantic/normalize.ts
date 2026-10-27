/**
 * Stage D — Normalize (DETERMINISTIC, no LLM).
 *
 * Deduplicates concepts and merges their edges:
 *
 *  1. Lexical-equivalence merging — the curated table in
 *     `equivalence.ts` folds known synonym families onto one canonical
 *     winner (e.g. humility ~ humbleness ~ lowliness → `Humility`,
 *     confidence 0.9, source `manual-equivalence-table`). Merges only
 *     when at least two concepts of the family are actually present —
 *     never mints a concept that was not in the input.
 *  2. Canonical-key matching — two concepts with the same
 *     `casefold(stripAccents(label))` are merged (the alias table already
 *     collapsed most of these at Stage B; this is the catch-all).
 *  3. String-similarity merging — Jaccard ≥ 0.85 over word sets folds a
 *     loser into its nearest winner (ties broken by lexicographic key,
 *     fully deterministic).
 *  4. Edge merging — relations whose both endpoints were folded are
 *     re-keyed to the winners; parallel edges on the same
 *     (from, to, type) triple keep the MAX confidence (deterministic:
 *     first-seen order, max wins); self-edges after folding are dropped
 *     (schema CHECK `from_concept_id <> to_concept_id`).
 *
 * Provenance: original source terms survive every merge. Each output
 * concept carries a `provenance` array with one entry per surviving
 * original label (`{ term, source, language }`), so a folded family like
 * `Humbleness → Humility` is fully auditable — nothing is silently
 * rewritten.
 *
 * Also recomputes denormalized counters (per-concept degree) that Stage G
 * consumes for anchor ranking.
 */

import { casefold, jaccard, stripDiacritics } from './helpers';
import { EQUIVALENCE_TABLE, lookupEquivalence, type EquivalenceEntry } from './equivalence';

/** Confidence stamped on every merge coming from the equivalence table. */
export const EQUIVALENCE_CONFIDENCE = 0.9;
/** Provenance source tag stamped on equivalence-table merges. */
export const EQUIVALENCE_SOURCE = 'manual-equivalence-table';

export interface NormalizeConcept {
  key: string;
  label: string;
  labelsByLanguage?: Record<string, string>;
}

/** One surviving original term, preserved on every merge (provenance). */
export interface ProvenanceEntry {
  /** The original label exactly as it appeared in the input. */
  term: string;
  /** The concept's own source tag (`nave`, `torrey`, `seed`, …). */
  source?: string;
  /** The language of the surviving label; 'en' when unknown. */
  language: string;
}

export interface NormalizeEdge {
  fromKey: string;
  toKey: string;
  relationType: string;
  confidence: number;
  source?: string;
}

export interface DedupResult {
  /**
   * winner key → merged concept (labels merged, first-seen order). The
   * `provenance` array holds every surviving original term.
   */
  concepts: Record<string, NormalizeConcept & { provenance: ProvenanceEntry[] }>;
  /** loser key → winner key. */
  folded: Record<string, string>;
  /** Merged edges, re-keyed to winners, de-duplicated. */
  edges: Array<{
    fromKey: string;
    toKey: string;
    relationType: string;
    confidence: number;
    source: string;
  }>;
  /** winner key → degree (in + out), for Stage G anchor ranking. */
  degree: Record<string, number>;
  /**
   * Seed labels: original concept key → winner key carrying that
   * concept's `labelsByLanguage`. Lets Stage G's deterministic naming
   * fallback resolve a re-keyed winner (e.g. `canon:love`) back to its
   * seed label ("Love") instead of a raw `canon:` token.
   */
  seedLabels: Record<string, string>;
  stats: Record<string, number>;
}

export function dedupConcepts(
  concepts: NormalizeConcept[],
  edges: NormalizeEdge[],
  opts: {
    similarityThreshold?: number;
    /**
     * Explicit per-concept provenance (`{ key: { source?, language? } }`).
     * When omitted, provenance is derived from each label's own `key`
     * (`nave:humility` → source 'nave', language 'en').
     */
    provenance?: Record<string, { source?: string; language?: string }>;
  } = {}
): DedupResult {
  const threshold = opts.similarityThreshold ?? 0.85;
  const explicitProvenance = opts.provenance ?? {};

  const provenanceOf = (c: NormalizeConcept): ProvenanceEntry => {
    const p = explicitProvenance[c.key];
    const src = p?.source ?? (c.key.split(':')[0] || undefined);
    return {
      term: c.label,
      source: src,
      language: p?.language ?? 'en',
    };
  };

  // 0. Lexical-equivalence merging (deterministic table, no LLM).
  //    A family only fires when ≥ 2 of its members are present; the
  //    first-seen member in input order is the winner, the rest fold in.
  //    Groups are disjoint (a normalized label matches exactly one entry),
  //    so nothing is folded twice here. `folded` is the single resolution
  //    map from this point on — `resolveTop` follows it.
  const folded: Record<string, string> = {};
  /** Original key → the equivalence entry that folded it (per-merge provenance). */
  const equivalenceMerges: Record<string, EquivalenceEntry> = {};
  let equivalenceFoldCount = 0;
  const groupFirst = new Map<string, number>();
  concepts.forEach((c, idx) => {
    const hit = lookupEquivalence(c.label);
    if (!hit) return;
    const first = groupFirst.get(hit.canonicalTerm);
    if (first === undefined) {
      groupFirst.set(hit.canonicalTerm, idx);
      return;
    }
    folded[c.key] = concepts[first].key;
    equivalenceMerges[c.key] = hit;
    equivalenceFoldCount++;
  });

  // 1. Canonical-key matching (skips keys already folded in step 0, and
  //    skips equivalence-table members: they stay in the ORIGINAL key
  //    space, keyed by first-seen winner — see `equivalenceWinners`).
  const byKey = new Map<string, NormalizeConcept>();
  /** Original concept key → canonical winner key (`canon:<casefold>`). */
  const canonOf = new Map<string, string>();
  /**
   * Seed labels: original concept key → the winner key that carries its
   * `labelsByLanguage`. Winners keep the original's per-language labels
   * (first-seen wins per language), so Stage G's deterministic naming
   * fallback can resolve a winner back to its seed label.
   */
  const seedOf = new Map<string, string>();
  for (const c of concepts) {
    if (folded[c.key]) continue; // equivalence fold already recorded it
    if (lookupEquivalence(c.label)) continue; // equivalence winner
    const ck = casefold(stripDiacritics(c.label));
    const winnerKey = `canon:${ck}`;
    const existing = byKey.get(winnerKey);
    if (!existing) {
      byKey.set(winnerKey, { ...c, key: winnerKey });
      canonOf.set(c.key, winnerKey);
      seedOf.set(c.key, winnerKey);
    } else {
      folded[c.key] = winnerKey;
      canonOf.set(c.key, winnerKey);
      seedOf.set(c.key, winnerKey);
      // Merge labels: first-seen order wins per language.
      for (const [lang, lbl] of Object.entries(c.labelsByLanguage ?? {})) {
        if (!existing.labelsByLanguage) existing.labelsByLanguage = {};
        if (!existing.labelsByLanguage[lang]) existing.labelsByLanguage[lang] = lbl;
      }
    }
  }

  // Equivalence winners keep their ORIGINAL key (they never enter `byKey`
  // or `canonOf`), so they get their own label record here; losers'
  // `labelsByLanguage` is absorbed onto it.
  const equivalenceWinners = new Map<string, NormalizeConcept>();
  for (const c of concepts) {
    if (folded[c.key]) continue; // losers were handled in step 0/1
    if (lookupEquivalence(c.label)) equivalenceWinners.set(c.key, { ...c });
  }
  // The equivalence winner's seed record lives under its original key.
  for (const k of equivalenceWinners.keys()) seedOf.set(k, k);
  // Fold each equivalence loser's per-language labels onto the winner's
  // record (first-seen order wins per language, as everywhere else).
  for (const c of concepts) {
    const top = folded[c.key];
    if (!top) continue;
    const winObj = equivalenceWinners.get(top) ?? byKey.get(top);
    if (!winObj) continue;
    for (const [lang, lbl] of Object.entries(c.labelsByLanguage ?? {})) {
      if (!winObj.labelsByLanguage) winObj.labelsByLanguage = {};
      if (!winObj.labelsByLanguage[lang]) winObj.labelsByLanguage[lang] = lbl;
    }
  }

  // 2. String-similarity pass over the surviving keys.
  const survivors: Array<[string, NormalizeConcept]> = [
    ...byKey.entries(),
    ...equivalenceWinners.entries(),
  ];
  for (let i = 0; i < survivors.length; i++) {
    const [winnerKey, winner] = survivors[i];
    for (let j = i + 1; j < survivors.length; j++) {
      const [otherKey, other] = survivors[j];
      if (folded[otherKey]) continue;
      if (folded[winnerKey]) {
        // winner itself was folded; fold the whole other group into the
        // winner's own top (the label record is updated in place).
        const top = resolveTop(folded, winnerKey);
        folded[otherKey] = top;
        mergeLabels(top, otherKey);
        continue;
      }
      const sim = jaccard(winner.label, other.label);
      if (sim >= threshold) {
        // Lexicographic tie-break: the lower CANONICAL key wins. The
        // loser group's original keys fold onto the winner's entry.
        const winKey = winnerKey < otherKey ? winnerKey : otherKey;
        const loseKey = winnerKey < otherKey ? otherKey : winnerKey;
        folded[loseKey] = winKey;
        mergeLabels(winKey, loseKey);
      }
    }
  }

  // Resolve any key (original or canonical) to its final top winner.
  const topFor = (key: string): string =>
    resolveTop(folded, canonOf.get(key) ?? key);

  function mergeLabels(win: string, lose: string): void {
    const winObj = byKey.get(win) ?? equivalenceWinners.get(win);
    const loseObj = byKey.get(lose) ?? equivalenceWinners.get(lose);
    if (winObj && loseObj) {
      for (const [lang, lbl] of Object.entries(loseObj.labelsByLanguage ?? {})) {
        if (!winObj.labelsByLanguage) winObj.labelsByLanguage = {};
        if (!winObj.labelsByLanguage[lang]) winObj.labelsByLanguage[lang] = lbl;
      }
    }
  }

  // 3. Edge merging: re-key endpoints to their top winner, dedup on
  //    (from, to, type) keeping the max confidence, drop self-edges.
  //    Endpoints are re-keyed to CANONICAL keys (canon:<casefold>), which
  //    is the same key space as `concepts`/`degree`/`folded` below.
  const mergedMap = new Map<string, { fromKey: string; toKey: string; relationType: string; confidence: number; source: string }>();
  let selfDropped = 0;
  for (const e of edges) {
    const from = topFor(e.fromKey);
    const to = topFor(e.toKey);
    if (from === to) {
      selfDropped++;
      continue;
    }
    const tripleKey = `${from}|${to}|${e.relationType}`;
    const existing = mergedMap.get(tripleKey);
    if (!existing) {
      mergedMap.set(tripleKey, {
        fromKey: from,
        toKey: to,
        relationType: e.relationType,
        confidence: e.confidence,
        source: e.source ?? 'derived',
      });
    } else if (e.confidence > existing.confidence) {
      existing.confidence = e.confidence;
    }
  }
  const mergedEdges = Array.from(mergedMap.values());

  // 4. Degree recompute (denormalized counters for Stage G).
  const degree: Record<string, number> = {};
  for (const e of mergedEdges) {
    degree[e.fromKey] = (degree[e.fromKey] ?? 0) + 1;
    degree[e.toKey] = (degree[e.toKey] ?? 0) + 1;
  }
  for (const k of Object.keys(byKey)) degree[k] ??= 0;
  // Equivalence-folded original keys that survived as winners are not in
  // `byKey`; make sure they carry a degree counter too.
  const topWinners = new Set<string>();
  for (const c of concepts) topWinners.add(topFor(c.key));
  for (const k of topWinners) degree[k] ??= 0;

  // 5. Provenance: one entry per surviving original label, re-keyed to the
  //    final winner. Deterministic: input order, deduped on (term,language).
  const provByKey: Record<string, ProvenanceEntry[]> = {};
  for (const c of concepts) {
    const top = topFor(c.key);
    const arr = (provByKey[top] ??= []);
    const p = provenanceOf(c);
    if (!arr.some((x) => x.term === p.term && x.language === p.language)) arr.push(p);
  }

  const finalConcepts: Record<string, NormalizeConcept> = {};
  for (const [k, v] of byKey.entries()) {
    const top = topFor(k);
    if (top === k || folded[k] === undefined) finalConcepts[top] = v;
  }
  // Equivalence winners keep their original key and live in
  // `equivalenceWinners`, not `byKey` — surface them too.
  for (const [k, v] of equivalenceWinners.entries()) {
    finalConcepts[k] = v;
  }
  // Winners may have been folded into an even higher winner by the
  // similarity pass; re-key once more.
  const remap: Record<string, NormalizeConcept & { provenance: ProvenanceEntry[] }> = {};
  for (const [k, v] of Object.entries(finalConcepts)) {
    const top = topFor(k);
    remap[top] = { ...v, provenance: provByKey[top] ?? provenanceOf(v) };
  }

  return {
    concepts: remap,
    folded,
    edges: mergedEdges,
    degree,
    seedLabels: Object.fromEntries(seedOf),
    stats: {
      input_concepts: concepts.length,
      input_edges: edges.length,
      equivalence_merges: equivalenceFoldCount,
      folded: Object.keys(folded).length,
      output_concepts: Object.keys(remap).length,
      output_edges: mergedEdges.length,
      self_edges_dropped: selfDropped,
    },
  };
}

function resolveTop(folded: Record<string, string>, key: string): string {
  let cur = key;
  let guard = 0;
  while (folded[cur] !== undefined && guard++ < 32) cur = folded[cur];
  return cur;
}

/**
 * Re-exported for callers that want to surface the equivalence table in
 * a report (e.g. `data/bible/semantic/concepts/`). The table itself lives
 * in `equivalence.ts` — a deterministic, hand-curated list; confidence
 * and source are stamped by the caller via `EQUIVALENCE_CONFIDENCE` /
 * `EQUIVALENCE_SOURCE`.
 */
export { EQUIVALENCE_TABLE as EQUIVALENCE_CONCEPT_TABLE };

/** The per-merge provenance block stamped on folded concepts. */
export function equivalenceProvenance(entry: EquivalenceEntry): {
  canonicalTerm: string;
  confidence: number;
  source: string;
  variants: string[];
} {
  return {
    canonicalTerm: entry.canonicalTerm,
    confidence: EQUIVALENCE_CONFIDENCE,
    source: EQUIVALENCE_SOURCE,
    variants: entry.variants,
  };
}


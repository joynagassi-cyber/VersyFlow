/**
 * Stage D — Normalize (DETERMINISTIC, no LLM).
 *
 * Deduplicates concepts and merges their edges:
 *
 *  1. Canonical-key matching — two concepts with the same
 *     `casefold(stripAccents(label))` are merged (the alias table already
 *     collapsed most of these at Stage B; this is the catch-all).
 *  2. String-similarity merging — Jaccard ≥ 0.85 over word sets folds a
 *     loser into its nearest winner (ties broken by lexicographic key,
 *     fully deterministic).
 *  3. Edge merging — relations whose both endpoints were folded are
 *     re-keyed to the winners; parallel edges on the same
 *     (from, to, type) triple keep the MAX confidence (deterministic:
 *     first-seen order, max wins); self-edges after folding are dropped
 *     (schema CHECK `from_concept_id <> to_concept_id`).
 *
 * Also recomputes denormalized counters (per-concept degree) that Stage G
 * consumes for anchor ranking.
 */

import { casefold, jaccard, stripDiacritics } from './helpers';

export interface NormalizeConcept {
  key: string;
  label: string;
  labelsByLanguage?: Record<string, string>;
}

export interface NormalizeEdge {
  fromKey: string;
  toKey: string;
  relationType: string;
  confidence: number;
  source?: string;
}

export interface DedupResult {
  /** winner key → merged concept (labels merged, first-seen order). */
  concepts: Record<string, NormalizeConcept>;
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
  stats: Record<string, number>;
}

export function dedupConcepts(
  concepts: NormalizeConcept[],
  edges: NormalizeEdge[],
  opts: { similarityThreshold?: number } = {}
): DedupResult {
  const threshold = opts.similarityThreshold ?? 0.85;

  // 1. Canonical-key matching.
  const byKey = new Map<string, NormalizeConcept>();
  const folded: Record<string, string> = {};
  /** Original concept key → canonical winner key (`canon:<casefold>`). */
  const canonOf = new Map<string, string>();
  for (const c of concepts) {
    const ck = casefold(stripDiacritics(c.label));
    const winnerKey = `canon:${ck}`;
    const existing = byKey.get(winnerKey);
    if (!existing) {
      byKey.set(winnerKey, { ...c, key: winnerKey });
      canonOf.set(c.key, winnerKey);
    } else {
      folded[c.key] = winnerKey;
      canonOf.set(c.key, winnerKey);
      // Merge labels: first-seen order wins per language.
      for (const [lang, lbl] of Object.entries(c.labelsByLanguage ?? {})) {
        if (!existing.labelsByLanguage) existing.labelsByLanguage = {};
        if (!existing.labelsByLanguage[lang]) existing.labelsByLanguage[lang] = lbl;
      }
    }
  }

  // 2. String-similarity pass over the surviving keys.
  const survivors = Array.from(byKey.entries());
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
    const winObj = byKey.get(win);
    const loseObj = byKey.get(lose);
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

  const finalConcepts: Record<string, NormalizeConcept> = {};
  for (const [k, v] of byKey.entries()) {
    const top = topFor(k);
    if (top === k || folded[k] === undefined) finalConcepts[top] = v;
  }
  // Note: winners may have been folded into an even higher winner by the
  // similarity pass; re-key once more.
  const remap: Record<string, NormalizeConcept> = {};
  for (const [k, v] of Object.entries(finalConcepts)) {
    const top = topFor(k);
    remap[top] = v;
  }

  return {
    concepts: remap,
    folded,
    edges: mergedEdges,
    degree,
    stats: {
      input_concepts: concepts.length,
      input_edges: edges.length,
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

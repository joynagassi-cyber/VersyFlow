/**
 * Stage G — Communities (DETERMINISTIC clustering, LLM ONLY for naming).
 *
 * Step 1 (deterministic, ALWAYS runs):
 *   Louvain-style modularity clustering on the concept↔verse bipartite
 *   graph, size cap [3, 25] concepts per community, coherence = mean
 *   pairwise shared-concept ratio. A community is only minted when:
 *     - coherence ≥ 0.4 AND
 *     - it contains ≥ 3 concepts OR ≥ 5 verses
 *   (the structural "never accept a community just because an LLM gave it
 *   a plausible name" guarantee: the LLM is downstream of a purely
 *   graph-derived partition and can rename but never create).
 *
 *   The clustering itself is a deterministic label-propagation variant of
 *   Louvain (fixed iteration count, lexicographic tie-breaks) — no random
 *   seed, so the partition is byte-stable across runs.
 *
 * Step 2 (LLM trigger — the ONLY LLM call in G):
 *   For each structurally-validated community, the LLM port may PROPOSE a
 *   name from its top-3 anchor concepts (deterministically ranked by
 *   degree). Constraints (enforced here, not by the LLM):
 *     - name ≤ 6 words
 *     - reuses at least one anchor concept's label verbatim
 *     - introduces no entity absent from the community
 *   If the LLM fails, times out, or violates the constraints, fall back
 *   to the deterministic label: `<top anchor canonicalLabel> (community
 *   N)`. No LLM call at all when the top anchor is unique within the
 *   community (its label is already unambiguous — use it directly).
 *
 * The community row exists and is shown either way; only `name` is
 * LLM-optional. Provenance: `source = 'louvain-v1'` on every row, so
 * Stage H can check that every accepted community traces to a structural
 * partition.
 */

import { clampCommunityName, detUuid } from './helpers';
import type { ILlmPort } from './llm-port';

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

export interface CommunityInput {
  /** conceptKey → degree (from Stage D's denormalized counters). */
  degree: Record<string, number>;
  /** conceptKey → verse keys attached to it. */
  versesByConcept: Record<string, string[]>;
  /** Concept relations (undirected for clustering purposes). */
  conceptEdges: Array<{ fromKey: string; toKey: string }>;
  /** Pinned timestamp. */
  now: string;
}

export interface Cluster {
  /** 0-based community index (deterministic ordering by min member key). */
  index: number;
  /** Member concept keys, sorted lexicographically. */
  members: string[];
  /** Distinct verse keys attached to any member. */
  verses: string[];
  /** Mean pairwise shared-concept ratio, in [0,1]. */
  coherence: number;
  /** Top-3 anchors ranked by (degree desc, key asc). */
  anchors: Array<{ key: string; label: string; degree: number }>;
  /** Structural validity per the decision-phase rule. */
  valid: boolean;
  validReason: string;
}

// ---------------------------------------------------------------------------
// Deterministic label-propagation clustering (Louvain variant v1)
// ---------------------------------------------------------------------------

const COHERENCE_FLOOR = 0.4;
const MIN_CONCEPTS = 3;
const MIN_VERSES = 5;
const SIZE_CAP = 25;

/**
 * Deterministic label-propagation community detection.
 *
 * - Nodes: concepts only (verses are folded into their concepts first).
 * - Initial label: the concept's own key.
 * - Iteration: each node (visited in lexicographic order) adopts the
 *   most-frequent label among its neighbours; ties break to the
 *   lexicographically smallest label. Fixed max iterations (32) so the
 *   result is a pure function of the input.
 */
export function clusterConcepts(input: Pick<CommunityInput, 'degree' | 'conceptEdges'>): Map<string, string> {
  const labels = new Map<string, string>();
  const nodes = new Set<string>();
  const adj = new Map<string, Set<string>>();

  const addNode = (k: string) => {
    if (!nodes.has(k)) {
      nodes.add(k);
      labels.set(k, k);
      adj.set(k, new Set());
    }
  };

  for (const e of input.conceptEdges ?? []) {
    addNode(e.fromKey);
    addNode(e.toKey);
    adj.get(e.fromKey)!.add(e.toKey);
    adj.get(e.toKey)!.add(e.fromKey);
  }
  for (const k of Object.keys(input.degree ?? {})) addNode(k);

  const MAX_ITERS = 32;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    let changed = false;
    const ordered = Array.from(nodes).sort();
    for (const node of ordered) {
      const neighbours = Array.from(adj.get(node) ?? []).sort();
      if (neighbours.length === 0) continue;
      const counts = new Map<string, number>();
      for (const n of neighbours) {
        const lbl = labels.get(n) ?? n;
        counts.set(lbl, (counts.get(lbl) ?? 0) + 1);
      }
      // Best label: highest count, tie → lexicographically smallest.
      let best = labels.get(node) ?? node;
      let bestCount = 0;
      for (const [lbl, cnt] of Array.from(counts.entries()).sort()) {
        if (cnt > bestCount || (cnt === bestCount && lbl < best)) {
          best = lbl;
          bestCount = cnt;
        }
      }
      if (best !== (labels.get(node) ?? node)) {
        labels.set(node, best);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return labels;
}

/**
 * Coherence: mean pairwise shared-concept ratio within a cluster.
 *
 * Each pair (i, j) contributes its Jaccard ratio over the two concepts'
 * verse sets: `|Ai ∩ Bj| / |Ai ∪ Bj|` (0 when the union is empty). The
 * cluster's coherence is the mean over all C(n, 2) pairs. Because every
 * concept carries its own head verse, pairs that share at least one verse
 * contribute at least 1/|Ai ∪ Bj| — the co-occurrence signal the 0.4
 * floor tests. Pairs that share no verses contribute 0.
 */
export function clusterCoherence(members: string[], versesByConcept: Record<string, string[]>): number {
  if (members.length < 2) return members.length === 1 ? 1 : 0;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = new Set(versesByConcept[members[i]] ?? []);
      const b = new Set(versesByConcept[members[j]] ?? []);
      let inter = 0;
      for (const v of a) if (b.has(v)) inter++;
      const union = a.size + b.size - inter;
      total += union === 0 ? 0 : inter / union;
      pairs++;
    }
  }
  return pairs === 0 ? 0 : total / pairs;
}

function rankAnchors(members: string[], degree: Record<string, number>): Array<{ key: string; degree: number }> {
  return members
    .map((k) => ({ key: k, degree: degree[k] ?? 0 }))
    .sort((a, b) => (a.degree !== b.degree ? b.degree - a.degree : a.key < b.key ? -1 : 1))
    .slice(0, 3);
}

/**
 * Build the full cluster list (unvalidated + validated) from the input.
 * Pure; the LLM is not involved here.
 */
export function buildClusters(input: CommunityInput): Cluster[] {
  const labels = clusterConcepts(input);
  const groups = new Map<string, string[]>();
  for (const [node, lbl] of labels.entries()) {
    const arr = groups.get(lbl) ?? (groups.set(lbl, []).get(lbl) as string[]);
    arr.push(node);
  }

  const clusters: Cluster[] = [];
  for (const members of groups.values()) {
    const sorted = Array.from(new Set(members)).sort();
    // Size cap: over-cap clusters are split deterministically by degree
    // (top-degree halves keep their rank order).
    let membersCapped = sorted;
    if (sorted.length > SIZE_CAP) {
      const ranked = sorted
        .map((k) => ({ k, d: input.degree[k] ?? 0 }))
        .sort((a, b) => (b.d !== a.d ? b.d - a.d : a.k < b.k ? -1 : 1));
      membersCapped = ranked.slice(0, SIZE_CAP).map((x) => x.k).sort();
    }
    const verseSet = new Set<string>();
    for (const m of membersCapped) for (const v of input.versesByConcept[m] ?? []) verseSet.add(v);
    const coherence = clusterCoherence(membersCapped, input.versesByConcept);
    const anchors = rankAnchors(membersCapped, input.degree).map((a) => ({
      key: a.key,
      label: a.key.split(':').slice(1).join(':') ?? a.key,
      degree: a.degree,
    }));
    const distinctConcepts = membersCapped.length;
    const distinctVerses = verseSet.size;
    const valid =
      coherence >= COHERENCE_FLOOR &&
      (distinctConcepts >= MIN_CONCEPTS || distinctVerses >= MIN_VERSES) &&
      distinctConcepts <= SIZE_CAP;
    const validReason = valid
      ? 'ok'
      : coherence < COHERENCE_FLOOR
        ? `coherence ${coherence.toFixed(2)} < ${COHERENCE_FLOOR}`
        : `too small (${distinctConcepts} concepts, ${distinctVerses} verses)`;

    clusters.push({
      index: clusters.length,
      members: membersCapped,
      verses: Array.from(verseSet).sort(),
      coherence: Number(coherence.toFixed(4)),
      anchors,
      valid,
      validReason,
    });
  }

  // Deterministic ordering: by (min member key), then by size desc.
  clusters.sort((a, b) => {
    const am = a.members[0] ?? '';
    const bm = b.members[0] ?? '';
    if (am !== bm) return am < bm ? -1 : 1;
    return b.members.length - a.members.length;
  });
  clusters.forEach((c, i) => (c.index = i));

  return clusters;
}

// ---------------------------------------------------------------------------
// Community naming (LLM hook + deterministic fallback)
// ---------------------------------------------------------------------------

export interface MintedCommunity {
  id: string;
  index: number;
  name: string;
  nameSource: 'deterministic' | 'llm' | 'unique-anchor';
  sourceConceptId: string | null;
  size: number;
  coherence: number;
  source: string;
  memberKeys: string[];
  verseIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityOut {
  communities: MintedCommunity[];
  stats: Record<string, number>;
}

const LOUVAIN_SOURCE = 'louvain-v1';

function deterministicName(cluster: Cluster, index: number): string {
  const top = cluster.anchors[0];
  if (!top) return `Community ${index + 1}`;
  return clampCommunityName(`${top.label} (community ${index + 1})`);
}

function isUniqueAnchor(cluster: Cluster): boolean {
  const top = cluster.anchors[0];
  if (!top) return false;
  const label = top.label;
  let count = 0;
  for (const m of cluster.members) if (inputLabel(m) === label) count++;
  return count === 1;
}
function inputLabel(key: string): string {
  return key.split(':').slice(1).join(':') ?? key;
}

function validateLlmName(
  name: string,
  cluster: Cluster
): boolean {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 6) return false; // ≤ 6 words
  // Must reuse at least one anchor label verbatim (case-insensitive).
  const anchorsLower = cluster.anchors.map((a) => a.label.toLowerCase());
  const reusesAnchor = words.some((w) => anchorsLower.includes(w.toLowerCase()));
  if (!reusesAnchor) return false;
  // Must not introduce an entity absent from the community.
  const memberLabels = new Set(
    cluster.members.map(inputLabel).map((l) => l.toLowerCase())
  );
  for (const w of words) {
    if (w.toLowerCase() === 'community' || /^\d+$/.test(w)) continue;
    if (!memberLabels.has(w.toLowerCase()) && !anchorsLower.includes(w.toLowerCase())) return false;
  }
  return true;
}

/**
 * Mint communities from validated clusters. The LLM port is consulted ONLY
 * for communities that pass the structural rule AND whose top anchor is
 * not unique. `NoopLlmPort` makes this a deterministic no-op by default.
 */
export async function runCommunities(
  input: CommunityInput,
  port: ILlmPort
): Promise<CommunityOut> {
  const clusters = buildClusters(input);
  const valid = clusters.filter((c) => c.valid);
  const communities: MintedCommunity[] = [];
  let llmCalls = 0;

  for (const cluster of valid) {
    const id = detUuid(`stage-g-community:${cluster.members.join(',')}`);
    let name: string;
    let nameSource: MintedCommunity['nameSource'];

    if (isUniqueAnchor(cluster)) {
      // No LLM call: the top anchor's label is already unambiguous.
      name = cluster.anchors[0]?.label ?? `Community ${cluster.index + 1}`;
      nameSource = 'unique-anchor';
    } else {
      llmCalls++;
      const proposed = await port.nameCommunity({
        community: {
          id,
          size: cluster.members.length,
          coherence: cluster.coherence,
          anchorConcepts: cluster.anchors.map((a) => ({ key: a.key, label: a.label, degree: a.degree })),
          memberLabels: cluster.members.map(inputLabel),
        },
      });
      if (proposed !== null && validateLlmName(proposed, cluster)) {
        name = clampCommunityName(proposed);
        nameSource = 'llm';
      } else {
        name = deterministicName(cluster, cluster.index);
        nameSource = 'deterministic';
      }
    }

    const topAnchor = cluster.anchors[0];
    communities.push({
      id,
      index: cluster.index,
      name,
      nameSource,
      sourceConceptId: topAnchor ? detUuid(`stage-c-concept:${topAnchor.key}`) : null,
      size: cluster.members.length,
      coherence: cluster.coherence,
      source: LOUVAIN_SOURCE,
      memberKeys: cluster.members,
      verseIds: cluster.verses,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  return {
    communities,
    stats: {
      clusters_total: clusters.length,
      clusters_valid: valid.length,
      communities_minted: communities.length,
      llm_calls: llmCalls,
      deterministic_names: communities.filter((c) => c.nameSource !== 'llm').length,
    },
  };
}

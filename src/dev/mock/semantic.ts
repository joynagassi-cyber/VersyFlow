/**
 * Mock Semantic Memory — isolated semantic concepts, communities, relations,
 * and user tags for Demo/Mock mode.
 *
 * Avoids touching PowerSync/SQLite (`MockModeGuardError`) while keeping
 * `/semantic`, `/semantic/tags`, `/semantic/tree`, `/semantic/verse`, chapter
 * semantic chips, and `VerseActionBar` ("Taguer") 100% functional and
 * coherent with `SEED_VERSES`.
 */

import type {
  Community,
  Concept,
  ConceptRelation,
  VerseConcept,
  VerseRelation,
} from '@/domains/semantic-memory/entities';
import type {
  ConceptSearchHit,
  ConceptTagInput,
  ICommunityRepository,
  IConceptRepository,
  IConceptTagRepository,
  IVerseRelationRepository,
  TagWriteResult,
} from '@/domains/semantic-memory/repositories';
import { recordMockMutation } from './repositories';

export const MOCK_SEMANTIC_STORAGE_KEY = 'versyflow:semantic:mock:v1';

interface MockSemanticState {
  concepts: Concept[];
  verseConcepts: VerseConcept[];
  communities: Community[];
  conceptRelations: ConceptRelation[];
  verseRelations: VerseRelation[];
}

function slugify(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64) || 'concept'
  );
}

function buildDefaultState(): MockSemanticState {
  const iso = '2026-10-01T08:00:00.000Z';
  const concepts: Concept[] = [
    {
      id: 'cpt-demo-amour',
      canonical_name: 'Amour divin',
      slug: 'amour-divin',
      labels_by_language: { fr: 'Amour divin', en: 'Divine love' },
      description: 'Le don gratuit de Dieu manifesté pour le salut du monde.',
      source_provenance: [{ source: 'nave' }],
      confidence: 0.96,
      status: 'active',
      kind: 'TEACHING',
      source: 'nave',
      created_by: 'stage-B',
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'cpt-demo-confiance',
      canonical_name: 'Confiance',
      slug: 'confiance',
      labels_by_language: { fr: 'Confiance', en: 'Trust' },
      description: 'Repos du cœur dans la fidélité et la direction du Berger.',
      source_provenance: [{ source: 'user' }],
      confidence: 1,
      status: 'active',
      kind: 'TOPIC',
      source: 'manual',
      created_by: 'user',
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'cpt-demo-force',
      canonical_name: 'Force et courage',
      slug: 'force-et-courage',
      labels_by_language: { fr: 'Force et courage', en: 'Strength and courage' },
      description: 'Persévérance renouvelée dans l’épreuve par la grâce.',
      source_provenance: [{ source: 'torrey' }],
      confidence: 0.93,
      status: 'active',
      kind: 'TOPIC',
      source: 'torrey',
      created_by: 'stage-B',
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'cpt-demo-esperance',
      canonical_name: 'Espérance',
      slug: 'esperance',
      labels_by_language: { fr: 'Espérance', en: 'Hope' },
      description: 'Attente paisible et assurée de l’accomplissement des promesses.',
      source_provenance: [{ source: 'user' }],
      confidence: 1,
      status: 'active',
      kind: 'TOPIC',
      source: 'manual',
      created_by: 'user',
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'cpt-demo-sagesse',
      canonical_name: 'Sagesse et direction',
      slug: 'sagesse-et-direction',
      labels_by_language: { fr: 'Sagesse et direction', en: 'Wisdom and guidance' },
      description: 'Marcher humblement en remettant ses voies à Dieu.',
      source_provenance: [{ source: 'nave' }],
      confidence: 0.91,
      status: 'active',
      kind: 'TEACHING',
      source: 'nave',
      created_by: 'stage-B',
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'cpt-demo-repos',
      canonical_name: 'Paix et repos',
      slug: 'paix-et-repos',
      labels_by_language: { fr: 'Paix et repos', en: 'Peace and rest' },
      description: 'Consolation promise aux âmes fatiguées et chargées.',
      source_provenance: [{ source: 'openbible' }],
      confidence: 0.9,
      status: 'active',
      kind: 'TOPIC',
      source: 'openbible',
      created_by: 'stage-B',
      created_at: iso,
      updated_at: iso,
    },
  ];

  const verseConcepts: VerseConcept[] = [
    { verse_id: 'joh:3:16', concept_id: 'cpt-demo-amour', role: 'PRIMARY', confidence: 0.98, source: 'nave', created_at: iso },
    { verse_id: 'psa:23:1', concept_id: 'cpt-demo-confiance', role: 'PRIMARY', confidence: 1, source: 'user', created_at: iso },
    { verse_id: 'psa:23:1', concept_id: 'cpt-demo-repos', role: 'SECONDARY', confidence: 0.9, source: 'openbible', created_at: iso },
    { verse_id: 'pro:3:5', concept_id: 'cpt-demo-confiance', role: 'PRIMARY', confidence: 1, source: 'user', created_at: iso },
    { verse_id: 'pro:3:5', concept_id: 'cpt-demo-sagesse', role: 'SECONDARY', confidence: 0.92, source: 'nave', created_at: iso },
    { verse_id: 'php:4:13', concept_id: 'cpt-demo-force', role: 'PRIMARY', confidence: 0.95, source: 'torrey', created_at: iso },
    { verse_id: 'jos:1:9', concept_id: 'cpt-demo-force', role: 'PRIMARY', confidence: 0.94, source: 'torrey', created_at: iso },
    { verse_id: 'isa:40:31', concept_id: 'cpt-demo-esperance', role: 'PRIMARY', confidence: 1, source: 'user', created_at: iso },
    { verse_id: 'isa:40:31', concept_id: 'cpt-demo-force', role: 'SECONDARY', confidence: 0.91, source: 'torrey', created_at: iso },
    { verse_id: 'rom:8:28', concept_id: 'cpt-demo-esperance', role: 'PRIMARY', confidence: 1, source: 'user', created_at: iso },
    { verse_id: 'mat:11:28', concept_id: 'cpt-demo-repos', role: 'PRIMARY', confidence: 0.96, source: 'openbible', created_at: iso },
  ];

  const communities: Community[] = [
    {
      id: 'com-demo-confiance',
      name: 'Confiance, paix et direction',
      description: 'Versets d’abandon paisible sous la conduite du Berger.',
      concept_ids: ['cpt-demo-confiance', 'cpt-demo-sagesse', 'cpt-demo-repos'],
      source_concept_id: 'cpt-demo-confiance',
      size: 3,
      coherence: 0.92,
      source: 'louvain-v1',
      confidence: 0.92,
      created_at: iso,
      updated_at: iso,
    },
    {
      id: 'com-demo-esperance',
      name: 'Grâce, espérance et force renouvelée',
      description: 'Promesses de salut, de relèvement et de courage.',
      concept_ids: ['cpt-demo-amour', 'cpt-demo-esperance', 'cpt-demo-force'],
      source_concept_id: 'cpt-demo-esperance',
      size: 3,
      coherence: 0.9,
      source: 'louvain-v1',
      confidence: 0.9,
      created_at: iso,
      updated_at: iso,
    },
  ];

  const conceptRelations: ConceptRelation[] = [
    { from_concept_id: 'cpt-demo-confiance', to_concept_id: 'cpt-demo-repos', type: 'SUPPORTS', confidence: 0.91, source: 'derived', created_at: iso },
    { from_concept_id: 'cpt-demo-confiance', to_concept_id: 'cpt-demo-sagesse', type: 'RELATED', confidence: 0.88, source: 'derived', created_at: iso },
    { from_concept_id: 'cpt-demo-esperance', to_concept_id: 'cpt-demo-force', type: 'SUPPORTS', confidence: 0.93, source: 'derived', created_at: iso },
    { from_concept_id: 'cpt-demo-amour', to_concept_id: 'cpt-demo-esperance', type: 'SUPPORTS', confidence: 0.9, source: 'derived', created_at: iso },
  ];

  const verseRelations: VerseRelation[] = [
    { verse_a: 'psa:23:1', verse_b: 'pro:3:5', type: 'SHARED_CONCEPT', score: 0.92, source: 'derived', concept_id: 'cpt-demo-confiance', community_id: 'com-demo-confiance', created_at: iso },
    { verse_a: 'mat:11:28', verse_b: 'psa:23:1', type: 'SAME_COMMUNITY', score: 0.89, source: 'derived', concept_id: 'cpt-demo-repos', community_id: 'com-demo-confiance', created_at: iso },
    { verse_a: 'isa:40:31', verse_b: 'php:4:13', type: 'CROSS_REFERENCE', score: 0.94, source: 'openbible', concept_id: 'cpt-demo-force', community_id: 'com-demo-esperance', created_at: iso },
    { verse_a: 'isa:40:31', verse_b: 'jos:1:9', type: 'SHARED_CONCEPT', score: 0.88, source: 'derived', concept_id: 'cpt-demo-force', community_id: 'com-demo-esperance', created_at: iso },
    { verse_a: 'joh:3:16', verse_b: 'rom:8:28', type: 'CROSS_REFERENCE', score: 0.9, source: 'openbible', concept_id: 'cpt-demo-amour', community_id: 'com-demo-esperance', created_at: iso },
  ];

  return { concepts, verseConcepts, communities, conceptRelations, verseRelations };
}

function readState(): MockSemanticState {
  try {
    const raw = localStorage.getItem(MOCK_SEMANTIC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockSemanticState;
      if (Array.isArray(parsed.concepts) && Array.isArray(parsed.verseConcepts)) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const initial = buildDefaultState();
  writeState(initial);
  return initial;
}

function writeState(state: MockSemanticState): void {
  try {
    localStorage.setItem(MOCK_SEMANTIC_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetMockSemanticStore(): void {
  writeState(buildDefaultState());
}

const ROLE_WEIGHT: Record<VerseConcept['role'], number> = {
  PRIMARY: 4,
  SECONDARY: 3,
  RELATED: 2,
  CONTRAST: 1,
};

class MockConceptRepository implements IConceptRepository {
  async getConcept(id: string): Promise<Concept | null> {
    return readState().concepts.find((c) => c.id === id) ?? null;
  }

  async searchConcepts(term: string, lang?: string, limit = 50): Promise<ConceptSearchHit[]> {
    const needle = term.trim().toLowerCase();
    const capped = Math.max(1, Math.min(200, limit));
    const hits: ConceptSearchHit[] = [];
    for (const concept of readState().concepts) {
      if (lang && !(lang in concept.labels_by_language)) continue;
      const matchedLabels: Record<string, string> = {};
      for (const [locale, label] of Object.entries(concept.labels_by_language)) {
        if (!needle || label.toLowerCase().includes(needle)) {
          matchedLabels[locale] = label;
        }
      }
      const matchesCanonical =
        !needle ||
        concept.canonical_name.toLowerCase().includes(needle) ||
        concept.slug.includes(needle);
      if (matchesCanonical || Object.keys(matchedLabels).length > 0) {
        hits.push({ concept, matchedLabels });
      }
    }
    return hits
      .sort(
        (a, b) =>
          b.concept.confidence - a.concept.confidence ||
          a.concept.canonical_name.localeCompare(b.concept.canonical_name),
      )
      .slice(0, capped);
  }

  async getConceptsForVerse(verseKey: string): Promise<VerseConcept[]> {
    return readState()
      .verseConcepts.filter((vc) => vc.verse_id === verseKey)
      .sort(
        (a, b) =>
          ROLE_WEIGHT[b.role] - ROLE_WEIGHT[a.role] || b.confidence - a.confidence,
      );
  }

  async getConceptRelations(conceptId: string): Promise<ConceptRelation[]> {
    return readState()
      .conceptRelations.filter(
        (r) => r.from_concept_id === conceptId || r.to_concept_id === conceptId,
      )
      .sort((a, b) => b.confidence - a.confidence);
  }
}

class MockCommunityRepository implements ICommunityRepository {
  async getCommunities(): Promise<Community[]> {
    return [...readState().communities].sort(
      (a, b) => (b.size ?? b.concept_ids.length) - (a.size ?? a.concept_ids.length) || a.name.localeCompare(b.name),
    );
  }

  async getCommunitiesForConcept(conceptId: string): Promise<Community[]> {
    return readState().communities.filter((c) => c.concept_ids.includes(conceptId));
  }
}

class MockVerseRelationRepository implements IVerseRelationRepository {
  async getRelationsForVerse(verseKey: string): Promise<VerseRelation[]> {
    return readState()
      .verseRelations.filter((r) => r.verse_a === verseKey || r.verse_b === verseKey)
      .sort((a, b) => b.score - a.score);
  }

  async getRelationsForVerseOfType(
    verseKey: string,
    type: VerseRelation['type'],
  ): Promise<VerseRelation[]> {
    return (await this.getRelationsForVerse(verseKey)).filter((r) => r.type === type);
  }

  async getCrossRefs(limit = 100): Promise<VerseRelation[]> {
    const capped = Math.max(1, Math.min(500, limit));
    return [...readState().verseRelations]
      .sort((a, b) => b.score - a.score)
      .slice(0, capped);
  }
}

class MockConceptTagRepository implements IConceptTagRepository {
  async insertTag(tag: ConceptTagInput): Promise<TagWriteResult> {
    const state = readState();
    const normalized = tag.canonical_name.trim();
    const slug = slugify(normalized);
    const nowIso = new Date().toISOString();

    let concept =
      state.concepts.find((c) => c.id === tag.concept_id) ??
      state.concepts.find(
        (c) =>
          c.canonical_name.toLowerCase() === normalized.toLowerCase() || c.slug === slug,
      );
    let created = false;
    if (!concept) {
      const locale = tag.locale?.split('-')[0] || 'fr';
      concept = {
        id: tag.concept_id || `cpt-user-${Date.now()}`,
        canonical_name: normalized,
        slug,
        labels_by_language: { [locale]: normalized },
        source_provenance: [{ source: 'user' }],
        confidence: 1,
        status: 'active',
        kind: 'TOPIC',
        source: 'manual',
        created_by: 'user',
        created_at: nowIso,
        updated_at: nowIso,
      };
      state.concepts.unshift(concept);
      created = true;
    } else {
      concept.updated_at = nowIso;
      if (tag.locale) {
        const base = tag.locale.split('-')[0];
        concept.labels_by_language[base] = concept.labels_by_language[base] ?? normalized;
      }
    }

    const exists = state.verseConcepts.some(
      (vc) => vc.verse_id === tag.verse_id && vc.concept_id === concept.id,
    );
    if (!exists) {
      state.verseConcepts.unshift({
        verse_id: tag.verse_id,
        concept_id: concept.id,
        role: tag.role ?? 'PRIMARY',
        confidence: 1,
        source: 'user',
        created_at: nowIso,
      });
    }

    writeState(state);
    recordMockMutation('semantic_tags', created ? 'create' : 'update', {
      verseKey: tag.verse_id,
      conceptId: concept.id,
      canonicalName: concept.canonical_name,
    });
    return { concept, created };
  }
}

export function createMockSemanticMemoryRepositories() {
  return {
    conceptRepository: new MockConceptRepository(),
    communityRepository: new MockCommunityRepository(),
    verseRelationRepository: new MockVerseRelationRepository(),
    tagRepository: new MockConceptTagRepository(),
  };
}

export function mockVerseKeysForConcept(conceptId: string, userOnly = false): string[] {
  const seen = new Set<string>();
  for (const vc of readState().verseConcepts) {
    if (vc.concept_id !== conceptId) continue;
    if (userOnly && vc.source !== 'user') continue;
    seen.add(vc.verse_id);
  }
  return [...seen];
}

export function mockChapterVerseConcepts(
  bookId: string,
  chapter: number,
): {
  conceptIdsByVerse: Record<string, string[]>;
  sourcesByVerse: Record<string, string[]>;
} {
  const state = readState();
  const validConcepts = new Set(state.concepts.map((c) => c.id));
  const prefix = `${bookId}:${chapter}:`;
  const conceptIdsByVerse: Record<string, string[]> = {};
  const sourcesByVerse: Record<string, string[]> = {};

  for (const row of state.verseConcepts) {
    if (!row.verse_id.startsWith(prefix)) continue;
    if (!validConcepts.has(row.concept_id)) continue;
    const ids = (conceptIdsByVerse[row.verse_id] ??= []);
    if (!ids.includes(row.concept_id)) ids.push(row.concept_id);
    const sources = (sourcesByVerse[row.verse_id] ??= []);
    if (!sources.includes(row.source)) sources.push(row.source);
  }
  return { conceptIdsByVerse, sourcesByVerse };
}

export function mockUserConcepts(limit = 40): Concept[] {
  return readState()
    .concepts.filter((c) => c.source === 'manual' && c.created_by === 'user')
    .slice(0, limit);
}

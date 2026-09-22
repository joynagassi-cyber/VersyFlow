/**
 * Seed the deterministic semantic corpus into Supabase (idempotent upserts).
 *
 * Loads the offline seed under `data/bible/semantic/` and upserts it into the
 * five published graph tables created by migration 009. Column names follow
 * the PowerSync schema (`canonical_name`, `type`, `verse_a`/`verse_b`, `score`)
 * while the source JSON is camelCase — this script is the mapping boundary.
 *
 * Run:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/supabase/seed-semantic.ts
 * Idempotent: rows carry stable UUIDs, upserts conflict on `id`.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DATA_DIR = resolve(process.cwd(), 'data/bible/semantic');

function load(rel: string): any {
  return JSON.parse(readFileSync(join(DATA_DIR, rel), 'utf8'));
}

const now = () => new Date().toISOString();

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  const supabase = createClient(url, key);

  const conceptsDoc = load('concepts/index.json');
  const relationsDoc = load('relations/index.json');
  const verseConceptsDoc = load('verse-concepts/index.json');
  const communitiesDoc = load('communities/index.json');

  // 1. concepts  (JSON canonicalLabel -> Supabase canonical_name)
  const conceptRows = (conceptsDoc.concepts ?? []).map((c: any) => ({
    id: c.id,
    labels_by_language: c.labelsByLanguage ?? '{}',
    canonical_name: c.canonicalLabel,
    slug: c.key ?? null,
    description: c.definition ?? null,
    source_provenance: c.headVerse ?? null,
    confidence: typeof c.confidence === 'number' ? c.confidence : null,
    status: c.status ?? 'active',
    kind: c.kind ?? null,
    source: 'seed',
    created_by: c.createdBy ?? 'seed',
    created_at: c.createdAt ?? now(),
    updated_at: c.updatedAt ?? c.createdAt ?? now(),
  }));
  let r = await supabase.from('concepts').upsert(conceptRows, { onConflict: 'id' });
  if (r.error) throw new Error(`concepts upsert failed: ${r.error.message}`);
  console.log(`[seed] concepts upserted: ${conceptRows.length}`);

  // 2. concept_relations (conceptsDoc.relations; relationType -> type)
  const conceptRelationRows = (conceptsDoc.relations ?? []).map((x: any) => ({
    id: x.id,
    from_concept_id: x.fromConceptId,
    to_concept_id: x.toConceptId,
    type: x.relationType,
    confidence: typeof x.confidence === 'number' ? x.confidence : null,
    source: 'seed',
    created_at: x.createdAt ?? now(),
  }));
  r = await supabase.from('concept_relations').upsert(conceptRelationRows, { onConflict: 'id' });
  if (r.error) throw new Error(`concept_relations upsert failed: ${r.error.message}`);
  console.log(`[seed] concept_relations upserted: ${conceptRelationRows.length}`);

  // 3. verse_relations (relationsDoc.crossrefs; fromVerseId/toVerseId -> verse_a/verse_b)
  const verseRelationRows = (relationsDoc.crossrefs ?? []).map((x: any) => ({
    id: x.id,
    verse_a: x.fromVerseId,
    verse_b: x.toVerseId,
    type: x.relationType,
    score: typeof x.confidence === 'number' ? x.confidence : null,
    source: x.source ?? 'seed',
    created_at: x.createdAt ?? now(),
  }));
  r = await supabase.from('verse_relations').upsert(verseRelationRows, { onConflict: 'id' });
  if (r.error) throw new Error(`verse_relations upsert failed: ${r.error.message}`);
  console.log(`[seed] verse_relations upserted: ${verseRelationRows.length}`);

  // 4. verse_concepts
  const verseConceptRows = (verseConceptsDoc.verseConcepts ?? []).map((x: any) => ({
    id: x.id,
    verse_id: x.verseId,
    concept_id: x.conceptId,
    role: x.role ?? 'PRIMARY',
    confidence: typeof x.confidence === 'number' ? x.confidence : null,
    source: x.source ?? 'seed',
    created_at: x.createdAt ?? now(),
  }));
  r = await supabase.from('verse_concepts').upsert(verseConceptRows, { onConflict: 'id' });
  if (r.error) throw new Error(`verse_concepts upsert failed: ${r.error.message}`);
  console.log(`[seed] verse_concepts upserted: ${verseConceptRows.length}`);

  // 5. communities (empty in current seed; kept for forward compatibility)
  const communityRows = (communitiesDoc.communities ?? []).map((x: any) => ({
    id: x.id,
    name: x.name,
    description: x.description ?? null,
    concept_ids: x.conceptIds ? JSON.stringify(x.conceptIds) : null,
    source_concept_id: x.sourceConceptId ?? null,
    size: x.size ?? 0,
    coherence: typeof x.coherence === 'number' ? x.coherence : null,
    source: x.source ?? 'seed',
    confidence: typeof x.confidence === 'number' ? x.confidence : null,
    created_at: x.createdAt ?? now(),
    updated_at: x.updatedAt ?? x.createdAt ?? now(),
  }));
  if (communityRows.length > 0) {
    r = await supabase.from('communities').upsert(communityRows, { onConflict: 'id' });
    if (r.error) throw new Error(`communities upsert failed: ${r.error.message}`);
  }
  console.log(`[seed] communities upserted: ${communityRows.length}`);

  console.log('[seed] semantic corpus published');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

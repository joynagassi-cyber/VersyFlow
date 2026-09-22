create table if not exists public.verse_relations (
  id uuid primary key default gen_random_uuid(),
  verse_a text not null,
  verse_b text not null,
  type text not null,
  score double precision check (score is null or (score between 0 and 1)),
  source text not null default 'seed',
  concept_id text,
  community_id text,
  created_at timestamptz not null default now(),
  unique (verse_a, verse_b, type)
);
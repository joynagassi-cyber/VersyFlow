create table if not exists public.verse_concepts (
  id uuid primary key default gen_random_uuid(),
  verse_id text not null,
  concept_id text not null,
  role text not null default 'PRIMARY',
  confidence double precision check (confidence is null or (confidence between 0 and 1)),
  source text not null default 'seed',
  created_at timestamptz not null default now(),
  unique (verse_id, concept_id, role)
);
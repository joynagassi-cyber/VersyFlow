create table if not exists public.concept_relations (
  id uuid primary key default gen_random_uuid(),
  from_concept_id text not null,
  to_concept_id text not null,
  type text not null,
  confidence double precision check (confidence is null or (confidence between 0 and 1)),
  source text not null default 'seed',
  created_at timestamptz not null default now(),
  unique (from_concept_id, to_concept_id, type)
);
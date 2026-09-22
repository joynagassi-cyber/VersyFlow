create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  concept_ids text,
  source_concept_id text,
  size integer not null default 0,
  coherence double precision check (coherence is null or (coherence between 0 and 1)),
  source text not null default 'seed',
  confidence double precision check (confidence is null or (confidence between 0 and 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
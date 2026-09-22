create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  labels_by_language text,
  canonical_name text not null,
  slug text unique,
  description text,
  source_provenance text,
  confidence double precision check (confidence is null or (confidence between 0 and 1)),
  status text not null default 'active',
  kind text,
  source text not null default 'seed',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
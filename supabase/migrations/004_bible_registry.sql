# 📚 Bible Multi-Traduction Registry - Schema

## Tables à créer

```sql
-- Languages
create table if not exists public.bible_languages (
  id varchar(10) primary key,
  name varchar(100) not null,
  native_name varchar(100),
  direction varchar(5) default 'ltr' check (direction in ('ltr', 'rtl')),
  created_at timestamptz default now()
);

-- Translations
create table if not exists public.bible_translations (
  id varchar(50) primary key,
  language_id varchar(10) not null references public.bible_languages(id),
  name varchar(100) not null,
  year integer,
  license_status varchar(30) not null check (license_status in ('VERIFIED_FREE', 'LICENSE_REQUIRED', 'LEGAL_REVIEW_REQUIRED')),
  license_name varchar(100),
  license_url text,
  source_url text,
  checksum varchar(64),
  canon text[] not null,
  versification varchar(20) default 'protestant',
  format varchar(20) default 'json',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bible Books
create table if not exists public.bible_books (
  id varchar(5) primary key,
  name varchar(100) not null,
  testament varchar(10) not null check (testament in ('old', 'new')),
  chapters integer not null,
  created_at timestamptz default now()
);

-- Bible Verses (structure only, data loaded from JSON)
create table if not exists public.bible_verses (
  id varchar(20) primary key,
  book_id varchar(5) not null references public.bible_books(id),
  chapter_number integer not null,
  verse_number integer not null,
  translation_id varchar(50) not null references public.bible_translations(id),
  text text not null,
  created_at timestamptz default now(),
  unique (book_id, chapter_number, verse_number, translation_id)
);

-- Translation Texts (full text per translation)
create table if not exists public.translation_texts (
  id uuid primary key default uuid_generate_v4(),
  translation_id varchar(50) not null references public.bible_translations(id) on delete cascade,
  book_id varchar(5) not null,
  chapter_number integer not null,
  verse_number integer not null,
  text text not null,
  created_at timestamptz default now(),
  unique (translation_id, book_id, chapter_number, verse_number)
);

-- Versification Maps (for different traditions)
create table if not exists public.versification_maps (
  id uuid primary key default uuid_generate_v4(),
  from_translation_id varchar(50) not null references public.bible_translations(id),
  to_translation_id varchar(50) not null references public.bible_translations(id),
  from_book varchar(5) not null,
  from_chapter integer not null,
  from_verse integer not null,
  to_book varchar(5) not null,
  to_chapter integer not null,
  to_verse integer not null,
  created_at timestamptz default now(),
  unique (from_translation_id, to_translation_id, from_book, from_chapter, from_verse)
);

-- Indexes
create index if not exists idx_bible_verses_translation on public.bible_verses(translation_id);
create index if not exists idx_bible_verses_book_chapter on public.bible_verses(book_id, chapter_number);
create index if not exists idx_translation_texts_translation on public.translation_texts(translation_id);
create index if not exists idx_translation_texts_book_chapter on public.translation_texts(book_id, chapter_number);

-- RLS (public read for Bible data)
alter table public.bible_languages enable row level security;
create policy "Anyone can view languages" on public.bible_languages for select using (true);

alter table public.bible_translations enable row level security;
create policy "Anyone can view translations" on public.bible_translations for select using (true);

alter table public.bible_books enable row level security;
create policy "Anyone can view books" on public.bible_books for select using (true);

alter table public.bible_verses enable row level security;
create policy "Anyone can view verses" on public.bible_verses for select using (true);

alter table public.translation_texts enable row level security;
create policy "Anyone can view translation texts" on public.translation_texts for select using (true);

alter table public.versification_maps enable row level security;
create policy "Anyone can view versification maps" on public.versification_maps for select using (true);
```

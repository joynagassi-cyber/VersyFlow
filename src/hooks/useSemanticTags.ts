/**
 * Semantic Tags Hook — UI glue for on-verse tag chips
 *
 * Bridges {@link SemanticService.chapterConceptsResolved} to React: given a
 * `bookId:chapter` selection, returns the per-verse concept tags of that
 * chapter (with the verse text from the active translation) plus the
 * cross-references and community. Cancellation-safe; no business logic.
 *
 * The chapter's concepts are fetched in ONE `verse_concepts` range query
 * (not N per-verse `recallCues` calls), so chapters beyond verse 30 are
 * covered as well. Data source is the local SQLite semantic tables
 * populated by `npm run semantic:build` — fully offline, no network.
 */

import { useEffect, useState } from 'react';
import { getSemanticService } from '@/services/semantic-query-service';
import type { Concept, Community } from '@/domains/semantic-memory';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

export interface VerseTagEntry {
  /** Verse number within the chapter (display order). */
  verse: number;
  /** Concept tags attached to this verse (0..n). */
  concepts: Concept[];
  /** Bridge provenance per verse ('user' when manually tagged). */
  source: string | null;
}

export interface ChapterSemanticTags {
  /** Only verses that carry at least one concept tag. */
  entries: VerseTagEntry[];
  /** `verseNumber -> text` for the selected chapter (active translation). */
  verseTexts: Record<number, string>;
  /** Cross-references anchored on any verse of the chapter. */
  crossRefs: { targetKey: string; type: string }[];
  /** Community covering any concept of the chapter, if any. */
  community: Community | null;
}

/**
 * Format a canonical verse key (`bookId:chapter:verse`) for display.
 * Accepts alphanumeric book ids (e.g. `1co`), falls back to the raw key.
 */
export function formatVerseKey(key: string): string {
  const m = /^([a-z0-9]+):(\d+):(\d+)$/i.exec(key);
  if (!m) return key;
  return `${m[1]} ${m[2]}:${m[3]}`;
}

/**
 * Locale-preferred label of a concept.
 *
 * Resolution: exact BCP-47 tag (e.g. `pt-BR`) → base language (`pt`) →
 * canonical_name. The engine stays fully offline and i18n-agnostic: each
 * `Concept` carries `labels_by_language` (a per-language label map, not a
 * per-translation map — translation and UI language are orthogonal
 * dimensions by design), so the chip re-labels itself the moment the app
 * language changes.
 */
export function conceptLabel(
  concept: Pick<Concept, 'canonical_name' | 'labels_by_language'>,
  lang: string,
): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0] ?? '';
  return labels[lang] ?? labels[base] ?? concept.canonical_name;
}

export function useChapterSemanticTags(
  bookId: string | null,
  chapter: number | null,
): { tags: ChapterSemanticTags | null; loading: boolean } {
  const [state, setState] = useState<{
    tags: ChapterSemanticTags | null;
    loading: boolean;
  }>({ tags: null, loading: true });
  const translationId = useSettingsStore((s) => s.bibleTranslation);

  useEffect(() => {
    let cancelled = false;
    if (!bookId || !chapter) {
      setState({ tags: null, loading: false });
      return;
    }

    setState({ tags: null, loading: true });

    void (async () => {
      const service = getSemanticService();
      // One range query for the whole chapter's concept bridges + texts in
      // parallel (replaces the old N×per-verse `recallCues` loop capped
      // at verse 30).
      const [resolved, books, sources] = await Promise.all([
        service.chapterConceptsResolved(bookId, chapter),
        loadTranslationBooks(translationId),
        service.chapterConcepts(bookId, chapter).then((r) => r.sourcesByVerse),
      ]);
      if (cancelled) return;

      const texts: Record<number, string> = {};
      const book = books?.find((b) => b.id === bookId);
      const ch = book?.chapters.find((c) => c.number === chapter);
      ch?.verses.forEach((v) => {
        texts[v.number] = v.text;
      });

      // Only verses that are tagged can carry cross-refs: when the chapter
      // has no tagged verse, the per-verse recall pass is skipped entirely
      // (the old loop's only heavy side).
      const taggedKeys = Object.keys(resolved.conceptsByVerse);
      const xrefs: { targetKey: string; type: string }[] = [];
      if (taggedKeys.length > 0) {
        const seen = new Set<string>();
        for (const key of taggedKeys) {
          const cues = await service.verseView(key);
          for (const r of cues.relatedVerses) {
            const marker = `${r.verseKey}:${r.relation.type}`;
            if (seen.has(marker)) continue;
            seen.add(marker);
            xrefs.push({ targetKey: r.verseKey, type: r.relation.type });
          }
        }
      }

      // Verse-key → verse-number entries, sorted by verse number. The
      // user flag comes from the bridge rows' source, not the concept row.
      const entries: VerseTagEntry[] = Object.entries(resolved.conceptsByVerse)
        .map(([key, concepts]) => {
          const verseNum = Number(key.split(':')[2]);
          const source = (sources[key] ?? []).includes('user') ? 'user' : null;
          return { verse: verseNum, concepts, source };
        })
        .filter((e) => e.verse > 0)
        .sort((a, b) => a.verse - b.verse);

      setState({
        tags: {
          entries,
          verseTexts: texts,
          crossRefs: xrefs,
          community: resolved.community,
        },
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, translationId]);

  return state;
}

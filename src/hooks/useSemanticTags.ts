/**
 * Semantic Tags Hook — UI glue for on-verse tag chips
 *
 * Bridges {@link SemanticService.verseTags} to React: given a
 * `bookId:chapter` selection, returns the per-verse concept tags of that
 * chapter (with the verse text from the active translation) plus the
 * cross-references and community. Cancellation-safe; no business logic.
 *
 * Data source is the local SQLite semantic tables populated by
 * `npm run semantic:build` — fully offline, no network.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSemanticService } from '@/services/semantic-query-service';
import type { Concept, Community } from '@/domains/semantic-memory';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

export interface VerseTagEntry {
  /** Verse number within the chapter (display order). */
  verse: number;
  /** Concept tags attached to this verse (0..n, sorted by role priority). */
  concepts: Concept[];
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

/** Locale-preferred label of a concept (fr → en → canonical). */
export function conceptLabel(
  concept: Pick<Concept, 'canonical_name' | 'labels_by_language'>,
  lang: string,
): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0];
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
    const keys: string[] = [];
    for (let v = 1; v <= 30; v += 1) keys.push(`${bookId}:${chapter}:${v}`);

    void (async () => {
      const service = getSemanticService();
      const [entries, texts, crossRefs, community] = await (async () => {
        const byVerse = new Map<number, Concept[]>();
        const xrefs: { targetKey: string; type: string }[] = [];
        let comm: Community | null = null;
        for (const key of keys) {
          const cues = await service.verseView(key);
          if (cues) {
            if (cues.concepts.length > 0) {
              const verseNum = Number(key.split(':')[2]);
              byVerse.set(verseNum, cues.concepts.map((c) => c.concept));
            }
            for (const r of cues.relatedVerses) {
              xrefs.push({ targetKey: r.verseKey, type: r.relation.type });
            }
            if (!comm && cues.community) comm = cues.community;
          }
        }
        const map: Record<number, string> = {};
        const books = await loadTranslationBooks(translationId);
        const book = books?.find((b) => b.id === bookId);
        const ch = book?.chapters.find((c) => c.number === chapter);
        ch?.verses.forEach((v) => {
          map[v.number] = v.text;
        });
        const sorted = [...byVerse.entries()].sort((a, b) => a[0] - b[0]);
        return [
          sorted.map(([verse, concepts]) => ({ verse, concepts })),
          map,
          xrefs,
          comm,
        ] as const;
      })();

      if (cancelled) return;
      setState({
        tags: {
          entries,
          verseTexts: texts,
          crossRefs,
          community,
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

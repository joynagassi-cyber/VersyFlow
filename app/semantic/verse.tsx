/**
 * Semantic Tree Views — Verse Detail
 *
 * VerseView: `?verseRef=` param (canonical `bookId:ch:verse`). Renders the
 * verse text, its semantic concepts, related verses (cross-refs), and the
 * community it belongs to. Calm, hierarchical — nested lists.
 *
 * UI glue: `useVerseView` (application layer → domain `SemanticQueryService`
 * → SQLite adapter). Verse display text is a UI concern — resolved here from
 * the active translation.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BrainCircuitIcon as BrainCircuit,
  MapIcon as Map,
  BookMarkedIcon as BookMarked,
  ChevronRightIcon as ChevronRight,
  FileTextIcon as FileText,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { useVerseView } from '@/hooks/useSemanticViews';
import { formatVerseKey } from '@/hooks/useSemanticTags';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

function displayLabel(
  concept: { canonical_name: string; labels_by_language: Record<string, string> },
  lang: string,
): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0] ?? '';
  return labels[lang] ?? labels[base] ?? concept.canonical_name;
}

export default function VerseView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const verseRef = params.get('verseRef') ?? undefined;
  const translationId = useSettingsStore((s) => s.bibleTranslation);
  const [verseText, setVerseText] = useState<string | null>(null);

  const { cues, loading } = useVerseView(verseRef);

  useEffect(() => {
    let cancelled = false;
    if (!verseRef) return;
    loadTranslationBooks(translationId)
      .then((books) => {
        if (cancelled || !books) return;
        const m = /^([a-z]+):(\d+):(\d+)$/i.exec(verseRef);
        if (!m) return;
        const bookId = m[1].toLowerCase();
        const chapter = Number(m[2]);
        const verse = Number(m[3]);
        const book = books.find((b) => b.id === bookId);
        const ch = book?.chapters.find((c) => c.number === chapter);
        const v = ch?.verses.find((x) => x.number === verse);
        if (!cancelled) setVerseText(v?.text ?? null);
      })
      .catch(() => {
        /* translation unavailable — falls back to "verse not available" */
      });
    return () => {
      cancelled = true;
    };
  }, [verseRef, translationId]);

  const lang = i18n.language ?? 'fr';

  if (loading) {
    return (
      <FullScreenPage title={formatVerseKey(verseRef ?? '')}>
        <div className="p-4">
          <LoadingBlock label={t('common.loading', 'Chargement…')} className="py-10" />
        </div>
      </FullScreenPage>
    );
  }

  const relatedVerses = cues?.relatedVerses ?? [];
  const concepts = cues?.concepts ?? [];
  const community = cues?.community ?? null;

  return (
    <FullScreenPage title={verseRef ? formatVerseKey(verseRef) : undefined} column="narrow">
      <div className="screen-column min-h-full overflow-y-auto bg-background p-4 pb-24">
        {/* Verse text */}
        <div className="g2 mb-5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <DuoIcon icon={FileText} size={16} className="text-primary" />
            <span className="text-sm font-semibold text-text-primary">
              {verseRef ? formatVerseKey(verseRef) : ''}
            </span>
          </div>
          {verseText ? (
            <p className="text-base leading-relaxed text-text-primary">{verseText}</p>
          ) : (
            <p className="text-sm text-text-muted">{t('errors.verseNotFound', 'Verset non disponible')}</p>
          )}
        </div>

        {/* Concepts */}
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <DuoIcon icon={BrainCircuit} size={14} className="text-primary" />
            {t('semantic.concept', 'Concept')}s — {t('semantic.related', 'Concepts liés')}
          </h2>
          {concepts.length === 0 ? (
            <p className="empty-line">{t('semantic.noConcepts', 'Aucun concept rattaché')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {concepts.map(({ concept, role }) => (
                <button
                  key={concept.id}
                  onClick={() => navigate(`/semantic/concept?conceptId=${encodeURIComponent(concept.id)}`)}
                  className="g2 flex items-center justify-between p-3 text-left transition-transform active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {displayLabel(concept, lang)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {role === 'PRIMARY' ? t('semantic.primary', 'Principal') : role}
                    </p>
                  </div>
                  <DuoIcon icon={ChevronRight} size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Cross-refs / related verses */}
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <DuoIcon icon={BookMarked} size={14} className="text-primary" />
            {t('semantic.crossRefs', 'Références croisées')}
          </h2>
          {relatedVerses.length === 0 ? (
            <p className="empty-line">{t('semantic.noCrossRefs', 'Aucune référence croisée')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {relatedVerses.slice(0, 10).map((r) => (
                <button
                  key={`${r.verseKey}-${r.relation.type}`}
                  onClick={() => navigate(`/semantic/verse?verseRef=${encodeURIComponent(r.verseKey)}`)}
                  className="g2 flex items-center justify-between p-3 text-left transition-transform active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {formatVerseKey(r.verseKey)}
                    </p>
                    <p className="text-xs text-text-muted">{r.relation.type}</p>
                  </div>
                  <DuoIcon icon={ChevronRight} size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Community */}
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <DuoIcon icon={Map} size={14} className="text-primary" />
            {t('semantic.community', 'Communauté')}
          </h2>
          {community ? (
            <button
              onClick={() => navigate(`/semantic/community?communityId=${encodeURIComponent(community.id)}`)}
              className="g2 flex items-center justify-between p-3 text-left transition-transform active:scale-[0.99] w-full"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">{community.name}</p>
                {community.description ? (
                  <p className="text-xs text-text-muted">{community.description}</p>
                ) : null}
              </div>
              <DuoIcon icon={ChevronRight} size={16} className="text-primary" />
            </button>
          ) : (
            <p className="empty-line">{t('semantic.noCommunity', 'Aucune communauté')}</p>
          )}
        </section>
      </div>
    </FullScreenPage>
  );
}

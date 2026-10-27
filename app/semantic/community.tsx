/**
 * Semantic Tree Views — Community Detail
 *
 * CommunityView: `?communityId=` param. Renders the community name,
 * description and coherence, its member concepts, and a few sample
 * versets. Calm, hierarchical — nested lists.
 *
 * UI glue: `useCommunityView` (application layer → domain
 * `SemanticQueryService` → SQLite adapter).
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Map,
  BrainCircuit,
  BookMarked,
  ChevronRight,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { useCommunityView } from '@/hooks/useSemanticViews';

function displayLabel(
  concept: { canonical_name: string; labels_by_language: Record<string, string> },
  lang: string,
): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0];
  return labels[lang] ?? labels[base] ?? concept.canonical_name;
}

function formatVerseKey(key: string): string {
  const m = /^([a-z]+):(\d+):(\d+)$/i.exec(key);
  if (!m) return key;
  return `${m[1]} ${m[2]}:${m[3]}`;
}

export default function CommunityView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const communityId = params.get('communityId') ?? undefined;
  const lang = i18n.language ?? 'fr';

  const { data, loading, notFound } = useCommunityView(communityId);

  if (loading) {
    return (
      <FullScreenPage title={t('semantic.community', 'Communauté')}>
        <div className="p-4">
          <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        </div>
      </FullScreenPage>
    );
  }

  if (notFound || !data) {
    return (
      <FullScreenPage title={t('semantic.community', 'Communauté')}>
        <div className="p-8 text-center">
          <p className="text-sm text-text-muted">{t('errors.verseNotFound', 'Communauté non trouvée')}</p>
        </div>
      </FullScreenPage>
    );
  }

  const { community, concepts, sampleVerseKeys } = data;

  return (
    <FullScreenPage title={community.name} subtitle={community.description}>
      <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-icon-bg-rose">
            <Map size={20} className="text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{community.name}</h1>
            <p className="text-xs text-text-muted">
              {community.source}
              {typeof community.coherence === 'number' ? ` · ${Math.round(community.coherence * 100)}%` : ''}
            </p>
          </div>
        </div>

        {community.description ? (
          <p className="mb-5 text-sm leading-relaxed text-text-secondary">
            {community.description}
          </p>
        ) : null}

        {/* Member concepts */}
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <BrainCircuit size={14} className="text-primary" />
            {t('semantic.concept', 'Concept')}s — {concepts.length}
          </h2>
          {concepts.length === 0 ? (
            <p className="text-sm text-text-muted">{t('semantic.noConcepts', 'Aucun concept rattaché')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {concepts.map(({ concept }) => (
                <button
                  key={concept.id}
                  onClick={() => navigate(`/semantic/concept?conceptId=${encodeURIComponent(concept.id)}`)}
                  className="flex items-center justify-between rounded-xl bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {displayLabel(concept, lang)}
                    </p>
                    <p className="text-xs text-text-muted">{concept.canonical_name}</p>
                  </div>
                  <ChevronRight size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Sample versets */}
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <BookMarked size={14} className="text-primary" />
            {t('semantic.verses', 'Verset{count}', { count: sampleVerseKeys.length })}
          </h2>
          {sampleVerseKeys.length === 0 ? (
            <p className="text-sm text-text-muted">{t('semantic.noVerses', 'Aucun verset lié')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sampleVerseKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => navigate(`/semantic/verse?verseRef=${encodeURIComponent(key)}`)}
                  className="flex items-center justify-between rounded-xl bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <p className="text-sm font-semibold text-text-primary">{formatVerseKey(key)}</p>
                  <ChevronRight size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </FullScreenPage>
  );
}

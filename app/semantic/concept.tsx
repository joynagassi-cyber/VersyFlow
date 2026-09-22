/**
 * Semantic Tree Views — Concept Detail
 *
 * ConceptView: conceptId param. Renders the concept's name + localized
 * labels + description, its versets, its community membership, and its
 * 1-hop relations. Calm, hierarchical — a nested list, not a graph.
 *
 * UI glue: all data comes from `useConceptView` (application layer →
 * domain `SemanticQueryService` → SQLite adapter). Display text for the
 * versets is resolved in the UI layer via the active translation.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  Map,
  BookOpen,
  ChevronRight,
  GitBranch,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { useConceptView } from '@/hooks/useSemanticViews';
import { loadTranslationBooks } from '@/services/bible-text-service';
import { useSettingsStore } from '@/store/settings-store';

function displayLabel(concept: { canonical_name: string; labels_by_language: Record<string, string> }, lang: string): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0];
  return labels[lang] ?? labels[base] ?? concept.canonical_name;
}

export default function ConceptView() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [verseTexts, setVerseTexts] = useState<Record<string, string>>({});
  const translationId = useSettingsStore((s) => s.bibleTranslation);

  const { data, loading, notFound } = useConceptView(conceptId);

  useEffect(() => {
    let cancelled = false;
    loadTranslationBooks(translationId)
      .then((books) => {
        if (cancelled || !books) return;
        const map: Record<string, string> = {};
        for (const book of books) {
          for (const ch of book.chapters) {
            for (const v of ch.verses) {
              map[`${book.id}:${ch.number}:${v.number}`] = v.text;
            }
          }
        }
        if (!cancelled) setVerseTexts(map);
      })
      .catch(() => {
        /* translation unavailable — verse text stays empty, keys still render */
      });
    return () => {
      cancelled = true;
    };
  }, [translationId]);

  const lang = i18n.language ?? 'fr';
  const concept = data?.concept.concept;
  const verseKeys = data?.concept.verseKeys ?? [];
  const communities = data?.concept.communities ?? [];
  const relations = (data?.relations ?? []).filter((n) => n.depth > 0);

  if (loading) {
    return (
      <FullScreenPage title={t('semantic.concept', 'Concept')}>
        <div className="p-4">
          <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        </div>
      </FullScreenPage>
    );
  }

  if (notFound || !concept) {
    return (
      <FullScreenPage title={t('semantic.concept', 'Concept')}>
        <div className="p-8 text-center">
          <p className="text-sm text-text-muted">{t('errors.verseNotFound', 'Concept non trouvé')}</p>
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={displayLabel(concept, lang)}
      subtitle={concept.description ? concept.description.slice(0, 60) : undefined}
    >
      <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-icon-bg-rose">
            <BrainCircuit size={20} className="text-primary" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {displayLabel(concept, lang)}
            </h1>
            <p className="text-xs text-text-muted">{concept.canonical_name}</p>
          </div>
        </div>

        {/* Localized labels */}
        {Object.keys(concept.labels_by_language ?? {}).length > 1 ? (
          <section className="mb-5">
            <h2 className="mb-2 text-sm font-semibold text-text-tertiary">
              {t('semantic.labels', 'Autres langues')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(concept.labels_by_language ?? {}).map(([code, label]) => (
                <span
                  key={code}
                  className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  <span className="mr-1 text-text-muted">{code}</span>
                  {label}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Versets */}
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <BookOpen size={14} className="text-primary" />
            {t('semantic.verses', 'Verset{count}', { count: verseKeys.length })}
          </h2>
          {verseKeys.length === 0 ? (
            <p className="text-sm text-text-muted">{t('semantic.noVerses', 'Aucun verset lié')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {verseKeys.slice(0, 12).map((key) => {
                const text = verseTexts[key];
                return (
                  <button
                    key={key}
                    onClick={() => navigate(`/semantic/verse?verseRef=${encodeURIComponent(key)}`)}
                    className="flex items-center justify-between rounded-xl bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{key}</p>
                      {text ? (
                        <p className="line-clamp-2 text-xs text-text-muted">{text}</p>
                      ) : null}
                    </div>
                    <ChevronRight size={16} className="text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Community */}
        <section className="mb-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <Map size={14} className="text-primary" />
            {t('semantic.community', 'Communauté')}
          </h2>
          {communities.length === 0 ? (
            <p className="text-sm text-text-muted">{t('semantic.noCommunity', 'Aucune communauté')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {communities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/semantic/community?communityId=${encodeURIComponent(c.id)}`)}
                  className="flex items-center justify-between rounded-xl bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                    {c.description ? (
                      <p className="text-xs text-text-muted">{c.description}</p>
                    ) : null}
                  </div>
                  <ChevronRight size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 1-hop relations */}
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-tertiary">
            <GitBranch size={14} className="text-primary" />
            {t('semantic.related', 'Concepts liés')}
          </h2>
          {relations.length === 0 ? (
            <p className="text-sm text-text-muted">{t('semantic.noRelated', 'Aucun lien direct')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {relations.map((node) => (
                <button
                  key={node.concept.id}
                  onClick={() => navigate(`/semantic/concept?conceptId=${encodeURIComponent(node.concept.id)}`)}
                  className="flex items-center justify-between rounded-xl bg-surface p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-text-muted" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {displayLabel(node.concept, lang)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {node.via ? t('semantic.relatedTo', 'Lié à') : t('semantic.openConcept', 'Ouvrir le concept')}
                      </p>
                    </div>
                  </div>
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

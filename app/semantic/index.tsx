/**
 * Semantic Tree Views — Index
 *
 * Sparse, calm landing for the semantic tree: a few active concepts and
 * the communities, each linking into its detail screen. Deliberately NOT
 * a giant graph — a hierarchical list you can read top to bottom.
 *
 * UI glue: `useSemanticIndex` (application layer → domain
 * `SemanticQueryService` → SQLite adapter).
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  Map,
  ChevronRight,
} from 'lucide-react';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { useSemanticIndex } from '@/hooks/useSemanticViews';
import type { Community } from '@/domains/semantic-memory';
import type { ConceptWithVerses } from '@/services/semantic-query-service';

function displayLabel(
  concept: ConceptWithVerses['concept'],
  lang: string,
): string {
  const labels = concept.labels_by_language ?? {};
  const base = lang?.split('-')?.[0];
  return labels[lang] ?? labels[base] ?? concept.canonical_name;
}

export default function SemanticIndex() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';

  const { data, loading } = useSemanticIndex();

  const communities = data?.communities ?? [];
  const featuredConcepts = data?.featuredConcepts ?? [];

  return (
    <FullScreenPage title={t('semantic.title', 'Mémoire sémantique')}>
      <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
        {loading ? (
          <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        ) : (
          <>
            {/* Active concepts */}
            <section className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 px-1 text-lg font-semibold text-text-primary">
                <BrainCircuit size={18} className="text-primary" />
                {t('semantic.concept', 'Concept')}s
              </h2>
              {featuredConcepts.length === 0 ? (
                <p className="text-sm text-text-muted">{t('semantic.noConcepts', 'Aucun concept actif')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {featuredConcepts.map((item) => (
                    <button
                      key={item.concept.id}
                      onClick={() =>
                        navigate(`/semantic/concept?conceptId=${encodeURIComponent(item.concept.id)}`)
                      }
                      className="flex items-center justify-between rounded-xl bg-surface p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
                    >
                      <div>
                        <p className="text-base font-semibold text-text-primary">
                          {displayLabel(item.concept, lang)}
                        </p>
                        <p className="text-xs text-text-muted">{item.concept.canonical_name}</p>
                      </div>
                      <ChevronRight size={18} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Communities */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 px-1 text-lg font-semibold text-text-primary">
                <Map size={18} className="text-primary" />
                {t('semantic.community', 'Communauté')}
              </h2>
              {communities.length === 0 ? (
                <p className="text-sm text-text-muted">{t('semantic.noCommunity', 'Aucune communauté')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {communities.slice(0, 20).map((c: Community) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        navigate(`/semantic/community?communityId=${encodeURIComponent(c.id)}`)
                      }
                      className="flex items-center justify-between rounded-xl bg-surface p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
                    >
                      <div>
                        <p className="text-base font-semibold text-text-primary">{c.name}</p>
                        {c.description ? (
                          <p className="line-clamp-1 text-xs text-text-muted">{c.description}</p>
                        ) : null}
                      </div>
                      <ChevronRight size={18} className="text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </FullScreenPage>
  );
}

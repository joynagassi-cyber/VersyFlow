/**
 * Arbres sémantiques — Suggestions (kit `t5_arbre_suggestions`).
 *
 * Les suggestions sont les concepts **de la base** qui ne sont pas encore dans
 * vos tags personnels, triés par nombre de versets. Elles sont calculées à
 * partir de l'index sémantique local (`indexView`), pas d'une liste écrite à
 * la main : si la base est vide, l'écran le dit.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass01Icon as Compass, ChevronRightIcon as ChevronRight } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, Segmented } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSemanticIndex, useMyConcepts } from '@/hooks/useSemanticViews';
import { conceptLabel } from '@/hooks/useSemanticTags';

type Filter = 'all' | 'mine';

export default function SemanticSuggestionsScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';
  const { data, loading } = useSemanticIndex();
  const { entries } = useMyConcepts(60);
  const [filter, setFilter] = useState<Filter>('all');

  const mineLabels = useMemo(() => new Set(entries.map((e) => e.label)), [entries]);

  const suggestions = useMemo(() => {
    const featured = data?.featuredConcepts ?? [];
    const communityConcepts = (data?.communities ?? []).flatMap((c) =>
      c.concept_ids.map((id) => ({ id, name: id })),
    );
    const seen = new Set<string>();
    const rows = [
      ...featured.map((c) => ({
        id: c.concept.id,
        label: conceptLabel(c.concept, lang),
        verses: c.verseKeys.length,
      })),
      ...communityConcepts.map((c) => ({ id: c.id, label: c.name, verses: 0 })),
    ].filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    const filtered = filter === 'mine' ? rows.filter((r) => mineLabels.has(r.label)) : rows;
    return filtered.sort((a, b) => b.verses - a.verses).slice(0, 20);
  }, [data, filter, lang, mineLabels]);

  return (
    <FullScreenPage
      title={t('tree.suggestions', 'Suggestions')}
      subtitle={t('tree.suggestionsSub', 'Prochaines branches à explorer')}
      backPath="/semantic/tags"
    >
      <div className="flex flex-col gap-4">
        <Segmented<Filter>
          label={t('tree.suggestionsFilter', 'Filtrer les suggestions')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('familyPlus.all', 'Tout') },
            { value: 'mine', label: t('tree.mine', 'Mes tags') },
          ]}
        />

        {loading ? (
          <LoadingBlock label={t('common.loading', 'Chargement…')} className="py-10" />
        ) : suggestions.length === 0 ? (
          <EmptyState
            title={t('tree.noSuggestions', 'Aucune suggestion disponible')}
            description={t(
              'tree.noSuggestionsDesc',
              'Les suggestions viennent de la base sémantique locale. Tant qu’elle n’est pas installée, vos propres tags restent la seule source.',
            )}
            actionLabel={t('tree.newTag', 'Nouveau tag')}
            onAction={() => navigate('/semantic/tags/new')}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {suggestions.map((row) => (
              <li key={row.id}>
                <SectionCard className="p-0">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/semantic/node?conceptId=${encodeURIComponent(row.id)}`)
                    }
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tint text-primary">
                      <DuoIcon icon={Compass} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-text-primary">
                        {row.label}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {row.verses > 0
                          ? t('tree.versesCount', '{{count}} versets', { count: row.verses })
                          : t('tree.inBase', 'Présent dans la base')}
                      </span>
                    </span>
                    <DuoIcon icon={ChevronRight} size={18} className="text-text-muted" />
                  </button>
                </SectionCard>
              </li>
            ))}
          </ul>
        )}

        <HintNote>
          {t(
            'tree.suggestionsSource',
            'Suggestions calculées à partir de la base et de tes tags — aucune liste écrite à la main.',
          )}
        </HintNote>

        <Button variant="outline" className="w-full" onClick={() => navigate('/semantic/tags')}>
          {t('tree.myTags', 'Mes tags')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

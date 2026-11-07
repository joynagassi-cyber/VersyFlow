/**
 * Arbres sémantiques — Mes tags (kit `t1_arbre_mes_tags`).
 *
 * Liste les concepts que l'utilisateur a réellement créés (`useMyConcepts`),
 * avec le nombre de versets rattachés. Aucun compteur n'est simulé : un tag
 * sans verset affiche « 0 verset » et propose d'en ajouter.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Tag01Icon as Tag,
  Add01Icon as PlusSign,
  ChevronRightIcon as ChevronRight,
  HierarchyIcon as Tree,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { LoadingBlock } from '@/components/ui/Skeleton';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMyConcepts } from '@/hooks/useSemanticViews';
import { formatVerseKey } from '@/hooks/useSemanticTags';

export default function SemanticTagsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { entries, loading } = useMyConcepts();

  return (
    <FullScreenPage
      title={t('tree.myTags', 'Mes tags')}
      subtitle={t('tree.subtitle', 'Arbres sémantiques')}
      backPath="/semantic"
      right={
        <button
          type="button"
          onClick={() => navigate('/semantic/tags/new')}
          aria-label={t('tree.newTag', 'Nouveau tag')}
          className="rounded-full bg-surface-tint p-2"
        >
          <DuoIcon icon={PlusSign} size={18} className="text-primary" />
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {loading ? (
          <LoadingBlock label={t('common.loading', 'Chargement…')} className="py-10" />
        ) : entries.length === 0 ? (
          <EmptyState
            title={t('tree.noTags', 'Aucun tag personnel pour l’instant')}
            description={t(
              'tree.noTagsDesc',
              'Un tag relie un verset à un concept : « Amour », « Prière », ce que vous voulez retenir. Il devient une branche de votre arbre.',
            )}
            actionLabel={t('tree.newTag', 'Nouveau tag')}
            onAction={() => navigate('/semantic/tags/new')}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li key={entry.concept.id}>
                <SectionCard className="p-0">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/semantic/tree?conceptId=${encodeURIComponent(entry.concept.id)}`)
                    }
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tint text-primary">
                      <DuoIcon icon={Tag} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-text-primary">
                        {entry.label}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {t('tree.versesCount', '{{count}} versets', { count: entry.verseKeys.length })}
                        {entry.verseKeys.length > 0
                          ? ` · ${entry.verseKeys.slice(0, 3).map(formatVerseKey).join(' · ')}`
                          : ''}
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
            'tree.multiTagHint',
            'Un verset peut avoir plusieurs tags. Les concepts de la base (Amour, Pardon…) sont fournis avec l’application ; vos tags personnels s’y ajoutent.',
          )}
        </HintNote>

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={() => navigate('/semantic/tags/new')}>
            <DuoIcon icon={PlusSign} size={16} />
            {t('tree.newTag', 'Nouveau tag')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/semantic/suggestions')}>
            <DuoIcon icon={Tree} size={16} />
            {t('tree.suggestions', 'Suggestions')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}

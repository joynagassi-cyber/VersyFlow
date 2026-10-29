/**
 * Arbres sémantiques — Détail d'un nœud (kit `t4_arbre_d_tail_d_un_n_ud`).
 *
 * Montre le nœud, ses sous-branches réelles et **pourquoi** il est relié
 * (relation + confiance + provenance quand la base en fournit). Le bouton
 * « Ajouter un verset » renvoie vers l'écran de tag ; « Réviser » vers la
 * session de branche.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight01Icon as ArrowRight,
  Add01Icon as PlusSign,
  Compass01Icon as Compass,
  Link02Icon as Link,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConceptView } from '@/hooks/useSemanticViews';
import { conceptLabel, formatVerseKey } from '@/hooks/useSemanticTags';

export default function SemanticNodeScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const conceptId = params.get('conceptId') ?? undefined;
  const { data, loading, notFound } = useConceptView(conceptId);
  const lang = i18n.language ?? 'fr';

  if (!conceptId || notFound) {
    return (
      <FullScreenPage title={t('tree.nodeTitle', 'Nœud')} backPath="/semantic/tree">
        <EmptyState
          title={loading ? t('common.loading', 'Chargement...') : t('tree.conceptNotFound', 'Concept introuvable')}
          description={t('tree.pickTagDesc', 'Un arbre se lit à partir d’un tag : ouvrez « Mes tags ».')}
          actionLabel={t('tree.myTags', 'Mes tags')}
          onAction={() => navigate('/semantic/tags')}
        />
      </FullScreenPage>
    );
  }

  if (!data) {
    return (
      <FullScreenPage title={t('tree.nodeTitle', 'Nœud')} backPath="/semantic/tree">
        <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
      </FullScreenPage>
    );
  }

  const node = data.concept;
  const label = conceptLabel(node.concept, lang);
  const parents = data.relations.filter((r) => r.depth === 0 || r.concept.id === node.concept.id);
  const children = data.relations.filter((r) => r.concept.id !== node.concept.id);

  return (
    <FullScreenPage title={label} subtitle={t('tree.nodeSubtitle', 'Détail du nœud')} backPath="/semantic/tree">
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={node.verseKeys.length} label={t('tree.verses', 'Versets')} />
            <StatTile value={children.length} label={t('tree.subBranches', 'Sous-branches')} />
            <StatTile value={node.communities.length} label={t('tree.communities', 'Communautés')} />
          </div>
        </SectionCard>

        <SectionCard title={t('tree.whyThisLink', 'Pourquoi ce lien')}>
          {parents.length === 0 ? (
            <HintNote>
              {t('tree.noProvenance', 'La base ne fournit pas de provenance pour ce nœud.')}
            </HintNote>
          ) : (
            <ul className="flex flex-col gap-2">
              {parents.map((relation) => (
                <li key={`${relation.concept.id}-${relation.depth}`} className="flex items-center gap-2">
                  <DuoIcon icon={Link} size={14} className="text-primary" />
                  <span className="text-sm text-text-primary">
                    {conceptLabel(relation.concept, lang)}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-text-muted">
                    {Math.round((relation.via?.confidence ?? 0) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('tree.subBranches', 'Sous-branches')}>
          {children.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('tree.noRelations', 'Ce tag n’a pas encore de branche.')}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {children.map((child) => (
                <li key={child.concept.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/semantic/node?conceptId=${encodeURIComponent(child.concept.id)}`)
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left"
                  >
                    <DuoIcon icon={ArrowRight} size={14} className="text-text-muted" />
                    <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                      {conceptLabel(child.concept, lang)}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {child.via?.relationType ?? 'RELATED'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {node.verseKeys.length > 0 && (
          <SectionCard title={t('tree.versesOf', 'Versets de ce tag')}>
            <div className="flex flex-wrap gap-2">
              {node.verseKeys.map((key) => (
                <span key={key} className="rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-primary">
                  {formatVerseKey(key)}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/semantic/tags/new')}>
            <DuoIcon icon={PlusSign} size={16} />
            {t('tree.addVerse', 'Ajouter un verset')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate(`/semantic/review?conceptId=${encodeURIComponent(node.concept.id)}`)}
          >
            <DuoIcon icon={Compass} size={16} />
            {t('tree.reviseNode', 'Réviser ce nœud')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}

/**
 * Arbres sémantiques — Arbre d'un tag (kit `t3_arbre_arbre_d_un_tag_react_flow`).
 *
 * Le kit dessine cet écran avec React Flow. Le dépôt n'a pas cette dépendance
 * et le contrat visuel du projet privilégie une **hiérarchie lisible** plutôt
 * qu'un canevas libre : l'arbre est donc rendu en branches indentées, avec le
 * même contenu (nœud racine, relations « produit », branches à explorer).
 *
 * Les relations viennent de `conceptView().relations` (BFS à 1 saut du
 * domaine) : chaque ligne est une arête réelle, avec sa confiance.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight01Icon as ArrowRight,
  HierarchyIcon as Tree,
  Compass01Icon as Compass,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConceptView } from '@/hooks/useSemanticViews';
import { conceptLabel, formatVerseKey } from '@/hooks/useSemanticTags';

export default function SemanticTreeScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const conceptId = params.get('conceptId') ?? undefined;
  const { data, loading, notFound } = useConceptView(conceptId);
  const lang = i18n.language ?? 'fr';

  if (!conceptId) {
    return (
      <FullScreenPage title={t('tree.treeTitle', 'Arbre')} backPath="/semantic/tags">
        <EmptyState
          title={t('tree.pickTag', 'Choisissez un tag')}
          description={t('tree.pickTagDesc', 'Un arbre se lit à partir d’un tag : ouvrez « Mes tags ».')}
          actionLabel={t('tree.myTags', 'Mes tags')}
          onAction={() => navigate('/semantic/tags')}
        />
      </FullScreenPage>
    );
  }

  if (loading) {
    return (
      <FullScreenPage title={t('tree.treeTitle', 'Arbre')} backPath="/semantic/tags">
        <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
      </FullScreenPage>
    );
  }

  if (notFound || !data) {
    return (
      <FullScreenPage title={t('tree.treeTitle', 'Arbre')} backPath="/semantic/tags">
        <EmptyState
          title={t('tree.conceptNotFound', 'Concept introuvable')}
          description={t(
            'tree.conceptNotFoundDesc',
            'Ce concept n’existe plus dans la base sémantique locale, ou elle n’est pas encore installée.',
          )}
          actionLabel={t('tree.myTags', 'Mes tags')}
          onAction={() => navigate('/semantic/tags')}
        />
      </FullScreenPage>
    );
  }

  const root = data.concept;
  const label = conceptLabel(root.concept, lang);
  const branches = data.relations.filter((node) => node.depth > 0);
  const solid = branches.filter((node) => (node.via?.confidence ?? 0) >= 0.7).length;

  return (
    <FullScreenPage
      title={label}
      subtitle={t('tree.versesCount', '{{count}} versets', { count: root.verseKeys.length })}
      backPath="/semantic/tags"
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={root.verseKeys.length} label={t('tree.verses', 'Versets')} />
            <StatTile value={branches.length} label={t('tree.branches', 'Branches')} />
            <StatTile value={solid} label={t('tree.solidBranches', 'Solides')} />
          </div>
        </SectionCard>

        <SectionCard title={t('tree.relations', 'Relations')}>
          {branches.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t(
                'tree.noRelations',
                'Ce tag n’a pas encore de branche : ajoutez d’autres concepts au même verset pour le relier.',
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2 rounded-xl bg-surface-tint px-3 py-2">
                <DuoIcon icon={Tree} size={16} className="text-primary" />
                <span className="text-sm font-bold text-text-primary">{label}</span>
                <span className="ml-auto text-[11px] text-text-muted">
                  {t('tree.rootTag', 'tag racine')}
                </span>
              </li>
              {branches.map((node) => {
                const childLabel = conceptLabel(node.concept, lang);
                const confidence = Math.round((node.via?.confidence ?? 0) * 100);
                return (
                  <li key={node.concept.id} className="ml-4">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/semantic/node?conceptId=${encodeURIComponent(node.concept.id)}`)
                      }
                      className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-left"
                    >
                      <DuoIcon icon={ArrowRight} size={14} className="text-text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {childLabel}
                        </span>
                        <span className="block text-[11px] text-text-muted">
                          {node.via?.relationType ?? 'RELATED'} · {confidence}%
                        </span>
                      </span>
                      {confidence < 70 && (
                        <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                          {t('tree.explore', 'à explorer')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {root.verseKeys.length > 0 && (
          <SectionCard title={t('tree.versesOf', 'Versets de ce tag')}>
            <div className="flex flex-wrap gap-2">
              {root.verseKeys.slice(0, 12).map((key) => (
                <span
                  key={key}
                  className="rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-primary"
                >
                  {formatVerseKey(key)}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        <HintNote>
          {t(
            'tree.treeNotGraph',
            'Rendu en branches lisibles plutôt qu’en canevas libre : le dépôt n’embarque pas React Flow, et une hiérarchie se lit mieux au clavier comme au lecteur d’écran.',
          )}
        </HintNote>

        <div className="flex flex-wrap gap-2">
          <Button
            className="flex-1"
            onClick={() => navigate(`/semantic/review?conceptId=${encodeURIComponent(root.concept.id)}`)}
          >
            <DuoIcon icon={Compass} size={16} />
            {t('tree.reviseBranch', 'Réviser une branche')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/semantic/suggestions')}>
            {t('tree.suggestions', 'Suggestions')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}

/**
 * Arbres sémantiques — Rattacher un tag (kit `t7_arbre_rattacher_un_tag`).
 *
 * **Ce que l'écran peut faire, et ce qu'il ne peut pas faire encore.**
 * Le dépôt expose l'écriture d'un lien *verset → concept*
 * (`saveVerseTag`) mais **aucune** écriture de relation *concept → concept*.
 * Cet écran montre donc la décision (quel concept de la base ressemble à votre
 * tag personnel), propose « garder comme concept personnel » — qui est une
 * action réelle — et explique que la fusion de deux concepts n'est pas encore
 * disponible, au lieu d'un bouton qui ne ferait rien.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Tag01Icon as Tag,
  Link02Icon as Link,
  InformationCircleIcon as Info,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/family/FamilyKit';
import { useMyConcepts, useSemanticIndex } from '@/hooks/useSemanticViews';
import { conceptLabel } from '@/hooks/useSemanticTags';
import { cn } from '@/lib/utils';

export default function SemanticAttachScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';
  const { entries } = useMyConcepts(30);
  const { data } = useSemanticIndex();
  const [personal] = useState(true);

  const base = (data?.featuredConcepts ?? []).map((c) => ({
    id: c.concept.id,
    label: conceptLabel(c.concept, lang),
    verses: c.verseKeys.length,
  }));

  return (
    <FullScreenPage
      title={t('tree.attachTag', 'Rattacher un tag')}
      subtitle={t('tree.attachSubtitle', 'Tag personnel')}
      backPath="/semantic/tags"
    >
      <div className="flex flex-col gap-4">
        <SectionCard title={t('tree.yourTag', 'Ton tag')}>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('tree.noTagsShort', 'Aucun tag personnel : créez-en un d’abord.')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {entries.slice(0, 5).map((entry) => (
                <li key={entry.concept.id} className="flex items-center gap-2">
                  <DuoIcon icon={Tag} size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-text-primary">{entry.label}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {t('tree.versesCount', '{{count}} versets', { count: entry.verseKeys.length })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('tree.baseConceptsTitle', 'Concepts de la base')}>
          {base.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t(
                'tree.baseEmpty',
                'La base sémantique n’est pas installée sur cet appareil : il n’y a rien à rapprocher pour l’instant.',
              )}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-divider">
              {base.slice(0, 8).map((concept) => (
                <li key={concept.id} className="flex items-center gap-2 py-2">
                  <DuoIcon icon={Link} size={14} className="text-text-muted" />
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                    {concept.label}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('tree.versesCount', '{{count}} versets', { count: concept.verses })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title={t('tree.decisionTitle', 'Décision')}>
          <label
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3',
              personal ? 'border-primary bg-surface-tint' : 'border-border',
            )}
          >
            <input
              type="radio"
              checked={personal}
              readOnly
              className="mt-1 accent-[var(--color-primary)]"
              aria-label={t('tree.keepAsPersonal', 'Garder comme concept personnel')}
            />
            <span>
              <span className="block text-sm font-semibold text-text-primary">
                {t('tree.keepAsPersonal', 'Garder comme concept personnel')}
              </span>
              <span className="block text-xs text-text-muted">
                {t(
                  'tree.noAutoMerge',
                  'Aucun rapprochement automatique : c’est toi qui choisis.',
                )}
              </span>
            </span>
          </label>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-tint px-3 py-2">
            <DuoIcon icon={Info} size={14} className="mt-0.5 shrink-0 text-text-muted" />
            <p className="text-xs leading-5 text-text-muted">
              {t(
                'tree.attachUnavailable',
                'Rattacher deux concepts entre eux n’est pas encore possible : le dépôt n’expose pas d’écriture de relation concept → concept. Le bouton n’est donc pas affiché, plutôt qu’affiché sans effet.',
              )}
            </p>
          </div>
        </SectionCard>

        <Button variant="outline" className="w-full" onClick={() => navigate('/semantic/tags')}>
          {t('tree.myTags', 'Mes tags')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

/**
 * Arbres sémantiques — Données sémantiques (kit `t8_arbre_donn_es_s_mantiques`).
 *
 * L'écran ne fabrique **aucun** numéro de version : il mesure ce qui est
 * réellement installé (nombre de concepts, de communautés, de langues de
 * libellés présentes dans les données) et liste les sources déclarées par le
 * domaine (`CONCEPT_SOURCES`). Un « non installé » est affiché comme tel.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Database01Icon as Database,
  GlobeIcon as Globe,
  Download01Icon as Download,
  InformationCircleIcon as Info,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { useSemanticIndex } from '@/hooks/useSemanticViews';
import { CONCEPT_SOURCES } from '@/domains/semantic-memory';

export default function SemanticDataScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, loading } = useSemanticIndex();

  const stats = useMemo(() => {
    const featured = data?.featuredConcepts ?? [];
    const communities = data?.communities ?? [];
    const languages = new Set<string>();
    for (const item of featured) {
      for (const code of Object.keys(item.concept.labels_by_language ?? {})) languages.add(code);
    }
    return {
      concepts: featured.length,
      communities: communities.length,
      verses: featured.reduce((sum, item) => sum + item.verseKeys.length, 0),
      languages: Array.from(languages).sort(),
    };
  }, [data]);

  const installed = stats.concepts > 0 || stats.communities > 0;

  return (
    <FullScreenPage
      title={t('tree.dataTitle', 'Données sémantiques')}
      subtitle={t('tree.dataSubtitle', 'Base de l’arbre')}
      backPath="/semantic"
    >
      <div className="flex flex-col gap-4">
        <SectionCard title={t('tree.installedVersion', 'État de la base locale')}>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={stats.concepts} label={t('tree.concepts', 'Concepts')} />
            <StatTile value={stats.communities} label={t('tree.communities', 'Communautés')} />
            <StatTile value={stats.verses} label={t('tree.links', 'Liens versets')} />
          </div>
          <div className="mt-3">
            <HintNote>
              {loading
                ? t('common.loading', 'Chargement...')
                : installed
                  ? t(
                      'tree.dataMeasured',
                      'Ces chiffres sont lus dans la base SQLite locale à l’ouverture de l’écran. Aucun numéro de version n’est affiché : la base n’en expose pas.',
                    )
                  : t(
                      'tree.dataEmpty',
                      'Aucune donnée sémantique installée sur cet appareil : l’arbre est vide, et l’écran ne prétend pas le contraire.',
                    )}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('tree.conceptLanguages', 'Langues des concepts')}>
          {stats.languages.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('tree.noLanguages', 'Aucun libellé multilingue dans les données installées.')}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {stats.languages.map((code) => (
                <li
                  key={code}
                  className="flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs text-text-primary"
                >
                  <DuoIcon icon={Globe} size={12} className="text-primary" />
                  {code}
                  <span className="text-text-muted">· {t('tree.installed', 'installé')}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <HintNote>
              {t(
                'tree.downloadHint',
                'Le téléchargement d’une langue supplémentaire n’est pas proposé ici : aucun paquet de données linguistiques n’est branché sur cet écran.',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('tree.sourcesTitle', 'Sources déclarées par le domaine')}>
          <div className="flex flex-wrap gap-2">
            {CONCEPT_SOURCES.map((source) => (
              <span
                key={source}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-text-primary"
              >
                {source}
              </span>
            ))}
          </div>
          <div className="mt-3">
            <HintNote>
              {t(
                'tree.sourcesNote',
                'Ce sont les sources que le domaine sait tracer (provenance de chaque concept). Les crédits détaillés (licences, URL) sont dans le manifeste de provenance livré avec les jeux de données.',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <div className="flex items-start gap-2 rounded-xl bg-surface-tint px-3 py-2">
          <DuoIcon icon={Info} size={14} className="mt-0.5 shrink-0 text-text-muted" />
          <p className="text-xs leading-5 text-text-muted">
            {t(
              'tree.offlineNote',
              'La base sémantique est locale : elle fonctionne hors ligne et ne fait aucun appel réseau à l’ouverture.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/semantic/tags')}>
            <DuoIcon icon={Database} size={16} />
            {t('tree.myTags', 'Mes tags')}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate('/settings/data')}>
            <DuoIcon icon={Download} size={16} />
            {t('familyPlus.dataSettings', 'Données')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}

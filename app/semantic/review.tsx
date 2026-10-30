/**
 * Arbres sémantiques — Réviser une branche (kit `t6_arbre_r_viser_une_branche`).
 *
 * Les versets de la branche viennent du concept ; la « maîtrise » affichée est
 * celle des enregistrements de mémorisation **locaux** quand le verset y figure,
 * et un tiret sinon. L'ordre est celui du kit : les plus fragiles d'abord.
 *
 * La session elle-même n'est pas rejouée ici : elle est lancée dans le lecteur
 * (`/review/session`), qui porte déjà FSRS et l'enregistrement des notes. Cet
 * écran choisit la branche et l'ordre, puis y renvoie.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass01Icon as Compass } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, StatTile } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConceptView } from '@/hooks/useSemanticViews';
import { conceptLabel, formatVerseKey } from '@/hooks/useSemanticTags';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';

interface VerseMastery {
  key: string;
  mastery: number | null;
}

export default function SemanticReviewScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';
  const [params] = useSearchParams();
  const conceptId = params.get('conceptId') ?? undefined;
  const { data, loading, notFound } = useConceptView(conceptId);
  const { activeProfile } = useActiveProfile();

  const [mastery, setMastery] = useState<Record<string, number>>({});
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const profileId = activeProfile?.id;
    if (!profileId) {
      setMeasured(false);
      return;
    }
    void (async () => {
      try {
        const service = getMemorizationService(profileId);
        const records = await service.getAllMemorized();
        if (cancelled) return;
        const map: Record<string, number> = {};
        for (const record of records) {
          const key = `${record.bookId}:${record.chapterNumber}:${record.verseNumber}`;
          // Le domaine n'expose pas d'indice de maîtrise continu : on lit le statut.
          map[key] = record.status === 'mastered' ? 100 : 40;
        }
        setMastery(map);
        setMeasured(true);
      } catch {
        if (!cancelled) setMeasured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeProfile?.id]);

  const verses: VerseMastery[] = useMemo(() => {
    const keys = data?.concept.verseKeys ?? [];
    const rows = keys.map((key) => ({ key, mastery: mastery[key] ?? null }));
    return rows.sort((a, b) => (a.mastery ?? 101) - (b.mastery ?? 101));
  }, [data, mastery]);

  if (!conceptId || notFound) {
    return (
      <FullScreenPage title={t('tree.reviseBranch', 'Réviser une branche')} backPath="/semantic/tags">
        <EmptyState
          title={t('tree.conceptNotFound', 'Concept introuvable')}
          description={t('tree.pickTagDesc', 'Un arbre se lit à partir d’un tag : ouvrez « Mes tags ».')}
          actionLabel={t('tree.myTags', 'Mes tags')}
          onAction={() => navigate('/semantic/tags')}
        />
      </FullScreenPage>
    );
  }

  if (loading || !data) {
    return (
      <FullScreenPage title={t('tree.reviseBranch', 'Réviser une branche')} backPath="/semantic/tree">
        <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
      </FullScreenPage>
    );
  }

  const label = conceptLabel(data.concept.concept, lang);
  const known = verses.filter((v) => v.mastery != null);
  const average =
    known.length > 0
      ? Math.round(known.reduce((sum, v) => sum + (v.mastery ?? 0), 0) / known.length)
      : null;

  return (
    <FullScreenPage
      title={t('tree.reviseTitle', 'Réviser : {{name}}', { name: label })}
      subtitle={t('tree.branchOf', 'Branche de votre arbre')}
      backPath={`/semantic/tree?conceptId=${encodeURIComponent(conceptId)}`}
    >
      <div className="flex flex-col gap-4">
        <SectionCard>
          <div className="grid grid-cols-3 gap-2">
            <StatTile value={verses.length} label={t('tree.verses', 'Versets')} />
            <StatTile value={measured ? known.length : '—'} label={t('tree.measured', 'Mesurés')} />
            <StatTile value={average ?? '—'} label={t('tree.mastery', 'Maîtrise')} />
          </div>
        </SectionCard>

        <SectionCard title={t('tree.versesOf', 'Versets de ce tag')}>
          {verses.length === 0 ? (
            <p className="text-sm text-text-muted">
              {t('tree.noVersesInBranch', 'Aucun verset rattaché à ce tag pour l’instant.')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-divider">
              {verses.map((verse) => (
                <li key={verse.key} className="flex items-center gap-3 py-2">
                  <span className="font-mono text-xs text-text-primary">
                    {formatVerseKey(verse.key)}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-text-muted">
                    {verse.mastery == null
                      ? t('tree.notMemorized', 'non mémorisé')
                      : `${verse.mastery}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <HintNote>
          {t(
            'tree.orderWeakestFirst',
            'Ordre : les plus fragiles d’abord. Un verset non mémorisé passe avant tous les autres.',
          )}
        </HintNote>

        <Button className="w-full" onClick={() => navigate('/review/session')}>
          <DuoIcon icon={Compass} size={16} />
          {t('tree.startSession', 'Lancer la session')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

/**
 * Famille — Présentation (kit `m2_famille_pr_sentation`).
 *
 * Écran d'entrée : trois promesses, puis « Créer ma famille » ou « Plus tard ».
 * Aucune donnée : c'est un écran de décision, il doit rester vrai même sans
 * compte connecté.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserMultiple02Icon as Users,
  RankingIcon as Ranking,
  SmartPhone01Icon as Phone,
  ArrowRight01Icon as ArrowRight,
} from '@hugeicons/core-free-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/family/FamilyKit';

const PILLARS = [
  { icon: Phone, titleKey: 'familyPlus.pillarOfflineTitle', bodyKey: 'familyPlus.pillarOfflineBody', fallbackTitle: 'Un seul appareil', fallbackBody: 'Hors ligne, sans compte.' },
  { icon: Users, titleKey: 'familyPlus.pillarPaceTitle', bodyKey: 'familyPlus.pillarPaceBody', fallbackTitle: 'Chacun son rythme', fallbackBody: 'Une courbe de mémoire par personne.' },
  { icon: Ranking, titleKey: 'familyPlus.pillarRankTitle', bodyKey: 'familyPlus.pillarRankBody', fallbackTitle: 'Classement et défis', fallbackBody: 'Motivez-vous à chaque révision.' },
];

export default function FamilyPresentationScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <FullScreenPage title={t('familyPlus.presentationTitle', 'La famille')} column="narrow">
      <div className="flex flex-col gap-4">
        <SectionCard>
          <h1 className="text-2xl font-extrabold leading-tight text-text-primary">
            {t('familyPlus.presentationHero', 'Mémorisez ensemble')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {t('familyPlus.presentationSub', 'Chacun garde son rythme, la famille garde le cap.')}
          </p>
        </SectionCard>

        {PILLARS.map(({ icon, titleKey, bodyKey, fallbackTitle, fallbackBody }) => (
          <SectionCard key={titleKey}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
                <DuoIcon icon={icon} size={20} />
              </span>
              <div>
                <p className="text-base font-semibold text-text-primary">
                  {t(titleKey, fallbackTitle)}
                </p>
                <p className="mt-1 text-sm text-text-muted">{t(bodyKey, fallbackBody)}</p>
              </div>
            </div>
          </SectionCard>
        ))}

        <div className="mt-2 flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate('/family/create')}>
            {t('familyPlus.createFamilyCta', 'Créer ma famille')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => navigate('/tabs/home')}>
            {t('familyPlus.later', 'Plus tard')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}

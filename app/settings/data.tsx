/**
 * Settings — Activités & Données personnelles screen.
 *
 * A lightweight "my data" summary answering the spec point "les paramètres
 * divisés: activités, stats, tags, highlights":
 *   - highlight count (user-flagged verses, from the highlight store)
 *   - link to the existing stats screen (/tabs/progress)
 *   - link to semantic tags (/semantic)
 *   - link to review history (/review/history)
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BarChartIcon as BarChart3,
  ListChecksIcon as ListChecks,
  Tag01Icon as Tag,
  HistoryIcon as History,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ListItem } from '@/components/ui/ListItem';
import { useHighlightStore } from '@/store/highlight-store';
import { DemoModePanel } from '@/components/dev/DemoModePanel';

export default function SettingsDataScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const highlightCount = useHighlightStore((s) => s.keys.length);

  return (
    <FullScreenPage
      title={t('settings.activitiesSection', 'Activités & Données')}
      showBack
      backPath="/tabs/settings"
    >
      <div className="screen-column space-y-5">
        {/* Highlights summary card */}
        <div className="glass rounded-2xl p-4">
          <p className="mb-2 flex items-center gap-2 section-label">
            <DuoIcon icon={ListChecks} size={13} className="text-primary" />
            {t('settings.dataHighlights', 'Mes highlights')}
          </p>
          <p className="text-sm text-text-secondary">
            {t('settings.dataHighlightsCount', { count: highlightCount })}
          </p>
        </div>

        {/* Démo / données réelles — visible en permanence, pas seulement en démo */}
        <DemoModePanel />

        {/* Activity links */}
        <div className="glass overflow-hidden rounded-2xl">
          <div className="px-4 pt-4">
            <p className="section-label">
              {t('settings.dataActivities', 'Mes activités')}
            </p>
          </div>
          <div className="mt-2 flex flex-col divide-y divide-[color:var(--color-divider)]">
            <ListItem
              icon={BarChart3}
              label={t('settings.dataStats', 'Mes statistiques')}
              value=""
              onClick={() => navigate('/tabs/progress')}
              showChevron
              iconBgClass="bg-surface-tint text-primary"
            />
            <ListItem
              icon={Tag}
              label={t('settings.dataSemanticTags', 'Mes tags sémantiques')}
              value=""
              onClick={() => navigate('/semantic')}
              showChevron
              iconBgClass="bg-surface-tint text-primary"
            />
            <ListItem
              icon={History}
              label={t('settings.dataReviewHistory', 'Historique de mes révisions')}
              value=""
              onClick={() => navigate('/review/history')}
              showChevron
              iconBgClass="bg-surface-tint text-primary"
            />
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}

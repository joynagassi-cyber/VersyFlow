import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Heart, Cpu } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Logo } from '@/components/brand/Logo';

const VERSION = '0.1.0';

export default function AboutScreen() {
  const { t } = useTranslation();

  const open = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <FullScreenPage
      title={t('settings.about', "A propos")}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface p-6 shadow-sm">
          <Logo size={72} />
          <p className="text-2xl font-extrabold text-text-primary">VersyFlow</p>
          <p className="text-sm text-text-muted">Version {VERSION}</p>
        </div>

        {/* About */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-base font-bold text-text-primary">
            <BookOpen size={18} className="text-primary" />
            {t('settings.about', "A propos")}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t('settings.aboutDescription',
              "VersyFlow vous aide a memoriser les versets bibliques grace a la science de la repetition espacee (FSRS).")}
          </p>
        </div>

        {/* Links */}
        <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {[
            { label: t('settings.documentation', 'Documentation'), url: 'https://github.com/your-org/versyflow' },
            { label: t('settings.supportLink', 'Support'), url: 'mailto:support@versyflow.com' },
            { label: t('settings.privacyPolicy', 'Politique de confidentialite'), url: 'https://versyflow.com/privacy' },
          ].map((l, i) => (
            <button
              key={i}
              onClick={() => open(l.url)}
              className="flex w-full items-center justify-between border-b border-[color:var(--color-divider)] px-4 py-3.5 last:border-0"
            >
              <span className="text-base font-medium text-primary">{l.label}</span>
              <ExternalLink size={16} className="text-text-muted" />
            </button>
          ))}
        </div>

        {/* Credits */}
        <div className="space-y-2 rounded-2xl bg-surface p-4 text-center shadow-sm">
          <p className="flex items-center justify-center gap-2 text-sm text-text-secondary">
            <Heart size={14} className="text-primary" />
            {t('settings.creditMission', 'Developpe avec amour pour la gloire de Dieu')}
          </p>
          <p className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <Cpu size={14} />
            {t('settings.creditEngine', 'Moteur FSRS par Dmytro Gutman')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}

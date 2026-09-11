/**
 * Welcome Screen — Onboarding entry point
 * Tailwind + i18n + Lucide
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const skip = () => {
    navigate('/tabs/home');
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-surface-tint">
        <Sparkles className="text-primary" size={32} />
      </div>
      <h1 className="text-4xl font-extrabold text-primary">
        {t('common.appName')}
      </h1>
      <p className="mt-2 text-base text-text-tertiary">{t('onboarding.welcome')}</p>

      <div className="mt-12 w-full rounded-2xl bg-surface p-8 text-center shadow-md">
        <p className="text-lg font-semibold text-text-primary">
          {t('onboarding.slide1Title')}
        </p>
        <p className="mt-2 text-sm text-text-muted">{t('onboarding.slide1Desc')}</p>
      </div>

      <div className="mt-16 flex w-full gap-4">
        <Button variant="ghost" className="flex-1" onClick={skip}>
          {t('common.skip')}
        </Button>
        <Button variant="default" className="flex-[2]" onClick={() => navigate('/onboarding/language-select')}>
          {t('common.continue')}
        </Button>
      </div>
    </div>
  );
}

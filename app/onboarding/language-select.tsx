/**
 * Language Picker Screen — Onboarding step 2/6
 * 5 languages in cards, RTL badge for Arabic, sets UI language + i18next.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  CheckIcon as Check,
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  LanguagesIcon as Languages,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SUPPORTED_LANGUAGES, isRTL } from '@/services/i18n-service';
import { useSettingsStore } from '@/store/settings-store';

export default function LanguagePickerScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const setUiLanguage = useSettingsStore((s) => s.setUiLanguage);
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const [selected, setSelected] = useState(uiLanguage || 'fr');

  const selectLanguage = (code: string) => {
    setSelected(code);
    setUiLanguage(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  };

  return (
    <OnboardingShell
      step={2}
      title={t('onboarding.selectLanguage', 'Choisir votre langue')}
      subtitle={t(
        'onboarding.selectLanguageHint',
        'L’interface s’adapte immédiatement à votre langue de lecture.',
      )}
      onBack={() => navigate('/onboarding/welcome')}
      backLabel={t('common.back', 'Retour')}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/welcome')}
          >
            <DuoIcon icon={ArrowLeft} size={16} />
            {t('common.back', 'Retour')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => navigate('/onboarding/translation-select')}
          >
            {t('common.continue', 'Continuer')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              type="button"
              key={lang.code}
              aria-pressed={isSelected}
              onClick={() => selectLanguage(lang.code)}
              className={cn(
                'flex items-center justify-between rounded-2xl border-2 bg-surface p-4 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected ? 'border-primary bg-surface-tint' : 'border-transparent',
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <DuoIcon icon={Languages} size={18} className="text-primary" />
                  <span className="text-lg font-semibold text-text-primary">{lang.name}</span>
                  {lang.rtl && (
                    <span className="rounded bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
                      RTL
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-muted">{lang.displayName}</p>
                {lang.rtl && (
                  <p className="mt-1 text-xs text-primary">{t('onboarding.rtlWarning')}</p>
                )}
              </div>
              {isSelected && <DuoIcon icon={Check} size={22} className="text-primary" />}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}

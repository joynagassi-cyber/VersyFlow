/**
 * Language Picker Screen — Onboarding step 1
 * 5 languages in cards, RTL badge for Arabic, sets UI language + i18next.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LANGUAGES, isRTL } from '@/domains/i18n/config';
import { I18nService } from '@/services/i18n-service';
import { useSettingsStore } from '@/store/settings-store';

export default function LanguagePickerScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUiLanguage, uiLanguage } = useSettingsStore();
  const [selected, setSelected] = useState(uiLanguage || 'fr');

  const selectLanguage = (code: string) => {
    setSelected(code);
    setUiLanguage(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex min-h-full flex-col p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/onboarding/welcome')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('onboarding.selectLanguage')}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={cn(
                'flex items-center justify-between rounded-xl border-2 bg-surface p-4 text-left shadow-sm transition-colors',
                isSelected
                  ? 'border-primary bg-surface-tint'
                  : 'border-transparent',
              )}
            >
              <div>
                <div className="flex items-center gap-2">
                  <Languages size={18} className="text-primary" />
                  <span className="text-lg font-semibold text-text-primary">
                    {lang.name}
                  </span>
                  {lang.rtl && (
                    <span className="rounded bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-primary">
                      RTL
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-muted">{lang.displayName}</p>
                {lang.rtl && (
                  <p className="mt-1 text-xs text-primary">
                    {t('onboarding.rtlWarning')}
                  </p>
                )}
              </div>
              {isSelected && <Check size={22} className="text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/onboarding/welcome')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
        <Button className="flex-1" onClick={() => navigate('/onboarding/translation-select')}>
          {t('common.continue')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

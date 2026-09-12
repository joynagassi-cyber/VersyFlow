/**
 * Translation Picker Screen — Onboarding step 2
 * Default: LSG (Louis Segond 1910)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';

// Both bundled translations are selectable; LSG stays the default.
const TRANSLATIONS = [
  { id: 'lsg', name: 'Louis Segond (1910)', year: '1910', style: 'Classique', isDefault: true },
  { id: 'ostervald', name: 'Ostervald (1930)', year: '1930', style: 'Classique', isDefault: false },
] as const;

export default function TranslationPickerScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBibleTranslation, bibleTranslation } = useSettingsStore();
  const { setPreference } = useTranslationPreference();
  const [selected, setSelected] = useState(bibleTranslation || 'lsg');

  const select = (id: string) => {
    setSelected(id);
    setBibleTranslation(id);
    setPreference(id); // persist via PowerSync when a session exists
  };

  return (
    <div className="flex min-h-full flex-col p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/onboarding/language-select')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('onboarding.selectTranslation')}
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-4">
        {TRANSLATIONS.map((trans) => {
          const isSelected = selected === trans.id;
          return (
            <button
              key={trans.id}
              onClick={() => select(trans.id)}
              className={cn(
                'rounded-xl border-2 bg-surface p-5 text-left shadow-sm transition-colors',
                isSelected ? 'border-primary bg-surface-tint' : 'border-transparent',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-icon-bg-purple">
                    <BookText size={20} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-primary">{trans.name}</p>
                    <p className="text-sm text-text-muted">
                      {trans.year} • {trans.style}
                    </p>
                  </div>
                </div>
                {isSelected && <Check size={22} className="text-primary" />}
              </div>
              {trans.isDefault && (
                <span className="mt-3 inline-block rounded-full bg-surface-tint px-3 py-1 text-xs font-semibold text-primary">
                  {t('onboarding.defaultTranslation')}
                  </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/onboarding/language-select')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
        <Button className="flex-1" onClick={() => navigate('/onboarding/session-config')}>
          {t('common.continue')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Translation Picker Screen — Onboarding step 2
 * Catalogue-driven: lists every available translation, grouped by language.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import {
  DEFAULT_BIBLE_TRANSLATIONS,
  DEFAULT_TRANSLATION_ID,
} from '@/domains/bible/registry';

const catalog = DEFAULT_BIBLE_TRANSLATIONS.filter((t) => t.available);
const byLanguage = new Map<string, typeof catalog>();
for (const t of catalog) {
  const key = t.language.toLowerCase();
  const arr = byLanguage.get(key) ?? [];
  arr.push(t);
  byLanguage.set(key, arr);
}
const groups = [...byLanguage.entries()].map(([language, items]) => ({
  language,
  items: items.sort((a, b) => a.name.localeCompare(b.name)),
}));

export default function TranslationPickerScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setBibleTranslation, bibleTranslation } = useSettingsStore();
  const { setPreference } = useTranslationPreference();
  const [selected, setSelected] = useState(bibleTranslation || DEFAULT_TRANSLATION_ID);

  const select = (id: string) => {
    setSelected(id);
    setBibleTranslation(id);
    setPreference(id); // persist via PowerSync when a session exists
  };

  const selectedManifest = catalog.find((x) => x.id === selected);

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

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {groups.map((group) => (
          <section key={group.language}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {group.language.toUpperCase()}
            </h2>
            <div className="flex flex-col gap-2">
              {group.items.map((trans) => {
                const isSelected = selected === trans.id;
                return (
                  <button
                    key={trans.id}
                    onClick={() => select(trans.id)}
                    className={cn(
                      'rounded-xl border-2 bg-surface p-4 text-left shadow-sm transition-colors',
                      isSelected ? 'border-primary bg-surface-tint' : 'border-transparent',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-icon-bg-purple">
                          <BookText size={18} className="text-text-secondary" />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{trans.name}</p>
                          {trans.year && (
                            <p className="text-sm text-text-muted">
                              {trans.year}
                              {trans.author ? ` • ${trans.author}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={20} className="text-primary" />}
                    </div>
                    {trans.id === DEFAULT_TRANSLATION_ID && (
                      <span className="mt-2 inline-block rounded-full bg-surface-tint px-3 py-1 text-xs font-semibold text-primary">
                        {t('onboarding.defaultTranslation')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {selectedManifest && (
        <p className="mt-4 text-center text-sm text-text-muted">
          {selectedManifest.name}
        </p>
      )}

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

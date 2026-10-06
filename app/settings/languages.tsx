import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { SUPPORTED_LANGUAGES } from '@/services/i18n-service';
import { useSettingsStore } from '@/store/settings-store';
import { eventBus, DomainEventTypes } from '@/services/events-service';

export default function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const { uiLanguage, setUiLanguage } = useSettingsStore();
  const selected = uiLanguage || 'fr';

  return (
    <FullScreenPage
      title={t('settings.uiLanguage', "Langue de l'interface")}
      showBack
      backPath="/settings"
    >
      <div className="mx-auto max-w-md space-y-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => {
                const prev = uiLanguage;
                setUiLanguage(lang.code);
                eventBus.emit({
                  id: crypto.randomUUID(),
                  type: DomainEventTypes.LANGUAGE_CHANGED,
                  timestamp: Date.now(),
                  payload: { fromLanguage: prev, toLanguage: lang.code, isRTL: lang.rtl },
                });
              }}
              className={
                'flex w-full items-center justify-between rounded-2xl p-4 text-left ' +
                (active ? 'bg-surface ring-2 ring-[color:var(--color-primary)] shadow-sm' : 'bg-surface shadow-sm')
              }
            >
              <span className="flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-primary">{lang.name}</span>
                  {lang.rtl && (
                    <span className="rounded bg-surface-tint px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      RTL
                    </span>
                  )}
                </span>
                <span className="text-sm text-text-muted">{lang.displayName}</span>
              </span>
              {active && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </FullScreenPage>
  );
}

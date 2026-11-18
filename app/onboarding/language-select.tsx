/**
 * Onboarding — étape 2, « Langue ».
 *
 * 45 langues tiennent mal dans une liste à plat : on ajoute une recherche, et
 * on garde les deux langues de référence en tête. Le choix s'applique tout de
 * suite (i18next + direction du document), donc l'étape suivante est déjà
 * traduite — c'est le point de bascule du parcours.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { CheckIcon, LanguagesIcon, Search01Icon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, isRTL } from '@/services/i18n-service';
import { useSettingsStore } from '@/store/settings-store';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function LanguagePickerScreen() {
  const { t, i18n } = useTranslation();
  const setUiLanguage = useSettingsStore((s) => s.setUiLanguage);
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const [selected, setSelected] = useState(uiLanguage || 'fr');
  const [query, setQuery] = useState('');

  const selectLanguage = (code: string) => {
    setSelected(code);
    setUiLanguage(code);
    void i18n.changeLanguage(code);
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  };

  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return SUPPORTED_LANGUAGES;
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        normalize(lang.name).includes(needle) ||
        normalize(lang.displayName).includes(needle) ||
        normalize(lang.code).startsWith(needle),
    );
  }, [query]);

  return (
    <OnboardingShell
      stepId="language"
      eyebrow={t('onboarding.stepLanguage', 'Langue')}
      title={t('onboarding.selectLanguage', 'Choisissez votre langue')}
      subtitle={t(
        'onboarding.languageSubtitle',
        'L’interface et les textes de l’application suivent ce choix. Vous pourrez en changer à tout moment.',
      )}
      nextLabel={t('onboarding.chooseLanguageCta', 'Choisir ma langue')}
      onNext={() => selectLanguage(selected)}
    >
      <label
        id="onboarding-language-search-label"
        htmlFor="onboarding-language-search"
        className="sr-only"
      >
        {t('onboarding.searchLanguage', 'Rechercher une langue')}
      </label>
      <div className="relative">
        <DuoIcon
          icon={Search01Icon}
          size={20}
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          id="onboarding-language-search"
          aria-labelledby="onboarding-language-search-label"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('onboarding.searchLanguage', 'Rechercher une langue')}
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border border-border bg-surface ps-11 pe-4 text-[15px] text-text-primary placeholder:text-text-placeholder focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface p-4 text-sm text-text-secondary">
          {t('onboarding.noLanguageMatch', 'Aucune langue ne correspond à « {{query}} ».', {
            query,
          })}
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" role="list">
          {visible.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  aria-pressed={isSelected}
                  lang={lang.code}
                  className={cn(
                    'flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-primary/40',
                  )}
                >
                  <DuoIcon icon={LanguagesIcon} size={20} className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-text-primary">
                      {lang.name}
                    </span>
                    <span className="block truncate text-xs text-text-muted">{lang.displayName}</span>
                  </span>
                  {lang.rtl && (
                    <span className="rounded-full bg-surface-tint px-2 py-0.5 text-2xs font-bold text-text-secondary">
                      RTL
                    </span>
                  )}
                  {isSelected && <DuoIcon icon={CheckIcon} size={20} className="shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isRTL(selected) && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-surface-tint p-3 text-xs text-text-secondary">
          <DuoIcon icon={LanguagesIcon} size={16} className="text-primary" />
          {t('onboarding.rtlWarning', "L'interface passera en lecture droite-gauche")}
        </p>
      )}
    </OnboardingShell>
  );
}

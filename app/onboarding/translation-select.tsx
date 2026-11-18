/**
 * Onboarding — étape 4, « Traduction ».
 *
 * Le choix se fait en deux temps : le TYPE de version (classique / moderne /
 * révisée), puis la version elle-même, groupée par langue de lecture. Le
 * libellé public (LSG, KJV, NBV…) est mis en avant, jamais l'identifiant
 * technique. Les versions non embarquées sont marquées « téléchargement
 * requis » pour qu'aucun choix ne surprenne ensuite.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { BookTextIcon, CheckIcon, LanguagesIcon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useSettingsStore, type BibleVersionType } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { BIBLE_DATASET_CATALOG } from '@/services/bible-text-service';
import {
  getTranslationDisplayInfo,
  groupTranslationsByLanguage,
} from '@/services/bible-translation-names';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

const VERSION_TYPES: { id: BibleVersionType; i18nKey: string; label: string }[] = [
  { id: 'classical', i18nKey: 'onboarding.versionTypeClassical', label: 'Classique' },
  { id: 'modern', i18nKey: 'onboarding.versionTypeModern', label: 'Moderne' },
  { id: 'revised', i18nKey: 'onboarding.versionTypeRevised', label: 'Révisée' },
];

// The default two bundled translations plus a few popular remote ones,
// grouped by the user's chosen type. Every entry uses the public name
// (abbreviation) as its main label and the full name as a subtitle.
//
// Exported because the settings screen (Bible group) needs the SAME list to
// decide whether its version-type control actually filters a translation
// picker — today only this onboarding screen consumes `bibleVersionType`.
export const TRANSLATION_CHOICES: { id: string; versionTypes: BibleVersionType[] }[] = [
  { id: 'lsg', versionTypes: ['classical', 'revised'] },
  { id: 'ostervald', versionTypes: ['classical'] },
  { id: 'kujv', versionTypes: ['classical', 'revised'] },
  { id: 'web', versionTypes: ['modern'] },
  { id: 'webu', versionTypes: ['modern'] },
  { id: 'rv1909', versionTypes: ['classical', 'revised'] },
  { id: 'es-onbv', versionTypes: ['modern'] },
  { id: 'luther1912', versionTypes: ['classical', 'revised'] },
  { id: 'schlatter1951', versionTypes: ['modern'] },
  { id: 'da-1931', versionTypes: ['classical'] },
  { id: 'ru-synodal', versionTypes: ['classical', 'revised'] },
  { id: 'nl-nbg1951', versionTypes: ['classical'] },
  { id: 'sv-ntplus', versionTypes: ['modern'] },
  { id: 'la-vulgate', versionTypes: ['classical'] },
  { id: 'hi-irv', versionTypes: ['revised'] },
  { id: 'so-bible', versionTypes: ['modern'] },
];

export default function TranslationPickerScreen() {
  const { t } = useTranslation();
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const setBibleVersionType = useSettingsStore((s) => s.setBibleVersionType);
  const bibleVersionType = useSettingsStore((s) => s.bibleVersionType);
  const { setPreference } = useTranslationPreference();

  const [selected, setSelected] = useState(bibleTranslation || 'lsg');
  const [activeType, setActiveType] = useState<BibleVersionType>(bibleVersionType || 'classical');

  const select = (id: string) => {
    setSelected(id);
    setBibleTranslation(id);
    setBibleVersionType(activeType);
    setPreference(id); // persist via PowerSync when a session exists
  };

  const filtered = TRANSLATION_CHOICES.filter((c) => c.versionTypes.includes(activeType));
  const languageGroups = useMemo(
    () => groupTranslationsByLanguage(filtered.map((c) => c.id)),
    [filtered],
  );

  const renderTranslation = (id: string) => {
    const info = getTranslationDisplayInfo(id);
    const isSelected = selected === id;
    const available = BIBLE_DATASET_CATALOG.some((e) => e.id === id);
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => select(id)}
          aria-pressed={isSelected}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
            isSelected
              ? 'border-primary bg-primary/5'
              : 'border-border bg-surface hover:border-primary/40',
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint">
            <DuoIcon icon={BookTextIcon} size={20} className="text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-extrabold text-text-primary">
              {info.abbreviation}
              {info.abbreviation !== info.name && (
                <span className="ms-1.5 text-xs font-medium text-text-muted">· {info.name}</span>
              )}
            </span>
            <span className="block text-xs text-text-muted">
              {info.language
                ? t('onboarding.byLanguageSubtitle', { language: info.language })
                : ''}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            {isSelected && <DuoIcon icon={CheckIcon} size={20} className="text-primary" />}
            {!available && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-2xs font-bold uppercase text-warning">
                {t('onboarding.remoteVersion', 'Téléchargement requis')}
              </span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <OnboardingShell
      stepId="translation"
      eyebrow={t('onboarding.stepTranslation', 'Traduction')}
      title={t('onboarding.selectTranslation', 'Choisissez votre traduction biblique')}
      subtitle={t(
        'onboarding.selectTranslationHint',
        'Choisissez le type de version puis la traduction.',
      )}
      nextLabel={t('onboarding.chooseTranslationCta', 'Choisir cette version')}
      onNext={() => select(selected)}
    >
      <div role="group" aria-label={t('onboarding.versionType', 'Type de version')} className="grid grid-cols-3 gap-2">
        {VERSION_TYPES.map(({ id, i18nKey, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveType(id)}
            aria-pressed={activeType === id}
            className={cn(
              'min-h-11 rounded-2xl border text-sm font-semibold transition-colors',
              activeType === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-primary/40',
            )}
          >
            {t(i18nKey, label)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {languageGroups.map((group) => (
          <section key={group.language} aria-label={group.language}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.12em] text-text-secondary">
                <DuoIcon icon={LanguagesIcon} size={16} className="text-primary" />
                {group.language}
              </p>
              <span className="rounded-full bg-surface-tint px-2 py-0.5 text-2xs font-bold text-text-secondary">
                {t('onboarding.langVersionsCount', {
                  count: group.ids.length,
                  plural: group.ids.length > 1 ? 's' : '',
                })}
              </span>
            </div>
            <ul className="space-y-2" role="list">
              {group.ids.map((id) => renderTranslation(id))}
            </ul>
          </section>
        ))}
      </div>
    </OnboardingShell>
  );
}

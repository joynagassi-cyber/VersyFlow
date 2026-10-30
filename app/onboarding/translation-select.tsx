/**
 * Translation Picker Screen — Onboarding step 3/6.
 *
 * Shows the user a clear choice of Bible version by "type de version"
 * (classique / moderne / révisée). Within a type, the versions are
 * grouped by reader-language ("Français", "Anglais", …), each with its
 * count. The label is the public abbreviation (KJV, LSG, NBV…) and the
 * subtitle is the full conventional name — never the technical id.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  BookTextIcon as BookText,
  CheckIcon as Check,
  Layers01Icon as Layers,
  LanguagesIcon as Languages,
} from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useSettingsStore, type BibleVersionType } from '@/store/settings-store';
import { useTranslationPreference } from '@/hooks/useTranslationPreference';
import { BIBLE_DATASET_CATALOG } from '@/services/bible-text-service';
import {
  getTranslationDisplayInfo,
  groupTranslationsByLanguage,
} from '@/services/bible-translation-names';

const VERSION_TYPES: { id: BibleVersionType; i18nKey: string; label: string }[] = [
  { id: 'classical', i18nKey: 'onboarding.versionTypeClassical', label: 'Classique' },
  { id: 'modern', i18nKey: 'onboarding.versionTypeModern', label: 'Moderne' },
  { id: 'revised', i18nKey: 'onboarding.versionTypeRevised', label: 'Révisée' },
];

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
  const navigate = useNavigate();
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const setBibleVersionType = useSettingsStore((s) => s.setBibleVersionType);
  const bibleVersionType = useSettingsStore((s) => s.bibleVersionType);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const { setPreference } = useTranslationPreference();

  const [selected, setSelected] = useState(bibleTranslation || 'lsg');
  const [activeType, setActiveType] = useState<BibleVersionType>(
    bibleVersionType === 'classical' || bibleVersionType === 'modern' || bibleVersionType === 'revised'
      ? bibleVersionType
      : 'classical',
  );

  const select = (id: string) => {
    setSelected(id);
    setBibleTranslation(id);
    setBibleVersionType(activeType);
    setPreference(id);
  };

  const chooseType = (type: BibleVersionType) => {
    setActiveType(type);
    setBibleVersionType(type);
  };

  const skip = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  const filtered = TRANSLATION_CHOICES.filter((c) => c.versionTypes.includes(activeType));
  const languageGroups = useMemo(
    () => groupTranslationsByLanguage(filtered.map((c) => c.id)),
    [filtered],
  );

  const renderTranslation = (id: string) => {
    const info = getTranslationDisplayInfo(id);
    const isSelected = selected === id;
    const available = id === 'lsg' || BIBLE_DATASET_CATALOG.some((e) => e.id === id);
    return (
      <button
        type="button"
        key={id}
        aria-pressed={isSelected}
        onClick={() => select(id)}
        className={cn(
          'rounded-2xl border-2 p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isSelected ? 'border-primary bg-surface-tint' : 'border-transparent bg-surface',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint">
              <DuoIcon icon={BookText} size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold text-text-primary">
                {info.abbreviation}
                {info.abbreviation !== info.name && (
                  <span className="ml-1.5 text-sm font-medium text-text-muted">· {info.name}</span>
                )}
              </p>
              <p className="text-xs text-text-muted">
                {info.language
                  ? t('onboarding.byLanguageSubtitle', { language: info.language })
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isSelected && <DuoIcon icon={Check} size={18} className="text-primary" />}
            {!available && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
                {t('onboarding.remoteVersion', 'Téléchargement requis')}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <OnboardingShell
      step={3}
      title={t('onboarding.selectTranslation', 'Choisir votre Bible')}
      subtitle={t(
        'onboarding.selectTranslationHint',
        'Choisissez le type de version puis la traduction.',
      )}
      onBack={() => navigate('/onboarding/language-select')}
      backLabel={t('common.back', 'Retour')}
      onSkip={skip}
      skipLabel={t('common.skip', 'Passer')}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/onboarding/language-select')}
          >
            <DuoIcon icon={ArrowLeft} size={16} />
            {t('common.back', 'Retour')}
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => navigate('/onboarding/session-config')}
          >
            {t('common.continue', 'Continuer')}
            <DuoIcon icon={ArrowRight} size={16} />
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
          <DuoIcon icon={Layers} size={13} className="text-primary" />
          {t('onboarding.versionType', 'Type de version')}
        </p>
        <div className="flex gap-2" role="group" aria-label={t('onboarding.versionType', 'Type de version')}>
          {VERSION_TYPES.map(({ id, i18nKey, label }) => (
            <button
              type="button"
              key={id}
              aria-pressed={activeType === id}
              onClick={() => chooseType(id)}
              className={cn(
                'flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeType === id
                  ? 'border-primary bg-surface-tint text-primary'
                  : 'border-transparent bg-surface text-text-secondary shadow-sm',
              )}
            >
              {t(i18nKey, label)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {languageGroups.map((group) => (
          <div key={group.language}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-secondary">
                <DuoIcon icon={Languages} size={13} className="text-primary" />
                {group.language}
              </p>
              <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-bold text-text-secondary">
                {t('onboarding.langVersionsCount', { count: group.ids.length })}
              </span>
            </div>
            <div className="flex flex-col gap-3">{group.ids.map((id) => renderTranslation(id))}</div>
          </div>
        ))}
      </div>
    </OnboardingShell>
  );
}

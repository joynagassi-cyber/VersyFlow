/**
 * Onboarding — étape « Apparence » (personnalisation).
 *
 * C'est l'étape qui manquait : jusqu'ici le parcours ne proposait que la
 * langue, la traduction et les rappels, et l'accent choisi nulle part ne
 * pouvait donc être « perdu » entre le début et la fin — l'apparence restait
 * celle du thème par défaut.
 *
 * Ici, chaque réglage écrit IMMÉDIATEMENT dans `appearance-store`, que
 * `ThemeManager` traduit en `data-preset` / `data-theme` sur `<html>`. L'aperçu
 * n'est donc pas une maquette : c'est la vraie peinture de l'application, et
 * elle est déjà en place quand le parcours se termine.
 *
 * Note technique : on passe par `setPreset` (et non `setAccent`) parce que
 * `resolveTheme` lit la palette dans le preset tweakcn ; `accent` ne pilote que
 * l'accent extrait d'une image de fond. C'était la cause du « la couleur du
 * début ne s'applique pas à la fin ».
 */
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { CheckIcon, Settings01Icon } from '@/components/ui/solar-icons';
import { cn } from '@/lib/utils';
import { useAppearanceStore, type ThemeMode } from '@/store/appearance-store';
import { DEFAULT_PRESET, findPreset } from '@/theme/preset-catalog';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

/** Thèmes proposés à l'entrée : huit familles, pas trente-cinq. */
const CURATED_THEMES = [
  'lara-red',
  'emerald',
  'blue-enterprise',
  'cyan-future-teal',
  'orange-autoblog',
  'cream-space',
  'sand-lifeos',
  'yellow-sun',
];

const THEMES = CURATED_THEMES.map((id) => findPreset(id)).filter(
  (preset): preset is NonNullable<ReturnType<typeof findPreset>> => preset !== null,
);

const READING_SIZES = [
  { value: 16, labelKey: 'onboarding.sizeSmall', fallback: 'Petit' },
  { value: 19, labelKey: 'onboarding.sizeComfort', fallback: 'Confort' },
  { value: 22, labelKey: 'onboarding.sizeLarge', fallback: 'Grand' },
];

export default function PersonalizationScreen() {
  const { t } = useTranslation();
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const presetId = useAppearanceStore((s) => s.presetId);
  const bibleFontSize = useAppearanceStore((s) => s.bibleFontSize);
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode);
  const setPreset = useAppearanceStore((s) => s.setPreset);
  const setBibleFontSize = useAppearanceStore((s) => s.setBibleFontSize);

  const activeThemeId = presetId ?? DEFAULT_PRESET;
  const activeTheme = findPreset(activeThemeId);

  const modes: { value: ThemeMode; labelKey: string; fallback: string }[] = [
    { value: 'system', labelKey: 'onboarding.modeSystem', fallback: 'Système' },
    { value: 'light', labelKey: 'onboarding.modeLight', fallback: 'Clair' },
    { value: 'dark', labelKey: 'onboarding.modeDark', fallback: 'Sombre' },
  ];

  return (
    <OnboardingShell
      stepId="appearance"
      eyebrow={t('onboarding.appearanceEyebrow', 'Votre apparence')}
      title={t('onboarding.appearanceTitle', 'Rendez-le vôtre')}
      subtitle={t(
        'onboarding.appearanceSubtitle',
        'Choisissez vos couleurs et votre confort de lecture. Tout s’applique instantanément — et vous retrouverez exactement ce choix en entrant.',
      )}
      nextLabel={t('onboarding.appearanceCta', 'Garder cette apparence')}
      footerHint={
        <button
          type="button"
          onClick={() => {
            setPreset(DEFAULT_PRESET);
            setThemeMode('system');
            setBibleFontSize(19);
          }}
          className="min-h-11 font-semibold text-text-muted underline-offset-4 hover:underline"
        >
          {t('onboarding.appearanceReset', 'Revenir à l’apparence d’origine')}
        </button>
      }
    >
      {/* Aperçu : vrai rendu, vrais jetons — pas une image. */}
      <section
        aria-labelledby="appearance-preview-title"
        className="rounded-3xl border border-border bg-surface p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2
            id="appearance-preview-title"
            className="text-2xs font-bold uppercase tracking-[0.14em] text-text-muted"
          >
            {t('onboarding.appearancePreview', 'Aperçu en direct')}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-2xs font-bold text-primary">
            <DuoIcon icon={Settings01Icon} size={16} />
            {activeTheme?.label ?? DEFAULT_PRESET}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 h-9 w-1 shrink-0 rounded-full bg-primary"
          />
          <div>
            <p
              className="font-serif leading-relaxed text-text-primary"
              style={{ fontSize: `${bibleFontSize}px` }}
            >
              {t(
                'onboarding.previewVerse',
                'Car Dieu a tant aimé le monde qu’il a donné son Fils unique.',
              )}
            </p>
            <p className="mt-2 text-2xs font-bold uppercase tracking-[0.08em] text-primary">
              {t('onboarding.previewVerseRef', 'Jean 3:16 · LSG')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
            {t('onboarding.previewCta', 'Réviser ce verset')}
          </span>
          <span className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-text-secondary">
            {t('onboarding.previewSecondary', 'Plus tard')}
          </span>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {t('onboarding.appearanceAnnounce', 'Thème {{theme}}, mode {{mode}}', {
            theme: activeTheme?.label ?? DEFAULT_PRESET,
            mode: themeMode,
          })}
        </p>
      </section>

      <div className="mt-6 space-y-6">
        {/* Mode clair / sombre / système */}
        <section aria-labelledby="appearance-mode-title">
          <h2
            id="appearance-mode-title"
            className="mb-2 text-sm font-bold text-text-primary"
          >
            {t('onboarding.appearanceMode', 'Mode d’affichage')}
          </h2>
          <div
            role="group"
            aria-labelledby="appearance-mode-title"
            className="grid grid-cols-3 gap-2"
          >
            {modes.map((mode) => {
              const active = themeMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setThemeMode(mode.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border text-sm font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                  )}
                >
                  {active && <DuoIcon icon={CheckIcon} size={16} />}
                  {t(mode.labelKey, mode.fallback)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Palettes */}
        <section aria-labelledby="appearance-theme-title">
          <h2
            id="appearance-theme-title"
            className="mb-2 text-sm font-bold text-text-primary"
          >
            {t('onboarding.appearanceTheme', 'Couleur d’accent')}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="list">
            {THEMES.map((theme) => {
              const active = theme.id === activeThemeId;
              return (
                <li key={theme.id}>
                  <button
                    type="button"
                    onClick={() => setPreset(theme.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full min-h-[64px] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:border-primary/40',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 rounded-full ring-2 ring-inset ring-black/10"
                      style={{ backgroundColor: theme.swatch }}
                    />
                    <span className="flex w-full items-center justify-between gap-1">
                      <span className="text-2xs font-semibold text-text-primary">{theme.label}</span>
                      {active && (
                        <DuoIcon icon={CheckIcon} size={16} className="shrink-0 text-primary" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Confort de lecture */}
        <section aria-labelledby="appearance-size-title">
          <h2
            id="appearance-size-title"
            className="mb-2 text-sm font-bold text-text-primary"
          >
            {t('onboarding.appearanceReadingSize', 'Taille du texte biblique')}
          </h2>
          <div
            role="group"
            aria-labelledby="appearance-size-title"
            className="grid grid-cols-3 gap-2"
          >
            {READING_SIZES.map((size) => {
              const active = bibleFontSize === size.value;
              return (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setBibleFontSize(size.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-secondary hover:border-primary/40',
                  )}
                >
                  {t(size.labelKey, size.fallback)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-text-muted">
            {t(
              'onboarding.appearanceHint',
              'Ces réglages se retrouvent à tout moment dans Réglages → Apparence.',
            )}
          </p>
        </section>
      </div>

    </OnboardingShell>
  );
}

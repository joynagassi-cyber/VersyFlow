/**
 * Onboarding — étape 7, « Prêt » : la dernière ligne droite.
 *
 * Deux choses, dans cet ordre :
 *  1. ce que fait le moteur FSRS, en trois phrases (pas un cours) ;
 *  2. la **relecture des choix** — langue, apparence, traduction, rythme,
 *     rappels — avec la couleur réellement retenue.
 *
 * Ce récapitulatif est la réponse au défaut signalé : le thème choisi au début
 * du parcours doit se voir ici, et se retrouver intact une fois entré.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { BrainIcon, CheckIcon, Clock01Icon } from '@/components/ui/solar-icons';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useSettingsStore } from '@/store/settings-store';
import { useAppearanceStore } from '@/store/appearance-store';
import { SUPPORTED_LANGUAGES } from '@/services/i18n-service';
import { getTranslationDisplayInfo } from '@/services/bible-translation-names';
import { DEFAULT_PRESET, findPreset } from '@/theme/preset-catalog';

export default function FSRSIntroductionScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);

  const presetId = useAppearanceStore((s) => s.presetId);
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const sessionGoal = useAppearanceStore((s) => s.sessionGoal);
  const focusMode = useAppearanceStore((s) => s.focusMode);
  const reminderEnabled = useAppearanceStore((s) => s.reminderEnabled);
  const reminderFrequency = useAppearanceStore((s) => s.reminderFrequency);
  const reminderTime = useAppearanceStore((s) => s.reminderTime);

  const theme = findPreset(presetId ?? DEFAULT_PRESET);
  const language = SUPPORTED_LANGUAGES.find((l) => l.code === uiLanguage);
  const translation = getTranslationDisplayInfo(bibleTranslation);
  const modeLabel =
    themeMode === 'dark'
      ? t('onboarding.modeDark', 'Sombre')
      : themeMode === 'light'
        ? t('onboarding.modeLight', 'Clair')
        : t('onboarding.modeSystem', 'Système');

  const start = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  const principles = [
    {
      title: t('onboarding.fsrsPrinciple1', 'Jamais deux fois de trop'),
      desc: t(
        'onboarding.fsrsPrinciple1Desc',
        'Un verset déjà solide revient rarement ; un verset fragile revient demain.',
      ),
    },
    {
      title: t('onboarding.fsrsPrinciple2', 'Le bon intervalle, calculé'),
      desc: t(
        'onboarding.fsrsPrinciple2Desc',
        'Le moteur FSRS estime votre courbe d’oubli à chaque réponse et place la révision juste avant.',
      ),
    },
    {
      title: t('onboarding.fsrsPrinciple3', 'Vous gardez la main'),
      desc: t(
        'onboarding.fsrsPrinciple3Desc',
        'Vous notez la difficulté ressentie ; l’algorithme ajuste, vous décidez du rythme.',
      ),
    },
  ];

  return (
    <OnboardingShell
      stepId="ready"
      eyebrow={t('onboarding.readyEyebrow', 'Tout est prêt')}
      title={t('onboarding.readyTitle', 'Votre première session vous attend')}
      subtitle={t(
        'onboarding.readySubtitle',
        'Voici ce que vous avez choisi. Rien n’est définitif : tout se règle ensuite depuis Réglages.',
      )}
      nextLabel={t('onboarding.startWithSettingsCta', 'Démarrer avec ces réglages')}
      onNext={start}
      footerHint={t('onboarding.readyHint', 'Le verset du jour vous sera proposé dès l’accueil.')}
    >
      <section aria-labelledby="onboarding-recap-title" className="rounded-3xl border border-border bg-surface p-5">
        <h2
          id="onboarding-recap-title"
          className="text-2xs font-bold uppercase tracking-[0.14em] text-text-muted"
        >
          {t('onboarding.recapTitle', 'Votre configuration')}
        </h2>
        <dl className="mt-3 divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-text-secondary">{t('onboarding.recapLanguage', 'Langue')}</dt>
            <dd className="text-sm font-semibold text-text-primary">
              {language?.name ?? uiLanguage.toUpperCase()}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-text-secondary">{t('onboarding.recapTheme', 'Apparence')}</dt>
            <dd className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full ring-2 ring-inset ring-black/10"
                style={{ backgroundColor: theme?.swatch }}
              />
              {theme?.label ?? DEFAULT_PRESET} · {modeLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-text-secondary">{t('onboarding.recapTranslation', 'Traduction')}</dt>
            <dd className="text-sm font-semibold text-text-primary">
              {translation.abbreviation}
              {translation.name ? (
                <span className="ms-1.5 font-normal text-text-muted">· {translation.name}</span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-text-secondary">{t('onboarding.recapRhythm', 'Rythme')}</dt>
            <dd className="text-sm font-semibold text-text-primary">
              {t('onboarding.recapVerses', '{{count}} verset{{plural}} par session', {
                count: sessionGoal,
                plural: sessionGoal > 1 ? 's' : '',
              })}
              {focusMode ? ` · ${t('onboarding.sessionFocusTitle', 'Mode concentration')}` : ''}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm text-text-secondary">{t('onboarding.recapReminders', 'Rappels')}</dt>
            <dd className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <DuoIcon icon={Clock01Icon} size={16} className="text-primary" />
              {reminderEnabled
                ? t('onboarding.review', '{{count}}×/jour à {{time}}', {
                    count: reminderFrequency,
                    time: reminderTime,
                  })
                : t('common.off', 'Désactivés')}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="onboarding-fsrs-title" className="mt-6">
        <h2 id="onboarding-fsrs-title" className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <DuoIcon icon={BrainIcon} size={20} className="text-primary" />
          {t('onboarding.fsrsTitle', 'La science de la mémorisation')}
        </h2>
        <ul className="mt-3 space-y-2" role="list">
          {principles.map(({ title, desc }) => (
            <li key={title} className="flex items-start gap-2.5">
              <DuoIcon icon={CheckIcon} size={20} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-[13px] leading-relaxed text-text-secondary">
                <span className="font-semibold text-text-primary">{title}.</span> {desc}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </OnboardingShell>
  );
}

/**
 * Onboarding — étape 1, « Bienvenue ».
 *
 * Sur web, le panneau gauche de la coquille porte déjà la marque, le sommaire
 * et le verset : la colonne de droite va donc droit au fait — la promesse, en
 * trois points concrets. Sur mobile, tout tient dans la colonne : la marque,
 * le titre, les trois promesses et le verset.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { BookOpen01Icon, BrainIcon, ChartLineData01Icon } from '@/components/ui/solar-icons';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useSettingsStore } from '@/store/settings-store';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const skip = () => {
    completeOnboarding();
    navigate('/tabs/home', { replace: true });
  };

  const promises = [
    {
      icon: BookOpen01Icon,
      title: t('onboarding.promise1Title', 'Un texte, pas du bruit'),
      desc: t(
        'onboarding.promise1Desc',
        'La Bible en français courant, plein écran, sans distraction autour du verset.',
      ),
    },
    {
      icon: BrainIcon,
      title: t('onboarding.promise2Title', 'Une mémoire qui tient'),
      desc: t(
        'onboarding.promise2Desc',
        'Chaque révision revient juste avant l’oubli — c’est le rôle du moteur FSRS.',
      ),
    },
    {
      icon: ChartLineData01Icon,
      title: t('onboarding.promise3Title', 'Des progrès visibles'),
      desc: t(
        'onboarding.promise3Desc',
        'Série quotidienne, versets ancrés, temps réel passé : vous voyez ce que vous construisez.',
      ),
    },
  ];

  return (
    <OnboardingShell
      stepId="welcome"
      eyebrow={t('onboarding.welcomeEyebrow', 'Bienvenue')}
      title={t('onboarding.welcomeTitle', 'Mémorisez la Parole, à votre rythme')}
      subtitle={t(
        'onboarding.welcomeSubtitle',
        'Versets ancrés, révisions espacées et progression suivie — sans bruit autour du texte.',
      )}
      nextLabel={t('onboarding.welcomeCta', 'Choisir ma langue')}
      onSkip={skip}
      skipLabel={t('common.skip', 'Passer')}
      footerHint={t(
        'onboarding.welcomeFooterHint',
        'Environ deux minutes · vous pourrez tout modifier ensuite',
      )}
    >
      <ul className="space-y-3" role="list">
        {promises.map(({ icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <DuoIcon icon={icon} size={24} className="text-primary" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-text-primary">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{desc}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Mobile : le panneau latéral du web n'existe pas, le verset vit ici. */}
      <figure className="mt-6 rounded-2xl border-l-2 border-primary bg-surface-tint p-4 lg:hidden">
        <blockquote className="font-serif text-[15px] italic leading-relaxed text-text-primary">
          « Ta parole est une lampe à mes pieds, et une lumière sur mon sentier. »
        </blockquote>
        <figcaption className="mt-2 text-2xs font-bold uppercase tracking-[0.08em] text-primary">
          Psaumes 119:105 · LSG
        </figcaption>
      </figure>
    </OnboardingShell>
  );
}

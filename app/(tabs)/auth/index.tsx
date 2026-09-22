import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

interface Props {
  onLogin: () => void;
  onSignup: () => void;
  onSkip: () => void;
}

export default function AuthGate({ onLogin, onSignup, onSkip }: Props) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
      <Logo size={72} />
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-text-primary">
          {t('auth.welcome', 'Bienvenue sur VersyFlow')}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
          {t('auth.welcomeSubtitle',
            "Connectez-vous pour synchroniser vos memorisations sur le cloud, ou continuez en mode local.")}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button variant="default" onClick={onLogin}>
          <LogIn size={18} />
          {t('auth.login', 'Se connecter')}
        </Button>
        <Button variant="secondary" onClick={onSignup}>
          <UserPlus size={18} />
          {t('auth.signup', 'Creer un compte')}
        </Button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-1 py-2 text-sm font-medium text-text-muted underline"
        >
          {t('auth.skip', 'Continuer sans compte')}
          <ArrowRight size={14} />
        </button>
      </div>

      <p className="max-w-xs text-center text-xs leading-5 text-text-muted">
        {t('auth.localNote',
          "Votre progression est sauvegardee localement. Connectez-vous plus tard pour synchroniser.")}
      </p>
    </div>
  );
}

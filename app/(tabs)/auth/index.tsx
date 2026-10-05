import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { getSupabaseAuthService } from '@/auth';

interface Props {
  onSkip?: () => void;
}

export default function AuthGate({ onSkip }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // On mount: pick up a prior local identification (email + name, no network
  // check) so returning users land straight in the app.
  useEffect(() => {
    const identity = getSupabaseAuthService().getLocalIdentity();
    if (identity?.display_name) {
      useAuthStore.setState({
        user: {
          userId: 'local',
          email: identity.email,
          display_name: identity.display_name,
        },
        isAuthenticated: true,
      });
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // If a session already exists (cloud or local), the gate is satisfied.
  if (useAuthStore.getState().isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
        <Logo size={72} />
        <h1 className="text-2xl font-extrabold text-text-primary">
          {t('auth.ready', 'Vous êtes identifié(e)')}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm text-text-muted">
          {t('auth.readySubtitle', 'Vous pouvez continuer directement.')}
        </p>
        <Button
          variant="default"
          onClick={() => navigate('/tabs/home', { replace: true })}
        >
          {t('auth.continue', 'Continuer')}
          <ArrowRight size={18} />
        </Button>
      </div>
    );
  }

  const handleIdentify = () => {
    // Both "login" and "create account" are the same 2-field identify form
    // (email + name, no validation). Route to the login screen, which owns
    // the shared form.
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
      <Logo size={72} />
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-text-primary">
          {t('auth.welcome', 'Bienvenue sur VersyFlow')}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
          {t('auth.welcomeSubtitle',
            "Identifiez-vous avec votre e-mail et votre nom pour commencer.")}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button variant="default" onClick={handleIdentify} disabled={loading}>
          <LogIn size={18} />
          {t('auth.identify', 'Identifiez-vous')}
        </Button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center justify-center gap-1 py-2 text-sm font-medium text-text-muted underline"
          >
            {t('auth.skip', 'Continuer sans compte')}
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <p className="max-w-xs text-center text-xs leading-5 text-text-muted">
        {t('auth.localNote',
          "Votre progression est sauvegardée localement. Connectez-vous plus tard pour synchroniser.")}
      </p>
    </div>
  );
}

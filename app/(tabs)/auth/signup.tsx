// Fixed: A11y — skip button now carries a translated aria-label
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Logo } from '@/components/brand/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SupabaseAuthService } from '@/auth';

const SIGNUP = z.object({
  email: z.string().min(1).email(),
  name: z.string().min(1),
});

interface Props {
  onSkip?: () => void;
}

export default function SignupScreen({ onSkip }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const auth = new SupabaseAuthService();

  const handleSignup = async () => {
    const parsed = SIGNUP.safeParse({ email, name });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // No account creation, no verification code, no CNI: store the local
      // identity (email + name) only.
      await auth.identifyLocal(email, name);
      setSuccess(true);
      setTimeout(() => navigate('/tabs/home'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.signupError', "Échec de l'inscription"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FullScreenPage>
        <div className="flex w-full flex-col items-center gap-4 text-center">
          <CheckCircle2 size={56} className="text-success" />
          <h1 className="text-2xl font-bold text-text-primary">
            {t('auth.signupSuccess', 'Inscription réussie !')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('auth.signupSuccessHint', 'Vous êtes identifié(e) sur cet appareil.')}
          </p>
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4">
        <Logo size={72} />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-text-primary">
            {t('auth.identify', 'Qui êtes-vous ?')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('auth.identifySubtitle', "Entrez votre e-mail et votre nom pour continuer")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
          )}
          <Input
            type="email"
            placeholder={t('auth.email', 'Adresse e-mail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="text"
            placeholder={t('auth.name', 'Votre nom')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <Button variant="default" onClick={handleSignup} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              t('auth.continue', 'Continuer')
            )}
          </Button>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className="text-sm font-medium text-primary"
        >
          {t('auth.hasAccount', 'Déjà identifié(e) ? Se connecter')}
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-text-muted underline"
            aria-label={t('common.skip', 'Passer')}
          >
            {t('auth.skip', 'Continuer sans compte')}
          </button>
        )}
      </div>
    </FullScreenPage>
  );
}

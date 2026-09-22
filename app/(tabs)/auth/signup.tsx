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
  password: z.string().min(6, '6 caracteres minimum'),
});

interface Props {
  onSkip?: () => void;
}

export default function SignupScreen({ onSkip }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const auth = new SupabaseAuthService();

  const handleSignup = async () => {
    const parsed = SIGNUP.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await auth.signUp(email, password);
      setSuccess(true);
      setTimeout(() => navigate('/auth/verify'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.signupError', 'Echec de l\'inscription'));
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
            {t('auth.signupSuccess', 'Inscription reussie !')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('auth.signupSuccessHint', 'Un e-mail de verification a ete envoye.')}
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
            {t('auth.signup', 'Creer un compte')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('auth.signupSubtitle', 'Rejoignez-nous pour commencer')}
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
            type="password"
            placeholder={t('auth.password', 'Mot de passe')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Button variant="default" onClick={handleSignup} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              t('auth.signupCta', 'S\'inscrire')
            )}
          </Button>
        </div>
        <button
          onClick={() => navigate('/auth/login')}
          className="text-sm font-medium text-primary"
        >
          {t('auth.hasAccount', 'Deja un compte ? Connectez-vous')}
        </button>
        {onSkip && (
          <button onClick={onSkip} className="text-sm text-text-muted underline">
            {t('auth.skip', 'Continuer sans compte')}
          </button>
        )}
      </div>
    </FullScreenPage>
  );
}

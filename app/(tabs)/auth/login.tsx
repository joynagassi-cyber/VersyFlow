import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Logo } from '@/components/brand/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SupabaseAuthService } from '@/auth';

const LOGIN = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

interface Props {
  onSkip?: () => void;
}

export default function LoginScreen({ onSkip }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = new SupabaseAuthService();

  const handleLogin = async () => {
    const parsed = LOGIN.safeParse({ email, password });
    if (!parsed.success) {
      setError(t('auth.fillFields', 'Veuillez remplir tous les champs'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await auth.signIn(email, password);
      navigate('/tabs/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginError', 'Echec de la connexion'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullScreenPage>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4">
        <Logo size={72} />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-text-primary">
            {t('auth.login', 'Se connecter')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('auth.loginSubtitle', "Accedez a votre tableau de bord")}
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
            autoComplete="current-password"
          />
          <Button variant="default" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              t('auth.loginCta', 'Se connecter')
            )}
          </Button>
        </div>
        <button
          onClick={() => navigate('/auth/signup')}
          className="text-sm font-medium text-primary"
        >
          {t('auth.noAccount', "Pas encore de compte ? S'inscrire")}
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-text-muted underline"
          >
            {t('auth.skip', 'Continuer sans compte')}
          </button>
        )}
        <p className="text-xs text-text-muted">
          {t('auth.localNote', 'Votre progression est sauvegardee localement')}
        </p>
      </div>
    </FullScreenPage>
  );
}

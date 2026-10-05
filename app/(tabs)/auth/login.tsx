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
  name: z.string().min(1),
});

interface Props {
  onSkip?: () => void;
}

export default function LoginScreen({ onSkip }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = new SupabaseAuthService();

  const handleLogin = async () => {
    const parsed = LOGIN.safeParse({ email, name });
    if (!parsed.success) {
      setError(t('auth.fillFields', 'Veuillez remplir tous les champs'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Identical to "no validation": just save the local identity, no call
      // to Supabase, no code, no CNI — email + name only.
      await auth.identifyLocal(email, name);
      navigate('/tabs/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginError', "Échec de l'identification"));
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
            {t('auth.identify', "Qui êtes-vous ?")}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('auth.identifySubtitle', 'Entrez votre e-mail et votre nom pour continuer')}
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
          <Button variant="default" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              t('auth.continue', 'Continuer')
            )}
          </Button>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-text-muted underline"
          >
            {t('auth.skip', 'Continuer sans compte')}
          </button>
        )}
        <p className="text-xs text-text-muted">
          {t('auth.localNote', 'Votre progression est sauvegardée localement')}
        </p>
      </div>
    </FullScreenPage>
  );
}

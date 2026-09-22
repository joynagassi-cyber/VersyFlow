import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Logo } from '@/components/brand/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSupabaseAuthService } from '@/auth';
import { useAuthStore } from '@/store/auth-store';

const EMAIL = z.string().min(1).email();
const CODE = z.string().length(6);

export default function VerifyScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async () => {
    if (!EMAIL.safeParse(email).success) {
      setError(t('auth.invalidEmail', 'Adresse e-mail invalide'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: sendError } = await getSupabaseAuthService().sendVerificationCode(email);
      if (sendError) throw sendError;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.sendError', 'Echec de l\'envoi du code'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!CODE.safeParse(otp).success) {
      setError(t('auth.codeError', 'Code invalide (6 chiffres)'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { user, error: verifyError } = await getSupabaseAuthService().verifyEmailCode(email, otp);
      if (verifyError || !user) throw verifyError || new Error('Code de verification invalide');
      await useAuthStore.getState().checkSession();
      setSuccess(true);
      setTimeout(() => navigate('/tabs/home'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.codeError', 'Code de verification invalide'));
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
            {t('auth.verifySuccess', 'Verification reussie !')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('auth.verifySuccessHint', 'Vous etes maintenant connecte.')}
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
            {t('auth.verify', 'Verifier votre e-mail')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {sent
              ? t('auth.verifyCode', 'Entrez le code de verification')
              : t('auth.verifyHint', 'Entrez votre e-mail pour recevoir un code')}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {error && (
            <div className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
          )}
          {!sent ? (
            <>
              <Input
                type="email"
                placeholder={t('auth.email', 'Adresse e-mail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button variant="default" onClick={handleSendCode} disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  t('auth.sendCode', 'Envoyer le code')
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <KeyRound size={16} />
                {t('auth.code', 'Code de verification (6 chiffres)')}
              </div>
              <Input
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                disabled={loading}
              />
              <Button variant="default" onClick={verifyCode} disabled={loading}>
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  t('auth.confirm', 'Verifier')
                )}
              </Button>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-text-muted underline"
              >
                {t('auth.resend', 'Pas recu le code ? Reenvoyer')}
              </button>
            </>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}

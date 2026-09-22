import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScanLine, Loader2, LogIn } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useAuthStore } from '@/store/auth-store';

export default function FamilyJoinScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { acceptInvitation } = useFamilyService();
  const { addFamily, addMembership, setActiveFamily } = useFamilySyncStore();
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!signedIn) {
      setError(t('family.signedInRequired', 'Connectez-vous pour rejoindre une famille'));
      return;
    }
    if (!code.trim()) {
      setError(t('family.enterCode', 'Entrez le code d\'invitation'));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await acceptInvitation(code.trim().toUpperCase());
      addFamily(result.family);
      addMembership(result.membership);
      setActiveFamily(result.family.id);
      navigate('/family/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('family.invalidCode', 'Code invalide'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FullScreenPage
      title={t('family.join', 'Rejoindre')}
      showBack
      backPath="/family/home"
    >
      <div className="mx-auto max-w-md space-y-6">
        {/* QR scan (placeholder for camera) */}
        <button
          className="flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary/40 bg-surface p-8 active:bg-surface-tint"
          onClick={() => setError(t('family.scannerDesc', 'Le scanner QR sera disponible prochainement.'))}
        >
          <ScanLine size={44} className="text-primary" />
          <span className="text-sm font-semibold text-text-secondary">
            {t('family.scanQR', 'Scanner le QR code')}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-[color:var(--color-divider)]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t('family.or', 'ou')}
          </span>
          <span className="h-px flex-1 bg-[color:var(--color-divider)]" />
        </div>

        {/* Code input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text-secondary">
            {t('family.inviteCode', 'Code d\'invitation')}
          </label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="FAM-XXXXXX"
            maxLength={8}
            className="text-center text-lg tracking-widest uppercase"
          />
          <p className="text-xs text-text-muted">
            {t('family.expiryHint', 'Le code expire dans 7 jours.')}
          </p>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <Button variant="default" className="w-full" onClick={handleJoin} disabled={isLoading}>
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          {isLoading ? t('common.loading', 'Chargement...') : t('family.joinButton', 'Rejoindre la famille')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

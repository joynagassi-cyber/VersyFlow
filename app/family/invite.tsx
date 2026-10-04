// Fixed: A11y — icon-only buttons now carry translated aria-labels
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, Info, Loader2, Check } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useAuthStore } from '@/store/auth-store';

export default function FamilyInviteScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeFamilyId, families } = useFamilySyncStore();
  const { createInvitation } = useFamilyService();
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const family = families.find((f) => f.id === activeFamilyId) || null;

  useEffect(() => {
    if (family && !inviteCode && !isLoading) {
      void handleGenerateCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family]);

  const handleGenerateCode = async () => {
    if (!family) return;
    setIsLoading(true);
    try {
      const invitation = await createInvitation(family.id);
      setInviteCode(invitation.token);
    } catch (e) {
      console.error('[family/invite] generate failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const buildInviteText = () => {
    const base = t('family.shareDesc', 'Rejoignez ma famille VersyFlow');
    return inviteCode ? base + ' ' + inviteCode : base;
  };

  const handleCopy = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleShare = async () => {
    if (sharing) return;
    const text = buildInviteText();
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text: string }) => Promise<void>;
    };
    if (nav.share) {
      setSharing(true);
      try {
        await nav.share({ title: t('family.shareTitle', 'Invitation famille'), text });
      } catch {
        /* user cancelled */
      } finally {
        setSharing(false);
      }
    } else {
      handleCopy();
    }
  };

  if (!family || !signedIn) {
    return (
      <FullScreenPage title={t('family.invite', 'Inviter')} showBack>
        <div className="mx-auto max-w-md">
          <EmptyState
            title={t('family.noFamily', 'Aucune famille active')}
            description={t('family.noFamilyHint', 'Rejoignez une famille pour inviter des membres.')}
            actionLabel={t('common.back', 'Retour')}
            onAction={() => navigate('/family/home')}
          />
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={t('family.invite', 'Inviter')}
      showBack
      backPath="/family/members"
      right={<span className="px-4 text-lg" aria-hidden>{family.icon}</span>}
    >
      <div className="mx-auto max-w-md space-y-5">
        {/* Family header */}
        <div className="gradient-hero glow-primary flex items-center gap-3 rounded-3xl p-5 text-white">
          <span className="text-3xl">{family.icon}</span>
          <span className="text-xl font-bold">{family.name}</span>
        </div>

        {/* Code card */}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-6 shadow-sm">
          <span className="text-sm font-semibold text-text-secondary">
            {t('family.inviteCode', 'Code d\'invitation')}
          </span>
          {inviteCode ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold tracking-widest text-primary">
                {inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="rounded-full bg-surface-tint p-2 active:bg-primary/10"
                aria-label={copied ? t('common.saved', 'Copié') : t('common.copy', 'Copier')}
              >
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} className="text-primary" />}
              </button>
            </div>
          ) : (
            <Button variant="default" onClick={handleGenerateCode} disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : t('family.generateCode', 'Generer un code')}
            </Button>
          )}
          <span className="text-xs text-text-muted">
            {t('family.expiryHint', 'Ce code expire dans 7 jours.')}
          </span>
        </div>

        <Button
          variant="default"
          className="w-full"
          onClick={handleShare}
          disabled={isLoading || !inviteCode || sharing}
        >
          {sharing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Share2 size={18} />
          )}
          {t('family.shareCode', 'Partager le code')}
        </Button>

        <div className="flex items-start gap-3 rounded-2xl bg-surface-tint p-4">
          <Info size={18} className="mt-0.5 text-info" />
          <p className="flex-1 text-sm text-text-secondary">
            {t('family.inviteHint', 'Chaque membre utilise ce code pour rejoindre votre famille.')}
          </p>
        </div>
      </div>
    </FullScreenPage>
  );
}

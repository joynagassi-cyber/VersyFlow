// Fixed: Structure — 404 catch-all screen now wrapped in FullScreenPage shell (showBack=false)
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { FullScreenPage } from '@/components/layout/FullScreenPage';

/** 404 — calm brand fallback (logo + wordmark + home CTA). */
export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <FullScreenPage showBack={false} className="p-0">
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center animate-fade-in-up">
        <Logo size={96} />
        <div>
          <p className="text-gradient-hero text-5xl font-extrabold tracking-tight">404</p>
          <p className="mt-2 text-lg font-semibold text-text-primary">
            {t('notFound.title', "Cette page n'existe pas")}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {t('notFound.subtitle', 'Le lien est peut-etre casse ou la page a ete deplacee.')}
          </p>
        </div>
        <Button asChild variant="default" className="mt-2">
          <Link to="/tabs/home">{t('notFound.back', "Retour a l'accueil")}</Link>
        </Button>
      </div>
    </FullScreenPage>
  );
}

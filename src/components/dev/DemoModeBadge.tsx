/**
 * Bandeau-pastille « DÉMO ».
 *
 * Objectif : que l'utilisateur ne puisse jamais confondre une donnée fictive
 * avec sa vraie progression. La pastille est présente dans les deux coques
 * (mobile et bureau), elle mène au panneau `/dev` où l'on peut réinitialiser
 * ou quitter la démo.
 *
 * Contraintes respectées : rendue uniquement en mode mock, aucune couleur
 * littérale (jetons du thème), focus visible, cible tactile ≥ 32 px.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isMockMode } from '@/dev/mode';

export function DemoModeBadge({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  if (!isMockMode()) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/dev')}
      aria-label={t(
        'demo.badgeAria',
        'Mode démo : données fictives, isolées de vos données réelles. Ouvrir le panneau de démonstration.',
      )}
      className={
        'inline-flex h-8 items-center gap-1 rounded-full border border-border bg-surface-tint px-2 text-[10px] font-extrabold uppercase tracking-wide text-primary transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ' +
        (className ?? '')
      }
      data-testid="demo-mode-badge"
    >
      <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
      {t('demo.badge', 'Démo')}
    </button>
  );
}

export default DemoModeBadge;

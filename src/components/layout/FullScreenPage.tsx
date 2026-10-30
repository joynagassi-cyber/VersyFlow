/**
 * FullScreenPage — shared shell for "deep" (non-tab) pages.
 * Provides an Ionic header with back button + title and a scrollable body.
 */

import * as React from 'react';
import { IonPage } from '@ionic/react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ArrowLeft01Icon } from '@/components/ui/solar-icons';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { goBackSafely } from '@/lib/navigation';

interface FullScreenPageProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /** Override back destination (defaults to history back) */
  backPath?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Mesure de la colonne. Deep pages lisent (720 px), les listes respirent
   * (1060 px). `false` = pleine largeur, réservé aux canevas/éditeurs.
   */
  column?: 'narrow' | 'wide' | false;
}

export function FullScreenPage({
  title,
  subtitle,
  showBack = true,
  backPath,
  right,
  children,
  className,
  column = 'narrow',
}: FullScreenPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (backPath) navigate(backPath, { replace: true });
    else goBackSafely(navigate);
  };

  return (
    <IonPage>
      {title && (
        <header className="full-screen-header">
          {showBack && <button type="button" onClick={handleBack} aria-label={t('common.back', 'Retour')} className="full-screen-back">
            <DuoIcon icon={ArrowLeft01Icon} size={22} />
          </button>}
          <div className="full-screen-title"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          {right && <div className="full-screen-right">{right}</div>}
        </header>
      )}
      <div className={cn('app-canvas h-full overflow-y-auto bg-background p-4', className)}>
        <div
          className={cn(
            column === 'narrow' && 'screen-column-narrow',
            column === 'wide' && 'screen-column',
          )}
        >
          {children}
        </div>
      </div>
    </IonPage>
  );
}

export default FullScreenPage;

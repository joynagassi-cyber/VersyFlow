/**
 * FullScreenPage — shared shell for "deep" (non-tab) pages.
 * Provides an Ionic header with back button + title and a scrollable body.
 */

import * as React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
} from '@ionic/react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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

  const handleBack = () => {
    if (backPath) navigate(backPath, { replace: true });
    else navigate(-1);
  };

  return (
    <IonPage>
      {title && (
        <IonHeader className="bg-surface">
          <IonToolbar>
            {showBack && (
              <IonButtons slot="start">
                <IonButton
                  onClick={handleBack}
                  className="h-10 w-10 p-0"
                  shape="round"
                >
                  <DuoIcon icon={ArrowLeft01Icon} size={22} color="var(--color-text-secondary)" />
                </IonButton>
              </IonButtons>
            )}
            <IonTitle className="!text-text-primary">
              <span className="text-base font-semibold">{title}</span>
              {subtitle && (
                <span className="block text-xs font-normal text-text-muted">
                  {subtitle}
                </span>
              )}
            </IonTitle>
            {right && <div slot="end">{right}</div>}
          </IonToolbar>
        </IonHeader>
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

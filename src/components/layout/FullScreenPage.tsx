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
import { ArrowLeft } from 'lucide-react';
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
}

export function FullScreenPage({
  title,
  subtitle,
  showBack = true,
  backPath,
  right,
  children,
  className,
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
                  <ArrowLeft size={22} className="text-text-secondary" />
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
      <div className={cn('h-full overflow-y-auto bg-background p-4', className)}>
        {children}
      </div>
    </IonPage>
  );
}

export default FullScreenPage;

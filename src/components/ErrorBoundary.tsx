import * as React from 'react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  RefreshIcon as RefreshCw,
  Home01Icon as Home,
} from '@/components/ui/solar-icons';
import { useNavigate } from 'react-router-dom';
import i18next from 'i18next';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Global error boundary. If a lazily-loaded route (or any subtree) throws while
 * rendering, this catches it and shows a recovery screen instead of a blank app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[VersyFlow] render error boundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <BoundaryFallback onReset={() => this.setState({ hasError: false })} />;
  }
}

function BoundaryFallback({ onReset }: { onReset: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-light text-error">
        <DuoIcon icon={RefreshCw} size={28} />
      </span>
      <div>
        <p className="empty-title">{i18next.t('errorBoundary.title', 'Une erreur est survenue')}</p>
        <p className="mt-1 text-sm text-text-muted">
          {i18next.t('errorBoundary.message', 'Cette page n’a pas pu s’afficher. Réessayez.')}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            onReset();
            navigate(0 as unknown as string);
          }}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow active:opacity-90"
        >
          {i18next.t('errorBoundary.retry', 'Réessayer')}
        </button>
        <button
          onClick={() => {
            onReset();
            navigate('/tabs/home');
          }}
          className="rounded-full bg-surface px-5 py-2.5 text-sm font-semibold text-primary shadow-sm"
        >
          <span className="inline-flex items-center gap-1">
            <DuoIcon icon={Home} size={14} />
            {i18next.t('errorBoundary.home', 'Accueil')}
          </span>
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;

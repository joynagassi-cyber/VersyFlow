import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock,
  Compass,
  Library,
  GitCompareArrows,
  BrainCircuit,
  Gem,
  MessageCircleHeart,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: typeof BrainCircuit;
  key: string;
  path: string;
  color: string;
  bg: string;
}

const ACTIONS: QuickAction[] = [
  { icon: Gem, key: 'dock.memorize', path: '/memorization/session', color: 'text-primary', bg: 'bg-icon-bg-rose' },
  { icon: CalendarClock, key: 'dock.review', path: '/review/queue', color: 'text-success', bg: 'bg-icon-bg-green' },
  { icon: Compass, key: 'dock.explore', path: '/bible/explorer', color: 'text-info', bg: 'bg-icon-bg-blue' },
  { icon: Library, key: 'dock.versions', path: '/settings/available-translations', color: 'text-info', bg: 'bg-icon-bg-indigo' },
  { icon: GitCompareArrows, key: 'dock.compare', path: '/comparison/translation', color: 'text-warning', bg: 'bg-icon-bg-orange' },
  { icon: BrainCircuit, key: 'dock.semantic', path: '/semantic', color: 'text-primary', bg: 'bg-icon-bg-purple' },
  { icon: MessageCircleHeart, key: 'dock.family', path: '/family/home', color: 'text-error', bg: 'bg-icon-bg-rose' },
  { icon: Search, key: 'dock.search', path: '/search', color: 'text-text-secondary', bg: 'bg-surface-tint' },
];

const DOCK_LABELS: Record<string, string> = {
  memorize: 'Mémoriser',
  review: 'Réviser',
  explore: 'Explorer',
  versions: 'Versions',
  compare: 'Comparer',
  semantic: 'Sémantique',
  family: 'Famille',
  search: 'Recherche',
};

/**
 * Bottom dock: a slim white home-indicator bar centred at the very bottom
 * of the screen (below the tab bar) that pulls up a bottom sheet with
 * quick-access features. The handle is an absolute overlay; the sheet is a
 * fixed overlay.
 */
export function QuickDock() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Home indicator — centred at the very bottom, below the tab bar */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-[max(8px,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setOpen(true)}
          aria-label={t('dock.open', 'Ouvrir les raccourcis')}
          className="pointer-events-auto h-[5px] w-32 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.35)] transition-transform active:scale-95"
        />
      </div>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50">
          <button
            className="absolute inset-0 h-full w-full bg-black/40"
            onClick={() => setOpen(false)}
            aria-label={t('common.close', 'Fermer')}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-surface shadow-2xl animate-fade-in-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Sheet header */}
            <div className="sticky top-0 flex items-center justify-between bg-surface px-5 pb-2 pt-3">
              <span className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3">
              <p className="text-lg font-extrabold text-text-primary">
                {t('dock.title', 'Accès rapide')}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-text-muted active:bg-surface-tint"
                aria-label={t('common.close', 'Fermer')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-4 gap-3 px-5 pb-6">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    onClick={() => go(a.path)}
                    className="flex flex-col items-center rounded-2xl bg-surface-tint/60 p-3 text-center transition active:scale-[0.97]"
                  >
                    <span className={cn('mb-2 flex h-11 w-11 items-center justify-center rounded-full', a.bg)}>
                      <Icon size={20} className={a.color} />
                    </span>
                    <span className="text-[11px] font-semibold text-text-primary">
                      {t(a.key, DOCK_LABELS[a.key.split('.').pop() ?? ''])}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QuickDock;

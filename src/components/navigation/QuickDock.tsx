import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  CalendarClockIcon as CalendarClock,
  CompassIcon as Compass,
  LibraryIcon as Library,
  GitCompareArrowsIcon as GitCompareArrows,
  BrainCircuitIcon as BrainCircuit,
  GemIcon as Gem,
  MessageCircleHeartIcon as MessageCircleHeart,
  Search01Icon as Search,
  Cancel01Icon as X,
} from '@/components/ui/solar-icons';

interface QuickAction {
  icon: typeof BrainCircuit;
  key: string;
  path: string;
}

const ACTIONS: QuickAction[] = [
  { icon: Gem, key: 'dock.memorize', path: '/memorization/session' },
  { icon: CalendarClock, key: 'dock.review', path: '/review/queue' },
  { icon: Compass, key: 'dock.explore', path: '/bible/explorer' },
  { icon: Library, key: 'dock.versions', path: '/settings/available-translations' },
  { icon: GitCompareArrows, key: 'dock.compare', path: '/comparison/translation' },
  { icon: BrainCircuit, key: 'dock.semantic', path: '/semantic' },
  { icon: MessageCircleHeart, key: 'dock.family', path: '/family/home' },
  { icon: Search, key: 'dock.search', path: '/search' },
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
          className="pointer-events-auto h-[5px] w-32 rounded-full bg-surface shadow-md transition-transform active:scale-95"
        />
      </div>

      {/* Bottom sheet */}
      {open && (
        <div className="modal-sheet">
          <button
            className="absolute inset-0 h-full w-full bg-[color:var(--scrim)]"
            onClick={() => setOpen(false)}
            aria-label={t('common.close', 'Fermer')}
          />
          <div
            className="modal-sheet-panel animate-fade-in-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Sheet header */}
            <div className="sticky top-0 flex items-center justify-between bg-surface px-5 pb-2 pt-3">
              <span className="modal-sheet-handle mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
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
                <DuoIcon icon={X} size={20} />
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
                    <span className="icon-chip mb-2 flex h-11 w-11 items-center justify-center rounded-full">
                      <DuoIcon icon={Icon} size={20} />
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

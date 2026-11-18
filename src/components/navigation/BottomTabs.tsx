/**
 * BottomTabs — la barre d'onglets, pilotée par les réglages de l'utilisateur.
 *
 * La barre ne décide plus de son contenu : elle rend `barItems` (pages et
 * fonctions épinglées, dans l'ordre choisi) avec les réglages associés —
 * libellés visibles ou non, densité compacte. Tout se règle dans
 * « Barre d'onglets » (`app/settings/navigation.tsx`).
 *
 * Chaque entrée reste une cible de 44 px minimum, garde un `aria-label` même
 * quand les libellés sont masqués, et marque l'état actif par `aria-current`
 * + pastille : la position seule ne signale jamais l'onglet courant.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { iconFor } from '@/components/navigation/nav-icons';
import { resolveEntries } from '@/domains/navigation/bottom-bar';
import { useUiStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

export function BottomTabs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const barItems = useUiStore((s) => s.barItems);
  const barLabels = useUiStore((s) => s.barLabels);
  const barCompact = useUiStore((s) => s.barCompact);

  const entries = resolveEntries(barItems);
  if (entries.length === 0) return null;

  return (
    <nav aria-label="Navigation principale" className="mobile-tabs g1" data-compact={barCompact || undefined}>
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {entries.map((entry) => {
          const Icon = iconFor(entry.path);
          const label = t(entry.labelKey, entry.label);
          const active =
            location.pathname === entry.path || location.pathname.startsWith(`${entry.path}/`);
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => navigate(entry.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl',
                barCompact ? 'py-0.5' : 'py-1.5',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full transition-colors',
                  barCompact ? 'h-7 w-10' : 'h-8 w-11',
                  active ? 'bg-primary/12' : 'bg-transparent',
                )}
              >
                <DuoIcon icon={Icon} size={barCompact ? 20 : 24} color={active ? 'var(--acc-text)' : 'var(--mut)'} />
              </span>
              {barLabels ? (
                <span
                  className={cn(
                    'max-w-[72px] truncate text-2xs font-semibold transition-colors',
                    active ? 'text-primary' : 'text-text-muted',
                  )}
                >
                  {label}
                </span>
              ) : (
                active && <span className="h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabs;

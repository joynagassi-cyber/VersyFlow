/**
 * TranslationMenu — the small "LSG ▾" dropdown that lives under the
 * verse title in the Memorization Workspace header.
 *
 * Opens an anchor popup listing the available translations (from the
 * catalogue of remote datasets). Selecting one swaps the active
 * translation in the settings store and re-runs the workspace load.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import { BIBLE_DATASET_CATALOG } from '@/services/bible-text-service';
import { bibleTranslationDisplayName } from '@/services/bible-translation-names';

export function TranslationMenu({
  translationId,
  onSelect,
}: {
  translationId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const display = bibleTranslationDisplayName(translationId);

  const handlePick = async (id: string) => {
    if (id === translationId) {
      setOpen(false);
      return;
    }
    setBusy(id);
    try {
      onSelect(id);
      setBibleTranslation(id);
      setOpen(false);
    } catch {
      /* the workspace will surface the error banner */
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-bold text-primary transition active:scale-95"
      >
        {display}
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-40 max-h-[50vh] w-56 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
          <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {t('workspace.chooseTranslation', 'Traduction')}
          </p>
          {BIBLE_DATASET_CATALOG.map((entry) => {
            const isCurrent = entry.id === translationId;
            const isBusy = busy === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                disabled={isBusy}
                onClick={() => void handlePick(entry.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition',
                  isCurrent ? 'bg-primary/10 text-primary' : 'text-text-primary active:bg-surface-tint',
                )}
              >
                <span className="truncate font-semibold">
                  {bibleTranslationDisplayName(entry.id)}
                </span>
                {isBusy ? (
                  <Loader2 size={13} className="animate-spin text-text-muted" />
                ) : isCurrent ? (
                  <Check size={13} />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TranslationMenu;

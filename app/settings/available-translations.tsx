/**
 * Available Translations Screen — download-on-demand Bible datasets.
 *
 * Lists every remote dataset from the static catalogue
 * (`data/bible/dataset-catalog.json`, served from the public Supabase
 * Storage bucket `bible-datasets`) with its size and checksum, lets the
 * user download one (persisted in the PowerSync cache), and select it as
 * the active Bible translation.
 *
 * UI language ≠ Bible translation: the active choice is persisted through
 * the settings store + PowerSync preference repository.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Check,
  Download,
  Loader2,
  Languages,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import {
  BIBLE_DATASET_CATALOG,
  type BibleDatasetCatalogEntry,
  findRemoteDatasetEntry,
  loadTranslationBooks,
  downloadAndLoadTranslationBooks,
} from '@/services/bible-text-service';
import { getTranslationPreferenceRepository } from '@/services/translation-preference-service';
import { useAuthStore } from '@/store/auth-store';
import { eventBus, DomainEventTypes } from '@/domains/events';

type DownloadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string };

type EntryState = {
  state: DownloadState;
  /** True when the translation data is resolvable locally (cache or bundled). */
  available: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function AvailableTranslationsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);

  const [entries, setEntries] = useState<BibleDatasetCatalogEntry[]>(BIBLE_DATASET_CATALOG);
  const [states, setStates] = useState<Record<string, EntryState>>({});

  // Probe which datasets are already resolvable (bundled or cached) without
  // forcing a download.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      entries.map(async (entry) => {
        const books = await loadTranslationBooks(entry.id);
        return { id: entry.id, available: books != null };
      }),
    ).then((results) => {
      if (cancelled) return;
      setStates(Object.fromEntries(results.map((r) => [r.id, { state: { status: 'idle' } as DownloadState, available: r.available }])));
    });
    return () => {
      cancelled = true;
    };
}, []);

  const handleDownload = async (id: string) => {
    setStates((prev) => ({ ...prev, [id]: { state: { status: 'loading' }, available: prev[id]?.available ?? false } }));
    try {
      await downloadAndLoadTranslationBooks(id);
      setStates((prev) => ({ ...prev, [id]: { state: { status: 'ready' }, available: true } }));
    } catch (error) {
      setStates((prev) => ({
        ...prev,
        [id]: {
          state: { status: 'error', message: error instanceof Error ? error.message : String(error) },
          available: prev[id]?.available ?? false,
        },
      }));
    }
  };

  const handleSelect = async (id: string) => {
    const prevTranslation = bibleTranslation;
    const entryState = states[id];
    if (!entryState?.available) {
      // Not resolvable locally yet — try to fetch before activating.
      try {
        await downloadAndLoadTranslationBooks(id);
      } catch {
        return; // download failed; the row already shows the error state
      }
    }
    setBibleTranslation(id);
    void getTranslationPreferenceRepository()
      .set(id, BIBLE_DATASET_CATALOG.map((e) => e.id))
      .catch(() => {
        /* Offline / no session — the local value already applied. */
      });
    // Emit TRANSLATION_CHANGED after the new translation is set.
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.TRANSLATION_CHANGED,
      timestamp: Date.now(),
      payload: {
        fromTranslationId: prevTranslation,
        toTranslationId: id,
        changedByUser: true,
      },
    });
    navigate('/bible/explorer');
  };

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const st = states[entry.id] ?? { state: { status: 'idle' } as DownloadState, available: false };
        return { entry, st };
      }),
    [entries, states],
  );

  return (
    <div className="min-h-full overflow-y-auto bg-background p-4 pb-24">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-text-muted hover:bg-surface-tint"
          aria-label={t('common.back', 'Retour')}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('settings.availableTranslations', 'Traductions disponibles')}
        </h1>
      </div>

      <p className="mb-6 px-1 text-sm text-text-muted">
        {t('settings.availableTranslationsHint', 'Téléchargez une traduction pour l’utiliser hors ligne. Seules les données de la traduction active sont conservées localement.')}
      </p>

      <div className="flex flex-col gap-3">
        {rows.map(({ entry, st }) => {
          const isActive = bibleTranslation === entry.id;
          const state = st.state;
          const canSelect = st.available || state.status === 'ready' || state.status === 'loading';
          return (
            <div
              key={entry.id}
              className={cn(
                'rounded-2xl bg-surface p-4 shadow-sm',
                isActive && 'ring-2 ring-primary',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-tint text-primary">
                  <BookOpen size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-text-primary">
                      {entry.id.toUpperCase()}
                    </p>
                    {isActive && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                        {t('common.active', 'Active')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {formatBytes(entry.sizeBytes)} · {entry.id}
                  </p>
                  {state.status === 'error' && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-error">
                      <AlertCircle size={12} /> {state.message}
                    </p>
                  )}
                </div>

                {/* Per-row action */}
                {state.status === 'loading' ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-tint text-primary">
                    <Loader2 size={20} className="animate-spin" />
                  </span>
                ) : st.available ? (
                  <button
                    onClick={() => void handleSelect(entry.id)}
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold',
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-surface-tint text-primary',
                    )}
                  >
                    <Check size={16} />
                    {t('common.select', 'Utiliser')}
                  </button>
                ) : (
                  <button
                    onClick={() => void handleDownload(entry.id)}
                    className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-sm"
                  >
                    <Download size={16} />
                    {t('common.download', 'Télécharger')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAuthenticated && (
        <p className="mt-6 px-1 text-center text-xs text-text-tertiary">
          {t('common.online', 'Préférence synchronisée avec votre compte')}
        </p>
      )}
    </div>
  );
}

/**
 * Fixed: Visual polish — "Détail" block now shows chapter + verse counts
 * for every translation (getTranslationStats, 24h localStorage cache),
 * and each language group sorts the 8 preferred fr/en editions first.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Check,
  Download,
  Languages,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  CircleCheck,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import {
  BIBLE_DATASET_CATALOG,
  type BibleDatasetCatalogEntry,
  loadTranslationBooks,
  downloadAndLoadTranslationBooks,
  getTranslationStats,
  type TranslationStats,
} from '@/services/bible-text-service';
import {
  getTranslationDisplayInfo,
  groupTranslationsByLanguage,
} from '@/services/bible-translation-names';
import { getTranslationPreferenceRepository } from '@/services/translation-preference-service';
import { useAuthStore } from '@/store/auth-store';
import { eventBus, DomainEventTypes } from '@/domains/events';

type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; percent: number; receivedBytes: number }
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

  const [entries] = useState<BibleDatasetCatalogEntry[]>(BIBLE_DATASET_CATALOG);
  const [states, setStates] = useState<Record<string, EntryState>>({});
  const abortRef = useRef<AbortController | null>(null);

  // "Détail" chapter/verse counts, fetched lazily per row on expand.
  const [stats, setStats] = useState<Record<string, TranslationStats | null>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadStatsFor = (id: string) => {
    setExpanded((prev) => new Set(prev).add(id));
    if (stats[id]) return; // already fetched (even null = not available)
    void getTranslationStats(id).then((result) => {
      setStats((prev) => ({ ...prev, [id]: result }));
    });
  };
  const toggleDetail = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    loadStatsFor(id);
  };

  // Auto-open the detail of the active translation so the user sees its
  // chapter/verse count without an extra tap.
  useEffect(() => {
    if (bibleTranslation) loadStatsFor(bibleTranslation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibleTranslation]);

  // Probe which datasets are already resolvable locally (bundled or cached)
  // without forcing a download.
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      entries.map(async (entry) => {
        const books = await loadTranslationBooks(entry.id);
        return { id: entry.id, available: books != null };
      }),
    ).then((results) => {
      if (cancelled) return;
      setStates(
        Object.fromEntries(
          results.map((r) => [r.id, { state: { status: 'idle' } as DownloadState, available: r.available }]),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [entries]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleDownload = async (id: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStates((prev) => ({ ...prev, [id]: { state: { status: 'downloading', percent: 0, receivedBytes: 0 }, available: prev[id]?.available ?? false } }));
    try {
      await downloadAndLoadTranslationBooks(
        id,
        (percent, receivedBytes) => {
          setStates((prev) => ({
            ...prev,
            [id]: { state: { status: 'downloading', percent, receivedBytes }, available: prev[id]?.available ?? false },
          }));
        },
        { signal: controller.signal },
      );
      setStates((prev) => ({ ...prev, [id]: { state: { status: 'ready' }, available: true } }));
    } catch (error) {
      if (controller.signal.aborted) {
        // User cancelled — back to idle.
        setStates((prev) => ({ ...prev, [id]: { state: { status: 'idle' }, available: prev[id]?.available ?? false } }));
        return;
      }
      setStates((prev) => ({
        ...prev,
        [id]: {
          state: { status: 'error', message: error instanceof Error ? error.message : String(error) },
          available: prev[id]?.available ?? false,
        },
      }));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleCancel = (id: string) => {
    abortRef.current?.abort();
    setStates((prev) => ({ ...prev, [id]: { state: { status: 'idle' }, available: prev[id]?.available ?? false } }));
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

  const localCount = useMemo(
    () => entries.filter((e) => (states[e.id]?.available ?? false)).length,
    [entries, states],
  );

  // Languages in stable display order, each with its dataset ids.
  const languageGroups = useMemo(
    () => groupTranslationsByLanguage(entries.map((e) => e.id)),
    [entries],
  );

  const renderRow = (entry: BibleDatasetCatalogEntry) => {
    const st = states[entry.id] ?? { state: { status: 'idle' } as DownloadState, available: false };
    const isActive = bibleTranslation === entry.id;
    const state = st.state;
    const info = getTranslationDisplayInfo(entry.id);
    const isLocal = st.available;
    const downloading = state.status === 'downloading';
    return (
      <div
        key={entry.id}
        className={cn(
          'rounded-2xl bg-surface p-4 shadow-sm transition',
          isActive && 'ring-2 ring-primary',
          downloading && 'ring-1 ring-primary/30',
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              isActive ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
            )}
          >
            <BookOpen size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-text-primary">
                {info.abbreviation}
                {info.abbreviation !== info.name && (
                  <span className="ml-1.5 text-sm font-medium text-text-muted">{info.name}</span>
                )}
              </p>
              {isActive && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t('common.active', 'Active')}
                </span>
              )}
              {isLocal && !isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                  <CircleCheck size={11} />
                  {t('settings.localAvailable', 'En local')}
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
              {info.abbreviation} · {formatBytes(entry.sizeBytes)}
            </p>

            {/* Real streaming progress — percent + Mo reçus / total + cancel */}
            {downloading && (
              <div className="mt-2.5">
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-primary">{Math.round(state.percent)} %</span>
                  <span className="tabular-nums text-text-muted">
                    {formatBytes(state.receivedBytes)} / {formatBytes(entry.sizeBytes)}
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tint"
                  role="progressbar"
                  aria-valuenow={Math.round(state.percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                    style={{ width: `${Math.max(2, state.percent)}%` }}
                  />
                </div>
              </div>
            )}

            {state.status === 'error' && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-error">
                <AlertCircle size={12} /> {state.message}
              </p>
            )}

            {/* "Détail" — chapter & verse counts, loaded on demand + cached 24 h */}
            <button
              type="button"
              onClick={() => toggleDetail(entry.id)}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <ChevronDown size={13} className={cn('transition-transform', expanded.has(entry.id) && 'rotate-180')} />
              {t('settings.translationDetail', 'Détail')}
            </button>
            {expanded.has(entry.id) && (
              <div className="mt-2 rounded-xl bg-surface-tint px-3 py-2 text-xs text-text-secondary">
                {stats[entry.id] ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      {t('settings.translationChapters', { count: stats[entry.id]!.chapters })}
                    </span>
                    <span>
                      {t('settings.translationVerses', { count: stats[entry.id]!.verses })}
                    </span>
                    {stats[entry.id]!.year && (
                      <span className="text-text-muted">{stats[entry.id]!.year}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-text-muted">{t('settings.translationNotAvailable', 'Statistiques indisponibles')}</p>
                )}
              </div>
            )}
          </div>

          {/* Per-row action */}
          {downloading ? (
            <button
              onClick={() => handleCancel(entry.id)}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-tint px-3.5 text-xs font-bold text-text-secondary transition active:scale-95"
            >
              <X size={15} />
              {t('common.cancel', 'Annuler')}
            </button>
          ) : isLocal ? (
            <button
              onClick={() => void handleSelect(entry.id)}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition active:scale-95',
                isActive ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
              )}
            >
              <Check size={16} />
              {t('common.select', 'Utiliser')}
            </button>
          ) : (
            <button
              onClick={() => void handleDownload(entry.id)}
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-sm transition active:scale-95"
            >
              <Download size={16} />
              {t('common.download', 'Télécharger')}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render one language section: header with count + local/remote split.
  const renderLanguageSection = (language: string, ids: string[]) => {
    const langEntries = entries.filter((e) => ids.includes(e.id));
    const local = langEntries.filter((e) => (states[e.id]?.available ?? false));
    const remote = langEntries.filter((e) => !(states[e.id]?.available ?? false));
    return (
      <section key={language} className="mb-6">
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-surface px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Languages size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">{language}</p>
              <p className="text-[11px] text-text-muted">
                {t('settings.langVersionsCount', { count: ids.length })}
              </p>
            </div>
          </div>
          {local.length > 0 && (
            <span className="rounded-full bg-success-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
              {local.length} {t('settings.localAvailable', 'en local')}
            </span>
          )}
        </div>

        {local.length > 0 && (
          <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
            <CircleCheck size={13} className="text-success" />
            {t('settings.localVersions', 'Disponible en local')}
          </div>
        )}
        <div className="flex flex-col gap-3">{local.map(renderRow)}</div>

        {remote.length > 0 && (
          <>
            <div className="mt-3 mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
              <Download size={13} />
              {t('settings.toDownload', 'À télécharger')}
            </div>
            <div className="flex flex-col gap-3">{remote.map(renderRow)}</div>
          </>
        )}
      </section>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-4 pb-24">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-text-muted active:bg-surface-tint"
          aria-label={t('common.back', 'Retour')}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">
            {t('settings.availableTranslations', 'Versions de la Bible')}
          </h1>
          <p className="text-xs text-text-muted">
            {t('settings.langCount', { count: languageGroups.length })} ·{' '}
            {localCount} {t('settings.localCount', { count: localCount })}
          </p>
        </div>
      </div>

      <p className="mb-5 px-1 text-sm text-text-muted">
        {t('settings.availableTranslationsHint', 'Téléchargez une version pour l’utiliser hors ligne. Elle restera disponible sur cet appareil.')}
      </p>

      {languageGroups.map((group) => renderLanguageSection(group.language, group.ids))}

      {isAuthenticated && (
        <p className="mt-6 px-1 text-center text-xs text-text-tertiary">
          {t('common.online', 'Préférence synchronisée avec votre compte')}
        </p>
      )}
    </div>
  );
}

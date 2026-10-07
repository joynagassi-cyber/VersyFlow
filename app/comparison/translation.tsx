/**
 * Translation Comparison — vertical, scrollable comparison of a verse across
 * every loaded translation.
 *
 * The header exposes an "Ajouter une version" action: tapping it opens a
 * bottom sheet listing all known translations (grouped by language) that
 * are not yet in the comparison; adding one re-runs the comparison with the
 * extended list. The list itself is a single vertical column with a sticky
 * reference label, so the user scrolls through all versions top-to-bottom.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Plus, X, Loader2, Languages, Check, Globe } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { BIBLE_TRANSLATION_REGISTRY as DEFAULT_BIBLE_TRANSLATIONS } from '@/services/translation-preference-service';
import { bibleTranslationDisplayName, getTranslationDisplayInfo } from '@/services/bible-translation-names';
import {
  downloadAndLoadTranslationData,
  loadTranslationData,
  BIBLE_DATASET_CATALOG,
} from '@/services/bible-text-service';
import { EmptyState } from '@/components/ui/EmptyState';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';

interface Row {
  id: string;
  name: string;
  language: string;
  text: string | null;
  loading: boolean;
  error: string | null;
}

export default function TranslationComparisonScreen() {
  const { t, i18n } = useTranslation();
  const bibleTranslation = useSettingsStore((s) => s.bibleTranslation);
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId') ?? '';
  const chapter = Number(searchParams.get('chapter') ?? 0);
  const verse = Number(searchParams.get('verse') ?? 0);

  const [rows, setRows] = useState<Row[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [bookName, setBookName] = useState<string>(bookId);
  const [targetLang, setTargetLang] = useState<string | null>(null);

  const activeIds = useMemo(() => rows.map((r) => r.id), [rows]);

  const allManifests = useMemo(() => {
    // Merge the static registry with the remote dataset catalog so every
    // downloadable translation (bible-datasets bucket) is selectable.
    const byId = new Map<string, { id: string; name: string; language: string }>();
    for (const m of DEFAULT_BIBLE_TRANSLATIONS) {
      byId.set(m.id, { id: m.id, name: m.name, language: m.language });
    }
    for (const entry of BIBLE_DATASET_CATALOG) {
      if (!byId.has(entry.id)) {
        const info = getTranslationDisplayInfo(entry.id);
        byId.set(entry.id, {
          id: entry.id,
          name: info.name,
          language: info.language,
        });
      }
    }
    if (bibleTranslation && !byId.has(bibleTranslation)) {
      const info = getTranslationDisplayInfo(bibleTranslation);
      byId.set(bibleTranslation, {
        id: bibleTranslation,
        name: info.name,
        language: info.language,
      });
    }
    return Array.from(byId.values());
  }, [bibleTranslation]);

  // Languages present in the manifest set, for the target-language picker.
  const availableLanguages = useMemo(
    () => Array.from(new Set(allManifests.map((m) => m.language))).sort(),
    [allManifests],
  );

  // Seed language: the target-language picker wins; otherwise the active
  // translation's own Bible language (never a hardcoded 'fr').
  const seedLanguage = targetLang ?? (
    allManifests.find((m) => m.id === bibleTranslation)?.language ?? 'fr'
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const books = await import('@/domains/bible/entities').then((m) => m.BIBLE_BOOKS);
      setBookName(
        books.find((b) => b.id === bookId)?.name?.[i18next.language ?? 'fr'] ?? bookId,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const loadRow = async (id: string, language: string, fallbackName: string) => {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, loading: true, error: null } : r)),
    );
    try {
      let data = await loadTranslationData(id);
      if (!data) data = await downloadAndLoadTranslationData(id);
      if (!data) throw new Error('dataset missing');
      const book = data.books.find((b) => b.id === bookId);
      const ch = book?.chapters.find((c) => c.number === chapter);
      const v = ch?.verses.find((x) => x.number === verse);
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                loading: false,
                name: r.name || fallbackName,
                text: v?.text ?? null,
              }
            : r,
        ),
      );
    } catch (e) {
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, loading: false, error: e instanceof Error ? e.message : String(e) }
            : r,
        ),
      );
    }
  };

  // Initial load: the active translation + the other versions in the seed
  // language (active translation's Bible language by default).
  useEffect(() => {
    if (!bookId || !chapter || !verse) return;
    const seed = allManifests.filter(
      (m) => m.id === bibleTranslation || m.language === seedLanguage,
    );
    setRows(
      seed.map((m) => ({
        id: m.id,
        name: m.name,
        language: m.language,
        text: null,
        loading: true,
        error: null,
      })),
    );
    seed.forEach((m) => {
      void loadRow(m.id, m.language, m.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapter, verse, bibleTranslation, seedLanguage, allManifests]);

  const add = (id: string, name: string, language: string) => {
    setRows((rs) =>
      rs.some((r) => r.id === id)
        ? rs
        : [...rs, { id, name, language, text: null, loading: true, error: null }],
    );
    void loadRow(id, language, name);
  };

  const remove = (id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const availableToAdd = allManifests.filter((m) => !activeIds.includes(m.id));
  const referenceLabel = `${bookName} ${chapter}:${verse}`;

  const changeLanguage = (lang: string) => {
    setTargetLang(lang || null);
  };

  return (
    <FullScreenPage
      title={t('comparison.title', 'Comparaison')}
      showBack
      right={
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm active:scale-95"
        >
          <Plus size={14} />
          {t('comparison.addVersion', 'Ajouter une version')}
        </button>
      }
    >
      <div className="mx-auto max-w-md">
        {/* Sticky reference label + target-language picker */}
        <div className="sticky top-0 z-10 mb-3 space-y-2 rounded-xl bg-surface/95 px-3 py-2.5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">{referenceLabel}</span>
            <span className="text-xs text-text-muted">
              {rows.length} {t('comparison.versions', 'versions')}
            </span>
          </div>
          {availableLanguages.length > 1 && (
            <div className="flex items-center gap-2">
              <Globe size={13} className="shrink-0 text-primary" />
              <select
                value={targetLang ?? ''}
                onChange={(e) => changeLanguage(e.target.value)}
                className="h-7 min-w-0 flex-1 rounded-lg border border-[color:var(--color-border)] bg-surface-tint px-2 text-xs font-semibold text-text-primary outline-none"
                aria-label={t('comparison.language', 'Langue de comparaison')}
              >
                <option value="">
                  {t('comparison.autoLanguage', 'Langue de la version active')}
                </option>
                {availableLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Vertical scrollable list */}
        <div className="flex flex-col gap-3 pb-8">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                'bible-card rounded-2xl bg-surface p-4 shadow-sm transition',
                r.id === bibleTranslation && 'ring-1 ring-primary/40',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-bold text-text-primary">{r.name}</span>
                  {r.language && (
                    <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-muted">
                      {r.language}
                    </span>
                  )}
                  {r.id === bibleTranslation && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Check size={10} /> {t('comparison.active', 'Active')}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="rounded-full p-1 text-text-muted active:bg-surface-tint"
                  aria-label={t('common.remove', 'Retirer')}
                >
                  <X size={15} />
                </button>
              </div>
              {r.loading ? (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  {t('comparison.loadingTranslation', 'Chargement de la traduction...')}
                </div>
              ) : r.error ? (
                <p className="text-xs italic text-text-muted">{r.error}</p>
              ) : r.text ? (
                <p
                  className="bible-text text-[15px] text-text-primary"
                  style={{ fontFamily: 'var(--reading-font-family, "Source Serif 4", Georgia, serif)' }}
                >
                  {r.text}
                </p>
              ) : (
                <p className="text-xs italic text-text-muted">
                  {t('comparison.unavailable', 'Verset non disponible')}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* "Add a version" bottom sheet */}
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setAddOpen(false)} />
            <div className="relative max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Languages size={16} className="text-primary" />
                  {t('comparison.addVersion', 'Ajouter une version')}
                </p>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-full p-1 text-text-muted active:bg-surface-tint"
                >
                  <X size={16} />
                </button>
              </div>
              {availableToAdd.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  {t('comparison.allAdded', 'Toutes les versions disponibles sont déjà ajoutées.')}
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {availableToAdd.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => add(m.id, m.name, m.language)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition active:bg-surface-tint"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium text-text-primary">
                          {m.name}
                        </span>
                        {m.language && (
                          <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] font-bold uppercase text-text-muted">
                            {m.language}
                          </span>
                        )}
                      </span>
                      <Plus size={16} className="shrink-0 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}

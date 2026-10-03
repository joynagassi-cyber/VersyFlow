import { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { BibleTranslationRegistry, DEFAULT_BIBLE_TRANSLATIONS } from '@/domains/bible/registry';
import { InMemoryBibleTextSource } from '@/domains/bible/repository-local';
import { createTranslationComparisonService } from '@/services/translation-comparison-service';
import {
  downloadAndLoadTranslationData,
  loadTranslationData,
} from '@/services/bible-text-service';
import type { TranslationComparisonResult } from '@/capabilities/comparison/translation-comparison';
import { useSettingsStore } from '@/store/settings-store';

const SEED_SOURCE: Record<string, unknown> = {
  lsg: {
    id: 'lsg',
    language: 'fr',
    name: 'Louis Segond (1910)',
    books: [
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new',
        chapterCount: 21,
        chapters: [
          {
            number: 3,
            verses: [{ number: 16, text: "Car Dieu a tant aime le monde qu'il a donne son Fils unique..." }],
          },
        ],
      },
    ],
  },
  ostervald: {
    id: 'ostervald',
    language: 'fr',
    name: 'Ostervald (1930)',
    year: 1930,
    author: 'Ostervald',
    books: [
      {
        id: 'joh',
        name: { fr: 'Jean', en: 'John' },
        testament: 'new',
        chapterCount: 21,
        chapters: [
          {
            number: 3,
            verses: [
              { number: 16, text: "Ainsi parla l'Eternel au sujet de Jesus : toute chair s'inclinera devant lui." },
            ],
          },
        ],
      },
    ],
  },
};

export default function TranslationComparisonScreen() {
  const { t } = useTranslation();
  const { bibleTranslation } = useSettingsStore();
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get('bookId') ?? '';
  const chapter = searchParams.get('chapter') ?? '';
  const verse = searchParams.get('verse') ?? '';

  const [results, setResults] = useState<TranslationComparisonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookName, setBookName] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Resolve each French dataset through the shared chain
        // (bundled → download cache → Supabase bucket download in dev),
        // never the raw JSON-file source (SPA-fallback 404 in dev).
        const datasets: Record<string, unknown> = {};
        for (const id of DEFAULT_BIBLE_TRANSLATIONS.filter((m) => m.language === 'fr' && m.available).map((m) => m.id)) {
          if (cancelled) return;
          try {
            let data = await loadTranslationData(id);
            if (!data) data = await downloadAndLoadTranslationData(id);
            datasets[id] = data;
          } catch {
            // Unresolvable dataset → excluded (shown as unavailable).
          }
        }
        if (cancelled) return;
        const manifests = DEFAULT_BIBLE_TRANSLATIONS.filter(
          (m) => m.language === 'fr' && m.available && datasets[m.id] !== undefined,
        );
        if (manifests.length === 0) {
          setError(t('comparison.noTranslations', 'Aucune traduction disponible'));
          setLoading(false);
          return;
        }
        const defaultId =
          manifests.some((m) => m.id === bibleTranslation) && bibleTranslation
            ? bibleTranslation
            : manifests[0].id;
        const registry = new BibleTranslationRegistry(manifests, defaultId);
        const source =
          typeof fetch === 'function'
            ? new InMemoryBibleTextSource(Object.keys(datasets).length ? datasets : SEED_SOURCE)
            : new InMemoryBibleTextSource(SEED_SOURCE);
        const engine = createTranslationComparisonService(source, registry);
        const translationIds = registry
          .getByLanguage('fr')
          .filter((r) => r.available)
          .map((r) => r.id);
        const ordered = [...translationIds].sort(
          (a, b) => Number(b === bibleTranslation) - Number(a === bibleTranslation),
        );
        if (ordered.length === 0) {
          setError(t('comparison.noTranslations', 'Aucune traduction disponible'));
          setLoading(false);
          return;
        }
        const bookNameValue =
          (await import('@/domains/bible/entities')).BIBLE_BOOKS.find(
            (b) => b.id === bookId,
          )?.name?.[i18next.language ?? 'fr'] ?? bookId;
        setBookName(bookNameValue);
        const data = await engine.compare(
          { bookId, chapter: parseInt(chapter), verse: parseInt(verse) },
          ordered,
        );
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, verse, bibleTranslation, t]);

  const referenceDisplay = bookId
    ? (bookName ?? bookId) + ' ' + chapter + ':' + verse
    : chapter + ':' + verse;

  if (loading) {
    return (
      <FullScreenPage title={t('comparison.title', 'Comparaison')} showBack>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-text-muted">
            {t('comparison.loading', 'Chargement des traductions...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  if (error) {
    return (
      <FullScreenPage title={t('comparison.title', 'Comparaison')} showBack>
        <div className="mx-auto max-w-md">
          <EmptyState
            title={error}
            description={t('comparison.errorHint', 'Recherchez les traductions disponibles.')}
            showLogo={false}
          />
        </div>
      </FullScreenPage>
    );
  }

  return (
    <FullScreenPage
      title={t('comparison.title', 'Comparaison')}
      showBack
      right={<ArrowLeft size={18} className="text-text-muted" />}
    >
      <div className="mx-auto max-w-md">
        <span className="mb-4 inline-block rounded-lg bg-surface-tint px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {referenceDisplay}
        </span>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {results.map((item) => (
            <div
              key={item.translationId}
              className="w-[85vw] shrink-0 rounded-2xl bg-surface p-4 shadow-sm"
            >
              <div className="mb-3 border-b border-[color:var(--color-divider)] pb-2">
                <p className="text-sm font-bold text-text-primary">{item.name}</p>
                <span
                  className={
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
                    (item.available
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning')
                  }
                >
                  {item.available
                    ? t('comparison.available', 'Disponible')
                    : t('comparison.licenseUnavailable', 'Non disponible')}
                </span>
              </div>
              {item.text ? (
                <p className="font-serif text-base leading-relaxed text-text-primary">
                  {item.text}
                </p>
              ) : (
                <p className="text-sm italic text-text-muted">
                  {t('comparison.unavailable', 'Verset non disponible')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </FullScreenPage>
  );
}

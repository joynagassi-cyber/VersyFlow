/**
 * Memorization Workspace — unified verse practice screen (unified croquis D/E/F/G).
 *
 * One page, every feature of the memory engine, driven by the croquis
 * layout:
 *   - Header: back · "Jean 3:16" · LSG ▾ (TranslationMenu) · statut (Nouveau/
 *     À revoir/Consolidation) · J+[X] · comparer (→)
 *   - 4 modes (Segmented, collapsed by default):
 *       G · Révéler (par défaut) — incremental block reveal
 *       E · Masquer — manual or auto mask + Vérifier
 *       F · Cartes — flashcard flip + 4 FSRS buttons
 *       D · Écrire — write the verse, diff card (original left, written
 *         right, errors in red) + 4 FSRS buttons
 *   - After each mode, a "Passer au mode suivant" recommendation when the
 *     user's score was ≥ threshold.
 *
 * Reachable from the verse action bar ("Mémoriser") via
 * `/memorization/workspace?reference=...` or explicit coordinates.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowLeftRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import { useMemorizationWorkspace, parseWorkspaceReference } from '@/hooks/useMemorizationWorkspace';
import { ModeSwitcher, type ModeId } from '@/components/memorization/ModeSwitcher';
import { ModeReveal } from '@/components/memorization/ModeReveal';
import { ModeMask } from '@/components/memorization/ModeMask';
import { ModeCards } from '@/components/memorization/ModeCards';
import { ModeWrite } from '@/components/memorization/ModeWrite';
import { TranslationMenu } from '@/components/memorization/TranslationMenu';

type StatusTone = 'new' | 'due' | 'consolidated';

function statusTone(record: ReturnType<typeof useMemorizationWorkspace>['record'], nextReviewAt: Date | null): StatusTone {
  if (!record) return 'new';
  const due = nextReviewAt ? nextReviewAt.getTime() <= Date.now() : false;
  if (record.status === 'mastered' && !due) return 'consolidated';
  if (due) return 'due';
  return 'due'; // in-progress and due → "À revoir"
}

function statusLabel(tone: StatusTone, t: ReturnType<typeof useTranslation>['t']): string {
  switch (tone) {
    case 'new':
      return t('workspace.status.new', 'Nouveau');
    case 'due':
      return t('workspace.status.due', 'À revoir');
    case 'consolidated':
      return t('workspace.status.consolidated', 'Consolidation');
  }
}

function formatDue(due: Date | null, t: ReturnType<typeof useTranslation>['t']): string | null {
  if (!due) return null;
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return t('workspace.dueNow', "aujourd'hui");
  if (days === 1) return t('workspace.dueTomorrow', 'demain');
  return `J+${days}`;
}

export default function MemorizationWorkspace() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const setBibleTranslation = useSettingsStore((s) => s.setBibleTranslation);

  const coords = useMemo(() => {
    const reference = params.get('reference');
    if (reference) return parseWorkspaceReference(reference);
    const bookId = params.get('bookId');
    const chapter = parseInt(params.get('chapter') ?? '', 10);
    const verse = parseInt(params.get('verse') ?? '', 10);
    if (!bookId || !chapter || !verse) return null;
    const translationId =
      params.get('translationId') ?? useSettingsStore.getState().bibleTranslation || 'lsg';
    return { bookId, chapter, verse, translationId };
  }, [params]);

  const workspace = useMemorizationWorkspace(
    coords ?? { bookId: '', chapter: 0, verse: 0, translationId: 'lsg' },
  );

  const [mode, setMode] = useState<ModeId>('reveal');
  const [lastScore, setLastScore] = useState<number | null>(null);

  const recommendedNext: ModeId | null = useMemo(() => {
    // After "Révéler" is revealed fully, recommend "Masquer"; after
    // "Masquer" verified ≥ 0.9, recommend "Cartes"; after "Cartes"
    // rated with Bon/Facile, recommend "Écrire".
    if (mode === 'reveal') return lastScore !== null && lastScore >= 0.9 ? 'mask' : null;
    if (mode === 'mask') return lastScore !== null && lastScore >= 0.9 ? 'cards' : null;
    if (mode === 'cards') return lastScore !== null && lastScore >= 0.9 ? 'write' : null;
    return null;
  }, [mode, lastScore]);

  const recommendNext = (score: number) => {
    setLastScore(score);
  };

  const passToNext = () => {
    // Jump to the recommended mode (default: next in the D/E/F/G order).
    const order: ModeId[] = ['reveal', 'mask', 'cards', 'write'];
    const idx = order.indexOf(mode);
    setMode(order[Math.min(idx + 1, order.length - 1)]);
    setLastScore(null);
  };

  const changeTranslation = (id: string) => {
    setBibleTranslation(id);
    // Rebuild the coordinates with the new translation; the workspace
    // hook reloads via its effect when coords.translationId changes.
    if (coords) {
      const next = { ...coords, translationId: id };
      // Force a re-run by mutating the URL search params.
      navigate(
        `/memorization/workspace?bookId=${next.bookId}&chapter=${next.chapter}&verse=${next.verse}&translationId=${id}`,
        { replace: true },
      );
    }
  };

  const {
    status,
    statusMessage,
    referenceLabel,
    verseText,
    record,
    nextReviewAt,
    rate,
  } = workspace;

  const tone = statusTone(record, nextReviewAt);
  const dueLabel = formatDue(nextReviewAt, t);

  if (!coords) {
    return (
      <div className="flex min-h-full flex-col bg-background p-6">
        <ShellHeader
          title={referenceLabel || t('workspace.title', 'Mémorisation')}
          subtitle={statusLabel(tone, t)}
          onBack={() => navigate('/tabs/home')}
        />
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="text-base text-error">
            {t('errors.verseNotFound', 'Verset non disponible')}
          </p>
          <button
            onClick={() => navigate('/bible/explorer')}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95"
          >
            {t('workspace.openBible', 'Ouvrir la Bible')}
          </button>
        </div>
      </div>
    );
  }

  const modeProps = {
    text: verseText,
    referenceLabel,
    record,
    onRate: rate,
    onRecommendNext: recommendNext,
    onNextMode: passToNext,
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Top app bar (mirrors the croquis D/E/F) */}
      <ShellHeader
        title={referenceLabel}
        subtitle={`${statusLabel(tone, t)}${dueLabel ? ` · ${dueLabel}` : ''}`}
        onBack={() => navigate(-1)}
        right={
          <button
            onClick={() => navigate(`/comparison/translation?bookId=${coords.bookId}&chapter=${coords.chapter}&verse=${coords.verse}`)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary shadow-sm active:scale-95"
            aria-label={t('workspace.compare', 'Comparer')}
          >
            <ArrowLeftRight size={18} />
          </button>
        }
        subtitleExtra={
          <TranslationMenu translationId={coords.translationId} onSelect={changeTranslation} />
        }
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        {status === 'loading' && (
          <div className="flex flex-col items-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="mt-3 text-sm text-text-tertiary">
              {t('workspace.loading', 'Chargement du verset...')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-3xl bg-surface p-6 text-center shadow-sm">
            <p className="text-sm text-error">
              {statusMessage ?? t('errors.verseNotFound', 'Verset non disponible')}
            </p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-3 pt-2">
            {mode === 'reveal' && <ModeReveal {...modeProps} />}
            {mode === 'mask' && <ModeMask {...modeProps} />}
            {mode === 'cards' && <ModeCards {...modeProps} />}
            {mode === 'write' && <ModeWrite {...modeProps} />}
          </div>
        )}
      </div>

      {/* Floating 4-mode switcher (collapsed by default) */}
      <ModeSwitcher
        active={mode}
        onChange={setMode}
        recommendedNext={recommendedNext}
      />
    </div>
  );
}

/**
 * The top app bar that matches the croquis (D/E/F) — back on the left,
 * a bold title "Jean 3:16" centered, and the "LSG ▾ · état · J+[X]"
 * subtitle under it. A right button is optional (compare / fullscreen, etc.).
 */
function ShellHeader({
  title,
  subtitle,
  subtitleExtra,
  right,
  onBack,
}: {
  title: string;
  subtitle: string;
  subtitleExtra?: React.ReactNode;
  right?: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-background via-background to-transparent">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-text-primary shadow-sm active:scale-95"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <h1 className="truncate text-lg font-bold text-text-primary">{title}</h1>
          {subtitle && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
              {subtitleExtra}
              <span>·</span>
              <span className="max-w-[40vw] truncate">{subtitle}</span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center">{right}</div>
      </div>
    </header>
  );
}

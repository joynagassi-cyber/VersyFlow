/**
 * ReadingPanel — le panneau secondaire de bureau.
 *
 * Un panneau n'a de sens que s'il **agit** : celui-ci pilote la typographie de
 * lecture réellement utilisée par les écrans de Bible et de mémorisation.
 * Chaque contrôle écrit dans `appearance-store` (taille, interligne, numéros de
 * versets) et `ThemeManager` propage la variable CSS correspondante ; aucun
 * écran n'est modifié, aucun état n'est dupliqué.
 *
 * Le panneau est monté uniquement :
 *  - au bureau (≥ 1024 px) — sous cette largeur, la colonne de lecture
 *    `.screen-column-narrow` suffit et un panneau volerait l'espace du texte ;
 *  - sur les routes de lecture (voir `PANEL_ROUTES` dans DesktopShell).
 *
 * Ce qu'il n'est pas : une décoration. Il n'affiche aucun chiffre qui ne
 * vienne pas d'un réglage réel.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Add01Icon as Plus,
  MinusSignIcon as Minus,
  Tick02Icon as Check,
  BookOpen01Icon as BookOpen,
  Clock01Icon as Clock,
  NoteIcon as Note,
  RefreshIcon as Reset,
} from '@hugeicons/core-free-icons';
import { useAppearanceStore } from '@/store/appearance-store';
import { Button } from '@/components/ui/button';

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  disabledDecrease,
  disabledIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  disabledDecrease: boolean;
  disabledIncrease: boolean;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disabledDecrease}
          aria-label={decreaseLabel}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-tint text-primary transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <DuoIcon icon={Minus} size={16} />
        </button>
        <span className="text-sm font-bold tabular-nums text-text-primary">{value}</span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disabledIncrease}
          aria-label={increaseLabel}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-tint text-primary transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          <DuoIcon icon={Plus} size={16} />
        </button>
      </div>
    </div>
  );
}

export function ReadingPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fontSize = useAppearanceStore((s) => s.bibleFontSize);
  const lineHeight = useAppearanceStore((s) => s.bibleLineHeight);
  const verseNumbers = useAppearanceStore((s) => s.showVerseNumbers);
  const setBibleFontSize = useAppearanceStore((s) => s.setBibleFontSize);
  const setBibleLineHeight = useAppearanceStore((s) => s.setBibleLineHeight);
  const toggleVerseNumbers = useAppearanceStore((s) => s.toggleVerseNumbers);

  return (
    <aside
      aria-label={t('shell.readingPanel', 'Confort de lecture')}
      className="flex h-full w-80 shrink-0 flex-col gap-3 overflow-y-auto border-s border-border bg-surface p-4"
    >
      <div>
        <h2 className="text-sm font-bold text-text-primary">
          {t('shell.readingPanel', 'Confort de lecture')}
        </h2>
        <p className="mt-0.5 text-xs text-text-muted">
          {t('shell.readingPanelHint', 'Ces réglages s’appliquent au texte biblique et aux sessions.')}
        </p>
      </div>

      <Stepper
        label={t('shell.fontSize', 'Taille du texte')}
        value={`${fontSize} px`}
        onDecrease={() => setBibleFontSize(fontSize - 1)}
        onIncrease={() => setBibleFontSize(fontSize + 1)}
        decreaseLabel={t('shell.decrease', 'Réduire')}
        increaseLabel={t('shell.increase', 'Agrandir')}
        disabledDecrease={fontSize <= 14}
        disabledIncrease={fontSize >= 28}
      />

      <Stepper
        label={t('shell.lineHeight', 'Interligne')}
        value={lineHeight.toFixed(1)}
        onDecrease={() => setBibleLineHeight(Math.round((lineHeight - 0.1) * 10) / 10)}
        onIncrease={() => setBibleLineHeight(Math.round((lineHeight + 0.1) * 10) / 10)}
        decreaseLabel={t('shell.decrease', 'Réduire')}
        increaseLabel={t('shell.increase', 'Agrandir')}
        disabledDecrease={lineHeight <= 1.2}
        disabledIncrease={lineHeight >= 2.2}
      />

      <button
        type="button"
        onClick={toggleVerseNumbers}
        aria-pressed={verseNumbers}
        className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-start transition-colors hover:bg-surface-tint"
      >
        <span className="text-sm font-semibold text-text-primary">
          {t('shell.verseNumbers', 'Numéros de versets')}
        </span>
        <span
          className={
            verseNumbers
              ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary'
              : 'flex h-6 w-6 items-center justify-center rounded-full border border-border text-text-muted'
          }
        >
          {verseNumbers && <DuoIcon icon={Check} size={14} />}
        </span>
      </button>

      <div className="mt-1 space-y-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/bible/explorer')}>
          <DuoIcon icon={BookOpen} size={16} />
          {t('nav.bible', 'Bible')}
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/review/queue')}>
          <DuoIcon icon={Clock} size={16} />
          {t('nav.review', 'Révisions')}
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/notes')}>
          <DuoIcon icon={Note} size={16} />
          {t('notes.title', 'Notes')}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            // Valeurs de `DEFAULTS` dans appearance-store : le bouton remet
            // exactement le réglage d'usine, pas une valeur choisie ici.
            setBibleFontSize(19);
            setBibleLineHeight(1.75);
          }}
        >
          <DuoIcon icon={Reset} size={16} />
          {t('shell.resetReading', 'Réinitialiser le confort')}
        </Button>
      </div>
    </aside>
  );
}

export default ReadingPanel;

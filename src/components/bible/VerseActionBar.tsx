/**
 * VerseActionBar — barre flottante contextuelle de la lecture biblique.
 *
 * COMPACITÉ. La version précédente alignait sept boutons de 64 px avec leur
 * libellé sous l'icône, plus la référence : à 4,4 rem rien que pour le premier
 * bouton, la rangée débordait et devenait une zone de défilement horizontal
 * dont on ne voyait jamais la fin. Ici, les actions sont des boutons ICÔNE de
 * 36 px, la référence est un pilule tronquée à gauche, et la totalité tient
 * dans la largeur d'un téléphone de 360 px sans défilement. Les libellés
 * deviennent des `aria-label` et des `title` : l'information n'est pas perdue,
 * elle n'occupe simplement plus la surface.
 *
 * MULTI-SÉLECTION. La barre agit sur `verses: number[]`. Les services qui ne
 * savent traiter qu'un verset (note, tag, favori, mémorisation) s'appuient sur
 * le verset de tête et l'annoncent par le compte (« 4 versets ») — agir
 * silencieusement sur un seul verset en laissant croire à quatre serait pire
 * que de ne rien faire.
 *
 * SURLIGNAGE. Cinq pastilles, dont la première est l'accent actif. Une
 * pastille applique sa couleur à TOUTE la sélection ; retoucher la pastille
 * déjà appliquée partout retire le surlignage. C'est le seul modèle qui évite
 * un mode « couleur courante » invisible, qu'on oublie et qui surligne tout
 * de travers.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  BrainCircuitIcon as BrainCircuit,
  CheckIcon as Check,
  Copy01Icon as Copy,
  HeartIcon as Heart,
  HighlighterIcon as Highlighter,
  PenLineIcon as PenLine,
  Tag01Icon as Tag,
  ArrowLeftRightIcon as ArrowLeftRight,
  Cancel01Icon as Close,
} from '@/components/ui/solar-icons';
import { BIBLE_BOOKS_LIST as BIBLE_BOOKS } from '@/services/memorization-session-service';
import { eventBus, DomainEventTypes } from '@/services/events-service';
import { getVerseNote, saveVerseNote } from '@/services/verse-note-service';
import { getSemanticService } from '@/services/semantic-query-service';
import { getMemorizationService } from '@/services/memorization-service-factory';
import {
  useHighlightStore,
  HIGHLIGHT_COLOR_IDS,
  DEFAULT_HIGHLIGHT_COLOR,
  type HighlightColorId,
  type HighlightState,
} from '@/store/highlight-store';
import { cn } from '@/lib/utils';
import { DEFAULT_TRANSLATION_ID } from '@/domains/bible/registry';
import { formatSelectionReference } from '@/lib/verse-selection';

interface VerseActionBarProps {
  bookId: string;
  chapter: number;
  verses: number[];
  verseText?: string;
  translationId?: string;
  /** Ferme la barre et vide la sélection. */
  onClearSelection?: () => void;
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
  tone = 'default',
}: {
  icon: typeof BrainCircuit;
  label: string;
  active?: boolean;
  onClick: () => void;
  tone?: 'default' | 'primary';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'verse-action-btn',
        active && 'is-active',
        tone === 'primary' && 'is-primary',
      )}
    >
      <DuoIcon icon={Icon} size={18} />
    </button>
  );
}

export default function VerseActionBar({
  bookId,
  chapter,
  verses,
  verseText,
  translationId,
  onClearSelection,
}: VerseActionBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  // Localized display name for the active UI language (never raw `fr`):
  // `name[lang] → fr → en → bookId` fallback chain.
  const lang = i18next.language?.split('-')[0] ?? 'fr';
  const bookName = book?.name?.[lang] ?? book?.name?.fr ?? bookId;

  const sortedVerses = useMemo(() => [...verses].sort((a, b) => a - b), [verses]);
  const verse = sortedVerses[0];
  const isMulti = sortedVerses.length > 1;
  const reference = formatSelectionReference(bookName, chapter, sortedVerses);
  const verseKeys = useMemo(
    () => sortedVerses.map((n) => `${bookId}:${chapter}:${n}`),
    [bookId, chapter, sortedVerses],
  );
  const verseKey = `${bookId}:${chapter}:${verse}`;
  // The active translation falls back to the app default (`lsg`), not a
  // literal duplicated in two places.
  const translation = translationId ?? DEFAULT_TRANSLATION_ID;

  const marks = useHighlightStore((s: HighlightState) => s.marks);
  const markVerses = useHighlightStore((s: HighlightState) => s.mark);
  const clearMarks = useHighlightStore((s: HighlightState) => s.clear);
  const toggleHighlight = useHighlightStore((s: HighlightState) => s.toggle);

  /** Couleur commune à toute la sélection, ou `null` si elle est hétérogène. */
  const commonColor = useMemo<HighlightColorId | null>(() => {
    const colors = verseKeys.map((key) => marks[key]);
    if (colors.some((c) => c == null)) return null;
    return colors.every((c) => c === colors[0]) ? colors[0] : null;
  }, [marks, verseKeys]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const [tagged, setTagged] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const noteLoadedFor = useRef<string>('');

  // Load the favorite flag when the verse changes (only for already-memorized
  // verses; otherwise the record doesn't exist yet and the flag is false).
  useEffect(() => {
    let cancelled = false;
    getMemorizationService()
      .getMemorizedRecord(bookId, chapter, verse, translation)
      .then((rec) => {
        if (cancelled) return;
        setIsFavorite(rec?.favorite ?? false);
      })
      .catch(() => {
        if (!cancelled) setIsFavorite(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, verse, translation]);

  useEffect(() => {
    eventBus.emit({
      id: crypto.randomUUID(),
      type: DomainEventTypes.VERSE_SELECTED,
      timestamp: Date.now(),
      payload: {
        bookId,
        chapterNumber: chapter,
        verseNumber: verse,
        referenceDisplay: reference,
      },
    });
    setNoteOpen(false);
    setNoteSaved(false);
    setCopied(false);
    setTagOpen(false);
    setTagName('');
    setTagged(false);
    // La barre se ré-ancre quand la sélection change ; `reference` dérive des
    // mêmes entrées, donc la liste de dépendances reste volontairement étroite.
  }, [bookId, chapter, verse, reference]);

  /**
   * Applique une couleur. Si la pastille est déjà celle de toute la sélection,
   * elle la retire : une seconde pression défait un choix, comme ailleurs.
   */
  const applyColor = (color: HighlightColorId) => {
    if (commonColor === color) clearMarks(verseKeys);
    else markVerses(verseKeys, color);
    setPaletteOpen(false);
  };

  const copyToClipboard = async () => {
    if (!verseText) return;
    try {
      await navigator.clipboard.writeText(`${verseText} — ${reference}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const openNote = async () => {
    if (!noteOpen) {
      if (noteLoadedFor.current !== verseKey) {
        setNoteText(await getVerseNote(bookId, chapter, verse));
        noteLoadedFor.current = verseKey;
      }
    }
    setNoteOpen(true);
  };

  const saveNote = async () => {
    await saveVerseNote(bookId, chapter, verse, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteOpen(false), 350);
  };

  const tagVerse = async () => {
    if (tagName.trim().length === 0) {
      // No name given: just mark the verse and route to its concept page
      // (where the user can browse/attach existing concepts).
      if (marks[verseKey] == null) toggleHighlight(verseKey, DEFAULT_HIGHLIGHT_COLOR);
      navigate(`/semantic/verse?verseRef=${encodeURIComponent(verseKey)}`);
      return;
    }
    // Name given: insert the tag into the semantic tree immediately
    // (reuses an existing concept of the same name, or creates it).
    setTagSaving(true);
    try {
      await getSemanticService().saveVerseTag({
        verseKey,
        conceptId: crypto.randomUUID(),
        canonicalName: tagName.trim(),
        role: 'PRIMARY',
        locale: i18next.language,
        bridgeId: crypto.randomUUID(),
      });
      setTagged(true);
      setTimeout(() => {
        navigate(`/semantic/verse?verseRef=${encodeURIComponent(verseKey)}`);
      }, 400);
    } catch {
      /* tag write failed — still route so the user sees the verse page */
      navigate(`/semantic/verse?verseRef=${encodeURIComponent(verseKey)}`);
    } finally {
      setTagSaving(false);
    }
  };

  /**
   * Toggle the favorite flag on the current verse's memorization record.
   * Creates a new record when one doesn't exist yet (via the
   * MemorizationService.memorize flow would be overkill — we just
   * upsert the minimal row through `saveMemorizedRecord` so the user can
   * star a verse before starting to memorize it). Emits `FAVORITE_TOGGLED`
   * through the service so downstream consumers (collections, dashboard)
   * can react.
   */
  const toggleFavoriteAction = async () => {
    if (favLoading) return;
    setFavLoading(true);
    const next = !isFavorite;
    setIsFavorite(next); // optimistic — reverts on failure
    try {
      const svc = getMemorizationService();
      const existing = await svc.getMemorizedRecord(
        bookId,
        chapter,
        verse,
        translation,
      );
      if (existing) {
        await svc.toggleFavorite(existing.id, next);
      } else {
        // Star a not-yet-memorized verse: write a new record with the
        // favorite flag set. The FSRS state stays at the default so the
        // record is not yet reviewable.
        const { getFsrsEngine } = await import('@/services/fsrs-factory');
        const fsrs = getFsrsEngine();
        const fsrsState = await fsrs.newState(0);
        await svc.saveMemorizedRecord({
          bookId,
          chapterNumber: chapter,
          verseNumber: verse,
          endVerse: verse,
          translationId: translation,
          bibleVerseReference: reference,
          bibleVerseText: verseText ?? '',
          verseTexts: verseText ? [verseText] : [],
          status: 'new',
          fsrsState,
          nextReviewAt: 0,
          createdAt: Date.now(),
          lastReviewedAt: null,
          reviewCount: 0,
          totalReviewMinutes: 0,
          wordPerformance: [],
          favorite: next,
          tags: [],
        });
      }
      eventBus.emit({
        id: crypto.randomUUID(),
        type: DomainEventTypes.FAVORITE_TOGGLED,
        timestamp: Date.now(),
        payload: {
          recordId: `${bookId}:${chapter}:${verse}:${translation}`,
          favorite: next,
        },
      });
    } catch (e) {
      setIsFavorite(!next); // revert
      console.error('[VerseActionBar] favorite toggle failed:', e);
    } finally {
      setFavLoading(false);
    }
  };

  const countLabel = isMulti
    ? t('bible.selectionCount', {
        count: sortedVerses.length,
        defaultValue: '{{count}} versets',
      })
    : null;

  return (
    <>
      <div
        role="region"
        aria-label={`${t('bible.verse', 'Verset')} ${reference}`}
        className="verse-bar"
      >
        {/* En-tête : la référence, le compte, la sortie. Sur sa propre ligne,
            elle ne dispute plus la largeur aux actions — c'est ce partage
            qui rendait la barre « trop longue ». */}
        <div className="verse-bar-head">
          <span className="verse-bar-reference" title={reference}>
            <span className="verse-bar-reference-text">{reference}</span>
            {countLabel && <span className="verse-bar-count">{countLabel}</span>}
          </span>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              aria-label={t('common.close', 'Fermer')}
              title={t('common.close', 'Fermer')}
              className="verse-action-btn is-muted"
            >
              <DuoIcon icon={Close} size={16} />
            </button>
          )}
        </div>

        <div className="verse-bar-row">
          <ActionButton
            icon={BrainCircuit}
            label={t('settings.verseBar.memorize', 'Mémoriser')}
            tone="primary"
            onClick={() => {
              const params = new URLSearchParams();
              params.set('reference', reference);
              if (verseText) params.set('text', verseText);
              navigate(`/memorization/workspace?${params.toString()}`);
            }}
          />
          <ActionButton
            icon={Copy}
            label={copied ? t('settings.verseBar.copied', 'Copié') : t('settings.verseBar.copy', 'Copier')}
            active={copied}
            onClick={() => void copyToClipboard()}
          />
          <ActionButton
            icon={PenLine}
            label={t('settings.verseBar.note', 'Note')}
            active={noteOpen || noteSaved}
            onClick={() => {
              setPaletteOpen(false);
              void openNote();
            }}
          />
          <ActionButton
            icon={Tag}
            label={t('settings.verseBar.tag', 'Taguer')}
            active={tagged || tagOpen}
            onClick={() => {
              setPaletteOpen(false);
              setTagOpen((o) => !o);
            }}
          />
          <ActionButton
            icon={Highlighter}
            label={t('settings.verseBar.highlight', 'Surligner')}
            active={paletteOpen || commonColor != null}
            onClick={() => {
              setTagOpen(false);
              setPaletteOpen((o) => !o);
            }}
          />
          <ActionButton
            icon={ArrowLeftRight}
            label={t('settings.verseBar.compare', 'Comparer')}
            onClick={() =>
              navigate(
                `/comparison/translation?bookId=${bookId}&chapter=${chapter}&verse=${verse}`,
              )
            }
          />
          <ActionButton
            icon={Heart}
            label={t('settings.verseBar.favorite', 'Favori')}
            active={isFavorite}
            onClick={() => void toggleFavoriteAction()}
          />
        </div>

        {/* Palette de surlignage : cinq pastilles, l'accent en tête. */}
        {paletteOpen && (
          <div className="verse-bar-palette" role="group" aria-label={t('bible.highlightColor', 'Couleur du surlignage')}>
            <span className="verse-bar-palette-label">
              {t('bible.highlightColor', 'Couleur du surlignage')}
            </span>
            <div className="verse-bar-swatches">
              {HIGHLIGHT_COLOR_IDS.map((color) => {
                const applied = commonColor === color;
                const name = t(`bible.highlightColors.${color}`, color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => applyColor(color)}
                    aria-label={applied ? `${name} — ${t('bible.highlightRemove', 'retirer')}` : name}
                    aria-pressed={applied}
                    title={name}
                    className={cn('hl-swatch', `hl-${color}`, applied && 'is-applied')}
                    data-hl={color}
                  >
                    {applied && <DuoIcon icon={Check} size={12} />}
                  </button>
                );
              })}
            </div>
            {commonColor != null && (
              <button
                type="button"
                className="verse-bar-clear"
                onClick={() => {
                  clearMarks(verseKeys);
                  setPaletteOpen(false);
                }}
              >
                {t('bible.highlightClear', 'Retirer')}
              </button>
            )}
          </div>
        )}

        {tagOpen && (
          <div className="verse-bar-field">
            <p className="verse-bar-field-title">
              {t('settings.verseBar.tagTo', 'Taguer ce verset avec le concept')}
            </p>
            <input
              autoFocus
              type="text"
              value={tagName}
              onChange={(e) => {
                setTagName(e.target.value);
                setTagged(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void tagVerse();
              }}
              placeholder={t('settings.verseBar.tagPlaceholder', 'ex. foi, pardon, Éternel…')}
              className="verse-bar-input"
            />
            <div className="verse-bar-field-actions">
              <button type="button" className="verse-bar-ghost" onClick={() => setTagOpen(false)}>
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={() => void tagVerse()}
                disabled={tagSaving}
                className="verse-bar-primary"
              >
                {tagSaving ? t('common.saving', 'Enregistrement…') : t('common.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        )}

        {noteOpen && (
          <div className="verse-bar-field">
            <div className="verse-bar-field-head">
              <p className="verse-bar-field-title">
                {t('bible.noteTitle', 'Note personnelle')} — {reference}
              </p>
              {noteSaved ? (
                <span className="verse-bar-saved">
                  <DuoIcon icon={Check} size={13} /> {t('common.saved', 'Enregistré')}
                </span>
              ) : null}
            </div>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                setNoteSaved(false);
              }}
              rows={3}
              placeholder={t('bible.notePlaceholder', 'Écrivez une note sur ce verset...')}
              className="verse-bar-textarea"
            />
            <div className="verse-bar-field-actions">
              <button type="button" className="verse-bar-ghost" onClick={() => setNoteOpen(false)}>
                {t('common.cancel', 'Annuler')}
              </button>
              <button type="button" onClick={() => void saveNote()} className="verse-bar-primary">
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

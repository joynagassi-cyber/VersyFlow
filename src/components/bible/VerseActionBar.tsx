/**
 * VerseActionBar — floating contextual bar shown when a verse is selected.
 *
 * Six actions on the selected verse:
 *   Mémoriser · Copier · Note · Tag · Comparer · Surligner
 *  - "Tag" marks the verse in the personal semantic tree (highlight-store
 *    flag) and routes to `/semantic/verse?verseRef=…` where the concepts
 *    for that verse are browsed/added.
 *  - "Surligner" toggles a translucent light highlight of the verse in the
 *    manuscript text (light + fluid on both #FFFFFF and #121212).
 *  - "Copier" copies the verse text + reference to the clipboard.
 * The bar emits VERSE_SELECTED so other screens can react to the choice.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  BrainCircuit,
  Check,
  Copy,
  Highlighter,
  PenLine,
  Tag,
  ArrowLeftRight,
} from 'lucide-react';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { getVerseNote, saveVerseNote } from '@/services/verse-note-service';
import { getSemanticService } from '@/services/semantic-query-service';
import { useHighlightStore, type HighlightState } from '@/store/highlight-store';
import { cn } from '@/lib/utils';

interface VerseActionBarProps {
  bookId: string;
  chapter: number;
  verse: number;
  verseText?: string;
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof BrainCircuit;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-[64px] flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition active:scale-95',
        active ? 'bg-primary/10 text-primary' : 'text-text-secondary active:bg-surface-tint',
      )}
    >
      <Icon size={19} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

export default function VerseActionBar({
  bookId,
  chapter,
  verse,
  verseText,
}: VerseActionBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  const bookName = book?.name?.fr ?? bookId;
  const reference = `${bookName} ${chapter}:${verse}`;
  const verseKey = `${bookId}:${chapter}:${verse}`;

  const isHighlighted = useHighlightStore((s: HighlightState) => s.keys.includes(verseKey));
  const toggleHighlight = useHighlightStore((s: HighlightState) => s.toggle);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagSaving, setTagSaving] = useState(false);
  const [tagged, setTagged] = useState(false);
  const noteLoadedFor = useRef<string>('');

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
    // The bar re-anchors on verse change; `reference` is derived from the
    // same inputs, so the deps list is intentionally narrow.
  }, [bookId, chapter, verse]);

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
      if (!isHighlighted) toggleHighlight(verseKey);
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

  const toggleHighlightAction = () => {
    toggleHighlight(verseKey);
  };

  return (
    <>
      <div className="sticky bottom-3 z-30 mx-auto w-fit max-w-full rounded-2xl border border-border bg-surface/95 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center gap-1 px-2 py-2">
          <span className="max-w-[96px] truncate px-2 text-xs font-bold text-text-muted">
            {reference}
          </span>
          <ActionButton
            icon={BrainCircuit}
            label={t('settings.verseBar.memorize', 'Mémoriser')}
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
            onClick={() => void openNote()}
          />
          <ActionButton
            icon={Tag}
            label={t('settings.verseBar.tag', 'Taguer')}
            active={tagged || tagOpen}
            onClick={() => setTagOpen((o) => !o)}
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
            icon={Highlighter}
            label={t('settings.verseBar.highlight', 'Surligner')}
            active={isHighlighted}
            onClick={toggleHighlightAction}
          />
        </div>

        {tagOpen && (
          <div className="border-t border-[color:var(--color-divider)] p-3">
            <p className="mb-2 text-xs font-bold text-text-muted">
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
              className="w-full rounded-xl bg-surface-tint p-3 text-sm text-text-primary outline-none"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-text-muted">
                {t('settings.verseBar.tagHint', 'Ajouté immédiatement à votre arbre sémantique')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTagOpen(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-text-muted active:bg-surface-tint"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  onClick={() => void tagVerse()}
                  disabled={tagSaving}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {tagSaving ? t('common.saving', 'Enregistrement…') : t('common.save', 'Enregistrer')}
                </button>
              </div>
            </div>
          </div>
        )}

        {noteOpen && (
          <div className="border-t border-[color:var(--color-divider)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-text-muted">
                {t('bible.noteTitle', 'Note personnelle')} — {reference}
              </p>
              {noteSaved ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Check size={13} /> {t('common.saved', 'Enregistré')}
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
              className="w-full resize-none rounded-xl bg-surface-tint p-3 text-sm text-text-primary outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setNoteOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-semibold text-text-muted active:bg-surface-tint"
              >
                {t('common.cancel', 'Annuler')}
              </button>
              <button
                onClick={() => void saveNote()}
                className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                {t('common.save', 'Enregistrer')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

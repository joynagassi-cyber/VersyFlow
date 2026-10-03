/**
 * VerseActionBar — contextual action bar shown when a verse is selected.
 *
 * Sticky bar with four actions on the selected verse:
 *   Mémoriser · Tag · Note · Comparer
 * The bar emits VERSE_SELECTED so other screens (semantic, AI coach…)
 * can react to the choice.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Check, PenLine, Tag, ArrowLeftRight } from 'lucide-react';
import { BIBLE_BOOKS } from '@/domains/bible/entities';
import { eventBus, DomainEventTypes } from '@/domains/events';
import { getVerseNote, saveVerseNote } from '@/services/verse-note-service';
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
        'flex w-[72px] flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition active:scale-95',
        active ? 'bg-primary/10 text-primary' : 'text-text-secondary active:bg-surface-tint',
      )}
    >
      <Icon size={19} />
      {label}
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

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const noteLoadedFor = useRef<string>('');

  // Announce the selection once the bar appears for this verse.
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
  }, [bookId, chapter, verse]); // eslint-disable-line react-hooks/exhaustive-deps

  const openNote = async () => {
    if (!noteOpen) {
      const key = `${bookId}:${chapter}:${verse}`;
      if (noteLoadedFor.current !== key) {
        setNoteText(await getVerseNote(bookId, chapter, verse));
        noteLoadedFor.current = key;
      }
    }
    setNoteOpen(true);
  };

  const saveNote = async () => {
    await saveVerseNote(bookId, chapter, verse, noteText);
    setNoteSaved(true);
    setTimeout(() => setNoteOpen(false), 350);
  };

  return (
    <>
      {/* Contextual action bar */}
      <div className="sticky bottom-3 z-30 mx-auto w-fit max-w-full rounded-2xl border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-center gap-2 px-2 py-2">
          <span className="max-w-[110px] truncate px-2 text-xs font-bold text-text-muted">
            {reference}
          </span>
          <ActionButton
            icon={BrainCircuit}
            label={t('bible.memorize', 'Mémoriser')}
            onClick={() => {
              const params = new URLSearchParams();
              params.set('reference', reference);
              if (verseText) params.set('text', verseText);
              navigate(`/memorization/workspace?${params.toString()}`);
            }}
          />
          <ActionButton
            icon={Tag}
            label={t('bible.tag', 'Taguer')}
            onClick={() =>
              navigate(
                `/semantic/verse?verseRef=${bookId}:${chapter}:${verse}`,
              )
            }
          />
          <ActionButton
            icon={PenLine}
            label={t('bible.note', 'Note')}
            active={noteOpen || noteSaved}
            onClick={() => void openNote()}
          />
          <ActionButton
            icon={ArrowLeftRight}
            label={t('bible.compare', 'Comparer')}
            onClick={() =>
              navigate(
                `/comparison/translation?bookId=${bookId}&chapter=${chapter}&verse=${verse}`,
              )
            }
          />
        </div>

        {/* Note editor */}
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

/**
 * Notes personnelles (kit `r20_enregistr_notes`).
 *
 * Deux onglets : « Par livre » (regroupement par livre biblique) et
 * « Étiquette » (une note = un verset, triée par étiquette). Les notes sont
 * lues depuis le stockage de l'appareil (`listVerseNotes`), avec le texte du
 * verset quand la traduction active est disponible.
 *
 * Le format actuel ne stocke pas la date de modification : l'écran l'annonce
 * une fois, en haut, plutôt que d'afficher « 5 sem » comme la maquette — une
 * date inventée serait pire qu'une date absente.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Note01Icon as Note,
  BookOpen01Icon as BookOpen,
  Delete02Icon as Trash,
  ArrowRight01Icon as ArrowRight,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard, Segmented } from '@/components/family/FamilyKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { listVerseNotes, saveVerseNote, type VerseNoteEntry } from '@/services/verse-note-service';
import { useBibleBooks } from '@/hooks/useBibleBooks';
import { formatVerseKey } from '@/hooks/useSemanticTags';
import { fireAndForget } from '@/lib/fire-and-forget';

type Tab = 'book' | 'tag';

export default function NotesScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { byId } = useBibleBooks();
  const [notes, setNotes] = useState<VerseNoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('book');

  const load = () => {
    setLoading(true);
    listVerseNotes()
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, VerseNoteEntry[]>();
    for (const note of notes) {
      const label =
        tab === 'book'
          ? (byId.get(note.bookId)?.displayName ?? note.bookId)
          : formatVerseKey(note.verseKey);
      const list = map.get(label) ?? [];
      list.push(note);
      map.set(label, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [notes, byId, tab]);

  const remove = async (note: VerseNoteEntry) => {
    await saveVerseNote(note.bookId, note.chapter, note.verse, '');
    load();
  };

  return (
    <FullScreenPage title={t('notes.title', 'Notes')} subtitle={t('notes.subtitle', 'Enregistré')} backPath="/tabs/home">
      <div className="flex flex-col gap-4">
        <Segmented<Tab>
          label={t('notes.tabLabel', 'Regroupement')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'book', label: t('notes.tabBook', 'Livre') },
            { value: 'tag', label: t('notes.tabVerse', 'Étiquette') },
          ]}
        />

        {loading ? (
          <p className="text-sm text-text-muted">{t('common.loading', 'Chargement...')}</p>
        ) : notes.length === 0 ? (
          <EmptyState
            title={t('notes.empty', 'Aucune note pour l’instant')}
            description={t(
              'notes.emptyDesc',
              'Une note s’ajoute depuis le lecteur de verset : elle reste privée et sur cet appareil.',
            )}
            actionLabel={t('common.navBible', 'Bible')}
            onAction={() => navigate('/bible/explorer')}
          />
        ) : (
          grouped.map(([label, entries]) => (
            <SectionCard key={label} title={label}>
              <ul className="flex flex-col gap-3">
                {entries.map((note) => (
                  <li key={note.verseKey} className="rounded-xl bg-surface-tint p-3">
                    <div className="flex items-center gap-2">
                      <DuoIcon icon={Note} size={14} className="text-primary" />
                      <span className="text-sm font-semibold text-text-primary">
                        {formatVerseKey(note.verseKey)}
                      </span>
                      <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-3xs font-semibold text-text-muted">
                        {t('notes.private', 'Privé')}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">
                      {note.text}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => navigate(`/bible/chapter/${note.bookId}/${note.chapter}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary"
                      >
                        <DuoIcon icon={BookOpen} size={12} />
                        {t('notes.openVerse', 'Ouvrir le chapitre')}
                        <DuoIcon icon={ArrowRight} size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => fireAndForget(remove(note), 'notes:delete')}
                        className="flex items-center gap-1 text-xs font-semibold text-error"
                        aria-label={t('notes.delete', 'Supprimer la note')}
                      >
                        <DuoIcon icon={Trash} size={12} />
                        {t('common.delete', 'Supprimer')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))
        )}

        <HintNote>
          {t(
            'notes.noDates',
            'La date d’ajout n’est pas enregistrée dans le format actuel : elle apparaîtra quand les notes auront leur propre entité. Aucune date n’est affichée en attendant.',
          )}
        </HintNote>

        <Button variant="outline" className="w-full" onClick={() => navigate('/bible/explorer')}>
          <DuoIcon icon={BookOpen} size={16} />
          {t('notes.addFromBible', 'Ajouter une note depuis la Bible')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

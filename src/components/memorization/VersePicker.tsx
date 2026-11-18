/**
 * VersePicker — l'écran qui remplace le cul-de-sac.
 *
 * Constat (reproduit en test) : « Mémoriser » depuis l'accueil, la barre
 * d'onglets mobile, le rail de bureau ou le menu ouvrait
 * `/memorization/session` **sans coordonnées**. L'écran répondait alors
 * « verset non disponible » et s'arrêtait là : la fonctionnalité de
 * mémorisation était inutilisable par son propre bouton.
 *
 * Ce composant propose, dans cet ordre d'utilité :
 *  1. **Reprendre** — le dernier passage ouvert dans la Bible, quand on en a un ;
 *  2. **Passages suggérés** — dix textes courts et connus, présents dans la LSG ;
 *  3. **Référence libre** — « Jean 3:16 », « Psaume 23:1-6 » ;
 *  4. **Parcourir la Bible** — pour choisir en lisant.
 *
 * Accessibilité (playbook) : un seul `h1` (fourni par `FullScreenPage`), des
 * sections en `h2`, des cibles ≥ 44 px, et chaque bouton porte le nom du
 * passage qu'il ouvre.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowRight01Icon as ArrowRight,
  BookOpen01Icon as BookOpen,
  PlayIcon as Play,
  Search01Icon as Search,
} from '@/components/ui/solar-icons';
import { STARTER_PASSAGES, passageQuery, type StarterPassage } from '@/domains/bible/starter-passages';
import { resolveBookIdFromText } from '@/services/memorization-session-service';
import { useBibleStore } from '@/store/bible-store';

interface VersePickerProps {
  /** Traduction active, propagée à la session. */
  translationId?: string;
  /** Dernier passage lu, s'il est connu. */
  resume?: { bookId: string; chapter: number; label: string } | null;
}

/** « Jean 3:16 », « Psaume 23:1-6 », « Genèse 1 » → coordonnées. */
export function parsePassageReference(
  input: string,
): { bookId: string; chapter: number; verseStart: number; verseEnd: number } | null {
  const match = input.trim().match(/^(.+?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?$/i);
  if (!match) return null;
  const bookId = resolveBookIdFromText(match[1]);
  if (!bookId) return null;
  const chapter = Number.parseInt(match[2], 10);
  if (!chapter) return null;
  const verseStart = match[3] ? Number.parseInt(match[3], 10) : 1;
  const verseEnd = match[4] ? Number.parseInt(match[4], 10) : verseStart;
  return { bookId, chapter, verseStart, verseEnd };
}

export function VersePicker({ translationId, resume }: VersePickerProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedBook = useBibleStore((s) => s.selectedBook);
  const selectedChapter = useBibleStore((s) => s.selectedChapter);
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Le dernier passage lu peut venir du store de navigation ou de l'appelant.
  const resumeTarget = useMemo(() => {
    if (resume) return resume;
    if (selectedBook && selectedChapter) {
      return { bookId: selectedBook, chapter: selectedChapter, label: `${selectedBook} ${selectedChapter}` };
    }
    return null;
  }, [resume, selectedBook, selectedChapter]);

  const start = (passage: StarterPassage) => {
    navigate(`/memorization/session?${passageQuery(passage, translationId)}`);
  };

  const startFreeReference = () => {
    const parsed = parsePassageReference(reference);
    if (!parsed) {
      setError(
        t('memorize.referenceInvalid', 'Référence non reconnue. Exemple : Jean 3:16 ou Psaume 23:1-6.'),
      );
      return;
    }
    setError(null);
    const params = new URLSearchParams({
      bookId: parsed.bookId,
      chapter: String(parsed.chapter),
      verseStart: String(parsed.verseStart),
      verseEnd: String(parsed.verseEnd),
    });
    if (translationId) params.set('translationId', translationId);
    navigate(`/memorization/session?${params.toString()}`);
  };

  return (
    <div className="screen-column-narrow flex flex-col gap-6">
      <p className="text-base text-text-muted">
        {t(
          'memorize.intro',
          'Choisissez un passage : la session adapte ensuite le masquage à votre mémoire.',
        )}
      </p>

      {resumeTarget && (
        <section aria-labelledby="memorize-resume">
          <h2 id="memorize-resume" className="mb-2 text-2xl font-bold text-text-primary">
            {t('memorize.resumeTitle', 'Reprendre')}
          </h2>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/memorization/session?bookId=${resumeTarget.bookId}&chapter=${resumeTarget.chapter}&verseStart=1${
                  translationId ? `&translationId=${translationId}` : ''
                }`,
              )
            }
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
              <DuoIcon icon={Play} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-text-primary">
                {t('memorize.resumeAction', 'Continuer la lecture de {{reference}}', {
                  reference: resumeTarget.label,
                })}
              </span>
              <span className="block text-sm text-text-muted">
                {t('memorize.resumeHint', 'Commence au premier verset du chapitre.')}
              </span>
            </span>
            <DuoIcon icon={ArrowRight} size={20} />
          </button>
        </section>
      )}

      <section aria-labelledby="memorize-suggestions">
        <h2 id="memorize-suggestions" className="mb-2 text-2xl font-bold text-text-primary">
          {t('memorize.suggestionsTitle', 'Passages suggérés')}
        </h2>
        <ul className="flex flex-col gap-2">
          {STARTER_PASSAGES.map((passage) => (
            <li key={`${passage.bookId}-${passage.chapter}-${passage.verseStart}`}>
              <button
                type="button"
                onClick={() => start(passage)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left active:bg-surface-tint"
              >
                <span className="text-base font-semibold text-text-primary">
                  {t(passage.labelKey, passage.reference)}
                </span>
                <span className="text-sm tabular-nums text-text-muted">{passage.reference}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="memorize-free">
        <h2 id="memorize-free" className="mb-2 text-2xl font-bold text-text-primary">
          {t('memorize.freeTitle', 'Un autre passage')}
        </h2>
        <label
          id="memorize-reference-label"
          htmlFor="memorize-reference"
          className="mb-1 block text-sm font-medium text-text-muted"
        >
          {t('memorize.referenceLabel', 'Référence')}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="memorize-reference"
            type="text"
            aria-labelledby="memorize-reference-label"
            value={reference}
            inputMode="text"
            autoComplete="off"
            placeholder={t('memorize.referencePlaceholder', 'Jean 3:16')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'memorize-reference-error' : undefined}
            onChange={(event) => setReference(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') startFreeReference();
            }}
            className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-base text-text-primary placeholder:text-text-placeholder focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            onClick={startFreeReference}
            aria-label={t('memorize.startAction', 'Démarrer la session')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary px-4 text-on-primary active:scale-95"
          >
            <DuoIcon icon={Search} size={20} />
          </button>
        </div>
        {error && (
          <p id="memorize-reference-error" role="alert" className="mt-2 text-sm text-error">
            {error}
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate('/bible/explorer')}
        className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-base font-semibold text-text-primary"
      >
        <DuoIcon icon={BookOpen} size={20} />
        {t('memorize.browseBible', 'Parcourir la Bible')}
      </button>
    </div>
  );
}

export default VersePicker;

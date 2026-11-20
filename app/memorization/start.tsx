/**
 * Atelier de mémoire — « Choisir une méthode ».
 *
 * Cet écran existait déjà sous `app/memory/start.tsx`, mais **aucune route ne
 * l'ouvrait avec des données** : `MemoryStartRoute` exigeait un `verseData`
 * passé dans `location.state`, qu'aucun écran ne fournissait, et redirigeait
 * sinon vers `/memorization/session`. Le choix de méthode était donc du code
 * mort, alors que la session accepte un `?strategy=` et que l'atelier
 * (`/memorization/workspace`) expose déjà les quatre modes.
 *
 * Il est désormais dans le dossier de la mémorisation (un seul vocabulaire
 * d'URL) et ses coordonnées viennent de **l'URL**, pas d'un état de routeur :
 * depuis le chapitre, le menu et l'accueil, on peut donc y entrer en profondeur.
 *   1. coordonnées complètes → verset chargé, aperçu réel, choix exécutable ;
 *   2. rien → pas d'aperçu inventé : les méthodes restent expliquées, et le
 *      bouton renvoie à l'explorateur pour choisir un verset.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  PLAYABLE_STRATEGIES,
  type PlayableStrategy,
} from '@/capabilities/memory/use-memory';
import {
  EyeIcon as Eye,
  SparklesIcon as Sparkles,
  BrainIcon as Brain,
  Layers01Icon as Layers,
  PenLineIcon as PenLine,
  Target01Icon as Target,
  ChevronRightIcon as ChevronRight,
  BookOpen01Icon as BookOpen,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { BibleReaderSkeleton } from '@/components/ui/ScreenSkeletons';
import { useBibleData } from '@/hooks/useBibleData';
import type { ExerciseStrategy } from '@/domains/memorization/entities';

/**
 * Les six méthodes, alignées sur `ExerciseStrategy` (le contrat du domaine) et
 * sur les modes de l'atelier de mémorisation.
 */
const STRATEGIES: { id: PlayableStrategy; key: string; detail: string }[] = [
  {
    id: 'progressive-masking',
    key: 'memory.methodProgressive',
    detail: 'memory.methodProgressiveDesc',
  },
  {
    id: 'incremental-reveal',
    key: 'memory.methodIncremental',
    detail: 'memory.methodIncrementalDesc',
  },
  { id: 'active-recall', key: 'memory.methodRecall', detail: 'memory.methodRecallDesc' },
  { id: 'flashcard', key: 'memory.methodCards', detail: 'memory.methodCardsDesc' },
  {
    id: 'recall-writing',
    key: 'memory.methodWriting',
    detail: 'memory.methodWritingDesc',
  },
  { id: 'smart-masking', key: 'memory.methodSmart', detail: 'memory.methodSmartDesc' },
];

/**
 * `ExerciseStrategy` énumère 16 valeurs, dont dix appartiennent à V1 ou au futur
 * (`cloze-deletion`, `typing-mode`, `interleaving`…). Proposer une méthode que
 * rien n'exécute serait une promesse vide : l'atelier ne liste que les six
 * stratégies que la session sait réellement jouer.
 *
 * La liste n'est plus tenue ici : elle vient de `PLAYABLE_STRATEGIES`, la table
 * qui décide aussi quelles actions existent (capacité mémoire). Une méthode
 * affichée sans bras d'exécution, ou l'inverse, ne peut donc plus arriver
 * silencieusement.
 */
const PLAYABLE = new Set<ExerciseStrategy>(PLAYABLE_STRATEGIES);

const ICONS: Partial<Record<ExerciseStrategy, typeof Eye>> = {
  'progressive-masking': Eye,
  'incremental-reveal': Sparkles,
  'active-recall': Brain,
  flashcard: Layers,
  'recall-writing': PenLine,
  'smart-masking': Target,
};

export default function MemorizationStartScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useTranslation();

  const bookId = params.get('bookId') ?? '';
  const chapter = Number(params.get('chapter') ?? 0);
  const verseStart = Number(params.get('verseStart') ?? params.get('verse') ?? 0);
  const verseEnd = Number(params.get('verseEnd') ?? 0) || verseStart;
  const hasCoordinates = Boolean(bookId) && chapter > 0 && verseStart > 0;

  const requested = params.get('strategy') as ExerciseStrategy | null;
  const [selected, setSelected] = useState<ExerciseStrategy>(
    requested && PLAYABLE.has(requested) ? requested : 'progressive-masking',
  );
  const [verseText, setVerseText] = useState<string>('');
  const [loading, setLoading] = useState(hasCoordinates);

  const { getChapter, status } = useBibleData();

  // L'aperçu vient du texte réel de la traduction active. Rien n'est fabriqué :
  // si le chapitre est absent, l'aperçu disparaît et l'écran le dit.
  useEffect(() => {
    let cancelled = false;
    if (!hasCoordinates) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void getChapter(bookId, chapter)
      .then((data) => {
        if (cancelled) return;
        const byNumber = new Map((data?.verses ?? []).map((v) => [v.number, v.text]));
        const words: string[] = [];
        for (let v = verseStart; v <= verseEnd; v += 1) {
          const text = byNumber.get(v);
          if (text) words.push(text.trim());
        }
        setVerseText(words.join(' '));
      })
      .catch(() => {
        if (!cancelled) setVerseText('');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, chapter, verseStart, verseEnd, hasCoordinates, getChapter]);

  const start = () => {
    if (!hasCoordinates) {
      navigate('/bible/explorer');
      return;
    }
    const qs = new URLSearchParams({
      strategy: selected,
      bookId,
      chapter: String(chapter),
      verseStart: String(verseStart),
      verseEnd: String(verseEnd),
    });
    navigate(`/memorization/session?${qs.toString()}`);
  };

  const backPath = hasCoordinates ? `/bible/explorer/${bookId}/${chapter}` : '/tabs/home';

  return (
    <FullScreenPage
      title={t('memory.chooseMethod', 'Choisir une méthode')}
      showBack
      backPath={backPath}
    >
      <div className="screen-column space-y-5">
        {loading && <BibleReaderSkeleton label={t('common.loading', 'Chargement du verset…')} />}

        {!loading && verseText && (
          <div className="g2 p-5">
            <p className="text-sm font-semibold text-primary">
              {bookId} {chapter}:{verseStart}
              {verseEnd !== verseStart ? `-${verseEnd}` : ''}
            </p>
            <p className="mt-2 font-serif text-base leading-relaxed text-text-primary">
              {verseText}
            </p>
          </div>
        )}

        {!loading && !verseText && (
          <div className="g2 flex flex-col gap-3 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <DuoIcon icon={BookOpen} size={20} className="text-primary" />
              {t('memory.noVerseChosen', 'Aucun verset choisi')}
            </p>
            <p className="text-sm text-text-muted">
              {t(
                'memory.noVerseChosenHint',
                status === 'unavailable' || status === 'error'
                  ? 'Le texte de cette traduction n’est pas livré : les méthodes restent disponibles, le passage ne peut pas être affiché.'
                  : 'Choisissez un verset dans la Bible : la méthode s’appliquera à son texte.',
              )}
            </p>
          </div>
        )}

        <div className="space-y-2" role="group" aria-label={t('memory.chooseMethod', 'Choisir une méthode')}>
          {STRATEGIES.map((s) => {
            const active = selected === s.id;
            const Icon = ICONS[s.id] ?? Eye;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                aria-pressed={active}
                className={
                  'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ' +
                  (active
                    ? 'border-primary bg-surface shadow-sm'
                    : 'border-transparent bg-surface shadow-sm')
                }
              >
                <span
                  className={
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ' +
                    (active ? 'bg-primary text-on-primary' : 'bg-surface-tint text-primary')
                  }
                >
                  <DuoIcon icon={Icon} size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="card-title block">{t(s.key, s.id)}</span>
                  <span className="text-sm text-text-muted">{t(s.detail, s.id)}</span>
                </span>
                {active ? <DuoIcon icon={ChevronRight} size={20} className="text-primary" /> : null}
              </button>
            );
          })}
        </div>

        <Button variant="default" className="w-full" onClick={start}>
          {hasCoordinates
            ? t('memory.start', 'Commencer')
            : t('memory.chooseVerse', 'Choisir un verset')}
        </Button>
      </div>
    </FullScreenPage>
  );
}

/**
 * RouteSkeletons — le repli de route, choisi selon l'ÉCRAN, pas selon l'app.
 *
 * Ce qui existait : un seul repli `Suspense` pour les 91 routes paresseuses —
 * `BootSplash`, c'est-à-dire le dessin d'amorçage de l'application (barre de
 * titre, trois cartes génériques, cinq pastilles d'onglets). Ouvrir
 * `/review/queue` ou `/bible/explorer/jean/3` après un rafraîchissement
 * montrait donc la même chose : la forme de l'accueil, pas celle de l'écran
 * demandé. Le contenu sautait à l'arrivée du chunk (CLS), et la seule
 * attente réellement informative — « la file de révision arrive » — n'était
 * jamais annoncée.
 *
 * Ce que fait ce module :
 *
 *  1. `skeletonKindFor(pathname)` classe la route en six familles de forme
 *     (lecteur, session d'exercice, atelier de mémorisation, liste de cartes,
 *     tableau de bord, formulaire) et renvoie le squelette correspondant ;
 *  2. chaque repli porte le **libellé de l'écran** (« Chargement de la file de
 *     révision… ») dans une zone `role="status"`, donc annoncé, au lieu du
 *     texte générique « Chargement de VersyFlow… » ;
 *  3. aucune de ces formes n'est un bloc générique : chacune réutilise la
 *     géométrie réelle de son écran (`ScreenSkeletons`), avec la place
 *     réservée — le contenu ne pousse rien à l'arrivée ;
 *  4. `BootSplash` reste le repli de l'amorçage (stores + i18n) : la question
 *     posée n'est plus « quelle page ? » mais « l'application est-elle
 *     prête ? ». Les deux ne se confondent plus.
 *
 * Le libellé passe par `t()` avec une valeur de repli française : ce repli est
 * monté pendant que le chunk paresseux se charge, donc avant que l'écran réel
 * n'ait choisi sa langue. `i18next` est déjà initialisé à cet instant (la
 * gate de `renderApp` l'attend), la traduction est donc réelle ; le repli sert
 * seulement aux langues qui n'ont pas encore la clé.
 */

import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BibleReaderSkeleton,
  MemorizationSessionSkeleton,
  NotesSkeleton,
  ProgressSkeleton,
  WorkspaceSkeleton,
} from '@/components/ui/ScreenSkeletons';

export type SkeletonKind =
  | 'reader'
  | 'exercise'
  | 'workspace'
  | 'list'
  | 'dashboard'
  | 'form';

/** Routes dont la forme est une page de lecture longue (texte serif). */
const READER_ROUTES = ['/bible/explorer', '/semantic/verse', '/comparison/'];

/** Sessions d'exercice : une carte, quatre notes, aucune navigation. */
const EXERCISE_ROUTES = [
  '/memorization/session',
  '/memorization/flashcard',
  '/memorization/confirm',
  '/memory/',
  '/review/session',
  '/review/summary',
];

/** L'atelier à quatre modes (Révéler / Masquer / Cartes / Écrire). */
const WORKSPACE_ROUTES = ['/memorization/workspace'];

/** Listes d'entités : rangées régulières, filtres en tête. */
const LIST_ROUTES = [
  '/review/queue',
  '/review/History',
  '/review/calendar',
  '/notes',
  '/family/members',
  '/family/leaderboard',
  '/semantic/',
  '/collections',
  '/notifications',
  '/search',
  '/achievements',
  '/mastery',
];

/** Tableaux de bord : tuiles de chiffres puis graphiques. */
const DASHBOARD_ROUTES = ['/tabs/progress', '/tabs/home', '/tabs/explore', '/analytics/'];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

/**
 * La famille de forme d'une route. L'ordre compte : une route d'atelier est
 * aussi une route de mémorisation, donc `workspace` se teste avant
 * `exercise`. Défaut : `form` (titre + champs), la forme la plus fréquente
 * des écrans restants (réglages, profil, famille, onboarding).
 */
export function skeletonKindFor(pathname: string): SkeletonKind {
  if (startsWithAny(pathname, WORKSPACE_ROUTES)) return 'workspace';
  if (startsWithAny(pathname, EXERCISE_ROUTES)) return 'exercise';
  if (startsWithAny(pathname, READER_ROUTES)) return 'reader';
  if (startsWithAny(pathname, LIST_ROUTES)) return 'list';
  if (startsWithAny(pathname, DASHBOARD_ROUTES)) return 'dashboard';
  return 'form';
}

/** Libellé d'attente de chaque famille (repli français, traduit après init). */
const LABELS: Record<SkeletonKind, { key: string; fallback: string }> = {
  reader: { key: 'loading.reader', fallback: 'Chargement du texte…' },
  exercise: { key: 'loading.exercise', fallback: 'Préparation de l’exercice…' },
  workspace: { key: 'loading.workspace', fallback: 'Chargement du verset…' },
  list: { key: 'loading.list', fallback: 'Chargement de la liste…' },
  dashboard: { key: 'loading.dashboard', fallback: 'Chargement des chiffres…' },
  form: { key: 'loading.form', fallback: 'Chargement de l’écran…' },
};

/** Repli formulaire : titre, aide, champs groupés et action primaire. */
function FormSkeleton({ label }: { label: string }) {
  return (
    <div
      className="screen-column-narrow flex flex-col gap-5 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-7 w-2/5 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </header>
        <section className="g2 flex flex-col gap-4 rounded-2xl p-4">
          {[0, 1].map((index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
              {index === 0 && <Skeleton className="h-2.5 w-2/3 rounded-full" />}
            </div>
          ))}
        </section>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-3 w-2/5 self-center rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Un repli d'attente par famille de forme. */
export function RouteSkeleton({ kind, label }: { kind: SkeletonKind; label: string }) {
  switch (kind) {
    case 'reader':
      return <BibleReaderSkeleton label={label} />;
    case 'exercise':
      return <MemorizationSessionSkeleton label={label} />;
    case 'workspace':
      return <WorkspaceSkeleton label={label} />;
    case 'list':
      return <NotesSkeleton label={label} />;
    case 'dashboard':
      return <ProgressSkeleton label={label} />;
    default:
      return <FormSkeleton label={label} />;
  }
}

/**
 * Le repli réellement monté par `<Suspense>` : il lit l'URL courante et
 * choisit la forme. Il est monté à l'intérieur du routeur, donc `useLocation`
 * y fonctionne.
 */
export function RouteFallback() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const kind = skeletonKindFor(pathname);
  const { key, fallback } = LABELS[kind];
  return <RouteSkeleton kind={kind} label={t(key, fallback)} />;
}

export default RouteFallback;

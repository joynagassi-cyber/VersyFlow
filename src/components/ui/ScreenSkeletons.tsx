/**
 * Squelettes d'écran — la forme du contenu, pas un bloc générique.
 *
 * Un squelette utile ne dit pas « quelque chose arrive » : il dit **où** et
 * **quoi**. Il doit occuper la même boîte que le contenu qu'il remplace —
 * mêmes conteneurs, mêmes paddings, mêmes rayons, même nombre de lignes
 * visibles — sinon le contenu « saute » à l'arrivée et l'attente paraît plus
 * longue qu'elle ne l'est.
 *
 * D'où ce fichier : un squelette par écran, composé de primitives qui
 * reprennent le vocabulaire réel de l'interface (`g2`, `section-label`,
 * `border-radius`, hauteurs de ligne). Le matériau reste unique — `.skeleton`
 * dans `globals.css` — pour que le balayage soit le même partout.
 *
 * Règles tenues ici :
 *  - aucune taille de police littérale (les tests de finition l'interdisent) ;
 *  - aucun `animate-pulse` : le balayage vient de `.skeleton`, coupé en
 *    `prefers-reduced-motion` ;
 *  - tout le décoratif est `aria-hidden`, l'annonce est un texte réel.
 */
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

/** Cadre commun : annonce « en cours de chargement », décor masqué. */
export function SkeletonPage({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(className)} role="status" aria-live="polite" aria-busy="true">
      {label ? <span className="sr-only">{label}</span> : null}
      <div aria-hidden="true" className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

/** Une ligne de texte factice. */
function Line({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3 rounded-full', className)} />;
}

/** Ligne de liste réelle : `g2` + avatar + deux lignes + chevron. */
function Row({
  lines = 2,
  avatar = true,
  trailing = true,
  className,
}: {
  lines?: 1 | 2;
  avatar?: boolean;
  trailing?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('g2 flex items-center gap-3 p-4', className)}>
      {avatar && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Line className="w-2/5" />
        {lines === 2 && <Line className="h-2.5 w-3/5" />}
      </div>
      {trailing && <Skeleton className="h-4 w-4 shrink-0 rounded-full" />}
    </div>
  );
}

/** Trois tuiles de statistique : la boîte exacte de `StatTile`. */
function StatTiles({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

/** Carte de section : titre en micro-capitale puis contenu. */
function SectionCardSkeleton({
  rows = 3,
  title = true,
  className,
}: {
  rows?: number;
  title?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('g2 p-4', className)}>
      {title && <Skeleton className="mb-3 h-2.5 w-24 rounded-full" />}
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, index) => (
          <Line key={index} className={index % 3 === 2 ? 'w-3/5' : 'w-full'} />
        ))}
      </div>
    </div>
  );
}

/** Rangée de pastilles (filtres, tags, mots). */
function Chips({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-7 w-20 rounded-full" />
      ))}
    </div>
  );
}

/** En-tête d'entité : pastille 44 px, titre, sous-titre. */
function EntityHead() {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Line className="h-5 w-1/2" />
        <Line className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}

/* ── Mémoire sémantique ──────────────────────────────────────────────── */

/** Index : trois rubriques (mes concepts, à découvrir, communautés). */
export function SemanticIndexSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} className="space-y-6">
      {[3, 3, 2].map((rows, section) => (
        <section key={section} className="mb-6">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Line className="h-4 w-32" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: rows }, (_, index) => (
              <Row key={index} />
            ))}
          </div>
        </section>
      ))}
    </SkeletonPage>
  );
}

/** Mes tags : une liste de cartes-lignes. */
export function SemanticTagsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Row key={index} lines={2} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Arbre : tuiles de synthèse, relations, versets du tag. */
export function SemanticTreeSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <SectionCardSkeleton rows={4} />
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-28 rounded-full" />
        <Chips count={6} />
      </div>
    </SkeletonPage>
  );
}

/** Nœud : mêmes tuiles, provenance, sous-branches, versets. */
export function SemanticNodeSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <SectionCardSkeleton rows={3} />
      <SectionCardSkeleton rows={4} />
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-20 rounded-full" />
        <Chips count={5} />
      </div>
    </SkeletonPage>
  );
}

/** Fiche concept : en-tête, libellés par langue, versets liés. */
export function SemanticConceptSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <EntityHead />
      <div>
        <Skeleton className="mb-2 h-2.5 w-24 rounded-full" />
        <Chips count={4} />
      </div>
      <div className="mt-5">
        <Skeleton className="mb-2 h-2.5 w-28 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Row key={index} lines={2} />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Fiche communauté : même géométrie, deux sections. */
export function SemanticCommunitySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <EntityHead />
      <Line className="mb-5 w-full" />
      <div>
        <Skeleton className="mb-2 h-2.5 w-32 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Row key={index} lines={2} />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <Skeleton className="mb-2 h-2.5 w-24 rounded-full" />
        <Chips count={3} />
      </div>
    </SkeletonPage>
  );
}

/** Suggestions : filtre segmenté puis propositions. */
export function SemanticSuggestionsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <Skeleton className="h-10 w-48 rounded-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Row key={index} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Révision d'une branche : trois mesures puis les versets, séparés. */
export function SemanticReviewSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-32 rounded-full" />
        <div className="flex flex-col divide-y divide-divider">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Line className={index % 2 === 0 ? 'w-1/2' : 'w-2/5'} />
              <Skeleton className="ml-auto h-4 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Fiche verset : carte de synthèse puis concepts et versets liés. */
export function SemanticVerseSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 mb-1 p-4">
        <Line className="mb-3 h-4 w-24" />
        <Line className="mb-2 w-full" />
        <Line className="w-4/5" />
      </div>
      <div className="mt-4">
        <Skeleton className="mb-2 h-2.5 w-24 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Row key={index} lines={2} />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <Skeleton className="mb-2 h-2.5 w-28 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Row key={index} lines={2} />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/* ── Famille ─────────────────────────────────────────────────────────── */

/** Classement : filtre de période puis lignes de membres classés. */
export function FamilyLeaderboardSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <Skeleton className="h-10 w-56 rounded-full" />
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-28 rounded-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Line className="w-2/5" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <Skeleton className="h-5 w-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Membres : une carte de section, une ligne par personne. */
export function FamilyMembersSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-24 rounded-full" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Line className="w-1/3" />
                <Line className="h-2.5 w-1/4" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Choix du profil : un titre puis des lignes de profil. */
export function FamilySelectProfileSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <Line className="h-4 w-40" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Row key={index} lines={2} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/* ── Révision ────────────────────────────────────────────────────────── */

/** File du jour : pastilles de synthèse, deux sections, bouton fixe. */
export function ReviewQueueSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-28 rounded-full" />
        ))}
      </div>
      {[4, 3].map((rows, section) => (
        <section key={section}>
          <div className="mb-2 mt-2 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Line className="h-3.5 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: rows }, (_, index) => (
              <Row key={index} />
            ))}
          </div>
        </section>
      ))}
      {/* La commande réelle est collée en bas de l'écran : le squelette aussi,
          sinon le bouton « saute » du flux vers le bas à l'arrivée. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
      <div className="h-24" />
    </SkeletonPage>
  );
}

/** Session de révision : barre de progression, carte, mots masqués. */
export function ReviewSessionSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Line className="mx-auto mt-2 h-2.5 w-12" />
      </div>
      <div className="g2 p-6">
        <Skeleton className="mb-4 h-7 w-28 rounded-full" />
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="mt-6 h-12 w-full rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/** Résumé de session : série, quatre mesures, rétention. */
export function ReviewSummarySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g1 flex flex-col items-center p-6">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="mt-3 h-12 w-24 rounded-xl" />
        <Line className="mt-2 h-2.5 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="g2 flex flex-col items-center p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-2 h-7 w-14 rounded-lg" />
            <Line className="mt-2 h-2.5 w-20" />
          </div>
        ))}
      </div>
      <div className="g2 p-4">
        <Skeleton className="mb-3 h-2.5 w-32 rounded-full" />
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/** Historique : carte de synthèse puis la chronologie. */
export function HistorySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} className="space-y-5">
      <div className="rounded-3xl bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <Line className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Row key={index} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/* ── Mémorisation ────────────────────────────────────────────────────── */

/** Session de mémorisation : la carte de verset, ses commandes. */
export function MemorizationSessionSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-5">
        <Skeleton className="mb-4 h-6 w-24 rounded-full" />
        <Line className="mb-2 w-full" />
        <Line className="mb-2 w-11/12" />
        <Line className="mb-2 w-4/5" />
        <Line className="w-2/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-12 flex-1 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/** Atelier de mémorisation : le texte en continu, en rythme de lecture. */
export function WorkspaceSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-6">
        {['w-full', 'w-11/12', 'w-full', 'w-10/12', 'w-3/4'].map((width, index) => (
          <Skeleton key={index} className={cn('mb-3 h-4 rounded-lg', width)} />
        ))}
      </div>
      {/* Le sélecteur de mode flotte, replié : quatre pastilles, pas du texte. */}
      <div className="flex justify-end gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-9 rounded-full" />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Flashcards : la carte de 380 px, avant sa face. */
export function FlashcardSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} className="flex flex-col items-center">
      <Skeleton className="h-96 w-full max-w-xl rounded-3xl" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-12 w-28 rounded-full" />
        <Skeleton className="h-12 w-28 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/* ── Notes, Bible, analytique ────────────────────────────────────────── */

/** Notes : filtre segmenté puis des groupes de cartes. */
export function NotesSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <Skeleton className="h-10 w-48 rounded-full" />
      {[3, 3].map((rows, group) => (
        <div key={group}>
          <Skeleton className="mb-2 h-3 w-24 rounded-full" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </SkeletonPage>
  );
}

/**
 * Lecteur biblique : des versets, pas des lignes de formulaire. Chaque verset
 * reprend la gouttière du numéro et la justification du texte en continu.
 */
function ReaderCard() {
  const verses = [
    ['w-full', 'w-11/12'],
    ['w-full', 'w-full', 'w-3/4'],
    ['w-11/12', 'w-2/3'],
    ['w-full', 'w-10/12'],
    ['w-full', 'w-11/12', 'w-1/2'],
  ];
  return (
    <div className="rounded-3xl bg-surface p-5 shadow-sm">
      {verses.map((lines, index) => (
        <div key={index} className="mb-4 flex gap-2">
          <Skeleton className="mt-1 h-3 w-4 shrink-0 rounded-sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {lines.map((width, line) => (
              <Skeleton key={line} className={cn('h-3.5 rounded-md', width)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BibleReaderSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <ReaderCard />
    </SkeletonPage>
  );
}

/** Explorateur : grille de livres, puis le lecteur. */
export function ExplorerSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
      <ReaderCard />
    </SkeletonPage>
  );
}

/** Analytique : deux mesures, une courbe, un classement, un total. */
export function AnalyticsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass col-span-2 flex items-center gap-4 rounded-3xl p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Line className="h-2.5 w-28" />
          </div>
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="glass rounded-3xl p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
              <Line className="w-1/3" />
            </div>
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-3xl" />
    </SkeletonPage>
  );
}

/** Progression : quatre mesures, deux cartes de détail, puis la synthèse. */
export function ProgressSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="progress-stat-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="g2 progress-stat" key={index}>
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>
      <div className="progress-detail-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="g2 progress-card" key={index}>
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
          </div>
        ))}
      </div>
      <div className="stats-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="stat-card h-32 rounded-2xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Une traduction en cours de chargement : deux lignes de texte biblique. */
export function TranslationTextSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-3/4 rounded-md" />
      </div>
    </div>
  );
}

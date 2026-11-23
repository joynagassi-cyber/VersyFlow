/**
 * Squelettes d'écran — la boîte exacte de ce qu'ils remplacent.
 *
 * Un squelette utile ne dit pas « quelque chose arrive » : il dit **où** et
 * **quoi**. Il doit occuper la même boîte que le contenu qu'il remplace —
 * mêmes conteneurs, mêmes surfaces (`g2`, `.mem-card`, `.reading-card`),
 * mêmes rayons, même nombre de rangées, mêmes conteneurs internes — sinon le
 * contenu « saute » à l'arrivée et l'attente paraît plus longue qu'elle ne
 * l'est.
 *
 * Règles tenues ici :
 *  - aucune taille de police littérale (les tests de finition l'interdisent) ;
 *  - aucun `animate-pulse` : le balayage vient de `.skeleton`, coupé en
 *    `prefers-reduced-motion` ;
 *  - tout le décoratif est `aria-hidden`, l'annonce est un texte réel ;
 *  - un squelette ne redessine QUE la zone que le chargement remplace :
 *    jamais un contrôle déjà monté et visible au-dessus de lui (le segmenté
 *    des Suggestions, celui des Notes, celui du classement famille, le
 *    sélecteur de mode de l'atelier), jamais un bloc qui ferait double
 *    emploi avec un squelette que le composant chargé porte déjà
 *    (`StatsDashboard` dessine lui-même ses six cartes et ses neuf cadres) ;
 *  - quand le contenu réel varie selon une option d'apparition, le squelette
 *    suit l'option, pas un cas moyen : le lecteur biblique dessine des
 *    pavés numérotés si `bibleVerseLayout === 'blocks'`, un flot continu si
 *    `'flow'` (défaut réel du store).
 */
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

/** Cadre commun : annonce « en cours de chargement », décor masqué. */
export function SkeletonPage({
  label,
  children,
  className,
  innerClassName,
  gap = 'gap-4',
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** Rythme vertical du flux (la marge réelle entre blocs de l'écran chargé). */
  gap?: string;
}) {
  return (
    <div className={cn(className)} role="status" aria-live="polite" aria-busy="true">
      {label ? <span className="sr-only">{label}</span> : null}
      <div aria-hidden="true" className={cn('flex flex-col', gap, innerClassName)}>
        {children}
      </div>
    </div>
  );
}

/** Une ligne de texte factice. */
function Line({ className }: { className?: string }) {
  return <Skeleton className={cn('h-3 rounded-full', className)} />;
}

/** Chevron de navigation : la boîte du picto (16–18 px), pas une pastille. */
function Chevron({ className }: { className?: string }) {
  return <Skeleton className={cn('h-4 w-4 shrink-0 rounded-md', className)} />;
}

/** Micro-capitale de section (`section-label`, 11 px). */
function SectionLabel({ className }: { className?: string }) {
  return <Skeleton className={cn('h-2.5 w-24 rounded-full', className)} />;
}

/**
 * Ligne « entité » réelle p-3/p-4 : titre, sous-titre, chevron droit — la
 * fiche concept, la fiche communauté, les versets liés, l'index sémantique.
 * Aucun avatar : ces listes n'en portent pas.
 */
function EntityRow({
  pad = 'p-4',
  caption = true,
}: {
  pad?: 'p-3' | 'p-4';
  caption?: boolean;
}) {
  return (
    <div className={cn('g2 flex items-center justify-between gap-3', pad)}>
      <div className="min-w-0 flex-1">
        <Line className="h-4 w-2/5" />
        {caption && <Line className="mt-1.5 h-2.5 w-3/5" />}
      </div>
      <Chevron />
    </div>
  );
}

/**
 * Ligne de tag réel : `SectionCard p-0` contenant le bouton `p-4` — pastille
 * d'icône 40 px, libellé, compteur de versets, chevron.
 */
function TagRow() {
  return (
    <div className="g2 p-0">
      <div className="flex w-full items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Line className="h-4 w-2/5" />
          <Line className="mt-1.5 h-2.5 w-3/5" />
        </div>
        <Chevron />
      </div>
    </div>
  );
}

/** Section avec icône 14 px + titre `text-sm semibold` (`h2` des fiches). */
function SectionHeading({ title = 'w-28' }: { title?: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <Skeleton className="h-3.5 w-3.5 rounded-sm" />
      <Skeleton className={cn('h-4 rounded-full', title)} />
    </div>
  );
}

/** En-tête de section de l'index / file de révision : icône 18 px + titre `text-lg`. */
function HeadingLg({ title = 'w-36' }: { title?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 px-1">
      <Skeleton className="h-4 w-4 rounded-md" />
      <Skeleton className={cn('h-5 rounded-full', title)} />
    </div>
  );
}

/** Tuile de statistique du kit famille (`StatTile`) : valeur 3xl + libellé. */
function StatTileS() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-tint p-3">
      <Skeleton className="h-9 w-12 rounded-lg" />
      <Skeleton className="h-2.5 w-14 rounded-full" />
    </div>
  );
}

/** Trois tuiles de synthèse : la boîte exacte de la grille réelle. */
function StatTiles({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }, (_, index) => (
        <StatTileS key={index} />
      ))}
    </div>
  );
}

/** Carte de section du kit (`SectionCard`) : `g2 p-4` + micro-capitale. */
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
      {title && <SectionLabel className="mb-3 w-28" />}
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

/** En-tête d'entité : pastille 44 px, titre `page-title`, sous-titre. */
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
    <SkeletonPage label={label} gap="gap-6">
      {[3, 3, 2].map((rows, section) => (
        <section key={section}>
          <HeadingLg title={section === 0 ? 'w-32' : section === 1 ? 'w-24' : 'w-28'} />
          <div className="flex flex-col gap-2">
            {Array.from({ length: rows }, (_, index) => (
              <EntityRow key={index} pad="p-4" />
            ))}
          </div>
        </section>
      ))}
    </SkeletonPage>
  );
}

/** Mes tags : `SectionCard p-0` par tag, icône 40 px. */
export function SemanticTagsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <TagRow key={index} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/**
 * Relation d'arbre : la racine (`rounded-xl bg-surface-tint`) puis les
 * branches indentées (`rounded-xl border`), avec la confiance en micro-type.
 */
function TreeRelations() {
  return (
    <div className="g2 p-4">
      <SectionLabel className="mb-3 w-24" />
      <ul className="flex flex-col gap-2">
        <li className="flex h-9 items-center gap-2 rounded-xl bg-surface-tint px-3">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Line className="h-3.5 w-24" />
          <Skeleton className="ms-auto h-2.5 w-14 rounded-full" />
        </li>
        {['w-2/5', 'w-1/3', 'w-1/2', 'w-2/5'].map((width, index) => (
          <li
            key={index}
            className="ms-4 flex items-center gap-2 rounded-xl border border-border px-3 py-2"
          >
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1">
              <Line className={cn('h-3', width)} />
              <Line className="mt-1 h-2 w-1/3" />
            </div>
            <Skeleton className="h-4 w-14 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Arbre : tuiles de synthèse, relations, versets du tag, pied de page. */
export function SemanticTreeSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <TreeRelations />
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-32" />
        <Chips count={6} />
      </div>
      {/* Le pied de page (note + deux commandes) appartient à la zone chargée. */}
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 flex-1 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/** Nœud : tuiles, provenance, sous-branches, versets, commandes. */
export function SemanticNodeSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-32" />
        <div className="flex flex-col gap-2">
          {['w-40', 'w-32'].map((width, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
              <Line className={cn('h-3.5', width)} />
              <Skeleton className="ms-auto h-3 w-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-28" />
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-2 rounded-lg px-2 py-2">
              <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-sm" />
              <Line className={index % 2 === 0 ? 'w-1/3' : 'w-2/5'} />
              <Skeleton className="ms-auto h-2.5 w-14 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-32" />
        <Chips count={6} />
      </div>
      {/* Deux commandes pleine largeur sous la zone chargée. */}
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 flex-1 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/** Fiche concept : en-tête, libellés par langue, versets, communautés, liens. */
export function SemanticConceptSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} gap="gap-5">
      <EntityHead />
      <section>
        <Skeleton className="mb-2 h-4 w-24 rounded-full" />
        <Chips count={4} />
      </section>
      <section>
        <SectionHeading title="w-24" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <EntityRow key={index} pad="p-3" />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="w-24" />
        <EntityRow pad="p-3" />
      </section>
      <section>
        <SectionHeading title="w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }, (_, index) => (
            <EntityRow key={index} pad="p-3" />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}

/** Fiche communauté : en-tête, description, concepts, versets témoins. */
export function SemanticCommunitySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} gap="gap-5">
      <EntityHead />
      <div className="-mt-2 flex flex-col gap-1.5">
        <Line className="h-3 w-full" />
        <Line className="h-3 w-4/5" />
      </div>
      <section>
        <SectionHeading title="w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <EntityRow key={index} pad="p-3" />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="w-24" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <EntityRow key={index} pad="p-3" caption={false} />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}

/**
 * Suggestions : le filtre segmenté est TOUJOURS visible au-dessus de la zone
 * chargée — le squelette commence à la liste de propositions.
 */
export function SemanticSuggestionsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <TagRow key={index} />
        ))}
      </div>
    </SkeletonPage>
  );
}

/** Révision d'une branche : trois mesures, les versets séparés, la commande. */
export function SemanticReviewSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <StatTiles />
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-32" />
        <div className="flex flex-col divide-y divide-divider">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Skeleton className="h-4 w-20 shrink-0 rounded-sm" />
              <Skeleton className="ms-auto h-3.5 w-8 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      {/* « Lancer la session » appartient à la zone chargée. */}
      <Skeleton className="h-11 w-full rounded-full" />
    </SkeletonPage>
  );
}

/** Fiche verset : la carte du verset, concepts, références croisées, communauté. */
export function SemanticVerseSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} gap="gap-5">
      <div className="g2 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Line className="h-4 w-32" />
        </div>
        <Line className="mb-2 h-4 w-full" />
        <Line className="mb-2 h-4 w-11/12" />
        <Line className="h-4 w-2/3" />
      </div>
      <section>
        <SectionHeading title="w-40" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }, (_, index) => (
            <EntityRow key={index} pad="p-3" />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="w-44" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <EntityRow key={index} pad="p-3" />
          ))}
        </div>
      </section>
      <section>
        <SectionHeading title="w-24" />
        <EntityRow pad="p-3" />
      </section>
    </SkeletonPage>
  );
}

/* ── Famille ─────────────────────────────────────────────────────────── */

/**
 * Classement : le `Segmented` est TOUJOURS visible au-dessus de la zone
 * chargée — le squelette est la carte « Rang et points » et ses lignes.
 */
export function FamilyLeaderboardSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionLabel className="w-24" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="flex items-center gap-3">
              {/* RankBadge h-7 w-7 puis avatar 36 px */}
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Line className="w-2/5" />
                <Line className="mt-1 h-2.5 w-1/3" />
                {/* ProgressBar réelle : track h-2, remplissage accent */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tint">
                  <Skeleton className="h-full rounded-full" />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-2 w-5 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}

/** Membres : lignes `MemberRow` à avatar 40 px, puce de rôle en fin de ligne. */
export function FamilyMembersSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-24" />
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="flex min-h-[52px] items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Line className="h-3.5 w-1/3" />
                <Line className="mt-1 h-2.5 w-1/4" />
              </div>
              {/* Puce « Propriétaire / Admin » : petite, pilule teinte. */}
              <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}

/**
 * Choix du profil : les profils LOCAUX sont toujours montés (store, pas de
 * requête) ; le squelette tient la place de la carte « Autres membres de la
 * famille », qui seule attend le réseau.
 */
export function FamilySelectProfileSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-48" />
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-border p-3"
            >
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Line className="h-3.5 w-1/3" />
                <Line className="mt-1.5 h-2.5 w-2/5" />
              </div>
              {/* Puce « Lecture seule » avec son icône. */}
              <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}

/**
 * Fiche d'un membre : la carte en-tête (avatar 56 px), les deux grilles de
 * tuiles et la liste des défis en commun.
 */
export function FamilyMemberSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g2 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Line className="h-4 w-32" />
            <Line className="mt-1.5 h-2.5 w-24" />
          </div>
        </div>
        <div className="mt-4">
          <StatTiles />
        </div>
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-36" />
        <div className="flex flex-col divide-y divide-divider">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <Line className="h-3.5 w-40" />
                <Skeleton className="h-3.5 w-16 shrink-0 rounded-full" />
              </div>
              {/* ProgressBar réelle h-2 */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-tint">
                <Skeleton className="h-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="g2 p-4">
        <SectionLabel className="mb-3 w-28" />
        <StatTiles />
        <Skeleton className="mt-3 h-10 w-full rounded-xl" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-11 flex-1 rounded-full" />
        ))}
      </div>
    </SkeletonPage>
  );
}

/* ── Révision ────────────────────────────────────────────────────────── */

/** Rangée de la file du jour : accent latéral, référence, pastille de statut. */
function QueueRow() {
  return (
    <div className="g2 relative overflow-hidden p-4 ps-6">
      <Skeleton className="absolute bottom-0 start-0 top-0 w-1 rounded-none" />
      <div className="flex items-center justify-between gap-2">
        <Line className="h-4 w-2/5" />
        <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
      </div>
      <Line className="mt-2 h-3 w-full" />
      <Line className="mt-1.5 h-3 w-4/5" />
      <Line className="mt-2 h-2.5 w-20" />
    </div>
  );
}

/**
 * File du jour : pastilles de synthèse (toujours centrées), deux sections
 * avec compteur, CTA fixe en bas — celui que l'écran chargé épingle aussi.
 */
export function ReviewQueueSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="mb-1 flex flex-wrap items-center justify-center gap-2">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {[4, 3].map((rows, section) => (
        <section key={section} className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Line className="h-4 w-20" />
            <Skeleton className="ms-auto h-6 w-7 rounded-full" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, index) => (
              <QueueRow key={index} />
            ))}
          </div>
        </section>
      ))}
      {/* La commande réelle est collée en bas de l'écran : le squelette aussi,
          sinon le bouton « saute » du flux vers le bas à l'arrivée. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 p-4 backdrop-blur">
        <Skeleton className="h-11 w-full rounded-full" />
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
        <Skeleton className="mb-6 h-7 w-28 rounded-full" />
        <div className="flex flex-wrap justify-center gap-2 py-4">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        {/* « Tape pour révéler le verset » + compte à rebours auto */}
        <Skeleton className="mx-auto h-4 w-44 rounded-full" />
        <Line className="mx-auto mt-2 h-2.5 w-28" />
      </div>
    </SkeletonPage>
  );
}

/** Résumé de session : série (bloc héros), quatre mesures, rétention, commandes. */
export function ReviewSummarySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="g1 mb-5 flex flex-col items-center p-6">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3.5 w-3.5 rounded-sm" />
          <Line className="h-3 w-28" />
        </div>
        <Skeleton className="mt-2 h-14 w-20 rounded-lg" />
        <Line className="mt-2 h-3 w-36" />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="g2 flex flex-col items-center p-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="mt-2 h-7 w-14 rounded-lg" />
            <Line className="mt-2 h-2.5 w-20" />
          </div>
        ))}
      </div>
      <div className="g2 mb-5 p-4">
        <Skeleton className="h-5 w-40 rounded-full" />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton className="h-2.5 flex-1 rounded-full" />
          <Skeleton className="h-6 w-10 rounded-md" />
        </div>
        <Line className="mx-auto mt-2 h-3 w-40" />
      </div>
      {/* Les deux commandes appartiennent à la zone chargée. */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-full" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/**
 * Historique : la synthèse par DÉFAUT (grille de trois mesures — la variante
 * « verset filtré » n'apparaît que sur filtre), la rangée de filtres, et la
 * chronologie groupée par jour. `StatsDashboard` porte son propre squelette.
 */
export function HistorySkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} gap="gap-5">
      <div className="rounded-3xl bg-surface p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-3 text-center">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Line className="h-2.5 w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Filtre « Tous les versets » + une puce par verset mémorisé */}
      <div className="flex flex-wrap gap-2">
        {['w-32', 'w-24', 'w-24', 'w-24'].map((width, index) => (
          <Skeleton key={index} className={cn('h-7 rounded-full', width)} />
        ))}
      </div>
      <section className="space-y-2.5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <div className="relative space-y-3 border-s-2 border-border/70 ps-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="relative rounded-2xl bg-surface p-4 shadow-sm">
              <Skeleton className="absolute -start-[21px] top-5 h-2.5 w-2.5 rounded-full" />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Line className="h-3.5 w-28" />
                  <Line className="mt-1 h-2.5 w-10" />
                </div>
                <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
              </div>
              <Line className="mt-2 h-3 w-full" />
              <Line className="mt-1.5 h-3 w-4/5" />
              <div className="mt-3 flex items-center gap-4 border-t border-border/50 pt-2.5">
                <Line className="h-2.5 w-44" />
                <Line className="h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 flex-1 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/* ── Mémorisation ────────────────────────────────────────────────────── */

/** Session de mémorisation : référence centrée, carte de verset, cotations. */
export function MemorizationSessionSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="mb-1 flex flex-col items-center gap-1.5">
        <Line className="h-2.5 w-32" />
        <Skeleton className="h-6 w-44 rounded-md" />
        <Line className="h-3 w-28" />
      </div>
      <div className="g2 p-5">
        <div className="flex flex-col gap-2">
          <Line className="h-4 w-full" />
          <Line className="h-4 w-11/12" />
          <Line className="h-4 w-4/5" />
          <Line className="h-4 w-2/3" />
        </div>
        {/* « Appuyez pour révéler » */}
        <Line className="mt-3 h-3 w-32" />
      </div>
      {/* Les quatre cotations FSRS : grille 4 colonnes, tuiles `rounded-xl`. */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-11 rounded-xl" />
        ))}
      </div>
      {/* Précédent / Continuer */}
      <div className="mt-2 flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 flex-1 rounded-full" />
      </div>
      {/* Progression du passage */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-tint">
        <Skeleton className="h-full w-2/3 rounded-full" />
      </div>
    </SkeletonPage>
  );
}

/**
 * Atelier de mémorisation : la carte `.mem-card` du mode « Révéler » —
 * boîte de référence, pastilles de progression, blocs masqués, commandes.
 * Le sélecteur de mode flotte et est TOUJOURS monté : il n'est pas redessiné.
 */
export function WorkspaceSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="mem-card">
        <div className="mb-4 flex items-center justify-between gap-3">
          {/* `.mem-case` : la référence en pastille de 12 px */}
          <Skeleton className="h-7 w-28 rounded-[10px]" />
          {/* « Bloc X / Y » en micro-capitale */}
          <Skeleton className="h-2.5 w-16 rounded-full" />
        </div>
        {/* Pastilles de progression : fait (w-4) / courant (w-6) / verrouillé (w-1.5) */}
        <div className="mb-4 flex items-center gap-1.5">
          <Skeleton className="h-1.5 w-4 rounded-full" />
          <Skeleton className="h-1.5 w-4 rounded-full" />
          <Skeleton className="h-1.5 w-6 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
          <Skeleton className="h-1.5 w-1.5 rounded-full" />
        </div>
        {/* Blocs de texte, masqués sur 14 px de rayon comme les vrais */}
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-14 rounded-[14px]" />
          ))}
        </div>
        {/* Précédent (fantomatique) / Révéler le bloc (pleine largeur) */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </SkeletonPage>
  );
}

/**
 * Flashcards : la pile réelle — barre de progression, deux lames `g1` derrière
 * la carte active (simples surfaces, rien à charger), carte `g3` avec pilule
 * de statut et référence, gestes en pied, deux commandes `rounded-2xl`.
 */
export function FlashcardSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label} className="min-h-full" innerClassName="min-h-full">
      <div className="px-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tint">
          <Skeleton className="h-full w-1/3 rounded-full" />
        </div>
      </div>

      {/* Pile de cartes : mêmes 380 px et même largeur max que l'écran chargé */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 py-6">
        <div
          aria-hidden="true"
          className="g1 absolute h-[380px] w-[min(92vw,520px)] scale-[0.92]"
        />
        <div
          aria-hidden="true"
          className="g1 absolute h-[380px] w-[min(92vw,520px)] scale-[0.96]"
        />
        <div className="g3 relative flex h-[380px] w-[min(92vw,520px)] flex-col justify-between p-6">
          {/* Pilule « À mémoriser / Maîtrisé » */}
          <Skeleton className="h-7 w-28 rounded-full" />
          <div>
            <Skeleton className="h-8 w-36 rounded-md" />
            <Line className="mt-2 h-3 w-44" />
            <div className="mt-3 flex flex-col gap-2.5">
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-4/5 rounded-md" />
            </div>
          </div>
          {/* « Touchez pour voir la suite » */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-sm" />
            <Line className="h-3 w-44" />
          </div>
        </div>
      </div>

      {/* Rappel des deux gestes de glissement */}
      <div className="flex justify-around gap-3 px-4 py-3">
        <Line className="h-3 w-36" />
        <Line className="h-3 w-36" />
      </div>

      {/* « À revoir » (contour erreur) / « Maîtrisé » (plein succès) */}
      <div className="flex gap-3 px-4 pb-8">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 flex-1 rounded-2xl" />
      </div>
    </SkeletonPage>
  );
}

/* ── Notes, Bible, analytique ────────────────────────────────────────── */

/**
 * Notes : le filtre segmenté est TOUJOURS visible au-dessus — le squelette
 * couvre les groupes par livre/étiquette. Chaque carte est une vraie
 * `rounded-xl bg-surface-tint p-3` (icône, référence, pilule « Privé »,
 * texte, pied), pas un pavé uniforme.
 */
export function NotesSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      {[3, 3].map((rows, group) => (
        <div key={group}>
          <SectionLabel className="mb-2 w-28" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: rows }, (_, index) => (
              <div key={index} className="rounded-xl bg-surface-tint p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-sm" />
                  <Line className="h-4 w-24" />
                  <Skeleton className="ms-auto h-4 w-10 rounded-full" />
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  <Line className="h-3 w-full" />
                  <Line className="h-3 w-4/5" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Line className="h-3 w-28" />
                  <Line className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonPage>
  );
}

/**
 * Tête de chapitre réelle (`reading-chapter-heading`) : ligne de métadonnées,
 * grand titre serif du livre, compteur de versets.
 */
function ChapterHeadingSkeleton() {
  return (
    <div className="border-b border-border pb-4">
      <Skeleton className="h-3 w-16 rounded-full" />
      <Skeleton className="mt-3 h-9 w-44 rounded-md" />
      <Line className="mt-2 h-2.5 w-28" />
    </div>
  );
}

/** Flot justifié du mode `flow` : la lettrine-chapitre + un paragraphe continu. */
function ReaderFlow() {
  const lines = [
    'w-full', 'w-11/12', 'w-full', 'w-10/12', 'w-11/12', 'w-full',
    'w-9/12', 'w-full', 'w-11/12', 'w-full', 'w-8/12', 'w-2/3',
  ];
  return (
    <div className="mt-6">
      <div className="flex gap-4">
        {/* `.chapter-numeral` : le grand chiffre flottant dans la marge */}
        <Skeleton className="h-14 w-10 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {lines.slice(0, 3).map((width, index) => (
            <Skeleton key={index} className={cn('h-4 rounded-md', width)} />
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {lines.slice(3).map((width, index) => (
          <Skeleton key={index} className={cn('h-4 rounded-md', width)} />
        ))}
      </div>
    </div>
  );
}

/** Blocs numérotés du mode `blocks` : une gouttière par verset. */
function ReaderBlocks() {
  const verses = [
    ['w-full', 'w-11/12'],
    ['w-full', 'w-full', 'w-3/4'],
    ['w-11/12', 'w-2/3'],
    ['w-full', 'w-10/12'],
    ['w-full', 'w-11/12', 'w-1/2'],
  ];
  return (
    <div className="mt-6 flex flex-col gap-4">
      {verses.map((lines, index) => (
        <div key={index} className="flex gap-2">
          <Skeleton className="mt-0.5 h-3 w-4 shrink-0 rounded-sm" />
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

/**
 * Lecteur biblique : la vraie surface (`bible-card reading-card`), la vraie
 * tête de chapitre, puis le corps selon l'option d'apparition réelle
 * (`flow` = paragraphe continu avec lettrine, défaut du store ;
 * `blocks` = un pavé par verset).
 */
export function BibleReaderSkeleton({
  label,
  layout = 'flow',
}: {
  label: string;
  layout?: 'flow' | 'blocks';
}) {
  return (
    <SkeletonPage label={label}>
      <div className="bible-card reading-card w-full">
        <ChapterHeadingSkeleton />
        {layout === 'flow' ? <ReaderFlow /> : <ReaderBlocks />}
      </div>
    </SkeletonPage>
  );
}

/** Barres de rétention : la silhouette du graphique à 14 colonnes. */
const BAR_HEIGHTS = ['h-14', 'h-20', 'h-16', 'h-24', 'h-20', 'h-28', 'h-24', 'h-16', 'h-32', 'h-36', 'h-24', 'h-24', 'h-32', 'h-28'];

function RetentionBars() {
  return (
    <div className="flex h-40 items-end gap-1">
      {BAR_HEIGHTS.map((height, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <Skeleton className={cn('w-full rounded-t-md', height)} />
          <Skeleton className="h-2 w-4 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

/**
 * Analytique : la grande carte (icône + total + libellé), les DEUX tuiles
 * (maîtrisés, série), la carte rétention (titre + 14 barres), la carte
 * tendance (deux tuiles + bandeau de variation), le classement par statut
 * (trois lignes à point coloré), puis le temps total. `StatsDashboard`
 * porte son propre squelette.
 */
export function AnalyticsSkeleton({ label }: { label: string }) {
  return (
    <SkeletonPage label={label}>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass col-span-2 flex items-center gap-4 rounded-3xl p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Line className="h-2.5 w-32" />
          </div>
        </div>
        {[0, 1].map((index) => (
          <div
            key={index}
            className="glass flex flex-col items-center justify-center gap-2 rounded-2xl p-4"
          >
            <Skeleton className="h-7 w-12 rounded-lg" />
            <Line className="h-2.5 w-16" />
          </div>
        ))}
      </div>

      <div className="glass rounded-3xl p-5">
        <Skeleton className="mb-4 h-5 w-44 rounded-full" />
        <RetentionBars />
      </div>

      <div className="glass rounded-3xl p-5">
        <Skeleton className="mb-3 h-5 w-40 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-tint p-4"
            >
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Line className="h-2.5 w-20" />
            </div>
          ))}
        </div>
        {/* Bandeau « +N% vs semaine dernière » */}
        <Skeleton className="mt-3 h-11 w-full rounded-xl" />
      </div>

      <div>
        <Skeleton className="mb-3 h-5 w-40 rounded-full" />
        <div className="glass overflow-hidden rounded-3xl">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex w-full items-center justify-between gap-3 border-b border-divider px-4 py-4 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                <Line className="w-24" />
              </div>
              <Skeleton className="h-5 w-8 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass flex flex-col items-center gap-1.5 rounded-3xl p-5">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Line className="h-2.5 w-36" />
      </div>
    </SkeletonPage>
  );
}

/**
 * Progression : la grille des quatre mesures, les deux cartes
 * (`progress-detail-grid` : tendance hebdo + maîtrise), puis les deux cartes
 * (série + métriques de session). `StatsDashboard` monte en dessous avec son
 * propre squelette — il ne faut pas le pré-dessiner ici.
 */
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
        <div className="g2 progress-card">
          <Skeleton className="h-6 w-48 rounded-full" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            {[0, 1].map((index) => (
              <div key={index} className="flex flex-col gap-2">
                <Line className="h-3 w-20" />
                <Skeleton className="h-10 w-12 rounded-md" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-4 w-56 rounded-full" />
        </div>
        <div className="g2 progress-card">
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-11 w-24 rounded-md" />
            <Line className="h-3 w-40" />
          </div>
          {/* `.progress-track` : barre h-2 */}
          <Skeleton className="mt-5 h-2 w-full rounded-lg" />
        </div>
      </div>
      <div className="progress-detail-grid">
        <div className="g2 progress-card progress-streak">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Line className="h-3 w-24" />
          </div>
        </div>
        <div className="g2 progress-card progress-metric">
          <Skeleton className="h-6 w-44 rounded-full" />
          <Line className="h-3 w-36" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
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
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Catalogue des écrans proposés au laboratoire de prévisualisation.
 *
 * Règle : **chaque entrée pointe une route qui existe** dans `src/main.tsx`.
 * Aucune page inventée pour « faire complet » : quand un écran dépend de
 * données absentes du poste (jeux bibliques non versionnés, session
 * authentifiée, base de mémorisation), son état réel est annoncé ici — le
 * laboratoire l'affiche tel quel, il ne le maquille pas.
 */

export type PreviewScreenState = 'donnees-reelles' | 'etat-vide-reel' | 'necessite-session';

export interface PreviewScreen {
  id: string;
  /** Route réelle de `src/main.tsx`. */
  path: string;
  label: string;
  group: 'Parcours principal' | 'Bible' | 'Mémorisation' | 'Progrès' | 'Famille' | 'Sémantique' | 'Réglages';
  state: PreviewScreenState;
  /** Ce qu'il faut savoir avant de lire le rendu. */
  note?: string;
}

export const PREVIEW_SCREENS: PreviewScreen[] = [
  {
    id: 'home',
    path: '/tabs/home',
    label: 'Accueil',
    group: 'Parcours principal',
    state: 'donnees-reelles',
    note: 'Série et versets récents lus dans le stockage local de la démo (vide au premier lancement : c’est l’état réel).',
  },
  {
    id: 'explore',
    path: '/tabs/explore',
    label: 'Explorer',
    group: 'Parcours principal',
    state: 'donnees-reelles',
  },
  {
    id: 'bible-books',
    path: '/bible/explorer',
    label: 'Bible — livres',
    group: 'Bible',
    state: 'etat-vide-reel',
    note: 'Les jeux bibliques ne sont pas versionnés dans le dépôt : l’écran affiche son état vide réel.',
  },
  {
    id: 'bible-chapter',
    path: '/bible/chapter/joh/3',
    label: 'Bible — chapitre (Jean 3)',
    group: 'Bible',
    state: 'etat-vide-reel',
    note: 'Même raison : sans jeu de données, le chapitre est vide.',
  },
  {
    id: 'memorize',
    path: '/memorization/session',
    label: 'Mémoriser — session',
    group: 'Mémorisation',
    state: 'donnees-reelles',
  },
  {
    id: 'workspace',
    path: '/memorization/workspace',
    label: 'Mémoriser — atelier',
    group: 'Mémorisation',
    state: 'donnees-reelles',
  },
  {
    id: 'review-queue',
    path: '/review/queue',
    label: 'Révisions — file',
    group: 'Progrès',
    state: 'donnees-reelles',
    note: 'La file vient de la base PowerSync : vide dans la démo, donc « rien à réviser » — l’état réel.',
  },
  {
    id: 'review-session',
    path: '/review/session',
    label: 'Révisions — session',
    group: 'Progrès',
    state: 'donnees-reelles',
  },
  {
    id: 'progress',
    path: '/tabs/progress',
    label: 'Progrès',
    group: 'Progrès',
    state: 'donnees-reelles',
  },
  {
    id: 'family',
    path: '/family/home',
    label: 'Famille — hub',
    group: 'Famille',
    state: 'donnees-reelles',
    note: 'Famille de démonstration « Famille Étoile » semée localement, avec un défi en cours.',
  },
  {
    id: 'family-members',
    path: '/family/members',
    label: 'Famille — membres',
    group: 'Famille',
    state: 'necessite-session',
    note: 'La liste des membres vient du serveur : hors session, l’écran affiche son état vide réel.',
  },
  {
    id: 'family-leaderboard',
    path: '/family/leaderboard',
    label: 'Famille — classement',
    group: 'Famille',
    state: 'donnees-reelles',
  },
  {
    id: 'semantic-tags',
    path: '/semantic/tags',
    label: 'Sémantique — mes tags',
    group: 'Sémantique',
    state: 'donnees-reelles',
  },
  {
    id: 'notes',
    path: '/notes',
    label: 'Notes',
    group: 'Sémantique',
    state: 'donnees-reelles',
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Profil',
    group: 'Réglages',
    state: 'donnees-reelles',
    note: 'Profil de démonstration « Léa » (aucun compte réel).',
  },
  {
    id: 'appearance',
    path: '/settings/appearance',
    label: 'Réglages — apparence',
    group: 'Réglages',
    state: 'donnees-reelles',
    note: 'Changer le thème ici permet de vérifier la propagation aux deux cadres.',
  },
  {
    id: 'settings',
    path: '/tabs/settings',
    label: 'Réglages',
    group: 'Réglages',
    state: 'donnees-reelles',
  },
];

export const DEFAULT_PREVIEW_SCREEN = '/tabs/home';

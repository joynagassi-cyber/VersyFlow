/**
 * Layout des onglets — point d'entrée de la coquille.
 *
 * Ce fichier ne contient plus de structure : il délègue à `src/shells/AppShell`,
 * qui choisit **une** coquille selon la largeur réelle du viewport :
 *
 *   < 768 px  → MobileShell   (onglets bas, tiroir, FAB, zones sûres)
 *   ≥ 768 px  → DesktopShell  (rail persistant, en-tête global, panneau)
 *
 * Les 94 routes et les écrans métier sont inchangés : les deux coquilles
 * montent le même `<Outlet />`, donc les mêmes composants et les mêmes
 * services. C'est ce qui garantit qu'une correction faite pour le bureau ne
 * peut pas laisser le mobile de côté — il n'y a qu'un seul écran.
 */

import { AppShell } from '@/shells/AppShell';

export default function TabLayout() {
  return <AppShell />;
}

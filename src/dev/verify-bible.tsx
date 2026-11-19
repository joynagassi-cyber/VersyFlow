/**
 * Écran de vérification de la Bible — `<BibleExplorer />` monté sans routeur.
 *
 * Ce fichier n'entre pas dans le build (`verify-bible.html` n'est pas une entrée
 * de Vite) : il sert à **regarder** ce que rend le seul écran Bible, avec les
 * vrais fichiers de `public/data/bible/lsg/`, dans un navigateur. Il ne
 * remplace pas les tests : il montre l'état de chargement, la liste des livres,
 * la grille des chapitres et le texte du chapitre, ce que jsdom ne peut pas
 * mesurer.
 */

import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '@/i18n/i18next-init';
import '@/styles/globals.css';
import BibleExplorer from '../../app/bible/explorer';

const path = new URLSearchParams(window.location.search).get('path') ?? '/bible/explorer';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <MemoryRouter initialEntries={[path]}>
    <BibleExplorer />
  </MemoryRouter>,
);

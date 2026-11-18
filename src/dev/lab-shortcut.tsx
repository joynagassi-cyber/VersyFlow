/**
 * Raccourci de développement vers le laboratoire responsive.
 *
 * POURQUOI. Le laboratoire `/__dev/responsive-preview` existe, mais rien dans
 * l'application ne le signalait : on ouvrait l'app, on voyait la coquille (donc
 * « la version desktop »), et les coques d'appareils restaient invisibles faute
 * de savoir où regarder. Ce raccourci supprime cette devinette.
 *
 * Ce module n'existe **pas** en production : il n'est importé que depuis une
 * branche que Vite remplace par `false` (voir `src/main.tsx`, même motif que la
 * route du laboratoire). Le `grep` d'isolation sur `www/assets` le prouve.
 */

import { Link, useLocation } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { SmartPhone01Icon, BeakerIcon } from '@/components/ui/solar-icons';

export default function DevLabShortcut() {
  const { pathname } = useLocation();
  // Dans le laboratoire lui-même, le raccourci n'aurait aucun sens.
  if (pathname.startsWith('/__dev/') || import.meta.env.VITE_SHOW_LAB_SHORTCUT !== 'true') return null;

  return (
    <Link
      to="/__dev/responsive-preview"
      data-dev-entry="responsive-preview"
      className="fixed bottom-4 end-4 z-[60] flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      title="Ouvrir le laboratoire : version mobile dans une coque de téléphone, version desktop dans un écran de bureau"
    >
      <DuoIcon icon={SmartPhone01Icon} size={16} color="currentColor" />
      Coques mobile + bureau
      <DuoIcon icon={BeakerIcon} size={14} color="currentColor" />
    </Link>
  );
}

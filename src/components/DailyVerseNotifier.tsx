/**
 * Synchronisation silencieuse des notifications « verset du jour ».
 *
 * Monté une fois au démarrage. Ne demande **jamais** la permission : il se
 * contente de reprogrammer la fenêtre de 14 jours si l'utilisateur l'a déjà
 * accordée (l'activation explicite vit dans l'écran Notifications). Une
 * reprogrammation à chaque retour au premier plan garantit que la fenêtre ne
 * s'épuise pas quand l'app reste ouverte plusieurs jours — sans réseau.
 */

import { useEffect } from 'react';
import { isNativePlatform } from '@/lib/platform';
import { syncDailyVerseNotifications } from '@/services/daily-verse-notifier';

export function DailyVerseNotifier() {
  useEffect(() => {
    if (!isNativePlatform()) return;

    const sync = () => {
      void syncDailyVerseNotifications({ requestPermission: false });
    };
    sync();

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return null;
}

export default DailyVerseNotifier;

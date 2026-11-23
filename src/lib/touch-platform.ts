/**
 * Cibles tactiles par plateforme (playbook D02, D03, D07).
 *
 * Le CSS sait déjà faire varier `--tap-min` selon `pointer: coarse` (44 px,
 * iOS) et selon `html[data-platform='android']` (48 px, Material). Ce dernier
 * sélecteur ne s'activait jamais : **personne ne posait l'attribut**. Une
 * règle CSS que rien n'allume est une intention, pas une cible. Ce module pose
 * l'attribut au démarrage, une fois, avant le premier rendu utile.
 *
 * Il reste volontairement mince :
 *  - le navigateur de bureau ne pose RIEN (aucun attribut, aucune classe) ;
 *  - l'agent utilisateur ne sert qu'à distinguer Android d'iOS, jamais à
 *    adapter le contenu — une cible tactile est une taille, pas une variante ;
 *  - la fonction est pure et testable sans DOM (`touchPlatformFor`).
 */
import { isNativePlatform } from '@/lib/platform';

export type TouchPlatform = 'android' | 'ios' | 'web';

/**
 * Quelle plateforme tactile décrit cet agent utilisateur ?
 *
 * L'ordre compte : un iPad récent s'annonce comme « Macintosh » ; on le
 * reconnaît à `Macintosh` + écran tactile. Un Android se reconnaît à
 * `Android`, jamais à `Linux` seul (un ordinateur Linux ne doit pas hériter
 * des cibles Material).
 */
export function touchPlatformFor(userAgent: string, touchPoints = 0): TouchPlatform {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  // iPadOS 13+ : « Macintosh » avec un écran tactile.
  if (ua.includes('macintosh') && touchPoints > 1) return 'ios';
  return 'web';
}

/**
 * Pose `data-platform` sur `<html>` quand l'app tourne sur une plateforme
 * tactile. Idempotent : deux appels ne changent rien.
 *
 * En natif, Capacitor connaît la plateforme mieux que l'agent utilisateur :
 * on la préfère quand elle est disponible.
 */
export function installTouchPlatform(
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
  nav: Navigator | undefined = typeof navigator === 'undefined' ? undefined : navigator,
): TouchPlatform {
  if (!doc || !nav) return 'web';
  const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const native = isNativePlatform() ? cap?.getPlatform?.() : undefined;
  const platform: TouchPlatform =
    native === 'android' || native === 'ios'
      ? native
      : touchPlatformFor(nav.userAgent ?? '', nav.maxTouchPoints ?? 0);

  if (platform === 'web') {
    doc.documentElement.removeAttribute('data-platform');
  } else {
    doc.documentElement.setAttribute('data-platform', platform);
  }
  return platform;
}

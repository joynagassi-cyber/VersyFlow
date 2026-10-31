/**
 * Triplets RGB des surfaces — la seule chose que le CSS ne sait pas calculer.
 *
 * POURQUOI CE MODULE EXISTE
 * -------------------------
 * Les règles historiques de `globals.css` écrivent le verre ainsi :
 *
 *     background: rgba(var(--gc-rgb), max(var(--glass-alpha), .8));
 *
 * `rgba()` attend trois NOMBRES, pas une couleur. Or le mode sombre déclarait
 * `--gc-rgb: 23, 23, 23` en dur, et le clair `255, 255, 255` : la surface du
 * verre ignorait donc le preset actif. Les cartes d'un preset violacé
 * restaient grises, en clair comme en sombre.
 *
 * `color-mix()` ne permet pas de contourner le problème, parce que
 * `--color-surface` est lui-même redéfini en translucide sous une image de
 * thème — s'en servir comme ancre créerait un cycle sur le même élément.
 *
 * D'où ce module : on lit la couleur du preset, on la convertit en triplet, on
 * l'écrit. Une seule fois par changement de thème, de preset ou de mode.
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_FN = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;

/**
 * Convertit une couleur CSS en `"r, g, b"`, ou `null` si elle n'est pas
 * exploitable (nom de couleur, variable non résolue, `color-mix(…)`).
 *
 * On refuse volontairement les formes exotiques plutôt que de deviner : un
 * triplet faux repeint tout le verre de l'app, alors qu'un `null` laisse la
 * valeur de repli en place.
 */
export function toRgbTriplet(value: string | null | undefined): string | null {
  if (!value) return null;
  const input = value.trim();

  const hex = input.match(HEX);
  if (hex) {
    const body = hex[1];
    const full = body.length === 3 ? body.split('').map((c) => c + c).join('') : body;
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  const fn = input.match(RGB_FN);
  if (fn) {
    const [r, g, b] = fn.slice(1, 4).map((c) => Math.round(Number(c)));
    if ([r, g, b].some((c) => !Number.isFinite(c) || c < 0 || c > 255)) return null;
    return `${r}, ${g}, ${b}`;
  }

  return null;
}

/** Inverse de `toRgbTriplet` : un triplet redevient un hex CSS. */
export function tripletToHex(triplet: string): string | null {
  const parts = triplet.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 3) return null;
  if (parts.some((c) => !Number.isFinite(c) || c < 0 || c > 255)) return null;
  return `#${parts.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export interface SurfaceTriplets {
  /** Triplet de la surface de carte (`--color-surface`). */
  gc: string | null;
  /** Triplet du fond (`--color-background`) — utilisé par les voiles. */
  bg: string | null;
  /** Triplet du texte principal — sert aux ombres calculées depuis l'encre. */
  text: string | null;
}

/**
 * Lit les variables d'un élément et renvoie les triplets exploitables.
 *
 * L'ordre des candidats compte : `--card` est la valeur BRUTE du preset, donc
 * elle ne dépend pas des surcharges de `globals.css` (translucidité sur image,
 * etc.). On ne retombe sur `--color-surface` que si le preset n'en fournit pas,
 * c'est-à-dire pour le thème de base.
 */
export function readSurfaceTriplets(read: (name: string) => string): SurfaceTriplets {
  const pick = (...names: string[]): string | null => {
    for (const name of names) {
      const value = read(name);
      const triplet = toRgbTriplet(value);
      if (triplet) return triplet;
    }
    return null;
  };

  return {
    gc: pick('--card', '--color-surface'),
    bg: pick('--background', '--color-background'),
    text: pick('--foreground', '--color-text-primary'),
  };
}

/**
 * Écrit les triplets dérivés sur `<html>`.
 *
 * `--glass-rgb` n'est plus une valeur de mode écrite à la main : c'est la même
 * surface que `--gc-rgb`. Les deux existaient séparément, et c'est précisément
 * ainsi que le sombre avait fini par peindre son verre avec un gris (#121212)
 * qui n'était la surface d'aucun preset.
 */
export function applySurfaceTriplets(
  root: HTMLElement,
  read: (name: string) => string = (name) => getComputedStyle(root).getPropertyValue(name),
): SurfaceTriplets {
  const { gc, bg, text } = readSurfaceTriplets(read);

  if (gc) {
    root.style.setProperty('--gc-rgb', gc);
    root.style.setProperty('--glass-rgb', gc);
  }
  if (bg) {
    root.style.setProperty('--bg-rgb', bg);
    // Ionic compose ses propres `rgba()` : sans ces triplets il retombait sur
    // ses valeurs par défaut (celles de son thème, pas celles du nôtre).
    root.style.setProperty('--color-background-rgb', bg);
    root.style.setProperty('--ion-background-color-rgb', bg);
  }
  if (text) {
    root.style.setProperty('--color-text-primary-rgb', text);
    root.style.setProperty('--ion-text-color-rgb', text);
  }

  return { gc, bg, text };
}

/**
 * Aligne la couleur de la barre du navigateur (`<meta name="theme-color">`)
 * sur le fond réel du thème.
 *
 * Elle était écrite en dur dans `index.html` (#D81B97) : une barre magenta
 * au-dessus d'une application sombre, et une teinte qui n'était même pas
 * celle de la marque (#e6067a). Ce n'est pas de la décoration — sur mobile,
 * `theme-color` peint la barre d'état du système et le fond du navigateur.
 */
export function applyThemeColor(background: string | null, doc: Document = document): void {
  if (!background) return;
  const hex = tripletToHex(background);
  if (!hex) return;
  let meta = doc.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = doc.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    doc.head.appendChild(meta);
  }
  meta.setAttribute('content', hex);
}

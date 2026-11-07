/**
 * Garde-fou réseau du mode mock — « le frontend ne peut PAS joindre le backend ».
 *
 * Pourquoi ce fichier existe
 * -------------------------
 * Le mode mock promet un frontend autonome. Mais une promesse non vérifiée
 * est une intention : un `fetch` oublié vers un bucket Supabase, un client
 * PowerSync instancié trop tôt, une police chargée depuis un CDN — et l'écran
 * dépend d'un service distant sans que rien ne le signale, sauf une page
 * blanche chez quelqu'un qui n'a pas de réseau.
 *
 * Ce module inverse la charge de la preuve : en mode mock, toute requête vers
 * une **origine différente** est refusée avant de partir, et la tentative est
 * journalisée avec sa pile d'appel. Un écran qui ne fonctionne pas hors ligne
 * se voit donc immédiatement, à l'adresse exacte du code fautif.
 *
 * Ce qui reste autorisé :
 *  - même origine (l'app servie par Vite, son proxy `/api`, `/mock-dashboard`) ;
 *  - `blob:`, `data:`, `file:` — ressources locales, jamais distantes ;
 *  - désactivation explicite par `VITE_MOCK_NET_GUARD=off` (débogage).
 *
 * Coût en production : nul. Le module n'agit que si `isMockMode()` est vrai,
 * et n'est importé que par le point d'entrée.
 */
import { isMockMode } from './mode';

/** Bandeau d'alerte affiché à l'écran, en plus de la console. */
const BANNER_ID = 'mock-net-guard-banner';

type Blocked = { url: string; method: string; at: string };

const blocked: Blocked[] = [];

function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, globalThis.location?.href ?? 'http://localhost/');
    if (['blob:', 'data:', 'file:', 'about:'].includes(parsed.protocol)) return true;
    // Un chemin relatif est, par construction, de même origine.
    if (!/^[a-z]+:/i.test(url)) return true;

    // `new URL('ws://x').origin` vaut `ws://x`, alors que `location.origin`
    // vaut `http://x` : comparer les origines brutes bloquerait le WebSocket
    // de la MÊME origine (PowerSync local, HMR). On compare donc hôte + port,
    // en traitant ws/wss comme http/https et en ignorant http (80) / https (443).
    const scheme = (protocol: string) =>
      protocol === 'ws:' ? 'http:' : protocol === 'wss:' ? 'https:' : protocol;
    const port = (p: string, s: string) =>
      p || (s === 'https:' ? '443' : s === 'http:' ? '80' : '');
    const here = globalThis.location;
    if (!here) return false;
    return (
      scheme(parsed.protocol) === scheme(here.protocol) &&
      parsed.hostname === here.hostname &&
      port(parsed.port, scheme(parsed.protocol)) === port(here.port, scheme(here.protocol))
    );
  } catch {
    return false;
  }
}

function report(url: string, method: string) {
  const at = new Error('origine de la requête').stack?.split('\n').slice(2, 5).join('\n') ?? '';
  blocked.push({ url, method, at });
  const message =
    `[mock-net-guard] Requête externe BLOQUÉE en mode mock : ${method} ${url}\n` +
    "Le frontend doit fonctionner sans backend. Soit cette ressource doit être\n" +
    "embarquée (public/ ou import), soit l'appel doit être ignoré en mode mock.\n" +
    (at ? `${at}\n` : '');
  console.error(message);
  showBanner(url);
}

/** Bandeau discret : visible sans ouvrir la console, absent des captures. */
function showBanner(url: string) {
  if (typeof document === 'undefined' || document.getElementById(BANNER_ID)) return;
  const el = document.createElement('div');
  el.id = BANNER_ID;
  el.setAttribute('role', 'status');
  el.textContent = `Mode mock — requête externe bloquée : ${new URL(url, location.href).host}`;
  el.style.cssText = [
    'position:fixed',
    'z-index:2147483647',
    'left:12px',
    'right:12px',
    'bottom:12px',
    'padding:8px 12px',
    'border-radius:12px',
    'background:#7f1d1d',
    'color:#fff',
    'font:600 12px/1.4 system-ui,sans-serif',
    'box-shadow:0 6px 24px rgba(0,0,0,.45)',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

/** Installe le garde-fou. Idempotent : un double import ne réinstalle rien. */
export function installNetworkGuard(): void {
  if (!isMockMode()) return;
  const enabled =
    (import.meta.env.VITE_MOCK_NET_GUARD ?? 'on').toString().toLowerCase() !== 'off';
  if (!enabled) {
    console.warn('[mock-net-guard] Désactivé par VITE_MOCK_NET_GUARD=off.');
    return;
  }
  const scope = globalThis as typeof globalThis & {
    __mockNetGuardInstalled?: boolean;
    __mockNetGuardBlocked?: Blocked[];
  };
  if (scope.__mockNetGuardInstalled) return;
  scope.__mockNetGuardInstalled = true;
  scope.__mockNetGuardBlocked = blocked;

  // 1. fetch
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!isSameOrigin(url)) {
      report(url, init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET'));
      return Promise.reject(
        new TypeError(`[mock-net-guard] Requête externe bloquée en mode mock : ${url}`),
      );
    }
    return originalFetch(input as RequestInfo, init);
  };

  // 2. XMLHttpRequest (Supabase-js, PowerSync et les SDK passent par là)
  // Le drapeau est porté par l'instance : on type l'extension plutôt que de
  // salir `XMLHttpRequest` globalement.
  type GuardedXhr = XMLHttpRequest & { __mockBlocked?: boolean };
  const XHR = globalThis.XMLHttpRequest;
  if (XHR) {
    const open = XHR.prototype.open;
    const send = XHR.prototype.send;
    XHR.prototype.open = function (this: GuardedXhr, method: string, url: string, ...rest: unknown[]) {
      this.__mockBlocked = !isSameOrigin(url);
      if (this.__mockBlocked) report(url, method);
      return open.apply(this, [method, url, ...rest] as never);
    };
    XHR.prototype.send = function (this: GuardedXhr, ...args: unknown[]) {
      if (this.__mockBlocked) {
        throw new TypeError('[mock-net-guard] Requête externe bloquée en mode mock.');
      }
      return send.apply(this, args as never);
    };
  }

  // 3. WebSocket (PowerSync temps réel) et EventSource
  const NativeWS = globalThis.WebSocket;
  if (NativeWS) {
    const Guarded = function (url: string | URL, protocols?: string | string[]) {
      const href = typeof url === 'string' ? url : url.href;
      if (!isSameOrigin(href)) {
        report(href, 'WS');
        throw new DOMException('[mock-net-guard] WebSocket externe bloqué en mode mock.', 'SecurityError');
      }
      return new NativeWS(href, protocols);
    } as unknown as typeof WebSocket;
    Guarded.prototype = NativeWS.prototype;
    Object.assign(Guarded, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    globalThis.WebSocket = Guarded;
  }

  // 4. beacons (analytics)
  const sendBeacon = navigator.sendBeacon?.bind(navigator);
  if (sendBeacon) {
    navigator.sendBeacon = (url: string, data?: BodyInit | null) => {
      if (!isSameOrigin(url)) {
        report(url, 'BEACON');
        return false;
      }
      return sendBeacon(url, data);
    };
  }

  console.info(
    '[mock-net-guard] Actif : seules les requêtes de même origine sont autorisées.\n' +
      'Les tentatives bloquées apparaîtront ici et dans un bandeau en bas d’écran.',
  );
}

/** Requêtes bloquées depuis le démarrage — utile aux tests et au panneau dev. */
export function blockedRequests(): Blocked[] {
  return [...blocked];
}

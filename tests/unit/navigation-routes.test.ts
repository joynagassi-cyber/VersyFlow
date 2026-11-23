/**
 * Navigation — toute cible de lien doit correspondre à une route déclarée.
 *
 * Le routeur déclare ses chemins en **imbrication** : les routes enfants de
 * `/onboarding` (`welcome`, `progress`, `journey/:step`, `translation-select`,
 * `session-config`, `reminder-config`) valent `/onboarding/welcome`,
 * `/onboarding/progress`, etc. Un contrôle plat des `path="…"` les croirait
 * absentes et signalerait un faux positif ; c'est donc le **chemin effectif**
 * (parents concaténés) qui est comparé ici.
 *
 * Le défaut que ce test empêche : renommer ou déplacer une route sans mettre à
 * jour un `<Link to="…">` (ou un `navigate('…')`, ou un `<Navigate>`) laisse un
 * écran qui rebondit vers le 404. Aucun test ne l'attrapait : les écrans
 * montés en test le sont avec leur propre routeur, jamais avec celui de
 * `src/main.tsx`.
 *
 * Les liens dynamiques (`to={`/bible/explorer/${bookId}`}`) ne sont pas
 * comparés : on ne peut pas les résoudre sans exécuter l'écran. Le test porte
 * sur les cibles statiques, celles qu'une faute de frappe casse.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MAIN = readFileSync(join(ROOT, 'src/main.tsx'), 'utf8');

interface Declared {
  path: string;
  /** Chemin effective : `path` préfixé par les routes parentes. */
  full: string;
}

/**
 * Routes déclarées dans `src/main.tsx`, avec leur chemin effectif.
 *
 * Analyse par pile de balises `<Route …>` : ouverture (avec ou sans `path`),
 * fermeture, et auto-fermeture. Un `path` absent désigne une route de mise en
 * page (garde, layout) : elle ne consomme aucun segment et n'ajoute donc rien
 * au chemin.
 *
 * Le balayage est manuel parce qu'un `<Route element={<Navigate to="/x" replace />}>`
 * contient un `>` et un `/>` **dans ses attributs** : une expression régulière
 * sur `[^>]*` tronque la balise et perd la route.
 */
function declaredRoutes(source: string): Declared[] {
  const routes: Declared[] = [];
  const stack: string[] = [];
  const openTag = /<(\/?)Route\b/g;
  let match: RegExpExecArray | null;
  while ((match = openTag.exec(source)) !== null) {
    const closing = match[1] === '/';
    // Fin de la balise : le premier `>` hors accolades (`{…}`).
    let depth = 0;
    let index = openTag.lastIndex;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (char === '{') depth += 1;
      else if (char === '}') depth -= 1;
      else if (char === '>' && depth === 0) break;
    }
    const selfClosing = source[index - 1] === '/';
    const attributes = source.slice(openTag.lastIndex, selfClosing ? index - 1 : index);
    openTag.lastIndex = index + 1;

    if (closing) {
      stack.pop();
      continue;
    }

    const segment = /path=["']([^"']+)["']/.exec(attributes)?.[1] ?? '';
    const parent = stack.join('').replace(/\/+$/, '');
    const full = segment.startsWith('/')
      ? segment
      : `${parent}/${segment}`.replace(/\/{2,}/g, '/');
    if (segment && segment !== '*') routes.push({ path: segment, full });
    if (!selfClosing) stack.push(segment === '*' ? '' : segment);
  }
  return routes;
}

/** Motif de correspondance d'une route effective, segments dynamiques tolérés. */
function patternFor(full: string): RegExp {
  const body = full
    .replace(/\/$/, '')
    .split('/')
    .map((segment) =>
      /^[:*]/.test(segment)
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${body}/?$`);
}

const routes = declaredRoutes(MAIN);
const patterns = routes.map((route) => patternFor(route.full));

function resolves(target: string): boolean {
  const clean = target.split('?')[0].split('#')[0];
  return patterns.some((pattern) => pattern.test(clean));
}

/** Fichiers d'écran : `app/**` et `src/**`, hors tests et locales. */
function screenFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) screenFiles(file, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(file);
  }
  return out;
}

/** Cibles de navigation statiques (littéraux uniquement). */
function staticTargets(files: string[]): { target: string; file: string }[] {
  const found: { target: string; file: string }[] = [];
  const patternsToScan: RegExp[] = [
    /to=["']([/][^"'`]*)["']/g, // <Link to="/…">, <Navigate to="/…">
    /navigate\(\s*["']([/][^"'`]*)["']/g, // navigate('/…')
    /redirect\(\s*["']([/][^"'`]*)["']/g,
  ];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const scan of patternsToScan) {
      for (const match of source.matchAll(scan)) {
        found.push({ target: match[1], file: file.replace(`${ROOT}/`, '') });
      }
    }
  }
  return found;
}

describe('routes et liens', () => {
  it('lit l’imbrication, pas seulement les chemins plats', () => {
    const onboarding = routes.filter((route) => route.full.startsWith('/onboarding/'));
    // Les écrans du parcours d'accueil, chemins effectifs compris. `progress`
    // n'y figure pas : c'est `/tabs/progress`, un autre enfant, et c'est
    // précisément ce que l'imbrication permet de distinguer.
    expect(onboarding.map((route) => route.full).sort()).toEqual([
      '/onboarding/fsrs-introduction',
      '/onboarding/journey/:step',
      '/onboarding/language-select',
      '/onboarding/reminder-config',
      '/onboarding/session-config',
      '/onboarding/translation-select',
      '/onboarding/welcome',
    ]);
    // Les routes de mise en page (sans `path`) n'ajoutent pas de segment.
    expect(routes.some((route) => route.full.includes('//'))).toBe(false);
  });

  it('déclare tous les écrans d’onglets en chemin effectif', () => {
    const tabs = routes.filter((route) => route.full.startsWith('/tabs/'));
    expect(tabs.map((route) => route.full).sort()).toEqual([
      '/tabs/explore',
      '/tabs/home',
      '/tabs/progress',
      '/tabs/settings',
    ]);
  });

  it('chaque cible de lien statique correspond à une route', () => {
    const files = [...screenFiles(join(ROOT, 'app')), ...screenFiles(join(ROOT, 'src'))];
    const unresolved = staticTargets(files).filter(({ target }) => !resolves(target));
    expect(
      unresolved.map(({ target, file }) => `${target} ← ${file}`),
    ).toEqual([]);
  });

  it('résout les redirections historiques documentées (D7)', () => {
    for (const legacy of [
      '/bible/chapter/joh/3',
      '/bible/book',
      '/bible/book/gen',
      '/memory/start',
      '/tabs/settings',
      '/family/select-profile',
    ]) {
      expect(`${legacy} : ${resolves(legacy)}`).toBe(`${legacy} : true`);
    }
  });

  it('ne prend pas n’importe quel chemin pour une route', () => {
    expect(resolves('/cette/route/n-existe-pas')).toBe(false);
    expect(resolves('/bible/explorer/joh/3')).toBe(true);
    // Un segment en trop ne correspond pas à la route à trois niveaux.
    expect(resolves('/bible/explorer/joh/3/4')).toBe(false);
  });
});

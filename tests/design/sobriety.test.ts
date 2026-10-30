/**
 * Garde de l'avenant « sobriété » : trois familles de couleurs, un accent.
 *
 * Lectures statiques uniquement (aucun navigateur) :
 *  - aucune pastille de couleur par fonctionnalité ne doit subsister ;
 *  - aucune table ne doit associer une couleur à une fonctionnalité ;
 *  - les sur-couleurs (texte sur fond fort) passent par `--on`, les voiles
 *    par `--scrim`, jamais par `white`/`black` écrits en dur ;
 *  - la pastille d'icône est neutre et ne prend l'accent qu'au survol.
 *
 * Ce que ces tests ne prouvent pas : le rendu. Le script console de l'avenant
 * (`getComputedStyle` sur chaque écran) demande un navigateur, absent ici.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

/** Tous les composants d'interface (hors styles, locales, tests, dev). */
function componentSources(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = `${dir}/${entry}`;
      if (statSync(full).isDirectory()) {
        if (['__dev', 'locales', 'node_modules'].includes(entry)) continue;
        walk(full);
      } else if (entry.endsWith('.tsx')) {
        out.push({ path: full, text: read(full) });
      }
    }
  };
  walk('app');
  walk('src/components');
  return out;
}

const css = read('src/styles/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');
const sources = componentSources();

describe('sobriété — une seule couleur d’accent', () => {
  it('ne contient plus aucune pastille colorée par fonctionnalité', () => {
    const offenders = sources.filter((f) => /bg-icon-bg-/.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('ne contient plus de table « une couleur par entrée »', () => {
    // Les états (danger/avertissement/succès) ont droit à leur table : c'est
    // une échelle d'état, pas une couleur par fonctionnalité. Ce qui est
    // interdit, c'est l'accent ou une teinte décorative (info) par entrée.
    const offenders = sources
      .filter((f) => /color:\s*'text-(primary|info|accent)[a-z-]*'/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('n’écrit plus de blanc ni de noir en dur dans un composant', () => {
    const offenders = sources.filter((f) => /\btext-white\b|\bbg-white\b|\bbg-black\b/.test(f.text));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it('définit les trois familles de jetons comme alias du thème', () => {
    for (const token of [
      '--text: var(--color-text-primary)',
      '--muted: var(--color-text-muted)',
      '--acc: var(--color-primary)',
      '--on: var(--color-on-primary)',
      '--success: var(--color-success)',
      '--danger: var(--color-error)',
      '--warning: var(--color-warning)',
    ]) {
      expect(css).toContain(token);
    }
  });

  it('rend la pastille d’icône neutre, et accent au survol seulement', () => {
    expect(css).toMatch(
      /\.icon-chip\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--text\) 8%, transparent\)/,
    );
    expect(css).toMatch(
      /\.action-card:hover \.icon-chip[^{}]*\{[^}]*color-mix\(in srgb, var\(--acc\) 16%, transparent\)/,
    );
  });

  it('colore une icône par héritage, jamais par une couleur propre au repos', () => {
    expect(css).toMatch(/\.icon-chip svg,\s*\.icon-chip ion-icon\s*\{[^}]*color:\s*var\(--muted\)/);
  });

  it('n’ajoute aucun `!important` pour arriver à ses fins', () => {
    const sobriety = css.slice(css.indexOf('AVENANT SOBRIÉTÉ'));
    expect(sobriety).not.toContain('!important');
  });
});

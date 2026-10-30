/**
 * Contrat de FINITION — ce qu'une application « presque finie » oublie.
 *
 * Les autres garde-fous vérifient la couleur, l'élévation, le thème. Celui-ci
 * vérifie les détails qui, manquants, trahissent immédiatement le travail :
 * pas d'anneau de focus au clavier, `prefers-reduced-motion` ignoré, tailles
 * de police littérales, squelettes de chargement recopiés, sélection de texte
 * aux couleurs du navigateur, cibles tactiles de 36 px, « Actualiser » sans
 * nom accessible.
 *
 * Rien n'est mesuré au pixel (jsdom ne calcule pas de mise en page) : chaque
 * assertion porte sur une décision VÉRIFIABLE dans la source — une règle
 * globale, un jeton nommé, une primitive partagée, une classe unique.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const globals = read('src/styles/globals.css');
const tailwind = read('tailwind.config.js');

/** Sources d'INTERFACE (hors dev, hors tests), comme les autres garde-fous. */
function uiSources(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(root, rel)).isDirectory()) {
        if (['__dev', 'locales', 'node_modules', 'dev'].includes(entry)) continue;
        walk(rel);
      } else if (/\.tsx$/.test(entry)) {
        out.push({ path: relative(root, join(root, rel)), text: read(rel) });
      }
    }
  };
  walk('app');
  walk('src/components');
  return out;
}

const sources = uiSources();

describe('finition — focus, mouvement, sélection', () => {
  it('dessine UN anneau de focus, clavier seulement, sur l’accent lisible', () => {
    expect(globals).toMatch(
      /:where\(a, button, \[role='button'\][\s\S]{0,400}\):focus-visible\s*\{[^}]*outline:\s*var\(--focus-ring-width\)\s*solid\s*var\(--acc-text/,
    );
    expect(globals).toContain('outline-offset: var(--focus-ring-offset)');
    // Un jeton, pas une valeur improvisée.
    expect(globals).toMatch(/--focus-ring-width:\s*2px/);
    expect(globals).toMatch(/--focus-ring-offset:\s*2px/);
  });

  it('ne laisse pas un composant concurrencer cet anneau', () => {
    const button = read('src/components/ui/button.tsx');
    expect(button).not.toContain('focus-visible:ring');
    expect(button).not.toContain('focus-visible:outline-none');
  });

  it('applique un seul état désactivé', () => {
    expect(globals).toMatch(
      /:where\(button, \[role='button'\], \[role='tab'\]\):is\(\[disabled\], \[aria-disabled='true'\]\)\s*\{[^}]*opacity:\s*0\.45[^}]*cursor:\s*not-allowed/,
    );
  });

  it('teinte la sélection et le curseur avec l’accent du thème', () => {
    expect(globals).toMatch(
      /::selection\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--acc[\s\S]{0,60}?26%, transparent\)/,
    );
    expect(globals).toMatch(/caret-color:\s*var\(--acc/);
  });

  it('respecte prefers-reduced-motion GLOBALEMENT, pas écran par écran', () => {
    const block = globals.slice(globals.indexOf('prefers-reduced-motion: reduce'));
    expect(block).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:where\(\*, \*::before, \*::after\)\s*\{[^}]*animation:\s*none[^}]*transition:\s*none/,
    );
    // Les indicateurs de chargement restent animés : ce mouvement porte une
    // information, le supprimer rendrait l'attente invisible.
    expect(block).toMatch(/\.animate-spin\s*\{\s*animation:\s*spin/);
  });

  it('nomme les durées et les courbes du mouvement', () => {
    for (const token of [
      '--motion-instant:', '--motion-fast:', '--motion-base:', '--motion-slow:',
      '--ease-standard:', '--ease-emphasized:',
    ]) {
      expect(globals).toContain(token);
    }
  });
});

describe('finition — échelle typographique', () => {
  it('nomme toutes les tailles : plus une seule valeur en pixels dans un écran', () => {
    const offenders = sources
      .filter((f) => /text-\[\d+(\.\d+)?px\]/.test(f.text))
      .map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it('expose les deux pas ajoutés pour y arriver', () => {
    expect(tailwind).toMatch(/'3xs': \['10px', \{ lineHeight: '13px' \}\]/);
    expect(tailwind).toMatch(/display: \['38px', \{ lineHeight: '42px' \}\]/);
  });

  it('réserve la serif aux titres, quel que soit le preset', () => {
    expect(globals).toMatch(
      /:is\(h1, h2, h3\)\s*\{[^}]*font-family:\s*var\(--font-serif[^}]*font-weight:\s*400/,
    );
  });

  it('donne aux chiffres clés une seule recette, tabulaire et accentuée', () => {
    expect(globals).toMatch(
      /\.stat-value\s*\{[^}]*font-variant-numeric:\s*tabular-nums[^}]*color:\s*var\(--acc-text/,
    );
    expect(globals).toMatch(/\.stat-label\s*\{[^}]*letter-spacing:\s*0\.12em[^}]*text-transform:\s*uppercase/);
    const dashboard = read('app/analytics/dashboard.tsx');
    expect(dashboard).toContain('stat-value');
    expect(dashboard).toContain('stat-label');
  });
});

describe('finition — chargement', () => {
  it('fournit une primitive de squelette, décorative et non redondante', () => {
    const skeleton = read('src/components/ui/Skeleton.tsx');
    expect(skeleton).toMatch(/aria-hidden="true"/);
    expect(skeleton).toContain('export function Skeleton');
    expect(skeleton).toContain('export function SkeletonScreen');
    expect(skeleton).toContain('export function LoadingBlock');
  });

  it('annonce le chargement aux lecteurs d’écran', () => {
    const skeleton = read('src/components/ui/Skeleton.tsx');
    expect(skeleton).toContain('role="status"');
    expect(skeleton).toContain('aria-live="polite"');
    expect(skeleton).toContain('aria-busy="true"');
  });

  it('ne recopie plus le bloc de chargement dans les écrans', () => {
    // Les commentaires citent la classe historique ; seul le code compte.
    const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const pulsing = sources.filter((f) => code(f.text).includes('animate-pulse')).map((f) => f.path);
    expect(pulsing).toEqual([]);
    const users = sources.filter((f) => f.text.includes("@/components/ui/Skeleton"));
    expect(users.length).toBeGreaterThanOrEqual(6);
  });

  it('anime le squelette avec le texte du thème, jamais un gris figé', () => {
    expect(globals).toMatch(
      /\.skeleton\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--tx[\s\S]{0,60}?9%, transparent\)/,
    );
    expect(globals).toContain('@keyframes skeleton-sweep');
    const block = globals.slice(globals.indexOf('prefers-reduced-motion: reduce'));
    expect(block).toMatch(/\.skeleton::after\s*\{\s*animation:\s*none/);
  });
});

describe('finition — cibles et noms accessibles', () => {
  it('déclare une cible tactile minimale et l’utilise dans les coquilles', () => {
    expect(globals).toMatch(/--tap-min:\s*40px/);
    expect(globals).toMatch(/\.touch-target\s*\{[^}]*min-width:\s*var\(--tap-min\)[^}]*min-height:\s*var\(--tap-min\)/);
    expect(read('src/shells/MobileShell.tsx')).toContain('touch-target');
  });

  it('ne laisse pas une commande icône seule sans nom accessible', () => {
    // Les cas relevés lors de l'audit : effacer la recherche, fermer un
    // panneau, relancer une analyse, revenir au début, ouvrir une liste.
    expect(read('app/bible/explorer.tsx')).toMatch(/setQuery\(''\)\}\s*\n\s*aria-label=/);
    expect(read('app/comparison/translation.tsx')).toMatch(/setAddOpen\(false\)\}\s*\n\s*aria-label=/);
    expect(read('app/analytics/dashboard.tsx')).toMatch(/aria-label=\{t\('analytics\.reload'/);
    expect(read('app/memory/flashcard.tsx')).toMatch(/aria-label=\{t\('memory\.restartReveal'/);
    expect(read('src/components/memorization/TranslationMenu.tsx')).toContain('aria-expanded={open}');
  });

  it('pose l’encre des surfaces d’état sur un jeton dédié', () => {
    expect(globals).toMatch(/--on-status:\s*#14100f/);
    expect(globals).toMatch(
      /\.bg-success,\s*\n\.bg-error,\s*\n\.bg-warning,\s*\n\.bg-info\s*\{[^}]*color:\s*var\(--on-status\)/,
    );
    expect(tailwind).toContain("'on-status': 'var(--on-status)'");
  });
});

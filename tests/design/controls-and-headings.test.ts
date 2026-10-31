/**
 * Contrat des COMMANDES et des TITRES DE CARTE.
 *
 * L'audit (avant ce lot), en comptant :
 *   • 2 interrupteurs maison dans des réglages (28 px et 32 px), là où
 *     `ui/Switch` existait déjà avec `role="switch"`, un nom accessible et une
 *     cible de 40 px ;
 *   • 1 cible de 23 px pour retirer une traduction comparée (`p-1` sur une
 *     icône seule) ;
 *   • 12 titres de carte écrits en `<p class="text-base font-bold">` : depuis
 *     que `h1|h2|h3` portent la serif du preset, ces cartes restaient des
 *     paragraphes en gras sans-serif — deux rôles de titre pour la même
 *     fonction.
 *
 * Ce fichier verrouille les trois décisions. Il lit les sources, jamais un
 * rendu : jsdom ne calcule pas la mise en page.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** Tous les écrans, hors atelier de développement (copy FR assumée). */
function screens(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(root, rel)).isDirectory()) {
        if (entry !== '__dev' && entry !== 'dev') walk(rel);
      } else if (/\.tsx$/.test(entry)) {
        out.push({ path: relative(root, join(root, rel)), text: read(rel) });
      }
    }
  };
  walk('app');
  return out;
}

describe('commandes — un seul interrupteur dans l’app', () => {
  const all = screens();

  it('aucun écran ne redessine un interrupteur (piste + pastille absolue)', () => {
    // La signature d'un faux interrupteur : une piste ronde et une pastille
    // positionnée en absolu. `ui/Switch` est le seul à en avoir le droit.
    const offenders = all
      .filter(({ text }) => /rounded-full[^"'`]*\babsolute\b|\babsolute[^"'`]*rounded-full/.test(text))
      .filter(({ text }) => /top-0\.5/.test(text) || /left-\[calc\(100%/.test(text))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('les réglages qui basculent un état passent par `ui/Switch`', () => {
    for (const path of ['app/settings/backup.tsx', 'app/settings/privacy.tsx']) {
      const text = read(path);
      expect(text, `${path} doit importer le Switch partagé`).toContain("from '@/components/ui/Switch'");
      expect(text, `${path} doit lui donner un nom accessible`).toMatch(/<Switch[\s\S]{0,220}?label=/);
    }
  });

  it('`ui/Switch` porte rôle, état et cible ≥ 40 px', () => {
    const text = read('src/components/ui/Switch.tsx');
    expect(text).toContain('role="switch"');
    expect(text).toContain('aria-checked=');
    expect(text).toMatch(/aria-label=\{label\}|aria-labelledby/);
    expect(text).toMatch(/min-height|h-10|touch-target/);
  });

  it('aucune commande icône seule ne descend sous la cible tactile', () => {
    // `p-1` / `p-0.5` sur une icône seule ≈ 23 px. `.touch-target` (40 px) est
    // la seule exception admise pour ces commandes.
    const offenders: string[] = [];
    for (const { path, text } of all) {
      for (const match of text.matchAll(/<button\b/g)) {
        const segment = text.slice(match.index ?? 0, (match.index ?? 0) + 700);
        const cls = /className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(segment);
        if (!cls) continue;
        const value = cls[1] ?? cls[2] ?? '';
        const tiny = /\bp-[01](?:\.5)?\b/.test(value);
        const padded = /touch-target|min-h-|\bh-1[01]\b/.test(value);
        if (tiny && !padded) offenders.push(`${path}: ${value.trim().slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('titres de carte — un seul rôle pour la même fonction', () => {
  it('aucun titre de carte n’est un `<p>` gras sans-serif', () => {
    // Les titres de carte passent par `h2`/`h3` : ils héritent alors la serif
    // du preset (règle 9 de `globals.css`) au lieu d'une graisse arbitraire.
    const offenders = screens()
      .filter(({ text }) => /className="[^"]*\btext-base\b[^"]*\bfont-bold\b[^"]*\btext-text-primary\b/.test(text))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('les titres de carte sont de vrais titres, pas des `div`', () => {
    const headings = ['app/settings/about.tsx', 'app/settings/available-translations.tsx', 'app/family/sync.tsx'];
    for (const path of headings) {
      const text = read(path);
      expect(text, `${path} doit poser un titre de carte`).toMatch(/<h[23] className="card-title/);
    }
  });

  it('une commande qui déplie un contenu annonce son état', () => {
    const text = read('app/settings/about.tsx');
    expect(text, 'le chevron de « Nouveautés » est une commande à part').toMatch(
      /<button[\s\S]{0,400}?aria-expanded=\{showWhatNew\}/,
    );
    expect(text, 'et elle a un nom accessible').toMatch(/aria-label=\{t\('common\.expandCollapse'/);
  });
});

describe('chiffres clés — une seule main', () => {
  const all = screens();
  const brandFiles = [
    // Logotype : le nom du produit n'est pas un chiffre clé.
    'app/splash.tsx',
    'src/components/navigation/DesktopRail.tsx',
    'src/components/navigation/HamburgerMenu.tsx',
    'app/(tabs)/settings.tsx',
    'app/settings/index.tsx',
  ];

  it('aucun grand chiffre en `font-extrabold` sans `.stat-value`', () => {
    const offenders = all
      .filter(({ path }) => !brandFiles.includes(path))
      .filter(({ text }) =>
        /\btext-(?:2xl|3xl|4xl|5xl)\b[^"'`]{0,60}\bfont-extrabold\b|\bfont-extrabold\b[^"'`]{0,60}\btext-(?:2xl|3xl|4xl|5xl)\b/.test(
          text,
        ),
      )
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('les écrans à statistiques portent `.stat-value`', () => {
    for (const path of [
      'app/analytics/dashboard.tsx',
      'app/review/History.tsx',
      'app/review/summary.tsx',
      'app/review/calendar.tsx',
      'app/comparison/result.tsx',
    ]) {
      expect(read(path), `${path} doit styler ses chiffres avec .stat-value`).toContain('stat-value');
    }
    // `progress.tsx` porte son échelle dans la feuille (grille dédiée) : c'est
    // le même rendu `.stat-value`, écrit une fois pour les quatre tuiles.
    expect(read('src/styles/globals.css')).toMatch(/\.progress-stat strong[\s\S]{0,160}?var\(--font-serif/);
  });

  it('un chiffre clé est tabulaire (pas de largeur qui danse)', () => {
    const css = read('src/styles/globals.css');
    expect(css).toMatch(/\.stat-value\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
  });
});

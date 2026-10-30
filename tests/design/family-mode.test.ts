/**
 * Contrat du MODE FAMILLE — 21 écrans qui doivent se lire comme UNE section.
 *
 * L'audit de finition (avant ce lot) :
 *   • 21 écrans, 3 685 lignes, aucun repère de navigation entre eux ;
 *   • deux héros de valeur différents (dégradé d'accent + `conic-gradient`
 *     inline) pour la même information ;
 *   • trois tailles d'avatar et trois façons d'écrire une liste de membres ;
 *   • des chargements en texte simple (« Chargement… ») à côté d'écrans qui
 *     avaient déjà un squelette.
 *
 * Ce fichier verrouille les décisions prises pour y remédier. Il lit les
 * sources, jamais un rendu : jsdom ne calcule pas la mise en page.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** Retire les commentaires de code : une règle citée ne doit pas passer. */
function stripCodeComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

/** Tous les écrans du mode Famille. */
function familyScreens(): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(root, dir))) {
      const rel = `${dir}/${entry}`;
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.tsx$/.test(entry)) out.push({ path: relative(root, join(root, rel)), text: read(rel) });
    }
  };
  walk('app/family');
  return out;
}

const screens = familyScreens();
const kit = read('src/components/family/FamilyKit.tsx');
const globals = read('src/styles/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');

describe('mode Famille — une section, pas huit pages isolées', () => {
  it('les six écrans de section portent la sous-navigation', () => {
    const hubs = [
      'app/family/home.tsx',
      'app/family/members.tsx',
      'app/family/challenges/index.tsx',
      'app/family/points.tsx',
      'app/family/activity.tsx',
      'app/family/settings.tsx',
    ];
    const missing = hubs.filter((hub) => {
      const text = stripCodeComments(read(hub));
      return !/FamilySubnav/.test(text);
    });
    expect(missing).toEqual([]);
  });

  it('la sous-navigation annonce la page courante et vient d’une seule brique', () => {
    expect(kit).toContain('export function FamilySubnav');
    expect(kit).toContain('aria-current={active ? \'page\' : undefined}');
    // Les écrans ne réimplémentent pas la barre : aucune `<nav>` de section ailleurs.
    const reimplemented = screens
      .filter(({ path }) => path !== 'src/components/family/FamilyKit.tsx')
      .filter(({ text }) => /aria-current="page"/.test(stripCodeComments(text)));
    expect(reimplemented.map((r) => r.path)).toEqual([]);
  });

  it('le style de la sous-navigation existe et différencie l’onglet actif', () => {
    expect(globals).toMatch(/\.family-subnav\s*\{[\s\S]{0,240}?overflow-x:\s*auto/);
    expect(globals).toMatch(/\.family-subnav-item\s*\{[\s\S]{0,300}?min-height:\s*36px/);
    expect(globals).toMatch(/\.family-subnav-item\[aria-current='page'\]\s*\{[\s\S]{0,160}?var\(--acc\)/);
  });

  it('les héros de valeur passent par `FamilyHero` (plus de conic-gradient inline)', () => {
    const gradients = screens.filter(({ text }) => /conic-gradient/.test(stripCodeComments(text)));
    expect(gradients.map((g) => g.path)).toEqual([]);
    expect(kit).toContain('export function FamilyHero');
    expect(kit).toMatch(/FamilyHero[\s\S]{0,1400}?<ProgressRing/);
  });
});

describe('mode Famille — une seule écriture par rôle', () => {
  it('les listes de membres passent par `MemberRow`', () => {
    const rows = ['app/family/members.tsx', 'app/family/home.tsx', 'app/family/leaderboard.tsx'];
    const missing = rows.filter((file) => !/MemberRow/.test(stripCodeComments(read(file))));
    expect(missing).toEqual([]);
    expect(kit).toContain('export function MemberRow');
  });

  it('aucun rayon littéral : les cartes viennent du thème', () => {
    const literal = screens.filter(({ text }) => /rounded-\[1[0-9]px\]|rounded-\[2[0-9]px\]/.test(stripCodeComments(text)));
    expect(literal.map((l) => l.path)).toEqual([]);
  });

  it('aucun emoji dans les écrans du mode Famille', () => {
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const guilty = screens.filter(({ text }) => emoji.test(stripCodeComments(text)));
    expect(guilty.map((g) => g.path)).toEqual([]);
  });

  it('les chargements utilisent le squelette partagé, jamais « Chargement… » nu', () => {
    const bare = screens.filter(({ text }) => {
      const code = stripCodeComments(text);
      return /<p[^>]*>\{t\('common\.loading'/.test(code) || /<p[^>]*>Chargement/.test(code);
    });
    expect(bare.map((b) => b.path)).toEqual([]);
  });

  it('les états vides viennent de `EmptyState`', () => {
    const adHoc = screens.filter(({ text }) => {
      const code = stripCodeComments(text);
      // Un CONTENEUR pointillé (div/section/p) qui n'est pas `EmptyState`.
      // Un cadre pointillé sur un `<button>` reste une zone d'action :
      // `join.tsx` propose le scan QR dans un cadre pointillé.
      const dashedContainer = /<(div|section|p)[^>]*border-dashed/.test(code);
      return dashedContainer && !/<EmptyState/.test(code);
    });
    expect(adHoc.map((a) => a.path)).toEqual([]);
    const usingEmptyState = screens.filter(({ text }) => /<EmptyState/.test(text)).length;
    expect(usingEmptyState).toBeGreaterThanOrEqual(4);
  });
});

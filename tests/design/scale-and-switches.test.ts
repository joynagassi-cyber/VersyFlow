/**
 * Contrat « UNE ÉCHELLE, UN INTERRUPTEUR, UNE LIGNE VIDE ».
 *
 * Trois familles de doublons mesurées dans l'audit :
 *
 *   1. **titres** — 26 `<h1>` hors échelle, dont quatre titres d'onglet
 *      (Accueil 40–52 px, Explorer/Progrès/Réglages 24 px) qui dessinaient
 *      leur propre barre CSS. Il ne reste que trois pas : `.display-title`
 *      (le prénom, le nom), `.page-title`, `.page-title-lg` — les trois en
 *      `clamp()`, tous les trois dans `globals.css` ;
 *   2. **interrupteurs** — `ui/Switch` (rôle, cible 40 px) coexistait avec un
 *      `.appearance-toggle` maison de 24 px de haut et un `Switch` React
 *      Native de compatibilité. Un seul dessin subsiste ;
 *   3. **lignes vides** — la même phrase de sous-liste vide s'écrivait en
 *      `text-sm` (sept écrans) et en `text-xs` (trois) : une seule classe,
 *      `.empty-line`, branchée sur `--mut`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const globals = read('src/styles/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');

describe('échelle de titres — trois pas, pas davantage', () => {
  it('chaque pas est fluide (`clamp`) et vient de la serif du preset', () => {
    for (const step of ['display-title', 'page-title', 'page-title-lg']) {
      const rule = new RegExp(`\\.${step}\\s*\\{[\\s\\S]{0,240}?\\}`);
      const block = globals.match(rule)?.[0] ?? '';
      expect(block, `.${step} existe`).not.toBe('');
      expect(block, `.${step} est fluide`).toContain('clamp(');
      expect(block, `.${step} prend la serif du preset`).toContain('--font-serif');
    }
  });

  it('`.display-title` ne sert qu’aux deux écrans qui nomment une personne', () => {
    const users = ['app/(tabs)/index.tsx', 'app/profile/index.tsx'];
    for (const path of users) expect(read(path), path).toContain('className="display-title');
    // Ailleurs, c'est `.page-title` : un écran ne monte pas à 52 px.
    for (const path of ['app/(tabs)/explore.tsx', 'app/(tabs)/progress.tsx', 'app/(tabs)/settings.tsx']) {
      expect(read(path), path).toContain('className="page-title');
      expect(read(path), path).not.toContain('display-title');
    }
  });

  it('les en-têtes d’onglet ne redessinent plus leur propre `<h1>`', () => {
    for (const selector of ['home-greeting h1', 'explore-heading h1', 'progress-heading h1', 'settings-heading h1']) {
      expect(globals, selector).not.toContain(`.${selector}`);
    }
  });
});

describe('interrupteurs — une seule implémentation', () => {
  it('`ui/Switch` porte le rôle, le nom accessible et la cible de 40 px', () => {
    const text = read('src/components/ui/Switch.tsx');
    expect(text).toContain('role="switch"');
    expect(text).toContain('aria-checked={checked}');
    expect(text, 'nom accessible obligatoire').toMatch(/label:\s*string/);
    expect(text, 'cible tactile ≥ 40 px').toMatch(/h-10/);
  });

  it('plus aucun écran ne redessine son interrupteur', () => {
    expect(globals, 'le dessin maison a disparu de la feuille').not.toContain('.appearance-toggle');
    const appearance = read('app/settings/appearance.tsx');
    expect(appearance).toContain("from '@/components/ui/Switch'");
    expect(appearance).not.toContain('aria-pressed={on}');
    const planner = read('src/components/reminders/WeeklyReminderPlanner.tsx');
    expect(planner).toContain('<Switch');
    expect(planner).not.toContain('appearance-toggle');
  });

  it('les réglages qui basculent quelque chose passent tous par `Switch`', () => {
    for (const path of ['app/family/settings.tsx', 'app/settings/appearance.tsx']) {
      const text = read(path);
      expect(text, path).toMatch(/<Switch\b|ui\/Switch/);
      expect(text, path).not.toContain('role="switch"');
    }
    // Les rappels délèguent leur interrupteur au planning, qui utilise `Switch`.
    expect(read('app/settings/reminders.tsx')).toContain('<WeeklyReminderPlanner');
  });
});

describe('lignes vides — une seule classe', () => {
  it('`.empty-line` vient du thème et suit le pas « sm »', () => {
    const block = globals.match(/\.empty-line\s*\{[\s\S]{0,160}?\}/)?.[0] ?? '';
    expect(block).not.toBe('');
    expect(block, 'encre du preset').toContain('var(--mut');
    expect(block, 'même pas que le texte secondaire').toContain('0.875rem');
  });

  it('les sous-listes vides des écrans sémantiques l’utilisent', () => {
    for (const path of ['app/semantic/index.tsx', 'app/semantic/concept.tsx', 'app/semantic/verse.tsx', 'app/semantic/community.tsx']) {
      const text = read(path);
      expect(text, path).toContain('className="empty-line"');
      expect(text, `${path} n’écrit plus l’état vide à la main`).not.toMatch(
        /<p className="text-(?:xs|sm) text-text-muted">\{t\('semantic\./,
      );
    }
  });
});

describe('en-têtes d’onglet — un matériau, un padding, une eyebrow', () => {
  const tabs = ['app/(tabs)/index.tsx', 'app/(tabs)/explore.tsx', 'app/(tabs)/progress.tsx', 'app/(tabs)/settings.tsx'];

  it('les quatre onglets ouvrent sur le même matériau (`g1 tab-heading`)', () => {
    for (const path of tabs) {
      const text = read(path);
      expect(text, path).toMatch(/className="g1 tab-heading \w+-\w+"/);
      expect(text, `${path} ne descend pas d’un cran de matériau`).not.toContain('g2 home-greeting');
    }
    expect(globals, 'un seul padding d’en-tête').toMatch(/\.tab-heading\s*\{[^}]*padding:\s*24px/);
    for (const selector of ['.explore-heading {', '.progress-heading {', '.settings-heading {']) {
      expect(globals, `${selector} a disparu`).not.toContain(selector);
    }
  });

  it('l’eyebrow d’un écran est `.section-label`, pas quatre classes maison', () => {
    for (const selector of ['.home-label', '.explore-label', '.progress-label', '.settings-eyebrow']) {
      expect(globals, selector).not.toContain(selector);
    }
    for (const path of tabs) expect(read(path), path).toContain('className="section-label"');
  });
});

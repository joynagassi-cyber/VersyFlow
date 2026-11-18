/**
 * Cascade des couleurs — le thème choisi doit vraiment peindre l'interface.
 *
 * Défauts constatés à l'écran (captures du 30/10) :
 *   · boutons roses au lieu du rouge de « Lara Red » ;
 *   · fond gris #171717 au lieu du noir OLED demandé ;
 *   · presets interchangeables, tous lavés de la même façon.
 *
 * Causes, mesurées sur les fichiers réels :
 *   · `--acc` était `color-mix(primary 45%, muted)` en sombre → #ff2056
 *     devenait #de7a92 (rose saumon), et c'est `--acc` que peignent les
 *     boutons de l'accueil ;
 *   · `--gc` valait `#171717` en dur, sans lien avec la carte du preset ;
 *   · `--color-background` venait du preset (#0a0a0a), jamais du noir pur.
 *
 * Ce test rejoue la cascade sur les vrais fichiers CSS (spécificité puis
 * ordre d'apparition) et vérifie les valeurs RÉSOLUES. Il ne remplace pas un
 * navigateur ; il empêche la réapparition exacte de ces trois régressions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

interface Decl {
  value: string;
  specificity: number;
  order: number;
}

/** Spécificité d'un sélecteur simple : `:root` (0,1,0) + `[attr]` (0,1,0) + élément (0,0,1). */
function specificityOf(selector: string): number {
  let score = 0;
  if (/\bhtml\b/.test(selector)) score += 1; // élément
  for (const match of selector.matchAll(/:root|\[[^\]]+\]/g)) {
    void match;
    score += 10; // pseudo-classe / attribut
  }
  return score;
}

/** Un sélecteur simple correspond-il au contexte `<html data-theme data-preset>` ? */
function matches(selector: string, attrs: Record<string, string>): boolean {
  const sel = selector.trim();
  if (!/^html?\b|^:root/.test(sel)) return false;
  if (/[\s>+~]/.test(sel.replace(/\[[^\]]*\]/g, ''))) return false;
  for (const match of sel.matchAll(/\[([a-z-]+)(?:=(=?)?['"]?([^'"\]]*)['"]?)?\]/gi)) {
    const name = match[1];
    const hasComparison = match[0].includes('=');
    if (!(name in attrs)) return false;
    // `[data-preset]` = simple présence ; `[data-preset='x']` = valeur exigée.
    if (hasComparison && attrs[name] !== match[3]) return false;
  }
  return true;
}

/** Extrait les déclarations de variables d'une feuille, hors commentaires. */
function declarations(css: string, attrs: Record<string, string>): Map<string, Decl> {
  const out = new Map<string, Decl>();
  let order = 0;
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Parcours linéaire : on ignore le contenu des at-rules (`@media`, `@supports`).
  let depth = 0;
  let atDepth = 0;
  let buffer = '';
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === '{') {
      const head = buffer.trim();
      buffer = '';
      depth += 1;
      if (head.startsWith('@')) {
        atDepth = depth;
        continue;
      }
      if (atDepth) continue;
      // Récupère le corps de la règle jusqu'à sa fermeture.
      let j = i + 1;
      let inner = '';
      let localDepth = 1;
      while (j < clean.length && localDepth > 0) {
        if (clean[j] === '{') localDepth += 1;
        if (clean[j] === '}') localDepth -= 1;
        if (localDepth > 0) inner += clean[j];
        j += 1;
      }
      order += 1;
      for (const selector of head.split(',')) {
        if (!matches(selector, attrs)) continue;
        const specificity = specificityOf(selector);
        for (const decl of inner.split(';')) {
          const idx = decl.indexOf(':');
          if (idx === -1) continue;
          const name = decl.slice(0, idx).trim();
          const value = decl.slice(idx + 1).trim();
          if (!name.startsWith('--') || !value) continue;
          const previous = out.get(name);
          if (!previous || specificity > previous.specificity || (specificity === previous.specificity && order >= previous.order)) {
            out.set(name, { value, specificity, order });
          }
        }
      }
      i = j - 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (atDepth && depth < atDepth) atDepth = 0;
      buffer = '';
      continue;
    }
    buffer += ch;
  }
  return out;
}

/** Résout les `var(--x)` en chaîne, avec la carte des déclarations gagnantes. */
function resolveVar(name: string, map: Map<string, Decl>, depth = 0): string | null {
  if (depth > 12) return null;
  const entry = map.get(name);
  if (!entry) return null;
  const match = entry.value.match(/^var\((--[\w-]+)(?:,\s*([^)]+))?\)$/);
  if (!match) return entry.value;
  return resolveVar(match[1], map, depth + 1) ?? (match[2] ?? null);
}

const globalsCss = readFileSync(resolve(ROOT, 'src/styles/globals.css'), 'utf8');
const vendoredCss = readFileSync(resolve(ROOT, 'src/styles/vendored-themes.css'), 'utf8');
const tweakcnCss = readFileSync(resolve(ROOT, 'src/styles/tweakcn-presets.css'), 'utf8');

// Ordre d'import de src/main.tsx : globals → tweakcn → vendored.
const SHEETS = [globalsCss, tweakcnCss, vendoredCss];

function theme(attrs: Record<string, string>): Map<string, Decl> {
  const merged = new Map<string, Decl>();
  let offset = 0;
  for (const sheet of SHEETS) {
    for (const [name, decl] of declarations(sheet, attrs)) {
      const previous = merged.get(name);
      const candidate = { ...decl, order: decl.order + offset };
      if (
        !previous ||
        candidate.specificity > previous.specificity ||
        (candidate.specificity === previous.specificity && candidate.order >= previous.order)
      ) {
        merged.set(name, candidate);
      }
    }
    offset += 10_000;
  }
  return merged;
}

const darkLaraRed = theme({ 'data-theme': 'dark', 'data-preset': 'lara-red' });
const lightLaraRed = theme({ 'data-theme': 'light', 'data-preset': 'lara-red' });

describe('l’accent est la primaire du preset, pas un mélange', () => {
  it('« Lara Red » en sombre peint avec #ff2056 (et non un rose délavé)', () => {
    expect(resolveVar('--acc', darkLaraRed)).toBe('#ff2056');
  });

  it('« Lara Red » en clair peint avec #fb2c36', () => {
    expect(resolveVar('--acc', lightLaraRed)).toBe('#fb2c36');
  });

  it('aucune désaturation de l’accent ne subsiste', () => {
    expect(globalsCss).not.toMatch(/--acc:\s*color-mix\(in srgb, var\(--color-primary\) 45%/);
  });

  it('un autre preset donne une autre couleur', () => {
    const emerald = theme({ 'data-theme': 'light', 'data-preset': 'emerald' });
    expect(resolveVar('--acc', emerald)).not.toBe(resolveVar('--acc', lightLaraRed));
  });
});

describe('le fond est absolu, les surfaces suivent le preset', () => {
  it('noir pur en sombre (OLED)', () => {
    expect(resolveVar('--color-background', darkLaraRed)).toBe('#000000');
  });

  it('blanc pur en clair', () => {
    expect(resolveVar('--color-background', lightLaraRed)).toBe('#ffffff');
  });

  it('les cartes prennent la surface du preset, plus un gris figé', () => {
    expect(resolveVar('--gc', darkLaraRed)).toBe('#18181b');
    expect(resolveVar('--gc', lightLaraRed)).toBe('#fdfdfd');
  });

  it('le texte suit le preset dans les deux modes', () => {
    expect(resolveVar('--tx', darkLaraRed)).toBe('#fafafa');
    expect(resolveVar('--tx', lightLaraRed)).toBe('#0a0a0a');
  });
});

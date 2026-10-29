/**
 * Garde-fou : aucune couleur en dur dans le code d'interface.
 *
 * §3.3 et §10 du cahier des charges : un thème ne peut pas recolorer une
 * valeur écrite en dur. Ce test échoue dès qu'un `#rrggbb` apparaît dans un
 * fichier d'interface, sauf exception documentée ci-dessous.
 *
 * Les exceptions ne sont pas des oublis : chacune est justifiée, et la liste
 * doit rester courte. Ajouter une ligne ici est une décision de design.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

/** Fichiers autorisés à contenir une couleur littérale, avec la raison. */
const ALLOWED: Record<string, string> = {
  'src/components/ui/Primitives.tsx':
    'repli d’une ombre native lue à l’exécution, avant que React n’applique le style du parent',
};

/**
 * Périmètre : le code d'INTERFACE. Les registres de thème (src/theme/**),
 * les feuilles globales (src/styles/**) et les services portent par nature
 * des définitions de couleurs — les scanner n'aurait pas de sens.
 */
const SCOPES = ['app', 'src/components'];

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts)$/.test(entry) && !/\.test\./.test(entry)) acc.push(full);
  }
  return acc;
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

/**
 * Une ligne est un usage de STYLE si la couleur sert à peindre : attribut
 * style, classe utilitaire arbitraire, ou propriété CSS nommée. Une couleur
 * citée dans un libellé traduit (« Blanc pur #FFFFFF ») n'en est pas un.
 */
const STYLE_CONTEXT = /(style=|className=|\[#|background|backgroundColor|color:|colour|border(?!-)|fill=|stroke=|shadow|gradient)/i;
/** Une ligne de libellé ou de commentaire cite la couleur sans la peindre. */
const LABEL_CONTEXT = /(t\(|\bt\(|label|title=|aria-label|comments?\b|\/\/|\/\*)/i;

function offendingLines(source: string): Array<{ line: number; text: string; hex: string[] }> {
  const out: Array<{ line: number; text: string; hex: string[] }> = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('*')) return;
    const hits = line.match(HEX);
    if (!hits) return;
    if (!STYLE_CONTEXT.test(line)) return;
    if (LABEL_CONTEXT.test(line)) return;
    out.push({ line: index + 1, text: line.slice(0, 120), hex: [...new Set(hits)] });
  });
  return out;
}

describe('couleurs en dur', () => {
  const files = SCOPES.flatMap((scope) => walk(join(root, scope)));

  it('aucune couleur littérale dans le code d’interface hors exceptions', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(root, file).split('\\').join('/');
      if (ALLOWED[rel]) continue;
      const hits = offendingLines(readFileSync(file, 'utf8'));
      for (const hit of hits) {
        offenders.push(`${rel}:${hit.line} → ${hit.hex.join(', ')} | ${hit.text}`);
      }
    }
    if (offenders.length) {
      throw new Error(
        `${offenders.length} fichier(s) portent une couleur en dur :\n${offenders.join('\n')}`,
      );
    }
    expect(offenders).toEqual([]);
  });

  it('les exceptions restent peu nombreuses et documentées', () => {
    const entries = Object.entries(ALLOWED);
    expect(entries.length).toBeLessThanOrEqual(3);
    for (const [, reason] of entries) expect(reason.length).toBeGreaterThan(20);
  });
});

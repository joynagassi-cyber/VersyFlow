/**
 * Squelettes de chargement — deux défauts signalés :
 *
 *  1. « il disparaît vite » : le squelette apparaissait puis s'effaçait dans la
 *     même fraction de seconde sur un chargement rapide (cache chaud). Un
 *     clignotement gris se lit comme un bug, pas comme une attente. Il n'est
 *     donc montré qu'au-delà de 220 ms.
 *  2. « trop dur en termes de couleur » : la masse était un aplat de
 *     `--color-text-primary` à 8-10 %, sans relief et plus clair que la carte
 *     qui l'entourait. Remplacé par deux jetons par thème + un balayage doux.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { ScreenSkeleton, SkeletonLines } from '@/components/ui/ScreenSkeleton';

const CSS = readFileSync(resolve(__dirname, '../../src/styles/globals.css'), 'utf8');

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('délai d’apparition', () => {
  it('reste invisible pendant les 220 premiers millisecondes', () => {
    render(<ScreenSkeleton rows={2} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('data-visible', 'false');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(status).toHaveAttribute('data-visible', 'false');
  });

  it('apparaît une fois le délai écoulé, sans changer d’occupation d’espace', () => {
    render(<ScreenSkeleton rows={2} />);
    const status = screen.getByRole('status');
    const cardsBefore = status.querySelectorAll('.skeleton-card').length;

    act(() => {
      vi.advanceTimersByTime(260);
    });

    expect(status).toHaveAttribute('data-visible', 'true');
    // La silhouette est montée dès le premier rendu : l'espace est réservé,
    // seul le fondu change (aucun décalage de mise en page).
    expect(status.querySelectorAll('.skeleton-card')).toHaveLength(cardsBefore);
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('peut être forcé immédiatement (captures, tests du squelette lui-même)', () => {
    render(<ScreenSkeleton rows={1} delay={0} />);
    expect(screen.getByRole('status')).toHaveAttribute('data-visible', 'true');
  });

  it('applique le même délai aux lignes de texte', () => {
    render(<SkeletonLines lines={2} />);
    const container = document.querySelector('.skeleton-lines');
    expect(container).toHaveAttribute('data-visible', 'false');
    act(() => {
      vi.advanceTimersByTime(260);
    });
    expect(container).toHaveAttribute('data-visible', 'true');
  });

  it('annule son minuteur au démontage', () => {
    const { unmount } = render(<ScreenSkeleton />);
    unmount();
    expect(() =>
      act(() => {
        vi.advanceTimersByTime(500);
      }),
    ).not.toThrow();
  });
});

describe('teintes du squelette', () => {
  it('dérive ses couleurs de jetons, pas d’un aplat de texte', () => {
    expect(CSS).toMatch(/--skeleton-base:\s*color-mix\(/);
    expect(CSS).toMatch(/--skeleton-sheen:\s*color-mix\(/);

    // La règle de base ne peint plus la masse avec le texte : elle consomme
    // les jetons dédiés. (Les ombres du reste du fichier, elles, peuvent
    // toujours dériver du texte — d'où l'inspection ciblée du bloc.)
    const rule = CSS.slice(CSS.indexOf('.skeleton-bar,\n.skeleton-card {'));
    const block = rule.slice(0, rule.indexOf('}'));
    expect(block).toContain('var(--skeleton-base)');
    expect(block).not.toContain('--color-text-primary');
  });

  it('définit une variante pour le thème sombre', () => {
    const dark = CSS.slice(CSS.indexOf(":root {\n  --skeleton-base"));
    const darkBlock = dark.slice(dark.indexOf("[data-theme='dark']"));
    expect(darkBlock).toMatch(/--skeleton-base:/);
    expect(darkBlock).toMatch(/--skeleton-sheen:/);
  });

  it('suit l’échelle de rayons du thème', () => {
    expect(CSS).toMatch(/\.skeleton-card\s*{[^}]*border-radius:\s*calc\(var\(--radius-large/);
  });

  it('arrête tout mouvement sous prefers-reduced-motion', () => {
    const reduced = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toMatch(/\.skeleton-bar\s*{\s*animation:\s*none;/);
  });

  it('ne boucle jamais indéfiniment', () => {
    const rules = CSS.split('\n').filter((line) => line.includes('animation: skeleton-sheen'));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule).not.toMatch(/infinite/);
  });
});

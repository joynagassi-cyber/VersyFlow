/**
 * Le repli de route — plusieurs formes, une par famille d'écran.
 *
 * Ce que ces tests tiennent : les 91 routes paresseuses partageaient UN repli
 * (`BootSplash`, dessin de l'amorçage). Ouvrir `/review/queue` montrait donc
 * la forme de l'accueil. Ici on vérifie trois choses :
 *
 *   1. le classement d'une route dans une famille de forme (et l'ordre des
 *      règles : l'atelier de mémorisation n'est pas une session) ;
 *   2. que les six familles rendent des géométries DIFFÉRENTES — sinon « six
 *      variantes » ne serait qu'un nom sur un seul bloc ;
 *   3. que chaque repli annonce son attente (`role="status"`, texte réel) et
 *      garde tout son décor `aria-hidden`.
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RouteFallback,
  RouteSkeleton,
  skeletonKindFor,
  type SkeletonKind,
} from '@/components/ui/RouteSkeletons';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const root = process.cwd();

describe('repli de route — classement', () => {
  const cases: [string, SkeletonKind][] = [
    ['/bible/explorer/jean/3', 'reader'],
    ['/semantic/verse', 'reader'],
    ['/memorization/workspace', 'workspace'],
    ['/memorization/session', 'exercise'],
    ['/memorization/flashcard', 'exercise'],
    ['/memory/recall-writing', 'exercise'],
    ['/review/session', 'exercise'],
    ['/review/queue', 'list'],
    ['/notes', 'list'],
    ['/family/members', 'list'],
    ['/tabs/progress', 'dashboard'],
    ['/analytics/dashboard', 'dashboard'],
    ['/tabs/home', 'dashboard'],
    ['/settings/appearance', 'form'],
    ['/profile/create', 'form'],
    ['/onboarding/welcome', 'form'],
  ];

  it.each(cases)('%s → %s', (pathname, kind) => {
    expect(skeletonKindFor(pathname)).toBe(kind);
  });

  it('l’atelier n’est pas confondu avec la session', () => {
    // Les deux commencent par `/memorization` : l'ordre des règles décide.
    expect(skeletonKindFor('/memorization/workspace')).not.toBe(
      skeletonKindFor('/memorization/session'),
    );
  });

  it('une route inconnue tombe sur un formulaire, jamais sur rien', () => {
    expect(skeletonKindFor('/une/route/inattendue')).toBe('form');
  });
});

describe('repli de route — six formes réellement différentes', () => {
  const kinds: SkeletonKind[] = ['reader', 'exercise', 'workspace', 'list', 'dashboard', 'form'];

  it('chaque famille dessine une géométrie distincte', () => {
    const signatures = kinds.map((kind) => {
      const { container, unmount } = render(<RouteSkeleton kind={kind} label="Chargement…" />);
      const signature = Array.from(container.querySelectorAll('.skeleton'))
        .map((node) => node.className.replace('skeleton', '').trim())
        .join('|');
      unmount();
      return signature;
    });
    expect(new Set(signatures).size).toBe(kinds.length);
  });

  it('aucune famille ne reprend le dessin de l’amorçage', () => {
    // L'amorçage a trois cartes et cinq pastilles d'onglets ; aucun repli de
    // route ne doit les reproduire, sinon on n'a rien changé.
    for (const kind of kinds) {
      const { container, unmount } = render(<RouteSkeleton kind={kind} label="…" />);
      expect(container.querySelectorAll('.h-7.w-11.rounded-full').length).toBe(0);
      unmount();
    }
  });

  it('chaque famille annonce son attente et masque son décor', () => {
    for (const kind of kinds) {
      const { container, unmount } = render(<RouteSkeleton kind={kind} label="Un instant" />);
      const status = container.querySelector('[role="status"]');
      expect(status).not.toBeNull();
      expect(status?.getAttribute('aria-busy')).toBe('true');
      expect(container.textContent).toContain('Un instant');
      container.querySelectorAll('.skeleton').forEach((block) => {
        expect(block.closest('[aria-hidden="true"]')).not.toBeNull();
      });
      unmount();
    }
  });
});

describe('repli de route — monté par le routeur', () => {
  it('suit l’URL courante', () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/review/queue']}>
        <RouteFallback />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain('liste');
    unmount();
  });

  it('annonce l’atelier avec son propre libellé', () => {
    const { container, unmount } = render(
      <MemoryRouter initialEntries={['/memorization/workspace']}>
        <RouteFallback />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain('verset');
    unmount();
  });
});

describe('repli de route — branché dans main.tsx', () => {
  const main = readFileSync(join(root, 'src/main.tsx'), 'utf8');

  it('le routeur est enveloppé d’un Suspense dont le repli suit la route', () => {
    expect(main).toContain('<Suspense fallback={<RouteFallback />}>');
  });

  it('l’amorçage garde son propre repli', () => {
    // Deux questions différentes : « quelle forme ? » (route) et « l'app
    // est-elle prête ? » (stores + i18n).
    expect(main).toContain('<Suspense fallback={<BootSplash />}>');
  });
});

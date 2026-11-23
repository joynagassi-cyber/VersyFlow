/**
 * Navigation au clavier — évitement, focus de route, zoom.
 *
 * Ce que ces tests tiennent (playbook H01, H04, H05, C02) :
 *
 *  1. un **lien d'évitement** existe, il est le premier élément focusable et
 *     il pointe vers la région principale réellement présente dans les deux
 *     coquilles ;
 *  2. le **focus est déplacé** après une navigation, une seule fois, sans
 *     voler un focus déjà posé dans le contenu, et jamais avant le premier
 *     rendu ;
 *  3. **le zoom n'est plus bloqué** : `user-scalable=no` interdisait à une
 *     personne malvoyante d'agrandir un verset. C'était le pire défaut de la
 *     liste, et il tenait à un attribut.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useRouteFocus } from '@/hooks/useRouteFocus';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('lien d’évitement', () => {
  const mobile = read('src/shells/MobileShell.tsx');
  const desktop = read('src/shells/DesktopShell.tsx');
  const skip = read('src/components/layout/SkipLink.tsx');

  it('les deux coquilles le montent avant leur navigation', () => {
    // Il doit précéder le tiroir et le rail : sinon il arriverait après les
    // vingt commandes qu'il sert justement à éviter.
    expect(mobile.indexOf('<SkipLink />')).toBeLessThan(mobile.indexOf('<HamburgerMenu />'));
    expect(desktop.indexOf('<SkipLink />')).toBeLessThan(desktop.indexOf('<DesktopRail />'));
  });

  it('il vise la région principale qui existe vraiment', () => {
    expect(skip).toContain('href="#main-content"');
    expect(skip).toContain("getElementById('main-content')");
    const ids = [
      ...mobile.matchAll(/id="main-content"/g),
      ...desktop.matchAll(/id="main-content"/g),
    ];
    expect(ids.length).toBe(2);
  });

  it('il déplace le focus, pas seulement l’URL', () => {
    expect(skip).toContain('target.focus(');
  });
});

describe('focus de route', () => {
  it('n’agit pas au premier rendu', () => {
    const source = read('src/hooks/useRouteFocus.ts');
    expect(source).toMatch(/isFirst\.current/);
    expect(source).toMatch(/isFirst\.current = false;\s*\n\s*return;/);
  });

  it('respecte un focus déjà posé dans le contenu', () => {
    const source = read('src/hooks/useRouteFocus.ts');
    expect(source).toContain("active.closest('#main-content')");
    expect(source).toMatch(/if \(insideMain\) return;/);
  });

  it('est monté une seule fois, pour les deux coquilles', () => {
    expect(read('src/shells/AppShell.tsx')).toContain('useRouteFocus()');
    // Monter le hook dans chaque coquille le ferait tirer deux fois.
    expect(read('src/shells/MobileShell.tsx')).not.toContain('useRouteFocus');
    expect(read('src/shells/DesktopShell.tsx')).not.toContain('useRouteFocus');
  });

  it('déplace le focus sur le titre de l’écran après navigation', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const container = document.createElement('div');
    container.id = 'main-content';
    const heading = document.createElement('h1');
    heading.textContent = 'Écran A';
    container.append(heading);
    document.body.append(container);

    const rootReact = createRoot(host);
    let navigateTo: ((path: string) => void) | null = null;

    function Screen({ title }: { title: string }) {
      const navigate = useNavigate();
      navigateTo = (path: string) => navigate(path);
      useRouteFocus();
      return <p>{title}</p>;
    }

    await act(async () => {
      rootReact.render(
        <MemoryRouter initialEntries={['/a']}>
          <Routes>
            <Route path="/a" element={<Screen title="A" />} />
            <Route path="/b" element={<Screen title="B" />} />
          </Routes>
        </MemoryRouter>,
      );
    });
    // Premier rendu : le focus n'a pas bougé.
    expect(document.activeElement).not.toBe(heading);

    await act(async () => {
      navigateTo?.('/b');
    });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');

    await act(async () => rootReact.unmount());
    host.remove();
    container.remove();
  });
});

describe('zoom', () => {
  const html = read('index.html');

  it('la balise viewport n’interdit plus l’agrandissement', () => {
    expect(html).not.toContain('user-scalable=no');
    expect(html).not.toContain('maximum-scale=1');
  });

  it('elle garde les encoches', () => {
    expect(html).toContain('viewport-fit=cover');
  });
});

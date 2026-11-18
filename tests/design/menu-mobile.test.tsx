/**
 * Menu mobile — sections dépliables, en-tête fixe.
 *
 * Demande produit (2026-10-30) : la liste plate de dix entrées était trop
 * basique. Le menu doit regrouper les fonctions par section dépliable, et
 * garder le profil, le nom de la personne et les réglages **hors de la zone
 * qui défile**, accessibles d'un seul geste.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu';
import { ICON_SIZES } from '@/components/ui/DuoIcon';
import { ALL_MENU_ITEMS, useUiStore } from '@/store/ui-store';

const renderMenu = () =>
  render(
    <MemoryRouter initialEntries={['/tabs/home']}>
      <HamburgerMenu />
    </MemoryRouter>,
  );

beforeEach(() => {
  useUiStore.setState({
    menuOpen: true,
    visibleMenuPaths: ALL_MENU_ITEMS.map((i) => i.path),
  });
});

afterEach(() => {
  cleanup();
});

describe('menu mobile — structure', () => {
  it('regroupe les entrées en six sections dépliables', () => {
    renderMenu();
    const headings = ['Lire', 'Mémoriser', 'Progression', 'Ma collection', 'Communauté', 'Apparence'];
    for (const label of headings) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
    // Un seul groupe ouvert au départ : le menu ne s'ouvre jamais sur du vide.
    const expanded = headings
      .map((label) => screen.getByRole('button', { name: new RegExp(label) }))
      .filter((el) => el.getAttribute('aria-expanded') === 'true');
    expect(expanded).toHaveLength(1);
    expect(expanded[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('chaque en-tête de section pilote un panneau identifiable', () => {
    renderMenu();
    const header = screen.getByRole('button', { name: /^Lire/ });
    const panelId = header.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).not.toBeNull();
    expect(header.getAttribute('aria-expanded')).toBe('true');
  });

  it('un clic ouvre un groupe et referme le précédent', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: 'Bible' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Progression/ }));

    expect(screen.getByRole('button', { name: /^Progression/ }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(screen.getByRole('button', { name: 'Révisions' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bible' })).toBeNull();
    expect(screen.getByRole('button', { name: /^Lire/ }).getAttribute('aria-expanded')).toBe('false');
  });

  it('un second clic referme le groupe (aucun panneau vide affiché)', () => {
    renderMenu();
    const header = screen.getByRole('button', { name: /^Lire/ });
    fireEvent.click(header);
    expect(screen.getByRole('button', { name: /^Lire/ }).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Bible' })).toBeNull();
  });
});

describe('menu mobile — lisibilité des icônes', () => {
  // Les icônes Solar portent leur taille dans `style.width` (prop `size`),
  // pas dans un attribut `width`.
  const iconSize = (svg: Element): number => {
    const raw = (svg as SVGElement).style.width || svg.getAttribute('width') || '';
    return Number.parseFloat(raw);
  };

  it('aucune icône du menu ne descend sous 16 px (ICON_SIZES.sm)', () => {
    const { container } = renderMenu();
    const sizes = Array.from(container.querySelectorAll('svg')).map(iconSize).filter(Number.isFinite);
    expect(sizes.length).toBeGreaterThan(5);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(ICON_SIZES.sm);
  });

  it('les pictogrammes de section font 24 px (ICON_SIZES.lg)', () => {
    const { container } = renderMenu();
    const sectionIcon = container.querySelector('[id^="menu-section-read-button"] svg');
    expect(sectionIcon).not.toBeNull();
    expect(iconSize(sectionIcon!)).toBe(ICON_SIZES.lg);
  });

  it('toutes les icônes du menu tiennent dans l’échelle à trois tailles', () => {
    const { container } = renderMenu();
    const sizes = new Set(
      Array.from(container.querySelectorAll('svg')).map(iconSize).filter(Number.isFinite),
    );
    for (const size of sizes) {
      expect(Object.values(ICON_SIZES)).toContain(size);
    }
  });
});

describe('menu mobile — en-tête fixe', () => {
  it('le profil, le nom et les réglages sont hors de la zone défilante', () => {
    renderMenu();
    const nav = screen.getByRole('navigation', { name: /Navigation/ });
    const profile = screen.getByRole('button', { name: 'Ouvrir mon profil' });
    const settings = screen.getByRole('button', { name: 'Réglages' });
    const close = screen.getByRole('button', { name: 'Fermer le menu' });

    for (const control of [profile, settings, close]) {
      expect(nav.contains(control)).toBe(false);
    }
    // Seul le <nav> défile : l'en-tête et le pied restent en place.
    expect(nav.className).toContain('overflow-y-auto');
    expect(profile.textContent).toContain('VersyFlow');
  });

  it('le focus entre dans le tiroir et Échap le referme', () => {
    renderMenu();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fermer le menu' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useUiStore.getState().menuOpen).toBe(false);
  });

  it('le nom de la personne est visible dans l’en-tête', () => {
    useUiStore.setState({ menuOpen: true });
    renderMenu();
    expect(screen.getByText('Mode local')).toBeInTheDocument();
  });
});

describe('menu mobile — visibilité', () => {
  it('respecte les interrupteurs de Réglages → Navigation', () => {
    useUiStore.setState({
      menuOpen: true,
      visibleMenuPaths: ALL_MENU_ITEMS.map((i) => i.path).filter((p) => p !== '/search'),
    });
    renderMenu();
    expect(screen.queryByRole('button', { name: 'Recherche' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Bible' })).toBeInTheDocument();
  });

  it('un groupe dont toutes les entrées sont masquées disparaît', () => {
    useUiStore.setState({
      menuOpen: true,
      visibleMenuPaths: ALL_MENU_ITEMS.map((i) => i.path).filter((p) => p !== '/family/home'),
    });
    renderMenu();
    expect(screen.queryByRole('button', { name: /^Communauté/ })).toBeNull();
  });
});

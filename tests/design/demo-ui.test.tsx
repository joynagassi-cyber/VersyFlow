/**
 * Démo — interface : la pastille « Démo » et le panneau d'explication.
 *
 * Vérifie ce que l'utilisateur voit réellement : le mode fictif est identifié,
 * le panneau nomme les actions simulées, et le bouton de réinitialisation ne
 * touche qu'à l'espace de démo.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const NATIVE_GET_ITEM = Storage.prototype.getItem;
const NATIVE_SET_ITEM = Storage.prototype.setItem;
const NATIVE_REMOVE_ITEM = Storage.prototype.removeItem;
const NATIVE_CLEAR = Storage.prototype.clear;

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
  Storage.prototype.getItem = NATIVE_GET_ITEM;
  Storage.prototype.setItem = NATIVE_SET_ITEM;
  Storage.prototype.removeItem = NATIVE_REMOVE_ITEM;
  Storage.prototype.clear = NATIVE_CLEAR;
  vi.resetModules();
  NATIVE_CLEAR.call(window.localStorage);
  window.history.replaceState({}, '', '/');
});

describe('identification du mode démo', () => {
  it('affiche la pastille DÉMO et mène au panneau /dev', async () => {
    const { DemoModeBadge } = await import('@/components/dev/DemoModeBadge');
    render(
      <MemoryRouter initialEntries={['/']}>
        <DemoModeBadge />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const badge = screen.getByTestId('demo-mode-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAccessibleName(/démo/i);

    fireEvent.click(badge);
    expect(screen.getByTestId('location')).toHaveTextContent('/dev');
  });

  it('le panneau décrit les limites des actions simulées', async () => {
    const { DemoModePanel } = await import('@/components/dev/DemoModePanel');
    render(
      <MemoryRouter>
        <DemoModePanel />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('demo-mode-panel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réinitialiser la démo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quitter la démo/i })).toBeInTheDocument();
    // Les limites sont écrites, pas seulement suggérées.
    expect(screen.getByText(/notifications ne sont pas programmées/i)).toBeInTheDocument();
    expect(screen.getByText(/synchronisation/i)).toBeInTheDocument();
  });

  it('réinitialiser la démo ne supprime aucune clé réelle', async () => {
    localStorage.setItem('versyflow:collections', '["vraie-collection"]');

    const { installStorageIsolation } = await import('@/dev/mock/storage-scope');
    installStorageIsolation();
    const { ensureMockSeed } = await import('@/dev/mock/seed');
    ensureMockSeed();
    localStorage.setItem('versyflow:collections', '["collection-demo"]');

    const { resetDemoSession } = await import('@/dev/demo-session');
    const result = resetDemoSession();

    expect(result.clearedKeys).toBeGreaterThan(0);
    expect(result.seeded).toBe(true);
    // La valeur réelle est toujours là, à son emplacement d'origine.
    expect(NATIVE_GET_ITEM.call(window.localStorage, 'versyflow:collections')).toBe(
      '["vraie-collection"]',
    );
    // La démo a bien été re-semée dans son espace.
    expect(localStorage.getItem('versyflow:collections')).toBeNull();
  });
});

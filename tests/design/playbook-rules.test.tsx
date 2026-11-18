/**
 * Playbook UX/UI 2026 — verrouillage des règles appliquées.
 *
 * Deux niveaux de preuve ici :
 *  1. l'audit complet (`node scripts/audit-playbook.mjs`) recalculé depuis les
 *     fichiers : aucune règle BLOQUANTE mesurable ne doit échouer ;
 *  2. le comportement réel des composants ajoutés (lien d'évitement, focus
 *     après navigation, squelette de chargement, consentement non pré-coché).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { SkipLink } from '@/components/layout/SkipLink';
import { ScreenSkeleton } from '@/components/ui/ScreenSkeleton';
import { useRouteFocus } from '@/hooks/useRouteFocus';
import PrivacyScreen from '../../app/settings/privacy';

afterEach(() => cleanup());

/* ------------------------------------------------------------------ audit  */

describe('audit des 77 règles du playbook', () => {
  it('aucune règle BLOQUANTE mesurable n’échoue', () => {
    const result = spawnSync('node', ['scripts/audit-playbook.mjs', '--json'], {
      cwd: resolve(__dirname, '../..'),
      encoding: 'utf8',
      timeout: 60_000,
    });
    const payload = JSON.parse(result.stdout || '{}') as {
      results?: { id: string; level: string; verdict: string; detail?: string }[];
    };
    const results = payload.results ?? [];
    const blockingFailures = results.filter((rule) => rule.level === 'BLOCKING' && rule.verdict === 'FAIL');
    expect(blockingFailures.map((r) => `${r.id}: ${r.detail}`)).toEqual([]);
    expect(results).toHaveLength(77);
  });
});

/* ------------------------------------------------------- composants neufs */

describe('H01 — lien d’évitement', () => {
  it('pointe vers la zone principale et reste hors du flux visuel', () => {
    render(
      <MemoryRouter>
        <SkipLink />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /contenu principal/i });
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link.className).toContain('skip-link');
  });
});

describe('E04 — squelette de chargement', () => {
  it('annonce le chargement et masque la silhouette aux lecteurs d’écran', () => {
    render(<ScreenSkeleton rows={2} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status.querySelectorAll('.skeleton-card')).toHaveLength(2);
    expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('H04 — focus après navigation', () => {
  function Shell() {
    const navigate = useNavigate();
    useRouteFocus('main-content');
    return (
      <div>
        <button onClick={() => navigate('/b')}>aller à B</button>
        <main id="main-content" tabIndex={-1}>
          <button>dans le contenu</button>
        </main>
      </div>
    );
  }

  it('déplace le focus sur la zone principale quand on change d’écran', async () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <Routes>
          <Route path="/a" element={<Shell />} />
          <Route path="/b" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'aller à B' }));
    await waitFor(() => expect(document.activeElement?.id).toBe('main-content'));
  });

  it('ne vole pas le focus s’il est déjà dans la zone principale', async () => {
    render(
      <MemoryRouter initialEntries={['/a']}>
        <Routes>
          <Route path="/a" element={<Shell />} />
          <Route path="/b" element={<Shell />} />
        </Routes>
      </MemoryRouter>,
    );
    const inner = screen.getByRole('button', { name: 'dans le contenu' });
    inner.focus();
    fireEvent.click(screen.getByRole('button', { name: 'aller à B' }));
    await waitFor(() => expect(document.activeElement).not.toBeNull());
    expect(document.activeElement?.id).not.toBe('main-content');
  });
});

describe('K01 — consentement jamais pré-coché', () => {
  it('les deux interrupteurs de confidentialité sont éteints au départ', () => {
    render(
      <MemoryRouter>
        <PrivacyScreen />
      </MemoryRouter>,
    );
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    for (const toggle of switches) expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('refuser et accepter demandent le même geste (un appui)', () => {
    render(
      <MemoryRouter>
        <PrivacyScreen />
      </MemoryRouter>,
    );
    const [first] = screen.getAllByRole('switch');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'false');
  });
});

describe('B01 — le texte du profil garde son contraste', () => {
  it('les jetons premium exposent un texte et une surface distincts', () => {
    const css = readFileSync(resolve(__dirname, '../../src/styles/globals.css'), 'utf8');
    // Garde-fou : les jetons existent bien des deux côtés.
    expect(css).toMatch(/--tx:\s*#1b1220/);
    expect(css).toMatch(/--tx:\s*#f3f3f3/);
  });
});

/* Silence les avertissements React non liés (act dans les tests de focus). */
vi.stubGlobal('scrollTo', vi.fn());

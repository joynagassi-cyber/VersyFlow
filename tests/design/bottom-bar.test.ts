/**
 * Barre d'onglets — configuration réelle, pas un simple interrupteur.
 *
 * Demande produit (30/10) : « la navigation ne doit pas seulement être un
 * simple activable ; il doit permettre d'activer sur la bottom nav les
 * features pertinentes que l'utilisateur veut, avec quelques paramètres en
 * plus. »
 *
 * Deux niveaux testés séparément :
 *   1. les opérations pures (`bottom-bar.ts`) — ordre, plafond, verrous ;
 *   2. le store — la barre et `visibleTabs` ne peuvent pas diverger.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  BOTTOM_BAR_ENTRIES,
  BOTTOM_BAR_MAX,
  DEFAULT_BAR,
  LOCKED_IDS,
  disableEntry,
  enableEntry,
  isLocked,
  moveEntry,
  moveEntryTo,
  normalizeBar,
  resolveEntries,
} from '@/domains/navigation/bottom-bar';
import { useUiStore } from '@/store/ui-store';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('barre d’onglets — opérations pures', () => {
  it('nettoie une liste : doublons, inconnues, verrous manquants', () => {
    const cleaned = normalizeBar(['explore', 'explore', 'licorne', 'settings']);
    expect(cleaned).toEqual(['explore', 'settings', 'home']);
    for (const locked of LOCKED_IDS) expect(cleaned).toContain(locked);
  });

  it('ne dépasse jamais cinq entrées', () => {
    const all = BOTTOM_BAR_ENTRIES.map((e) => e.id);
    const cleaned = normalizeBar(all);
    expect(cleaned).toHaveLength(BOTTOM_BAR_MAX);
    // Le plafond retire les non-verrouillées, jamais Accueil ni Réglages.
    for (const locked of LOCKED_IDS) expect(cleaned).toContain(locked);
  });

  it('ajoute une fonction avant les verrouillées, et refuse au-delà du plafond', () => {
    const base = normalizeBar(DEFAULT_BAR);
    expect(base).toHaveLength(BOTTOM_BAR_MAX);
    // Plein : l'ajout est sans effet.
    expect(enableEntry(base, 'search')).toEqual(base);
    // Une place libérée, l'entrée revient juste avant Réglages.
    const room = disableEntry(base, 'explore');
    const added = enableEntry(room, 'search');
    expect(added.indexOf('search')).toBe(added.indexOf('settings') - 1);
  });

  it('refuse de désactiver Accueil ou Réglages', () => {
    const base = normalizeBar(DEFAULT_BAR);
    for (const locked of LOCKED_IDS) {
      expect(isLocked(locked)).toBe(true);
      expect(disableEntry(base, locked)).toEqual(base);
    }
  });

  it('déplace une entrée sans sortir de la barre', () => {
    const base = normalizeBar(DEFAULT_BAR);
    const first = base[0];
    expect(moveEntry(base, first, -1)).toEqual(base);
    expect(moveEntry(base, base[base.length - 1], 1)).toEqual(base);
    const moved = moveEntry(base, first, 1);
    expect(moved[0]).toBe(base[1]);
    expect(moved[1]).toBe(first);
  });

  it('dépose à une position bornée (glisser-déposer)', () => {
    const base = normalizeBar(DEFAULT_BAR);
    const last = base[base.length - 1];
    const moved = moveEntryTo(base, last, 0);
    expect(moved[0]).toBe(last);
    expect(moveEntryTo(base, last, 99)).toEqual(base);
  });

  it('résout les entrées dans l’ordre, sans perdre personne', () => {
    const ids = normalizeBar(DEFAULT_BAR);
    const entries = resolveEntries(ids);
    expect(entries.map((e) => e.id)).toEqual(ids);
    expect(entries.every((e) => e.path.startsWith('/'))).toBe(true);
    expect(new Set(entries.map((e) => e.description)).size).toBe(entries.length);
  });
});

describe('barre d’onglets — store', () => {
  beforeEach(() => {
    useUiStore.getState().resetBar();
  });

  it('garde la barre et les pages synchronisées', () => {
    useUiStore.getState().disableBarItem('explore');
    expect(useUiStore.getState().barItems).not.toContain('explore');
    expect(useUiStore.getState().visibleTabs).not.toContain('explore');
    useUiStore.getState().enableBarItem('explore');
    expect(useUiStore.getState().visibleTabs).toContain('explore');
  });

  it('une fonction épinglée n’ajoute pas de page au rail', () => {
    useUiStore.getState().disableBarItem('explore');
    useUiStore.getState().enableBarItem('search');
    expect(useUiStore.getState().barItems).toContain('search');
    expect(useUiStore.getState().visibleTabs).not.toContain('search');
  });

  it('l’ancien contrat `setVisibleTab` passe par la même porte', () => {
    useUiStore.getState().setVisibleTab('progress', false);
    expect(useUiStore.getState().barItems).not.toContain('progress');
    useUiStore.getState().setVisibleTab('progress', true);
    expect(useUiStore.getState().barItems).toContain('progress');
  });

  it('mémorise les réglages de forme', () => {
    useUiStore.getState().setBarLabels(false);
    useUiStore.getState().setBarCompact(true);
    expect(useUiStore.getState().barLabels).toBe(false);
    expect(useUiStore.getState().barCompact).toBe(true);
    useUiStore.getState().resetBar();
    expect(useUiStore.getState().barItems).toEqual(normalizeBar(DEFAULT_BAR));
  });
});

describe('barre d’onglets — écran et composant', () => {
  it('l’écran expose activés, désactivés et les paramètres', () => {
    const screen = read('app/settings/navigation.tsx');
    expect(screen).toContain('navBarActive');
    expect(screen).toContain('navBarInactive');
    expect(screen).toContain('navBarLabels');
    expect(screen).toContain('navBarCompact');
    expect(screen).toContain('BOTTOM_BAR_MAX');
    // Réordonnancement : souris ET clavier.
    expect(screen).toContain('moveBarItemTo');
    expect(screen).toContain('moveBarItem(entry.id, -1)');
    expect(screen).toContain('onDragStart');
  });

  it('la barre rend les entrées épinglées, pas une liste figée', () => {
    const tabs = read('src/components/navigation/BottomTabs.tsx');
    expect(tabs).toContain('resolveEntries(barItems)');
    expect(tabs).toContain('barLabels');
    expect(tabs).toContain('barCompact');
    expect(tabs).toContain('aria-label={label}');
    expect(tabs).not.toContain('ALL_TABS');
  });
});

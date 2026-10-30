import { describe, it, expect, vi } from 'vitest';
import { goBackSafely } from '@/lib/navigation';
import { formatChapterCount } from '@/lib/chapter-count';
import { readFileSync } from 'node:fs';

describe('navigation et libellés Bible', () => {
  it('rentre à l’accueil si la page est ouverte directement', () => {
    const navigate = vi.fn();
    window.history.replaceState({ idx: 0 }, '');
    goBackSafely(navigate);
    expect(navigate).toHaveBeenCalledWith('/tabs/home', { replace: true });
    window.history.replaceState({ idx: 2 }, '');
    goBackSafely(navigate);
    expect(navigate).toHaveBeenLastCalledWith(-1);
  });
  it('formate 0, 1 et 2 livres, chapitres et versets en français et anglais', () => {
    for (const noun of ['livre', 'chapitre', 'verset']) {
      expect([0, 1, 2].map((n) => formatChapterCount(`{count} ${noun}{plural}`, n, 'fr'))).toEqual([`0 ${noun}`, `1 ${noun}`, `2 ${noun}s`]);
    }
    expect([0, 1, 2].map((n) => formatChapterCount('{count} verse{plural}', n, 'en'))).toEqual(['0 verses', '1 verse', '2 verses']);
  });
  it('évite la deuxième entrée Bible dans le rail quand son onglet existe', () => {
    const rail = readFileSync('src/components/navigation/DesktopRail.tsx', 'utf8');
    expect(rail).toContain("item.path === '/bible/explorer' && visibleTabs.includes('explore')");
    expect(rail).toContain("tab.id === 'explore' && location.pathname.startsWith('/bible/')");
  });
});

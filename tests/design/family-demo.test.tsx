import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FamilyDemo } from '@/components/family/FamilyDemo';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback: string, values?: { count?: number }) => fallback.replace('{{count}}', String(values?.count ?? '')) }) }));

describe('démo famille isolée', () => {
  it('simule une révision en mémoire sans accéder à l’espace réel', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const onReal = vi.fn();
    await act(async () => { root.render(<MemoryRouter><FamilyDemo onReal={onReal} /></MemoryRouter>); });
    const simulate = [...host.querySelectorAll('button')].find((button) => button.textContent?.includes('Simuler une révision'));
    expect(simulate).toBeDefined();
    await act(async () => { simulate?.click(); });
    expect(host.textContent).toContain('4 révisions simulées');
    expect(onReal).not.toHaveBeenCalled();
    await act(async () => { root.unmount(); });
    host.remove();
  });
});

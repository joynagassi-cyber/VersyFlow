import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import WelcomeScreen from '../../app/onboarding/welcome';
import JourneyScreen from '../../app/onboarding/journey';
import { useAuthStore } from '@/store/auth-store';

vi.mock('@/hooks/useActiveProfile', () => ({ useActiveProfile: () => ({ activeProfile: null, createProfile: vi.fn(), selectProfile: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }) }));

describe('nouvel accueil et découverte', () => {
  it('propose une inscription et une connexion sans accès direct à l’application', async () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });
    const host = document.createElement('div'); const root = createRoot(host);
    await act(async () => { root.render(<MemoryRouter><WelcomeScreen /></MemoryRouter>); });
    expect(host.textContent).toContain('Résister au diable par la Parole');
    expect(host.querySelector('a[href="/auth/signup"]')).not.toBeNull();
    expect(host.querySelector('a[href="/auth/login"]')).not.toBeNull();
    expect(host.querySelector('a[href="/tabs/home"]')).toBeNull();
    await act(async () => root.unmount());
  });
  it('enchaîne les six écrans de découverte avant le profil', async () => {
    const host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
    await act(async () => { root.render(<MemoryRouter initialEntries={['/onboarding/journey/bible']}><Routes><Route path="/onboarding/journey/:step" element={<JourneyScreen />} /></Routes></MemoryRouter>); });
    for (const title of ['La Bible, tout près de vous', 'Gardez la Parole dans votre cœur', 'Révisez au bon moment', 'Chaque pas compte', 'Grandissez ensemble', 'Partagez votre parcours']) {
      expect(host.textContent).toContain(title);
      await act(async () => { (host.querySelector('.journey-primary') as HTMLButtonElement).click(); });
    }
    expect(host.textContent).toContain('Choisissez vos couleurs');
    await act(async () => root.unmount()); host.remove();
  });
});

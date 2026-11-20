/**
 * Cibles tactiles par plateforme (playbook D02 / D03).
 *
 * Le CSS prévoit `html[data-platform='android'] { --tap-min: 48px }` depuis le
 * lot d'accessibilité, mais l'attribut n'était posé nulle part : la règle ne
 * s'allumait jamais, et Android restait à 44 px. Ces tests tiennent les deux
 * bouts : la reconnaissance de plateforme, et le fait que `installTouchPlatform`
 * pose réellement l'attribut attendu — sans rien poser sur un ordinateur.
 */
import { describe, expect, it } from 'vitest';
import { installTouchPlatform, touchPlatformFor } from '@/lib/touch-platform';

const UA = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ipadLegacy:
    'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ se présente comme un Mac de bureau.
  ipadModern:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  android:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  desktopLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  desktopWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

describe('touchPlatformFor', () => {
  it('reconnaît Android et iOS, quel que soit le format de l’agent', () => {
    expect(touchPlatformFor(UA.android, 5)).toBe('android');
    expect(touchPlatformFor(UA.iphone, 5)).toBe('ios');
    expect(touchPlatformFor(UA.ipadLegacy, 5)).toBe('ios');
    expect(touchPlatformFor(UA.ipadModern, 5)).toBe('ios');
  });

  it('ne prend pas un ordinateur pour une tablette', () => {
    expect(touchPlatformFor(UA.desktopLinux, 0)).toBe('web');
    expect(touchPlatformFor(UA.desktopWindows, 0)).toBe('web');
    // Un Mac tactile n'existe pas : `maxTouchPoints` le distingue de l'iPad.
    expect(touchPlatformFor(UA.ipadModern, 0)).toBe('web');
  });
});

describe('installTouchPlatform', () => {
  const docFor = () => {
    const html = document.createElement('html');
    return { documentElement: html } as unknown as Document;
  };
  const navFor = (userAgent: string, maxTouchPoints = 0) =>
    ({ userAgent, maxTouchPoints }) as unknown as Navigator;

  it('pose data-platform sur Android (48 dp) et iOS', () => {
    const android = docFor();
    expect(installTouchPlatform(android, navFor(UA.android, 5))).toBe('android');
    expect(android.documentElement.getAttribute('data-platform')).toBe('android');

    const ios = docFor();
    installTouchPlatform(ios, navFor(UA.iphone, 5));
    expect(ios.documentElement.getAttribute('data-platform')).toBe('ios');
  });

  it('ne pose rien sur un ordinateur, et retire un attribut périmé', () => {
    const desktop = docFor();
    desktop.documentElement.setAttribute('data-platform', 'android');
    expect(installTouchPlatform(desktop, navFor(UA.desktopWindows, 0))).toBe('web');
    expect(desktop.documentElement.hasAttribute('data-platform')).toBe(false);
  });

  it('est idempotent', () => {
    const doc = docFor();
    const nav = navFor(UA.android, 5);
    installTouchPlatform(doc, nav);
    installTouchPlatform(doc, nav);
    expect(doc.documentElement.getAttribute('data-platform')).toBe('android');
  });

  it('ne casse pas hors navigateur', () => {
    expect(installTouchPlatform(undefined, undefined)).toBe('web');
  });
});

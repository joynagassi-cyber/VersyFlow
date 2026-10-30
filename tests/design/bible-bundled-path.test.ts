import { describe, expect, it, vi } from 'vitest';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';

describe('Bible locale', () => {
  it('résout la traduction depuis la base de l’application, pas depuis la route courante', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
    const source = new BibleJsonFileSource({ fetchImpl, useNodeFs: false });
    await expect(source.load('lsg')).rejects.toThrow('HTTP 404');
    expect(fetchImpl).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}data/bible/lsg.json`);
  });
});

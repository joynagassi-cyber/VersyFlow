/**
 * Tests for AI Coach no-op adapter contracts
 */

import { describe, it, expect } from 'vitest';
import { NoOpAiCoachAdapter } from '@/capabilities/ai-coach/types';
import type { IAiCoachPort } from '@/capabilities/ai-coach/types';

describe('NoOpAiCoachAdapter', () => {
  let adapter: IAiCoachPort;

  beforeEach(() => {
    adapter = new NoOpAiCoachAdapter();
  });

  it('getRecommendations resolves to empty array', async () => {
    const result = await adapter.getRecommendations();
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getInsights resolves to empty array', async () => {
    const result = await adapter.getInsights();
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getDailyPlan resolves to null', async () => {
    const result = await adapter.getDailyPlan();
    expect(result).toBeNull();
  });

  it('getWeeklyReport resolves to null', async () => {
    const result = await adapter.getWeeklyReport();
    expect(result).toBeNull();
  });

  it('implements IAiCoachPort contract', async () => {
    // All methods should be callable without errors
    await expect(adapter.getRecommendations()).resolves.not.toThrow();
    await expect(adapter.getInsights()).resolves.not.toThrow();
    await expect(adapter.getDailyPlan()).resolves.not.toThrow();
    await expect(adapter.getWeeklyReport()).resolves.not.toThrow();
  });
});

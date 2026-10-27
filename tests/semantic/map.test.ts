/**
 * Stage E — Map: deterministic role rules + the single documented LLM
 * trigger (ambiguous band on an active verse with one candidate).
 * Pure, no network.
 */
import { describe, it, expect } from 'vitest';
import { mapVerseRoles, mapDeterministic } from '../../scripts/semantic/map';
import { NoopLlmPort, type ILlmPort } from '../../scripts/semantic/llm-port';

const NOW = '2026-09-13T22:00:43.494Z';

describe('stage E — map', () => {
  it('always accepts head verses as PRIMARY, deterministically', async () => {
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:1', refKind: 'head', confidence: 0.4 },
        ],
      },
      new NoopLlmPort(),
      NOW,
    );
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0].role).toBe('PRIMARY');
    expect(out.rows[0].status).toBe('accepted');
    expect(out.rows[0].llmAsked).toBe(false);
    expect(out.llmCalls).toBe(0);
  });

  it('accepts non-head refs at high confidence (≥ 0.8) without an LLM call', async () => {
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:2', refKind: 'support', confidence: 0.9 },
        ],
      },
      new NoopLlmPort(),
      NOW,
    );
    expect(out.rows[0].status).toBe('accepted');
    expect(out.rows[0].role).toBe('SECONDARY');
    expect(out.llmCalls).toBe(0);
  });

  it('marks low-confidence non-active verses unresolved without asking the LLM', async () => {
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:3', refKind: 'support', confidence: 0.5 },
        ],
      },
      new NoopLlmPort(),
      NOW,
    );
    expect(out.rows[0].status).toBe('unresolved');
    expect(out.llmCalls).toBe(0);
  });

  it('asks the LLM only for an active verse with a single in-band candidate; NoopLlmPort keeps it unresolved', async () => {
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:4', refKind: 'support', confidence: 0.7 },
        ],
        activeVerses: ['mat:5:4'],
        candidates: { 'mat:5:4': { conceptKey: 'k1', score: 0.7 } },
      },
      new NoopLlmPort(),
      NOW,
    );
    expect(out.llmCalls).toBe(1);
    expect(out.rows[0].llmAsked).toBe(true);
    expect(out.rows[0].status).toBe('unresolved'); // null answer → unresolved
  });

  it('accepts when a non-null role comes back from the port in-band', async () => {
    const port: ILlmPort = {
      nameCommunity: async () => null,
      assignRole: async () => 'SECONDARY',
    };
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:5', refKind: 'support', confidence: 0.7 },
        ],
        activeVerses: ['mat:5:5'],
        candidates: { 'mat:5:5': { conceptKey: 'k1', score: 0.75 } },
      },
      port,
      NOW,
    );
    expect(out.rows[0].status).toBe('accepted');
    expect(out.rows[0].role).toBe('SECONDARY');
    expect(out.rows[0].source).toBe('stage-E:llm');
  });

  it('never auto-accepts a CONTRAST answer', async () => {
    const port: ILlmPort = {
      nameCommunity: async () => null,
      assignRole: async () => 'CONTRAST',
    };
    const out = await mapVerseRoles(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:6', refKind: 'xref', confidence: 0.7 },
        ],
        activeVerses: ['mat:5:6'],
        candidates: { 'mat:5:6': { conceptKey: 'k1', score: 0.7 } },
      },
      port,
      NOW,
    );
    expect(out.rows[0].status).toBe('unresolved');
    expect(out.rows[0].role).toBe('RELATED'); // CONTRAST is not applied
  });

  it('mapDeterministic is LLM-free: high-confidence head/support accept, low stays unresolved', () => {
    const out = mapDeterministic(
      {
        refs: [
          { conceptKey: 'k1', verseId: 'mat:5:1', refKind: 'head', confidence: 0.4 },
          { conceptKey: 'k1', verseId: 'mat:5:2', refKind: 'support', confidence: 0.9 },
          { conceptKey: 'k1', verseId: 'mat:5:3', refKind: 'support', confidence: 0.3 },
        ],
        activeVerses: ['mat:5:3'],
      },
      NOW,
    );
    expect(out.llmCalls).toBe(0);
    expect(out.rows[0].status).toBe('accepted'); // head rule
    expect(out.rows[1].status).toBe('accepted'); // high confidence
    expect(out.rows[2].status).toBe('unresolved'); // low, active, no LLM
  });

  it('row ids are deterministic across runs', async () => {
    const input = {
      refs: [
        { conceptKey: 'k1', verseId: 'mat:5:1', refKind: 'head' as const, confidence: 0.9 },
      ],
    };
    const a = await mapVerseRoles(input, new NoopLlmPort(), NOW);
    const b = await mapVerseRoles(input, new NoopLlmPort(), NOW);
    expect(a.rows[0].id).toBe(b.rows[0].id);
  });
});

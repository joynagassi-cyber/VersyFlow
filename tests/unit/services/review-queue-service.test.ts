/**
 * Tests pour ReviewQueueService — Phase 3 step 3.1
 * Vérifie que getPrioritizedQueue() renvoie des records triés par
 * urgence FSRS (overdue d'abord, score d'urgence décroissant).
 *
 * Le moteur FSRS est consommé via l'interface IFsrsEngine (jamais via
 * une implémentation concrète).
 */

import { ReviewQueueService } from '@/services/review-queue-service';
import { IFsrsEngine, FsrsState, FsrsReview } from '@/domains/fsrs';
import { IStorage } from '@/infrastructure/storage/storage-types';
import { MemorizationService, MemorizationRecord } from '@/domains/memorization';

/**
 * Moteur FSRS stub qui respecte l'interface IFsrsEngine.
 * Sert à prouver que le service fonctionne avec n'importe quelle
 * implémentation de l'interface (pas l'implémentation concrète).
 */
class StubFsrsEngine implements IFsrsEngine {
  async newState(): Promise<FsrsState> {
    return {
      stability: 1,
      difficulty: 5,
      recallProbability: 1,
      lastInterval: 0,
      nextInterval: 1,
      elapsedDays: 0,
      repetitions: 0,
      requestedRetention: 0.9,
    };
  }

  currentState(state: FsrsState): FsrsState {
    return state;
  }

  async review(state: FsrsState, rating: number): Promise<FsrsReview> {
    void rating;
    return {
      state,
      due: new Date(Date.now() + 86400000),
      stability: state.stability,
      scheduledDays: state.nextInterval,
      recurring: true,
    };
  }

  explain(): Record<string, string> {
    return {};
  }

  getDueItems(states: FsrsState[], now: Date): string[] {
    // Items dus : état FSRS qui prédit une révision avant `now`
    return states
      .filter((s) => s.nextInterval > 0 && now.getTime() >= Date.now() - s.nextInterval * 86400000)
      .map((_, i) => String(i));
  }
}

function makeRecord(
  id: string,
  daysOverdue: number, // >0 = overdue (nextReviewAt dans le passé) ; <0 = planifié dans l'avenir
  recallProbability: number,
  stability: number,
): MemorizationRecord {
  const now = Date.now();
  const day = 86400000;
  return {
    id,
    learnerProfileId: 'default',
    bookId: 'gen',
    chapterNumber: 1,
    verseNumber: 1,
    translationId: 'lsg',
    bibleVerseReference: `Test ${id}`,
    bibleVerseText: 'Au commencement, Dieu créa les cieux et la terre.',
    status: 'in-progress',
    fsrsState: {
      stability,
      difficulty: 5,
      recallProbability,
      lastInterval: 1,
      nextInterval: Math.max(1, 7 - daysOverdue),
      elapsedDays: Math.max(0, daysOverdue),
      repetitions: 3,
      requestedRetention: 0.9,
    },
    favorite: false,
    tags: [],
    createdAt: now - 30 * day,
    lastReviewedAt: now - daysOverdue * day,
    // L'ID de l'enregistrement doit refléter son état (overdue ou planifié)
    nextReviewAt: now - Math.abs(daysOverdue) * day,
    reviewCount: 3,
    totalReviewMinutes: 10,
    wordPerformance: [],
  };
}

function inMemoryStorage(records: MemorizationRecord[]): IStorage {
  const map = new Map<string, string>();
  records.forEach((r) => map.set(`versyflow:default:record:${r.id}`, JSON.stringify(r)));
  return {
    async get(key: string) {
      // Doit renvoyer null (pas undefined) quand la clé est absente,
      // sinon JSON.parse(undefined) lève une erreur dans l'adapter.
      const value = map.get(key);
      return value !== undefined ? value : null;
    },
    async set(key: string, value: string) {
      map.set(key, value);
    },
    async delete(key: string) {
      map.delete(key);
    },
    async clear() {
      map.clear();
    },
    async getAllKeys() {
      return Array.from(map.keys());
    },
  };
}

/**
 * Fournit au service une MemorizationService réelle branchée sur un
 * storage en mémoire (getDueRecords filtre réellement sur nextReviewAt),
 * avec des stubs déterministes pour fatigue et stratégie.
 */
function buildService(records: MemorizationRecord[], engine: IFsrsEngine): ReviewQueueService {
  const memorizationService = new MemorizationService(inMemoryStorage(records), engine, 'default');
  const fatigueDetector = { getFatigueLevel: () => 0 } as never;
  const recommendor = {
    recommend: () => ({ strategy: 'progressive-masking', confidence: 0.6, rationale: 'stub' }),
  } as never;
  return new ReviewQueueService(memorizationService, engine, 'default', fatigueDetector, recommendor);
}

describe('ReviewQueueService.getPrioritizedQueue (Phase 3 — 3.1)', () => {
  it('trier les records par ordre d\'urgence FSRS : les records overdue arrivent avant les records planifiés', async () => {
    const heavyOverdue = makeRecord('heavy-overdue', 5, 0.3, 0.5); // overdue de 5 jours
    const lightOverdue = makeRecord('light-overdue', 1, 0.5, 1); // overdue de 1 jour
    // Record planifié dans le futur (non du) : on force nextReviewAt dans le futur
    const scheduled = makeRecord('scheduled', 0, 0.9, 5);
    scheduled.nextReviewAt = Date.now() + 7 * 86400000;
    const service = buildService([scheduled, heavyOverdue, lightOverdue], new StubFsrsEngine());

    const queue = await service.getPrioritizedQueue();

    // Le record planifié (non du) est exclu de la file.
    expect(queue.map((i) => i.id)).not.toContain('scheduled');
    // Le record le plus en retard arrive avant le record légèrement en retard.
    const order = queue.map((i) => i.id);
    const heavyIdx = order.indexOf('heavy-overdue');
    const lightIdx = order.indexOf('light-overdue');
    expect(heavyIdx).toBeGreaterThanOrEqual(0);
    expect(lightIdx).toBeGreaterThanOrEqual(0);
    expect(heavyIdx).toBeLessThan(lightIdx);
  });

  it('trier par ordre décroissant du score d\'urgence (highest urgencyScore first)', async () => {
    const a = makeRecord('a', 1, 0.6, 1); // overdue 1 jour
    const b = makeRecord('b', 2, 0.4, 0.8); // overdue 2 jours → plus urgent
    const c = makeRecord('c', 4, 0.2, 0.5); // overdue 4 jours → le plus urgent
    const service = buildService([a, b, c], new StubFsrsEngine());

    const queue = await service.getPrioritizedQueue();
    const ids = queue.map((i) => i.id);
    const urgency = queue.map((i) => i.urgencyScore);

    for (let i = 0; i < ids.length - 1; i++) {
      expect(urgency[i]).toBeGreaterThanOrEqual(urgency[i + 1]);
    }
    expect(ids).toEqual(['c', 'b', 'a']);
  });

  it('exclure les records maîtrisés et non dus de la file', async () => {
    const mastered = makeRecord('mastered', 1, 0.9, 5);
    mastered.status = 'mastered';
    const due = makeRecord('due', 2, 0.5, 1);
    const service = buildService([mastered, due], new StubFsrsEngine());

    const queue = await service.getPrioritizedQueue();
    expect(queue.map((i) => i.id)).toEqual(['due']);
  });

  it('retourner une file vide quand aucun record n\'est du', async () => {
    const notDue = makeRecord('not-due', 0, 0.9, 5);
    notDue.nextReviewAt = Date.now() + 3 * 86400000; // planifié dans 3 jours → non du
    const service = buildService([notDue], new StubFsrsEngine());

    const queue = await service.getPrioritizedQueue();
    expect(queue).toHaveLength(0);
  });

  it('fonctionner avec n\'importe quelle implémentation de IFsrsEngine (aucun import concret requis)', async () => {
    const records = [makeRecord('x', 1, 0.5, 1)];
    const service = buildService(records, new StubFsrsEngine());
    expect(service).toBeDefined();

    const queue = await service.getPrioritizedQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe('x');
  });
});

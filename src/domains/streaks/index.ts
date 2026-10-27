/**
 * Streak Domain — Barrel
 *
 * Public surface of the streak domain: the append-only daily fact entity
 * and its repository port (`IStreakRepository`). Concrete implementations
 * live in `src/infrastructure/` and the orchestrating rules in
 * `src/services/streak-service.ts` (the domain layer owns the port, the
 * service layer owns the behaviour).
 */

export type { StreakRecord, IStreakRepository } from './repository';

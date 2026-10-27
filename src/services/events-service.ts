/**
 * events-service — composition root for the domain event bus.
 *
 * `eventBus` (an instance) and `DomainEventTypes` (a const object) are
 * *values* living in the domain layer. The UI layer is forbidden from
 * importing them directly (docs/29 §1 matrix: `app/`+`src/components/` →
 * `src/domains/` ❌; §6 Exception 4 only exempts *type-only* domain
 * imports, which `eventBus`/`DomainEventTypes` are not). This service is
 * the single routing point: UI screens emit/listen through it, and any
 * future move of the bus (e.g. behind a port, or to a different
 * implementation) stays contained to the service layer.
 *
 * Note: `telemetry-listener.ts`, `streak-service.ts`, `family-service.ts`
 * etc. already import the bus the same way — this does not touch them,
 * it only gives the UI layer a legal entry point.
 */

import { eventBus, DomainEventTypes, type DomainEvent } from '@/domains/events';

export { eventBus, DomainEventTypes };
export type { DomainEvent };

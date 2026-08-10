/**
 * Capabilities Barrel Export
 * Centralized export for all capability modules
 */

// Memory Capabilities
export { useMemoryCapability } from './memory/store';
export type { MemoryCapabilityState } from './memory/store';
export { useMemoryCapabilityHook } from './memory/use-memory';

// Comparison Capabilities
export { useComparisonCapability } from './comparison/store';
export type { ComparisonCapabilityState } from './comparison/store';

// Analytics Capabilities
export { useAnalyticsCapability } from './analytics/store';
export type { AnalyticsState } from './analytics/store';

// AI Coach Capabilities
export { useAICoachCapability } from './ai-coach/store';
export type { AICoachState } from './ai-coach/store';
export type { AIRecommendation } from './ai-coach/store';

// Family Capabilities (Phase 6)
export { useFamilyStore } from '@/store/family-store';
export type { FamilyState } from '@/store/family-store';

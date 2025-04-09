// src/components/timeline/index.ts
// Purpose: Export all timeline components from a single file
// Used for cleaner imports in other components

export * from './TimelineEvent';
export * from './TimelineDay';
export * from './Timeline';

// Re-export types
export type { TimelineEventData } from './TimelineDay';
export type { ItineraryDay } from './Timeline';
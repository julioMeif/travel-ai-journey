// src/components/selection/mobile/index.ts
// Purpose: Export all mobile selection components from a single file
// Used for cleaner imports in other components

export * from './SwipeCard';
export * from './CardDetails';
export * from './SwipeDeck';

// Re-export types
export type { TravelOption } from './SwipeDeck';
// src/components/selection/desktop/index.ts
// Purpose: Export all desktop selection components from a single file
// Used for cleaner imports in other components

import { DraggableCard } from './DraggableCard';
import { DropZone } from './DropZone';
import { DesktopDragAndDrop, TravelOption } from './DesktopDragAndDrop';

export {
  DraggableCard,
  DropZone,
  DesktopDragAndDrop,
  // Types
  type TravelOption
};
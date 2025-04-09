// src/components/selection/desktop/DropZone.tsx
// Purpose: Target area for draggable cards with visual feedback
// Used in: DesktopDragAndDrop for accept/reject zones

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { GlassPanel } from '../../ui';

interface DropZoneProps {
  onDrop: (id: string) => void;
  type: 'accept' | 'reject';
  children?: React.ReactNode;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({ 
  onDrop, 
  type, 
  children,
  className = ''
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Define drop behavior
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'CARD',
    drop: (item: { id: string }) => {
      onDrop(item.id);
      return { name: type === 'accept' ? 'Accepted' : 'Rejected' };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
    hover: () => {
      setIsActive(true);
    },
  });
  
  // Reset active state when not hovering
  React.useEffect(() => {
    if (!isOver) {
      setIsActive(false);
    }
  }, [isOver]);
  
  // Determine color based on zone type
  const color = type === 'accept' ? 'success' : 'danger';
  
  // Determine icon and text based on zone type
  const zoneContent = {
    accept: {
      icon: '👍',
      text: 'Add to Trip',
    },
    reject: {
      icon: '👎',
      text: 'Skip',
    },
  };

  return (
    <motion.div
      ref={dropRef}
      className={`h-full ${className}`}
      animate={{
        scale: isActive ? 1.03 : 1,
      }}
    >
      <GlassPanel
        className="w-64 h-full flex flex-col items-center justify-center"
        color={isActive ? color : 'default'}
        intensity={isActive ? 'high' : 'medium'}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl">{zoneContent[type].icon}</span>
          <span className="text-xl font-medium text-white">
            {zoneContent[type].text}
          </span>
          
          {/* Visual indicator for active drop */}
          {isActive && (
            <motion.div
              className="mt-4 w-16 h-1 bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
            />
          )}
        </div>
        
        {/* Children content (e.g., cards that have been dropped) */}
        {children}
      </GlassPanel>
    </motion.div>
  );
};
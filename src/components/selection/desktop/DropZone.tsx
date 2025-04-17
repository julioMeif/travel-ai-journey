// src/components/selection/desktop/DropZone.tsx - Improved
import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showPulse, setShowPulse] = useState(false);
  
  // Set up a pulsing animation that runs every few seconds to draw attention
  useEffect(() => {
    // Reduced frequency of pulsing for better UX
    const interval = setInterval(() => {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 600);
    }, 8000); // Increased to 8 seconds
    return () => clearInterval(interval);
  }, []);
  
  // Define drop behavior
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'CARD',
    drop: (item: { id: string }) => {
      console.log(`DROP EVENT DETECTED in ${type} zone for item ${item.id}`);
      onDrop(item.id);
      return { name: type };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Set active state when hovering
  useEffect(() => {
    setIsActive(isOver && canDrop);
    if (isOver && canDrop) {
      console.log(`Hover active in ${type} zone`);
    }
  }, [isOver, canDrop, type]);
  
  // Determine content based on zone type
  const zoneContent = {
    accept: {
      icon: '👍',
      text: 'Add to Trip',
      activeText: 'Drop to Add',
      color: 'from-emerald-600/50 to-teal-600/50',
      activeColor: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-400/30',
      activeBorder: 'border-emerald-400'
    },
    reject: {
      icon: '👎',
      text: 'Skip',
      activeText: 'Drop to Skip',
      color: 'from-rose-600/50 to-pink-600/50',
      activeColor: 'from-rose-600 to-pink-600',
      border: 'border-rose-400/30',
      activeBorder: 'border-rose-400'
    },
  };

  // Prevent default drag behaviors to avoid browser handling
  const preventDefaultDragBehavior = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div 
      className={`relative flex flex-col ${className}`} 
      ref={(node) => {
        if (node) dropRef(node);
      }}
      // Add these event handlers to prevent browser interference
      onDragOver={preventDefaultDragBehavior}
      onDragEnter={preventDefaultDragBehavior}
      onDragLeave={preventDefaultDragBehavior}
      onDrop={preventDefaultDragBehavior}
    >
      {/* Pulsing effect */}
      <AnimatePresence>
        {showPulse && !isActive && (
          <motion.div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${zoneContent[type].color} z-0`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1.05 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    
      <motion.div
        className="h-full relative z-10 flex flex-col"
        animate={{
          scale: isActive ? 1.03 : 1,
        }}
      >
        <GlassPanel
          className={`w-full flex-grow flex flex-col items-center justify-center border-2 transition-all duration-300
                    ${isActive ? zoneContent[type].activeBorder : zoneContent[type].border}`}
          color={isActive ? (type === 'accept' ? 'success' : 'danger') : 'default'}
          intensity={isActive ? 'high' : 'medium'}
        >
          {/* Drop Zone Header */}
          <div className={`flex flex-col items-center gap-4 p-4 md:p-6 rounded-xl transition-all duration-300 w-full
                         ${isActive ? `bg-gradient-to-r ${zoneContent[type].activeColor}` : ''}`}>
            <span className="text-3xl md:text-4xl">{zoneContent[type].icon}</span>
            <span className="text-lg md:text-xl font-medium text-white text-center">
              {isActive ? zoneContent[type].activeText : zoneContent[type].text}
            </span>
            
            {/* Visual indicator for active drop */}
            {isActive && (
              <motion.div
                className="mt-2 w-16 h-1 bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut"
                }}
              />
            )}
          </div>
          
          {/* Children content container - IMPROVED STRUCTURE */}
          <div className="w-full flex-grow flex flex-col items-center justify-start overflow-hidden">
            {children}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
};
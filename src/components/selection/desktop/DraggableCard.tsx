// src/components/selection/desktop/DraggableCard.tsx - Improved
import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { motion } from 'framer-motion';
import { GlassPanel } from '../../ui';

interface DraggableCardProps {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number | string;
  rating?: number;
  details?: React.ReactNode;
  index: number;
  totalCards: number;
  onAccept?: () => void;
  onReject?: () => void;
  isTopCard: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  id,
  title,
  description,
  imageSrc,
  price,
  rating,
  details,
  index,
  totalCards,
  onAccept,
  onReject,
  isTopCard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Drag configuration
  const [{ opacity }, dragRef] = useDrag({
    type: 'CARD',
    item: { id },
    canDrag: isTopCard,
    end: (item, monitor) => {
      setIsDragging(false);
      const didDrop = monitor.didDrop();
      console.log(`Drag ended for card ${id}, item dropped: ${didDrop}`);
    },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.8 : 1,
      isDragging: monitor.isDragging(),
    }),
  });

  // Update local state when drag state changes
  useEffect(() => {
    if (isDragging !== opacity < 1) {
      setIsDragging(opacity < 1);
    }
  }, [opacity, isDragging]);

  // Calculate card positioning for stack effect
  const calculateOffset = () => {
    // Improved stacking effect
    const stackSpacing = 6; // Slightly reduced spacing
    const stackRotationFactor = 0.7; // Reduced rotation for cleaner look
    
    // Calculate based on position in stack (from bottom)
    return {
      x: (totalCards - index - 1) * 0.5, // Reduced horizontal offset
      y: (totalCards - index - 1) * stackSpacing, // Vertical offset
      rotate: (totalCards - index - 1) * stackRotationFactor * (Math.random() > 0.5 ? 1 : -1), // Random rotation
      scale: 1 - (totalCards - index - 1) * 0.02, // Slightly larger scaling difference
    };
  };

  const { x, y, rotate, scale } = calculateOffset();
  
  // Close expanded card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Render rating stars
  const renderRating = () => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-amber-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-amber-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-white/30">★</span>);
      }
    }
    
    return (
      <div className="flex items-center gap-1 text-sm">
        {stars}
        <span className="text-white/70 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <motion.div
      ref={(node) => {
        dragRef(node);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`
        absolute
        w-full h-full
        ${isTopCard ? 'cursor-grab' : 'pointer-events-none'}
        ${isDragging ? 'cursor-grabbing z-50' : ''}
        ${isExpanded ? 'z-50' : ''}
      `}
      style={{ 
        opacity,
        zIndex: isExpanded ? 50 : totalCards - index,
        touchAction: 'none' // Prevents touch scrolling during drag
      }}
      initial={{ x, y, rotate, scale }}
      animate={{ 
        x: isDragging || isExpanded ? 0 : x,
        y: isDragging || isExpanded ? 0 : y,
        rotate: isDragging || isExpanded ? 0 : rotate,
        scale: isDragging ? 1.02 : isExpanded ? 1.1 : scale,
        opacity: isDragging ? 0.9 : isTopCard ? 1 : 0.95 - (0.05 * (totalCards - index - 1)),
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      whileHover={isTopCard ? { scale: isExpanded ? 1.1 : 1.02 } : {}}
    >
      <GlassPanel className="h-full overflow-hidden flex flex-col" intensity={isTopCard ? "high" : "medium"}>
        {/* Card Content */}
        <div className="h-full flex flex-col">
          {/* Image Section - RELATIVE HEIGHT ADJUSTMENT */}
          <div className="h-1/2 md:h-3/5 w-full relative">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover"
              draggable={false} // Prevent browser image dragging
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
            
            {/* Price Tag */}
            {price && (
              <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white font-semibold">{typeof price === 'number' ? `$${price}` : price}</span>
              </div>
            )}
          </div>
          
          {/* Text Content - IMPROVED LAYOUT */}
          <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">{title}</h3>
              <p className="text-xs md:text-sm text-white/80 line-clamp-2">{description}</p>
            </div>
            
            <div className="mt-2">
              {renderRating()}
              
              {/* ACTION BUTTONS - IMPROVED PLACEMENT */}
              <div className="mt-3 md:mt-4 flex justify-between items-center">
                {isTopCard && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="bg-transparent hover:bg-white/10 text-white text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5 rounded-lg transition-all duration-300"
                  >
                    {isExpanded ? 'Less info' : 'More info'}
                  </button>
                )}
                
                {isTopCard && !isDragging && !isExpanded && (
                  <div className="flex gap-2">
                    {onReject && (
                      <button 
                        onClick={onReject}
                        className="bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent
                                 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-lg transition-all duration-300 font-medium border
                                 hover:shadow-lg hover:scale-[1.02]"
                      >
                        Skip
                      </button>
                    )}
                    {onAccept && (
                      <button 
                        onClick={onAccept}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent
                                 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm rounded-lg transition-all duration-300 font-medium border
                                 hover:shadow-lg hover:scale-[1.02]"
                      >
                        Accept
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Number Indicator - FIXED POSITION */}
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
          <span className="text-xs md:text-sm font-medium text-white">{index + 1}/{totalCards}</span>
        </div>
      </GlassPanel>
      
      {/* Expanded Card Details - IMPROVED LAYOUT */}
      {isTopCard && isExpanded && (
        <motion.div
          className="absolute inset-0 z-40"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <GlassPanel className="p-4 md:p-5 h-full overflow-y-auto" intensity="high">
            <button 
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1"
              onClick={() => setIsExpanded(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="mt-4">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">{title}</h2>
              
              <div className="mb-4 md:mb-6 relative h-32 md:h-40 rounded-lg overflow-hidden">
                <img
                  src={imageSrc}
                  alt={title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              
              <div className="flex justify-between items-center mb-3 md:mb-4">
                {price && (
                  <div className="text-base md:text-lg font-bold text-white">{typeof price === 'number' ? `$${price}` : price}</div>
                )}
                {renderRating()}
              </div>
              
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">Description</h3>
                <p className="text-sm md:text-base text-white/80">{description}</p>
              </div>
              
              {details && (
                <div className="mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">Details</h3>
                  <div className="text-sm md:text-base text-white/80">{details}</div>
                </div>
              )}
              
              {/* ACTION BUTTONS - FIXED POSITION AT BOTTOM */}
              <div className="flex gap-3 mt-4 sticky bottom-4">
                {onReject && (
                  <button 
                    className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent
                             px-3 py-2 rounded-lg transition-all duration-300 font-medium border
                             hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => {
                      setIsExpanded(false);
                      onReject();
                    }}
                  >
                    Skip this option
                  </button>
                )}
                {onAccept && (
                  <button 
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent
                             px-3 py-2 rounded-lg transition-all duration-300 font-medium border
                             hover:shadow-lg hover:scale-[1.02]"
                    onClick={() => {
                      setIsExpanded(false);
                      onAccept();
                    }}
                  >
                    Add to my trip
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </motion.div>
  );
};
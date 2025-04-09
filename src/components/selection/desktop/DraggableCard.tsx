// src/components/selection/desktop/DraggableCard.tsx
// Purpose: Interactive card that can be dragged in the selection interface
// Used in: DesktopDragAndDrop component for travel option selection

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
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Define drag behavior
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: 'CARD',
      item: { id },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.8 : 1,
      }),
      begin: () => {
        setIsDragging(true);
      },
      end: () => {
        setIsDragging(false);
      },
    }),
    [id]
  );

  // Calculate card positioning for stack effect
  const calculateOffset = () => {
    // Slight offset for cards in the stack
    const baseOffset = index * 4;
    return {
      x: baseOffset,
      y: baseOffset,
      rotate: index * 0.5, // Subtle rotation for stack effect
    };
  };

  const { x, y, rotate } = calculateOffset();
  
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
        if (cardRef.current) {
          cardRef.current = node as HTMLDivElement;
        }
      }}
      className={`
        relative
        w-80 h-96
        cursor-grab
        ${isDragging ? 'cursor-grabbing z-50' : ''}
        ${isExpanded ? 'z-50' : ''}
      `}
      style={{ 
        opacity,
        zIndex: isExpanded ? 50 : totalCards - index,
      }}
      initial={{ x, y, rotate, scale: 0.98 }}
      animate={{ 
        x: isDragging || isExpanded ? 0 : x,
        y: isDragging || isExpanded ? 0 : y,
        rotate: isDragging || isExpanded ? 0 : rotate,
        scale: isDragging ? 1.02 : isExpanded ? 1.1 : 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ scale: isExpanded ? 1.1 : 1.02 }}
    >
      <GlassPanel className="h-full overflow-hidden">
        {/* Card Content */}
        <div className="h-full flex flex-col">
          {/* Image Section */}
          <div className="h-2/3 w-full relative">
            <img
              src={imageSrc}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
            
            {/* Price Tag */}
            {price && (
              <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-white font-semibold">{typeof price === 'number' ? `$${price}` : price}</span>
              </div>
            )}
          </div>
          
          {/* Text Content */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
              <p className="text-sm text-white/80 line-clamp-2">{description}</p>
            </div>
            
            <div className="mt-2">
              {renderRating()}
              
              {/* Expand/Details Button */}
              <div className="mt-3 flex justify-between">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="bg-transparent hover:bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg transition-all duration-300"
                >
                  {isExpanded ? 'Less info' : 'More info'}
                </button>
                
                {!isDragging && !isExpanded && (
                  <div className="flex gap-2">
                    {onReject && (
                      <button 
                        onClick={onReject}
                        className="bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent
                                 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-medium border
                                 hover:shadow-lg hover:scale-[1.02]"
                      >
                        Skip
                      </button>
                    )}
                    {onAccept && (
                      <button 
                        onClick={onAccept}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent
                                 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-medium border
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
        
        {/* Card Number Indicator */}
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center">
          <span className="text-sm font-medium text-white">{index + 1}/{totalCards}</span>
        </div>
      </GlassPanel>
      
      {/* Expanded Card Details */}
      {isExpanded && (
        <motion.div
          className="absolute inset-0 z-40"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <GlassPanel className="p-5 h-full overflow-y-auto" intensity="high">
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
              <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
              
              <div className="mb-6 relative h-40 rounded-lg overflow-hidden">
                <img
                  src={imageSrc}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                {price && (
                  <div className="text-lg font-bold text-white">{typeof price === 'number' ? `$${price}` : price}</div>
                )}
                {renderRating()}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-white/80">{description}</p>
              </div>
              
              {details && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                  <div className="text-white/80">{details}</div>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                {onReject && (
                  <button 
                    className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent
                             px-4 py-2 rounded-lg transition-all duration-300 font-medium border
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
                             px-4 py-2 rounded-lg transition-all duration-300 font-medium border
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
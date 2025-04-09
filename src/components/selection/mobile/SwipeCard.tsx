// src/components/selection/mobile/SwipeCard.tsx
// Purpose: Card component for mobile swipe interface
// Used in: SwipeDeck for mobile travel option selection

import React from 'react';
import Image from 'next/image';
import { GlassPanel } from '../../ui/GlassPanel';
import { Button } from '../../ui/Button';

interface SwipeCardProps {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number | string;
  rating?: number;
  details?: React.ReactNode;
  onExpand?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  id,
  title,
  description,
  imageSrc,
  price,
  rating,
  details,
  onExpand,
}) => {
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
    <div className="h-full w-full">
      <GlassPanel className="h-full overflow-hidden">
        {/* Card Content */}
        <div className="h-full flex flex-col">
          {/* Image Section */}
          <div className="h-2/3 w-full relative">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover"
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
              
              {/* More Info Button */}
              <div className="mt-3">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onExpand}
                  fullWidth
                >
                  More info
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Swipe Instructions */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="px-4 py-2 bg-black/30 backdrop-blur-sm rounded-full flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-rose-400">←</span>
              <span className="text-white/70 text-xs">Skip</span>
            </div>
            <div className="h-3 w-px bg-white/30"></div>
            <div className="flex items-center gap-1">
              <span className="text-white/70 text-xs">Accept</span>
              <span className="text-emerald-400">→</span>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
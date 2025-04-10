// src/components/selection/mobile/SwipeCard.tsx
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
  title,
  description,
  imageSrc,
  price,
  rating,
  onExpand,
}) => {
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
    <div className="relative w-full h-full">
      <GlassPanel className="w-full h-full flex flex-col overflow-hidden">
        {/* Image Section */}
        <div className="relative flex-1">
          <Image src={imageSrc} alt={title} fill className="object-cover" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
          {price && (
            <div className="absolute top-3 right-3 bg-indigo-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white font-semibold">
                {typeof price === 'number' ? `$${price}` : price}
              </span>
            </div>
          )}
        </div>
        {/* Text Section */}
        <div className="p-4 bg-black/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/80 my-2">{description}</p>
          {renderRating()}
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={onExpand} fullWidth>
              More info
            </Button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

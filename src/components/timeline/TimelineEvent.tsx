// src/components/timeline/TimelineEvent.tsx
// Purpose: Individual event item in the timeline
// Used in: TimelineDay component for displaying activities, hotels, and transport

import React from 'react';
import Image from 'next/image';
import { GlassPanel } from '../ui/GlassPanel';

export type EventType = 'flight' | 'hotel' | 'activity' | 'transport';

interface TimelineEventProps {
  title: string;
  description: string;
  imageSrc: string;
  time?: string;
  duration?: string;
  location?: string;
  price?: number;
  type: EventType;
  expanded?: boolean;
  onToggle?: () => void;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  title,
  description,
  imageSrc,
  time,
  duration,
  location,
  price,
  type,
  expanded = false,
  onToggle,
}) => {
  // Icon based on event type
  const getEventIcon = () => {
    switch(type) {
      case 'flight':
        return '✈️';
      case 'hotel':
        return '🏨';
      case 'activity':
        return '🎯';
      case 'transport':
        return '🚕';
      default:
        return '📍';
    }
  };
  
  // Color based on event type
  const getEventColor = () => {
    switch(type) {
      case 'flight':
        return 'primary';
      case 'hotel':
        return 'success';
      case 'activity':
        return 'warning';
      case 'transport':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="mb-4">
      <GlassPanel 
        color={getEventColor()}
        className={`transition-all duration-300 ${expanded ? 'scale-[1.02]' : ''}`}
        hoverEffect={true}
        onClick={onToggle}
      >
        <div className="flex">
          {/* Event icon/time column */}
          <div className="w-16 flex-shrink-0 flex flex-col items-center pt-4">
            <div className="text-2xl mb-1">{getEventIcon()}</div>
            {time && <div className="text-sm text-white/80">{time}</div>}
          </div>
          
          {/* Event content */}
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {price !== undefined && (
                <span className="text-white font-medium">${price}</span>
              )}
            </div>
            
            {!expanded && (
              <p className="text-white/80 text-sm mt-1 line-clamp-1">{description}</p>
            )}
            
            {expanded && (
              <>
                <div className="mt-3 h-36 relative rounded-lg overflow-hidden">
                  <Image 
                    src={imageSrc}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <p className="text-white/80 text-sm mt-3">{description}</p>
                
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {location && (
                    <div className="text-sm">
                      <span className="text-white/60">Location:</span>
                      <span className="ml-1 text-white">{location}</span>
                    </div>
                  )}
                  {duration && (
                    <div className="text-sm">
                      <span className="text-white/60">Duration:</span>
                      <span className="ml-1 text-white">{duration}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
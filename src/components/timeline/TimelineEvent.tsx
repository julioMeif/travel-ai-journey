// src/components/timeline/TimelineEvent.tsx
import React from 'react';
import Image from 'next/image';
import { GlassPanel } from '../ui/GlassPanel';

export type EventType = 'flight' | 'hotel' | 'activity' | 'transport';

interface ItinerarySegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureTime:    string;
  arrivalTime:      string;
  carrier:          string;
  flightNumber:     string;
  duration:         string;
}

interface TimelineEventProps {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  time?: string;
  duration?: string;
  location?: string;
  price?: number;
  type: EventType;
  segments?: ItinerarySegment[];           // ← new
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
  segments = [],
  expanded = false,
  onToggle
}) => {
  const getEventIcon = () => {
    switch(type){
      case 'flight':   return '✈️';
      case 'hotel':    return '🏨';
      case 'activity': return '🎯';
      case 'transport':return '🚕';
      default:         return '📍';
    }
  };
  const getEventColor = () => {
    switch(type){
      case 'flight':   return 'primary';
      case 'hotel':    return 'success';
      case 'activity': return 'warning';
      case 'transport':return 'default';
      default:         return 'default';
    }
  };

  return (
    <div className="mb-4">
      <GlassPanel
        color={getEventColor()}
        className={`transition-all duration-300 ${expanded ? 'scale-[1.02]' : ''}`}
        hoverEffect
        onClick={onToggle}
      >
        <div className="flex">
          {/* Icon & time */}
          <div className="w-16 flex-shrink-0 flex flex-col items-center pt-4">
            <div className="text-2xl mb-1">{getEventIcon()}</div>
            {time && <div className="text-sm text-white/80">{time}</div>}
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              {price !== undefined && (
                <span className="text-white font-medium">${price}</span>
              )}
            </div>
            
            {!expanded ? (
              <p className="text-white/80 text-sm mt-1 line-clamp-1">{description}</p>
            ) : (
              <>
                {/* Big image */}
                <div className="mt-3 h-36 relative rounded-lg overflow-hidden">
                  <Image src={imageSrc} alt={title} fill className="object-cover" />
                </div>

                {/* Full description */}
                <p className="text-white/80 text-sm mt-3">{description}</p>

                {/* Location & duration */}
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

                {/* — New: Full flight segments */}
                {type === 'flight' && segments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-semibold mb-2">Itinerary</h4>
                    {segments.map((seg, idx) => (
                      <p key={idx} className="text-white/80 text-sm mb-1">
                        <strong>{seg.carrier} {seg.flightNumber}</strong>:
                        {' '}
                        {new Date(seg.departureTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        {' '}{seg.departureAirport}
                        {' '}→{' '}
                        {new Date(seg.arrivalTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        {' '}{seg.arrivalAirport}
                        {' '}• {seg.duration}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

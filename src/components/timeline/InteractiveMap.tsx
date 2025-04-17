// src/components/timeline/InteractiveMap.tsx - Simplified fallback version
import React, { useState } from 'react';
import { GlassPanel } from '../ui/GlassPanel';

// Add these event type icons
const EVENT_ICONS: Record<string, string> = {
  flight: '✈️',
  hotel: '🏨',
  activity: '🧭',
  transport: '🚗',
  default: '📍'
};

export interface MapEvent {
  id: string;
  title: string;
  type: string;
  location?: string;
  time?: string;
}

export interface MapDay {
  date: Date;
  events: MapEvent[];
}

interface InteractiveMapProps {
  destination: string;
  days: MapDay[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ destination, days }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get icon for event type
  const getEventIcon = (type: string): string => {
    return EVENT_ICONS[type] || EVENT_ICONS.default;
  };

  // Toggle expanded map view
  const toggleMapExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // Create a visual representation of events using emojis
  const renderVisualMap = () => {
    const events = days[selectedDay].events.filter(event => event.location);
    
    if (events.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-white/70">No locations to display for this day.</p>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Background image or color for destination */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20" 
          style={{ backgroundImage: `url('https://source.unsplash.com/featured/?${destination}')` }}
        />
        
        {/* Center destination marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
          🏙️
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-14 text-white font-bold">
          {destination}
        </div>
        
        {/* Event markers in a circle around the destination */}
        {events.map((event, index) => {
          // Calculate position in a circle
          const angle = (index / events.length) * Math.PI * 2;
          const radius = 120; // Distance from center
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <div 
              key={event.id}
              className={`absolute text-2xl transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                         transition-all duration-300 hover:scale-125
                         ${selectedEvent?.id === event.id ? 'scale-125 z-20' : 'z-10'}`}
              style={{ 
                left: `calc(50% + ${x}px)`, 
                top: `calc(50% + ${y}px)` 
              }}
              onClick={() => setSelectedEvent(event)}
            >
              <div className="relative">
                <span>{getEventIcon(event.type)}</span>
                {selectedEvent?.id === event.id && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap z-30">
                    {event.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {events.map((event, index) => {
            // Calculate position in a circle
            const angle = (index / events.length) * Math.PI * 2;
            const radius = 120; // Distance from center
            
            return (
              <line 
                key={`line-${event.id}`}
                x1="50%" 
                y1="50%" 
                x2={`calc(50% + ${Math.cos(angle) * radius}px)`}
                y2={`calc(50% + ${Math.sin(angle) * radius}px)`}
                stroke="white" 
                strokeOpacity="0.3"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className={`relative transition-all duration-500 ease-in-out overflow-hidden rounded-xl
                    ${isExpanded ? 'fixed inset-4 z-50' : 'h-[400px] w-full'}`}>
      {/* Map content */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-800/50 to-purple-900/70">
        {renderVisualMap()}
      </div>
      
      {/* Fullscreen toggle */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={toggleMapExpansion}
          className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white text-indigo-900"
        >
          {isExpanded ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Itinerary Timeline (Only visible when expanded) */}
      {isExpanded && (
        <GlassPanel className="absolute bottom-0 left-0 right-0 max-h-60 overflow-y-auto p-4">
          <h3 className="text-lg font-bold text-white mb-4">Itinerary in {destination}</h3>
          
          {/* Day selection tabs */}
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            {days.map((day, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap
                          ${selectedDay === idx ? 'bg-indigo-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                onClick={() => setSelectedDay(idx)}
              >
                Day {idx + 1} - {formatDate(day.date)}
              </button>
            ))}
          </div>
          
          {/* Events for selected day */}
          <div className="space-y-3">
            {days[selectedDay].events.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-2 p-2 rounded transition-colors
                           ${selectedEvent?.id === event.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="mt-1 text-lg">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{event.title}</h4>
                  {event.location && (
                    <p className="text-sm text-white/70">{event.location}</p>
                  )}
                  {event.time && (
                    <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                      <span>⏰</span>
                      <span>{event.time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
      
      {/* Overlay gradient when collapsed */}
      {!isExpanded && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-6">
          <button
            onClick={toggleMapExpansion}
            className="px-4 py-2 bg-white/90 rounded-full text-sm font-medium shadow-lg hover:bg-white transition-colors"
          >
            Explore Full Map
          </button>
        </div>
      )}
    </div>
  );
};
// src/components/timeline/TimelineDay.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { TimelineEvent, EventType } from './TimelineEvent';

export interface ItinerarySegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureTime:    string;
  arrivalTime:      string;
  carrier:          string;
  flightNumber:     string;
  duration:         string;
}

export interface TimelineEventData {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  time?: string;
  duration?: string;
  location?: string;
  price?: number;
  type: EventType;
  segments?: ItinerarySegment[];
}

interface TimelineDayProps {
  date: Date;
  events: TimelineEventData[];
  dayNumber: number;
  totalDays: number;
}

export const TimelineDay: React.FC<TimelineDayProps> = ({
  date,
  events,
  dayNumber,
  totalDays,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (expanded) {
      setExpandedEvent(null);
    }
  };
  
  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvent(prev => prev === eventId ? null : eventId);
  };
  
  const flights = events.filter(event => event.type === 'flight');
  const hotels = events.filter(event => event.type === 'hotel');
  const activities = events.filter(event => event.type === 'activity');
  const transports = events.filter(event => event.type === 'transport');
  
  const isMorning = (time?: string) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0]);
    return hour < 12;
  };
  const isAfternoon = (time?: string) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12 && hour < 18;
  };
  const isEvening = (time?: string) => {
    if (!time) return false;
    const hour = parseInt(time.split(':')[0]);
    return hour >= 18;
  };
  
  return (
    <div className="mb-8">
      <GlassPanel
        color="primary"
        className="mb-4 p-4"
        hoverEffect
        onClick={toggleExpanded}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">
              Day {dayNumber} of {totalDays}
            </h3>
            <p className="text-white/80">{formattedDate}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={e => {
              e.stopPropagation();
              toggleExpanded();
            }}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        {!expanded && (
          <div className="mt-3 flex flex-wrap gap-3">
            {flights.length > 0 && (
              <div className="bg-indigo-500/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm">
                  ✈️ {flights.length} Flight{flights.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {hotels.length > 0 && (
              <div className="bg-emerald-500/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm">
                  🏨 {hotels.length} Hotel{hotels.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {activities.length > 0 && (
              <div className="bg-amber-500/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm">
                  🎯 {activities.length} Activity{activities.length !== 1 ? 'ies' : 'y'}
                </span>
              </div>
            )}
            {transports.length > 0 && (
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm">
                  🚕 {transports.length} Transport{transports.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </GlassPanel>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="ml-6 border-l-2 border-white/20 pl-6">
              
              {/* Morning */}
              <div className="mb-6">
                <h4 className="text-white/80 uppercase text-sm font-semibold mb-3">Morning</h4>
                {events.filter(e => isMorning(e.time)).map(event => (
                  <TimelineEvent
                    key={event.id}
                    {...event}
                    expanded={expandedEvent === event.id}
                    onToggle={() => toggleEventExpanded(event.id)}
                  />
                ))}
                {events.filter(e => isMorning(e.time)).length === 0 && (
                  <p className="text-white/60 italic">No morning events planned.</p>
                )}
              </div>
              
              {/* Afternoon */}
              <div className="mb-6">
                <h4 className="text-white/80 uppercase text-sm font-semibold mb-3">Afternoon</h4>
                {events.filter(e => isAfternoon(e.time)).map(event => (
                  <TimelineEvent
                    key={event.id}
                    {...event}
                    expanded={expandedEvent === event.id}
                    onToggle={() => toggleEventExpanded(event.id)}
                  />
                ))}
                {events.filter(e => isAfternoon(e.time)).length === 0 && (
                  <p className="text-white/60 italic">No afternoon events planned.</p>
                )}
              </div>
              
              {/* Evening */}
              <div>
                <h4 className="text-white/80 uppercase text-sm font-semibold mb-3">Evening</h4>
                {events.filter(e => isEvening(e.time)).map(event => (
                  <TimelineEvent
                    key={event.id}
                    {...event}
                    expanded={expandedEvent === event.id}
                    onToggle={() => toggleEventExpanded(event.id)}
                  />
                ))}
                {events.filter(e => isEvening(e.time)).length === 0 && (
                  <p className="text-white/60 italic">No evening events planned.</p>
                )}
              </div>
              
              {/* Accommodation */}
              {hotels.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <h4 className="text-white/80 uppercase text-sm font-semibold mb-3">Accommodation</h4>
                  {hotels.map(event => (
                    <TimelineEvent
                      key={event.id}
                      {...event}
                      expanded={expandedEvent === event.id}
                      onToggle={() => toggleEventExpanded(event.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// src/components/timeline/Timeline.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { TimelineDay, TimelineEventData } from './TimelineDay';
import { InteractiveMap, MapDay } from './InteractiveMap';

export interface ItineraryDay {
  date: Date;
  events: TimelineEventData[];
}

interface TimelineProps {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  days: ItineraryDay[];
  totalPrice: number;
  onBack?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  title,
  destination,
  startDate,
  endDate,
  days,
  totalPrice,
  onBack,
  onShare,
  onSave,
  onPrint,
}) => {
  const [currentView, setCurrentView] = useState<'timeline' | 'summary' | 'map'>('timeline');
  
  // Format date range
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    
    // If dates are in the same year
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${start} - ${end}, ${startDate.getFullYear()}`;
    }
    
    // If dates span different years
    return `${start}, ${startDate.getFullYear()} - ${end}, ${endDate.getFullYear()}`;
  };
  
  // Calculate trip duration in days
  const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Transform ItineraryDay to MapDay for the InteractiveMap component
  const mapDays: MapDay[] = days.map(day => ({
    date: day.date,
    events: day.events.map(event => ({
      id: event.id,
      title: event.title,
      type: event.type,
      location: event.location,
      time: event.time
    }))
  }));
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-indigo-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <GlassPanel className="mb-8 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
              <p className="text-white/80">{formatDateRange()} • {tripDuration} days</p>
              <p className="text-white/80 mt-1">🌍 {destination}</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-white/60 text-sm">Total Budget</span>
                <div className="text-white text-xl font-bold">${totalPrice.toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          {/* View tabs */}
          <div className="mb-4 flex border-b border-white/20">
            <button
              className={`px-4 py-2 text-white font-medium ${currentView === 'timeline' ? 'border-b-2 border-indigo-400' : 'text-white/70'}`}
              onClick={() => setCurrentView('timeline')}
            >
              Timeline
            </button>
            <button
              className={`px-4 py-2 text-white font-medium ${currentView === 'summary' ? 'border-b-2 border-indigo-400' : 'text-white/70'}`}
              onClick={() => setCurrentView('summary')}
            >
              Summary
            </button>
            <button
              className={`px-4 py-2 text-white font-medium ${currentView === 'map' ? 'border-b-2 border-indigo-400' : 'text-white/70'}`}
              onClick={() => setCurrentView('map')}
            >
              Map
            </button>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
              >
                Back to Selection
              </Button>
            )}
            
            {onShare && (
              <Button
                variant="primary"
                onClick={onShare}
              >
                Share Itinerary
              </Button>
            )}
            
            {onSave && (
              <Button
                variant="secondary"
                onClick={onSave}
              >
                Save as PDF
              </Button>
            )}
            
            {onPrint && (
              <Button
                variant="ghost"
                onClick={onPrint}
              >
                Print
              </Button>
            )}
          </div>
        </GlassPanel>
        
        {/* Timeline View */}
        {currentView === 'timeline' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {days.map((day, index) => (
              <TimelineDay
                key={index}
                date={day.date}
                events={day.events}
                dayNumber={index + 1}
                totalDays={days.length}
              />
            ))}
          </motion.div>
        )}
        
        {/* Summary View */}
        {currentView === 'summary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassPanel className="p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Trip Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statistics */}
                <div>
                  <h3 className="text-white/80 text-sm font-semibold uppercase mb-3">Trip Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/80">Duration</span>
                      <span className="text-white font-medium">{tripDuration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Total Activities</span>
                      <span className="text-white font-medium">
                        {days.reduce((total, day) => total + day.events.filter(e => e.type === 'activity').length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Hotels</span>
                      <span className="text-white font-medium">
                        {days.reduce((total, day) => total + day.events.filter(e => e.type === 'hotel').length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Flights</span>
                      <span className="text-white font-medium">
                        {days.reduce((total, day) => total + day.events.filter(e => e.type === 'flight').length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Local Transports</span>
                      <span className="text-white font-medium">
                        {days.reduce((total, day) => total + day.events.filter(e => e.type === 'transport').length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Budget breakdown */}
                <div>
                  <h3 className="text-white/80 text-sm font-semibold uppercase mb-3">Budget Breakdown</h3>
                  
                  {/* Calculate budget breakdown */}
                  {(() => {
                    
                    const hotelsCost = days.reduce((total, day) => 
                      total + day.events
                        .filter(e => e.type === 'hotel')
                        .reduce((sum, e) => sum + (e.price || 0), 0)
                    , 0);
                    
                    const activitiesCost = days.reduce((total, day) => 
                      total + day.events
                        .filter(e => e.type === 'activity')
                        .reduce((sum, e) => sum + (e.price || 0), 0)
                    , 0);
                    
                    const transportCost = days.reduce((total, day) => 
                      total + day.events
                        .filter(e => e.type === 'transport')
                        .reduce((sum, e) => sum + (e.price || 0), 0)
                    , 0);

                    // Derive flights from the rest
                    const flightsCost = totalPrice - (hotelsCost + activitiesCost + transportCost);
                    
                    
                    // Calculate percentages
                    const flightsPercent = Math.round((flightsCost / totalPrice) * 100);
                    const hotelsPercent = Math.round((hotelsCost / totalPrice) * 100);
                    const activitiesPercent = Math.round((activitiesCost / totalPrice) * 100);
                    const transportPercent = Math.round((transportCost / totalPrice) * 100);
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/80">Flights</span>
                            <span className="text-white font-medium">${flightsCost.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={flightsPercent} color="primary" height="sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/80">Accommodation</span>
                            <span className="text-white font-medium">${hotelsCost.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={hotelsPercent} color="success" height="sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/80">Activities</span>
                            <span className="text-white font-medium">${activitiesCost.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={activitiesPercent} color="warning" height="sm" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/80">Local Transport</span>
                            <span className="text-white font-medium">${transportCost.toLocaleString()}</span>
                          </div>
                          <ProgressBar value={transportPercent} color="default" height="sm" />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </GlassPanel>
            
            {/* Day by day summary */}
            <GlassPanel className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Day by Day Overview</h2>
              
              <div className="space-y-6">
                {days.map((day, index) => {
                  const formattedDate = new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  }).format(day.date);
                  
                  return (
                    <div key={index} className="flex">
                      <div className="w-20 flex-shrink-0">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                          <div className="text-white/80 text-xs">Day {index + 1}</div>
                          <div className="text-white font-medium">{formattedDate}</div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        {day.events.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {day.events.map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                className={`
                                  px-3 py-1 rounded-full text-white text-sm
                                  ${event.type === 'flight' ? 'bg-indigo-500/20' : ''}
                                  ${event.type === 'hotel' ? 'bg-emerald-500/20' : ''}
                                  ${event.type === 'activity' ? 'bg-amber-500/20' : ''}
                                  ${event.type === 'transport' ? 'bg-white/20' : ''}
                                `}
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/60 italic">No events scheduled</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          </motion.div>
        )}
        
        {/* Map View */}
        {currentView === 'map' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassPanel className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Interactive Map</h3>
              <InteractiveMap destination={destination} days={mapDays} />
            </GlassPanel>
          </motion.div>
        )}
      </div>
    </div>
  );
};
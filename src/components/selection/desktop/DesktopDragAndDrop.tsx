// src/components/selection/desktop/DesktopDragAndDrop.tsx
// Purpose: Main container for the desktop drag-and-drop selection interface
// Used in: The second step of the travel planning wizard

import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { GlassPanel } from '../../ui';
import { DraggableCard } from './DraggableCard';
import { DropZone } from './DropZone';
import { EventType } from '../../timeline/TimelineEvent';

// Types
export interface TravelOption {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number;
  rating?: number;
  details?: React.ReactNode;
  type: EventType;
  time?: string;
  duration?: string;
  location?: string;
}

interface DesktopDragAndDropProps {
  travelOptions: TravelOption[];
  onComplete: (acceptedOptions: TravelOption[]) => void;
  onBack?: () => void;
}

export const DesktopDragAndDrop: React.FC<DesktopDragAndDropProps> = ({
  travelOptions,
  onComplete,
  onBack,
}) => {
  const [remainingOptions, setRemainingOptions] = useState<TravelOption[]>([]);
  const [acceptedOptions, setAcceptedOptions] = useState<TravelOption[]>([]);
  const [rejectedOptions, setRejectedOptions] = useState<TravelOption[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize with travel options
  useEffect(() => {
    setRemainingOptions([...travelOptions]);
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setProgress(0);
  }, [travelOptions]);

  // Update progress when options are processed
  useEffect(() => {
    const totalOptions = travelOptions.length;
    const processedOptions = acceptedOptions.length + rejectedOptions.length;
    setProgress((processedOptions / totalOptions) * 100);
    
    // Check if all options have been processed
    if (processedOptions === totalOptions && totalOptions > 0) {
      // Allow animations to complete before proceeding
      setTimeout(() => {
        if (acceptedOptions.length > 0) {
          onComplete(acceptedOptions);
        }
      }, 800);
    }
  }, [acceptedOptions, rejectedOptions, travelOptions, onComplete]);

  // Handle accepting a travel option
  const handleAccept = (id: string) => {
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      setAcceptedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Handle rejecting a travel option
  const handleReject = (id: string) => {
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      setRejectedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Manually accept the current card (fallback button)
  const handleManualAccept = () => {
    if (remainingOptions.length > 0) {
      handleAccept(remainingOptions[0].id);
    }
  };

  // Manually reject the current card (fallback button)
  const handleManualReject = () => {
    if (remainingOptions.length > 0) {
      handleReject(remainingOptions[0].id);
    }
  };

  // Handle reconsideration of rejected options
  const handleReconsider = (id: string) => {
    const option = rejectedOptions.find(opt => opt.id === id);
    if (option) {
      setRejectedOptions(prev => prev.filter(opt => opt.id !== id));
      setRemainingOptions(prev => [option, ...prev]);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-indigo-900">
        {/* Glass panel container */}
        <div className="max-w-7xl mx-auto h-full p-6 flex flex-col">
          {/* Header with progress */}
          <GlassPanel className="mb-8 p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Travel Options</h2>
                <p className="text-white/70">Drag options to accept or reject, or use the buttons below.</p>
              </div>
              
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-transparent backdrop-blur-sm text-white border-white/10 hover:bg-white/10
                           px-4 py-2 rounded-lg transition-all duration-300
                           font-medium border"
                >
                  Back to Chat
                </button>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full">
              {/* Label */}
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-white/80">Selection Progress</span>
                <span className="text-white/80">{progress.toFixed(0)}%</span>
              </div>
              
              {/* Progress track */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                {/* Progress fill */}
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </GlassPanel>

          {/* Main content area */}
          <div className="flex-1 flex items-stretch justify-between gap-8">
            {/* Reject Zone */}
            <DropZone type="reject" onDrop={handleReject} className="w-1/4">
              {rejectedOptions.length > 0 && (
                <div className="mt-8 flex flex-col items-center">
                  <span className="text-white/60 text-sm mb-4">
                    {rejectedOptions.length} option{rejectedOptions.length !== 1 ? 's' : ''} skipped
                  </span>
                  
                  {/* Show some rejected options that can be reconsidered */}
                  <div className="space-y-2 w-full px-2 max-h-60 overflow-y-auto">
                    {rejectedOptions.slice(0, 3).map((option) => (
                      <GlassPanel 
                        key={option.id}
                        className="p-2 cursor-pointer"
                        hoverEffect={true}
                        onClick={() => handleReconsider(option.id)}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 relative rounded overflow-hidden">
                            <img
                              src={option.imageSrc}
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-2 flex-1 truncate">
                            <p className="text-sm text-white font-medium truncate">{option.title}</p>
                          </div>
                        </div>
                      </GlassPanel>
                    ))}
                    
                    {rejectedOptions.length > 3 && (
                      <p className="text-white/60 text-xs text-center">
                        +{rejectedOptions.length - 3} more skipped options
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DropZone>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center relative">
              {remainingOptions.map((option, index) => (
                <DraggableCard
                  key={option.id}
                  id={option.id}
                  title={option.title}
                  description={option.description}
                  imageSrc={option.imageSrc}
                  price={option.price}
                  rating={option.rating}
                  details={option.details}
                  index={index}
                  totalCards={remainingOptions.length}
                  onAccept={() => handleAccept(option.id)}
                  onReject={() => handleReject(option.id)}
                />
              ))}
              
              {/* Empty state */}
              {remainingOptions.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <GlassPanel className="p-8">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {acceptedOptions.length > 0
                        ? "All options reviewed!"
                        : "No travel options available"}
                    </h3>
                    <p className="text-white/70 mb-6">
                      {acceptedOptions.length > 0
                        ? `You've added ${acceptedOptions.length} option${acceptedOptions.length !== 1 ? 's' : ''} to your trip.`
                        : "Please try again with different preferences."}
                    </p>
                    
                    {acceptedOptions.length > 0 && (
                      <button 
                        onClick={() => onComplete(acceptedOptions)}
                        className="px-6 py-3 rounded-lg text-lg transition-all duration-300 font-medium border
                                 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent
                                 hover:shadow-lg hover:scale-[1.02]"
                      >
                        Continue to Itinerary
                      </button>
                    )}
                    
                    {acceptedOptions.length === 0 && onBack && (
                      <button 
                        onClick={onBack}
                        className="px-6 py-3 rounded-lg text-lg transition-all duration-300 font-medium border
                                 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent
                                 hover:shadow-lg hover:scale-[1.02]"
                      >
                        Back to Preferences
                      </button>
                    )}
                  </GlassPanel>
                </motion.div>
              )}
            </div>

            {/* Accept Zone */}
            <DropZone type="accept" onDrop={handleAccept} className="w-1/4">
              {acceptedOptions.length > 0 && (
                <div className="mt-8 flex flex-col items-center">
                  <span className="text-white/60 text-sm mb-4">
                    {acceptedOptions.length} option{acceptedOptions.length !== 1 ? 's' : ''} selected
                  </span>
                  
                  {/* Show all accepted options */}
                  <div className="space-y-2 w-full px-2 max-h-60 overflow-y-auto">
                    {acceptedOptions.map((option) => (
                      <GlassPanel 
                        key={option.id}
                        className="p-2"
                        color="success"
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 relative rounded overflow-hidden">
                            <img
                              src={option.imageSrc}
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-2 flex-1 truncate">
                            <p className="text-sm text-white font-medium truncate">{option.title}</p>
                            {option.price && (
                              <p className="text-xs text-white/70">${option.price}</p>
                            )}
                          </div>
                        </div>
                      </GlassPanel>
                    ))}
                  </div>
                  
                  {/* Skip to itinerary button */}
                  {acceptedOptions.length >= 3 && remainingOptions.length > 0 && (
                    <button
                      onClick={() => onComplete(acceptedOptions)}
                      className="mt-4 px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-medium border
                              bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent
                              hover:shadow-lg hover:scale-[1.02]"
                    >
                      Continue with {acceptedOptions.length} selection{acceptedOptions.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </DropZone>
          </div>

          {/* Manual Controls (for accessibility and fallback) */}
          {remainingOptions.length > 0 && (
            <div className="mt-8 flex justify-center gap-6">
              <button
                onClick={handleManualReject}
                disabled={isTransitioning}
                className={`px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm 
                         hover:bg-white/20 transition-all duration-300
                         text-white font-medium border border-white/20
                         ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ↩️ Skip
              </button>
              <button
                onClick={handleManualAccept}
                disabled={isTransitioning}
                className={`px-6 py-3 rounded-lg bg-white/10 backdrop-blur-sm 
                         hover:bg-white/20 transition-all duration-300
                         text-white font-medium border border-white/20
                         ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Add to Trip ↪️
              </button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
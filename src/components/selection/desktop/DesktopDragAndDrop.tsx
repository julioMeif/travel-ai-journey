// src/components/selection/desktop/DesktopDragAndDrop.tsx
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../../ui';
import { DraggableCard } from './DraggableCard';
import { DropZone } from './DropZone';
import { EventType } from '../../timeline/TimelineEvent';

// Configure DND HTML5 backend with enhanced options
const dndOptions = {
  enableTouchEvents: true,
  enableMouseEvents: true,
  delay: 0, // Reduced delay for more immediate response
  enableKeyboardEvents: true, // Enable keyboard accessibility
  rootElement: typeof document !== 'undefined' ? document.body : undefined, // Ensure dragging works across the entire page
};

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
  const [visibleCardCount, setVisibleCardCount] = useState(0);
  
  // Initialize with travel options
  useEffect(() => {
    setRemainingOptions([...travelOptions]);
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setProgress(0);
    
    // Progressive card appearance
    if (travelOptions.length > 0) {
      // Start with no cards visible
      setVisibleCardCount(0);
      
      // Sequentially show cards with a delay
      const interval = setInterval(() => {
        setVisibleCardCount(prev => {
          const newCount = prev + 1;
          // Stop the interval once all cards are visible
          if (newCount >= Math.min(5, travelOptions.length)) {
            clearInterval(interval);
          }
          return newCount;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
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

  // Handle accepting a travel option - IMPROVED LOGGING
  const handleAccept = (id: string) => {
    console.log(`ACCEPT: Processing card with ID: ${id}`);
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      console.log(`ACCEPT: Found option:`, option.title);
      setAcceptedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
      
      // Show the next card in the stack with animation
      if (visibleCardCount < remainingOptions.length) {
        setTimeout(() => {
          setVisibleCardCount(prev => Math.min(prev + 1, remainingOptions.length));
        }, 300);
      }
    } else {
      console.error(`ACCEPT: Option with ID ${id} not found in remaining options`);
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Handle rejecting a travel option - IMPROVED LOGGING
  const handleReject = (id: string) => {
    console.log(`REJECT: Processing card with ID: ${id}`);
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      console.log(`REJECT: Found option:`, option.title);
      setRejectedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
      
      // Show the next card in the stack with animation
      if (visibleCardCount < remainingOptions.length) {
        setTimeout(() => {
          setVisibleCardCount(prev => Math.min(prev + 1, remainingOptions.length));
        }, 300);
      }
    } else {
      console.error(`REJECT: Option with ID ${id} not found in remaining options`);
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
      
      // Ensure the reconsidered card is visible
      setVisibleCardCount(prev => Math.max(prev, 1));
    }
  };
  
  // Prevent browser drag and drop behavior with logging
  const preventBrowserDragDrop = (e: React.DragEvent) => {
    console.log("Preventing browser drag behavior");
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <DndProvider backend={HTML5Backend} options={dndOptions}>
      <div 
        className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-indigo-900"
        onDragOver={preventBrowserDragDrop}
        onDrop={preventBrowserDragDrop}
      >
        {/* Glass panel container */}
        <div className="max-w-7xl mx-auto h-full p-6 flex flex-col">
          {/* Header with progress */}
          <GlassPanel className="mb-8 p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Travel Options</h2>
                <p className="text-white/70">Drag options to accept or reject, or use the buttons below.</p>
              </div>
              
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-transparent backdrop-blur-sm text-white border-white/20 hover:bg-white/10
                           px-4 py-2 rounded-lg transition-all duration-300
                           font-medium border whitespace-nowrap"
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
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </GlassPanel>

          {/* Main content area */}
          <div 
            className="flex-1 flex flex-col lg:flex-row items-stretch justify-between gap-6"
            onDragEnter={preventBrowserDragDrop}
            onDragOver={preventBrowserDragDrop}
          >
            {/* Reject Zone */}
            <DropZone type="reject" onDrop={handleReject} className="w-full lg:w-1/4 h-40 lg:h-auto">
              {rejectedOptions.length > 0 && (
                <div className="mt-8 flex flex-col items-center">
                  <span className="text-white/60 text-sm mb-4">
                    {rejectedOptions.length} option{rejectedOptions.length !== 1 ? 's' : ''} skipped
                  </span>
                  
                  {/* Show some rejected options that can be reconsidered */}
                  <div className="space-y-2 w-full px-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {rejectedOptions.slice(0, 3).map((option, idx) => (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.1 }}
                        >
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
                                  draggable={false}
                                />
                              </div>
                              <div className="ml-2 flex-1 truncate">
                                <p className="text-sm text-white font-medium truncate">{option.title}</p>
                              </div>
                            </div>
                          </GlassPanel>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
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
            <div className="flex-1 flex items-center justify-center relative h-96 lg:h-auto min-h-[24rem]"
                 onDragOver={preventBrowserDragDrop}>
              {/* Card Stack */}
              <div className="relative w-80 h-96">
                {/* Add debug info */}
                <div className="absolute top-0 left-0 -mt-6 text-xs text-white/50">
                  {isTransitioning ? 'Transitioning...' : 'Ready'}
                </div>
                
                <AnimatePresence>
                  {remainingOptions.slice(0, visibleCardCount).map((option, index) => (
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
                      totalCards={Math.min(remainingOptions.length, visibleCardCount)}
                      onAccept={() => handleAccept(option.id)}
                      onReject={() => handleReject(option.id)}
                      isTopCard={index === 0} // Only the top card is interactive
                    />
                  ))}
                </AnimatePresence>
                
                {/* Empty state */}
                {remainingOptions.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <GlassPanel className="p-8 h-full flex flex-col items-center justify-center">
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
              
              {/* Card count and instructions */}
              {remainingOptions.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 mb-4 text-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/80 text-sm"
                  >
                    {remainingOptions.length} option{remainingOptions.length !== 1 ? 's' : ''} remaining
                  </motion.div>
                </div>
              )}
            </div>

            {/* Accept Zone */}
            <DropZone type="accept" onDrop={handleAccept} className="w-full lg:w-1/4 h-40 lg:h-auto">
              {acceptedOptions.length > 0 && (
                <div className="mt-8 flex flex-col items-center">
                  <span className="text-white/60 text-sm mb-4">
                    {acceptedOptions.length} option{acceptedOptions.length !== 1 ? 's' : ''} selected
                  </span>
                  
                  {/* Show all accepted options */}
                  <div className="space-y-2 w-full px-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {acceptedOptions.map((option, idx) => (
                        <motion.div
                          key={option.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: idx * 0.1 }}
                        >
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
                                  draggable={false}
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
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
            <motion.div 
              className="mt-8 flex justify-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleManualReject}
                disabled={isTransitioning}
                className={`px-6 py-3 rounded-lg bg-gradient-to-r from-rose-600/80 to-pink-600/80 
                         hover:from-rose-600 hover:to-pink-600 transition-all duration-300
                         text-white font-medium border border-white/20
                         ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ↩️ Skip
              </button>
              <button
                onClick={handleManualAccept}
                disabled={isTransitioning}
                className={`px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600/80 to-teal-600/80
                         hover:from-emerald-600 hover:to-teal-600 transition-all duration-300
                         text-white font-medium border border-white/20
                         ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Add to Trip ↪️
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
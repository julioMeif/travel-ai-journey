// Modified DesktopDragAndDrop.tsx with layout fixes

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
  delay: 0,
  enableKeyboardEvents: true,
  rootElement: typeof document !== 'undefined' ? document.body : undefined,
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

  // Filter out flights/hotels if already accepted
  const isTypeAlreadyAccepted = (type: EventType) =>
    ['flight', 'hotel'].includes(type) &&
    acceptedOptions.some(opt => opt.type === type);

  const filteredRemainingOptions = remainingOptions.filter(
    opt => !isTypeAlreadyAccepted(opt.type)
  );
  
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

  // Handle accepting a travel option
  const handleAccept = (id: string) => {
    console.log(`ACCEPT: Processing card with ID: ${id}`);
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      console.log(`ACCEPT: Found option:`, option.title);
      setAcceptedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
      
      // Show next card if there are still filtered cards left
      if (visibleCardCount < filteredRemainingOptions.length) {
        setTimeout(() => {
          setVisibleCardCount(prev => Math.min(prev + 1, filteredRemainingOptions.length));
        }, 300);
      }
    } else {
      console.error(`ACCEPT: Option with ID ${id} not found`);
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Handle rejecting a travel option
  const handleReject = (id: string) => {
    console.log(`REJECT: Processing card with ID: ${id}`);
    setIsTransitioning(true);
    
    const option = remainingOptions.find(opt => opt.id === id);
    if (option) {
      console.log(`REJECT: Found option:`, option.title);
      setRejectedOptions(prev => [...prev, option]);
      setRemainingOptions(prev => prev.filter(opt => opt.id !== id));
      
      if (visibleCardCount < filteredRemainingOptions.length) {
        setTimeout(() => {
          setVisibleCardCount(prev => Math.min(prev + 1, filteredRemainingOptions.length));
        }, 300);
      }
    } else {
      console.error(`REJECT: Option with ID ${id} not found`);
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Manual accept/reject for fallback
  const handleManualAccept = () => {
    if (filteredRemainingOptions.length > 0) {
      handleAccept(filteredRemainingOptions[0].id);
    }
  };
  const handleManualReject = () => {
    if (filteredRemainingOptions.length > 0) {
      handleReject(filteredRemainingOptions[0].id);
    }
  };

  // Prevent browser drag/drop
  const preventBrowserDragDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); return false;
  };

  return (
    <DndProvider backend={HTML5Backend} options={dndOptions}>
      <div 
        className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-800 to-indigo-900"
        onDragOver={preventBrowserDragDrop}
        onDrop={preventBrowserDragDrop}
      >
        <div className="max-w-7xl mx-auto h-full p-4 md:p-6 flex flex-col">
          {/* Header with progress */}
          <GlassPanel className="mb-6 md:mb-8 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Select Your Travel Options</h2>
                <p className="text-white/70">Drag options to accept or reject, or use the buttons below.</p>
              </div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="bg-transparent backdrop-blur-sm text-white border-white/20 hover:bg-white/10
                             px-4 py-2 rounded-lg transition-all duration-300 font-medium border whitespace-nowrap"
                >
                  Back to Chat
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-white/80">Selection Progress</span>
                <span className="text-white/80">{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </GlassPanel>

          {/* Main content - UPDATED LAYOUT */}
          <div 
            className="flex-1 flex flex-col lg:flex-row items-stretch justify-between gap-4 md:gap-6 min-h-[500px]"
            onDragEnter={preventBrowserDragDrop}
            onDragOver={preventBrowserDragDrop}
          >
            {/* Reject Zone - ADJUSTED WIDTH */}
            <DropZone type="reject" onDrop={handleReject} className="w-full lg:w-1/4 h-64 lg:h-auto flex-shrink-0">
              {rejectedOptions.length > 0 && (
                <div className="mt-4 lg:mt-8 flex flex-col items-center w-full">
                  <span className="text-white/60 text-sm mb-2 lg:mb-4">
                    {rejectedOptions.length} option{rejectedOptions.length !== 1 ? 's' : ''} skipped
                  </span>
                  <div className="space-y-2 w-full max-w-full px-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {rejectedOptions.slice(0, 3).map((opt, i) => (
                        <motion.div
                          key={opt.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-full"
                        >
                          <GlassPanel 
                            className="p-2 cursor-pointer w-full"
                            hoverEffect
                            onClick={() => {
                              // allow reconsider
                              setRejectedOptions(prev => prev.filter(x => x.id !== opt.id));
                              setRemainingOptions(prev => [opt, ...prev]);
                              setVisibleCardCount(prev => Math.max(prev, 1));
                            }}
                          >
                            <div className="flex items-center">
                              <img src={opt.imageSrc} alt={opt.title}
                                   className="w-12 h-12 rounded object-cover flex-shrink-0" draggable={false}/>
                              <p className="ml-2 text-white font-medium truncate">{opt.title}</p>
                            </div>
                          </GlassPanel>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {rejectedOptions.length > 3 && <p className="text-white/60 text-xs text-center">
                      +{rejectedOptions.length - 3} more skipped options
                    </p>}
                  </div>
                </div>
              )}
            </DropZone>

            {/* Card Stack - INCREASED SIZE */}
            <div className="flex-1 flex flex-col items-center justify-center relative h-[400px] lg:h-auto min-h-[400px] mb-32 lg:mb-0">
              {/* Card container with proper spacing for buttons */}
              <div className="relative w-72 sm:w-80 md:w-96 h-[400px] md:h-[450px]">
                <div className="absolute top-0 left-0 -mt-6 text-xs text-white/50">
                  {isTransitioning ? 'Transitioning...' : 'Ready'}
                </div>
                <AnimatePresence>
                  {filteredRemainingOptions.slice(0, visibleCardCount).map((opt, idx) => (
                    <DraggableCard
                      key={opt.id}
                      id={opt.id}
                      title={opt.title}
                      description={opt.description}
                      imageSrc={opt.imageSrc}
                      price={opt.price}
                      rating={opt.rating}
                      details={opt.details}
                      index={idx}
                      totalCards={Math.min(filteredRemainingOptions.length, visibleCardCount)}
                      onAccept={() => handleAccept(opt.id)}
                      onReject={() => handleReject(opt.id)}
                      isTopCard={idx === 0}
                    />
                  ))}
                </AnimatePresence>
                {filteredRemainingOptions.length === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-center text-white/70 mt-4">
                    No more options
                  </motion.div>
                )}

                {/* Remaining count */}
                {filteredRemainingOptions.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 mb-4 text-center text-white/80 text-sm">
                    {filteredRemainingOptions.length} option{filteredRemainingOptions.length !== 1 ? 's' : ''} remaining
                  </div>
                )}
              </div>
              
              {/* REPOSITIONED: Manual Controls - with absolute positioning and proper spacing */}
              {filteredRemainingOptions.length > 0 && (
                <div className="absolute bottom-[-80px] left-0 right-0 flex justify-center gap-6">
                  <button onClick={handleManualReject}
                          className="px-6 py-3 rounded-lg bg-rose-500 text-white shadow-lg z-20">
                    ↩️ Skip
                  </button>
                  <button onClick={handleManualAccept}
                          className="px-6 py-3 rounded-lg bg-emerald-500 text-white shadow-lg z-20">
                    Add to Trip ↪️
                  </button>
                </div>
              )}
            </div>

            {/* Accept Zone - ADJUSTED WIDTH */}
            <DropZone type="accept" onDrop={handleAccept} className="w-full lg:w-1/4 h-64 lg:h-auto flex-shrink-0">
              {acceptedOptions.length > 0 && (
                <div className="mt-4 lg:mt-8 flex flex-col items-center w-full">
                  <span className="text-white/60 text-sm mb-2 lg:mb-4">
                    {acceptedOptions.length} option{acceptedOptions.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="space-y-2 w-full max-w-full px-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {acceptedOptions.map((opt, i) => (
                        <motion.div
                          key={opt.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-full"
                        >
                          <GlassPanel className="p-2 w-full" color="success">
                            <div className="flex items-center">
                              <img src={opt.imageSrc} alt={opt.title}
                                   className="w-12 h-12 rounded object-cover flex-shrink-0" draggable={false}/>
                              <p className="ml-2 text-white font-medium truncate">{opt.title}</p>
                            </div>
                          </GlassPanel>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {acceptedOptions.length >= 1 && (
                    <button
                      onClick={() => onComplete(acceptedOptions)}
                      className="mt-4 px-3 py-1.5 rounded-lg text-sm font-medium w-full max-w-[200px]
                                 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    >
                      Continue with {acceptedOptions.length} selection{acceptedOptions.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </DropZone>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
// src/components/selection/mobile/SwipeDeck.tsx
// Purpose: Main swipe interface for mobile devices
// Used in: The second step of the travel planning wizard on mobile

import React, { useState, useEffect, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { CardDetails } from './CardDetails';
import { GlassPanel } from '../../ui/GlassPanel';
import { Button } from '../../ui/Button';
import { ProgressBar } from '../../ui/ProgressBar';

// Types
export interface TravelOption {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number;
  rating?: number;
  details?: React.ReactNode;
  type: 'flight' | 'hotel' | 'activity' | 'transport'; // Add this line
  time?: string;
  duration?: string;
  location?: string;
}

interface SwipeDeckProps {
  travelOptions: TravelOption[];
  onComplete: (acceptedOptions: TravelOption[]) => void;
  onBack?: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  travelOptions,
  onComplete,
  onBack,
}) => {
  const [cards, setCards] = useState<TravelOption[]>([]);
  const [acceptedOptions, setAcceptedOptions] = useState<TravelOption[]>([]);
  const [rejectedOptions, setRejectedOptions] = useState<TravelOption[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TravelOption | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Store success/failure record of swipe callbacks
  const swipeRecordRef = useRef<Record<string, boolean>>({});

  // Initialize cards
  useEffect(() => {
    setCards([...travelOptions].reverse());
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setCurrentIndex(travelOptions.length - 1);
    setProgress(0);
    swipeRecordRef.current = {};
  }, [travelOptions]);

  // Update progress
  useEffect(() => {
    const totalOptions = travelOptions.length;
    const processedOptions = acceptedOptions.length + rejectedOptions.length;
    setProgress((processedOptions / totalOptions) * 100);
    
    // Check if all options have been processed
    if (processedOptions === totalOptions && totalOptions > 0 && !isAnimating) {
      // Allow animations to complete before proceeding
      setTimeout(() => {
        if (acceptedOptions.length > 0) {
          onComplete(acceptedOptions);
        }
      }, 800);
    }
  }, [acceptedOptions, rejectedOptions, travelOptions, onComplete, isAnimating]);

  // Handle card swiped callback
  const handleSwiped = (direction: string, id: string, index: number) => {
    setIsAnimating(false);
    setSwipeDirection(null);
    
    // Only process if we haven't already recorded this swipe
    if (!swipeRecordRef.current[id]) {
      const option = travelOptions.find(opt => opt.id === id);
      if (option) {
        if (direction === 'right') {
          setAcceptedOptions(prev => [...prev, option]);
        } else if (direction === 'left') {
          setRejectedOptions(prev => [...prev, option]);
        }
        swipeRecordRef.current[id] = true;
      }
    }
    
    setCurrentIndex(index - 1);
  };

  // Handle swipe start
  const handleSwipeStart = (direction: 'left' | 'right') => {
    setIsAnimating(true);
    setSwipeDirection(direction);
  };

  // Manually trigger swipe
  const triggerSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      handleSwipeStart(direction);
      // Note: This is a simplified reference to react-tinder-card API
      // The actual implementation would need to use the API's swipe method
      console.log(`Manual swipe ${direction} triggered for card ${cards[currentIndex].id}`);
      // In a real implementation, you would do something like:
      // cardRefs.current[currentIndex].swipe(direction);
    }
  };

  // Open card details
  const handleOpenDetails = () => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      setSelectedCard(cards[currentIndex]);
      setDetailsOpen(true);
    }
  };

  // Action handlers for details modal
  const handleAcceptFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      triggerSwipe('right');
    }, 300);
  };

  const handleRejectFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      triggerSwipe('left');
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-indigo-900 p-4 flex flex-col">
      {/* Header */}
      <GlassPanel className="mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Select Your Options</h2>
            <p className="text-white/70 text-sm">Swipe right to accept, left to skip</p>
          </div>
          
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              Back
            </Button>
          )}
        </div>
        
        {/* Progress bar */}
        <ProgressBar 
          value={progress} 
          color="primary"
          label="Selection Progress"
        />
      </GlassPanel>
      
      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative h-[500px] w-full max-w-sm">
          {cards.map((card, index) => (
            <div key={card.id} className={`absolute w-full h-full swipe-card-${card.id}`}>
              <TinderCard
                onSwipe={(dir) => handleSwiped(dir, card.id, index)}
                preventSwipe={['up', 'down']}
              >
                <div className="w-full h-full" onClick={handleOpenDetails}>
                  <SwipeCard
                    id={card.id}
                    title={card.title}
                    description={card.description}
                    imageSrc={card.imageSrc}
                    price={card.price}
                    rating={card.rating}
                    details={card.details}
                    onExpand={handleOpenDetails}
                  />
                </div>
              </TinderCard>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {(currentIndex < 0 || cards.length === 0) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center px-4"
          >
            <GlassPanel className="p-6">
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
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => onComplete(acceptedOptions)}
                  fullWidth
                >
                  Continue to Itinerary
                </Button>
              )}
              
              {acceptedOptions.length === 0 && onBack && (
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={onBack}
                  fullWidth
                >
                  Back to Preferences
                </Button>
              )}
            </GlassPanel>
          </motion.div>
        )}
      </div>
      
      {/* Manual control buttons */}
      {currentIndex >= 0 && cards.length > 0 && (
        <div className="mt-6 flex justify-center gap-8">
          <Button
            variant="danger"
            size="lg"
            onClick={() => triggerSwipe('left')}
            disabled={isAnimating}
            className="w-24 h-24 rounded-full"
          >
            <span className="text-2xl">👎</span>
          </Button>
          
          <Button
            variant="success"
            size="lg"
            onClick={() => triggerSwipe('right')}
            disabled={isAnimating}
            className="w-24 h-24 rounded-full"
          >
            <span className="text-2xl">👍</span>
          </Button>
        </div>
      )}
      
      {/* Card Details Modal */}
      <AnimatePresence>
        {detailsOpen && selectedCard && (
          <CardDetails
            title={selectedCard.title}
            description={selectedCard.description}
            imageSrc={selectedCard.imageSrc}
            price={selectedCard.price}
            rating={selectedCard.rating}
            details={selectedCard.details}
            onClose={() => setDetailsOpen(false)}
            onAccept={handleAcceptFromDetails}
            onReject={handleRejectFromDetails}
          />
        )}
      </AnimatePresence>
      
      {/* Selection counter badges */}
      <div className="mt-6 flex justify-center gap-6">
        <GlassPanel className="py-2 px-4" color="danger">
          <span className="text-white">
            <span className="font-bold">{rejectedOptions.length}</span> Skipped
          </span>
        </GlassPanel>
        
        <GlassPanel className="py-2 px-4" color="success">
          <span className="text-white">
            <span className="font-bold">{acceptedOptions.length}</span> Accepted
          </span>
        </GlassPanel>
      </div>
    </div>
  );
};
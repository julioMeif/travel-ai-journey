// src/components/selection/mobile/SwipeDeck.tsx
import React, { useState, useEffect, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { CardDetails } from './CardDetails';
import { GlassPanel } from '../../ui/GlassPanel';
import { Button } from '../../ui/Button';
import { ProgressBar } from '../../ui/ProgressBar';

export interface TravelOption {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number;
  rating?: number;
  details?: React.ReactNode;
  type: 'flight' | 'hotel' | 'activity' | 'transport';
  time?: string;
  duration?: string;
  location?: string;
}

interface SwipeDeckProps {
  travelOptions: TravelOption[];
  onComplete: (acceptedOptions: TravelOption[]) => void;
  onBack?: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ travelOptions, onComplete, onBack }) => {
  const [cards, setCards] = useState<TravelOption[]>([]);
  const [acceptedOptions, setAcceptedOptions] = useState<TravelOption[]>([]);
  const [rejectedOptions, setRejectedOptions] = useState<TravelOption[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TravelOption | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const swipeRecordRef = useRef<Record<string, boolean>>({});

  // Helper function to check if a type is already accepted
  const isTypeAlreadyAccepted = (type: string) => 
    ['flight', 'hotel'].includes(type) && acceptedOptions.some(opt => opt.type === type);

  // Filter out options of types that are already accepted (flight, hotel)
  const filterRemainingOptions = (options: TravelOption[]) => {
    return options.filter(opt => !isTypeAlreadyAccepted(opt.type));
  };

  // Initialize cards on component mount and when travelOptions change
  useEffect(() => {
    // Apply filtering for initial setup
    const filteredOptions = filterRemainingOptions(travelOptions);
    setCards([...filteredOptions].reverse());
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setCurrentIndex(filteredOptions.length - 1);
    setProgress(0);
    swipeRecordRef.current = {};
  }, [travelOptions, filterRemainingOptions]);

  // Update progress and check for completion
  useEffect(() => {
    const totalOptions = travelOptions.length;
    const processedOptions = acceptedOptions.length + rejectedOptions.length;
    setProgress((processedOptions / totalOptions) * 100);
    if (processedOptions === totalOptions && totalOptions > 0 && !isAnimating) {
      setTimeout(() => {
        if (acceptedOptions.length > 0) {
          onComplete(acceptedOptions);
        }
      }, 800);
    }
  }, [acceptedOptions, rejectedOptions, travelOptions, onComplete, isAnimating]);

  // Handle card swiped event
  const handleSwiped = (direction: string, id: string, index: number) => {
    setIsAnimating(false);
    if (!swipeRecordRef.current[id]) {
      const option = travelOptions.find(opt => opt.id === id);
      if (option) {
        if (direction === 'right') {
          // Accept the option
          setAcceptedOptions(prev => {
            // For flights and hotels, replace any existing option of same type
            // For activities, just add to the list
            return ['flight', 'hotel'].includes(option.type)
              ? [...prev.filter(o => o.type !== option.type), option]
              : [...prev, option];
          });
          
          // If we accepted a flight or hotel option, we need to re-filter remaining cards
          if (['flight', 'hotel'].includes(option.type)) {
            const updatedCards = cards.filter(card => 
              card.id !== id && 
              (card.type !== option.type || card.type === 'activity')
            );
            setCards(updatedCards);
            // Update current index if necessary
            if (index > 0) {
              // Account for removed cards
              const newIndex = Math.min(index - 1, updatedCards.length - 1);
              setCurrentIndex(newIndex);
            }
          }
        } else if (direction === 'left') {
          // Reject the option
          setRejectedOptions(prev => [...prev, option]);
        }
        swipeRecordRef.current[id] = true;
      }
    }
    
    // Only update the current index if we haven't modified the cards array
    if (!['flight', 'hotel'].includes(travelOptions.find(opt => opt.id === id)?.type || '')) {
      setCurrentIndex(index - 1);
    }
  };

  // Trigger programmatic swipe
  const triggerSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      console.log(`Trigger swipe ${direction} for card ${cards[currentIndex].id}`);
      // In a real implementation, you would call the actual swipe method from react-tinder-card
      // For now, we'll simulate it by calling handleSwiped directly
      handleSwiped(direction, cards[currentIndex].id, currentIndex);
    }
  };

  // Open card details
  const handleOpenDetails = () => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      setSelectedCard(cards[currentIndex]);
      setDetailsOpen(true);
    }
  };

  // Handle accept from details
  const handleAcceptFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      triggerSwipe('right');
    }, 300);
  };

  // Handle reject from details
  const handleRejectFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => {
      triggerSwipe('left');
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-indigo-900 p-4 flex flex-col">
      <GlassPanel className="mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Select Your Options</h2>
            <p className="text-white/70 text-sm">Swipe right to accept, left to skip</p>
          </div>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <ProgressBar value={progress} color="primary" label="Selection Progress" />
      </GlassPanel>

      <div className="flex-1 flex flex-col items-center justify-center px-4 touch-pan-y">
        <div className="relative w-full h-[70vh] overflow-hidden">
          {cards.map((card, index) => (
            <TinderCard
              key={card.id}
              className="absolute inset-0"
              onSwipe={(dir) => handleSwiped(dir, card.id, index)}
              preventSwipe={['up', 'down']}
            >
              <SwipeCard {...card} onExpand={handleOpenDetails} />
            </TinderCard>
          ))}
        </div>
      </div>

      {currentIndex >= 0 && cards.length > 0 && (
        <div className="mt-6 flex justify-center gap-8">
          <Button variant="danger" size="lg" onClick={() => triggerSwipe('left')}>
            👎
          </Button>
          <Button variant="success" size="lg" onClick={() => triggerSwipe('right')}>
            👍
          </Button>
        </div>
      )}

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
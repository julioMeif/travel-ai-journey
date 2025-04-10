// src/components/selection/mobile/SwipeDeck.tsx
import React, { useState, useEffect, useRef } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from './SwipeCard';
import { CardDetails } from './CardDetails';
import { GlassPanel } from '../../ui/GlassPanel';
import { Button } from '../../ui/Button';
import { ProgressBar } from '../../ui/ProgressBar';

// Types for travel options
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

  // Ref to record which cards have been swiped
  const swipeRecordRef = useRef<Record<string, boolean>>({});

  // Initialize cards when travelOptions change
  useEffect(() => {
    setCards([...travelOptions].reverse());
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setCurrentIndex(travelOptions.length - 1);
    setProgress(0);
    swipeRecordRef.current = {};
  }, [travelOptions]);

  // Update progress and complete if all are processed
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

  // Process a swipe
  const handleSwiped = (direction: string, id: string, index: number) => {
    setIsAnimating(false);
    if (!swipeRecordRef.current[id]) {
      const option = travelOptions.find((opt) => opt.id === id);
      if (option) {
        if (direction === 'right') {
          setAcceptedOptions((prev) => [...prev, option]);
        } else if (direction === 'left') {
          setRejectedOptions((prev) => [...prev, option]);
        }
        swipeRecordRef.current[id] = true;
      }
    }
    setCurrentIndex(index - 1);
  };

  // Stub for triggering a swipe manually
  const triggerSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      console.log(`Trigger swipe ${direction} for card ${cards[currentIndex].id}`);
      // To implement a full swipe, integrate react-tinder-card's ref methods.
    }
  };

  const handleOpenDetails = () => {
    if (currentIndex >= 0 && currentIndex < cards.length) {
      setSelectedCard(cards[currentIndex]);
      setDetailsOpen(true);
    }
  };

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
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <ProgressBar value={progress} color="primary" label="Selection Progress" />
      </GlassPanel>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Notice we removed max-width here to let the card span full width */}
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

      {/* Manual Control Buttons */}
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

      {/* Selection Counters */}
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

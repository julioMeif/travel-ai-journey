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

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  travelOptions,
  onComplete,
  onBack
}) => {
  const [cards, setCards] = useState<TravelOption[]>([]);
  const [acceptedOptions, setAcceptedOptions] = useState<TravelOption[]>([]);
  const [rejectedOptions, setRejectedOptions] = useState<TravelOption[]>([]);
  const [progress, setProgress] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TravelOption | null>(null);
  const swipeRecordRef = useRef<Record<string, boolean>>({});

  // Check if flight/hotel already accepted
  const isTypeAlreadyAccepted = (type: string) =>
    ['flight', 'hotel'].includes(type) &&
    acceptedOptions.some(o => o.type === type);

  // === 1) Initialize deck whenever travelOptions changes ===
  useEffect(() => {
    swipeRecordRef.current = {};
    setAcceptedOptions([]);
    setRejectedOptions([]);
    setProgress(0);

    // No need to filter here since acceptedOptions was just cleared
    setCards([...travelOptions].reverse());
  }, [travelOptions]);

  // === 2) Update progress bar ===
  useEffect(() => {
    const total = travelOptions.length;
    const done = acceptedOptions.length + rejectedOptions.length;
    setProgress((done / total) * 100);
  }, [acceptedOptions, rejectedOptions, travelOptions]);

  // === 3) Auto-complete when no cards remain ===
  useEffect(() => {
    if (cards.length === 0 && travelOptions.length > 0) {
      const t = setTimeout(() => onComplete(acceptedOptions), 500);
      return () => clearTimeout(t);
    }
  }, [cards, travelOptions.length, acceptedOptions, onComplete]);

  // === 4) Handle swipes ===
  const handleSwiped = (direction: 'left' | 'right', id: string) => {
    if (swipeRecordRef.current[id]) return;
    swipeRecordRef.current[id] = true;

    const opt = travelOptions.find(o => o.id === id);
    if (!opt) return;

    if (direction === 'right') {
      setAcceptedOptions(prev =>
        ['flight', 'hotel'].includes(opt.type)
          ? [...prev.filter(o => o.type !== opt.type), opt]
          : [...prev, opt]
      );

      // Remove all of that type (for flights/hotels) or just this card (for activities)
      setCards(prev =>
        ['flight', 'hotel'].includes(opt.type)
          ? prev.filter(c => c.type !== opt.type)
          : prev.filter(c => c.id !== id)
      );
    } else {
      setRejectedOptions(prev => [...prev, opt]);
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  // === 5) Button-based swipe ===
  const triggerSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    handleSwiped(direction, cards[cards.length - 1].id);
  };

  // === 6) Details overlay ===
  const openDetails = () => {
    if (cards.length === 0) return;
    setSelectedCard(cards[cards.length - 1]);
    setDetailsOpen(true);
  };
  const acceptFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => triggerSwipe('right'), 200);
  };
  const rejectFromDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => triggerSwipe('left'), 200);
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-indigo-900 p-4 flex flex-col touch-none"
      style={{ touchAction: 'none' }}
    >
      <GlassPanel className="mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Select Your Options
            </h2>
            <p className="text-white/70 text-sm">
              Swipe ▶️ to accept, ◀️ to skip
            </p>
          </div>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        <ProgressBar value={progress} label="Selection Progress" />
      </GlassPanel>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-full h-[70vh] overflow-hidden">
          <AnimatePresence>
            {cards.map(card => (
              <TinderCard
                key={card.id}
                className="absolute inset-0"
                onSwipe={dir => handleSwiped(dir as 'left' | 'right', card.id)}
                preventSwipe={['up', 'down']}
              >
                <SwipeCard {...card} onExpand={openDetails} />
              </TinderCard>
            ))}
          </AnimatePresence>
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/70">No more options…</span>
            </div>
          )}
        </div>
      </div>

      {cards.length > 0 && (
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
            onAccept={acceptFromDetails}
            onReject={rejectFromDetails}
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

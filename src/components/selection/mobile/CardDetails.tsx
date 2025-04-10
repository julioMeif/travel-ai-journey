// src/components/selection/mobile/CardDetails.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GlassPanel } from '../../ui/GlassPanel';
import { Button } from '../../ui/Button';

interface CardDetailsProps {
  title: string;
  description: string;
  imageSrc: string;
  price?: number | string;
  rating?: number;
  details?: React.ReactNode;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export const CardDetails: React.FC<CardDetailsProps> = ({
  title,
  description,
  imageSrc,
  price,
  rating,
  details,
  onClose,
  onAccept,
  onReject,
}) => {
  const renderRating = () => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-amber-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-amber-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-white/30">★</span>);
      }
    }
    return (
      <div className="flex items-center gap-1 text-sm">
        {stars}
        <span className="text-white/70 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal Content */}
      <motion.div
        className="w-full max-w-md max-h-[90vh] z-10 overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <GlassPanel className="overflow-y-auto max-h-[90vh]" intensity="high">
          {/* Close Button */}
          <button
            className="absolute top-3 right-3 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          {/* Image */}
          <div className="w-full h-48 relative">
            <Image src={imageSrc} alt={title} fill className="object-cover" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
          {/* Content */}
          <div className="p-5">
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <div className="flex justify-between items-center mb-4">
              {price && (
                <div className="text-lg font-bold text-white">
                  {typeof price === 'number' ? `$${price}` : price}
                </div>
              )}
              {renderRating()}
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-white/80">{description}</p>
            </div>
            {details && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                <div className="text-white/80">{details}</div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <Button variant="danger" fullWidth onClick={onReject}>
                Skip
              </Button>
              <Button variant="success" fullWidth onClick={onAccept}>
                Accept
              </Button>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
};

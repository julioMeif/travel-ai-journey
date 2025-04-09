// src/components/ui/Card.tsx
// Purpose: General-purpose card component with glass effect
// Used for: Information display, selection items, and content containers

import React from 'react';
import { GlassPanel } from './GlassPanel';

interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  image,
  footer,
  children,
  className = '',
  onClick,
  hoverEffect = false,
  color = 'default'
}) => {
  return (
    <GlassPanel 
      className={`overflow-hidden ${className}`}
      hoverEffect={hoverEffect}
      onClick={onClick}
      color={color}
    >
      {/* Card Image */}
      {image && (
        <div className="w-full h-48 relative">
          <img 
            src={image} 
            alt={title || 'Card image'} 
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for better text visibility */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      {/* Card Header */}
      {(title || subtitle) && (
        <div className={`p-4 ${!image ? 'pt-4' : 'pt-2'}`}>
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
        </div>
      )}
      
      {/* Card Content */}
      <div className="p-4 pt-0">
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div className="p-4 pt-0 border-t border-white/10 mt-2">
          {footer}
        </div>
      )}
    </GlassPanel>
  );
};
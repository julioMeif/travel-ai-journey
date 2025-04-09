// src/components/ui/GlassPanel.tsx
// Purpose: Reusable glass-effect container component with consistent styling
// Used for: Chat bubbles, cards, modals, and other container elements

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  border?: boolean;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  intensity = 'medium',
  color = 'default',
  border = true,
  hoverEffect = false,
  onClick
}) => {
  // Set backdrop blur intensity
  const blurMap = {
    low: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    high: 'backdrop-blur-lg',
  };
  
  // Set background color and opacity based on color prop
  const bgColorMap = {
    default: 'from-white/20 to-white/5',
    primary: 'from-indigo-500/20 to-purple-500/10',
    success: 'from-emerald-500/20 to-teal-500/10',
    warning: 'from-amber-500/20 to-orange-500/10',
    danger: 'from-rose-500/20 to-pink-500/10',
  };
  
  // Set border color based on color prop
  const borderColorMap = {
    default: 'border-white/20',
    primary: 'border-indigo-500/30',
    success: 'border-emerald-500/30',
    warning: 'border-amber-500/30',
    danger: 'border-rose-500/30',
  };
  
  // Handle hover effect classes
  const hoverClasses = hoverEffect 
    ? 'transition-all duration-300 hover:shadow-lg hover:bg-opacity-25 hover:scale-[1.02]' 
    : '';
  
  return (
    <div
      className={`
        bg-gradient-to-br ${bgColorMap[color]}
        ${blurMap[intensity]}
        ${border ? `border ${borderColorMap[color]}` : ''}
        rounded-xl shadow-md
        ${hoverEffect ? 'cursor-pointer' : ''}
        ${hoverClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
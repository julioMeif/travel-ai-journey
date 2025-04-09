// src/components/ui/ProgressBar.tsx
// Purpose: Visual indicator of progress with animated fill
// Used for: Multi-step wizard navigation, loading status, and completion tracking

import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  height?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  label?: boolean | string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className = '',
  height = 'md',
  color = 'primary',
  animated = true,
  label = false,
}) => {
  // Ensure value is between 0-100
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  // Height classes
  const heightClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  // Color classes
  const colorClasses = {
    default: 'from-white/70 to-white/50',
    primary: 'from-indigo-500 to-purple-600',
    success: 'from-emerald-500 to-teal-600',
    warning: 'from-amber-500 to-orange-600',
    danger: 'from-rose-500 to-pink-600',
  };
  
  // Animation class
  const animationClass = animated ? 'transition-all duration-500 ease-out' : '';
  
  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-white/80">{typeof label === 'string' ? label : 'Progress'}</span>
          <span className="text-white/80">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      
      {/* Progress track */}
      <div className={`w-full ${heightClasses[height]} bg-white/10 rounded-full overflow-hidden`}>
        {/* Progress fill */}
        <div 
          className={`
            bg-gradient-to-r ${colorClasses[color]} 
            ${heightClasses[height]} 
            rounded-full 
            ${animationClass}
          `}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
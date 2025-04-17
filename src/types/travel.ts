// src/types/travel.ts
export interface TravelPreferences {
  // Existing fields
  origin?: string;
  destination?: string;
  dates?: {
    departure?: string;
    return?: string;
    flexibility?: number;
  };
  travelers?: number;
  flights?: {
    airlines?: string[];
    class?: string;
    direct?: boolean;
  };
  accommodation?: {
    type?: string;
    amenities?: string[];
    location?: string;
  };
  activities?: {
    interests?: string[];
    pacePreference?: string;
  };
  budget?: {
    min?: number;
    max?: number;
    total?: number;
    priority?: string;
  };
  
  // New fields for IATA codes
  originCode?: string;
  destinationCode?: string;
}
  
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

export interface ChatAction {
  label: string;
  action: () => void;
}

export type EventType = 'flight' | 'hotel' | 'activity' | 'transport';

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// e.g. in src/types/travel.ts
export interface Activity {
  id: string;
  name: string;
  brief: string;
  description: string;
  imageUrl: string;
  estimatedPrice: number;
  rating: number;
}

// src/services/ai/aiService.ts
import { TravelPreferences, ApiResponse, Activity } from '../../types/travel';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Define TravelPlan interface
interface TravelPlan {
  title: string;
  duration: number;
  days: {
    date: string;
    activities: string[];
  }[];
  estimatedCost: {
    flight: number;
    accommodation: number;
    activities: number;
    total: number;
  };
  recommendations: string[];
}

// Define QuickAvailability interface
interface QuickAvailability {
  flights?: {
    airlines: string[];
    minPrice: number;
    maxPrice: number;
    cabinClasses: string[];
    availableStops: number[];
  };
  hotels?: {
    priceRanges: { min: number; max: number }[];
    categories: string[];
    amenities: string[];
  };
  activities?: {
    categories: string[];
    priceRanges: { min: number; max: number }[];
  };
  timestamp?: Date;
  rawResults?: {
    flights: unknown[];
    hotels: unknown[];
    activities: unknown[];
  };
  analysis?: {
    hasMultipleAirlines: boolean;
    hasMultipleStops: boolean;
    hasFlexiblePricing: boolean;
    hotelPriceRange: {
      min: number;
      max: number;
    };
    hasHotelVariety: boolean;
    suggestedQuestions: string[];
  };
}

class AIService {
  // Chat completion
  async getChatResponse(messages: Message[], preferences?: Partial<TravelPreferences>): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages,
          preferences // Pass the current preferences to guide the AI's response
        })
      });
      
      const result: ApiResponse<{ content: string }> = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data?.content || 'Sorry, I couldn\'t generate a response.';
    } catch (error) {
      console.error('Error getting chat response:', error);
      throw error;
    }
  }
  
  // Extract travel preferences
  async extractTravelPreferences(conversation: Message[]): Promise<Partial<TravelPreferences>> {
    try {
      const response = await fetch('/api/ai/extract-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation })
      });
      
      const result: ApiResponse<Partial<TravelPreferences>> = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || {};
    } catch (error) {
      console.error('Error extracting travel preferences:', error);
      return {};
    }
  }
  
  // Generate travel plan
  async generateTravelPlan(preferences: TravelPreferences): Promise<TravelPlan> {
    try {
      const response = await fetch('/api/ai/generate-travel-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      
      const result: ApiResponse<TravelPlan> = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || {
        title: '',
        duration: 0,
        days: [],
        estimatedCost: { flight: 0, accommodation: 0, activities: 0, total: 0 },
        recommendations: []
      };
    } catch (error) {
      console.error('Error generating travel plan:', error);
      return {
        title: '',
        duration: 0,
        days: [],
        estimatedCost: { flight: 0, accommodation: 0, activities: 0, total: 0 },
        recommendations: []
      };
    }
  }

  // Generate travel insights based on quick availability data
  async getTravelInsights(
    preferences: Partial<TravelPreferences>, 
    quickAvailability: QuickAvailability
  ): Promise<string> {
    try {
      console.log('Getting travel insights from AI');
      
      // Call our backend API endpoint
      const response = await fetch('/api/ai/travel-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          preferences,
          quickAvailability
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Travel insights API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error getting travel insights:', error);
      
      // Fallback response
      return `I've found some travel options from ${preferences.origin} to ${preferences.destination}. Let's take a look at what's available for your trip.`;
    }
  }

  async suggestActivities(
    preferences: Partial<TravelPreferences>
  ): Promise<Activity[]> {
    try {
      const res = await fetch('/api/ai/search-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      const result: ApiResponse<Activity[]> = await res.json();
      if (result.error) throw new Error(result.error);
      return result.data || [];
    } catch (err) {
      console.error('Error suggesting activities:', err);
      return [];
    }
  }
}

export const aiService = new AIService();
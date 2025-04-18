// src/context/TravelContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { TravelPreferences, ChatMessage } from '../types/travel';
import { aiService } from '../services/ai/aiService';
import { travelService } from '../services/travel/travelService';
import { FlightSearchParams } from '../types/travelService';
import { v4 as uuidv4 } from 'uuid';

// Define the Message type to match what aiService expects
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Add this interface to handle the availability analysis
interface AvailabilityAnalysis {
  hasMultipleAirlines: boolean;
  hasMultipleStops: boolean;
  hasFlexiblePricing: boolean;
  hotelPriceRange: {
    min: number;
    max: number;
  };
  hasHotelVariety: boolean;
  suggestedQuestions: string[];
}

// Define Iti segment interfaces
interface ItinerarySegment {
  departureAirport: string;
  arrivalAirport:   string;
  departureTime:    string;
  arrivalTime:      string;
  carrier:          string;
  flightNumber:     string;
  duration:         string;
}

type TripType = 'oneWay' | 'roundTrip';

// Define types for the raw travel items
interface FlightOption {
  id:                string;
  airline:           string;
  flightNumber:      string;
  departureAirport:  string;
  departureTime:     string;
  arrivalAirport:    string;
  arrivalTime:       string;
  price:             number;
  duration:          string;
  cabinClass:        string;
  stops:             number;
  origin:            string;
  destination:       string;
  tripType:          TripType;
  segments:          ItinerarySegment[];
  validatingCarrier: string;
  totalStops:        number;
  totalDuration:     string;
}

interface HotelOption {
  id: string;
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  images: string[];
  amenities: string[];
  description: string;
}

interface ActivityOption {
  id: string;
  name: string;
  brief: string;
  description: string;
  estimatedPrice: number;
  rating: number;
  location?: string;
}

// Define types for the formatted travel options
interface FormattedTravelOption {
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
  segments?: ItinerarySegment[];
}

// Update QuickSearchResults interface to include analysis
interface QuickSearchResults {
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
  timestamp: Date;
  rawResults?: {
    flights: FlightOption[];
    hotels: HotelOption[];
    activities: ActivityOption[];
  };
  analysis?: AvailabilityAnalysis;
}

interface TravelContextType {
  // Chat state
  chatMessages: ChatMessage[];
  addUserMessage: (content: string) => Promise<void>;
  isProcessingMessage: boolean;
  
  // Travel preferences
  travelPreferences: Partial<TravelPreferences>;
  updatePreferences: (newPrefs: Partial<TravelPreferences>) => void;
  
  // Search state
  isSearching: boolean;
  searchStatus: string;
  quickResults: QuickSearchResults | null;
  
  // Final results
  travelOptions: FormattedTravelOption[];
  completeChatAndGenerateOptions: () => Promise<void>;
  
  // Selected options
  selectedOptions: FormattedTravelOption[];
  updateSelectedOptions: (options: FormattedTravelOption[]) => void;

  // travel Insights
  showTravelInsights: () => Promise<void>;
}

const TravelContext = createContext<TravelContextType | undefined>(undefined);

function formatDuration(iso: string): string {
  // Matches “PT7H30M” etc.
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const hours   = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const parts: string[] = [];
  if (hours)   parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ') || '0m';
}

export const TravelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: "Hi there! I'm your travel assistant. Where would you like to go?",
      timestamp: new Date(),
    }
  ]);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  
  // Travel preferences
  const [travelPreferences, setTravelPreferences] = useState<Partial<TravelPreferences>>({});
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [quickResults, setQuickResults] = useState<QuickSearchResults | null>(null);
  
  // Refinement state tracking
  const [hasAskedForRefinement, setHasAskedForRefinement] = useState(false);

  // Create a ref to always hold the latest quickResults
  const quickResultsRef = useRef<QuickSearchResults | null>(quickResults);

  // Update ref every time quickResults state changes
  useEffect(() => {
    quickResultsRef.current = quickResults;
    console.log("quickResults updated (via ref):", quickResults);
  }, [quickResults]);
  
  // Final results
  const [travelOptions, setTravelOptions] = useState<FormattedTravelOption[]>([]);
  
  // Selected options
  const [selectedOptions, setSelectedOptions] = useState<FormattedTravelOption[]>([]);
  
  // Add a user message and process it
  const addUserMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessingMessage(true);
    
    try {
      // Convert chat messages to the format expected by OpenAI
      const messageHistory: Message[] = chatMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));
      
      // Add current message
      messageHistory.push({ role: 'user', content });
      
      // Process with AI - parallel processing for efficiency
      const [aiResponse, extractedPrefs] = await Promise.all([
        aiService.getChatResponse(messageHistory, travelPreferences),
        aiService.extractTravelPreferences(messageHistory)
      ]);
      
      // Update preferences
      const updatedPreferences = { ...travelPreferences, ...extractedPrefs };
      setTravelPreferences(updatedPreferences);
      
      // Check if we should trigger a quick search
      const hasNewDestination = extractedPrefs.destination && 
                               extractedPrefs.destination !== travelPreferences.destination;

      const hasOrigin = updatedPreferences.origin;
      const hasDestination = updatedPreferences.destination;

      // ensure we have at least a departure date
      const hasDeparture = Boolean(updatedPreferences.dates?.departure);
                               
      if (hasOrigin && hasDeparture && (hasNewDestination || (hasDestination && !quickResults)) && !isSearching) {
        console.log(`Starting quick search from ${hasOrigin} to ${hasDestination}`);
        setIsSearching(true);
        setSearchStatus(`Looking for options from ${updatedPreferences.origin} to ${updatedPreferences.destination}...`);
        
        // Start a quick search in the background with correct parameters
        travelService.getQuickAvailability({
          origin: updatedPreferences.origin,
          destination: updatedPreferences.destination,
          originCode: updatedPreferences.originCode,
          destinationCode: updatedPreferences.destinationCode,
          dates: updatedPreferences.dates,
        })
        .then(results => {
          console.log("Got quick search results:", results);
          
          // Store the entire results object, including the analysis
          const transformedResults: QuickSearchResults = {
            timestamp: new Date(),
            flights: results.flights,
            hotels: results.hotels,
            activities: results.activities,
            rawResults: results.rawResults,
            analysis: results.analysis
          };
          
          setQuickResults(transformedResults);
          setSearchStatus(`Found initial options from ${updatedPreferences.origin} to ${updatedPreferences.destination}`);
          
          // Reset refinement state when new search results come in
          setHasAskedForRefinement(false);
          
          // Add a "Show travel options" button to the next AI message
          const optionsMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `I've found some travel options for your trip from ${updatedPreferences.origin} to ${updatedPreferences.destination}. Would you like to see the available options?`,
            timestamp: new Date(),
            actions: [
              {
                label: 'Show travel options',
                action: () => showTravelInsights()
              }
            ]
          };

          setChatMessages(prev => [...prev, optionsMessage]);
        })
        .catch(error => {
          console.error('Quick search failed:', error);
          setSearchStatus('Could not find initial options');
        })
        .finally(() => {
          setIsSearching(false);
        });
      }
      
      // Determine if we should show the "Show travel options" action to refine preferences
      const shouldOfferRefinement = quickResults && 
                                    hasDestinationAndDates(updatedPreferences) && 
                                    !hasAskedForRefinement;
      
      // Add AI response with possible actions
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        actions: shouldOfferRefinement ? [
          {
            label: 'Show travel options',
            action: () => askForRefinedPreferences(updatedPreferences)
          }
        ] : undefined
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingMessage(false);
    }
  };
  
  // Function to ask for more refined preferences based on quick search results
  const askForRefinedPreferences = async (preferences: Partial<TravelPreferences>) => {
    console.log("Quick Results check: ", quickResults);
    if (!quickResults) {
      console.log("No quick results available to refine preferences");
      return;
    }
    
    setIsProcessingMessage(true);
    
    try {
      // Mark that we've asked for refinement to avoid repetitive questioning
      setHasAskedForRefinement(true);
      
      // Use the availability analysis if it exists
      const analysis = quickResults.analysis;
      
      // Build a refinement prompt
      let refinementPrompt = `I've found some initial travel options from ${preferences.origin} to ${preferences.destination}.\n\n`;
      
      if (analysis && analysis.suggestedQuestions.length > 0) {
        // Use the suggested questions from the analysis
        refinementPrompt += analysis.suggestedQuestions.join('\n\n') + '\n\n';
      } else {
        // Fallback to our standard questions if analysis is not available
        const flightOptions = quickResults.flights?.airlines || [];
        const hotelPriceRange = quickResults.hotels?.priceRanges || [];
        const activityCategories = quickResults.activities?.categories || [];
        
        // Add available flight options if we have them
        if (flightOptions.length > 1) {
          refinementPrompt += `Available airlines include ${flightOptions.slice(0, 3).join(', ')}`;
          if (flightOptions.length > 3) refinementPrompt += ` and others`;
          refinementPrompt += `. Do you have any airline preferences?\n\n`;
        } else if (flightOptions.length === 1) {
          refinementPrompt += `I see that ${flightOptions[0]} is the airline serving your route. `;
          
          // Check if there are direct and connecting flight options
          const stops = quickResults.flights?.availableStops || [];
          if (stops.includes(0) && stops.length > 1) {
            refinementPrompt += `They offer both direct and connecting flights. Do you prefer direct flights?\n\n`;
          } else if (stops.includes(0)) {
            refinementPrompt += `They offer direct flights for this route.\n\n`;
          } else {
            refinementPrompt += `Their flights for this route have connections.\n\n`;
          }
        }
        
        // Add hotel price range info if we have it
        if (hotelPriceRange.length > 0) {
          const minPrice = Math.min(...hotelPriceRange.map(range => range.min));
          const maxPrice = Math.max(...hotelPriceRange.map(range => range.max));
          refinementPrompt += `Hotels range from $${minPrice} to $${maxPrice} per night. What's your budget for accommodation?\n\n`;
        }
        
        // Add activity options if we have them
        if (activityCategories.length > 0) {
          refinementPrompt += `Popular activities include ${activityCategories.slice(0, 3).join(', ')}`;
          if (activityCategories.length > 3) refinementPrompt += ` and more`;
          refinementPrompt += `. What kinds of activities interest you?\n\n`;
        }
      }
      
      refinementPrompt += `Please let me know your preferences, or if you're ready, we can see detailed travel options.`;
      
      // Add the refinement message
      const refinementMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: refinementPrompt,
        timestamp: new Date(),
        actions: [
          {
            label: 'View travel options',
            action: completeChatAndGenerateOptions
          }
        ]
      };
      
      setChatMessages(prev => [...prev, refinementMessage]);
    } catch (error) {
      console.error('Error asking for refined preferences:', error);
      
      // Add error message
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while finding travel options. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingMessage(false);
    }
  };
  
  // Check if we have enough information to show "View Options" button
  const hasDestinationAndDates = (prefs: Partial<TravelPreferences>) => {
    return !!prefs.destination && !!prefs.dates?.departure;
  };

  // Complete chat and generate final options
  const completeChatAndGenerateOptions = async () => {
    console.log("Starting final search and generating options");
    setIsSearching(true);
    setSearchStatus('Generating your personalized travel options...');

    try {
      // 1) Let AI draft the travel plan (if needed)
      const travelPlan = await aiService.generateTravelPlan(travelPreferences as TravelPreferences);
      console.log("Generated travel plan:", travelPlan);

      // 2) Build flight search params
      const flightParams: Partial<FlightSearchParams> = {
        origin:        travelPreferences.originCode || travelPreferences.origin || '',
        destination:   travelPreferences.destinationCode || travelPreferences.destination || '',
        departureDate: travelPreferences.dates?.departure,
        returnDate:    travelPreferences.dates?.return,
      };

      // 3) Kick off all searches in parallel
      const flightPromise     = travelService.searchFlights(flightParams as FlightSearchParams);
      const hotelPromise      = travelService.searchHotels({
        location: travelPreferences.destinationCode || travelPreferences.destination || '',
        checkIn:  travelPreferences.dates?.departure,
        checkOut: travelPreferences.dates?.return,
      });
      const activitiesPromise = aiService.suggestActivities(travelPreferences as TravelPreferences);

      const [rawFlights, hotels, aiActivities] = await Promise.all([
        flightPromise,
        hotelPromise,
        activitiesPromise,
      ]);

      // --- **CAST** rawFlights to our enriched FlightOption[] ---
      const flights: FlightOption[] = rawFlights as FlightOption[];

      // 4) Turn activities into cards (unchanged)
      const activityImagePromises = aiActivities.map(async (activity: ActivityOption) => {
        try {
          const searchQuery = `${activity.name},${travelPreferences.destination}`;
          const imgs = await travelService.fetchUnsplashImages(searchQuery, 1);
          return imgs.length ? imgs[0].urls.regular : null;
        } catch {
          return null;
        }
      });
      const activityImages = await Promise.all(activityImagePromises);
      const activityOptions = aiActivities.map((act, i) => ({
        id:    `activity-${act.id ?? i}`,
        title: act.name,
        description: act.brief,
        imageSrc: activityImages[i] ||
                  `https://source.unsplash.com/featured/?${travelPreferences.destination},${act.name.replace(/\s+/g, ',')}`,
        price: act.estimatedPrice,
        rating: act.rating,
        type: 'activity' as const,
        details: <p>{act.description}</p>,
      }));

      console.log(`Retrieved ${flights.length} flights, ${hotels.length} hotels, ${aiActivities.length} activities`);

      // 5) **Format flights, hotels and activities into unified cards**
      const formattedOptions: FormattedTravelOption[] = [
        ...flights.map(flight => {
          // format stops / duration
          const stopsLabel = flight.totalStops === 0
            ? 'Nonstop'
            : `${flight.totalStops} stop${flight.totalStops > 1 ? 's' : ''}`;
          const carrierLabel = flight.validatingCarrier || flight.airline;
          const humanDur     = formatDuration(flight.totalDuration);
          const tripLabel    = flight.tripType === 'roundTrip'
            ? 'Round‑trip'
            : 'One‑way';

          return {
            id:          `flight-${flight.id}`,
            title:       `${tripLabel} • ${carrierLabel} • ${stopsLabel} • ${humanDur}`,
            description: `${flight.origin} → ${flight.destination}`,
            imageSrc:    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyODR8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZXxlbnwwfHx8fDE3NDQ4OTczNDR8MA&ixlib=rb-4.0.3&q=80&w=200",
            price:       flight.price,
            rating:      0,
            type:        'flight' as const,
            time:        flight.departureTime,
            duration:    humanDur,
            location:    `${flight.departureAirport} ➔ ${flight.arrivalAirport}`,
            details: (
              <>
                {flight.segments.map((seg, idx) => (
                  <p key={idx}>
                    <strong>{seg.carrier} {seg.flightNumber}</strong>:{' '}
                    {seg.departureAirport} ({new Date(seg.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                    {' '}→{' '}
                    {seg.arrivalAirport} ({new Date(seg.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                    {' '}• {seg.duration}
                  </p>
                ))}
              </>
            ),
            segments: flight.segments,
          };
        }),

        ...hotels.map(hotel => ({
          id:        `hotel-${hotel.id}`,
          title:     hotel.name,
          description: hotel.description,
          imageSrc:  "https://images.unsplash.com/photo-1445991842772-097fea258e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyODR8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTJDaG90ZWx8ZW58MHx8fHwxNzQ0ODk4MzcxfDA&ixlib=rb-4.0.3&q=80&w=1080",
          price:     hotel.pricePerNight,
          rating:    hotel.rating,
          type:      'hotel' as const,
          location:  hotel.address,
          details: (
            <>
              <p><strong>Address:</strong> {hotel.address}</p>
              <p><strong>Rating:</strong> {hotel.rating} / 5</p>
              <p><strong>Price per night:</strong> ${hotel.pricePerNight}</p>
              <p><strong>Amenities:</strong> {hotel.amenities.join(', ')}</p>
            </>
          ),
        })),

        ...activityOptions,
      ];

      console.log(`Formatted ${formattedOptions.length} options for selection`);
      setTravelOptions(formattedOptions);
    } catch (error) {
      console.error('Error generating travel options:', error);
      setSearchStatus('Error generating travel options. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Function to show travel insights before completing chat
  const showTravelInsights = async () => {
    // Use the ref's current value for logging and checks
    console.log("Logging quickResults from ref:", quickResultsRef.current);
    if (!quickResultsRef.current) {
      console.log("No quick results available for insights");
      // Complete chat directly if no insights available
      await completeChatAndGenerateOptions();
      return;
    }
    
    setIsProcessingMessage(true);
    
    try {
      // Get insights about the available travel options
      const insightsMessage = await aiService.getTravelInsights(travelPreferences, quickResultsRef.current);
      
      // Add insights message to chat with action to continue
      const insightsChatMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: insightsMessage,
        timestamp: new Date(),
        actions: [
          {
            label: 'Continue to Selection',
            action: completeChatAndGenerateOptions
          }
        ]
      };
      
      setChatMessages(prev => [...prev, insightsChatMessage]);
    } catch (error) {
      console.error('Error showing travel insights:', error);
      
      // Add fallback message with action to continue
      setChatMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'I found some travel options for your trip. Would you like to continue to the selection screen?',
        timestamp: new Date(),
        actions: [
          {
            label: 'Continue to Selection',
            action: completeChatAndGenerateOptions
          }
        ]
      }]);
    } finally {
      setIsProcessingMessage(false);
    }
  };
  
  const updatePreferences = (newPrefs: Partial<TravelPreferences>) => {
    setTravelPreferences(prev => ({ ...prev, ...newPrefs }));
  };
  
  const updateSelectedOptions = (options: FormattedTravelOption[]) => {
    setSelectedOptions(options);
  };
  
  return (
    <TravelContext.Provider
      value={{
        chatMessages,
        addUserMessage,
        isProcessingMessage,
        travelPreferences,
        updatePreferences,
        isSearching,
        searchStatus,
        quickResults,
        travelOptions,
        completeChatAndGenerateOptions,
        showTravelInsights,
        selectedOptions,
        updateSelectedOptions
      }}
    >
      {children}
    </TravelContext.Provider>
  );
};

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (context === undefined) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};
// src/context/TravelContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { TravelPreferences, ChatMessage } from '../types/travel';
import { aiService } from '../services/ai/aiService';
import { travelService } from '../services/travel/travelService';
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

// Define types for the raw travel items
interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  price: number;
  duration: string;
  cabinClass: string;
  stops: number;
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
                               
      if (hasOrigin && (hasNewDestination || (hasDestination && !quickResults)) && !isSearching) {
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
      // Generate final travel plan with AI assistance
      const travelPlan = await aiService.generateTravelPlan(travelPreferences as TravelPreferences);
      console.log("Generated travel plan:", travelPlan);
      
      // Use IATA codes directly if they're provided by the AI
      const flightParams = {
        origin: travelPreferences.originCode || travelPreferences.origin,
        destination: travelPreferences.destinationCode || travelPreferences.destination,
        departureDate: travelPreferences.dates?.departure,
        returnDate: travelPreferences.dates?.return,
        // Other parameters...
      };

      // Build each promise separately
      const flightPromise = travelService.searchFlights(flightParams);
      const hotelPromise = travelService.searchHotels({
        // Hotel parameters...
        location: travelPreferences.destinationCode || travelPreferences.destination,
        checkIn: travelPreferences.dates?.departure,
        checkOut: travelPreferences.dates?.return,
      });
      const activitiesPromise = aiService.suggestActivities(travelPreferences as TravelPreferences);

      // Await all three
      const [flights, hotels, aiActivities] = await Promise.all([
        flightPromise,
        hotelPromise,
        activitiesPromise,
      ]);

      // Fetch images for activities
      const activityImagePromises = aiActivities.map(async (activity: ActivityOption) => {
        try {
          // Create a search query based on activity and destination
          const searchQuery = `${activity.name},${travelPreferences.destination}`;
          const images = await travelService.fetchUnsplashImages(searchQuery, 1);
          return images.length > 0 ? images[0].urls.regular : null;
        } catch (error) {
          console.error(`Error fetching image for activity ${activity.name}:`, error);
          return null;
        }
      });

      // Wait for all image requests to complete
      const activityImages = await Promise.all(activityImagePromises);

      // Map AI activities into your card format with fetched images
      const activityOptions = aiActivities.map((act: ActivityOption, index: number) => ({
        id: `activity-${act.id || index}`,
        title: act.name,
        description: act.brief,
        // Use fetched image if available, otherwise use a fallback
        imageSrc: activityImages[index] || 
                  `https://source.unsplash.com/featured/?${travelPreferences.destination},${act.name.replace(/\s+/g, ',')}`,
        price: act.estimatedPrice,
        rating: act.rating,
        type: 'activity' as const,
        details: <p>{act.description}</p>
      }));
      
      console.log(`Retrieved ${flights.length} flights, ${hotels.length} hotels, ${aiActivities.length} activities`);
      
      // Format options for the selection phase
      const formattedOptions = [
        ...flights.map((flight: FlightOption) => ({
          id: `flight-${flight.id}`,
          title: `${flight.airline} Flight ${flight.flightNumber}`,
          description: `${flight.departureAirport} to ${flight.arrivalAirport} • ${flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`,
          imageSrc: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyODR8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZXxlbnwwfHx8fDE3NDQ4OTczNDR8MA&ixlib=rb-4.0.3&q=80&w=200",
          price: flight.price,
          rating: 0,
          type: 'flight' as const,
          time: flight.departureTime,
          duration: flight.duration,
          location: `${flight.departureAirport} to ${flight.arrivalAirport}`,
          details: (
            <>
              <p><strong>Flight Number:</strong> {flight.flightNumber}</p>
              <p><strong>Airline:</strong> {flight.airline}</p>
              <p><strong>Departure:</strong> {flight.departureTime} from {flight.departureAirport}</p>
              <p><strong>Arrival:</strong> {flight.arrivalTime} at {flight.arrivalAirport}</p>
              <p><strong>Duration:</strong> {flight.duration}</p>
              <p><strong>Cabin:</strong> {flight.cabinClass}</p>
              <p><strong>Stops:</strong> {flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</p>
            </>
          )
        })),
        ...hotels.map((hotel: HotelOption) => ({
          id: `hotel-${hotel.id}`,
          title: hotel.name,
          description: hotel.description,
          imageSrc: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzkyODR8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTJDaG90ZWx8ZW58MHx8fHwxNzQ0ODk4MzcxfDA&ixlib=rb-4.0.3&q=80&w=1080",
          price: hotel.pricePerNight,
          rating: hotel.rating,
          type: 'hotel' as const,
          location: hotel.address,
          details: (
            <>
              <p><strong>Address:</strong> {hotel.address}</p>
              <p><strong>Rating:</strong> {hotel.rating} / 5</p>
              <p><strong>Price per night:</strong> ${hotel.pricePerNight}</p>
              <p><strong>Amenities:</strong> {hotel.amenities.join(', ')}</p>
            </>
          )
        })),
        ...activityOptions
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
// src/components/TravelWizard.tsx
// Purpose: Main wizard controller that manages the multi-step flow
// Used in: App page as the central component that ties everything together

'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Import components using index files
import { ChatComponent, ChatMessage } from './chat';
import { DesktopDragAndDrop } from './selection/desktop';
import { SwipeDeck } from './selection/mobile';
import { Timeline, ItineraryDay, TimelineEventData } from './timeline';
import { EventType } from './timeline/TimelineEvent';
import { GlassPanel, Button } from './ui';
import { TravelProvider, useTravelContext } from '../context/TravelContext';

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
};

// Unified type for travel options
type TravelOption = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  price?: number;
  rating?: number;
  details?: React.ReactNode;
  type: EventType;
  time?: string;
  duration?: string;
  location?: string;
};

interface TravelWizardProps {
  initialStep?: 'chat' | 'selection' | 'timeline';
}

// Inner component that uses the context
const TravelWizardContent: React.FC<TravelWizardProps> = ({
  initialStep = 'chat',
}) => {
  const [currentStep, setCurrentStep] = useState<'chat' | 'selection' | 'timeline'>(initialStep);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceProgress, setPreferenceProgress] = useState(0);
  const [itinerary, setItinerary] = useState<{
    title: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    days: ItineraryDay[];
    totalPrice: number;
  } | null>(null);
  
  const isMobile = useIsMobile();
  
  // Get travel context
  const { 
    addUserMessage,
    isProcessingMessage,
    travelPreferences,
    travelOptions,
    updateSelectedOptions,
    completeChatAndGenerateOptions,
    showTravelInsights
  } = useTravelContext();
  
  // Process chat message (fallback if context is not available)
  const processChatMessage = async (message: string) => {
    if (addUserMessage) {
      await addUserMessage(message);
    } else {
      // Legacy fallback
      setIsProcessing(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Pre-store the showInsights function reference
      const handleShowOptions = () => {
        if (showTravelInsights) {
          // Show insights before generating options
          showTravelInsights();
        } else {
          // Fallback to original behavior
          generateSampleTravelOptions();
          setCurrentStep('selection');
        }
      };
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: "I've noted your preferences! I'll help you plan the perfect trip. I can suggest some travel options based on what you've told me.",
        role: 'assistant',
        timestamp: new Date(),
        actions: [
          {
            label: 'Show travel options',
            action: handleShowOptions
          }
        ]
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
      
      // Update preference progress
      setPreferenceProgress(prev => Math.min(prev + 25, 100));
      
      setIsProcessing(false);
    }
  };
  
  // Generate sample travel options for demonstration (fallback)
  const generateSampleTravelOptions = () => {
    const options: TravelOption[] = [
      {
        id: 'flight-1',
        title: 'Flight to Tokyo',
        description: 'Direct flight from Los Angeles to Tokyo Narita Airport.',
        imageSrc: 'https://source.unsplash.com/featured/?japan,airplane',
        price: 850,
        rating: 4.5,
        type: 'flight',
        time: '10:30 AM',
        duration: '11h 45m',
        location: 'LAX to NRT',
      },
      {
        id: 'hotel-1',
        title: 'Park Hyatt Tokyo',
        description: 'Luxury hotel in Shinjuku with stunning views of the city and Mount Fuji.',
        imageSrc: 'https://source.unsplash.com/featured/?tokyo,hotel',
        price: 380,
        rating: 4.8,
        type: 'hotel',
        duration: '5 nights',
        location: 'Shinjuku, Tokyo',
      },
      // Additional mock options...
    ];
    
    return options;
  };
  
  // Handle completion of selection step
  const handleSelectionComplete = (acceptedOptions: TravelOption[]) => {
    // Use context function if available, otherwise use local state
    if (updateSelectedOptions) {
      updateSelectedOptions(acceptedOptions);
    }
    
    // Generate sample itinerary
    generateSampleItinerary(acceptedOptions);
    
    // Move to timeline step
    setCurrentStep('timeline');
  };
  

  const generateSampleItinerary = (acceptedOptions: TravelOption[]) => {
    // Get origin and destination from preferences if available
    const origin = travelPreferences?.origin || 'Los Angeles';
    const destination = travelPreferences?.destination || 'Tokyo';
    
    // Use dates from travel preferences if available, otherwise use fallback dates
    let startDate: Date;
    let endDate: Date;
    
    if (travelPreferences?.dates?.departure) {
      // Convert string date to Date object
      startDate = new Date(travelPreferences.dates.departure);
    } else {
      // Fallback: Trip starts in 10 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
    }
    
    if (travelPreferences?.dates?.return) {
      // Convert string date to Date object
      endDate = new Date(travelPreferences.dates.return);
    } else {
      // Fallback: 5-day trip
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
    }
    
    // Calculate total price
    const totalPrice = acceptedOptions.reduce((sum, option) => sum + (option.price || 0), 0);
    
    // Create itinerary days
    const days: ItineraryDay[] = [];
    
    // Day 1: Arrival
    const day1 = new Date(startDate);
    const day1Events: TimelineEventData[] = [];
    
    // Add flight if selected
    const selectedFlight = acceptedOptions.find(opt => opt.type === 'flight');
    if (selectedFlight) {
      day1Events.push({
        ...selectedFlight,
        id: `${selectedFlight.id}-day1`,
        time: '10:30 AM',
      });
    }
    
    // Add hotel if selected
    const selectedHotel = acceptedOptions.find(opt => opt.type === 'hotel');
    if (selectedHotel) {
      day1Events.push({
        ...selectedHotel,
        id: `${selectedHotel.id}-day1`,
      });
    }
    
    days.push({ date: day1, events: day1Events });
    
    // Calculate trip duration in days
    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Day 2 to (Last Day - 1): Activities
    const selectedActivities = acceptedOptions.filter(opt => opt.type === 'activity');
    let activityIndex = 0;
    
    // Distribute activities across the days of the trip
    for (let i = 1; i < tripDuration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayEvents: TimelineEventData[] = [];
      
      // Add 1-2 activities per day
      const activitiesPerDay = Math.min(2, Math.ceil(selectedActivities.length / Math.max(1, tripDuration - 2)));
      for (let j = 0; j < activitiesPerDay; j++) {
        if (activityIndex < selectedActivities.length) {
          const activity = selectedActivities[activityIndex];
          const timeOptions = ['9:00 AM', '1:00 PM', '4:00 PM', '7:00 PM'];
          
          dayEvents.push({
            ...activity,
            id: `${activity.id}-day${i+1}-${j}`,
            time: timeOptions[Math.floor(Math.random() * timeOptions.length)],
          });
          
          activityIndex++;
        }
      }
      
      // Add hotel every day
      if (selectedHotel) {
        dayEvents.push({
          ...selectedHotel,
          id: `${selectedHotel.id}-day${i+1}`,
        });
      }
      
      days.push({ date: currentDate, events: dayEvents });
    }
    
    // Last Day: Departure
    const lastDay = new Date(endDate);
    const lastDayEvents: TimelineEventData[] = [];
    
    // Add hotel checkout
    if (selectedHotel) {
      lastDayEvents.push({
        ...selectedHotel,
        id: `${selectedHotel.id}-checkout`,
        title: `${selectedHotel.title} (Checkout)`,
      });
    }
    
    // Add return flight
    if (selectedFlight) {
      lastDayEvents.push({
        ...selectedFlight,
        id: `${selectedFlight.id}-return`,
        title: 'Return Flight',
        time: '4:30 PM',
        description: `Direct flight from ${destination} to ${origin}.`,
        location: `${destination} to ${origin}`,
      });
    }
    
    days.push({ date: lastDay, events: lastDayEvents });
    
    // Set itinerary
    setItinerary({
      title: `${destination} Explorer`,
      destination: `${destination}`,
      startDate,
      endDate,
      days,
      totalPrice,
    });
  };
  
  // Handle going back to chat step
  const handleBackToChat = () => {
    setCurrentStep('chat');
  };
  
  // Handle going back to selection step
  const handleBackToSelection = () => {
    setCurrentStep('selection');
  };
  
  // Handle completion of chat phase
  const handleChatComplete = async () => {
    // Use travel context to complete chat if available
    if (completeChatAndGenerateOptions) {
      await completeChatAndGenerateOptions();
    }
    setCurrentStep('selection');
  };
  
  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'chat':
        return (
          <ChatComponent
            initialMessages={chatMessages}
            onSendMessage={processChatMessage}
            isProcessing={isProcessing || isProcessingMessage}
            onComplete={handleChatComplete}
            preferenceProgress={preferenceProgress}
          />
        );
        
      case 'selection':
        // Use travelOptions from context if available, otherwise use fallback
        const optionsToUse = travelOptions.length > 0 
          ? travelOptions 
          : generateSampleTravelOptions();
        
        return isMobile ? (
          <SwipeDeck
            travelOptions={optionsToUse}
            onComplete={handleSelectionComplete}
            onBack={handleBackToChat}
          />
        ) : (
          <DesktopDragAndDrop
            travelOptions={optionsToUse}
            onComplete={handleSelectionComplete}
            onBack={handleBackToChat}
          />
        );
        
      case 'timeline':
        return itinerary ? (
          <Timeline
            title={itinerary.title}
            destination={itinerary.destination}
            startDate={itinerary.startDate}
            endDate={itinerary.endDate}
            days={itinerary.days}
            totalPrice={itinerary.totalPrice}
            onBack={handleBackToSelection}
            onShare={() => console.log('Share itinerary')}
            onSave={() => console.log('Save itinerary')}
            onPrint={() => console.log('Print itinerary')}
          />
        ) : (
          <GlassPanel className="p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-4">No Itinerary Available</h2>
            <p className="text-white/70 mb-6">Please go back and select travel options.</p>
            <Button variant="primary" onClick={handleBackToSelection}>
              Back to Selection
            </Button>
          </GlassPanel>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen"
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Wrapper component that provides the TravelContext
const TravelWizard: React.FC<TravelWizardProps> = (props) => {
  return (
    <TravelProvider>
      <TravelWizardContent {...props} />
    </TravelProvider>
  );
};

export default TravelWizard;
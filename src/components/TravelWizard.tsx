// src/components/TravelWizard.tsx
// Purpose: Main wizard controller that manages the multi-step flow
// Used in: App page as the central component that ties everything together

'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Import components using index files
import { ChatComponent, ChatMessage } from './chat';
import { DesktopDragAndDrop, TravelOption as DesktopTravelOption } from './selection/desktop';
import { SwipeDeck, TravelOption as MobileTravelOption } from './selection/mobile';
import { Timeline, ItineraryDay, TimelineEventData } from './timeline';
import { EventType } from './timeline/TimelineEvent';
import { GlassPanel, Button } from './ui';

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

export const TravelWizard: React.FC<TravelWizardProps> = ({
  initialStep = 'chat',
}) => {
  const [currentStep, setCurrentStep] = useState<'chat' | 'selection' | 'timeline'>(initialStep);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preferenceProgress, setPreferenceProgress] = useState(0);
  const [travelOptions, setTravelOptions] = useState<TravelOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<TravelOption[]>([]);
  const [itinerary, setItinerary] = useState<{
    title: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    days: ItineraryDay[];
    totalPrice: number;
  } | null>(null);
  
  const isMobile = useIsMobile();
  
  // Simulated chat processing function
  const processChatMessage = async (message: string) => {
    setIsProcessing(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add AI response
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      content: "I've noted your preferences! I'll help you plan the perfect trip. I can suggest some travel options based on what you've told me.",
      role: 'assistant',
      timestamp: new Date(),
      actions: [
        {
          label: 'Show travel options',
          action: () => {
            // Generate sample travel options
            generateSampleTravelOptions();
            // Move to selection step
            setCurrentStep('selection');
          }
        }
      ]
    };
    
    setChatMessages(prev => [...prev, aiMessage]);
    
    // Update preference progress
    setPreferenceProgress(prev => Math.min(prev + 25, 100));
    
    setIsProcessing(false);
  };
  
  // Generate sample travel options for demonstration
  const generateSampleTravelOptions = () => {
    const options: TravelOption[] = [
      {
        id: 'flight-1',
        title: 'Flight to Tokyo',
        description: 'Direct flight from Los Angeles to Tokyo Narita Airport.',
        imageSrc: 'https://unsplash.com/photos/cherry-blossoms-frame-a-capitol-dome-W9G9II8hoqY',
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
        imageSrc: 'https://unsplash.com/1600x900/?tokyo,hotel',
        price: 380,
        rating: 4.8,
        type: 'hotel',
        duration: '5 nights',
        location: 'Shinjuku, Tokyo',
      },
      {
        id: 'activity-1',
        title: 'Mount Fuji Day Trip',
        description: 'Guided tour to Mount Fuji including Lake Kawaguchi and the 5th Station.',
        imageSrc: 'https://unsplash.com/1600x900/?mountfuji',
        price: 120,
        rating: 4.6,
        type: 'activity',
        time: '8:00 AM',
        duration: '10 hours',
        location: 'Mount Fuji, Japan',
      },
      {
        id: 'activity-2',
        title: 'Tsukiji Fish Market Tour',
        description: 'Early morning guided tour of the outer Tsukiji Fish Market with sushi breakfast.',
        imageSrc: 'https://unsplash.com/1600x900/?fishmarket,japan',
        price: 85,
        rating: 4.7,
        type: 'activity',
        time: '6:00 AM',
        duration: '3 hours',
        location: 'Tsukiji, Tokyo',
      },
      {
        id: 'transport-1',
        title: 'Tokyo Subway Pass',
        description: '72-hour unlimited Tokyo metro and subway pass for easy city navigation.',
        imageSrc: 'https://unsplash.com/1600x900/?subway,tokyo',
        price: 30,
        rating: 4.4,
        type: 'transport',
        duration: '3 days',
        location: 'Tokyo, Japan',
      },
      {
        id: 'activity-3',
        title: 'Teamlab Borderless Museum',
        description: 'Interactive digital art museum with stunning immersive exhibits.',
        imageSrc: 'https://unsplash.com/1600x900/?digitalart,museum',
        price: 35,
        rating: 4.9,
        type: 'activity',
        time: '2:00 PM',
        duration: '3 hours',
        location: 'Odaiba, Tokyo',
      },
      {
        id: 'activity-4',
        title: 'Traditional Tea Ceremony',
        description: 'Authentic Japanese tea ceremony experience in a historic tea house.',
        imageSrc: 'https://unsplash.com/1600x900/?teaceremony,japan',
        price: 50,
        rating: 4.6,
        type: 'activity',
        time: '11:00 AM',
        duration: '1.5 hours',
        location: 'Asakusa, Tokyo',
      },
    ];
    
    setTravelOptions(options);
  };
  
  // Handle completion of selection step
  const handleSelectionComplete = (acceptedOptions: TravelOption[]) => {
    setSelectedOptions(acceptedOptions);
    
    // Generate sample itinerary
    generateSampleItinerary(acceptedOptions);
    
    // Move to timeline step
    setCurrentStep('timeline');
  };
  
  // Generate sample itinerary for demonstration
  const generateSampleItinerary = (selectedOptions: TravelOption[]) => {
    // Define date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 10); // Trip starts in 10 days
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5); // 5-day trip
    
    // Calculate total price
    const totalPrice = selectedOptions.reduce((sum, option) => sum + (option.price || 0), 0);
    
    // Create itinerary days
    const days: ItineraryDay[] = [];
    
    // Day 1: Arrival
    const day1 = new Date(startDate);
    const day1Events: TimelineEventData[] = [];
    
    // Add flight if selected
    const selectedFlight = selectedOptions.find(opt => opt.type === 'flight');
    if (selectedFlight) {
      day1Events.push({
        ...selectedFlight,
        id: `${selectedFlight.id}-day1`,
        time: '10:30 AM',
      });
    }
    
    // Add hotel if selected
    const selectedHotel = selectedOptions.find(opt => opt.type === 'hotel');
    if (selectedHotel) {
      day1Events.push({
        ...selectedHotel,
        id: `${selectedHotel.id}-day1`,
      });
    }
    
    days.push({ date: day1, events: day1Events });
    
    // Day 2-4: Activities
    const selectedActivities = selectedOptions.filter(opt => opt.type === 'activity');
    let activityIndex = 0;
    
    for (let i = 1; i < 5; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      if (currentDate <= endDate) {
        const dayEvents: TimelineEventData[] = [];
        
        // Add 1-2 activities per day
        for (let j = 0; j < 2; j++) {
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
    }
    
    // Day 5: Departure
    const day5 = new Date(endDate);
    const day5Events: TimelineEventData[] = [];
    
    // Add hotel checkout
    if (selectedHotel) {
      day5Events.push({
        ...selectedHotel,
        id: `${selectedHotel.id}-checkout`,
        title: `${selectedHotel.title} (Checkout)`,
      });
    }
    
    // Add return flight
    if (selectedFlight) {
      day5Events.push({
        ...selectedFlight,
        id: `${selectedFlight.id}-return`,
        title: 'Return Flight',
        time: '4:30 PM',
        description: 'Direct flight from Tokyo Narita Airport to Los Angeles.',
        location: 'NRT to LAX',
      });
    }
    
    days.push({ date: day5, events: day5Events });
    
    // Set itinerary
    setItinerary({
      title: 'Tokyo Explorer',
      destination: 'Tokyo, Japan',
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
  
  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'chat':
        return (
          <ChatComponent
            initialMessages={chatMessages}
            onSendMessage={processChatMessage}
            isProcessing={isProcessing}
            onComplete={() => {
              generateSampleTravelOptions();
              setCurrentStep('selection');
            }}
            preferenceProgress={preferenceProgress}
          />
        );
        
      case 'selection':
        return isMobile ? (
          <SwipeDeck
            travelOptions={travelOptions}
            onComplete={handleSelectionComplete}
            onBack={handleBackToChat}
          />
        ) : (
          <DesktopDragAndDrop
            travelOptions={travelOptions}
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

export default TravelWizard;
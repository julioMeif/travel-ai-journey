// src/components/chat/ChatComponent.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChatBubble, ChatAction, ChatRole } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { GlassPanel } from '../ui';
import { useTravelContext } from '../../context/TravelContext';

// Message type definition
export interface ChatMessage {
  id: string;
  content: string;
  role: ChatRole;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatComponentProps {
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<void>;
  isProcessing?: boolean;
  onComplete: () => void;
  preferenceProgress?: number; // 0-100
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  initialMessages = [],
  onSendMessage: propsSendMessage,
  isProcessing: propsIsProcessing = false,
  onComplete,
  preferenceProgress: propsPreferenceProgress,
}) => {
  // Use the travel context for state management
  const {
    chatMessages: contextMessages,
    addUserMessage: contextSendMessage,
    isProcessingMessage: contextIsProcessing,
    travelPreferences,
    isSearching
  } = useTravelContext();
  
  // Add state to track calculated progress
  const [progressValue, setProgressValue] = useState(0);
  
  // Determine which messages to use (context or props)
  const messages = contextMessages.length > 0 ? contextMessages : initialMessages;
  
  // Determine processing state (context or props)
  const isProcessing = contextIsProcessing || propsIsProcessing || isSearching;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Debug travel preferences on mount and when they change
  useEffect(() => {
    console.log("ChatComponent: TravelPreferences changed:", JSON.stringify(travelPreferences, null, 2));
  }, [travelPreferences]);
  
  // Add system welcome message if no initial messages
  useEffect(() => {
    if (initialMessages.length === 0 && contextMessages.length === 0) {
      // If we're using the context, it should already have an initial message
      // This is mainly for backward compatibility
      if (propsSendMessage) {
        propsSendMessage("Hi there!");
      }
    }
  }, [initialMessages, contextMessages, propsSendMessage]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Calculate and update progress when travel preferences change
  useEffect(() => {
    // Force a progress calculation on mount and whenever preferences change
    const newProgress = calculateProgressValue();
    console.log("ChatComponent: Updating progress from", progressValue, "to", newProgress);
    
    // Only update state if progress has actually changed to avoid re-renders
    if (newProgress !== progressValue) {
      setProgressValue(newProgress);
    }
  }, [travelPreferences]);
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Use context function if available, otherwise use props
    if (contextSendMessage) {
      await contextSendMessage(content);
    } else if (propsSendMessage) {
      await propsSendMessage(content);
    }
  };

  // Calculate progress based on preferences gathered
  const calculateProgressValue = () => {
    // MODIFIED: Only use props progress if it's a non-zero number
    // This allows the component to calculate its own progress even when a default 0 is passed
    if (typeof propsPreferenceProgress === 'number' && propsPreferenceProgress > 0) {
      console.log("ChatComponent: Using props progress:", propsPreferenceProgress);
      return propsPreferenceProgress;
    }
    
    // Debug the travel preferences object to understand its structure
    console.log("ChatComponent: Raw travelPreferences object:", travelPreferences);
    
    // Guard against undefined or null preferences
    if (!travelPreferences) {
      console.log("ChatComponent: travelPreferences is null or undefined");
      return 0;
    }
    
    let progress = 0;
    
    // Check each preference individually with proper type checking
    if (travelPreferences.origin && typeof travelPreferences.origin === 'string' && travelPreferences.origin.trim() !== '') {
      progress += 25;
      console.log("ChatComponent: Added 25% for origin:", travelPreferences.origin);
    } else {
      console.log("ChatComponent: No origin found. Raw value:", travelPreferences.origin);
    }
    
    if (travelPreferences.destination && typeof travelPreferences.destination === 'string' && travelPreferences.destination.trim() !== '') {
      progress += 25;
      console.log("ChatComponent: Added 25% for destination:", travelPreferences.destination);
    } else {
      console.log("ChatComponent: No destination found. Raw value:", travelPreferences.destination);
    }
    
    if (travelPreferences.dates && 
        travelPreferences.dates.departure && 
        typeof travelPreferences.dates.departure === 'string' && 
        travelPreferences.dates.departure.trim() !== '') {
      progress += 25;
      console.log("ChatComponent: Added 25% for departure date:", travelPreferences.dates.departure);
    } else {
      console.log("ChatComponent: No departure date found. Raw value:", 
        travelPreferences.dates ? travelPreferences.dates.departure : 'dates object missing');
    }
    
    if (travelPreferences.activities && 
        travelPreferences.activities.interests && 
        Array.isArray(travelPreferences.activities.interests) && 
        travelPreferences.activities.interests.length > 0) {
      progress += 25;
      console.log("ChatComponent: Added 25% for activities:", travelPreferences.activities.interests);
    } else {
      console.log("ChatComponent: No activities found. Raw value:", 
        travelPreferences.activities ? travelPreferences.activities.interests : 'activities object missing');
    }
    
    console.log("ChatComponent: Final progress calculation:", progress);
    return progress;
  };

  // Check if we have enough information to show options
  const canShowOptions = () => {
    // Make sure isProcessing doesn't prevent showing the button
    if (isProcessing) {
      console.log("Not showing options button because processing is in progress");
      return false;
    }
    
    const hasEnoughInfo = !!(
      travelPreferences?.origin && 
      travelPreferences?.destination && 
      travelPreferences?.dates?.departure
    );
    
    console.log("ChatComponent: Can show options:", hasEnoughInfo, {
      origin: travelPreferences?.origin,
      destination: travelPreferences?.destination,
      departureDates: travelPreferences?.dates?.departure,
      isProcessing: isProcessing
    });
    
    return hasEnoughInfo;
  };
  

  return (
    <div className="flex flex-col h-screen p-4 md:p-6">
      {/* Header with progress */}
      <GlassPanel className="p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">Travel Preferences</h2>
          {onComplete && (
            <button 
              onClick={onComplete}
              className="bg-transparent backdrop-blur-sm text-white border-white/10 hover:bg-white/10
                       px-3 py-1.5 text-sm rounded-lg transition-all duration-300
                       font-medium border"
            >
              Skip
            </button>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full">
          {/* Label */}
          <div className="flex justify-between mb-1 text-sm">
            <span className="text-white/80">Preference Completion</span>
            <span className="text-white/80">{progressValue}%</span>
          </div>
          
          {/* Progress track */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </GlassPanel>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            content={message.content}
            role={message.role}
            timestamp={message.timestamp}
            actions={message.actions}
            expandable={message.content.length > 150}
          />
        ))}
        
        {/* Show typing indicator while processing */}
        {isProcessing && (
          <ChatBubble
            content=""
            role="assistant"
            isTyping={true}
          />
        )}
        
        {/* Show "View Options" button if we have enough info */}
        {canShowOptions() && (
          <div className="p-3 bg-indigo-500/20 rounded-lg text-center">
            <p className="text-white mb-2">
              Ready to see travel options from {travelPreferences.origin} to {travelPreferences.destination}?
            </p>
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                      text-white font-medium rounded-lg hover:shadow-lg
                      hover:scale-[1.02] transition-all duration-300"
            >
              Show Options
            </button>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};
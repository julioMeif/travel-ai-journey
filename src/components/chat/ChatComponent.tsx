// src/components/chat/ChatComponent.tsx
// Purpose: Main chat interface that combines bubbles and input
// Used in: Main wizard flow as the first step for gathering preferences

import React, { useState, useRef, useEffect } from 'react';
import { ChatBubble, ChatAction, ChatRole } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { GlassPanel } from '../ui';

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
  onSendMessage: (message: string) => Promise<void>;
  isProcessing?: boolean;
  onComplete?: () => void;
  preferenceProgress?: number; // 0-100
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  initialMessages = [],
  onSendMessage,
  isProcessing = false,
  onComplete,
  preferenceProgress = 0,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add system welcome message if no initial messages
  useEffect(() => {
    if (initialMessages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "👋 Hi there! I'm your Travel AI assistant. Tell me about your travel preferences, and I'll help you plan the perfect trip! Where would you like to go? What kind of experience are you looking for?",
          role: 'assistant',
          timestamp: new Date(),
          actions: onComplete ? [
            {
              label: 'Skip to selection',
              action: onComplete
            }
          ] : undefined
        }
      ]);
    }
  }, [initialMessages, onComplete]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Process the message
      await onSendMessage(content);
    } catch (error) {
      // Handle error
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, I encountered an error processing your request. Please try again.",
          role: 'assistant',
          timestamp: new Date(),
        }
      ]);
    }
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
            <span className="text-white/80">{preferenceProgress.toFixed(0)}%</span>
          </div>
          
          {/* Progress track */}
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${preferenceProgress}%` }}
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
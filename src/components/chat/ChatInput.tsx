// src/components/chat/ChatInput.tsx
// Purpose: Input field for user messages in the chat interface
// Used in: ChatComponent for sending messages to the AI

import React, { useState, useRef, useEffect } from 'react';
import { GlassPanel } from '../ui';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isProcessing = false,
  placeholder = "Type your travel preferences...",
  showSuggestions = true,
  suggestions = [
    "I want to visit Japan in spring",
    "Planning a beach vacation with kids",
    "Weekend trip to a mountain retreat",
    "Visit Bordeaux From Miami June 5th to July 8th",
  ]
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };
  
  return (
    <div className="mt-4">
      {/* Quick suggestions */}
      {showSuggestions && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isProcessing}
              className="bg-transparent backdrop-blur-sm text-white border-white/10 hover:bg-white/10 
                        px-3 py-1.5 text-sm rounded-lg transition-all duration-300 
                        font-medium border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <GlassPanel className="p-1 flex items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-white/90 placeholder-white/50 resize-none py-2 px-3 max-h-32 overflow-auto"
            rows={1}
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !message.trim()}
            className={`
              bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent
              px-4 py-2 rounded-lg transition-all duration-300 font-medium border
              mb-1 mr-1 ${isProcessing || !message.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02]'}
              flex items-center justify-center gap-2
            `}
          >
            {isProcessing ? (
              <svg 
                className="animate-spin h-5 w-5 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </GlassPanel>
      </form>
    </div>
  );
};
// src/components/chat/ChatBubble.tsx
// Purpose: Individual message bubble in the chat interface
// Used in: ChatComponent for rendering user and assistant messages

import React, { useState } from 'react';
import { GlassPanel } from '../ui';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatAction = {
  label: string;
  action: () => void;
};

interface ChatBubbleProps {
  content: string;
  role: ChatRole;
  timestamp?: Date;
  isTyping?: boolean;
  actions?: ChatAction[];
  expandable?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  role,
  timestamp = new Date(),
  isTyping = false,
  actions = [],
  expandable = false,
}) => {
  const [expanded, setExpanded] = useState(!expandable);
  
  // Determine alignment and colors based on role
  const isUser = role === 'user';
  const alignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser ? 'primary' : 'default';
  
  // Format the timestamp
  const formattedTime = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
  
  // Handle typing animation
  const renderContent = () => {
    if (isTyping) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      );
    }
    
    // If expandable and not expanded, show truncated content
    if (expandable && !expanded) {
      return (
        <>
          <p className="text-white/90 whitespace-pre-wrap">
            {content.substring(0, 150)}
            {content.length > 150 && '...'}
          </p>
          <button 
            onClick={() => setExpanded(true)}
            className="text-indigo-300 text-sm mt-1 hover:underline focus:outline-none"
          >
            Read more
          </button>
        </>
      );
    }
    
    // Otherwise show full content
    return (
      <p className="text-white/90 whitespace-pre-wrap">
        {content}
        {expandable && expanded && (
          <button 
            onClick={() => setExpanded(false)}
            className="block text-indigo-300 text-sm mt-1 hover:underline focus:outline-none"
          >
            Show less
          </button>
        )}
      </p>
    );
  };
  
  return (
    <div className={`flex ${alignment} mb-4 max-w-full`}>
      <div className={`max-w-[80%] md:max-w-[70%]`}>
        <GlassPanel 
          color={bubbleColor}
          intensity="medium"
          className={`p-3 inline-block max-w-full`}
        >
          {/* Message content */}
          <div className="mb-1">
            {renderContent()}
          </div>
          
          {/* Message timestamp */}
          <div className="text-right">
            <span className="text-xs text-white/50">{formattedTime}</span>
          </div>
        </GlassPanel>
        
        {/* Actions (buttons, links, etc.) */}
        {actions.length > 0 && !isTyping && (
          <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mt-2 gap-2 flex-wrap`}>
            {actions.map((action, index) => (
              <button 
                key={index}
                onClick={action.action}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-medium border
                  ${isUser 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent' 
                    : 'bg-gradient-to-r from-white/20 to-white/5 text-white border-white/20'
                  }
                  hover:shadow-lg hover:scale-[1.02]
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
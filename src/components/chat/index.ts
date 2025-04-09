// src/components/chat/index.ts
// Purpose: Export all chat-related components from a single file
// Used for cleaner imports in other components

import { ChatBubble, ChatAction, ChatRole } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ChatComponent, ChatMessage } from './ChatComponent';

export {
  ChatBubble,
  ChatInput,
  ChatComponent,
  // Types
  type ChatAction,
  type ChatRole,
  type ChatMessage
};
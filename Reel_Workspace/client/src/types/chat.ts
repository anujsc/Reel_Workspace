/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * Chat state interface
 */
export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
}

/**
 * Suggestion chip interface
 */
export interface SuggestionChip {
  id: string;
  text: string;
}

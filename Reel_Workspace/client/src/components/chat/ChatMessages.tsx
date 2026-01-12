import { ChatMessage as ChatMessageType } from "../../types/chat";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "./EmptyState";
import { useChatScroll } from "../../hooks/useChatScroll";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  onSuggestionClick: (text: string) => void;
}

/**
 * Scrollable message list container
 * Shows empty state, messages, or typing indicator
 */
export function ChatMessages({
  messages,
  isStreaming,
  onSuggestionClick,
}: ChatMessagesProps) {
  const scrollRef = useChatScroll(messages.length);

  if (messages.length === 0) {
    return <EmptyState onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isStreaming && <TypingIndicator />}
    </div>
  );
}

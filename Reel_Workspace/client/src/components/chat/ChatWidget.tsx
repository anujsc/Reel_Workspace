import { ChatFAB } from "./ChatFAB";
import { ChatPanel } from "./ChatPanel";
import { ChatBottomSheet } from "./ChatBottomSheet";
import { useEphemeralChat } from "../../hooks/useEphemeralChat";
import { useIsMobile } from "../../hooks/useMediaQuery";

interface ChatWidgetProps {
  reelId: string;
}

/**
 * Main chat widget component
 * Renders FAB and appropriate chat interface (panel or bottom sheet)
 */
export function ChatWidget({ reelId }: ChatWidgetProps) {
  const { state, openChat, closeChat, sendMessage, clearChat } =
    useEphemeralChat(reelId);
  const isMobile = useIsMobile();

  return (
    <>
      {/* Floating Action Button */}
      <ChatFAB onClick={openChat} isOpen={state.isOpen} />

      {/* Chat Interface */}
      {state.isOpen &&
        (isMobile ? (
          <ChatBottomSheet
            state={state}
            onClose={closeChat}
            onSend={sendMessage}
            onClear={clearChat}
          />
        ) : (
          <ChatPanel
            state={state}
            onClose={closeChat}
            onSend={sendMessage}
            onClear={clearChat}
          />
        ))}
    </>
  );
}

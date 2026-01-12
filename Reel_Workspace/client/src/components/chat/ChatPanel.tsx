import { useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatState } from "../../types/chat";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  state: ChatState;
  onClose: () => void;
  onSend: (message: string) => void;
  onClear: () => void;
}

/**
 * Desktop slide-in chat panel
 * Fixed right edge, full viewport height
 */
export function ChatPanel({ state, onClose, onSend, onClear }: ChatPanelProps) {
  // Focus trap and keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-screen w-[420px] max-w-[90vw]",
          "bg-background border-l border-border shadow-2xl",
          "z-[9999] flex flex-col",
          "animate-slide-in-right"
        )}
        role="dialog"
        aria-label="AI Assistant Chat"
      >
        <ChatHeader
          onClose={onClose}
          onClear={onClear}
          hasMessages={state.messages.length > 0}
        />
        <ChatMessages
          messages={state.messages}
          isStreaming={state.isStreaming}
          onSuggestionClick={onSend}
        />
        <ChatInput onSend={onSend} disabled={state.isStreaming} />

        {/* Error Display */}
        {state.error && (
          <div className="px-5 py-3 bg-destructive/10 border-t border-destructive/20">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}
      </div>
    </>
  );
}

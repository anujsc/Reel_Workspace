import { useEffect, useState, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatState } from "../../types/chat";
import { cn } from "@/lib/utils";

interface ChatBottomSheetProps {
  state: ChatState;
  onClose: () => void;
  onSend: (message: string) => void;
  onClear: () => void;
}

/**
 * Mobile bottom sheet chat interface
 * Slides up from bottom with drag-to-close functionality
 */
export function ChatBottomSheet({
  state,
  onClose,
  onSend,
  onClear,
}: ChatBottomSheetProps) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle drag to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 100) {
      onClose();
    }
    setCurrentY(0);
    setIsDragging(false);
  };

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0",
          "h-[85vh] max-h-[85vh]",
          "bg-background rounded-t-3xl shadow-2xl",
          "z-[9999] flex flex-col",
          "animate-slide-up",
          "pb-safe-bottom"
        )}
        style={{
          transform: isDragging ? `translateY(${currentY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        role="dialog"
        aria-label="AI Assistant Chat"
      >
        {/* Drag Handle */}
        <div
          className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

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
          <div className="px-4 py-3 bg-destructive/10 border-t border-destructive/20">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}
      </div>
    </>
  );
}

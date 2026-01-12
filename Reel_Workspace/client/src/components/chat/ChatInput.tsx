import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

/**
 * Chat input area with auto-expanding textarea and send button
 * Includes status bar showing ephemeral nature
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        100
      )}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background flex-shrink-0">
      {/* Status Bar */}
      <div className="px-5 py-2 flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Chats aren't saved • Session only
        </span>
      </div>

      {/* Input Container */}
      <div className="px-5 pb-4">
        <div className="flex items-end gap-2 p-1 rounded-xl bg-secondary border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this reel..."
            disabled={disabled}
            rows={1}
            className="flex-1 px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[44px] max-h-[100px]"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200",
              input.trim() && !disabled
                ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
            aria-label="Send message"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

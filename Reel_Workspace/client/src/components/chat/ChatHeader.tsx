import { X, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClose: () => void;
  onClear: () => void;
  hasMessages: boolean;
}

/**
 * Chat header with title, subtitle, and action buttons
 * Matches ReelMind header styling with glassmorphism
 */
export function ChatHeader({ onClose, onClear, hasMessages }: ChatHeaderProps) {
  return (
    <div className="h-16 px-5 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl flex-shrink-0">
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            AI Assistant
          </h3>
          <p className="text-xs text-muted-foreground">
            Ask me about this reel
          </p>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1">
        {hasMessages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 hover:bg-muted/80"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-muted/80"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

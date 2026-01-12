import { Sparkles } from "lucide-react";
import { SuggestionChip } from "../../types/chat";

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions: SuggestionChip[] = [
  { id: "1", text: "Summarize this for me" },
  { id: "2", text: "Explain the key takeaways" },
  { id: "3", text: "Quiz me on this content" },
  { id: "4", text: "Give me practical examples" },
];

/**
 * Empty state with suggestion chips
 * Displayed when no messages exist
 */
export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 animate-fade-in">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
        Ask me anything about this reel
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
        I have full context of the transcript, summary, and key points
      </p>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-muted hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Animated typing indicator for AI responses
 * Three dots with staggered pulse animation
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm">🤖</span>
      </div>
      <div className="flex gap-1">
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"
          style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"
          style={{ animationDelay: "200ms", animationDuration: "1.4s" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-pulse"
          style={{ animationDelay: "400ms", animationDuration: "1.4s" }}
        />
      </div>
    </div>
  );
}
